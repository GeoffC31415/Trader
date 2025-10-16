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
import { shipCaps } from '../domain/constants/ship_constants';
import {
  WEAPON_BASE_STATS,
  WEAPON_COSTS,
  WEAPON_UPGRADE_COSTS,
  WEAPON_UPGRADE_BONUSES,
  PLAYER_MAX_HP,
  PLAYER_MAX_ENERGY,
} from '../domain/constants/weapon_constants';
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
import { checkMissionCompletion, checkMissionFailure, updateMissionObjectives, type MissionEvent } from '../systems/missions/mission_validator';
import { applyMissionRewards, advanceMissionArc, canAcceptMission, applyPermanentEffects } from './helpers/mission_helpers';
import { applyChoicePermanentEffects } from '../systems/missions/choice_system';
import { gatedCommodities, getPriceBiasForStation } from '../systems/economy/pricing';
import { findRecipeForStation } from '../systems/economy/recipes';
import type { GameState, Ship, Station, Objective, Contract, NpcTrader } from '../domain/types/world_types';
import type { ShipWeapon } from '../domain/types/combat_types';
import type { Mission } from '../domain/types/mission_types';

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
  buyCommodity,
  sellCommodity,
  processCommodity,
  upgradeShip,
} from './modules/economy';
import {
  updateMissionsInTick,
  generateContracts as generateContractsModule,
  acceptContractAction,
  abandonContractAction,
  acceptMissionAction,
  abandonMissionAction,
} from './modules/missions';

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
  // Mission arcs system
  missionArcs: initializeMissionArcs(),
  missions: [],
  stealthStates: new Map(),
  escortStates: new Map(),

  // Route suggestions (now delegated to economy module)
  getSuggestedRoutes: (opts) => {
    const state = get();
    return getSuggestedRoutes(state.stations, state.ship, opts);
  },

  // Tick - orchestrates all subsystems
  tick: (dt) =>
    set(state => {
      // 1. Physics - update ship movement
      let ship = updatePhysics(state.ship, dt);

      // 2. Economy - jitter prices
      let stations = jitterPrices(state.stations, dt);

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

      // Apply reputation changes from combat
      for (const repChange of combatResult.reputationChanges) {
        stations = applyReputationWithPropagation(
          stations,
          repChange.stationId,
          repChange.delta
        );
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

      return {
        ship,
        stations,
        npcTraders: missionResult.npcTraders,
        projectiles: combatResult.projectiles,
        npcAggression: combatResult.npcAggression,
        npcLastFireTimes: combatResult.npcLastFireTimes,
        missions: missionResult.missions,
        missionArcs: missionResult.missionArcs,
        stealthStates: missionResult.stealthStates,
        escortStates: missionResult.escortStates,
      } as Partial<GameState> as GameState;
    }),

  // Physics actions
  thrust: (dir, dt) =>
    set(state => {
      if (!state.hasChosenStarter) return state;
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
      if (state.ship.dockedStationId) return state;
      const near = state.stations.find(
        s => distance(s.position, state.ship.position) < 6 * SCALE
      );
      if (!near) return state;

      // Check if station is hostile or closed
      if (!canDockAtStation(near)) {
        console.log(
          `Cannot dock at ${near.name}: ${
            isStationHostile(near) ? 'Station is hostile' : 'Station is closed'
          }`
        );
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

      const activeMissions = state.missions.filter(m => m.status === 'active');
      const newMissions = generateMissionsForStation(
        near.id,
        playerReputation,
        playerUpgrades,
        state.missionArcs,
        activeMissions,
        state.missionArcs.filter(a => a.status === 'completed').map(a => a.id)
      );

      // Merge with existing missions (don't duplicate)
      const existingMissionIds = new Set(state.missions.map(m => m.id));
      const missionsToAdd = newMissions.filter(m => !existingMissionIds.has(m.id));
      const updatedMissions = [...state.missions, ...missionsToAdd];

      const next: Partial<GameState> = {
        ship: {
          ...state.ship,
          dockedStationId: near.id,
          velocity: [0, 0, 0],
        } as Ship,
        dockIntroVisibleId: near.id,
        missions: updatedMissions,
      };

      if (state.tutorialActive) {
        if (state.tutorialStep === 'dock_city' && near.type === 'city') {
          (next as any).tutorialStep = 'accept_mission';
        } else if (state.tutorialStep === 'goto_refinery' && near.id === 'sol-refinery') {
          (next as any).tutorialStep = 'buy_fuel';
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

  undock: () =>
    set(state => {
      if (!state.hasChosenStarter) return state;
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
      if (state.ship.dockedStationId) return state;
      if (!state.ship.canMine) return state;

      const belts = state.belts;
      const near = belts.find(b => {
        const d = distance(state.ship.position, b.position);
        return Math.abs(d - b.radius) < 6 * SCALE;
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

  // Economy actions - delegated to economy module
  buy: (commodityId, quantity) =>
    set(state => {
      const activeContract = (state.contracts || []).find(
        c => c.status === 'accepted' && c.commodityId === commodityId
      );

      const result = buyCommodity(
        state.ship,
        state.stations,
        state.npcTraders,
        state.avgCostByCommodity,
        commodityId,
        quantity,
        activeContract
      );

      if (!result) return state;

      const tradeLog = [...state.tradeLog, result.trade];
      const next: Partial<GameState> = {
        ship: result.ship,
        stations: result.stations,
        npcTraders: result.npcTraders,
        avgCostByCommodity: result.avgCostByCommodity,
        tradeLog,
      };

      if (
        state.tutorialActive &&
        state.tutorialStep === 'buy_fuel' &&
        commodityId === 'refined_fuel'
      ) {
        (next as any).tutorialStep = 'deliver_fuel';
      }

      return next as Partial<GameState> as GameState;
    }),

  sell: (commodityId, quantity) =>
    set(state => {
      const activeContract = (state.contracts || []).find(
        c =>
          c.status === 'accepted' &&
          c.toId === state.ship.dockedStationId &&
          c.commodityId === commodityId
      );
      const escorts = state.npcTraders.filter(
        n => n.isEscort && activeContract && n.escortingContract === activeContract.id
      );

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

      if (!result) return state;

      const station = state.stations.find(s => s.id === state.ship.dockedStationId);
      const tradeLog = [...state.tradeLog, result.trade];

      // Check for contract progress/completion
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

      // Update mission objectives for delivery missions
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

          // Trigger mission celebration with narrative
          const missionCelebrationData = {
            missionId: updatedMission.id,
            credits: updatedMission.rewards.credits,
            reputationChanges: updatedMission.rewards.reputationChanges,
          };

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
          return {
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
          } as Partial<GameState> as GameState;
        }
      }

      const next: Partial<GameState> = {
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
      };

      // Tutorial completes when contract is completed (showCelebration = contract was just completed)
      if (
        state.tutorialActive &&
        state.tutorialStep === 'deliver_fuel' &&
        commodityId === 'refined_fuel' &&
        showCelebration
      ) {
        (next as any).tutorialStep = 'done';
        (next as any).tutorialActive = false;
      }

      return next as Partial<GameState> as GameState;
    }),

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

      const basePosition: [number, number, number] = state.ship.position;
      const baseVelocity: [number, number, number] = [0, 0, 0];
      let next: Ship | undefined;

      if (kind === 'freighter') {
        next = {
          position: basePosition,
          velocity: baseVelocity,
          credits: state.ship.credits - cost,
          cargo: {},
          maxCargo: 300,
          canMine: state.ship.canMine,
          enginePower: 0,
          engineTarget: 0,
          hasNavigationArray: state.ship.hasNavigationArray,
          hasUnionMembership: state.ship.hasUnionMembership,
          hasMarketIntel: state.ship.hasMarketIntel,
          kind: 'freighter',
          stats: { acc: 10, drag: 1.0, vmax: 11 },
          weapon: state.ship.weapon,
          hp: PLAYER_MAX_HP,
          maxHp: PLAYER_MAX_HP,
          energy: PLAYER_MAX_ENERGY,
          maxEnergy: PLAYER_MAX_ENERGY,
        };
      } else if (kind === 'clipper') {
        next = {
          position: basePosition,
          velocity: baseVelocity,
          credits: state.ship.credits - cost,
          cargo: {},
          maxCargo: 60,
          canMine: state.ship.canMine,
          enginePower: 0,
          engineTarget: 0,
          hasNavigationArray: state.ship.hasNavigationArray,
          hasUnionMembership: state.ship.hasUnionMembership,
          hasMarketIntel: state.ship.hasMarketIntel,
          kind: 'clipper',
          stats: { acc: 18, drag: 0.9, vmax: 20 },
          weapon: state.ship.weapon,
          hp: PLAYER_MAX_HP,
          maxHp: PLAYER_MAX_HP,
          energy: PLAYER_MAX_ENERGY,
          maxEnergy: PLAYER_MAX_ENERGY,
        };
      } else if (kind === 'miner') {
        next = {
          position: basePosition,
          velocity: baseVelocity,
          credits: state.ship.credits - cost,
          cargo: {},
          maxCargo: 80,
          canMine: true,
          enginePower: 0,
          engineTarget: 0,
          hasNavigationArray: state.ship.hasNavigationArray,
          hasUnionMembership: state.ship.hasUnionMembership,
          hasMarketIntel: state.ship.hasMarketIntel,
          kind: 'miner',
          stats: { acc: 9, drag: 1.1, vmax: 11 },
          weapon: state.ship.weapon,
          hp: PLAYER_MAX_HP,
          maxHp: PLAYER_MAX_HP,
          energy: PLAYER_MAX_ENERGY,
          maxEnergy: PLAYER_MAX_ENERGY,
        };
      } else if (kind === 'heavy_freighter') {
        next = {
          position: basePosition,
          velocity: baseVelocity,
          credits: state.ship.credits - cost,
          cargo: {},
          maxCargo: 600,
          canMine: state.ship.canMine,
          enginePower: 0,
          engineTarget: 0,
          hasNavigationArray: state.ship.hasNavigationArray,
          hasUnionMembership: state.ship.hasUnionMembership,
          hasMarketIntel: state.ship.hasMarketIntel,
          kind: 'heavy_freighter',
          stats: { acc: 9, drag: 1.0, vmax: 12 },
          weapon: state.ship.weapon,
          hp: PLAYER_MAX_HP,
          maxHp: PLAYER_MAX_HP,
          energy: PLAYER_MAX_ENERGY,
          maxEnergy: PLAYER_MAX_ENERGY,
        };
      } else if (kind === 'racer') {
        next = {
          position: basePosition,
          velocity: baseVelocity,
          credits: state.ship.credits - cost,
          cargo: {},
          maxCargo: 40,
          canMine: state.ship.canMine,
          enginePower: 0,
          engineTarget: 0,
          hasNavigationArray: state.ship.hasNavigationArray,
          hasUnionMembership: state.ship.hasUnionMembership,
          hasMarketIntel: state.ship.hasMarketIntel,
          kind: 'racer',
          stats: { acc: 24, drag: 0.85, vmax: 28 },
          weapon: state.ship.weapon,
          hp: PLAYER_MAX_HP,
          maxHp: PLAYER_MAX_HP,
          energy: PLAYER_MAX_ENERGY,
          maxEnergy: PLAYER_MAX_ENERGY,
        };
      } else if (kind === 'industrial_miner') {
        next = {
          position: basePosition,
          velocity: baseVelocity,
          credits: state.ship.credits - cost,
          cargo: {},
          maxCargo: 160,
          canMine: true,
          enginePower: 0,
          engineTarget: 0,
          hasNavigationArray: state.ship.hasNavigationArray,
          hasUnionMembership: state.ship.hasUnionMembership,
          hasMarketIntel: state.ship.hasMarketIntel,
          kind: 'industrial_miner',
          stats: { acc: 10, drag: 1.05, vmax: 12 },
          weapon: state.ship.weapon,
          hp: PLAYER_MAX_HP,
          maxHp: PLAYER_MAX_HP,
          energy: PLAYER_MAX_ENERGY,
          maxEnergy: PLAYER_MAX_ENERGY,
        };
      }

      next = { ...next!, dockedStationId: state.ship.dockedStationId } as Ship;
      return { ship: next } as Partial<GameState> as GameState;
    }),

  // Starter selection
  chooseStarter: (kind, opts) =>
    set(state => {
      const basePosition: [number, number, number] = state.ship.position;
      const baseVelocity: [number, number, number] = [0, 0, 0];
      const baseWeapon: ShipWeapon = {
        ...WEAPON_BASE_STATS.laser,
        damageLevel: 0,
        fireRateLevel: 0,
        rangeLevel: 0,
      };

      if (kind === 'freighter') {
        const ship: Ship = {
          position: basePosition,
          velocity: baseVelocity,
          credits: 10000,
          cargo: {},
          maxCargo: 300,
          canMine: false,
          enginePower: 0,
          engineTarget: 0,
          hasNavigationArray: false,
          hasUnionMembership: false,
          hasMarketIntel: false,
          kind: 'freighter',
          stats: { acc: 10, drag: 1.0, vmax: 11 },
          weapon: baseWeapon,
          hp: PLAYER_MAX_HP,
          maxHp: PLAYER_MAX_HP,
          energy: PLAYER_MAX_ENERGY,
          maxEnergy: PLAYER_MAX_ENERGY,
        };
        return {
          ship,
          hasChosenStarter: true,
          tutorialActive: !!opts?.tutorial,
          tutorialStep: 'dock_city',
        } as Partial<GameState> as GameState;
      }

      if (kind === 'clipper') {
        const ship: Ship = {
          position: basePosition,
          velocity: baseVelocity,
          credits: 10000,
          cargo: {},
          maxCargo: 60,
          canMine: false,
          enginePower: 0,
          engineTarget: 0,
          hasNavigationArray: false,
          hasUnionMembership: false,
          hasMarketIntel: false,
          kind: 'clipper',
          stats: { acc: 18, drag: 0.9, vmax: 20 },
          weapon: baseWeapon,
          hp: PLAYER_MAX_HP,
          maxHp: PLAYER_MAX_HP,
          energy: PLAYER_MAX_ENERGY,
          maxEnergy: PLAYER_MAX_ENERGY,
        };
        return {
          ship,
          hasChosenStarter: true,
          tutorialActive: !!opts?.tutorial,
          tutorialStep: 'dock_city',
        } as Partial<GameState> as GameState;
      }

      if ((kind as any) === 'test') {
        // Spawn a racer with all upgrades and max caps for testing
        const credits = 999999;
        const kindR: Ship['kind'] = 'racer';
        const testWeapon: ShipWeapon = {
          ...WEAPON_BASE_STATS.railgun,
          damageLevel: 5,
          fireRateLevel: 3,
          rangeLevel: 3,
        };
        const ship: Ship = {
          position: basePosition,
          velocity: baseVelocity,
          credits,
          cargo: {},
          maxCargo: shipCaps[kindR].cargo,
          canMine: true,
          enginePower: 0,
          engineTarget: 0,
          hasNavigationArray: true,
          hasUnionMembership: true,
          hasMarketIntel: true,
          kind: kindR,
          stats: { acc: shipCaps[kindR].acc * 2, drag: 0.85, vmax: shipCaps[kindR].vmax * 2 },
          weapon: testWeapon,
          hp: PLAYER_MAX_HP,
          maxHp: PLAYER_MAX_HP,
          energy: PLAYER_MAX_ENERGY,
          maxEnergy: PLAYER_MAX_ENERGY,
        };

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
          tutorialActive: false,
          tutorialStep: 'dock_city',
        } as Partial<GameState> as GameState;
      }

      const ship: Ship = {
        position: basePosition,
        velocity: baseVelocity,
        credits: 0,
        cargo: {},
        maxCargo: 80,
        canMine: true,
        enginePower: 0,
        engineTarget: 0,
        hasNavigationArray: false,
        hasUnionMembership: false,
        hasMarketIntel: false,
        kind: 'miner',
        stats: { acc: 9, drag: 1.1, vmax: 11 },
        weapon: baseWeapon,
        hp: PLAYER_MAX_HP,
        maxHp: PLAYER_MAX_HP,
        energy: PLAYER_MAX_ENERGY,
        maxEnergy: PLAYER_MAX_ENERGY,
      };
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
        (next as any).tutorialStep = 'dock_city';
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
        (next as any).tutorialStep = 'goto_refinery';
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
      if (weaponKind !== 'laser' && weaponKind !== 'railgun' && weaponKind !== 'missile') {
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

      for (const mission of activeMissions) {
        // Check for failure conditions
        const failureCheck = checkMissionFailure(mission, currentTime);
        if (failureCheck.failed) {
          // Mark mission as failed
          updatedMissions = updatedMissions.map(m =>
            m.id === mission.id ? { ...m, status: 'failed' as const } : m
          );
          console.log(`Mission failed: ${mission.title} - ${failureCheck.reason}`);
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

          // Trigger mission celebration with narrative
          const missionCelebrationData = {
            missionId: mission.id,
            credits: mission.rewards.credits,
            reputationChanges: mission.rewards.reputationChanges,
          };

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

      // Trigger mission celebration with narrative
      const missionCelebrationData = {
        missionId: mission.id,
        credits: mission.rewards.credits,
        reputationChanges: mission.rewards.reputationChanges,
      };

      return {
        missions: updatedMissions,
        missionArcs: updatedArcs,
        missionCelebrationData,
        ...rewardUpdates,
        ...effectUpdates,
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

      return {
        missions: updatedMissions,
        missionArcs: finalArcs,
        ...rewardUpdates,
        ...permanentEffectsUpdates,
      } as Partial<GameState> as GameState;
    }),
}));

