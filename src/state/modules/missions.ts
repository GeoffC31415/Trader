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
import { getActiveEscortMissions, updateEscortState, generatePirateWave, addSpawnedPirateIds, cleanupEscortState, createEscortNpc, createEscortState } from '../../systems/missions/escort_system';
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
    const escortState = updatedEscortStates.get(mission.id);
    if (!escortState) continue;

    const escortNpc = updatedNpcTraders.find(n => n.id === escortState.escortNpcId);
    const destinationStation = stations.find(
      s => s.id === escortState.destinationStationId
    );

    const updateResult = updateEscortState(
      escortState,
      escortNpc,
      destinationStation,
      currentTime,
      dt
    );

    updatedEscortStates.set(mission.id, updateResult.updatedState);

    // Handle escort destroyed
    if (updateResult.escortDestroyed) {
      console.log(`💥 Escort destroyed! Mission failed: ${mission.title}`);
      updatedMissions = updatedMissions.map(m =>
        m.id === mission.id ? { ...m, status: 'failed' as const } : m
      );
      updatedEscortStates = cleanupEscortState(updatedEscortStates, mission.id);
      continue;
    }

    // Handle escort reached destination
    if (updateResult.hasReached) {
      console.log(`✅ Escort reached destination safely!`);
      const missionEvent: MissionEvent = {
        type: 'escort_reached_destination',
        npcId: escortState.escortNpcId,
      };

      const updatedMission = updateMissionObjectives(mission, missionEvent);
      updatedMissions = updatedMissions.map(m =>
        m.id === mission.id ? updatedMission : m
      );

      // Check if mission is complete
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
      }
    }

    // Spawn pirate waves
    if (updateResult.shouldSpawnNewWave && escortNpc) {
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

      // Track spawned pirate IDs
      const pirateIds = pirates.map(p => p.id);
      updatedEscortStates.set(
        mission.id,
        addSpawnedPirateIds(updateResult.updatedState, pirateIds)
      );
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

    // Choose up to 5 missions per station with increasing rep gates
    const picks = suggestions.slice(0, 10);
    const perStation: Contract[] = [];

    for (let i = 0; i < Math.min(CONTRACTS_PER_STATION, picks.length); i++) {
      const r = picks[i];
      const units = Math.max(
        CONTRACT_MIN_UNITS,
        Math.min(CONTRACT_MAX_UNITS, r.maxUnits)
      );
      const tag: Contract['tag'] =
        i === 0
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
      const minProfitMargin = CONTRACT_PROFIT_MARGINS[tag];
      const desiredProfit = buyCost * minProfitMargin;
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
          (tag === 'rush'
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

  // Spawn escort NPC for escort/defend missions
  if (mission.type === 'escort') {
    const defendObjective = mission.objectives.find(obj => obj.type === 'defend');
    if (defendObjective && defendObjective.target) {
      const destinationStationId = defendObjective.target;
      const destinationStation = stations.find(s => s.id === destinationStationId);
      const startStation = stations.find(s => mission.availableAt.includes(s.id));

      if (destinationStation && startStation) {
        const currentTime = Date.now() / 1000;

        const escortNpc = createEscortNpc(
          mission.id,
          startStation,
          destinationStation,
          currentTime
        );

        // Plan path for escort
        const path = planNpcPath(startStation, destinationStation, startStation.position);
        escortNpc.path = path;
        escortNpc.pathProgress = 0;

        updatedNpcTraders = [...updatedNpcTraders, escortNpc];

        // Create escort state tracking
        const escortState = createEscortState(
          mission.id,
          escortNpc.id,
          destinationStationId,
          currentTime
        );

        updatedEscortStates = new Map(updatedEscortStates);
        updatedEscortStates.set(mission.id, escortState);

        console.log(`🛡️ Spawned escort NPC for ${mission.title}`);
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

