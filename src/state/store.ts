/**
 * Game Store - Refactored
 * 
 * Main Zustand store that coordinates all game systems through modules.
 * This file should remain focused on:
 * - Initial state setup
 * - Action definitions
 * - Orchestrating module calls
 * - Managing Zustand store updates
 */

import { create } from 'zustand';
import { SCALE, sp } from '../domain/constants/world_constants';
import { DOCKING_RANGE_WORLD, MINING_RANGE_WORLD } from '../domain/constants/game_constants';
import { shipCaps } from '../domain/constants/ship_constants';
import {
  WEAPON_BASE_STATS,
  WEAPON_COSTS,
  WEAPON_UPGRADE_COSTS,
  WEAPON_UPGRADE_BONUSES,
  PLAYER_MAX_HP,
  PLAYER_MAX_ENERGY,
} from '../domain/constants/weapon_constants';
import { createShip } from '../domain/registries/ship_registry';
import type { ShipKind } from '../domain/constants/ship_kinds';
import { planets, stations as initialStations, belts } from './world';
import { spawnNpcTraders } from './npc';
import { processContractCompletion, processPartialDelivery } from './helpers/contract_helpers';
import {
  applyReputationWithPropagation,
  applyMultipleReputationChanges,
  isStationHostile,
  canDockAtStation,
} from '../systems/reputation/faction_system';
import { distance } from '../shared/math/vec3';
import { NPC_BASE_HP } from '../domain/constants/weapon_constants';
import { initializeMissionArcs, generateMissionsForStation, updateArcStatuses } from '../systems/missions/mission_generator';
import { getMissionTemplatesByStage } from '../domain/constants/mission_constants';
import { checkMissionCompletion, checkMissionFailure, updateMissionObjectives, type MissionEvent } from '../systems/missions/mission_validator';
import { applyMissionRewards, advanceMissionArc, canAcceptMission, applyPermanentEffects } from './helpers/mission_helpers';
import { applyChoicePermanentEffects } from '../systems/missions/choice_system';
import { applyMissionToProfile } from './modules/politics_module';
import { gatedCommodities, getPriceBiasForStation } from '../systems/economy/pricing';
import { findRecipeForStation } from '../systems/economy/recipes';
import type { GameState, Ship, Station, Objective, Contract, NpcTrader, AllyAssistToken, TrustRecord, Notification } from '../domain/types/world_types';
import type { ExplosionEffect } from '../domain/types/world_types';
import { createNotification } from './modules/notifications';
import type { ShipWeapon } from '../domain/types/combat_types';
import type { Mission } from '../domain/types/mission_types';
import { CARGO_DROP_PERCENTAGE } from '../domain/constants/weapon_constants';

// Module imports
import { updatePhysics, applyThrust, setEngineTarget as setEngineTargetModule } from './modules/physics';
import { updateNpcTraders, applyStockDeltas } from './modules/npc';
import {
  updateCombat,
  spawnHostileDefenders,
  firePlayerWeapon,
  upgradePlayerWeapon,
  purchasePlayerWeapon,
} from './modules/combat';
import {
  getSuggestedRoutes,
  jitterPrices,
  sellCommodity,
  processCommodity,
  upgradeShip,
} from './modules/economy';
import { updateStationConsumption } from './modules/economy_consumption';
import { updateStationProduction } from './modules/economy_production';
import { recordPriceHistory, mergePriceHistory } from './modules/price_history';
import { updateCargoFreshness } from './modules/cargo_freshness';
import {
  generateMarketEvent,
  shouldSpawnEvent,
  getActiveEvents,
} from '../systems/economy/market_events';
import {
  updateMissionsInTick,
  generateContracts as generateContractsModule,
  acceptContractAction,
  abandonContractAction,
  acceptMissionAction,
  abandonMissionAction,
} from './modules/missions';
import { setTrust, hasUnconsumedToken, grantAssist, computeTrustDeltas, defaultAssistForStation, getTrustTiersSnapshot, tierForScore, canGrantToken, maybeProbabilityGrant } from './relationships';
import { createSellAction } from './actions/economy/sell_action';
import { createBuyAction } from './actions/economy/buy_action';

