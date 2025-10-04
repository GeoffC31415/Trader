// Weapon system constants

import type { WeaponKind, ShipWeapon } from '../types/combat_types';

// Base weapon stats (before upgrades)
export const WEAPON_BASE_STATS: Record<WeaponKind, Omit<ShipWeapon, 'damageLevel' | 'fireRateLevel' | 'rangeLevel'>> = {
  laser: {
    kind: 'laser',
    damage: 10,
    fireRate: 2.0, // 2 shots per second
    range: 800,
    projectileSpeed: 0, // hitscan (instant)
    energyCost: 5,
  },
  plasma: {
    kind: 'plasma',
    damage: 25,
    fireRate: 1.0,
    range: 600,
    projectileSpeed: 300,
    energyCost: 10,
  },
  railgun: {
    kind: 'railgun',
    damage: 50,
    fireRate: 0.5,
    range: 1200,
    projectileSpeed: 800,
    energyCost: 15,
  },
  missile: {
    kind: 'missile',
    damage: 75,
    fireRate: 0.33,
    range: 1000,
    projectileSpeed: 200,
    energyCost: 20,
  },
};

// Weapon purchase costs
export const WEAPON_COSTS: Record<WeaponKind, number> = {
  laser: 0, // starter weapon
  plasma: 8000,
  railgun: 15000,
  missile: 25000,
};

// Weapon upgrade costs
export const WEAPON_UPGRADE_COSTS = {
  damage: 3000, // per level
  fireRate: 4000, // per level
  range: 2000, // per level
};

// Weapon upgrade bonuses per level
export const WEAPON_UPGRADE_BONUSES = {
  damage: 10, // +10 damage per level
  fireRate: 0.2, // +0.2 shots/sec per level
  range: 100, // +100 range per level
};

// Max upgrade levels
export const WEAPON_UPGRADE_MAX_LEVELS = {
  damage: 5,
  fireRate: 3,
  range: 3,
};

// Combat constants
export const PLAYER_MAX_HP = 100;
export const PLAYER_MAX_ENERGY = 100;
export const ENERGY_REGEN_RATE = 10; // per second

// NPC combat stats
export const NPC_BASE_HP = 80;
export const NPC_PIRATE_HP = 120;
export const NPC_BOUNTY_HUNTER_HP = 180;

// NPC weapon (simpler, non-upgradeable)
export const NPC_WEAPON_DAMAGE = 8;
export const NPC_WEAPON_FIRE_RATE = 1.5;
export const NPC_WEAPON_RANGE = 700;
export const NPC_WEAPON_ENERGY_COST = 5;

// Combat behavior
export const NPC_AGGRESSION_DURATION = 30000; // 30 seconds after being hit
export const NPC_ATTACK_COOLDOWN = 1000; // 1 second between attacks
export const PROJECTILE_DESPAWN_TIME = 5.0; // seconds
export const HITSCAN_INSTANT_HIT_TIME = 0.05; // seconds before hitscan hits (for visuals)

// Reputation penalties
export const REP_LOSS_PER_NPC_KILL = -10;
export const REP_LOSS_PER_HIT = -2; // just hitting, not killing

// Cargo drop on destruction
export const CARGO_DROP_PERCENTAGE = 0.5; // drop 50% of cargo


