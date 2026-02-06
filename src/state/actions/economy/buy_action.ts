/**
 * Buy Action - Action Composition Pattern
 * 
 * Handles buying commodities, including:
 * - Contract tracking
 * - Ally assist token usage
 * - Tutorial progression
 */

import type { GameState } from '../../../domain/types/world_types';
import { buyCommodity } from '../../modules/economy';
import { updateMissionObjectives, checkMissionCompletion, type MissionEvent } from '../../../systems/missions/mission_validator';
import { applyMissionRewards, advanceMissionArc } from '../../helpers/mission_helpers';
import { generateMissionsForStation } from '../../../systems/missions/mission_generator';
import { getTrustTiersSnapshot, computeTrustDeltas, setTrust, canGrantToken, maybeProbabilityGrant, grantAssist, defaultAssistForStation } from '../../relationships';

/**
 * Create buy action with dependency injection
 * 
 * @param getState - Function to get current state
 * @param setState - Function to update state
 * @returns Buy action function
 */
export function createBuyAction(
  getState: () => GameState,
  setState: (updates: Partial<GameState>) => void
) {
  return (commodityId: string, quantity: number) => {
    const state = getState();
    
    // Find active contract for this commodity
    const activeContract = (state.contracts || []).find(
      c => c.status === 'accepted' && c.commodityId === commodityId
    );

    // Handle pending assist tokens (discount, waiver, refuel)
    let priceMultiplier: number | undefined = undefined;
    const pending = (state as any).pendingAssist as GameState['pendingAssist'] | undefined;
    const station = state.ship.dockedStationId;
    if (pending && station && pending.by === station) {
      // Scope: refuel only applies to refined_fuel at ceres-pp, discount applies at station, waiver is 1.0
      if (pending.type === 'refuel' && commodityId === 'refined_fuel' && station === 'ceres-pp') {
        priceMultiplier = pending.multiplier;
      } else if (pending.type === 'discount') {
        priceMultiplier = pending.multiplier;
      } else if (pending.type === 'waiver') {
        priceMultiplier = 1.0;
      }
    }

    // Delegate to economy module for core buying logic
    const result = buyCommodity(
      state.ship,
      state.stations,
      state.npcTraders,
      state.avgCostByCommodity,
      commodityId,
      quantity,
      activeContract,
      priceMultiplier
    );

    if (!result) {
      setState({}); // No changes
      return;
    }

    const tradeLog = [...state.tradeLog, result.trade];
    
    // Handle tutorial progression
    let tutorialStep = state.tutorialStep;
    if (
      state.tutorialActive &&
      state.tutorialStep === 'buy_fuel' &&
      commodityId === 'refined_fuel'
    ) {
      tutorialStep = 'deliver_fuel';
    }

    // -----------------------------------------------------------------------
    // Mission progress/completion (collection missions via commodity_acquired)
    // -----------------------------------------------------------------------
    const prevQty = state.ship.cargo[commodityId] || 0;
    const nextQty = result.ship.cargo[commodityId] || 0;
    const acquiredQty = Math.max(0, nextQty - prevQty);
    let updatedMissions = [...(state.missions || [])];
    let updatedArcs = [...(state.missionArcs || [])];
    let updatedStationsFromMissions = result.stations;

    // Only emit mission event if the player actually received cargo (escorts can take some)
    if (acquiredQty > 0 && updatedMissions.length > 0) {
      const activeMissions = updatedMissions.filter(m => m.status === 'active');
      const missionEvent: MissionEvent = {
        type: 'commodity_acquired',
        commodityId,
        quantity: acquiredQty,
      };

      for (const mission of activeMissions) {
        const updatedMission = updateMissionObjectives(mission, missionEvent);
        updatedMissions = updatedMissions.map(m => (m.id === mission.id ? updatedMission : m));

        if (checkMissionCompletion(updatedMission) && updatedMission.status === 'active') {
          // Mark mission as completed
          updatedMissions = updatedMissions.map(m =>
            m.id === mission.id ? { ...m, status: 'completed' as const } : m
          );

          // Apply rewards (use post-buy ship/stations as baseline)
          const rewardUpdates = applyMissionRewards(
            { ...state, stations: updatedStationsFromMissions, ship: result.ship } as GameState,
            updatedMission
          );
          let updatedShip = result.ship;
          if (rewardUpdates.ship) updatedShip = { ...updatedShip, ...rewardUpdates.ship } as any;
          if (rewardUpdates.stations) updatedStationsFromMissions = rewardUpdates.stations;

          // Advance mission arc
          const arc = updatedArcs.find(a => a.id === updatedMission.arcId);
          if (arc) {
            const updatedArc = advanceMissionArc(arc, updatedMission.id);
            updatedArcs = updatedArcs.map(a => (a.id === updatedMission.arcId ? updatedArc : a));
          }

          // Trigger mission celebration with trust snapshot
          const missionCelebrationData: GameState['missionCelebrationData'] = {
            missionId: updatedMission.id,
            credits: updatedMission.rewards.credits,
            reputationChanges: updatedMission.rewards.reputationChanges,
            narrativeContext: {
              trustTiers: getTrustTiersSnapshot(state.relationships),
            },
          };

          // Apply trust deltas + possible assist token
          const now = Date.now();
          let relationships2 = { ...(state.relationships || {}) };
          let allyAssistTokens2 = [...(state.allyAssistTokens || [])];
          const deltas2 = computeTrustDeltas(updatedMission.id, missionCelebrationData.narrativeContext || {});
          for (const { by, delta } of deltas2) {
            const before = relationships2[by];
            const beforeTier = before?.tier ?? 0;
            const after = setTrust(before, delta, now);
            relationships2[by] = after;
            const crossedToSupporter = beforeTier < 1 && after.tier >= 1;
            const eligible = canGrantToken(now, after, allyAssistTokens2, by, 3, 60_000);
            const prob = crossedToSupporter ? 1.0 : after.tier >= 1 ? 0.15 : 0;
            if (eligible && prob > 0 && maybeProbabilityGrant(prob)) {
              const preset = defaultAssistForStation(by);
              const token = grantAssist(by, preset.type, preset.description, now);
              allyAssistTokens2.push(token);
              relationships2[by] = { ...after, lastAssistGrantedAt: now } as any;
              missionCelebrationData.allyAssistUnlocked = { by, type: preset.type, description: preset.description };
            }
          }

          // Regenerate missions for current station if docked (new stage may unlock immediately)
          let finalMissions = updatedMissions;
          if (updatedShip.dockedStationId) {
            const playerReputation: Record<string, number> = {};
            for (const st of updatedStationsFromMissions) {
              if (st.reputation !== undefined) playerReputation[st.id] = st.reputation;
            }
            const playerUpgrades: string[] = [];
            if ((updatedShip as any).hasNavigationArray) playerUpgrades.push('nav');
            if ((updatedShip as any).hasUnionMembership) playerUpgrades.push('union');
            if ((updatedShip as any).hasMarketIntel) playerUpgrades.push('intel');

            const activeMissionsAfterCompletion = finalMissions.filter(m => m.status === 'active');
            const newMissions = generateMissionsForStation(
              updatedShip.dockedStationId,
              playerReputation,
              playerUpgrades,
              updatedArcs,
              activeMissionsAfterCompletion,
              updatedArcs.filter(a => a.status === 'completed').map(a => a.id)
            );
            const existingMissionIds = new Set(finalMissions.map(m => m.id));
            const missionsToAdd = newMissions.filter(m => !existingMissionIds.has(m.id));
            finalMissions = [...finalMissions, ...missionsToAdd];
          }

          setState({
            ship: updatedShip,
            stations: updatedStationsFromMissions,
            npcTraders: result.npcTraders,
            avgCostByCommodity: result.avgCostByCommodity,
            tradeLog,
            pendingAssist: undefined,
            tutorialStep,
            missions: finalMissions,
            missionArcs: updatedArcs,
            missionCelebrationData,
            relationships: relationships2,
            allyAssistTokens: allyAssistTokens2,
          });
          return;
        }
      }
    }

    // Compose final update
    setState({
      ship: result.ship,
      stations: result.stations,
      npcTraders: result.npcTraders,
      avgCostByCommodity: result.avgCostByCommodity,
      tradeLog,
      pendingAssist: undefined, // Clear pendingAssist after use
      tutorialStep,
      missions: updatedMissions.length > 0 ? updatedMissions : state.missions,
      missionArcs: updatedArcs.length > 0 ? updatedArcs : state.missionArcs,
    });
  };
}

