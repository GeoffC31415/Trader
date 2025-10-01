import type { Commodity, StationInventory } from '../types/economy_types';
import type { StationType } from '../types/economy_types';

export type StationPersona = {
  id: string;
  name: string;
  title: string;
  vibe: string; // a short descriptor for tone/mood
  avatarPrompt: string; // prompt text for image generator
  lines: string[]; // general lines
  tips: string[]; // station- and system-related trading tips
  // Optional rep-tiered dialogue pools; fallback to base if empty
  lines_low?: string[];
  lines_mid?: string[];
  lines_high?: string[];
  tips_low?: string[];
  tips_mid?: string[];
  tips_high?: string[];
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
  kind: 'freighter' | 'clipper' | 'miner' | 'heavy_freighter' | 'racer' | 'industrial_miner';
  stats: {
    acc: number;
    drag: number;
    vmax: number;
  };
};

export type NpcTrader = {
  id: string;
  commodityId: Commodity['id'];
  fromId: string;
  toId: string;
  position: [number, number, number];
  speed: number;
  // Precomputed piecewise path points from current position to destination, for curved movement
  path?: [number, number, number][];
  // Index of the next waypoint in `path` to move toward
  pathCursor?: number;
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

export type GameState = {
  planets: Planet[];
  stations: Station[];
  belts: AsteroidBelt[];
  npcTraders: NpcTrader[];
  ship: Ship;
  hasChosenStarter: boolean;
  tutorialActive: boolean;
  tutorialStep: 'dock' | 'buy' | 'sell' | 'join_union' | 'fabricate_process' | 'fabricate_sell' | 'done';
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
  replaceShip: (kind: 'freighter' | 'clipper' | 'miner' | 'heavy_freighter' | 'racer' | 'industrial_miner', cost: number) => void;
  chooseStarter: (kind: 'freighter' | 'clipper' | 'miner' | 'test', opts?: { tutorial?: boolean }) => void;
  setTutorialActive: (active: boolean) => void;
  setTutorialStep: (step: GameState['tutorialStep']) => void;
  // Objectives & contracts actions
  setTrackedStation: (stationId?: string) => void;
  generateContracts: (opts?: { limit?: number }) => void;
  acceptContract: (id: string) => void;
  abandonContract: (id: string) => void;
};


