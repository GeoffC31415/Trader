import { z } from 'zod';
import type { GameState } from '../domain/types/world_types';
import { MISSION_TEMPLATES } from '../domain/constants/mission_constants';
const vec = z.tuple([z.number().finite(), z.number().finite(), z.number().finite()]);
const finite = z.number().finite();
const nonnegative = finite.nonnegative();
const schema = z.object({
  version: z.literal(1),
  data: z.object({
    gameTime: nonnegative,
    opportunity: z.object({ id: z.string(), kind: z.enum(['distress', 'salvage', 'procurement']), position: vec, stationId: z.string(), commodityId: z.string(), quantity: nonnegative, reward: nonnegative, expiresAt: nonnegative, risky: z.boolean() }).optional(),
    ship: z.object({ position: vec, velocity: vec, credits: nonnegative, cargo: z.record(nonnegative), maxCargo: nonnegative,
      hp: nonnegative, maxHp: nonnegative, energy: nonnegative, maxEnergy: nonnegative,
      kind: z.enum(['freighter', 'clipper', 'miner', 'heavy_freighter', 'racer', 'industrial_miner']),
      stats: z.object({ acc: nonnegative, drag: nonnegative, vmax: nonnegative }),
      canMine: z.boolean(), enginePower: nonnegative, engineTarget: nonnegative,
      weapon: z.object({ kind: z.enum(['laser', 'plasma', 'railgun', 'missile']), damage: nonnegative, fireRate: finite.positive(), range: nonnegative, projectileSpeed: nonnegative, energyCost: nonnegative, damageLevel: nonnegative, fireRateLevel: nonnegative, rangeLevel: nonnegative }).passthrough(),
    }).passthrough(),
    stations: z.array(z.object({ id: z.string(), position: vec, inventory: z.record(z.object({ buy: nonnegative, sell: nonnegative, stock: nonnegative.optional() }).passthrough()) }).passthrough()).min(1),
    missions: z.array(z.object({ id: z.string().refine(id => !!MISSION_TEMPLATES[id]), status: z.enum(['offered', 'active', 'completed', 'failed', 'cancelled']),
      objectives: z.array(z.object({ id: z.string(), type: z.enum(['deliver', 'collect', 'visit', 'destroy', 'escort', 'defend', 'wait', 'avoid_detection']), current: nonnegative, completed: z.boolean() }).passthrough()),
    }).passthrough()),
    missionArcs: z.array(z.object({ id: z.string(), currentStage: finite.int().positive(), choicesMade: z.record(z.string()), completedMissions: z.array(z.string()) }).passthrough()),
    npcTraders: z.array(z.object({ id: z.string(), position: vec, hp: nonnegative, maxHp: nonnegative }).passthrough()),
    stealthStates: z.array(z.tuple([z.string(), z.object({ stationId: z.string(), suspicionLevel: nonnegative, detected: z.boolean() })])),
    escortStates: z.array(z.tuple([z.string(), z.object({ missionId: z.string(), escortNpcId: z.string(), escortHp: nonnegative, escortMaxHp: nonnegative, destinationStationId: z.string(), lastWaveTime: finite, hasReachedDestination: z.boolean(), waveCount: nonnegative, wavesCompleted: nonnegative, spawnedPirateIds: z.array(z.string()), currentWavePirateIds: z.array(z.string()) }).passthrough()])),
  }).passthrough(),
});
const keys = ['gameTime', 'ship', 'stations', 'missions', 'missionArcs', 'npcTraders', 'contracts', 'objectives', 'tradeLog', 'profitByCommodity', 'avgCostByCommodity', 'relationships', 'allyAssistTokens', 'politicalProfile', 'marketEvents', 'nextMarketEventAt', 'appliedEffects', 'unlockedFeatures', 'pirateAggressionMultiplier', 'hasChosenStarter', 'isTestMode', 'tutorialActive', 'tutorialStep', 'trackedStationId', 'defenseCooldowns', 'opportunity', 'nextOpportunityAt'] as const;
export function serializeGame(s: GameState): string {
  const data = Object.fromEntries(keys.map(key => [key, s[key]]));
  return JSON.stringify({ version: 1, data: { ...data, stealthStates: [...s.stealthStates], escortStates: [...s.escortStates] } });
}
export function deserializeGame(text: string): Partial<GameState> {
  const { data } = schema.parse(JSON.parse(text));
  const values = Object.fromEntries(keys.filter(key => key in data).map(key => [key, data[key]]));
  return { ...values, stealthStates: new Map(data.stealthStates), escortStates: new Map(data.escortStates),
    paused: true, selectedTargetId: undefined, projectiles: [], npcAggression: {}, npcLastFireTimes: {}, lastFireTime: -Infinity,
    dockIntroVisibleId: undefined, missionCelebrationData: undefined, missionInstallState: undefined,
  } as Partial<GameState>;
}
export const SAVE_KEY = 'trader.campaign.v1';
