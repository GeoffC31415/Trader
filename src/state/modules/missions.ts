/**
 * Missions Module
 * 
 * Handles mission arcs, contracts, objectives, and mission-related NPC spawning.
 * This is a large module that coordinates mission state with other game systems.
 */

import { distance } from '../../shared/math/vec3';
import {
  CONTRACT_PROFIT_MARGINS,
  CONTRACT_SELL_MULTIPLIERS,
  CONTRACT_EXPIRATION_TIMES,
  CONTRACTS_PER_STATION,
  CONTRACT_SUGGESTION_LIMIT,
  CONTRACT_MIN_UNITS,
  CONTRACT_MAX_UNITS,
  CONTRACT_MIN_BONUS,
  MISSION_REP_REQUIREMENTS,
} from '../../domain/constants/contract_constants';
import { getConsumptionForStation } from '../../systems/economy/consumption';
import { shipCaps } from '../../domain/constants/ship_constants';
import { NPC_BASE_HP } from '../../domain/constants/weapon_constants';
import { applyReputationWithPropagation } from '../../systems/reputation/faction_system';
import { getContractMultiplierBonus, getEscortCount } from '../helpers/reputation_helpers';
import { getSuggestedRoutes } from './economy';
import { processContractCompletion, processPartialDelivery } from '../helpers/contract_helpers';
import { applyMissionRewards, advanceMissionArc, canAcceptMission, getMissionTimeRemaining } from '../helpers/mission_helpers';
import { spawnMissionNPCs } from '../../systems/combat/ai_combat';
import { generateMissionsForStation, updateArcStatuses } from '../../systems/missions/mission_generator';
import { updateMissionObjectives, checkMissionCompletion, checkMissionFailure, type MissionEvent } from '../../systems/missions/mission_validator';
import { getActiveEscortMissions, updateEscortState, generatePirateWave, addSpawnedPirateIds, cleanupEscortState, createEscortNpc, createEscortState, checkWaveComplete, markWaveCompleted, ESCORT_HP } from '../../systems/missions/escort_system';
import { processStealthChecks, applyDetectionConsequences, clearMissionStealthStates } from '../../systems/missions/stealth_system';
import { applyChoicePermanentEffects } from '../../systems/missions/choice_system';
import { planNpcPath } from '../npc';
import type {
  Station,
  Ship,
  NpcTrader,
  Contract,
  Objective,
  GameState,
  RouteSuggestion,
} from '../../domain/types/world_types';
import type { Mission, MissionArc } from '../../domain/types/mission_types';

/**
 * Result of mission system update in tick
 */
export interface MissionTickResult {
  missions: Mission[];
  missionArcs: MissionArc[];
  npcTraders: NpcTrader[];
  stealthStates: Map<string, any>;
  escortStates: Map<string, any>;
  ship?: Ship;
  stations?: Station[];
  missionCelebrationData?: any;
}

/**
 * Update missions for one frame (from tick)
 * Handles stealth, escort missions, and mission completion
 * 
 * @param state - Current game state
 * @param dt - Delta time
 * @param missionNpcDestroyedEvents - NPCs destroyed this frame
 * @returns Updated mission state
 */
