import type { Commodity, StationType, StationInventory } from '../domain/types/economy_types';

export type StationPersona = {
  id: string;
  name: string;
  title: string;
  vibe: string; // a short descriptor for tone/mood
  avatarPrompt: string; // prompt text for image generator
  lines: string[]; // general lines
  tips: string[]; // station- and system-related trading tips
};

export type Station = {
  id: string;
  name: string;
  type: StationType;
  position: [number, number, number];
  inventory: StationInventory;
  persona?: StationPersona;
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
};


