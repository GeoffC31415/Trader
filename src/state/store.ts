import { create } from 'zustand';
import type { GameState, Ship, Notification } from '../domain/types/world_types';
import type { ShipKind } from '../domain/constants/ship_kinds';
import { createShip } from '../domain/registries/ship_registry';
import { shipCaps } from '../domain/constants/ship_constants';
import { WEAPON_BASE_STATS, WEAPON_COSTS, WEAPON_UPGRADE_COSTS } from '../domain/constants/weapon_constants';
import { planets, stations as initialStations, belts } from './world';
import { spawnNpcTraders } from './npc';
import { FIRE_SUPPRESSION_COST, repairCost, updateShipFire } from '../systems/combat/ship_fire';
import { distance } from '../shared/math/vec3';
import { DOCKING_RANGE_WORLD } from '../domain/constants/game_constants';
import { dockingCandidate } from './helpers/docking';
import { canDockAtStation, isStationHostile, applyReputationWithPropagation } from '../systems/reputation/faction_system';
import { projectWorldEffects, stripPriceModifiers } from '../systems/missions/choice_system';
import { initializeMissionArcs } from '../systems/missions/mission_generator';
import { MISSION_TEMPLATES } from '../domain/constants/mission_constants';
import { updatePhysics, applyThrust, setEngineTarget as engineTarget } from './modules/physics';
import { updateNpcTraders, applyStockDeltas } from './modules/npc';
import { updateCombat, spawnHostileDefenders, firePlayerWeapon, purchasePlayerWeapon, upgradePlayerWeapon } from './modules/combat';
import { buyCommodity, sellCommodity, getSuggestedRoutes, jitterPrices, processCommodity, upgradeShip } from './modules/economy';
import { updateStationConsumption } from './modules/economy_consumption';
import { updateStationProduction } from './modules/economy_production';
import { updateCargoFreshness } from './modules/cargo_freshness';
import { recordPriceHistory, mergePriceHistory } from './modules/price_history';
import { generateMarketEvent, getActiveEvents } from '../systems/economy/market_events';
import { findRecipeForStation } from '../systems/economy/recipes';
import { getFreshnessMultiplier } from './modules/cargo_freshness';
import { generateContractOffers, contractUnitPayout, acceptContractAction, abandonContractAction, settleContracts } from './modules/missions';
import { createNotification } from './modules/notifications';
import { isSimulationBlocked } from './helpers/simulation_clock';
import { recordStationInteraction } from './helpers/character_history';
import { recordAssets, tickFinance, financeAction, transferWarehouse } from '../systems/finance';
import { storedGoods, ownedQuantity } from '../systems/inventory_ownership';
import { recordJournalTransition } from '../systems/journal';
import { SAVE_KEY, serializeGame, deserializeGame } from '../systems/persistence';
import { tickOpportunities, resolveOpportunity, requestBounty } from '../systems/travel_opportunities';
import { acceptStoryMission, retryStoryMission, chooseStoryPath, dispatchMissionEvents, settleMissions, failMission, refreshMissions, interactMission, tickStoryMissions, missionBlocker } from './modules/mission_runtime';

function notice(s: GameState, message: string, type: Notification['type'] = 'info'): GameState {
  return { ...s, notifications: [...(s.notifications ?? []).slice(-19), createNotification(type, message, 6000)] };
}

