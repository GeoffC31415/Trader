/**
 * Ship Registry - Centralized Ship Creation
 * 
 * Single source of truth for ship creation logic.
 * Eliminates duplication in chooseStarter and replaceShip actions.
 */

import type { Ship } from '../types/world_types';
import type { ShipWeapon } from '../types/combat_types';
import type { ShipKind } from '../constants/ship_kinds';
import { shipBaseStats, shipCaps } from '../constants/ship_constants';
import { WEAPON_BASE_STATS } from '../constants/weapon_constants';
import { PLAYER_MAX_HP, PLAYER_MAX_ENERGY } from '../constants/weapon_constants';

export type ShipConfig = {
  kind: ShipKind;
  displayName: string;
  description: string;
  baseCredits?: number;
  canMine: boolean;
  defaultWeapon?: ShipWeapon;
  drag?: number; // Default drag coefficient
};

/**
 * Ship registry configuration
 * Add new ships here - they'll automatically work with createShip()
 */
export const SHIP_REGISTRY: Record<ShipKind, ShipConfig> = {
  freighter: {
    kind: 'freighter',
    displayName: 'Freighter',
    description: 'Slow, high cargo capacity',
    baseCredits: 10000,
    canMine: false,
    defaultWeapon: {
      ...WEAPON_BASE_STATS.laser,
      damageLevel: 0,
      fireRateLevel: 0,
      rangeLevel: 0,
    },
    drag: 1.0,
  },
  clipper: {
    kind: 'clipper',
    displayName: 'Clipper',
    description: 'Fast, low cargo capacity',
    baseCredits: 10000,
    canMine: false,
    defaultWeapon: {
      ...WEAPON_BASE_STATS.laser,
      damageLevel: 0,
      fireRateLevel: 0,
      rangeLevel: 0,
    },
    drag: 0.9,
  },
  miner: {
    kind: 'miner',
    displayName: 'Miner',
    description: 'Slow, low acceleration, small cargo. Starts with mining rig',
    baseCredits: 0,
    canMine: true,
    defaultWeapon: {
      ...WEAPON_BASE_STATS.laser,
      damageLevel: 0,
      fireRateLevel: 0,
      rangeLevel: 0,
    },
    drag: 1.1,
  },
  heavy_freighter: {
    kind: 'heavy_freighter',
    displayName: 'Heavy Freighter',
    description: 'Very high cargo capacity, slow',
    baseCredits: undefined, // Not a starter ship
    canMine: false,
    defaultWeapon: {
      ...WEAPON_BASE_STATS.laser,
      damageLevel: 0,
      fireRateLevel: 0,
      rangeLevel: 0,
    },
    drag: 1.0,
  },
  racer: {
    kind: 'racer',
    displayName: 'Racer',
    description: 'Extremely fast, low cargo',
    baseCredits: undefined, // Not a starter ship
    canMine: false,
    defaultWeapon: {
      ...WEAPON_BASE_STATS.laser,
      damageLevel: 0,
      fireRateLevel: 0,
      rangeLevel: 0,
    },
    drag: 0.85,
  },
  industrial_miner: {
    kind: 'industrial_miner',
    displayName: 'Industrial Miner',
    description: 'High cargo mining ship',
    baseCredits: undefined, // Not a starter ship
    canMine: true,
    defaultWeapon: {
      ...WEAPON_BASE_STATS.laser,
      damageLevel: 0,
      fireRateLevel: 0,
      rangeLevel: 0,
    },
    drag: 1.05,
  },
};

/**
 * Create a ship with default configuration
 * 
 * @param kind - Ship kind from registry
 * @param position - Initial position
 * @param overrides - Optional overrides for ship properties
 * @returns New ship instance
 */
export function createShip(
  kind: ShipKind,
  position: [number, number, number],
  overrides?: Partial<Ship>
): Ship {
  const config = SHIP_REGISTRY[kind];
  const baseStats = shipBaseStats[kind];
  
  if (!config) {
    throw new Error(`Unknown ship kind: ${kind}`);
  }
  
  const defaultWeapon: ShipWeapon = config.defaultWeapon ?? {
    ...WEAPON_BASE_STATS.laser,
    damageLevel: 0,
    fireRateLevel: 0,
    rangeLevel: 0,
  };
  
  return {
    position,
    velocity: [0, 0, 0],
    credits: config.baseCredits ?? 0,
    cargo: {},
    maxCargo: baseStats.cargo,
    canMine: config.canMine,
    enginePower: 0,
    engineTarget: 0,
    hasNavigationArray: false,
    hasUnionMembership: false,
    hasMarketIntel: false,
    kind: config.kind,
    stats: {
      acc: baseStats.acc,
      drag: config.drag ?? 1.0,
      vmax: baseStats.vmax,
    },
    weapon: defaultWeapon,
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP,
    energy: PLAYER_MAX_ENERGY,
    maxEnergy: PLAYER_MAX_ENERGY,
    ...overrides,
  };
}

/**
 * Get ship configuration for UI display
 */
export function getShipConfig(kind: ShipKind): ShipConfig | undefined {
  return SHIP_REGISTRY[kind];
}

/**
 * Get all available ship kinds (for UI)
 */
export function getAllShipKinds(): ShipKind[] {
  return Object.keys(SHIP_REGISTRY) as ShipKind[];
}