export function updateMissionsInTick(
  state: {
    ship: Ship;
    stations: Station[];
    npcTraders: NpcTrader[];
    missions: Mission[];
    missionArcs: MissionArc[];
    stealthStates: Map<string, any>;
    escortStates: Map<string, any>;
  },
  dt: number,
  missionNpcDestroyedEvents: Array<{ npcId: string; missionId?: string }>
): MissionTickResult {
  let updatedMissions = [...state.missions];
  let updatedArcs = [...state.missionArcs];
  let updatedNpcTraders = [...state.npcTraders];
  let updatedStealthStates = state.stealthStates;
  let updatedEscortStates = state.escortStates;
  let ship = { ...state.ship };
  let stations = [...state.stations];

  const activeMissions = updatedMissions.filter(m => m.status === 'active');

  // Process destroyed mission NPCs
  for (const destroyEvent of missionNpcDestroyedEvents) {
    const missionEvent: MissionEvent = {
      type: 'npc_destroyed',
      npcId: destroyEvent.npcId,
    };

    // Update relevant mission objectives
    for (const mission of activeMissions) {
      if (mission.id === destroyEvent.missionId || mission.type === 'combat') {
        const updatedMission = updateMissionObjectives(mission, missionEvent);
        updatedMissions = updatedMissions.map(m =>
          m.id === mission.id ? updatedMission : m
        );

        // Check if mission is now complete
        if (
          checkMissionCompletion(updatedMission) &&
          updatedMission.status === 'active'
        ) {
          updatedMissions = updatedMissions.map(m =>
            m.id === mission.id ? { ...m, status: 'completed' as const } : m
          );

          // Apply rewards
          const rewardUpdates = applyMissionRewards(
            { ...state, stations, ship } as GameState,
            updatedMission
          );
          if (rewardUpdates.ship) {
            ship = rewardUpdates.ship;
          }
          if (rewardUpdates.stations) {
            stations = rewardUpdates.stations;
          }

          // Advance mission arc
          const arc = updatedArcs.find(a => a.id === mission.arcId);
          if (arc) {
            const updatedArc = advanceMissionArc(arc, mission.id);
            updatedArcs = updatedArcs.map(a =>
              a.id === mission.arcId ? updatedArc : a
            );
          }

          // Clean up mission states
          updatedStealthStates = clearMissionStealthStates(
            updatedStealthStates,
            mission.id
          );
          updatedEscortStates = cleanupEscortState(updatedEscortStates, mission.id);

          console.log(`✅ Mission completed: ${updatedMission.title}!`);
        }
      }
    }
  }

  // Stealth detection system
  const stealthResult = processStealthChecks(
    ship,
    stations,
    activeMissions,
    updatedStealthStates,
    dt
  );
  updatedStealthStates = stealthResult.updatedStealthStates;

  // Process detections
  for (const detectedStationId of stealthResult.detectedStations) {
    const mission = activeMissions.find(m =>
      m.objectives.some(
        obj => obj.type === 'avoid_detection' && obj.target === detectedStationId
      )
    );

    if (mission) {
      console.log(`🚨 DETECTED near station! Mission failed: ${mission.title}`);

      // Apply consequences
      const consequences = applyDetectionConsequences(
        ship,
        stations,
        detectedStationId,
        mission
      );
      ship = consequences.updatedShip;
      stations = consequences.updatedStations;

      // Log confiscations
      for (const confiscated of consequences.confiscatedItems) {
        console.log(
          `📦 ${confiscated.quantity} ${confiscated.commodityId} confiscated!`
        );
      }

      // Fail the objective
      const missionEvent: MissionEvent = {
        type: 'detection_triggered',
        stationId: detectedStationId,
      };

      const updatedMission = updateMissionObjectives(mission, missionEvent);

      // Mark mission as failed
      updatedMissions = updatedMissions.map(m =>
        m.id === mission.id ? { ...updatedMission, status: 'failed' as const } : m
      );

      // Clean up stealth state for this mission
      updatedStealthStates = clearMissionStealthStates(
        updatedStealthStates,
        mission.id
      );
    }
  }

  // Escort mission system
  const escortMissions = getActiveEscortMissions(activeMissions);
  const currentTime = Date.now() / 1000;

  for (const mission of escortMissions) {
    // Find all escort states for this mission (supports multiple escorts per mission)
    const missionEscortStates: Array<{ key: string; state: any }> = [];
    for (const [key, state] of updatedEscortStates.entries()) {
      if (key === mission.id || key.startsWith(`${mission.id}:`)) {
        missionEscortStates.push({ key, state });
      }
    }

    if (missionEscortStates.length === 0) continue;

    // Process each escort separately
    for (const { key: escortStateKey, state: escortState } of missionEscortStates) {
      const escortNpc = updatedNpcTraders.find(n => n.id === escortState.escortNpcId);
      const destinationStation = stations.find(
        s => s.id === escortState.destinationStationId
      );

      if (!escortNpc || !destinationStation) continue;

      const updateResult = updateEscortState(
        escortState,
        escortNpc,
        destinationStation,
        currentTime,
        dt
      );

      updatedEscortStates.set(escortStateKey, updateResult.updatedState);

      // Handle escort destroyed
      if (updateResult.escortDestroyed) {
        console.log(`💥 Escort ${escortState.escortNpcId} destroyed!`);
        // Check if all escorts are destroyed (mission fails if any escort dies)
        const allEscortsDestroyed = missionEscortStates.every(({ state: s }) => {
          const npc = updatedNpcTraders.find(n => n.id === s.escortNpcId);
          return !npc || npc.hp <= 0;
        });
        
        if (allEscortsDestroyed) {
          console.log(`💥 All escorts destroyed! Mission failed: ${mission.title}`);
          updatedMissions = updatedMissions.map(m =>
            m.id === mission.id ? { ...m, status: 'failed' as const } : m
          );
          updatedEscortStates = cleanupEscortState(updatedEscortStates, mission.id);
          break; // Exit escort loop, continue to next mission
        }
        continue; // This escort is destroyed, but others may still be alive
      }

      // Check for wave completion (all pirates in current wave destroyed)
      const currentEscortState = updatedEscortStates.get(escortStateKey) || updateResult.updatedState;
      if (checkWaveComplete(currentEscortState, updatedNpcTraders)) {
        const completedWaveNumber = currentEscortState.wavesCompleted + 1;
        console.log(`✅ Wave ${completedWaveNumber} survived!`);
        
        // Update escort state to mark wave as completed
        const markedState = markWaveCompleted(currentEscortState);
        updatedEscortStates.set(escortStateKey, markedState);
        
        // Trigger wave_survived event to update defend objectives
        const waveEvent: MissionEvent = {
          type: 'wave_survived',
          waveNumber: completedWaveNumber,
        };
        
        const missionAfterWave = updatedMissions.find(m => m.id === mission.id) || mission;
        const updatedMissionWave = updateMissionObjectives(missionAfterWave, waveEvent);
        updatedMissions = updatedMissions.map(m =>
          m.id === mission.id ? updatedMissionWave : m
        );
        
        // Check if mission is now complete after wave survival
        if (checkMissionCompletion(updatedMissionWave)) {
          updatedMissions = updatedMissions.map(m =>
            m.id === mission.id ? { ...m, status: 'completed' as const } : m
          );
          
          const rewardUpdates = applyMissionRewards(
            { ...state, stations, ship } as GameState,
            updatedMissionWave
          );
          if (rewardUpdates.ship) ship = rewardUpdates.ship;
          if (rewardUpdates.stations) stations = rewardUpdates.stations;
          
          const arc = updatedArcs.find(a => a.id === mission.arcId);
          if (arc) {
            const updatedArc = advanceMissionArc(arc, mission.id);
            updatedArcs = updatedArcs.map(a =>
              a.id === mission.arcId ? updatedArc : a
            );
          }
          
          updatedEscortStates = cleanupEscortState(updatedEscortStates, mission.id);
          console.log(`✅ All waves survived! Mission completed: ${updatedMissionWave.title}!`);
          break;
        }
      }

      // Handle escort reached destination
      if (updateResult.hasReached) {
        console.log(`✅ Escort ${escortState.escortNpcId} reached destination safely!`);
        const missionEvent: MissionEvent = {
          type: 'escort_reached_destination',
          npcId: escortState.escortNpcId,
        };

        const missionAfterEscort = updatedMissions.find(m => m.id === mission.id) || mission;
        const updatedMission = updateMissionObjectives(missionAfterEscort, missionEvent);
        updatedMissions = updatedMissions.map(m =>
          m.id === mission.id ? updatedMission : m
        );

        // Check if mission is complete (all escorts reached destinations)
        if (checkMissionCompletion(updatedMission)) {
          updatedMissions = updatedMissions.map(m =>
            m.id === mission.id ? { ...m, status: 'completed' as const } : m
          );

          // Apply rewards
          const rewardUpdates = applyMissionRewards(
            { ...state, stations, ship } as GameState,
            updatedMission
          );
          if (rewardUpdates.ship) ship = rewardUpdates.ship;
          if (rewardUpdates.stations) stations = rewardUpdates.stations;

          // Advance arc
          const arc = updatedArcs.find(a => a.id === mission.arcId);
          if (arc) {
            const updatedArc = advanceMissionArc(arc, mission.id);
            updatedArcs = updatedArcs.map(a =>
              a.id === mission.arcId ? updatedArc : a
            );
          }

          updatedEscortStates = cleanupEscortState(updatedEscortStates, mission.id);
          console.log(`✅ Mission completed: ${updatedMission.title}!`);
          break; // Exit escort loop, mission is complete
        }
      }

      // Spawn pirate waves (only spawn waves for the first escort to avoid spam)
      if (updateResult.shouldSpawnNewWave && escortNpc && escortStateKey === missionEscortStates[0].key) {
        console.log(
          `🏴‍☠️ Pirate wave ${updateResult.updatedState.waveCount} spawning!`
        );
        const pirates = generatePirateWave(
          mission.id,
          updateResult.updatedState.waveCount,
          escortNpc.position as [number, number, number],
          currentTime
        );

        updatedNpcTraders.push(...pirates);

        // Track spawned pirate IDs for this escort state
        const pirateIds = pirates.map(p => p.id);
        updatedEscortStates.set(
          escortStateKey,
          addSpawnedPirateIds(updateResult.updatedState, pirateIds)
        );
      }
    }
  }

  return {
    missions: updatedMissions,
    missionArcs: updatedArcs,
    npcTraders: updatedNpcTraders,
    stealthStates: updatedStealthStates,
    escortStates: updatedEscortStates,
    ship,
    stations,
  };
}

