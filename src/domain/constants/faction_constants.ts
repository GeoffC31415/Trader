/**
 * Faction system constants
 * Defines factions, their member stations, and reputation thresholds
 */

export type FactionId = 'sol_government' | 'workers' | 'corporate' | 'pirate';

export type Faction = {
  id: FactionId;
  name: string;
  description: string;
  memberStations: string[]; // station IDs
  color: string; // UI display color
};

/**
 * All factions in the game
 */
export const FACTIONS: Record<FactionId, Faction> = {
  sol_government: {
    id: 'sol_government',
    name: 'Sol Government',
    description: 'The bureaucratic core of the system, focused on order and stability',
    memberStations: ['sol-city', 'sol-refinery'],
    color: '#3b82f6', // Blue
  },
  workers: {
    id: 'workers',
    name: 'Independent Workers',
    description: 'Free traders and laborers fighting for autonomy and fair wages',
    memberStations: ['greenfields', 'drydock', 'freeport'],
    color: '#10b981', // Green
  },
  corporate: {
    id: 'corporate',
    name: 'Corporate Alliance',
    description: 'Profit-driven corporations prioritizing efficiency and control',
    memberStations: ['aurum-fab', 'ceres-pp'],
    color: '#a855f7', // Purple
  },
  pirate: {
    id: 'pirate',
    name: 'Pirate Coalition',
    description: 'Outlaws and rebels operating outside the law',
    memberStations: ['hidden-cove'],
    color: '#ef4444', // Red
  },
};

/**
 * Faction reputation propagation multiplier
 * When a station's rep changes, other stations in the same faction change by this multiplier
 */
export const FACTION_PROPAGATION_MULTIPLIER = 0.5;

/**
 * Reputation thresholds for faction standings
 */
export const FACTION_REP_THRESHOLDS = {
  HOSTILE: -50, // Below this, faction is hostile (refuses docking, spawns defenders)
  UNFRIENDLY: -1, // Below this, faction is unfriendly (high prices, no contracts)
  NEUTRAL: 0, // Starting point
  FRIENDLY: 30, // Above this, faction is friendly (discounts, better contracts)
  ALLIED: 70, // Above this, faction is allied (max benefits, exclusive missions)
} as const;

/**
 * Hostile station effects
 */
export const HOSTILE_EFFECTS = {
  DOCKING_BLOCKED: true, // Cannot dock at hostile stations
  PRICE_MARKUP: 0.5, // 50% markup on all goods (if docking were allowed)
  DEFENSE_SPAWN_DISTANCE: 300, // Distance at which station spawns defenders
  DEFENDER_COUNT: 2, // Number of defenders spawned per hostile approach
} as const;

/**
 * Unfriendly station effects
 */
export const UNFRIENDLY_EFFECTS = {
  PRICE_MARKUP: 0.5, // 50% markup on purchases
  NO_CONTRACTS: true, // Cannot accept contracts
  NO_MISSIONS: true, // Cannot accept missions
} as const;

/**
 * Map of station IDs to their factions
 */
export const STATION_TO_FACTION: Record<string, FactionId> = {
  'sol-city': 'sol_government',
  'sol-refinery': 'sol_government',
  'greenfields': 'workers',
  'drydock': 'workers',
  'freeport': 'workers',
  'aurum-fab': 'corporate',
  'ceres-pp': 'corporate',
  'hidden-cove': 'pirate',
};

/**
 * Get faction for a station ID
 */
export function getFactionForStation(stationId: string): FactionId | undefined {
  return STATION_TO_FACTION[stationId];
}

/**
 * Get all stations in a faction
 */
export function getStationsInFaction(factionId: FactionId): string[] {
  return FACTIONS[factionId].memberStations;
}

/**
 * Check if two stations are in the same faction
 */
export function areInSameFaction(stationId1: string, stationId2: string): boolean {
  const faction1 = getFactionForStation(stationId1);
  const faction2 = getFactionForStation(stationId2);
  return faction1 !== undefined && faction1 === faction2;
}

