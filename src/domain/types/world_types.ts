import type { Commodity, StationInventory } from '../types/economy_types';
import type { StationType } from '../types/economy_types';
import type { ShipWeapon, WeaponKind } from './combat_types';
import type { Mission, MissionArc, NarrativeContext } from './mission_types';
import type { ShipKind } from '../constants/ship_kinds';
import type { CharacterMemory, DialogueLine } from './character_types';

export type StationPersona = {
  id: string;
  name: string;
  title: string;
  vibe: string; // a short descriptor for tone/mood
  avatarPrompt: string; // prompt text for image generator
  lines: string[]; // general lines (legacy)
  tips: string[]; // station- and system-related trading tips (legacy)
  // Optional rep-tiered dialogue pools; fallback to base if empty (legacy)
  lines_low?: string[];
  lines_mid?: string[];
  lines_high?: string[];
  tips_low?: string[];
  tips_mid?: string[];
  tips_high?: string[];
  // New conditional dialogue system
  dialogue?: DialogueLine[];
};

export type Station = {
  id: string;
  name: string;
  type: StationType;
  position: [number, number, number];
  inventory: StationInventory;
  persona?: StationPersona;
  // Station-specific reputation with the player (0-100). Higher means better prices/opportunities later.
  reputation?: number;
  // Mission choice consequences (Phase 5)
  isHostile?: boolean; // Station refuses docking, spawns defenders
  isClosed?: boolean; // Station is permanently closed
  // Character memory - tracks player interactions for dialogue reactivity
  characterMemory?: CharacterMemory;
};

export type Planet = {
  id: string;
  name: string;
  position: [number, number, number];
  radius: number;
  color?: string;
  isStar?: boolean;
};

export type AsteroidBelt = {
  id: string;
  name: string;
  position: [number, number, number];
  radius: number;
  tier: 'common' | 'rare';
};

export type Ship = {
  position: [number, number, number];
  velocity: [number, number, number];
  credits: number;
  cargo: Record<Commodity['id'], number>;
  maxCargo: number;
  dockedStationId?: string;
  canMine: boolean;
  enginePower: number;
  engineTarget: number;
  hasNavigationArray?: boolean;
  hasUnionMembership?: boolean;
  hasMarketIntel?: boolean;
  kind: ShipKind;
  stats: {
    acc: number;
    drag: number;
    vmax: number;
  };
  // Combat properties
  weapon: ShipWeapon;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  // Perishable goods freshness (1.0 = fresh, 0.5 = minimum, never goes below 0.5)
  cargoFreshness?: Record<Commodity['id'], number>;
};

export type NpcTrader = {
  id: string;
  commodityId?: Commodity['id']; // Optional - not all NPCs carry commodities
  fromId: string;
  toId: string;
  position: [number, number, number];
  velocity?: [number, number, number];
  speed?: number;
  cargoCapacity?: number;
  lastTradeTime?: number;
  // Precomputed piecewise path points from current position to destination, for curved movement
  path?: [number, number, number][];
  // Index of the next waypoint in `path` to move toward
  pathCursor?: number;
  pathProgress?: number;
  // Escort ship properties
  isEscort?: boolean;
  escortingContract?: string;
  escortCargoCapacity?: number;
  escortCargoUsed?: number;
  shipKind?: 'freighter' | 'clipper' | 'miner';
  // Combat properties
  hp: number;
  maxHp: number;
  isHostile?: boolean; // true for pirates, bounty hunters
  // Mission properties
  isMissionTarget?: boolean; // true if spawned for a mission
  missionId?: string; // which mission this NPC belongs to
  isMissionEscort?: boolean; // true if spawned as escort for defend missions
  isAggressive?: boolean; // true if NPC attacks on sight
  kind?: 'freighter' | 'clipper' | 'miner'; // ship visual type
};

