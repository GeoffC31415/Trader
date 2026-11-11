import { journalSchema, createJournal } from './journal';
import { z } from 'zod';
import type { GameState } from '../domain/types/world_types';
import { stations as initialStations } from '../state/world';
import { MISSION_TEMPLATES, MISSION_ARCS } from '../domain/constants/mission_constants';
import { WORLD_EFFECTS } from './missions/choice_system';
import { createNotification } from '../state/modules/notifications';

const finite = z.number().finite();
const amount = finite.nonnegative();
const vec = z.tuple([finite, finite, finite]);
const strings = z.array(z.string());
const amounts = z.record(amount);
const stationType = z.enum(['city', 'refinery', 'fabricator', 'power_plant', 'trading_post', 'shipyard', 'pirate', 'mine', 'farm', 'research', 'orbital_hab']);
const weaponKind = z.enum(['laser', 'plasma', 'railgun', 'missile']);
const rewards = z.object({ credits: amount, reputationChanges: z.record(finite), unlocks: strings.optional(), permanentEffects: z.array(z.string().refine(id => !!WORLD_EFFECTS[id])).optional() });
const memory = z.object({ knownActions: strings, visitCount: amount, totalTradeVolume: amount, missionsOffered: strings, missionsCompleted: strings, missionsFailed: strings, recentDialogueIds: strings }).passthrough();
const objective = z.object({
  id: z.string(), description: z.string(), type: z.enum(['deliver', 'collect', 'visit', 'destroy', 'escort', 'defend', 'wait', 'avoid_detection']),
  target: z.string().optional(), targetStation: z.string().optional(), quantity: amount.optional(), current: amount,
  completed: z.boolean(), failed: z.boolean().optional(), optional: z.boolean().optional(), prerequisites: strings.optional(), basket: strings.optional(), missionItem: z.boolean().optional(),
});
const mission = z.object({
  id: z.string().refine(id => !!MISSION_TEMPLATES[id]), arcId: z.string(), title: z.string(), description: z.string(),
  type: z.enum(['delivery', 'combat', 'stealth', 'choice', 'collection', 'escort', 'investigation']), stage: amount.int().positive(),
  status: z.enum(['offered', 'active', 'completed', 'failed', 'cancelled']), objectives: z.array(objective), rewards,
  availableAt: strings, requiredRep: z.record(finite).optional(), acceptedAt: amount.optional(), timeLimit: amount.optional(),
  items: amounts.optional(), seenEvents: strings.optional(), fundingGranted: z.boolean().optional(), attempt: amount.optional(), launched: z.boolean().optional(),
  procurementBudget: amount.optional(), procurementValue: amount.optional(), procurementReimbursed: amount.optional(),
  interaction: z.object({ objectiveId: z.string(), elapsed: amount }).optional(),
  choiceOptions: z.array(z.object({ id: z.string(), label: z.string(), description: z.string(), consequences: strings, rewards, nextMissionId: z.string().optional() })).optional(),
}).passthrough().refine(m => {
  const t = MISSION_TEMPLATES[m.id];
  return t && m.arcId === t.arcId && m.stage === t.stage && m.objectives.length === t.objectiveTemplates.length && m.objectives.every(o => t.objectiveTemplates.some(expected => expected.id === o.id && expected.type === o.type));
}, 'Mission contract does not match the registered catalog');
const schema = z.object({
  version: z.literal(1),
  data: z.object({
    gameTime: amount,
    economyVersion: z.literal(2).optional(),
    journal: journalSchema.optional(),
    ship: z.object({
      position: vec, velocity: vec, credits: amount, cargo: amounts, maxCargo: amount,
      hp: amount, maxHp: amount.positive(), energy: amount, maxEnergy: amount.positive(),
      kind: z.enum(['freighter', 'clipper', 'miner', 'heavy_freighter', 'racer', 'industrial_miner']),
      stats: z.object({ acc: amount, drag: amount, vmax: amount }), canMine: z.boolean(), enginePower: amount, engineTarget: amount,
      weapon: z.object({ kind: weaponKind, damage: amount, fireRate: amount.positive(), range: amount, projectileSpeed: amount, energyCost: amount, damageLevel: amount, fireRateLevel: amount, rangeLevel: amount }),
      dockedStationId: z.string().optional(), cruise: z.boolean().optional(), autopilot: z.boolean().optional(), silentRunning: z.boolean().optional(), cruiseSpool: amount.optional(),
      hasNavigationArray: z.boolean().optional(), hasUnionMembership: z.boolean().optional(), hasMarketIntel: z.boolean().optional(), hasTradeLedger: z.boolean().optional(), hasTempCargo: z.boolean().optional(), hasShieldedCargo: z.boolean().optional(),
      cargoFreshness: amounts.optional(),
      onFire: z.boolean().optional(), fireSeconds: amount.optional(), hasFireSuppression: z.boolean().optional(),
    }).passthrough(),
    stations: z.array(z.object({
      id: z.string(), name: z.string(), type: stationType, position: vec, reputation: finite.optional(),
      inventory: z.record(z.object({ buy: amount, sell: amount, stock: amount.optional(), unmodifiedBuy: amount.optional(), unmodifiedSell: amount.optional(), canBuy: z.boolean().optional(), canSell: z.boolean().optional() })),
      characterMemory: memory.optional(), isHostile: z.boolean().optional(), isClosed: z.boolean().optional(),
    }).passthrough()).min(1),
    missions: z.array(mission),
    missionArcs: z.array(z.object({ id: z.string(), name: z.string(), description: z.string(), status: z.enum(['locked', 'available', 'in_progress', 'completed']), characters: strings, currentStage: amount.int().positive(), choicesMade: z.record(z.string()), completedMissions: strings }).passthrough()),
    npcTraders: z.array(z.object({
      id: z.string(), fromId: z.string(), toId: z.string(), position: vec, hp: amount, maxHp: amount.positive(),
      velocity: vec.optional(), path: z.array(vec).optional(), pathProgress: amount.optional(), pathCursor: amount.optional(), speed: amount.optional(),
      role: z.enum(['convoy', 'raider', 'turret', 'defender']).optional(), missionId: z.string().optional(), despawnAt: amount.optional(),
      isEscort: z.boolean().optional(), isMissionEscort: z.boolean().optional(), isMissionTarget: z.boolean().optional(), isHostile: z.boolean().optional(),
      escortCargoUsed: amount.optional(), escortCargoCapacity: amount.optional(),
    }).passthrough()),
    stealthStates: z.array(z.tuple([z.string(), z.object({ stationId: z.string(), suspicionLevel: amount, detected: z.boolean() })])),
    escortStates: z.array(z.tuple([z.string(), z.object({ missionId: z.string(), escortNpcId: z.string(), escortHp: amount, escortMaxHp: amount, destinationStationId: z.string(), lastWaveTime: finite, hasReachedDestination: z.boolean(), waveCount: amount, wavesCompleted: amount, spawnedPirateIds: strings, currentWavePirateIds: strings })])),
    contracts: z.array(z.object({ id: z.string(), toId: z.string(), commodityId: z.string(), units: amount.positive(), status: z.enum(['offered', 'accepted', 'completed', 'failed']), deliveredUnits: amount.optional(), expiresAt: amount.optional(), unitPayout: amount.optional(), deliveredRevenue: amount.optional(), deliveredCost: amount.optional() }).passthrough()).default([]),
    objectives: z.array(z.object({ id: z.string(), targetStationId: z.string().optional(), label: z.string(), kind: z.enum(['tutorial', 'contract', 'milestone']), status: z.enum(['active', 'completed', 'failed', 'offered']) }).passthrough()).default([]),
    tradeLog: z.array(z.object({ id: z.string(), time: amount, stationId: z.string(), commodityId: z.string(), quantity: amount, unitPrice: amount, totalPrice: amount, type: z.enum(['buy', 'sell']).optional(), simulationTime: amount.optional(), realizedProfit: finite.optional() }).passthrough()).default([]),
    profitByCommodity: z.record(finite).default({}), avgCostByCommodity: amounts.default({}),
    relationships: z.record(z.object({ score: finite, tier: z.union([z.literal(-2), z.literal(-1), z.literal(0), z.literal(1), z.literal(2)]) }).passthrough()).default({}),
    allyAssistTokens: z.array(z.object({ id: z.string(), by: z.string(), type: z.enum(['escort', 'discount', 'waiver', 'refuel', 'repair', 'fabrication_rush']), description: z.string(), consumed: z.boolean().optional() }).passthrough()).default([]),
    pendingAssist: z.object({ by: z.string(), type: z.enum(['discount', 'waiver', 'refuel']), multiplier: amount, commodityId: z.string().optional() }).optional(),
    politicalProfile: z.object({ score: z.object({ freedom: finite, labor: finite }), quadrant: z.enum(['free_worker', 'union_builder', 'libertarian', 'corporate_loyalist']), history: z.array(z.object({ missionId: z.string(), choiceId: z.string(), description: z.string(), freedomDelta: finite, laborDelta: finite, timestamp: amount, simulationTime: amount.optional() })) }).optional(),
    marketEvents: z.array(z.object({ id: z.string(), title: z.string(), description: z.string(), startedAt: amount, duration: amount, effects: z.array(z.object({ stationId: z.string().optional(), commodityId: z.string().optional(), commodityCategory: z.string().optional(), priceMultiplier: amount })) })).default([]),
    appliedEffects: z.array(z.object({ id: z.string().refine(id => !!WORLD_EFFECTS[id]), appliedAt: amount })).default([]),
    pirateAggressionMultiplier: amount.optional(), unlockedFeatures: strings.default([]), defenseCooldowns: amounts.optional(), nextMarketEventAt: amount.optional(), nextOpportunityAt: amount.optional(), nextBountyAt: amount.optional(),
    opportunity: z.object({ id: z.string(), kind: z.enum(['distress', 'salvage', 'procurement', 'bounty']), position: vec, stationId: z.string(), commodityId: z.string(), quantity: amount, reward: amount, expiresAt: amount, risky: z.boolean() }).optional(),
    recoveryGraceUntil: amount.optional(),
    trackedStationId: z.string().optional(), activeObjectiveId: z.string().optional(),
    hasChosenStarter: z.boolean(), isTestMode: z.boolean(), tutorialActive: z.boolean(), tutorialStep: z.enum(['dock_city', 'accept_mission', 'goto_refinery', 'buy_fuel', 'deliver_fuel', 'done']),
    priceHistory: z.record(z.record(z.array(z.object({ time: amount, buy: amount, sell: amount })))).optional(), lastPriceSnapshotTime: amount.optional(),
  }).refine(data => initialStations.every(st => data.stations.some(saved => saved.id === st.id && Object.keys(st.inventory).every(id => id in saved.inventory))) && Object.keys(MISSION_ARCS).every(id => data.missionArcs.some(a => a.id === id)), 'World topology or mission arcs are incomplete'),
});
// Never serialize methods or transient UI state; loading cannot replace store actions.
const keys = ['journal', 'economyVersion', 'gameTime', 'ship', 'stations', 'missions', 'missionArcs', 'npcTraders', 'contracts', 'objectives', 'tradeLog', 'profitByCommodity', 'avgCostByCommodity', 'relationships', 'allyAssistTokens', 'politicalProfile', 'marketEvents', 'nextMarketEventAt', 'appliedEffects', 'unlockedFeatures', 'pirateAggressionMultiplier', 'hasChosenStarter', 'isTestMode', 'tutorialActive', 'tutorialStep', 'trackedStationId', 'defenseCooldowns', 'opportunity', 'nextOpportunityAt', 'nextBountyAt', 'recoveryGraceUntil', 'activeObjectiveId', 'pendingAssist', 'priceHistory', 'lastPriceSnapshotTime'] as const;
export function serializeGame(s: GameState): string {
  const data = Object.fromEntries(keys.map(key => [key, s[key]]));
  return JSON.stringify({ version: 1, data: { ...data, stealthStates: [...s.stealthStates], escortStates: [...s.escortStates] } });
}
export function deserializeGame(text: string): Partial<GameState> {
  const { data } = schema.parse(JSON.parse(text));
  const values = Object.fromEntries(keys.map(key => [key, data[key]]));
  // Alpha 1 recorded sale revenue but omitted it from credits. Recover only the
  // retained sale ledger, never guesses about unlogged trades or story rewards.
  const recoveredSales = data.economyVersion === undefined ? data.tradeLog.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.totalPrice, 0) : 0;
  const credits = data.ship.credits + recoveredSales;
  if (!Number.isFinite(credits)) throw new Error('Invalid recovered credit balance');
  const restored = { ...values, economyVersion: 2, ship: { ...data.ship, credits, onFire: data.ship.dockedStationId ? false : data.ship.onFire, fireSeconds: data.ship.dockedStationId ? 0 : data.ship.fireSeconds },
    missions: data.missions.map(m => ({ ...m, description: MISSION_TEMPLATES[m.id].description })), stealthStates: new Map(data.stealthStates), escortStates: new Map(data.escortStates),
    paused: true, blockingDialog: false, selectedTargetId: undefined, combatImpacts: [], projectiles: [], npcAggression: {}, npcLastFireTimes: {}, lastFireTime: -Infinity,
    notifications: recoveredSales > 0 ? [createNotification('info', `Recovered ${recoveredSales.toLocaleString()} missing sale credits from your previous-build trade ledger.`, 15000)] : [], missionIntroVisibleId: undefined, celebrationVisible: undefined,
    dockIntroVisibleId: undefined, missionCelebrationData: undefined, missionInstallState: undefined,
  } as Partial<GameState>;
  restored.journal = data.journal ?? createJournal(restored as GameState, true);
  return restored;
}
export const SAVE_KEY = 'trader.campaign.v1';
