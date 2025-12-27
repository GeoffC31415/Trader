/**
 * Sell Action - Action Composition Pattern
 * 
 * Handles selling commodities, including:
 * - Contract progress/completion
 * - Mission progress/completion
 * - Celebration triggers
 * - Trust/relationship updates
 * - Tutorial progression
 */

import type { GameState, Ship, Station } from '../../../domain/types/world_types';
import { sellCommodity } from '../../modules/economy';
import { processContractCompletion, processPartialDelivery } from '../../helpers/contract_helpers';
import { updateMissionObjectives, checkMissionCompletion, type MissionEvent } from '../../../systems/missions/mission_validator';
import { applyMissionRewards, advanceMissionArc } from '../../helpers/mission_helpers';
import { generateMissionsForStation, updateArcStatuses } from '../../../systems/missions/mission_generator';
import { getTrustTiersSnapshot, computeTrustDeltas, setTrust, canGrantToken, maybeProbabilityGrant, grantAssist, defaultAssistForStation } from '../../relationships';

/**
 * Create sell action with dependency injection
 * 
 * @param getState - Function to get current state
 * @param setState - Function to update state
 * @returns Sell action function
 */
export function createSellAction(
  getState: () => GameState,
  setState: (updates: Partial<GameState>) => void
) {
  return (commodityId: string, quantity: number) => {
    const state = getState();
    
    // Find active contract for this commodity AT THIS DESTINATION (for contract completion)
    const activeContract = (state.contracts || []).find(
      c =>
        c.status === 'accepted' &&
        c.toId === state.ship.dockedStationId &&
        c.commodityId === commodityId
    );
    
    // Find ALL contracts with this commodity to get escorts (allows selling escort cargo
    // even when not at the contract destination - e.g., for missions or early selling)
    const commodityContracts = (state.contracts || []).filter(
      c => c.status === 'accepted' && c.commodityId === commodityId
    );
    const commodityContractIds = new Set(commodityContracts.map(c => c.id));
    
    // Get escort ships carrying this commodity (from any matching contract)
    const escorts = state.npcTraders.filter(
      n => n.isEscort && n.escortingContract && commodityContractIds.has(n.escortingContract)
    );

    // Delegate to economy module for core selling logic
    const result = sellCommodity(
      state.ship,
      state.stations,
      state.npcTraders,
      state.profitByCommodity,
      state.avgCostByCommodity,
      commodityId,
      quantity,
      escorts
    );

    if (!result) {
      setState({}); // No changes
      return;
    }

    const station = state.stations.find(s => s.id === state.ship.dockedStationId);
    const tradeLog = [...state.tradeLog, result.trade];

    // Handle contract progress/completion
    let contracts = state.contracts || [];
    let objectives = state.objectives || [];
    let activeObjectiveId = state.activeObjectiveId;
    let totalCredits = state.ship.credits + result.revenue;
    let showCelebration = false;
    let celebrationBuyCost = 0;
    let celebrationSellRev = 0;
    let celebrationBonusAmount = 0;
    let npcTraders = result.npcTraders;

    if (activeContract) {
      const previousDelivered = activeContract.deliveredUnits || 0;
      const remainingNeeded = activeContract.units - previousDelivered;
      const nowDelivering = Math.min(quantity, remainingNeeded);
      const newTotalDelivered = previousDelivered + nowDelivering;

      // Apply contract pricing to delivered units
      let unitPay = result.unitSellPrice;
      if (activeContract.sellMultiplier && activeContract.sellMultiplier > 1) {
        unitPay = Math.max(
          1,
          Math.round(result.unitSellPrice * activeContract.sellMultiplier)
        );
      }
      // Add extra revenue for contract units
      const extraRevenue = (unitPay - result.unitSellPrice) * nowDelivering;
      totalCredits += extraRevenue;

      // Check if contract is now complete
      if (newTotalDelivered >= activeContract.units) {
        // Contract completed! Process completion
        const completion = processContractCompletion({
          activeContract,
          nowDelivering,
          unitSellPrice: result.unitSellPrice,
          tradeLog,
          contracts,
          objectives,
          activeObjectiveId,
        });

        contracts = completion.contracts;
        objectives = completion.objectives;
        activeObjectiveId = completion.activeObjectiveId;
        celebrationBuyCost = completion.celebrationBuyCost;
        celebrationSellRev = completion.celebrationSellRevenue;
        celebrationBonusAmount = completion.celebrationBonusAmount;
        totalCredits += completion.bonusCredits;
        showCelebration = true;
      } else {
        // Partial delivery - update progress
        contracts = processPartialDelivery({
          activeContract,
          newTotalDelivered,
          contracts,
        });
      }
    }

    // Handle mission progress/completion
    let updatedMissions = [...state.missions];
    let updatedArcs = [...state.missionArcs];
    let updatedStationsFromMissions = result.stations;
    const activeMissions = updatedMissions.filter(m => m.status === 'active');

    for (const mission of activeMissions) {
      const missionEvent: MissionEvent = {
        type: 'commodity_sold',
        commodityId,
        quantity,
        stationId: station!.id,
      };

      const updatedMission = updateMissionObjectives(mission, missionEvent);
      updatedMissions = updatedMissions.map(m =>
        m.id === mission.id ? updatedMission : m
      );

      // Check if mission is now complete
      if (
        checkMissionCompletion(updatedMission) &&
        updatedMission.status === 'active'
      ) {
        // Mark mission as completed
        updatedMissions = updatedMissions.map(m =>
          m.id === mission.id ? { ...m, status: 'completed' as const } : m
        );

        // Apply rewards
        const rewardUpdates = applyMissionRewards(
          {
            ...state,
            stations: updatedStationsFromMissions,
            ship: { ...state.ship, credits: totalCredits, cargo: result.ship.cargo },
          } as GameState,
          updatedMission
        );
        if (rewardUpdates.ship) {
          totalCredits = rewardUpdates.ship.credits;
        }
        if (rewardUpdates.stations) {
          updatedStationsFromMissions = rewardUpdates.stations;
        }

        // Advance mission arc
        const arc = updatedArcs.find(a => a.id === mission.arcId);
        if (arc) {
          const updatedArc = advanceMissionArc(arc, mission.id);
          updatedArcs = updatedArcs.map(a =>
            a.id === mission.arcId ? updatedArc : a
          );
        }

        // Trigger mission celebration with narrative and trust snapshot
        const missionCelebrationData: GameState['missionCelebrationData'] = {
          missionId: updatedMission.id,
          credits: updatedMission.rewards.credits,
          reputationChanges: updatedMission.rewards.reputationChanges,
          narrativeContext: {
            trustTiers: getTrustTiersSnapshot(state.relationships),
          },
        };

        // Apply trust deltas and balanced token grant
        const now2 = Date.now();
        let relationships2 = { ...(state.relationships || {}) };
        let allyAssistTokens2 = [...(state.allyAssistTokens || [])];
        const deltas2 = computeTrustDeltas(updatedMission.id, missionCelebrationData.narrativeContext || {});
        for (const { by, delta } of deltas2) {
          const before = relationships2[by];
          const beforeTier = before?.tier ?? 0;
          const after = setTrust(before, delta, now2);
          relationships2[by] = after;
          const crossedToSupporter = beforeTier < 1 && after.tier >= 1;
          const eligible = canGrantToken(now2, after, allyAssistTokens2, by, 3, 60_000);
          const prob = crossedToSupporter ? 1.0 : after.tier >= 1 ? 0.15 : 0;
          if (eligible && prob > 0 && maybeProbabilityGrant(prob)) {
            const preset = defaultAssistForStation(by);
            const token = grantAssist(by, preset.type, preset.description, now2);
            allyAssistTokens2.push(token);
            relationships2[by] = { ...after, lastAssistGrantedAt: now2 } as any;
            missionCelebrationData.allyAssistUnlocked = { by, type: preset.type, description: preset.description };
          }
        }

        console.log(`Mission completed: ${updatedMission.title}!`);

        // Regenerate missions for current station if docked
        let finalMissions = updatedMissions;
        if (state.ship.dockedStationId) {
          const playerReputation: Record<string, number> = {};
          for (const st of updatedStationsFromMissions) {
            if (st.reputation !== undefined) {
              playerReputation[st.id] = st.reputation;
            }
          }
          const playerUpgrades: string[] = [];
          if (state.ship.hasNavigationArray) playerUpgrades.push('nav');
          if (state.ship.hasUnionMembership) playerUpgrades.push('union');
          if (state.ship.hasMarketIntel) playerUpgrades.push('intel');

          const activeMissionsAfterCompletion = finalMissions.filter(
            m => m.status === 'active'
          );
          const newMissions = generateMissionsForStation(
            state.ship.dockedStationId,
            playerReputation,
            playerUpgrades,
            updatedArcs,
            activeMissionsAfterCompletion,
            updatedArcs.filter(a => a.status === 'completed').map(a => a.id)
          );

          // Merge with existing missions (don't duplicate)
          const existingMissionIds = new Set(finalMissions.map(m => m.id));
          const missionsToAdd = newMissions.filter(
            m => !existingMissionIds.has(m.id)
          );
          finalMissions = [...finalMissions, ...missionsToAdd];
        }

        // Return early with celebration
        setState({
          ship: { ...result.ship, credits: totalCredits },
          stations: updatedStationsFromMissions,
          contracts,
          tradeLog,
          profitByCommodity: result.profitByCommodity,
          avgCostByCommodity: result.avgCostByCommodity,
          npcTraders,
          missions: finalMissions,
          missionArcs: updatedArcs,
          missionCelebrationData,
          relationships: relationships2,
          allyAssistTokens: allyAssistTokens2,
          celebrationVisible: showCelebration ? Date.now() : state.celebrationVisible,
          celebrationBuyCost: showCelebration
            ? celebrationBuyCost
            : state.celebrationBuyCost,
          celebrationSellRevenue: showCelebration
            ? celebrationSellRev
            : state.celebrationSellRevenue,
          celebrationBonusReward: showCelebration
            ? celebrationBonusAmount
            : state.celebrationBonusReward,
          objectives,
          activeObjectiveId,
        });
        return;
      }
    }

    // Handle tutorial progression
    let tutorialStep = state.tutorialStep;
    let tutorialActive = state.tutorialActive;
    if (
      state.tutorialActive &&
      state.tutorialStep === 'deliver_fuel' &&
      commodityId === 'refined_fuel' &&
      showCelebration
    ) {
      tutorialStep = 'done';
      tutorialActive = false;
    }

    // Compose final update
    setState({
      ship: { ...result.ship, credits: totalCredits },
      stations: updatedStationsFromMissions,
      profitByCommodity: result.profitByCommodity,
      avgCostByCommodity: result.avgCostByCommodity,
      tradeLog,
      contracts,
      objectives,
      activeObjectiveId,
      npcTraders,
      missions: updatedMissions,
      missionArcs: updatedArcs,
      celebrationVisible: showCelebration ? Date.now() : state.celebrationVisible,
      celebrationBuyCost: showCelebration
        ? celebrationBuyCost
        : state.celebrationBuyCost,
      celebrationSellRevenue: showCelebration
        ? celebrationSellRev
        : state.celebrationSellRevenue,
      celebrationBonusReward: showCelebration
        ? celebrationBonusAmount
        : state.celebrationBonusReward,
      tutorialStep,
      tutorialActive,
    });
  };
}