function cruiseBlocked(s: GameState): boolean {
  return s.stations.some(st => distance(st.position, s.ship.position) < 150) || s.npcTraders.some(n => (n.isHostile || n.isAggressive || s.npcAggression[n.id]?.isAggressive) && distance(n.position, s.ship.position) < 750);
}
function initialGraphicsQuality(): GameState['graphicsQuality'] {
  try { const value = localStorage.getItem('trader.graphics'); if (value === 'low' || value === 'high') return value; } catch { /* Storage may be unavailable. */ }
  return 'medium';
}
export const useGameStore = create<GameState>((rawSet, get) => {
  const set = (update: Partial<GameState> | ((s: GameState) => Partial<GameState>)) => rawSet(before => {
    const change = typeof update === 'function' ? update(before) : update;
    if (change === before) return before;
    const next = { ...before, ...change };
    if (before.ship.onFire && !next.ship.onFire) next.notifications = next.notifications?.filter(n => !n.message.startsWith('FIRE ALERT'));
    return recordJournalTransition(before, recordAssets(before, next));
  });
  return {
  economyVersion: 2,
  planets, stations: initialStations, belts, npcTraders: spawnNpcTraders(initialStations, 24),
  ship: createShip('freighter', [512, 0, 68]), gameTime: 0, paused: false, graphicsQuality: initialGraphicsQuality(),
  hasChosenStarter: false, isTestMode: false, tutorialActive: false, tutorialStep: 'dock_city',
  tradeLog: [], profitByCommodity: {}, avgCostByCommodity: {}, objectives: [], contracts: [],
  projectiles: [], lastFireTime: -Infinity, npcLastFireTimes: {}, npcAggression: {},
  missionArcs: initializeMissionArcs(), missions: [], stealthStates: new Map(), escortStates: new Map(),
  relationships: {}, allyAssistTokens: [], notifications: [], marketEvents: [],
  getSuggestedRoutes: opts => getSuggestedRoutes(get().stations, get().ship, opts),
  tick: dt => set(state => {
    if (isSimulationBlocked(state) || !Number.isFinite(dt) || dt <= 0) return state;
    dt = Math.min(dt, 0.1);
    let s: GameState = { ...state, gameTime: state.gameTime + dt };
    s = settleMissions(settleContracts(s));
    s = { ...s, npcTraders: s.npcTraders.filter(n => n.despawnAt === undefined || n.despawnAt > s.gameTime), ...projectWorldEffects(s) };
    const cruiseUnsafe = cruiseBlocked(s);
    if (s.ship.cruise && cruiseUnsafe) s = { ...s, ship: { ...s.ship, cruise: false, cruiseSpool: 0 } };
    let ship = updateCargoFreshness(updatePhysics(s.ship, dt), dt);
    const now = s.gameTime * 1000;
    const events = getActiveEvents(s.marketEvents ?? [], now);
    let stations = jitterPrices(stripPriceModifiers(s.stations), dt);
    stations = updateStationProduction(updateStationConsumption(stations, dt), dt);
    const npc = updateNpcTraders(s.npcTraders, stations, ship, dt);
    stations = applyStockDeltas(stations, npc.stationStockDelta);
    const defenseCooldowns = { ...s.defenseCooldowns };
    const protectedByRecovery = s.gameTime < (s.recoveryGraceUntil ?? 0);
    const readyStations = stations.filter(st => !protectedByRecovery && isStationHostile(st) && (st.defenseStrength ?? 1) > 0 && distance(st.position, ship.position) < 300 && s.gameTime >= (defenseCooldowns[st.id] ?? 0));
    for (const st of readyStations) defenseCooldowns[st.id] = s.gameTime + 120;
    const combat = updateCombat({ ...s, suppressNpcFire: protectedByRecovery, ship, stations, npcTraders: spawnHostileDefenders(npc.npcTraders, readyStations, ship.position, !!ship.dockedStationId), now }, dt);
    s = { ...s, defenseCooldowns };
    for (const rep of combat.reputationChanges) stations = applyReputationWithPropagation(stations, rep.stationId, rep.delta);
    s = { ...s, ...combat, combatImpacts: [...(s.combatImpacts ?? []), ...combat.combatImpacts].filter(hit => hit.at >= s.gameTime - 0.7).slice(-48), stations, marketEvents: events };
    if (s.gameTime >= (s.nextMarketEventAt ?? 120)) {
      const event = generateMarketEvent(stations);
      if (event) s = notice({ ...s, marketEvents: [...events, { ...event, startedAt: now }] }, `${event.title}: ${event.description}`);
      s = { ...s, nextMarketEventAt: s.gameTime + 300 + Math.random() * 300 };
    }
    s = { ...s, ...projectWorldEffects(s), ship: updateShipFire(s.ship, dt) };
    if (!state.ship.onFire && s.ship.onFire) s = notice(s, 'FIRE ALERT — losing 0.5 hull/s. Dock at any accessible station to extinguish, or let installed suppression activate.', 'warning');
    if (state.ship.onFire && !s.ship.onFire && s.ship.hp > 0 && !s.ship.dockedStationId) s = notice(s, 'Automatic fire suppression activated. Fire extinguished.', 'success');
    if (s.ship.hp > 0) s = tickStoryMissions(s, dt, combat.missionNpcDestroyedEvents);
    if (s.ship.hp <= 0) {
      for (const m of s.missions.filter(m => m.status === 'active')) s = failMission(s, m.id, 'Ship disabled; insurance recovery');
      const home = s.stations.find(st => canDockAtStation(st)) ?? s.stations.find(st => st.id === 'freeport') ?? s.stations[0];
      if (!canDockAtStation(home)) s = { ...s, stations: s.stations.map(st => st.id === home.id ? { ...st, reputation: 0, isHostile: false, isClosed: false } : st) };
      ship = { ...s.ship, onFire: false, fireSeconds: 0, hp: s.ship.maxHp, energy: s.ship.maxEnergy, position: [...home.position], velocity: [0, 0, 0], dockedStationId: home.id, cruise: false, cruiseSpool: 0, autopilot: false, credits: s.ship.credits * 0.5 };
      s = notice({ ...s, ship, projectiles: [], combatImpacts: [], npcAggression: {}, npcLastFireTimes: {},
        npcTraders: s.npcTraders.map(n => ({ ...n, isAggressive: false })), recoveryGraceUntil: s.gameTime + 45, dockIntroVisibleId: home.id }, 'Ship recovered. Cargo retained; 50% of ship credits lost. Bank assets remain safe. Ships stand down for 45 simulation seconds, unless you fire first. Failed missions can be retried.', 'warning');
    }
    s = tickFinance(s);
    s = tickOpportunities(s, Math.random, combat.missionNpcDestroyedEvents);
    const snapshots = recordPriceHistory(s.stations, now, s.lastPriceSnapshotTime);
    return { ...s, priceHistory: Object.keys(snapshots.priceHistory).length ? mergePriceHistory(s.priceHistory ?? {}, snapshots.priceHistory) : s.priceHistory, lastPriceSnapshotTime: snapshots.lastSnapshotTime };
  }),
  thrust: (dir, dt) => set(s => isSimulationBlocked(s) || s.ship.dockedStationId || s.ship.hp <= 0 ? s : { ship: applyThrust(s.ship, dir, dt) }),
  setEngineTarget: target => set(s => ({ ship: engineTarget(s.ship, target, !!s.ship.dockedStationId) })),
  tryDock: stationId => set(s => {
    if (!s.hasChosenStarter || s.ship.dockedStationId || s.ship.hp <= 0) return s;
    const near = dockingCandidate(s.stations, s.ship.position, stationId);
    if (!near) return notice(s, `Move within ${DOCKING_RANGE_WORLD}m of a station to dock`, 'warning');
    if (!canDockAtStation(near)) return notice(s, 'Docking denied. Mission documents and research contacts can use a local liaison within 100m.', 'warning');
    s = { ...s, stations: recordStationInteraction(s.stations, near.id, s.gameTime), ship: { ...s.ship, onFire: false, fireSeconds: 0, dockedStationId: near.id, velocity: [0, 0, 0], cruise: false, cruiseSpool: 0, autopilot: false }, dockIntroVisibleId: near.id };
    if (s.tutorialActive && s.tutorialStep === 'dock_city' && near.id === 'sol-city') {
      s = { ...s, tutorialStep: 'accept_mission' };
      s = { ...s, contracts: generateContractOffers(s) };
    }
    if (s.tutorialActive && s.tutorialStep === 'goto_refinery' && near.id === 'sol-refinery') s = { ...s, tutorialStep: 'buy_fuel' };
    s = dispatchMissionEvents(refreshMissions(s), [{ type: 'station_docked', stationId: near.id }]);
    if (near.id === 'sol-city' && (s.ship.cargo.luxury_goods ?? 0) > 0) s = dispatchMissionEvents(s, [{ type: 'detection_triggered', stationId: near.id, missionId: 'greenfields_stage_1' }]);
    return s;
  }),
  undock: () => set(s => ({ ship: { ...s.ship, dockedStationId: undefined }, dockIntroVisibleId: undefined })),
  dismissDockIntro: () => set({ dockIntroVisibleId: undefined }),
  mine: () => set(s => {
    if (!s.hasChosenStarter || s.ship.dockedStationId || !s.ship.canMine || s.ship.hp <= 0) return s;
    const belt = s.belts.find(b => Math.abs(distance(s.ship.position, b.position) - b.radius) < 60);
    if (!belt) return notice(s, 'Move near a mining belt first', 'warning');
    const room = s.ship.maxCargo - Object.values(s.ship.cargo).reduce((a, b) => a + b, 0);
    if (room < 1) return notice(s, 'Cargo hold is full', 'warning');
    const roll = Math.random();
    const ore = roll < 0.4 ? 'iron_ore' : roll < 0.7 ? 'copper_ore' : roll < 0.9 ? 'silicon' : 'rare_minerals';
    const quantity = Math.min(room, ore === 'rare_minerals' ? 1 : 3);
    const owned = ownedQuantity(s, ore);
    return dispatchMissionEvents({ ...s, avgCostByCommodity: { ...s.avgCostByCommodity, [ore]: (s.avgCostByCommodity[ore] ?? 0) * owned / (owned + quantity) }, ship: { ...s.ship, cargo: { ...s.ship.cargo, [ore]: (s.ship.cargo[ore] ?? 0) + quantity } } }, [{ type: 'commodity_acquired', commodityId: ore, quantity }]);
  }),
  buy: (commodityId, quantity) => set(input => {
    const s = settleMissions(settleContracts(input));
    if (!Number.isInteger(quantity)) return notice(s, 'Trade whole cargo units', 'warning');
    const contract = s.contracts?.find(c => c.status === 'accepted' && c.commodityId === commodityId);
    const assist = s.pendingAssist;
    const multiplier = assist?.by === s.ship.dockedStationId && (assist?.type === 'discount' || assist?.type === 'waiver' || (assist?.type === 'refuel' && commodityId === 'refined_fuel')) ? assist.multiplier : undefined;
    const result = buyCommodity(s.ship, s.stations, s.npcTraders, s.avgCostByCommodity, commodityId, quantity, contract, multiplier, storedGoods(s));
    if (!result) return notice(s, 'Purchase unavailable: check stock, credits, cargo space and required cargo equipment', 'warning');
    const purchaseCeiling = Math.min(...(s.contracts ?? []).filter(c => c.status === 'accepted' && c.commodityId === commodityId).map(contractUnitPayout));
    if (result.trade.unitPrice > purchaseCeiling) return notice(s, `Purchase blocked: this supplier charges ${result.trade.unitPrice} per unit, above an active order's guaranteed ${purchaseCeiling}. Try another supplier, fulfill that order first, or abandon it to trade speculatively.`, 'warning');
    if (commodityId === 'luxury_goods' && s.ship.dockedStationId === 'sol-city' && s.missions.some(m => m.id === 'greenfields_stage_1' && m.status === 'active')) return notice(s, 'Sol City cannot supply this covert order. Procure luxury goods elsewhere and avoid its inspections.', 'warning');
    const held = (result.ship.cargo[commodityId] ?? 0) + result.npcTraders.filter(n => n.isEscort && n.commodityId === commodityId).reduce((q, n) => q + (n.escortCargoUsed ?? 0), 0);
    const ready = contract && held >= contract.units - (contract.deliveredUnits ?? 0);
    const next = dispatchMissionEvents({ ...s, ship: result.ship, stations: recordStationInteraction(result.stations, result.trade.stationId, s.gameTime, result.trade.totalPrice), npcTraders: result.npcTraders, avgCostByCommodity: result.avgCostByCommodity,
      pendingAssist: multiplier !== undefined ? undefined : s.pendingAssist,
      objectives: ready ? s.objectives?.map(o => o.id === `obj:${contract.id}` ? { ...o, targetStationId: contract.toId } : o) : s.objectives,
      trackedStationId: ready && s.trackedStationId === contract.fromId ? contract.toId : s.trackedStationId,
      tradeLog: [...s.tradeLog, { ...result.trade, simulationTime: s.gameTime }].slice(-500), tutorialStep: s.tutorialActive && s.tutorialStep === 'buy_fuel' && contract?.id === 'tutorial:fuel' && ready ? 'deliver_fuel' : s.tutorialStep,
    }, [{ type: 'commodity_acquired', commodityId, quantity, stationId: s.ship.dockedStationId }]);
    return { ...next, ...projectWorldEffects(next) };
  }),
  sell: (commodityId, quantity) => set(input => {
    let s = settleMissions(settleContracts(input));
    if (!Number.isInteger(quantity)) return notice(s, 'Trade whole cargo units', 'warning');
    const escorts = s.npcTraders.filter(n => n.isEscort && n.commodityId === commodityId && (n.escortCargoUsed ?? 0) > 0);
    const freshness = getFreshnessMultiplier(s.ship.cargoFreshness, commodityId);
    const costBasis = s.avgCostByCommodity[commodityId] ?? 0;
    const result = sellCommodity(s.ship, s.stations, s.npcTraders, s.profitByCommodity, s.avgCostByCommodity, commodityId, quantity, escorts, storedGoods(s));
    if (!result) return notice(s, 'Sale unavailable: check cargo, destination demand and required equipment', 'warning');
    s = { ...s, ship: result.ship, stations: recordStationInteraction(result.stations, result.trade.stationId, s.gameTime, result.trade.totalPrice), npcTraders: result.npcTraders, profitByCommodity: result.profitByCommodity, avgCostByCommodity: result.avgCostByCommodity, tradeLog: [...s.tradeLog, { ...result.trade, simulationTime: s.gameTime, realizedProfit: s.avgCostByCommodity[commodityId] === undefined ? undefined : (result.profitByCommodity[commodityId] ?? 0) - (s.profitByCommodity[commodityId] ?? 0) }].slice(-500) };
    const contracts = s.contracts?.filter(c => c.status === 'accepted' && c.toId === s.ship.dockedStationId && c.commodityId === commodityId) ?? [];
    let remainingSold = quantity;
    for (const contract of contracts) {
      const delivered = Math.min(remainingSold, contract.units - (contract.deliveredUnits ?? 0));
      if (delivered <= 0) continue;
      remainingSold -= delivered;
      const total = (contract.deliveredUnits ?? 0) + delivered;
      const complete = total >= contract.units;
      const unitPrice = Math.max(result.unitSellPrice, result.unitSellPrice * (contract.sellMultiplier ?? 1), contractUnitPayout(contract) * freshness);
      const premium = Math.round(delivered * (unitPrice - result.unitSellPrice));
      const extra = premium + (complete ? contract.rewardBonus ?? 0 : 0);
      const deliveredRevenue = (contract.deliveredRevenue ?? 0) + delivered * result.unitSellPrice + premium;
      const deliveredCost = (contract.deliveredCost ?? 0) + delivered * costBasis;
      const previousReceipt = s.tradeLog[s.tradeLog.length - 1];
      const receipt = { ...previousReceipt, realizedProfit: previousReceipt.realizedProfit === undefined ? undefined : previousReceipt.realizedProfit + premium, totalPrice: previousReceipt.totalPrice + premium, unitPrice: (previousReceipt.totalPrice + premium) / quantity };
      s = { ...s, ship: { ...s.ship, credits: s.ship.credits + Math.round(extra) },
        contracts: s.contracts!.map(c => c.id === contract.id ? { ...c, deliveredUnits: total, deliveredRevenue, deliveredCost, status: complete ? 'completed' : 'accepted' } : c),
        tradeLog: [...s.tradeLog.slice(0, -1), receipt],
        profitByCommodity: { ...s.profitByCommodity, [commodityId]: (s.profitByCommodity[commodityId] ?? 0) + premium },
        activeObjectiveId: complete && s.activeObjectiveId === `obj:${contract.id}` ? undefined : s.activeObjectiveId,
        objectives: s.objectives?.map(o => o.id === `obj:${contract.id}` && complete ? { ...o, status: 'completed' } : o),
        ...(complete ? { celebrationVisible: Date.now(), celebrationBonusReward: contract.rewardBonus ?? 0, celebrationBuyCost: deliveredCost, celebrationSellRevenue: deliveredRevenue,
          tutorialStep: s.tutorialActive && s.tutorialStep === 'deliver_fuel' ? 'done' as const : s.tutorialStep } : {}),
      };
    }
    s = { ...s, npcTraders: s.npcTraders.filter(n => !n.isEscort || (n.escortCargoUsed ?? 0) > 0 || s.contracts?.some(c => c.id === n.escortingContract && c.status === 'accepted')) };
    const next = dispatchMissionEvents(s, [{ type: 'commodity_sold', commodityId, quantity, stationId: s.ship.dockedStationId }]);
    return { ...next, ...projectWorldEffects(next) };
  }),
  process: (inputId, outputs) => set(s => {
    const station = s.stations.find(st => st.id === s.ship.dockedStationId);
    const recipe = station && findRecipeForStation(station.type, inputId);
    if (station?.id === 'sol-city' && recipe?.outputId === 'luxury_goods' && s.missions.some(m => m.id === 'greenfields_stage_1' && m.status === 'active')) return notice(s, 'Sol City cannot manufacture supplies for this covert order. Use another station.', 'warning');
    const ship = processCommodity(s.ship, s.ship.dockedStationId, s.stations, inputId, outputs);
    if (!ship || !recipe) return notice(s, 'Fabrication unavailable: check inputs, equipment, membership and hold capacity', 'warning');
    const produced = (ship.cargo[recipe.outputId] ?? 0) - (s.ship.cargo[recipe.outputId] ?? 0);
    const consumed = (s.ship.cargo[inputId] ?? 0) - (ship.cargo[inputId] ?? 0);
    const owned = ownedQuantity(s, recipe.outputId);
    const avgCostByCommodity = { ...s.avgCostByCommodity, [recipe.outputId]: ((s.avgCostByCommodity[recipe.outputId] ?? 0) * owned + (s.avgCostByCommodity[inputId] ?? 0) * consumed) / (owned + produced) };
    if (ownedQuantity(s, inputId) === consumed) avgCostByCommodity[inputId] = 0;
    return dispatchMissionEvents({ ...s, ship, avgCostByCommodity }, [{ type: 'commodity_acquired', commodityId: recipe.outputId, quantity: produced, stationId: station!.id }]);
  }),
  upgrade: (type, amount, cost) => set(s => {
    const ship = upgradeShip(s.ship, s.ship.dockedStationId, s.stations, type, amount, cost);
    return ship ? refreshMissions({ ...s, ship }) : notice(s, 'Upgrade unavailable at this station, at your current cap, or with these credits', 'warning');
  }),
  replaceShip: (kind, cost) => set(s => {
    if (s.stations.find(st => st.id === s.ship.dockedStationId)?.type !== 'shipyard' || s.ship.credits < cost || Object.values(s.ship.cargo).some(q => q > 0)) return notice(s, 'Ship replacement requires an empty hold, credits and a shipyard', 'warning');
    return { ship: createShip(kind, s.ship.position, { credits: s.ship.credits - cost, dockedStationId: s.ship.dockedStationId, weapon: s.ship.weapon, hasNavigationArray: s.ship.hasNavigationArray, hasUnionMembership: s.ship.hasUnionMembership, hasMarketIntel: s.ship.hasMarketIntel, hasTradeLedger: s.ship.hasTradeLedger, hasTempCargo: s.ship.hasTempCargo, hasShieldedCargo: s.ship.hasShieldedCargo, hasFireSuppression: s.ship.hasFireSuppression }) };
  }),
  chooseStarter: (kind, opts) => set(s => {
    if (s.hasChosenStarter) return s;
    const test = kind === 'test';
    const ship = createShip(test ? 'racer' : kind as ShipKind, s.ship.position, test ? { credits: 999999, canMine: true, hasNavigationArray: true, hasUnionMembership: true, hasMarketIntel: true, hasTradeLedger: true, hasTempCargo: true, hasShieldedCargo: true, weapon: { ...WEAPON_BASE_STATS.railgun, damageLevel: 5, fireRateLevel: 3, rangeLevel: 3 } } : {});
    return { ship, hasChosenStarter: true, isTestMode: test, tutorialActive: !test && !!opts?.tutorial };
  }),
  setTutorialActive: tutorialActive => set({ tutorialActive }),
  setTutorialStep: tutorialStep => set({ tutorialStep }),
  setTrackedStation: trackedStationId => set(s => ({ trackedStationId, ship: trackedStationId ? s.ship : { ...s.ship, autopilot: false } })),
  recordDialogueShown: (stationId, lineIds) => set(s => ({ stations: s.stations.map(st => st.id !== stationId ? st : { ...st, characterMemory: {
    knownActions: [], visitCount: 0, totalTradeVolume: 0, missionsOffered: [], missionsCompleted: [], missionsFailed: [], ...st.characterMemory,
    recentDialogueIds: [...lineIds, ...(st.characterMemory?.recentDialogueIds ?? []).filter(id => !lineIds.includes(id))].slice(0, 15),
  } }) })),
  generateContracts: opts => set(s => ({ contracts: generateContractOffers(s, opts?.limit) })),
  acceptContract: id => set(input => {
    const s = settleContracts(input);
    const c = s.contracts?.find(c => c.id === id && c.status === 'offered');
    if (!c || c.expiresAt! <= s.gameTime * 1000 || c.offeredById !== s.ship.dockedStationId || (s.stations.find(st => st.id === c.offeredById)?.reputation ?? 0) < (c.requiredRep ?? 0)) return notice(s, 'Contract unavailable or reputation too low', 'warning');
    return { ...acceptContractAction(id, s.contracts!, s.objectives ?? [], s.npcTraders, s.stations, s.ship, s.gameTime * 1000), tutorialStep: s.tutorialActive && c.id === 'tutorial:fuel' ? 'goto_refinery' : s.tutorialStep };
  }),
  abandonContract: id => set(s => abandonContractAction(id, s.contracts ?? [], s.stations, s.objectives ?? [], s.npcTraders, s.activeObjectiveId)),
  acceptMission: id => set(s => {
    const reason = missionBlocker(s, id);
    return reason ? notice(s, reason, 'warning') : acceptStoryMission(s, id);
  }),
  abandonMission: id => set(s => failMission(s, id, 'Abandoned by player', true)),
  retryMission: id => set(s => retryStoryMission(s, id)),
  launchMission: id => set(s => {
    const m = s.missions.find(m => m.id === id && m.status === 'active' && m.type === 'escort');
    if (!m || m.launched) return s;
    const convoy = s.npcTraders.find(n => n.missionId === id && n.isMissionEscort);
    if (s.ship.dockedStationId || !convoy || distance(s.ship.position, convoy.position) > 200) return notice(s, 'Undock and remain within 200m of the waiting convoy before launching', 'warning');
    return { missions: s.missions.map(x => x.id === id ? { ...x, launched: true } : x),
      npcTraders: s.npcTraders.map(n => n.missionId === id ? { ...n, launched: true } : n),
      escortStates: new Map([...s.escortStates].map(([key, value]) => [key, value.missionId === id ? { ...value, lastWaveTime: s.gameTime } : value])),
    };
  }),
  checkMissionProgress: () => set(s => settleMissions(s)),
  completeMission: () => set(s => settleMissions(s)),
  makeMissionChoice: (id, choice) => set(s => chooseStoryPath(s, id, choice)),
  completeMissionObjective: (id, objective) => set(s => interactMission(s, id, objective)),
  startInstallDevice: (id, objective) => set(s => interactMission(s, id, objective)),
  stopInstallDevice: () => set(s => ({ missions: s.missions.map(m => m.interaction ? { ...m, interaction: undefined } : m), missionInstallState: undefined })),
  fireWeapon: target => set(s => {
    if (isSimulationBlocked(s) || s.ship.silentRunning || s.ship.cruise) return s;
    const result = firePlayerWeapon(s.ship, s.lastFireTime, target ?? null, s.gameTime * 1000);
    return result ? { recoveryGraceUntil: undefined, ship: result.ship, projectiles: [...s.projectiles, { ...result.projectile, targetId: s.selectedTargetId, missionId: s.npcTraders.find(n => n.id === s.selectedTargetId)?.missionId }], lastFireTime: s.gameTime * 1000 } : s;
  }),
  upgradeWeapon: (type) => set(s => {
    if (s.stations.find(st => st.id === s.ship.dockedStationId)?.type !== 'shipyard') return s;
    const ship = upgradePlayerWeapon(s.ship, type, WEAPON_UPGRADE_COSTS[type]);
    return ship ? { ship } : notice(s, 'Weapon upgrade unavailable', 'warning');
  }),
  purchaseWeapon: kind => set(s => {
    if (s.stations.find(st => st.id === s.ship.dockedStationId)?.type !== 'shipyard') return s;
    const ship = purchasePlayerWeapon(s.ship, kind, WEAPON_COSTS[kind], !!s.ship.hasMarketIntel);
    return ship ? { ship } : notice(s, 'Weapon unavailable: check credits and missile targeting upgrade', 'warning');
  }),
  bankAction: (action, amount, fundId) => set(s => financeAction(s, action, amount, fundId)),
  transferWarehouse: (commodityId, quantity, direction) => set(s => transferWarehouse(s, commodityId, quantity, direction)),
  repairShip: () => set(s => {
    if (!s.ship.dockedStationId) return s;
    const cost = repairCost(s.ship);
    return s.ship.credits >= cost ? { ship: { ...s.ship, onFire: false, fireSeconds: 0, hp: s.ship.maxHp, energy: s.ship.maxEnergy, credits: s.ship.credits - cost } } : notice(s, 'Insufficient repair credits', 'warning');
  }),
  purchaseFireSuppression: () => set(s => {
    if (s.stations.find(st => st.id === s.ship.dockedStationId)?.type !== 'shipyard' || s.ship.hasFireSuppression || s.ship.credits < FIRE_SUPPRESSION_COST) return notice(s, 'Fire suppression requires a shipyard, sufficient credits and an uninstalled system', 'warning');
    return { ship: { ...s.ship, hasFireSuppression: true, credits: s.ship.credits - FIRE_SUPPRESSION_COST, onFire: false, fireSeconds: 0 } };
  }),
  togglePause: () => set(s => ({ paused: !s.paused })),
  setGraphicsQuality: graphicsQuality => { set({ graphicsQuality }); try { localStorage.setItem('trader.graphics', graphicsQuality); } catch { /* Keep the session preference. */ } },
  toggleCruise: () => set(s => {
    if (s.paused || s.ship.dockedStationId) return s;
    if (!s.ship.cruise && cruiseBlocked(s)) return notice(s, 'Cruise requires 150m station clearance and no nearby hostiles', 'warning');
    return { ship: { ...s.ship, cruise: !s.ship.cruise, cruiseSpool: 0, silentRunning: false } };
  }),
  toggleSilentRunning: () => set(s => ({ ship: { ...s.ship, silentRunning: !s.ship.silentRunning, cruise: false, cruiseSpool: 0 } })),
  toggleAutopilot: () => set(s => s.trackedStationId && !s.ship.dockedStationId ? { ship: { ...s.ship, autopilot: !s.ship.autopilot } } : notice(s, 'Set a station waypoint and undock first', 'warning')),
  cycleTarget: () => set(s => {
    const targets = s.npcTraders.filter(n => n.hp > 0 && (n.isHostile || n.isMissionTarget) && distance(n.position, s.ship.position) < 1500).sort((a, b) => distance(a.position, s.ship.position) - distance(b.position, s.ship.position));
    const index = targets.findIndex(n => n.id === s.selectedTargetId);
    return { selectedTargetId: targets.length ? targets[(index + 1) % targets.length].id : undefined };
  }),
  saveGame: () => {
    try { if (get().hasChosenStarter) localStorage.setItem(SAVE_KEY, serializeGame(get())); }
    catch { set(s => notice(s, 'Save failed: browser storage is unavailable', 'error')); }
  },
  loadGame: () => {
    try { const text = localStorage.getItem(SAVE_KEY); if (!text) { set(s => notice(s, 'No saved campaign found', 'warning')); return; } rawSet(deserializeGame(text)); }
    catch { set(s => notice(s, 'Save is invalid or from an unsupported version; current game was not changed', 'error')); }
  },
  requestBounty: () => set(s => requestBounty(s)),
  resolveOpportunity: action => set(s => resolveOpportunity(s, action)),
  consumeAssist: (type, by) => {
    const s = get(); const token = s.allyAssistTokens?.find(t => !t.consumed && t.type === type && (!by || t.by === by));
    if (!token) return false;
    set({ allyAssistTokens: s.allyAssistTokens?.map(t => t.id === token.id ? { ...t, consumed: true } : t) }); return true;
  },
  addNotification: n => set(s => ({ notifications: [...(s.notifications ?? []).slice(-19), createNotification(n.type, n.message, n.duration)] })),
  dismissNotification: id => set(s => ({ notifications: s.notifications?.filter(n => n.id !== id) })),
  debugSetCredits: credits => set(s => s.isTestMode ? { ship: { ...s.ship, credits: Math.max(0, credits) } } : s),
  debugSetReputation: (id, reputation) => set(s => s.isTestMode ? refreshMissions({ ...s, stations: s.stations.map(st => st.id === id ? { ...st, reputation } : st) }) : s),
  debugSetAllReputation: reputation => set(s => s.isTestMode ? refreshMissions({ ...s, stations: s.stations.map(st => ({ ...st, reputation })) }) : s),
  debugAddCargo: (id, quantity) => set(s => s.isTestMode ? { ship: { ...s.ship, cargo: { ...s.ship.cargo, [id]: (s.ship.cargo[id] ?? 0) + quantity } } } : s),
  debugClearCargo: () => set(s => s.isTestMode ? { ship: { ...s.ship, cargo: {} } } : s),
  debugSetShipStat: (stat, value) => set(s => s.isTestMode ? { ship: { ...s.ship, stats: { ...s.ship.stats, [stat]: value } } } : s),
  debugSetMaxCargo: maxCargo => set(s => s.isTestMode ? { ship: { ...s.ship, maxCargo } } : s),
  debugSetHp: hp => set(s => s.isTestMode ? { ship: { ...s.ship, hp } } : s),
  debugSetEnergy: energy => set(s => s.isTestMode ? { ship: { ...s.ship, energy } } : s),
  debugToggleUpgrade: upgrade => set(s => s.isTestMode ? { ship: { ...s.ship, [upgrade]: !s.ship[upgrade] } } : s),
  debugSetMissionArcStage: (id, currentStage, status = 'in_progress') => set(s => s.isTestMode ? { missionArcs: s.missionArcs.map(a => a.id === id ? { ...a, currentStage, status } : a) } : s),
  debugCompleteMission: id => set(s => s.isTestMode ? settleMissions({ ...s, missions: s.missions.map(m => m.id === id ? { ...m, objectives: m.objectives.map(o => ({ ...o, completed: true })) } : m) }) : s),
  debugFailMission: id => set(s => s.isTestMode ? failMission(s, id, 'Developer failure') : s),
  } satisfies GameState;
});
