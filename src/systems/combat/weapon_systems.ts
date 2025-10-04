// Weapon system logic - firing, damage calculation, projectile physics

import type { ShipWeapon, Projectile, DamageEvent } from '../../domain/types/combat_types';
import type { Ship, NpcTrader } from '../../domain/types/world_types';
import { WEAPON_BASE_STATS, WEAPON_UPGRADE_BONUSES, PROJECTILE_DESPAWN_TIME, HITSCAN_INSTANT_HIT_TIME } from '../../domain/constants/weapon_constants';
import { distance } from '../../shared/math/vec3';

// Calculate actual weapon stats including upgrades
export function getWeaponStats(weapon: ShipWeapon): ShipWeapon {
  const base = WEAPON_BASE_STATS[weapon.kind];
  return {
    ...weapon,
    damage: base.damage + (weapon.damageLevel * WEAPON_UPGRADE_BONUSES.damage),
    fireRate: base.fireRate + (weapon.fireRateLevel * WEAPON_UPGRADE_BONUSES.fireRate),
    range: base.range + (weapon.rangeLevel * WEAPON_UPGRADE_BONUSES.range),
  };
}

// Create a projectile when firing
export function createProjectile(
  weapon: ShipWeapon,
  shooterPos: [number, number, number],
  shooterVel: [number, number, number],
  targetPos: [number, number, number] | null,
  ownerId: string,
  ownerType: 'player' | 'npc'
): Projectile {
  const stats = getWeaponStats(weapon);
  const id = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Calculate direction to target or forward
  let direction: [number, number, number];
  if (targetPos) {
    const dx = targetPos[0] - shooterPos[0];
    const dy = targetPos[1] - shooterPos[1];
    const dz = targetPos[2] - shooterPos[2];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len > 0.001) {
      direction = [dx / len, dy / len, dz / len];
    } else {
      direction = [1, 0, 0]; // default forward
    }
  } else {
    // Default forward direction if no target
    direction = [1, 0, 0];
  }

  // Projectile velocity = direction * speed + shooter velocity (inheritance)
  const speed = stats.projectileSpeed;
  const velocity: [number, number, number] = [
    direction[0] * speed + shooterVel[0] * 0.5,
    direction[1] * speed + shooterVel[1] * 0.5,
    direction[2] * speed + shooterVel[2] * 0.5,
  ];

  // Hitscan weapons have very short lifetime
  const lifetime = speed === 0 ? HITSCAN_INSTANT_HIT_TIME : PROJECTILE_DESPAWN_TIME;

  return {
    id,
    ownerId,
    ownerType,
    position: [...shooterPos],
    velocity,
    damage: stats.damage,
    lifetime,
    maxLifetime: lifetime,
    weaponKind: weapon.kind,
  };
}

// Update projectile position and lifetime
export function updateProjectile(projectile: Projectile, dt: number): Projectile {
  return {
    ...projectile,
    position: [
      projectile.position[0] + projectile.velocity[0] * dt,
      projectile.position[1] + projectile.velocity[1] * dt,
      projectile.position[2] + projectile.velocity[2] * dt,
    ],
    lifetime: projectile.lifetime - dt,
  };
}

// Check if projectile hit a target (sphere collision)
export function checkProjectileCollision(
  projectile: Projectile,
  ship: Ship,
  npcs: NpcTrader[]
): DamageEvent | null {
  const hitRadius = 20; // collision radius for hits

  // Check hit on player ship
  if (projectile.ownerType === 'npc') {
    const dist = distance(projectile.position, ship.position);
    if (dist < hitRadius) {
      return {
        targetId: 'player',
        targetType: 'player',
        damage: projectile.damage,
        sourceId: projectile.ownerId,
        sourceType: 'npc',
      };
    }
  }

  // Check hit on NPCs
  if (projectile.ownerType === 'player') {
    for (const npc of npcs) {
      const dist = distance(projectile.position, npc.position);
      if (dist < hitRadius) {
        return {
          targetId: npc.id,
          targetType: 'npc',
          damage: projectile.damage,
          sourceId: projectile.ownerId,
          sourceType: 'player',
        };
      }
    }
  }

  return null;
}

// Check if weapon can fire (fire rate limiting)
export function canFireWeapon(weapon: ShipWeapon, lastFireTime: number, currentTime: number): boolean {
  const stats = getWeaponStats(weapon);
  const fireInterval = 1000 / stats.fireRate; // milliseconds between shots
  return (currentTime - lastFireTime) >= fireInterval;
}

// Calculate energy cost for firing
export function getFireEnergyCost(weapon: ShipWeapon): number {
  return WEAPON_BASE_STATS[weapon.kind].energyCost;
}

// Calculate if target is in range
export function isInRange(
  shooterPos: [number, number, number],
  targetPos: [number, number, number],
  weapon: ShipWeapon
): boolean {
  const stats = getWeaponStats(weapon);
  const dist = distance(shooterPos, targetPos);
  return dist <= stats.range;
}

// Lead target calculation for projectile weapons (predict where to shoot)
export function calculateLeadPosition(
  shooterPos: [number, number, number],
  targetPos: [number, number, number],
  targetVel: [number, number, number],
  projectileSpeed: number
): [number, number, number] {
  // Simple lead calculation
  const dx = targetPos[0] - shooterPos[0];
  const dy = targetPos[1] - shooterPos[1];
  const dz = targetPos[2] - shooterPos[2];
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  if (projectileSpeed === 0) {
    // Hitscan - no lead needed
    return targetPos;
  }

  const timeToTarget = dist / projectileSpeed;
  
  return [
    targetPos[0] + targetVel[0] * timeToTarget,
    targetPos[1] + targetVel[1] * timeToTarget,
    targetPos[2] + targetVel[2] * timeToTarget,
  ];
}