export type TradeEntry = {
  id: string;
  time: number;
  stationId: string;
  stationName: string;
  stationType: StationType;
  commodityId: Commodity['id'];
  type: 'buy' | 'sell';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type RouteSuggestion = {
  id: string;
  kind: 'direct' | 'process';
  fromId: string;
  fromName: string;
  fromType: StationType;
  toId: string;
  toName: string;
  toType: StationType;
  viaId?: string;
  viaName?: string;
  viaType?: StationType;
  inputId: Commodity['id'];
  outputId: Commodity['id'];
  inputPerOutput: number;
  unitBuy: number;
  unitSell: number;
  unitMargin: number;
  maxUnits: number;
  tripDistance: number;
  estProfit: number;
  profitPerDistance: number;
};

export type Objective = {
  id: string;
  label: string;
  // Optional target station to assist with wayfinding
  targetStationId?: string;
  // Whether this objective is tutorial-guided or player-chosen
  kind: 'tutorial' | 'contract' | 'milestone';
  status: 'active' | 'completed' | 'failed' | 'offered';
};

export type Contract = {
  id: string;
  fromId?: string;
  toId: string;
  commodityId: Commodity['id'];
  units: number;
  deliveredUnits?: number;
  // Economic reference values captured when generated
  unitBuy?: number;
  unitSell?: number;
  rewardBonus?: number; // flat bonus on completion
  status: 'offered' | 'accepted' | 'completed' | 'failed';
  expiresAt?: number; // epoch ms
  // Mission metadata
  offeredById?: string; // station offering the mission
  requiredRep?: number; // min rep at offeredById to accept
  title?: string;
  tag?: 'emergency' | 'bulk' | 'fabrication' | 'rush' | 'standard';
  sellMultiplier?: number; // extra sell multiplier at destination for emergency missions
};

// Trust & Ally Assist system (Phase 1)
export type TrustRecord = {
  score: number; // -2..+2
  tier: -2 | -1 | 0 | 1 | 2;
  lastChangeAt?: number;
  lastAssistGrantedAt?: number;
};

export type AllyAssistToken = {
  id: string; // uid
  by: string; // stationId key (e.g., 'greenfields')
  type: 'escort' | 'discount' | 'waiver' | 'refuel' | 'repair' | 'fabrication_rush';
  description: string;
  createdAt: number;
  expiresAt?: number;
  consumed?: boolean;
};

export type GameState = {
  planets: Planet[];
  stations: Station[];
  belts: AsteroidBelt[];
  npcTraders: NpcTrader[];
  ship: Ship;
  hasChosenStarter: boolean;
  tutorialActive: boolean;
  tutorialStep: 'dock_city' | 'accept_mission' | 'goto_refinery' | 'buy_fuel' | 'deliver_fuel' | 'done';
  // Dock intro flow
  dockIntroVisibleId?: string; // station id showing intro overlay when docking
  tradeLog: TradeEntry[];
  profitByCommodity: Record<Commodity['id'], number>;
  avgCostByCommodity: Record<Commodity['id'], number>;
  // Objectives & contracts
  objectives?: Objective[];
  activeObjectiveId?: string;
  contracts?: Contract[];
  trackedStationId?: string;
  celebrationVisible?: number; // timestamp when celebration was triggered
  celebrationBuyCost?: number; // total cost of purchased goods
  celebrationSellRevenue?: number; // revenue from selling goods
  celebrationBonusReward?: number; // bonus reward for completion
  // Mission celebration data
  missionCelebrationData?: {
    missionId: string;
    credits: number;
    reputationChanges: Record<string, number>;
    narrativeContext?: NarrativeContext;
    allyAssistUnlocked?: {
      by: string; // stationId or character id
      type: 'escort' | 'discount' | 'waiver' | 'refuel' | 'repair' | 'fabrication_rush';
      description: string;
    };
  };
  // Relationships & ally assists
  relationships?: Record<string, TrustRecord>; // key by stationId or character key
  allyAssistTokens?: AllyAssistToken[];
  pendingAssist?: {
    by: string;
    type: 'discount' | 'waiver' | 'refuel';
    multiplier: number; // 1.0 for waiver
    commodityId?: string;
  };
  // Mission arcs system
  missionArcs: MissionArc[];
  missions: Mission[]; // all missions (offered, active, completed, failed)
  // Mission state tracking (Phase 4)
  stealthStates: Map<string, { stationId: string; suspicionLevel: number; detected: boolean }>;
  escortStates: Map<string, {
    missionId: string;
    escortNpcId: string;
    escortHp: number;
    escortMaxHp: number;
    destinationStationId: string;
    lastWaveTime: number;
    waveCount: number;
    hasReachedDestination: boolean;
    spawnedPirateIds: string[];
  }>;
  // Mission choice system (Phase 5)
  permanentEffects?: Array<{
    type: 'price_discount' | 'fabrication_discount' | 'production_efficiency';
    stationId: string;
    commodityCategory?: string;
    discount?: number;
    efficiency?: number;
  }>;
  timedEffects?: Array<{
    id: string;
    type: 'stock_reduction' | 'price_increase' | 'fabrication_disabled';
    targetStation?: string;
    targetStations?: string[];
    commodityCategory?: string;
    multiplier?: number;
    expiresAt: number;
  }>;
  pirateAggressionMultiplier?: number;
  unlockedFeatures?: string[];
  // Combat state
  projectiles: Array<{
    id: string;
    ownerId: string;
    ownerType: 'player' | 'npc';
    position: [number, number, number];
    velocity: [number, number, number];
    damage: number;
    lifetime: number;
    maxLifetime: number;
    weaponKind: 'laser' | 'plasma' | 'railgun' | 'missile';
  }>;
  lastFireTime: number; // player's last fire time
  npcLastFireTimes: Record<string, number>; // npcId -> last fire time
  npcAggression: Record<string, {
    npcId: string;
    isAggressive: boolean;
    targetId?: string;
    lastAttackedTime?: number;
  }>;
  getSuggestedRoutes: (opts?: { limit?: number; prioritizePerDistance?: boolean }) => RouteSuggestion[];
  tick: (dt: number) => void;
  thrust: (dir: [number, number, number], dt: number) => void;
  setEngineTarget: (target: number) => void;
  tryDock: () => void;
  undock: () => void;
  dismissDockIntro: () => void;
  mine: () => void;
  buy: (commodityId: string, quantity: number) => void;
  sell: (commodityId: string, quantity: number) => void;
  process: (inputId: string, outputs: number) => void;
  upgrade: (type: 'acc' | 'vmax' | 'cargo' | 'mining' | 'navigation' | 'union' | 'intel', amount: number, cost: number) => void;
  replaceShip: (kind: ShipKind, cost: number) => void;
  chooseStarter: (kind: ShipKind | 'test', opts?: { tutorial?: boolean }) => void;
  setTutorialActive: (active: boolean) => void;
  setTutorialStep: (step: GameState['tutorialStep']) => void;
  // Objectives & contracts actions
  setTrackedStation: (stationId?: string) => void;
  generateContracts: (opts?: { limit?: number }) => void;
  acceptContract: (id: string) => void;
  abandonContract: (id: string) => void;
  // Mission arc actions
  acceptMission: (missionId: string) => void;
  abandonMission: (missionId: string) => void;
  checkMissionProgress: () => void;
  completeMission: (missionId: string) => void;
  makeMissionChoice: (missionId: string, choiceId: string) => void;
  // Combat actions
  fireWeapon: (targetPos?: [number, number, number]) => void;
  upgradeWeapon: (upgradeType: 'damage' | 'fireRate' | 'range', cost: number) => void;
  purchaseWeapon: (weaponKind: WeaponKind, cost: number) => void;
  // Ally assists
  consumeAssist: (type: AllyAssistToken['type'], by?: string) => boolean;
  // Notifications
  notifications?: Notification[];
  addNotification: (notif: Omit<Notification, 'id' | 'createdAt'>) => void;
  dismissNotification: (id: string) => void;
  // Price history tracking
  priceHistory?: Record<string, Record<string, PriceSnapshot[]>>; // stationId -> commodityId -> snapshots
  lastPriceSnapshotTime?: number; // timestamp of last snapshot
  // Market events
  marketEvents?: MarketEvent[]; // active market events affecting prices
};

export type Notification = {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  duration?: number; // milliseconds, undefined = manual dismiss only
  createdAt: number;
};

export type PriceSnapshot = {
  time: number; // timestamp in ms
  buy: number;
  sell: number;
};

export type MarketEvent = {
  id: string;
  title: string;
  description: string;
  effects: Array<{
    stationId?: string; // specific station ID or undefined for all stations
    commodityId?: string; // specific commodity ID
    commodityCategory?: string; // category filter (e.g., 'food', 'tech')
    priceMultiplier: number; // 0.5 = 50% off, 2.0 = double price
  }>;
  startedAt: number; // timestamp in ms
  duration: number; // duration in ms
};


