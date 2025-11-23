// Combat system types

import type { WeaponKind } from '../constants/weapon_kinds';

export type { WeaponKind };

export type ShipWeapon = {
  kind: WeaponKind;
  damage: number; // base damage per shot
  fireRate: number; // shots per second
  range: number; // effective range in world units
  projectileSpeed: number; // for leading targets (0 = hitscan/instant)
  energyCost: number; // energy per shot
  // Upgrade levels
  damageLevel: number; // 0-5
  fireRateLevel: number; // 0-3
  rangeLevel: number; // 0-3
};

export type Projectile = {
  id: string;
  ownerId: string; // ship or NPC id that fired it
  ownerType: 'player' | 'npc';
  position: [number, number, number];
  velocity: [number, number, number];
  damage: number;
  lifetime: number; // remaining seconds before despawn
  maxLifetime: number; // starting lifetime
  weaponKind: WeaponKind;
  // For homing missiles
  targetId?: string;
  homingStrength?: number;
};

export type CombatState = {
  projectiles: Projectile[];
  // Track when entities last fired (for fire rate limiting)
  lastFireTime: Record<string, number>; // entityId -> timestamp
  // Track aggression state for NPCs
  npcAggression: Record<string, NpcAggressionState>;
};

export type NpcAggressionState = {
  npcId: string;
  isAggressive: boolean;
  targetId?: string; // who they're attacking
  lastAttackedTime?: number; // when they were last hit
  attackCooldown?: number; // time until they can fire again
};

// Damage events for hit detection
export type DamageEvent = {
  targetId: string;
  targetType: 'player' | 'npc';
  damage: number;
  sourceId: string;
  sourceType: 'player' | 'npc';
};


