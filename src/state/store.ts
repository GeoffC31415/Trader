import { create } from 'zustand';
import type { GameState, Ship, Notification } from '../domain/types/world_types';
import type { ShipKind } from '../domain/constants/ship_kinds';
import { createShip } from '../domain/registries/ship_registry';
import { shipCaps } from '../domain/constants/ship_constants';
import { WEAPON_BASE_STATS, WEAPON_COSTS, WEAPON_UPGRADE_COSTS } from '../domain/constants/weapon_constants';
import { planets, stations as initialStations, belts } from './world';
import { spawnNpcTraders } from './npc';
import { distance } from '../shared/math/vec3';
import { canDockAtStation } from '../systems/reputation/faction_system';
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
import { generateContracts, acceptContractAction, abandonContractAction } from './modules/missions';
import { createNotification } from './modules/notifications';
import { acceptStoryMission, retryStoryMission, chooseStoryPath, dispatchMissionEvents, settleMissions, failMission, refreshMissions, interactMission, tickStoryMissions, missionBlocker } from './modules/mission_runtime';

function notice(s: GameState, message: string, type: Notification['type'] = 'info'): GameState {
  return { ...s, notifications: [...(s.notifications ?? []).slice(-19), createNotification(type, message, 6000)] };
}

export const useGameStore = create<GameState>((set, get) => ({
  planets, stations: initialStations, belts, npcTraders: spawnNpcTraders(initialStations, 24),
  ship: createShip('freighter', [500, 0, 80]), gameTime: 0,
  hasChosenStarter: false, isTestMode: false, tutorialActive: false, tutorialStep: 'dock_city',
  tradeLog: [], profitByCommodity: {}, avgCostByCommodity: {}, objectives: [], contracts: [],
  projectiles: [], lastFireTime: -Infinity, npcLastFireTimes: {}, npcAggression: {},
  missionArcs: initializeMissionArcs(), missions: [], stealthStates: new Map(), escortStates: new Map(),
  relationships: {}, allyAssistTokens: [], notifications: [], marketEvents: [],
  getSuggestedRoutes: opts => getSuggestedRoutes(get().stations, get().ship, opts),
  tick: dt => set(state => {
    if (!state.hasChosenStarter || !Number.isFinite(dt) || dt <= 0) return state;
    dt = Math.min(dt, 0.1);
    let s: GameState = { ...state, gameTime: state.gameTime + dt };
    s = settleMissions(s);
    let ship = updateCargoFreshness(updatePhysics(s.ship, dt), dt);
    const now = s.gameTime * 1000;
    const events = getActiveEvents(s.marketEvents ?? [], now);
    let stations = jitterPrices(s.stations, dt, events);
    stations = updateStationProduction(updateStationConsumption(stations, dt), dt);
    const npc = updateNpcTraders(s.npcTraders, stations, ship, dt);
    stations = applyStockDeltas(stations, npc.stationStockDelta);
    const combat = updateCombat({ ...s, ship, stations, npcTraders: spawnHostileDefenders(npc.npcTraders, stations, ship.position, !!ship.dockedStationId), now }, dt);
    s = { ...s, ...combat, stations, marketEvents: events };
    s = tickStoryMissions(s, dt, combat.missionNpcDestroyedEvents);
    if (s.ship.hp <= 0) {
      for (const m of s.missions.filter(m => m.status === 'active')) s = failMission(s, m.id, 'Ship disabled; insurance recovery');
      const home = s.stations.find(st => canDockAtStation(st))!;
      ship = { ...s.ship, hp: s.ship.maxHp, energy: s.ship.maxEnergy, position: [...home.position], velocity: [0, 0, 0], dockedStationId: home.id, credits: Math.max(0, s.ship.credits - Math.min(1000, s.ship.credits * 0.1)) };
      s = notice({ ...s, ship, projectiles: [], dockIntroVisibleId: home.id }, 'Ship recovered by insurance. Cargo retained; repairs cost up to 1,000 credits. Failed missions can be retried.', 'warning');
    }
    const snapshots = recordPriceHistory(s.stations, now, s.lastPriceSnapshotTime);
    return { ...s, priceHistory: snapshots.priceHistory ? mergePriceHistory(s.priceHistory ?? {}, snapshots.priceHistory) : s.priceHistory, lastPriceSnapshotTime: snapshots.lastSnapshotTime };
  }),
  thrust: (dir, dt) => set(s => !s.hasChosenStarter || s.ship.dockedStationId || s.ship.hp <= 0 ? s : { ship: applyThrust(s.ship, dir, dt) }),
  setEngineTarget: target => set(s => ({ ship: engineTarget(s.ship, target, !!s.ship.dockedStationId) })),
  tryDock: () => set(s => {
    if (!s.hasChosenStarter || s.ship.dockedStationId || s.ship.hp <= 0) return s;
    const near = s.stations.filter(st => distance(st.position, s.ship.position) < 60).sort((a, b) => distance(a.position, s.ship.position) - distance(b.position, s.ship.position))[0];
    if (!near) return notice(s, 'Move within 60m of a station to dock', 'warning');
    if (!canDockAtStation(near)) return notice(s, 'Docking denied. Mission documents and research contacts can use a local liaison within 100m.', 'warning');
    s = { ...s, ship: { ...s.ship, dockedStationId: near.id, velocity: [0, 0, 0] }, dockIntroVisibleId: near.id };
    if (s.tutorialActive && s.tutorialStep === 'dock_city' && near.id === 'sol-city') s = { ...s, tutorialStep: 'accept_mission' };
    return dispatchMissionEvents(refreshMissions(s), [{ type: 'station_docked', stationId: near.id }]);
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
    return dispatchMissionEvents({ ...s, ship: { ...s.ship, cargo: { ...s.ship.cargo, [ore]: (s.ship.cargo[ore] ?? 0) + quantity } } }, [{ type: 'commodity_acquired', commodityId: ore, quantity }]);
  }),
  buy: (commodityId, quantity) => set(input => {
    const s = settleMissions(input);
    if (!Number.isInteger(quantity)) return notice(s, 'Trade whole cargo units', 'warning');
    const contract = s.contracts?.find(c => c.status === 'accepted' && c.commodityId === commodityId);
    const result = buyCommodity(s.ship, s.stations, s.npcTraders, s.avgCostByCommodity, commodityId, quantity, contract);
    if (!result) return notice(s, 'Purchase unavailable: check stock, credits, cargo space and required cargo equipment', 'warning');
    return dispatchMissionEvents({ ...s, ship: result.ship, stations: result.stations, npcTraders: result.npcTraders, avgCostByCommodity: result.avgCostByCommodity,
      tradeLog: [...s.tradeLog, result.trade].slice(-500), tutorialStep: s.tutorialActive && s.tutorialStep === 'buy_fuel' && commodityId === 'refined_fuel' ? 'deliver_fuel' : s.tutorialStep,
    }, [{ type: 'commodity_acquired', commodityId, quantity, stationId: s.ship.dockedStationId }]);
  }),
  sell: (commodityId, quantity) => set(input => {
    let s = settleMissions(input);
    if (!Number.isInteger(quantity)) return notice(s, 'Trade whole cargo units', 'warning');
    const escorts = s.npcTraders.filter(n => n.isEscort && s.contracts?.some(c => c.id === n.escortingContract && c.commodityId === commodityId && c.status === 'accepted'));
    const result = sellCommodity(s.ship, s.stations, s.npcTraders, s.profitByCommodity, s.avgCostByCommodity, commodityId, quantity, escorts);
    if (!result) return notice(s, 'Sale unavailable: check cargo, destination demand and required equipment', 'warning');
    s = { ...s, ship: result.ship, stations: result.stations, npcTraders: result.npcTraders, profitByCommodity: result.profitByCommodity, avgCostByCommodity: result.avgCostByCommodity, tradeLog: [...s.tradeLog, result.trade].slice(-500) };
    const contract = s.contracts?.find(c => c.status === 'accepted' && c.toId === s.ship.dockedStationId && c.commodityId === commodityId);
    if (contract) {
      const delivered = Math.min(quantity, contract.units - (contract.deliveredUnits ?? 0));
      const total = (contract.deliveredUnits ?? 0) + delivered;
      const complete = total >= contract.units;
      const extra = delivered * result.unitSellPrice * Math.max(0, (contract.sellMultiplier ?? 1) - 1) + (complete ? contract.rewardBonus ?? 0 : 0);
      s = { ...s, ship: { ...s.ship, credits: s.ship.credits + Math.round(extra) },
        contracts: s.contracts!.map(c => c.id === contract.id ? { ...c, deliveredUnits: total, status: complete ? 'completed' : 'accepted' } : c),
        objectives: s.objectives?.map(o => o.id === `obj:${contract.id}` && complete ? { ...o, status: 'completed' } : o),
        ...(complete ? { celebrationVisible: Date.now(), celebrationBonusReward: contract.rewardBonus ?? 0, celebrationBuyCost: (contract.unitBuy ?? 0) * contract.units, celebrationSellRevenue: result.unitSellPrice * contract.units,
          tutorialActive: s.tutorialActive && s.tutorialStep === 'deliver_fuel' ? false : s.tutorialActive,
          tutorialStep: s.tutorialActive && s.tutorialStep === 'deliver_fuel' ? 'done' as const : s.tutorialStep } : {}),
      };
    }
    return dispatchMissionEvents(s, [{ type: 'commodity_sold', commodityId, quantity, stationId: s.ship.dockedStationId }]);
  }),
  process: (inputId, outputs) => set(s => {
    const ship = processCommodity(s.ship, s.ship.dockedStationId, s.stations, inputId, outputs);
    return ship ? { ship } : notice(s, 'Fabrication unavailable: check inputs, equipment, membership and hold capacity', 'warning');
  }),
  upgrade: (type, amount, cost) => set(s => {
    const ship = upgradeShip(s.ship, s.ship.dockedStationId, s.stations, type, amount, cost);
    return ship ? refreshMissions({ ...s, ship }) : notice(s, 'Upgrade unavailable at this station, at your current cap, or with these credits', 'warning');
  }),
  replaceShip: (kind, cost) => set(s => {
    if (s.stations.find(st => st.id === s.ship.dockedStationId)?.type !== 'shipyard' || s.ship.credits < cost || Object.values(s.ship.cargo).some(q => q > 0)) return notice(s, 'Ship replacement requires an empty hold, credits and a shipyard', 'warning');
    return { ship: createShip(kind, s.ship.position, { credits: s.ship.credits - cost, dockedStationId: s.ship.dockedStationId, weapon: s.ship.weapon, hasNavigationArray: s.ship.hasNavigationArray, hasUnionMembership: s.ship.hasUnionMembership, hasMarketIntel: s.ship.hasMarketIntel, hasTradeLedger: s.ship.hasTradeLedger, hasTempCargo: s.ship.hasTempCargo, hasShieldedCargo: s.ship.hasShieldedCargo }) };
  }),
  chooseStarter: (kind, opts) => set(s => {
    if (s.hasChosenStarter) return s;
    const test = kind === 'test';
    const ship = createShip(test ? 'racer' : kind as ShipKind, s.ship.position, test ? { credits: 999999, canMine: true, hasNavigationArray: true, hasUnionMembership: true, hasMarketIntel: true, hasTradeLedger: true, hasTempCargo: true, hasShieldedCargo: true, weapon: { ...WEAPON_BASE_STATS.railgun, damageLevel: 5, fireRateLevel: 3, rangeLevel: 3 } } : {});
    return { ship, hasChosenStarter: true, isTestMode: test, tutorialActive: !test && !!opts?.tutorial };
  }),
  setTutorialActive: tutorialActive => set({ tutorialActive }),
  setTutorialStep: tutorialStep => set({ tutorialStep }),
  setTrackedStation: trackedStationId => set({ trackedStationId }),
  recordDialogueShown: (stationId, lineIds) => set(s => ({ stations: s.stations.map(st => st.id !== stationId ? st : { ...st, characterMemory: {
    knownActions: [], visitCount: 0, totalTradeVolume: 0, missionsOffered: [], missionsCompleted: [], missionsFailed: [], ...st.characterMemory,
    recentDialogueIds: [...lineIds, ...(st.characterMemory?.recentDialogueIds ?? []).filter(id => !lineIds.includes(id))].slice(0, 15),
  } }) })),
  generateContracts: opts => set(s => ({ contracts: generateContracts(s.stations, s.contracts ?? [], s.ship, opts?.limit) })),
  acceptContract: id => set(s => {
    const c = s.contracts?.find(c => c.id === id && c.status === 'offered');
    if (!c || c.expiresAt! <= Date.now() || c.offeredById !== s.ship.dockedStationId || (s.stations.find(st => st.id === c.offeredById)?.reputation ?? 0) < (c.requiredRep ?? 0)) return notice(s, 'Contract unavailable or reputation too low', 'warning');
    return { ...acceptContractAction(id, s.contracts!, s.objectives ?? [], s.npcTraders, s.stations, s.ship), tutorialStep: s.tutorialActive ? 'goto_refinery' : s.tutorialStep };
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
    const result = firePlayerWeapon(s.ship, s.lastFireTime, target ?? null, s.gameTime * 1000);
    return result ? { ship: result.ship, projectiles: [...s.projectiles, result.projectile], lastFireTime: s.gameTime * 1000 } : s;
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
  repairShip: () => set(s => {
    if (!s.ship.dockedStationId) return s;
    const cost = Math.ceil((s.ship.maxHp - s.ship.hp) * 5);
    return s.ship.credits >= cost ? { ship: { ...s.ship, hp: s.ship.maxHp, energy: s.ship.maxEnergy, credits: s.ship.credits - cost } } : notice(s, 'Insufficient repair credits', 'warning');
  }),
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
}));