export const useGameStore = create<GameState>((set, get) => ({
  planets,
  stations: initialStations,
  belts,
  npcTraders: spawnNpcTraders(initialStations, 24).map(npc => ({
    ...npc,
    hp: NPC_BASE_HP,
    maxHp: NPC_BASE_HP,
    isHostile: false,
  })),
  ship: {
    position: sp([50, 0, 8]),
    velocity: [0, 0, 0],
    credits: 0,
    cargo: {},
    maxCargo: 100,
    lastDockedStationId: undefined,
    isDead: false,
    canMine: false,
    enginePower: 0,
    engineTarget: 0,
    hasNavigationArray: false,
    hasUnionMembership: false,
    hasMarketIntel: false,
    kind: 'freighter',
    stats: { acc: 12, drag: 1.0, vmax: 12 },
    weapon: { ...WEAPON_BASE_STATS.laser, damageLevel: 0, fireRateLevel: 0, rangeLevel: 0 },
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP,
    energy: PLAYER_MAX_ENERGY,
    maxEnergy: PLAYER_MAX_ENERGY,
  },
  hasChosenStarter: false,
  isTestMode: false,
  tutorialActive: false,
  tutorialStep: 'dock_city',
  tradeLog: [],
  profitByCommodity: {},
  avgCostByCommodity: {},
  dockIntroVisibleId: undefined,
  objectives: [],
  activeObjectiveId: undefined,
  contracts: [],
  trackedStationId: undefined,
  celebrationVisible: undefined,
  celebrationSellRevenue: undefined,
  celebrationBonusReward: undefined,
  // Combat state
  projectiles: [],
  lastFireTime: 0,
  npcLastFireTimes: {},
  npcAggression: {},
  lastDamageTime: 0,
  explosions: [],
  targetedNpcId: null,
  debris: [],
  // Mission arcs system
  missionArcs: initializeMissionArcs(),
  missions: [],
  stealthStates: new Map(),
  escortStates: new Map(),
  relationships: {},
  allyAssistTokens: [],
  notifications: [],

  // Route suggestions (now delegated to economy module)
  getSuggestedRoutes: (opts) => {
    const state = get();
    return getSuggestedRoutes(state.stations, state.ship, opts);
  },

  // Tick - orchestrates all subsystems
  tick: (dt) =>
    set(state => {
      // 1. Physics - update ship movement
      let ship = state.ship.isDead ? state.ship : updatePhysics(state.ship, dt);
      
      // 1a. Cargo freshness - decay perishable goods
      ship = ship.isDead ? ship : updateCargoFreshness(ship, dt);

      // 2. Economy - jitter prices (with market event multipliers)
      // Get active events first (before they're updated)
      const currentTimeForEvents = Date.now();
      const activeEventsForJitter = state.marketEvents
        ? getActiveEvents(state.marketEvents, currentTimeForEvents)
        : [];
      let stations = jitterPrices(state.stations, dt, activeEventsForJitter);

      // 2a. Economy - station consumption (dynamic supply/demand)
      stations = updateStationConsumption(stations, dt);
      
      // 2b. Economy - station production (producers generate goods)
      stations = updateStationProduction(stations, dt);

      // Phase 3: gentle trust decay toward 0 over time
      let relationships = state.relationships;
      if (relationships) {
        const decayRate = 0.005 * dt; // very gentle
        const updatedRelationships: Record<string, TrustRecord> = { ...relationships };
        for (const key of Object.keys(updatedRelationships)) {
          const r = updatedRelationships[key];
          if (!r) continue;
          let score = r.score;
          if (score > 0) score = Math.max(0, score - decayRate);
          else if (score < 0) score = Math.min(0, score + decayRate);
          updatedRelationships[key] = { ...r, score, tier: tierForScore(score) };
        }
        relationships = updatedRelationships;
      }

      // 3. NPCs - update movement and trading
      const npcResult = updateNpcTraders(
        state.npcTraders,
        stations,
        { position: ship.position, velocity: ship.velocity },
        dt
      );
      let npcTraders = npcResult.npcTraders;

      // Apply stock deltas from NPC trading
      stations = applyStockDeltas(stations, npcResult.stationStockDelta);

      // 4. Combat - spawn defenders if needed
      npcTraders = spawnHostileDefenders(
        npcTraders,
        stations,
        ship.position,
        !!ship.dockedStationId
      );

      const shipHpBeforeCombat = ship.hp;
      const npcBeforeCombatById = new Map<string, NpcTrader>();
      for (const npc of npcTraders) npcBeforeCombatById.set(npc.id, npc);

      // 5. Combat - update combat systems
      const combatResult = updateCombat(
        {
          ship,
          npcTraders,
          projectiles: state.projectiles,
          npcAggression: state.npcAggression,
          npcLastFireTimes: state.npcLastFireTimes,
          lastFireTime: state.lastFireTime,
          stations,
        },
        dt
      );

      ship = combatResult.ship;
      npcTraders = combatResult.npcTraders;

      const now = Date.now();
      const tookDamage = ship.hp < shipHpBeforeCombat;
      const lastDamageTime = tookDamage ? now : state.lastDamageTime;

      const explosions: ExplosionEffect[] = (state.explosions || []).filter(e => (now - e.startedAt) < e.duration);
      let debris = (state.debris || []).filter(d => (now - d.createdAt) < d.lifetime);

      // NPC death explosions
      const npcAfterCombatIds = new Set(npcTraders.map(n => n.id));
      for (const [npcId, npc] of npcBeforeCombatById.entries()) {
        if (npcAfterCombatIds.has(npcId)) continue;
        if ((npc.hp || 0) <= 0) continue;
        explosions.push({
          id: `expl_${npcId}_${now}`,
          kind: 'explosion',
          position: npc.position,
          color: npc.isHostile ? '#f97316' : '#ef4444',
          startedAt: now,
          duration: 700,
          maxRadius: 5.5,
        });

        // Cargo drops: spawn collectible debris with ~50% of NPC cargo capacity
        if (npc.commodityId) {
          const approxCargo = Math.max(1, Math.floor((npc.cargoCapacity || 30) * CARGO_DROP_PERCENTAGE));
          debris.push({
            id: `debris_${npcId}_${now}`,
            position: [npc.position[0], npc.position[1], npc.position[2]],
            cargo: { [npc.commodityId]: approxCargo } as Record<string, number>,
            createdAt: now,
            lifetime: 60_000,
          });
        }
      }

      // NPC hit sparks (white flash)
      const npcAfterCombatById = new Map<string, NpcTrader>();
      for (const npc of npcTraders) npcAfterCombatById.set(npc.id, npc);
      for (const [npcId, after] of npcAfterCombatById.entries()) {
        const before = npcBeforeCombatById.get(npcId);
        if (!before) continue;
        if ((after.hp || 0) <= 0) continue;
        if ((after.hp || 0) >= (before.hp || 0)) continue;
        explosions.push({
          id: `hit_${npcId}_${now}_${Math.random().toString(36).slice(2, 7)}`,
          kind: 'hit',
          position: after.position,
          color: '#ffffff',
          startedAt: now,
          duration: 180,
          maxRadius: 2.2,
        });
      }

      // Apply reputation changes from combat
      for (const repChange of combatResult.reputationChanges) {
        stations = applyReputationWithPropagation(
          stations,
          repChange.stationId,
          repChange.delta
        );
      }

      // Clear target if it no longer exists
      const targetedNpcId =
        state.targetedNpcId && npcTraders.some(n => n.id === state.targetedNpcId)
          ? state.targetedNpcId
          : null;

      // Auto-collect nearby debris
      if (!ship.isDead && !ship.dockedStationId && debris.length > 0) {
        const pickupRange = 18;
        const remaining: typeof debris = [];
        let cargo = { ...ship.cargo } as Record<string, number>;
        const usedCargo = Object.values(cargo).reduce((a, b) => a + b, 0);
        let free = Math.max(0, ship.maxCargo - usedCargo);

        for (const d of debris) {
          const dx = d.position[0] - ship.position[0];
          const dy = d.position[1] - ship.position[1];
          const dz = d.position[2] - ship.position[2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist > pickupRange) {
            remaining.push(d);
            continue;
          }

          for (const [cid, qtyRaw] of Object.entries(d.cargo)) {
            const qty = Math.max(0, Math.floor(qtyRaw || 0));
            if (qty <= 0) continue;
            const toTake = Math.min(qty, free);
            if (toTake <= 0) break;
            cargo[cid] = (cargo[cid] || 0) + toTake;
            free -= toTake;
          }

          if (free <= 0) remaining.push(d);
        }

        ship = free === ship.maxCargo - usedCargo ? ship : ({ ...ship, cargo } as Ship);
        debris = remaining;
      }

      // 6. Missions - update mission systems
      const missionResult = updateMissionsInTick(
        {
          ship,
          stations,
          npcTraders,
          missions: state.missions,
          missionArcs: state.missionArcs,
          stealthStates: state.stealthStates,
          escortStates: state.escortStates,
        },
        dt,
        combatResult.missionNpcDestroyedEvents
      );

      if (missionResult.ship) ship = missionResult.ship;
      if (missionResult.stations) stations = missionResult.stations;

      // 7. Market Events - spawn rare high-impact events
      const currentTime = now;
      let marketEvents = state.marketEvents || [];
      // Remove expired events
      marketEvents = getActiveEvents(marketEvents, currentTime);
      // Spawn new event if needed (rare: 1 per 5-10 min)
      const lastEventTime = marketEvents.length > 0
        ? Math.max(...marketEvents.map(e => e.startedAt))
        : undefined;
      if (shouldSpawnEvent(lastEventTime, currentTime)) {
        const newEvent = generateMarketEvent(stations);
        if (newEvent) {
          marketEvents = [...marketEvents, newEvent];
          // Notify player of new event
          const addNotification = get().addNotification;
          addNotification({
            type: 'info',
            message: `${newEvent.title}: ${newEvent.description}`,
            duration: 8000,
          });
        }
      }

      // 8. Price History - record price snapshots every 30 seconds
      const snapshotResult = recordPriceHistory(stations, currentTime, state.lastPriceSnapshotTime);
      const updatedPriceHistory = snapshotResult.priceHistory
        ? mergePriceHistory(state.priceHistory || {}, snapshotResult.priceHistory)
        : state.priceHistory;

      return {
        ship,
        stations,
        npcTraders: missionResult.npcTraders,
        projectiles: combatResult.projectiles,
        npcAggression: combatResult.npcAggression,
        npcLastFireTimes: combatResult.npcLastFireTimes,
        lastDamageTime,
        explosions,
        targetedNpcId,
        debris,
        missions: missionResult.missions,
        missionArcs: missionResult.missionArcs,
        stealthStates: missionResult.stealthStates,
        escortStates: missionResult.escortStates,
        relationships,
        marketEvents,
        priceHistory: updatedPriceHistory,
        lastPriceSnapshotTime: snapshotResult.lastSnapshotTime,
        ...(missionResult.missionCelebrationData ? { missionCelebrationData: missionResult.missionCelebrationData } : {}),
      } as Partial<GameState> as GameState;
    }),

  // Physics actions
  thrust: (dir, dt) =>
    set(state => {
      if (!state.hasChosenStarter) return state;
      if (state.ship.isDead) return state;
      if (state.ship.dockedStationId) return state;

      const updatedShip = applyThrust(state.ship, dir, dt);
      return { ship: updatedShip } as Partial<GameState> as GameState;
    }),

  setEngineTarget: target =>
    set(state => {
      const updatedShip = setEngineTargetModule(
        state.ship,
        target,
        !!state.ship.dockedStationId
      );
      if (updatedShip === state.ship) return state;
      return { ship: updatedShip } as Partial<GameState> as GameState;
    }),

  // Docking actions
  tryDock: () =>
    set(state => {
      if (!state.hasChosenStarter) return state;
      if (state.ship.isDead) return state;
      if (state.ship.dockedStationId) return state;
      
      // Find all stations within docking range
      const stationsInRange = state.stations.filter(
        s => distance(s.position, state.ship.position) < DOCKING_RANGE_WORLD
      );
      
      if (stationsInRange.length === 0) return state;
      
      // Find the nearest station
      const near = stationsInRange.reduce((closest, current) => {
        const closestDist = distance(closest.position, state.ship.position);
        const currentDist = distance(current.position, state.ship.position);
        return currentDist < closestDist ? current : closest;
      });
      
      if (!near) return state;

      // Check if station is hostile or closed
      if (!canDockAtStation(near)) {
        const reason = isStationHostile(near) ? 'Station is hostile' : 'Station is closed';
        const addNotification = get().addNotification;
        addNotification({
          type: 'error',
          message: `Cannot dock at ${near.name}: ${reason}`,
          duration: 3000,
        });
        return state;
      }

      // Generate available missions for this station
      const playerReputation: Record<string, number> = {};
      state.stations.forEach(s => {
        playerReputation[s.id] = s.reputation || 0;
      });
      const playerUpgrades: string[] = [];
      if (state.ship.hasNavigationArray) playerUpgrades.push('nav');
      if (state.ship.hasUnionMembership) playerUpgrades.push('union');
      if (state.ship.hasMarketIntel) playerUpgrades.push('intel');

      // Update arc statuses based on current reputation/upgrades
      // This unlocks story arcs when requirements are met
      let updatedArcs = updateArcStatuses(state.missionArcs, playerReputation, playerUpgrades);

      const activeMissions = state.missions.filter(m => m.status === 'active');
      const newMissions = generateMissionsForStation(
        near.id,
        playerReputation,
        playerUpgrades,
        updatedArcs, // Use updated arcs for mission generation
        activeMissions,
        updatedArcs.filter(a => a.status === 'completed').map(a => a.id)
      );

      // Merge with existing missions (don't duplicate)
      const existingMissionIds = new Set(state.missions.map(m => m.id));
      const missionsToAdd = newMissions.filter(m => !existingMissionIds.has(m.id));
      let finalMissions = [...state.missions, ...missionsToAdd];

      // Process station_docked event for active missions
      const activeMissionsToProcess = finalMissions.filter(m => m.status === 'active');
      const missionEvent: MissionEvent = {
        type: 'station_docked',
        stationId: near.id,
      };

      let missionCelebrationData: GameState['missionCelebrationData'] | undefined;
      let updatedStations = state.stations;
      let updatedShip = { ...state.ship, dockedStationId: near.id, lastDockedStationId: near.id, velocity: [0, 0, 0] } as Ship;
      let relationships = { ...(state.relationships || {}) };
      let allyAssistTokens = [...(state.allyAssistTokens || [])];

      for (const mission of activeMissionsToProcess) {
        const updatedMission = updateMissionObjectives(mission, missionEvent);
        finalMissions = finalMissions.map(m =>
          m.id === mission.id ? updatedMission : m
        );

        // Check if mission is now complete
        if (
          checkMissionCompletion(updatedMission) &&
          updatedMission.status === 'active'
        ) {
          // Mark mission as completed
          finalMissions = finalMissions.map(m =>
            m.id === mission.id ? { ...m, status: 'completed' as const } : m
          );

          // Apply rewards
          const rewardUpdates = applyMissionRewards(
            { ...state, stations: updatedStations, ship: updatedShip } as GameState,
            updatedMission
          );
          if (rewardUpdates.ship) {
            updatedShip = { ...updatedShip, ...rewardUpdates.ship } as Ship;
          }
          if (rewardUpdates.stations) {
            updatedStations = rewardUpdates.stations;
          }

          // Advance mission arc
          const arc = updatedArcs.find(a => a.id === updatedMission.arcId);
          if (arc) {
            const updatedArc = advanceMissionArc(arc, updatedMission.id);
            updatedArcs = updatedArcs.map(a =>
              a.id === updatedMission.arcId ? updatedArc : a
            );
          }

          // Trigger mission celebration
          const firstDeliver = updatedMission.objectives.find(o => o.type === 'deliver');
          const narrativeContext = {
            shipKind: state.ship.kind,
            deliveredUnits: firstDeliver?.current || firstDeliver?.quantity,
            commodityName: firstDeliver?.target,
            routeStart: state.stations.find(s => s.id === state.ship.dockedStationId)?.name,
            routeEnd: near.name,
            enemiesDestroyed: 0,
            stealthUsed: state.stealthStates.get(updatedMission.id)?.detected === false,
            trustTiers: getTrustTiersSnapshot(state.relationships),
          };
          missionCelebrationData = {
            missionId: updatedMission.id,
            credits: updatedMission.rewards.credits,
            reputationChanges: updatedMission.rewards.reputationChanges,
            narrativeContext,
          };

          // Apply trust deltas and possibly grant assist token
          const now = Date.now();
          const deltas = computeTrustDeltas(updatedMission.id, narrativeContext);
          for (const { by, delta } of deltas) {
            const before = relationships[by];
            const beforeTier = before?.tier ?? 0;
            const after = setTrust(before, delta, now);
            relationships[by] = after;
            const crossedToSupporter = beforeTier < 1 && after.tier >= 1;
            const eligible = canGrantToken(now, after, allyAssistTokens, by, 3, 60_000);
            const prob = crossedToSupporter ? 1.0 : after.tier >= 1 ? 0.15 : 0;
            if (eligible && prob > 0 && maybeProbabilityGrant(prob)) {
              const preset = defaultAssistForStation(by);
              const token = grantAssist(by, preset.type, preset.description, now);
              allyAssistTokens.push(token);
              relationships[by] = { ...after, lastAssistGrantedAt: now };
              if (missionCelebrationData) {
                missionCelebrationData.allyAssistUnlocked = { by, type: preset.type, description: preset.description };
              }
            }
          }

          console.log(`Mission completed: ${updatedMission.title}`);
        }
      }

      const next: Partial<GameState> = {
        ship: updatedShip,
        dockIntroVisibleId: near.id,
        missions: finalMissions,
        missionArcs: updatedArcs,
        stations: updatedStations,
        ...(missionCelebrationData ? { missionCelebrationData } : {}),
        ...(Object.keys(relationships).length > 0 || allyAssistTokens.length > 0 ? {
          relationships,
          allyAssistTokens,
        } : {}),
      };

      if (state.tutorialActive) {
        if (state.tutorialStep === 'dock_city' && near.type === 'city') {
          next.tutorialStep = 'accept_mission';
        } else if (state.tutorialStep === 'goto_refinery' && near.id === 'sol-refinery') {
          next.tutorialStep = 'buy_fuel';
        }
      }

      return next as Partial<GameState> as GameState;
    }),

  dismissDockIntro: () =>
    set(state => {
      if (!state.ship.dockedStationId) return state;
      if (!state.dockIntroVisibleId) return state;
      return { dockIntroVisibleId: undefined } as Partial<GameState> as GameState;
    }),

  // Record dialogue shown to prevent repetition
  recordDialogueShown: (stationId: string, lineIds: string[]) =>
    set(state => {
      if (lineIds.length === 0) return state;
      
      const station = state.stations.find(s => s.id === stationId);
      if (!station) return state;
      
      // Get current memory or create empty
      const currentMemory = (station as any).characterMemory ?? {
        visitCount: 0,
        firstVisitTime: null,
        lastVisitTime: null,
        totalTradeVolume: 0,
        missionsCompleted: [],
        knownActions: [],
        recentDialogueIds: [],
        lastGreetingId: null,
      };
      
      // Add new line IDs to recent list, keeping last 15 to ensure variety
      const recentDialogueIds = [
        ...lineIds,
        ...currentMemory.recentDialogueIds.filter((id: string) => !lineIds.includes(id)),
      ].slice(0, 15);
      
      // Update the station with new memory
      const updatedStations = state.stations.map(s => 
        s.id === stationId 
          ? { ...s, characterMemory: { ...currentMemory, recentDialogueIds } }
          : s
      );
      
      return { stations: updatedStations } as Partial<GameState> as GameState;
    }),

  undock: () =>
    set(state => {
      if (!state.hasChosenStarter) return state;
      if (state.ship.isDead) return state;
      if (!state.ship.dockedStationId) return state;
      return {
        ship: { ...state.ship, dockedStationId: undefined },
        dockIntroVisibleId: undefined,
      } as Partial<GameState> as GameState;
    }),

  // Mining action
  mine: () =>
    set(state => {
      if (!state.hasChosenStarter) return state;
      if (state.ship.isDead) return state;
      if (state.ship.dockedStationId) return state;
      if (!state.ship.canMine) return state;

      const belts = state.belts;
      const near = belts.find(b => {
        const d = distance(state.ship.position, b.position);
        return Math.abs(d - b.radius) < MINING_RANGE_WORLD;
      });
      if (!near) return state;

      const used = Object.values(state.ship.cargo).reduce((a, b) => a + b, 0);
      if (used >= state.ship.maxCargo) return state;

      const room = state.ship.maxCargo - used;
      const roll = Math.random();
      let ore: keyof Ship['cargo'] = 'iron_ore';

      if (near.tier === 'common') {
        ore =
          roll < 0.5
            ? 'iron_ore'
            : roll < 0.8
            ? 'copper_ore'
            : roll < 0.95
            ? 'silicon'
            : 'rare_minerals';
      } else {
        ore =
          roll < 0.3
            ? 'iron_ore'
            : roll < 0.6
            ? 'copper_ore'
            : roll < 0.85
            ? 'silicon'
            : 'rare_minerals';
      }

      const qty = Math.max(
        1,
        Math.min(room, Math.round(ore === 'rare_minerals' ? 1 : 1 + Math.random() * 3))
      );
      const cargo = {
        ...state.ship.cargo,
        [ore]: (state.ship.cargo[ore] || 0) + qty,
      } as Record<string, number>;

      return { ship: { ...state.ship, cargo } } as Partial<GameState> as GameState;
    }),

  // Economy actions - delegated to action modules
  buy: createBuyAction(get, (updates) => set(state => ({ ...state, ...updates }))),

  sell: createSellAction(get, (updates) => set(state => ({ ...state, ...updates }))),

  process: (inputId, outputs) =>
    set(state => {
      const updatedShip = processCommodity(
        state.ship,
        state.ship.dockedStationId,
        state.stations,
        inputId,
        outputs
      );
      if (!updatedShip) return state;
      return { ship: updatedShip } as Partial<GameState> as GameState;
    }),

  upgrade: (type, amount, cost) =>
    set(state => {
      const updatedShip = upgradeShip(
        state.ship,
        state.ship.dockedStationId,
        state.stations,
        type,
        amount,
        cost
      );
      if (!updatedShip) return state;
      return { ship: updatedShip } as Partial<GameState> as GameState;
    }),

  // Ship replacement
  replaceShip: (kind, cost) =>
    set(state => {
      if (!state.ship.dockedStationId) return state;
      const station = state.stations.find(s => s.id === state.ship.dockedStationId);
      if (!station || station.type !== 'shipyard') return state;
      if (state.ship.credits < cost) return state;

      const usedCargo = Object.values(state.ship.cargo).reduce((a, b) => a + b, 0);
      if (usedCargo > 0) return state;

      // Use ship registry to create new ship, preserving upgrades
      const next = createShip(kind as ShipKind, state.ship.position, {
        credits: state.ship.credits - cost,
        hasNavigationArray: state.ship.hasNavigationArray,
        hasUnionMembership: state.ship.hasUnionMembership,
        hasMarketIntel: state.ship.hasMarketIntel,
        hasTradeLedger: state.ship.hasTradeLedger,
        hasTempCargo: state.ship.hasTempCargo,
        hasShieldedCargo: state.ship.hasShieldedCargo,
        weapon: state.ship.weapon, // Preserve weapon upgrades
        dockedStationId: state.ship.dockedStationId,
      });

      return { ship: next } as Partial<GameState> as GameState;
    }),

  // Starter selection
  chooseStarter: (kind: ShipKind | 'test', opts) =>
    set(state => {
      const basePosition: [number, number, number] = state.ship.position;

      // Handle test ship (special case with all upgrades)
      if (kind === 'test') {
        const kindR: ShipKind = 'racer';
        const testWeapon: ShipWeapon = {
          ...WEAPON_BASE_STATS.railgun,
          damageLevel: 5,
          fireRateLevel: 3,
          rangeLevel: 3,
        };
        const ship = createShip(kindR, basePosition, {
          credits: 999999,
          canMine: true,
          hasNavigationArray: true,
          hasUnionMembership: true,
          hasMarketIntel: true,
          hasTradeLedger: true,
          hasTempCargo: true,
          hasShieldedCargo: true,
          maxCargo: shipCaps[kindR].cargo,
          stats: {
            acc: shipCaps[kindR].acc * 2,
            drag: 0.85,
            vmax: shipCaps[kindR].vmax * 2,
          },
          weapon: testWeapon,
        });

        // Set varied reputation at local stations for testing reputation tiers
        const stations = state.stations.map(s => {
          if (s.id === 'aurum-fab') return { ...s, reputation: 25 };
          if (s.id === 'sol-city') return { ...s, reputation: 50 };
          if (s.id === 'greenfields') return { ...s, reputation: 75 };
          if (s.id === 'sol-refinery') return { ...s, reputation: 100 };
          return s;
        });

        return {
          ship,
          stations,
          hasChosenStarter: true,
          isTestMode: true,
          tutorialActive: false,
          tutorialStep: 'dock_city',
        } as Partial<GameState> as GameState;
      }

      // Use ship registry for normal starter ships
      const ship = createShip(kind as ShipKind, basePosition);

      return {
        ship,
        hasChosenStarter: true,
        tutorialActive: !!opts?.tutorial,
        tutorialStep: 'dock_city',
      } as Partial<GameState> as GameState;
    }),

  // Tutorial actions
  setTutorialActive: active =>
    set(state => {
      if (state.tutorialActive === active) return state;
      const next: Partial<GameState> = { tutorialActive: active };
      if (active && state.tutorialStep === 'done')
        next.tutorialStep = 'dock_city';
      return next as Partial<GameState> as GameState;
    }),

  setTutorialStep: step =>
    set(state => {
      if (state.tutorialStep === step) return state;
      return { tutorialStep: step } as Partial<GameState> as GameState;
    }),

  // UI state
  setTrackedStation: stationId =>
    set(_state => {
      return { trackedStationId: stationId } as Partial<GameState> as GameState;
    }),

  // Contracts
  generateContracts: opts =>
    set(state => {
      const limit = opts?.limit ?? undefined;
      const contracts = generateContractsModule(
        state.stations,
        state.contracts || [],
        state.ship,
        limit
      );
      return { contracts } as Partial<GameState> as GameState;
    }),

  acceptContract: id =>
    set(state => {
      const result = acceptContractAction(
        id,
        state.contracts || [],
        state.objectives || [],
        state.npcTraders,
        state.stations,
        state.ship
      );

      const next: Partial<GameState> = {
        contracts: result.contracts,
        objectives: result.objectives,
        npcTraders: result.npcTraders,
        activeObjectiveId: result.activeObjectiveId || state.activeObjectiveId,
        trackedStationId: result.trackedStationId || state.trackedStationId,
      };

      // Tutorial progression
      const chosen = result.contracts.find(c => c.id === id && c.status === 'accepted');
      if (
        state.tutorialActive &&
        state.tutorialStep === 'accept_mission' &&
        chosen?.commodityId === 'refined_fuel'
      ) {
        next.tutorialStep = 'goto_refinery';
      }

      return next as Partial<GameState> as GameState;
    }),

  abandonContract: id =>
    set(state => {
      const result = abandonContractAction(
        id,
        state.contracts || [],
        state.stations,
        state.objectives || [],
        state.npcTraders,
        state.activeObjectiveId
      );

      return {
        contracts: result.contracts,
        stations: result.stations,
        objectives: result.objectives,
        activeObjectiveId: result.activeObjectiveId,
        npcTraders: result.npcTraders,
      } as Partial<GameState> as GameState;
    }),

  // Combat actions
  fireWeapon: targetPos =>
    set(state => {
      if (state.ship.isDead) return state;
      const result = firePlayerWeapon(state.ship, state.lastFireTime, targetPos || null);
      if (!result) return state;

      return {
        ship: result.ship,
        projectiles: [...state.projectiles, result.projectile],
        lastFireTime: Date.now(),
      } as Partial<GameState> as GameState;
    }),

  upgradeWeapon: (upgradeType, cost) =>
    set(state => {
      if (!state.ship.dockedStationId) return state;
      const station = state.stations.find(s => s.id === state.ship.dockedStationId);
      if (!station || station.type !== 'shipyard') return state;

      const updatedShip = upgradePlayerWeapon(state.ship, upgradeType, cost);
      if (!updatedShip) return state;

      return {
        ship: updatedShip,
      } as Partial<GameState> as GameState;
    }),

  purchaseWeapon: (weaponKind, cost) =>
    set(state => {
      if (!state.ship.dockedStationId) return state;
      const station = state.stations.find(s => s.id === state.ship.dockedStationId);
      if (!station || station.type !== 'shipyard') return state;

      // Filter out unsupported weapon types
      if (
        weaponKind !== 'laser' &&
        weaponKind !== 'plasma' &&
        weaponKind !== 'railgun' &&
        weaponKind !== 'missile'
      ) {
        return state;
      }

      const updatedShip = purchasePlayerWeapon(
        state.ship,
        weaponKind,
        cost,
        !!state.ship.hasMarketIntel
      );
      if (!updatedShip) return state;

      return {
        ship: updatedShip,
      } as Partial<GameState> as GameState;
    }),

  respawnPlayer: () =>
    set(state => {
      const respawnStation =
        (state.ship.lastDockedStationId
          ? state.stations.find(s => s.id === state.ship.lastDockedStationId)
          : undefined) ||
        state.stations.find(s => s.type === 'city') ||
        state.stations[0];
      if (!respawnStation) return state;

      const creditsPenaltyMultiplier = 0.9;
      const nextCredits = Math.max(0, Math.floor(state.ship.credits * creditsPenaltyMultiplier));

      const ship: Ship = {
        ...state.ship,
        isDead: false,
        hp: state.ship.maxHp,
        energy: state.ship.maxEnergy,
        credits: nextCredits,
        cargo: {},
        cargoFreshness: undefined,
        velocity: [0, 0, 0],
        enginePower: 0,
        engineTarget: 0,
        dockedStationId: respawnStation.id,
        lastDockedStationId: respawnStation.id,
        position: [
          respawnStation.position[0] + 5,
          respawnStation.position[1],
          respawnStation.position[2] + 5,
        ],
      };

      return {
        ship,
        projectiles: [],
        lastFireTime: 0,
        npcLastFireTimes: {},
        npcAggression: {},
        lastDamageTime: 0,
        explosions: [],
        targetedNpcId: null,
        debris: [],
      } as Partial<GameState> as GameState;
    }),

  cycleTarget: () =>
    set(state => {
      if (state.ship.isDead) return state;
      if (state.ship.dockedStationId) return state;

      const shipPos = state.ship.position;
      const candidates = state.npcTraders
        .filter(n => !n.isEscort && (n.hp || 0) > 0)
        .map(n => {
          const dx = n.position[0] - shipPos[0];
          const dy = n.position[1] - shipPos[1];
          const dz = n.position[2] - shipPos[2];
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          return { n, d };
        })
        .filter(x => x.d <= 1600)
        .sort((a, b) => a.d - b.d)
        .map(x => x.n);

      if (candidates.length === 0) {
        if (state.targetedNpcId === null) return state;
        return { targetedNpcId: null } as Partial<GameState> as GameState;
      }

      const idx = state.targetedNpcId
        ? candidates.findIndex(n => n.id === state.targetedNpcId)
        : -1;
      const next = candidates[(idx + 1) % candidates.length];
      return { targetedNpcId: next?.id ?? null } as Partial<GameState> as GameState;
    }),

  clearTarget: () =>
    set(state => {
      if (state.targetedNpcId === null) return state;
      return { targetedNpcId: null } as Partial<GameState> as GameState;
    }),

  collectDebris: () =>
    set(state => {
      if (state.ship.isDead) return state;
      if (state.ship.dockedStationId) return state;
      if (!state.debris || state.debris.length === 0) return state;

      const pickupRange = 18;
      const shipPos = state.ship.position;
      const remaining: typeof state.debris = [];
      const cargo = { ...state.ship.cargo } as Record<string, number>;
      const usedCargo = Object.values(cargo).reduce((a, b) => a + b, 0);
      let free = Math.max(0, state.ship.maxCargo - usedCargo);

      for (const d of state.debris) {
        const dx = d.position[0] - shipPos[0];
        const dy = d.position[1] - shipPos[1];
        const dz = d.position[2] - shipPos[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > pickupRange) {
          remaining.push(d);
          continue;
        }

        for (const [cid, qtyRaw] of Object.entries(d.cargo)) {
          const qty = Math.max(0, Math.floor(qtyRaw || 0));
          if (qty <= 0) continue;
          const toTake = Math.min(qty, free);
          if (toTake <= 0) break;
          cargo[cid] = (cargo[cid] || 0) + toTake;
          free -= toTake;
        }

        if (free <= 0) remaining.push(d);
      }

      return {
        ship: { ...state.ship, cargo } as Ship,
        debris: remaining,
      } as Partial<GameState> as GameState;
    }),

  // Ally assists (Phase 1): consume a token by type (and optional source)
  consumeAssist: (type, by) => {
    let consumed = false;
    set(state => {
      const tokens = [...(state.allyAssistTokens || [])];
      const idx = tokens.findIndex(t => !t.consumed && t.type === type && (!by || t.by === by));
      if (idx === -1) return state;
      tokens[idx] = { ...tokens[idx], consumed: true };
      consumed = true;
      return { allyAssistTokens: tokens } as Partial<GameState> as GameState;
    });
    return consumed;
  },

  // Mission actions
  acceptMission: missionId =>
    set(state => {
      const result = acceptMissionAction(
        missionId,
        state.missions,
        state.missionArcs,
        state.npcTraders,
        state.escortStates,
        state.stations,
        state.ship
      );

      return {
        missions: result.missions,
        missionArcs: result.missionArcs,
        npcTraders: result.npcTraders,
        escortStates: result.escortStates,
      } as Partial<GameState> as GameState;
    }),

  abandonMission: missionId =>
    set(state => {
      const result = abandonMissionAction(
        missionId,
        state.missions,
        state.stations,
        state.stealthStates,
        state.escortStates,
        state.npcTraders
      );

      return {
        missions: result.missions,
        stations: result.stations,
        stealthStates: result.stealthStates,
        escortStates: result.escortStates,
        npcTraders: result.npcTraders,
      } as Partial<GameState> as GameState;
    }),

  checkMissionProgress: () =>
    set(state => {
      let updatedMissions = [...state.missions];
      let updatedArcs = [...state.missionArcs];
      let updatedStations = [...state.stations];
      let updatedShip = { ...state.ship };
      const currentTime = Date.now() / 1000;

      // Check active missions
      const activeMissions = updatedMissions.filter(m => m.status === 'active');

      // Track political profile updates for failed missions
      let politicalProfile = state.politicalProfile;

      for (const mission of activeMissions) {
        // Check for failure conditions
        const failureCheck = checkMissionFailure(mission, currentTime);
        if (failureCheck.failed) {
          // Mark mission as failed
          updatedMissions = updatedMissions.map(m =>
            m.id === mission.id ? { ...m, status: 'failed' as const } : m
          );
          console.log(`Mission failed: ${mission.title} - ${failureCheck.reason}`);
          
          // Apply 50% political compass score for failed missions
          const politicsUpdates = applyMissionToProfile(
            { ...state, politicalProfile } as GameState,
            mission.id,
            null,
            0.5
          );
          if (politicsUpdates.politicalProfile) {
            politicalProfile = politicsUpdates.politicalProfile;
          }
          continue;
        }

        // Check for completion
        if (checkMissionCompletion(mission)) {
          // Mark mission as completed
          updatedMissions = updatedMissions.map(m =>
            m.id === mission.id ? { ...m, status: 'completed' as const } : m
          );

          // Apply rewards
          const rewardUpdates = applyMissionRewards(
            { ...state, stations: updatedStations, ship: updatedShip } as GameState,
            mission
          );
          if (rewardUpdates.ship) updatedShip = rewardUpdates.ship;
          if (rewardUpdates.stations) updatedStations = rewardUpdates.stations;

          // Apply permanent effects
          if (mission.rewards.permanentEffects) {
            const effectUpdates = applyPermanentEffects(
              state as GameState,
              mission.rewards.permanentEffects
            );
            // Merge effect updates
          }

          // Advance mission arc
          const arc = updatedArcs.find(a => a.id === mission.arcId);
          if (arc) {
            const updatedArc = advanceMissionArc(arc, mission.id);
            updatedArcs = updatedArcs.map(a =>
              a.id === mission.arcId ? updatedArc : a
            );
          }

          // Trigger mission celebration with narrative + minimal context
          const firstDeliver = mission.objectives.find(o => o.type === 'deliver');
          const narrativeContext = {
            shipKind: updatedShip.kind,
            deliveredUnits: firstDeliver?.current || firstDeliver?.quantity,
            commodityName: firstDeliver?.target,
            routeStart: state.stations.find(s => s.id === state.ship.dockedStationId)?.name,
            routeEnd: updatedShip.dockedStationId ? state.stations.find(s => s.id === updatedShip.dockedStationId)?.name : undefined,
            enemiesDestroyed: 0,
            stealthUsed: state.stealthStates.get(mission.id)?.detected === false,
            trustTiers: getTrustTiersSnapshot(state.relationships),
          };
          const missionCelebrationData: GameState['missionCelebrationData'] = {
            missionId: mission.id,
            credits: mission.rewards.credits,
            reputationChanges: mission.rewards.reputationChanges,
            narrativeContext,
          };

          // Apply trust deltas and possibly grant assist token (Phase 1)
          const now = Date.now();
          let relationships = { ...(state.relationships || {}) };
          let allyAssistTokens = [...(state.allyAssistTokens || [])];
          const deltas = computeTrustDeltas(mission.id, narrativeContext);
          for (const { by, delta } of deltas) {
            const before = relationships[by];
            const beforeTier = before?.tier ?? 0;
            const after = setTrust(before, delta, now);
            relationships[by] = after;
            const crossedToSupporter = beforeTier < 1 && after.tier >= 1;
            const eligible = canGrantToken(now, after, allyAssistTokens, by, 3, 60_000);
            const prob = crossedToSupporter ? 1.0 : after.tier >= 1 ? 0.15 : 0;
            if (eligible && prob > 0 && maybeProbabilityGrant(prob)) {
              const preset = defaultAssistForStation(by);
              const token = grantAssist(by, preset.type, preset.description, now);
              allyAssistTokens.push(token);
              relationships[by] = { ...after, lastAssistGrantedAt: now };
              missionCelebrationData.allyAssistUnlocked = { by, type: preset.type, description: preset.description };
            }
          }

          console.log(`Mission completed: ${mission.title}`);

          // Regenerate missions for current station if docked
          let finalMissions = updatedMissions;
          if (updatedShip.dockedStationId) {
            const playerReputation: Record<string, number> = {};
            for (const st of updatedStations) {
              if (st.reputation !== undefined) {
                playerReputation[st.id] = st.reputation;
              }
            }
            const playerUpgrades: string[] = [];
            if (updatedShip.hasNavigationArray) playerUpgrades.push('nav');
            if (updatedShip.hasUnionMembership) playerUpgrades.push('union');
            if (updatedShip.hasMarketIntel) playerUpgrades.push('intel');

            const activeMissionsAfterCompletion = finalMissions.filter(
              m => m.status === 'active'
            );
            const newMissions = generateMissionsForStation(
              updatedShip.dockedStationId,
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

          // Return with celebration data
          return {
            missions: finalMissions,
            missionArcs: updatedArcs,
            stations: updatedStations,
            ship: updatedShip,
            missionCelebrationData,
            relationships,
            allyAssistTokens,
          } as Partial<GameState> as GameState;
        }
      }

      // Update arc statuses (check for newly unlocked arcs)
      const playerUpgrades: string[] = [];
      if (updatedShip.hasNavigationArray) playerUpgrades.push('nav');
      if (updatedShip.hasUnionMembership) playerUpgrades.push('union');
      if (updatedShip.hasMarketIntel) playerUpgrades.push('intel');

      const playerReputation: Record<string, number> = {};
      updatedStations.forEach(s => {
        playerReputation[s.id] = s.reputation || 0;
      });

      updatedArcs = updateArcStatuses(updatedArcs, playerReputation, playerUpgrades);

      return {
        missions: updatedMissions,
        missionArcs: updatedArcs,
        stations: updatedStations,
        ship: updatedShip,
        politicalProfile,
      } as Partial<GameState> as GameState;
    }),

  completeMission: missionId =>
    set(state => {
      const mission = state.missions.find(m => m.id === missionId);
      if (!mission || mission.status !== 'active') return state;

      // Check if mission is actually complete
      if (!checkMissionCompletion(mission)) {
        console.log('Mission objectives not complete yet');
        return state;
      }

      // Mark as completed and apply rewards
      const updatedMissions = state.missions.map(m =>
        m.id === missionId ? { ...m, status: 'completed' as const } : m
      );

      // Apply rewards
      const rewardUpdates = applyMissionRewards(state, mission);

      // Apply permanent effects
      let effectUpdates: Partial<GameState> = {};
      if (mission.rewards.permanentEffects) {
        effectUpdates = applyPermanentEffects(state, mission.rewards.permanentEffects);
      }

      // Advance mission arc
      const arc = state.missionArcs.find(a => a.id === mission.arcId);
      let updatedArcs = state.missionArcs;
      if (arc) {
        const updatedArc = advanceMissionArc(arc, mission.id);
        updatedArcs = state.missionArcs.map(a =>
          a.id === mission.arcId ? updatedArc : a
        );
      }

      // Trigger mission celebration with narrative + minimal context
      const firstDeliver = mission.objectives.find(o => o.type === 'deliver');
      const narrativeContext = {
        shipKind: state.ship.kind,
        deliveredUnits: firstDeliver?.current || firstDeliver?.quantity,
        commodityName: firstDeliver?.target,
        routeStart: state.ship.dockedStationId ? state.stations.find(s => s.id === state.ship.dockedStationId)?.name : undefined,
        routeEnd: state.ship.dockedStationId ? state.stations.find(s => s.id === state.ship.dockedStationId)?.name : undefined,
        enemiesDestroyed: 0,
        stealthUsed: state.stealthStates.get(mission.id)?.detected === false,
        trustTiers: getTrustTiersSnapshot(state.relationships),
      };
      const missionCelebrationData: GameState['missionCelebrationData'] = {
        missionId: mission.id,
        credits: mission.rewards.credits,
        reputationChanges: mission.rewards.reputationChanges,
        narrativeContext,
      };

      // Phase 1: trust & assist token grant
      const now = Date.now();
      let relationships = { ...(state.relationships || {}) };
      let allyAssistTokens = [...(state.allyAssistTokens || [])];
      const deltas = computeTrustDeltas(mission.id, narrativeContext);
      for (const { by, delta } of deltas) {
        const before = relationships[by];
        const beforeTier = before?.tier ?? 0;
        const after = setTrust(before, delta, now);
        relationships[by] = after;
        const crossedToSupporter = beforeTier < 1 && after.tier >= 1;
        if (crossedToSupporter && !hasUnconsumedToken(allyAssistTokens, by)) {
          const preset = defaultAssistForStation(by);
          const token = grantAssist(by, preset.type, preset.description, now);
          allyAssistTokens.push(token);
          missionCelebrationData.allyAssistUnlocked = { by, type: preset.type, description: preset.description };
        }
      }

      // Update political compass score (non-choice missions use 'complete' as choiceId)
      const politicsUpdates = applyMissionToProfile(state, mission.id, null);

      return {
        missions: updatedMissions,
        missionArcs: updatedArcs,
        missionCelebrationData,
        relationships,
        allyAssistTokens,
        ...rewardUpdates,
        ...effectUpdates,
        ...politicsUpdates,
      } as Partial<GameState> as GameState;
    }),

  makeMissionChoice: (missionId, choiceId) =>
    set(state => {
      const mission = state.missions.find(m => m.id === missionId);
      if (!mission || mission.type !== 'choice') return state;

      const choice = mission.choiceOptions?.find(c => c.id === choiceId);
      if (!choice) return state;

      // Record the choice in the arc
      const updatedArcs = state.missionArcs.map(arc => {
        if (arc.id === mission.arcId) {
          return {
            ...arc,
            choicesMade: {
              ...arc.choicesMade,
              [`stage_${mission.stage}_choice`]: choiceId,
            },
          };
        }
        return arc;
      });

      // Complete the mission with the chosen rewards
      const updatedMission = {
        ...mission,
        rewards: choice.rewards,
        status: 'completed' as const,
      };

      const updatedMissions = state.missions.map(m =>
        m.id === missionId ? updatedMission : m
      );

      // Apply choice rewards
      const rewardUpdates = applyMissionRewards(state, updatedMission);

      // Apply permanent effects from the choice
      const permanentEffectsUpdates = choice.rewards.permanentEffects
        ? applyChoicePermanentEffects(state, choice.rewards.permanentEffects)
        : {};

      // Advance arc
      const arc = updatedArcs.find(a => a.id === mission.arcId);
      let finalArcs = updatedArcs;
      if (arc) {
        const updatedArc = advanceMissionArc(arc, mission.id);
        finalArcs = updatedArcs.map(a => (a.id === mission.arcId ? updatedArc : a));
      }

      // Update political compass score with the choice made
      const politicsUpdates = applyMissionToProfile(state, mission.id, choiceId);

      return {
        missions: updatedMissions,
        missionArcs: finalArcs,
        ...rewardUpdates,
        ...permanentEffectsUpdates,
        ...politicsUpdates,
      } as Partial<GameState> as GameState;
    }),

  completeMissionObjective: (missionId: string, objectiveId: string) =>
    set(state => {
      const mission = state.missions.find(m => m.id === missionId);
      if (!mission || mission.status !== 'active') return state;

      const objective = mission.objectives.find(o => o.id === objectiveId);
      if (!objective || objective.completed) return state;

      // Mark objective as completed
      const updatedObjectives = mission.objectives.map(obj =>
        obj.id === objectiveId
          ? { ...obj, completed: true, current: obj.quantity || 1 }
          : obj
      );

      const updatedMission = {
        ...mission,
        objectives: updatedObjectives,
      };

      const updatedMissions = state.missions.map(m =>
        m.id === missionId ? updatedMission : m
      );

      // Check if mission is now complete
      if (checkMissionCompletion(updatedMission)) {
        // Mark mission as completed
        const finalMissions = updatedMissions.map(m =>
          m.id === missionId ? { ...m, status: 'completed' as const } : m
        );

        // Apply rewards
        const rewardUpdates = applyMissionRewards(state, updatedMission);

        // Apply permanent effects
        let effectUpdates: Partial<GameState> = {};
        if (updatedMission.rewards.permanentEffects) {
          effectUpdates = applyPermanentEffects(state, updatedMission.rewards.permanentEffects);
        }

        // Advance mission arc
        const arc = state.missionArcs.find(a => a.id === updatedMission.arcId);
        let updatedArcs = state.missionArcs;
        if (arc) {
          const updatedArc = advanceMissionArc(arc, updatedMission.id);
          updatedArcs = state.missionArcs.map(a =>
            a.id === updatedMission.arcId ? updatedArc : a
          );
        }

        // Trigger mission celebration
        const firstDeliver = updatedMission.objectives.find(o => o.type === 'deliver');
        const narrativeContext = {
          shipKind: state.ship.kind,
          deliveredUnits: firstDeliver?.current || firstDeliver?.quantity,
          commodityName: firstDeliver?.target,
          routeStart: state.stations.find(s => s.id === state.ship.dockedStationId)?.name,
          routeEnd: state.ship.dockedStationId ? state.stations.find(s => s.id === state.ship.dockedStationId)?.name : undefined,
          enemiesDestroyed: 0,
          stealthUsed: state.stealthStates.get(updatedMission.id)?.detected === false,
          trustTiers: getTrustTiersSnapshot(state.relationships),
        };
        const missionCelebrationData: GameState['missionCelebrationData'] = {
          missionId: updatedMission.id,
          credits: updatedMission.rewards.credits,
          reputationChanges: updatedMission.rewards.reputationChanges,
          narrativeContext,
        };

        // Apply trust deltas and possibly grant assist token
        const now = Date.now();
        let relationships = { ...(state.relationships || {}) };
        let allyAssistTokens = [...(state.allyAssistTokens || [])];
        const deltas = computeTrustDeltas(updatedMission.id, narrativeContext);
        for (const { by, delta } of deltas) {
          const before = relationships[by];
          const beforeTier = before?.tier ?? 0;
          const after = setTrust(before, delta, now);
          relationships[by] = after;
          const crossedToSupporter = beforeTier < 1 && after.tier >= 1;
          const eligible = canGrantToken(now, after, allyAssistTokens, by, 3, 60_000);
          const prob = crossedToSupporter ? 1.0 : after.tier >= 1 ? 0.15 : 0;
          if (eligible && prob > 0 && maybeProbabilityGrant(prob)) {
            const preset = defaultAssistForStation(by);
            const token = grantAssist(by, preset.type, preset.description, now);
            allyAssistTokens.push(token);
            relationships[by] = { ...after, lastAssistGrantedAt: now };
            missionCelebrationData.allyAssistUnlocked = { by, type: preset.type, description: preset.description };
          }
        }

        console.log(`Mission completed: ${updatedMission.title}`);

        return {
          missions: finalMissions,
          missionArcs: updatedArcs,
          missionCelebrationData,
          relationships,
          allyAssistTokens,
          ...rewardUpdates,
          ...effectUpdates,
        } as Partial<GameState> as GameState;
      }

      return {
        missions: updatedMissions,
      } as Partial<GameState> as GameState;
    }),

  startInstallDevice: (missionId: string, objectiveId: string) =>
    set(state => {
      const mission = state.missions.find(m => m.id === missionId);
      if (!mission || mission.status !== 'active') return state;

      const objective = mission.objectives.find(o => o.id === objectiveId);
      if (!objective || objective.completed) return state;

      return {
        missionInstallState: {
          missionId,
          objectiveId,
          startTime: Date.now(),
        },
      } as Partial<GameState> as GameState;
    }),

  stopInstallDevice: () =>
    set(state => {
      if (!state.missionInstallState) return state;

      const { missionId, objectiveId, startTime } = state.missionInstallState;
      const mission = state.missions.find(m => m.id === missionId);
      if (!mission || mission.status !== 'active') {
        return {
          missionInstallState: undefined,
        } as Partial<GameState> as GameState;
      }

      const objective = mission.objectives.find(o => o.id === objectiveId);
      if (!objective || objective.completed) {
        return {
          missionInstallState: undefined,
        } as Partial<GameState> as GameState;
      }

      const holdDuration = (Date.now() - startTime) / 1000; // duration in seconds
      const MIN_HOLD_TIME = 30; // seconds
      const MAX_HOLD_TIME = 35; // seconds

      // Check if hold duration is within acceptable range
      if (holdDuration >= MIN_HOLD_TIME && holdDuration <= MAX_HOLD_TIME) {
        // Success! Complete the objective
        const updatedObjectives = mission.objectives.map(obj =>
          obj.id === objectiveId
            ? { ...obj, completed: true, current: obj.quantity || 1 }
            : obj
        );

        const updatedMission = {
          ...mission,
          objectives: updatedObjectives,
        };

        const updatedMissions = state.missions.map(m =>
          m.id === missionId ? updatedMission : m
        );

        // Check if mission is now complete
        if (checkMissionCompletion(updatedMission)) {
          // Mark mission as completed
          const finalMissions = updatedMissions.map(m =>
            m.id === missionId ? { ...m, status: 'completed' as const } : m
          );

          // Apply rewards
          const rewardUpdates = applyMissionRewards(state, updatedMission);

          // Apply permanent effects
          let effectUpdates: Partial<GameState> = {};
          if (updatedMission.rewards.permanentEffects) {
            effectUpdates = applyPermanentEffects(state, updatedMission.rewards.permanentEffects);
          }

          // Advance mission arc
          const arc = state.missionArcs.find(a => a.id === updatedMission.arcId);
          let updatedArcs = state.missionArcs;
          if (arc) {
            const updatedArc = advanceMissionArc(arc, updatedMission.id);
            updatedArcs = state.missionArcs.map(a =>
              a.id === updatedMission.arcId ? updatedArc : a
            );
          }

          // Trigger mission celebration
          const firstDeliver = updatedMission.objectives.find(o => o.type === 'deliver');
          const narrativeContext = {
            shipKind: state.ship.kind,
            deliveredUnits: firstDeliver?.current || firstDeliver?.quantity,
            commodityName: firstDeliver?.target,
            routeStart: state.stations.find(s => s.id === state.ship.dockedStationId)?.name,
            routeEnd: state.ship.dockedStationId ? state.stations.find(s => s.id === state.ship.dockedStationId)?.name : undefined,
            enemiesDestroyed: 0,
            stealthUsed: state.stealthStates.get(updatedMission.id)?.detected === false,
            trustTiers: getTrustTiersSnapshot(state.relationships),
          };
          const missionCelebrationData: GameState['missionCelebrationData'] = {
            missionId: updatedMission.id,
            credits: updatedMission.rewards.credits,
            reputationChanges: updatedMission.rewards.reputationChanges,
            narrativeContext,
          };

          // Apply trust deltas and possibly grant assist token
          const now = Date.now();
          let relationships = { ...(state.relationships || {}) };
          let allyAssistTokens = [...(state.allyAssistTokens || [])];
          const deltas = computeTrustDeltas(updatedMission.id, narrativeContext);
          for (const { by, delta } of deltas) {
            const before = relationships[by];
            const beforeTier = before?.tier ?? 0;
            const after = setTrust(before, delta, now);
            relationships[by] = after;
            const crossedToSupporter = beforeTier < 1 && after.tier >= 1;
            const eligible = canGrantToken(now, after, allyAssistTokens, by, 3, 60_000);
            const prob = crossedToSupporter ? 1.0 : after.tier >= 1 ? 0.15 : 0;
            if (eligible && prob > 0 && maybeProbabilityGrant(prob)) {
              const preset = defaultAssistForStation(by);
              const token = grantAssist(by, preset.type, preset.description, now);
              allyAssistTokens.push(token);
              relationships[by] = { ...after, lastAssistGrantedAt: now };
              missionCelebrationData.allyAssistUnlocked = { by, type: preset.type, description: preset.description };
            }
          }

          console.log(`Mission completed: ${updatedMission.title}`);

          return {
            missions: finalMissions,
            missionArcs: updatedArcs,
            missionCelebrationData,
            relationships,
            allyAssistTokens,
            missionInstallState: undefined,
            ...rewardUpdates,
            ...effectUpdates,
          } as Partial<GameState> as GameState;
        }

        return {
          missions: updatedMissions,
          missionInstallState: undefined,
        } as Partial<GameState> as GameState;
      } else {
        // Failed! Hold duration was outside acceptable range
        const failedMissions = state.missions.map(m =>
          m.id === missionId ? { ...m, status: 'failed' as const } : m
        );

        const addNotification = get().addNotification;
        const reason = holdDuration < MIN_HOLD_TIME 
          ? 'Device installation interrupted (released too early)' 
          : 'Device installation took too long (detected)';
        addNotification({
          type: 'error',
          message: `Mission failed: ${reason}`,
          duration: 5000,
        });

        console.log(`Mission failed: ${mission.title} - ${reason}`);

        return {
          missions: failedMissions,
          missionInstallState: undefined,
        } as Partial<GameState> as GameState;
      }
    }),

  // Notification actions
  addNotification: (notif) =>
    set(state => {
      const notification: Notification = {
        ...createNotification(notif.type, notif.message, notif.duration),
      };
      return {
        notifications: [...(state.notifications || []), notification],
      } as Partial<GameState> as GameState;
    }),

  dismissNotification: (id) =>
    set(state => {
      return {
        notifications: (state.notifications || []).filter(n => n.id !== id),
      } as Partial<GameState> as GameState;
    }),

  // ============ DEBUG ACTIONS (only for test mode) ============
  debugSetCredits: (credits: number) =>
    set(state => {
      if (!state.isTestMode) return state;
      return {
        ship: { ...state.ship, credits: Math.max(0, credits) },
      } as Partial<GameState> as GameState;
    }),

  debugSetReputation: (stationId: string, rep: number) =>
    set(state => {
      if (!state.isTestMode) return state;
      const clampedRep = Math.max(0, Math.min(100, rep));
      return {
        stations: state.stations.map(s =>
          s.id === stationId ? { ...s, reputation: clampedRep } : s
        ),
      } as Partial<GameState> as GameState;
    }),

  debugSetAllReputation: (rep: number) =>
    set(state => {
      if (!state.isTestMode) return state;
      const clampedRep = Math.max(0, Math.min(100, rep));
      return {
        stations: state.stations.map(s => ({ ...s, reputation: clampedRep })),
      } as Partial<GameState> as GameState;
    }),

  debugAddCargo: (commodityId: string, quantity: number) =>
    set(state => {
      if (!state.isTestMode) return state;
      const currentCargo = { ...state.ship.cargo };
      const currentQty = currentCargo[commodityId] || 0;
      const newQty = Math.max(0, currentQty + quantity);
      if (newQty === 0) {
        delete currentCargo[commodityId];
      } else {
        currentCargo[commodityId] = newQty;
      }
      return {
        ship: { ...state.ship, cargo: currentCargo },
      } as Partial<GameState> as GameState;
    }),

  debugClearCargo: () =>
    set(state => {
      if (!state.isTestMode) return state;
      return {
        ship: { ...state.ship, cargo: {} },
      } as Partial<GameState> as GameState;
    }),

  debugSetShipStat: (stat: 'acc' | 'vmax' | 'drag', value: number) =>
    set(state => {
      if (!state.isTestMode) return state;
      return {
        ship: {
          ...state.ship,
          stats: { ...state.ship.stats, [stat]: Math.max(0.1, value) },
        },
      } as Partial<GameState> as GameState;
    }),

  debugSetMaxCargo: (maxCargo: number) =>
    set(state => {
      if (!state.isTestMode) return state;
      return {
        ship: { ...state.ship, maxCargo: Math.max(10, maxCargo) },
      } as Partial<GameState> as GameState;
    }),

  debugSetHp: (hp: number) =>
    set(state => {
      if (!state.isTestMode) return state;
      return {
        ship: { ...state.ship, hp: Math.max(0, Math.min(state.ship.maxHp, hp)) },
      } as Partial<GameState> as GameState;
    }),

  debugSetEnergy: (energy: number) =>
    set(state => {
      if (!state.isTestMode) return state;
      return {
        ship: { ...state.ship, energy: Math.max(0, Math.min(state.ship.maxEnergy, energy)) },
      } as Partial<GameState> as GameState;
    }),

  debugToggleUpgrade: (upgrade: 'canMine' | 'hasNavigationArray' | 'hasUnionMembership' | 'hasMarketIntel' | 'hasTradeLedger' | 'hasTempCargo' | 'hasShieldedCargo') =>
    set(state => {
      if (!state.isTestMode) return state;
      return {
        ship: { ...state.ship, [upgrade]: !state.ship[upgrade] },
      } as Partial<GameState> as GameState;
    }),

  debugSetMissionArcStage: (arcId: string, stage: number, status?: 'locked' | 'available' | 'in_progress' | 'completed') =>
    set(state => {
      if (!state.isTestMode) return state;
      const clampedStage = Math.max(1, Math.min(4, stage));
      
      // Update the arc:
      // 1. Clear completedMissions for stages >= clampedStage (so they can be re-tested)
      // 2. Add all missions from stages < clampedStage to completedMissions (to satisfy prerequisites)
      const updatedArcs = state.missionArcs.map(arc => {
        if (arc.id !== arcId) return arc;
        
        // Get all mission IDs from prior stages that should be marked as completed
        const priorStageMissionIds: string[] = [];
        for (let s = 1; s < clampedStage; s++) {
          const templates = getMissionTemplatesByStage(arcId, s);
          for (const template of templates) {
            priorStageMissionIds.push(template.id);
          }
        }
        
        // Filter out completed missions that are at or after the new stage
        // This allows the player to re-test those missions
        const filteredCompletedMissions = arc.completedMissions.filter(missionId => {
          // Check if this mission is at stage >= clampedStage
          // Mission IDs follow pattern: arcId_stage_N or similar
          const stageMatch = missionId.match(/_stage_(\d+)/);
          if (stageMatch) {
            const missionStage = parseInt(stageMatch[1], 10);
            return missionStage < clampedStage;
          }
          return true; // Keep missions we can't parse
        });
        
        // Merge prior stage missions with filtered completed missions (avoid duplicates)
        const completedSet = new Set(filteredCompletedMissions);
        for (const missionId of priorStageMissionIds) {
          completedSet.add(missionId);
        }
        
        return {
          ...arc,
          currentStage: clampedStage,
          status: status ?? arc.status,
          completedMissions: Array.from(completedSet),
        };
      });
      
      // Regenerate missions for all stations to pick up the new arc state
      // First, remove all offered missions from the changed arc (so they can be regenerated)
      const missionsWithoutOfferedFromArc = state.missions.filter(
        m => !(m.arcId === arcId && m.status === 'offered')
      );
      
      // Build player state for mission generation
      const playerReputation: Record<string, number> = {};
      state.stations.forEach(s => {
        playerReputation[s.id] = s.reputation ?? 0;
      });
      const playerUpgrades: string[] = [];
      if (state.ship.hasNavigationArray) playerUpgrades.push('nav');
      if (state.ship.hasUnionMembership) playerUpgrades.push('union');
      if (state.ship.hasMarketIntel) playerUpgrades.push('intel');
      
      const activeMissions = missionsWithoutOfferedFromArc.filter(m => m.status === 'active');
      const completedArcIds = updatedArcs.filter(a => a.status === 'completed').map(a => a.id);
      
      // Generate new missions for all stations and collect the ones that should appear
      let allNewMissions = [...missionsWithoutOfferedFromArc];
      for (const station of state.stations) {
        const newMissions = generateMissionsForStation(
          station.id,
          playerReputation,
          playerUpgrades,
          updatedArcs,
          activeMissions,
          completedArcIds
        );
        
        // Add missions that don't already exist
        const existingIds = new Set(allNewMissions.map(m => m.id));
        for (const mission of newMissions) {
          if (!existingIds.has(mission.id)) {
            allNewMissions.push(mission);
            existingIds.add(mission.id);
          }
        }
      }
      
      return {
        missionArcs: updatedArcs,
        missions: allNewMissions,
      } as Partial<GameState> as GameState;
    }),

  debugCompleteMission: (missionId: string) =>
    set(state => {
      if (!state.isTestMode) return state;
      
      const mission = state.missions.find(m => m.id === missionId);
      if (!mission || mission.status !== 'active') return state;
      
      // Force-complete all objectives
      const completedMission = {
        ...mission,
        status: 'completed' as const,
        objectives: mission.objectives.map(o => ({
          ...o,
          current: o.quantity || 1,
          completed: true,
        })),
      };
      
      const updatedMissions = state.missions.map(m =>
        m.id === missionId ? completedMission : m
      );
      
      // Apply rewards
      const rewardUpdates = applyMissionRewards(state, completedMission);
      
      // Advance arc
      const arc = state.missionArcs.find(a => a.id === mission.arcId);
      let updatedArcs = state.missionArcs;
      if (arc) {
        const updatedArc = advanceMissionArc(arc, mission.id);
        updatedArcs = state.missionArcs.map(a =>
          a.id === mission.arcId ? updatedArc : a
        );
      }
      
      // Apply political compass update
      const politicsUpdates = applyMissionToProfile(state, mission.id, null);
      
      return {
        missions: updatedMissions,
        missionArcs: updatedArcs,
        ...rewardUpdates,
        ...politicsUpdates,
      } as Partial<GameState> as GameState;
    }),

  debugFailMission: (missionId: string) =>
    set(state => {
      if (!state.isTestMode) return state;
      
      const mission = state.missions.find(m => m.id === missionId);
      if (!mission || mission.status !== 'active') return state;
      
      // Mark mission as failed
      const failedMission = {
        ...mission,
        status: 'failed' as const,
      };
      
      const updatedMissions = state.missions.map(m =>
        m.id === missionId ? failedMission : m
      );
      
      // Apply 50% political compass score for failed missions (you tried!)
      const politicsUpdates = applyMissionToProfile(state, mission.id, null, 0.5);
      
      return {
        missions: updatedMissions,
        ...politicsUpdates,
      } as Partial<GameState> as GameState;
    }),
}));