/**
 * Generate contracts for all stations
 * 
 * @param stations - All stations
 * @param existingContracts - Current contracts
 * @param getSuggestedRoutesFn - Function to get route suggestions
 * @param limit - Max contracts per station
 * @returns Updated contracts array
 */
export function generateContracts(
  stations: Station[],
  existingContracts: Contract[],
  ship: Ship,
  limit: number = CONTRACTS_PER_STATION
): Contract[] {
  const nextContracts = [...existingContracts].filter(c => c.status !== 'offered');

  for (const st of stations) {
    // Derive candidate routes where goods are needed AT this station (destination)
    const suggestions = getSuggestedRoutes(stations, ship, {
      limit: CONTRACT_SUGGESTION_LIMIT,
      prioritizePerDistance: true,
    }).filter(r => r.toId === st.id);

    // Check for station shortages (demand-based contracts)
    const consumption = getConsumptionForStation(st.type);
    const shortageRoutes: typeof suggestions = [];
    const normalRoutes: typeof suggestions = [];
    
    for (const route of suggestions) {
      const item = st.inventory[route.inputId];
      if (!item) {
        normalRoutes.push(route);
        continue;
      }
      
      // Check if this commodity is consumed by this station
      const consConfig = consumption.find(c => c.commodityId === route.inputId);
      if (consConfig) {
        // Define shortage as stock < 30% of critical threshold (or < 30% of typical stock)
        const currentStock = item.stock || 0;
        const targetStock = consConfig.criticalThreshold * 3; // Rough estimate of normal stock
        const shortageThreshold = targetStock * 0.3;
        
        if (currentStock < shortageThreshold) {
          shortageRoutes.push(route);
        } else {
          normalRoutes.push(route);
        }
      } else {
        normalRoutes.push(route);
      }
    }
    
    // Prioritize shortage routes first, then normal routes
    const picks = [...shortageRoutes, ...normalRoutes].slice(0, 10);
    const perStation: Contract[] = [];

    for (let i = 0; i < Math.min(CONTRACTS_PER_STATION, picks.length); i++) {
      const r = picks[i];
      const isShortage = i < shortageRoutes.length;
      const units = Math.max(
        CONTRACT_MIN_UNITS,
        Math.min(CONTRACT_MAX_UNITS, r.maxUnits)
      );
      
      // Shortage contracts get "emergency" or "rush" tags, better payouts, shorter expiration
      const tag: Contract['tag'] = isShortage
        ? (i === 0 ? 'emergency' : 'rush')
        : i === 0
        ? 'standard'
        : i === 1
        ? 'bulk'
        : i === 2
        ? 'rush'
        : i === 3
        ? 'fabrication'
        : 'emergency';
      const requiredRep = MISSION_REP_REQUIREMENTS[i];

      // Apply reputation bonus to contract multipliers
      const stationRep = st.reputation || 0;
      const baseMultiplier = CONTRACT_SELL_MULTIPLIERS[tag];
      const repBonus = getContractMultiplierBonus(stationRep);
      const sellMultiplier = baseMultiplier + repBonus;

      const fromId = r.fromId;
      const toId = r.toId;
      const offeredById = st.id;

      const title =
        tag === 'emergency'
          ? `Emergency: ${r.inputId.replace(/_/g, ' ')} to ${r.toName}`
          : tag === 'rush'
          ? `Rush Delivery: ${r.inputId.replace(/_/g, ' ')} to ${r.toName}`
          : tag === 'bulk'
          ? `Bulk Order: ${units} ${r.inputId.replace(/_/g, ' ')}`
          : tag === 'fabrication'
          ? `Process & Deliver: ${r.inputId.replace(/_/g, ' ')} via ${r.viaName}`
          : `Standard Run: ${r.inputId.replace(/_/g, ' ')} to ${r.toName}`;

      // Ensure profitability
      const buyCost = r.unitBuy * units;
      const sellRevenue = r.unitSell * units * sellMultiplier;
      const baseProfit = sellRevenue - buyCost;

      // Add bonus to ensure minimum profit margin on total investment
      // Shortage contracts get +20-50% bonus payout
      const minProfitMargin = CONTRACT_PROFIT_MARGINS[tag];
      const shortageBonus = isShortage ? 1.35 : 1.0; // 35% bonus for shortages
      const desiredProfit = buyCost * minProfitMargin * shortageBonus;
      const rewardBonus = Math.max(
        CONTRACT_MIN_BONUS,
        Math.round(Math.max(0, desiredProfit - baseProfit) + buyCost * 0.15)
      );

      perStation.push({
        id: `m:${st.id}:${i}:${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        fromId,
        toId,
        commodityId: r.inputId,
        units,
        unitBuy: r.unitBuy,
        unitSell: r.unitSell,
        rewardBonus,
        status: 'offered',
        expiresAt:
          Date.now() +
          (isShortage
            ? CONTRACT_EXPIRATION_TIMES.rush // Shortage contracts have shorter expiration
            : tag === 'rush'
            ? CONTRACT_EXPIRATION_TIMES.rush
            : CONTRACT_EXPIRATION_TIMES.default),
        offeredById,
        requiredRep,
        title,
        tag,
        sellMultiplier: sellMultiplier,
      });
    }

    nextContracts.push(...perStation);
    if (nextContracts.length >= limit * stations.length) break;
  }

  return nextContracts;
}

/**
 * Accept a contract and spawn escorts if reputation is high enough
 * 
 * @param contractId - Contract to accept
 * @param contracts - All contracts
 * @param objectives - Current objectives
 * @param npcTraders - Current NPCs
 * @param stations - All stations
 * @param ship - Player ship
 * @returns Updated state
 */
export function acceptContractAction(
  contractId: string,
  contracts: Contract[],
  objectives: Objective[],
  npcTraders: NpcTrader[],
  stations: Station[],
  ship: Ship
): {
  contracts: Contract[];
  objectives: Objective[];
  npcTraders: NpcTrader[];
  activeObjectiveId?: string;
  trackedStationId?: string;
} {
  const updatedContracts = contracts.map(c =>
    c.id === contractId ? { ...c, status: 'accepted' as const } : c
  );
  const chosen = updatedContracts.find(c => c.id === contractId);
  const updatedObjectives: Objective[] = [...objectives];
  let updatedNpcTraders = [...npcTraders];

  if (chosen) {
    const stationName =
      stations.find(s => s.id === chosen.toId)?.name || chosen.toId;
    const obj: Objective = {
      id: `obj:${contractId}`,
      label: `Deliver ${chosen.units} ${chosen.commodityId.replace(/_/g, ' ')} to ${stationName}`,
      targetStationId: chosen.toId,
      kind: 'contract',
      status: 'active',
    };
    updatedObjectives.push(obj);

    // Spawn escort ships based on reputation at offering station
    if (chosen.offeredById) {
      const offeringStation = stations.find(s => s.id === chosen.offeredById);
      if (offeringStation) {
        const stationRep = offeringStation.reputation || 0;
        const escortCount = getEscortCount(stationRep);
        const playerCargo = shipCaps[ship.kind]?.cargo ?? 100;
        const escortCargoPerShip = Math.floor(playerCargo * 0.5);

        for (let i = 0; i < escortCount; i++) {
          const escortId = `escort:${contractId}:${i}`;
          const escort: NpcTrader = {
            id: escortId,
            shipKind: 'clipper',
            commodityId: chosen.commodityId,
            fromId: chosen.offeredById,
            toId: chosen.toId,
            speed: 25, // Slower speed to match player velocity
            position: [
              ship.position[0] + (i + 1) * 30,
              ship.position[1],
              ship.position[2] + (i + 1) * 30,
            ],
            velocity: [0, 0, 0],
            isEscort: true,
            escortingContract: contractId,
            escortCargoCapacity: escortCargoPerShip,
            escortCargoUsed: 0,
            hp: 80,
            maxHp: 80,
            isHostile: false,
          };
          updatedNpcTraders.push(escort);
        }
      }
    }

    return {
      contracts: updatedContracts,
      objectives: updatedObjectives,
      npcTraders: updatedNpcTraders,
      activeObjectiveId: `obj:${contractId}`,
      trackedStationId: chosen.toId,
    };
  }

  return {
    contracts: updatedContracts,
    objectives: updatedObjectives,
    npcTraders: updatedNpcTraders,
  };
}

/**
 * Abandon contract with reputation penalty
 * 
 * @param contractId - Contract to abandon
 * @param contracts - All contracts
 * @param stations - All stations
 * @param objectives - Current objectives
 * @param npcTraders - Current NPCs
 * @param activeObjectiveId - Current active objective
 * @returns Updated state
 */
export function abandonContractAction(
  contractId: string,
  contracts: Contract[],
  stations: Station[],
  objectives: Objective[],
  npcTraders: NpcTrader[],
  activeObjectiveId?: string
): {
  contracts: Contract[];
  stations: Station[];
  objectives: Objective[];
  npcTraders: NpcTrader[];
  activeObjectiveId?: string;
} {
  const updatedContracts = contracts.map(c =>
    c.id === contractId ? { ...c, status: 'failed' as const } : c
  );

  // Minor rep penalty at destination (with faction propagation)
  const chosen = contracts.find(c => c.id === contractId);
  let updatedStations = stations;
  if (chosen?.toId) {
    updatedStations = applyReputationWithPropagation(stations, chosen.toId, -2);
  }

  const updatedObjectives = objectives.map(o =>
    o.id === `obj:${contractId}` ? { ...o, status: 'failed' as const } : o
  );
  const newActiveObjectiveId =
    activeObjectiveId === `obj:${contractId}` ? undefined : activeObjectiveId;

  // Mark escorts as no longer tied to this contract, but keep them if they have cargo
  const updatedNpcTraders = npcTraders
    .map(n => {
      if (n.isEscort && n.escortingContract === contractId) {
        // Remove contract association but keep ship if it has cargo
        if ((n.escortCargoUsed || 0) > 0) {
          return { ...n, escortingContract: undefined };
        }
        return null; // Will be filtered out
      }
      return n;
    })
    .filter((n): n is typeof n & object => n !== null);

  return {
    contracts: updatedContracts,
    stations: updatedStations,
    objectives: updatedObjectives,
    npcTraders: updatedNpcTraders,
    activeObjectiveId: newActiveObjectiveId,
  };
}

/**
 * Accept a mission and spawn associated NPCs
 */
export function acceptMissionAction(
  missionId: string,
  missions: Mission[],
  missionArcs: MissionArc[],
  npcTraders: NpcTrader[],
  escortStates: Map<string, any>,
  stations: Station[],
  ship: Ship
): {
  missions: Mission[];
  missionArcs: MissionArc[];
  npcTraders: NpcTrader[];
  escortStates: Map<string, any>;
} {
  // Find the mission to accept
  const mission = missions.find(m => m.id === missionId);
  if (!mission || mission.status !== 'offered') {
    return { missions, missionArcs, npcTraders, escortStates };
  }

  // Check if player can accept
  const activeMissions = missions.filter(m => m.status === 'active');
  const playerReputation: Record<string, number> = {};
  stations.forEach(s => {
    playerReputation[s.id] = s.reputation || 0;
  });

  const acceptCheck = canAcceptMission(mission, playerReputation, activeMissions.length);
  if (!acceptCheck.canAccept) {
    console.log('Cannot accept mission:', acceptCheck.reason);
    return { missions, missionArcs, npcTraders, escortStates };
  }

  // Activate the mission
  const updatedMissions = missions.map(m =>
    m.id === missionId
      ? { ...m, status: 'active' as const, acceptedAt: Date.now() / 1000 }
      : m
  );

  // Update arc status to in_progress
  const updatedArcs = missionArcs.map(arc =>
    arc.id === mission.arcId && arc.status === 'available'
      ? { ...arc, status: 'in_progress' as const }
      : arc
  );

  // Spawn mission NPCs for combat missions
  let updatedNpcTraders = [...npcTraders];
  let updatedEscortStates = escortStates;

  if (mission.type === 'combat') {
    const destroyObjectives = mission.objectives.filter(obj => obj.type === 'destroy');
    for (const objective of destroyObjectives) {
      if (objective.quantity && objective.quantity > 0) {
        // Spawn NPCs near a random station
        const randomStation = stations[Math.floor(Math.random() * stations.length)];
        const missionNpcs = spawnMissionNPCs(
          mission.id,
          {
            count: objective.quantity,
            hp: 80,
            isHostile: true,
            spawnNear: randomStation.id,
            cargo: { electronics: 5, alloys: 3 },
          },
          stations
        );
        updatedNpcTraders = [...updatedNpcTraders, ...missionNpcs];
        console.log(`🎯 Spawned ${objective.quantity} mission targets for ${mission.title}`);
      }
    }
  }

  // Spawn escort NPCs for escort/defend missions
  if (mission.type === 'escort') {
    const escortObjectives = mission.objectives.filter(obj => obj.type === 'escort');
    const startStation = stations.find(s => mission.availableAt.includes(s.id));
    
    if (startStation && escortObjectives.length > 0) {
      const currentTime = Date.now() / 1000;
      
      // Spawn an escort NPC for each escort objective
      for (const escortObjective of escortObjectives) {
        if (!escortObjective.targetStation) continue;
        
        const destinationStationId = escortObjective.targetStation;
        const destinationStation = stations.find(s => s.id === destinationStationId);
        
        if (!destinationStation) continue;
        
        // Create escort NPC with unique ID based on objective target
        // The validator matches escort NPCs by objective.target, so use that for the ID
        const escortId = escortObjective.target || `escort:${mission.id}:${escortObjective.id}`;
        
        const escortNpc: NpcTrader = {
          id: escortId,
          position: [...startStation.position] as [number, number, number],
          velocity: [0, 0, 0],
          path: [],
          pathProgress: 0,
          fromId: startStation.id,
          toId: destinationStation.id,
          cargoCapacity: 10,
          lastTradeTime: currentTime,
          
          // Escort combat stats
          hp: ESCORT_HP,
          maxHp: ESCORT_HP,
          isHostile: false,
          isMissionTarget: false,
          missionId: mission.id,
          
          // Mark as mission escort
          isMissionEscort: true,
        };
        
        // Plan path for escort
        const path = planNpcPath(startStation, destinationStation, startStation.position);
        escortNpc.path = path;
        escortNpc.pathProgress = 0;
        
        updatedNpcTraders = [...updatedNpcTraders, escortNpc];
        
        // Create escort state tracking for each escort
        // Use a composite key: missionId:escortId to support multiple escorts per mission
        const escortStateKey = `${mission.id}:${escortId}`;
        const escortState = createEscortState(
          mission.id,
          escortId,
          destinationStationId,
          currentTime
        );
        
        updatedEscortStates = new Map(updatedEscortStates);
        updatedEscortStates.set(escortStateKey, escortState);
        
        console.log(`🛡️ Spawned escort NPC ${escortId} for ${mission.title} -> ${destinationStation.name}`);
      }
    }
  }

  return {
    missions: updatedMissions,
    missionArcs: updatedArcs,
    npcTraders: updatedNpcTraders,
    escortStates: updatedEscortStates,
  };
}

/**
 * Abandon mission with reputation penalty
 */
export function abandonMissionAction(
  missionId: string,
  missions: Mission[],
  stations: Station[],
  stealthStates: Map<string, any>,
  escortStates: Map<string, any>,
  npcTraders: NpcTrader[]
): {
  missions: Mission[];
  stations: Station[];
  stealthStates: Map<string, any>;
  escortStates: Map<string, any>;
  npcTraders: NpcTrader[];
} {
  const mission = missions.find(m => m.id === missionId);
  if (!mission || mission.status !== 'active') {
    return { missions, stations, stealthStates, escortStates, npcTraders };
  }

  // Mark mission as cancelled
  const updatedMissions = missions.map(m =>
    m.id === missionId ? { ...m, status: 'cancelled' as const } : m
  );

  // Apply small reputation penalty at offering station
  const offeringStationId = mission.availableAt[0];
  const updatedStations = applyReputationWithPropagation(
    stations,
    offeringStationId,
    -5
  );

  // Clean up mission states
  let updatedStealthStates = clearMissionStealthStates(stealthStates, missionId);
  let updatedEscortStates = cleanupEscortState(escortStates, missionId);

  // Remove mission NPCs (escorts, spawned pirates, etc.)
  let updatedNpcTraders = npcTraders.filter(npc => {
    // Keep NPCs that aren't tied to this mission
    if (npc.missionId !== missionId) return true;
    // Remove mission escorts and mission targets
    if (npc.isMissionEscort || npc.isMissionTarget) return false;
    return true;
  });

  return {
    missions: updatedMissions,
    stations: updatedStations,
    stealthStates: updatedStealthStates,
    escortStates: updatedEscortStates,
    npcTraders: updatedNpcTraders,
  };
}

