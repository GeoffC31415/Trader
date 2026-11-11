import type { ShipWeapon, Projectile, DamageEvent } from '../../domain/types/combat_types';
import type { Ship, NpcTrader } from '../../domain/types/world_types';
import { WEAPON_UPGRADE_BONUSES, PROJECTILE_DESPAWN_TIME } from '../../domain/constants/weapon_constants';
import { distance } from '../../shared/math/vec3';
type Vec = [number, number, number];

export function getWeaponStats(weapon: ShipWeapon): ShipWeapon {
  return { ...weapon,
    damage: weapon.damage + weapon.damageLevel * WEAPON_UPGRADE_BONUSES.damage,
    fireRate: weapon.fireRate + weapon.fireRateLevel * WEAPON_UPGRADE_BONUSES.fireRate,
    range: weapon.range + weapon.rangeLevel * WEAPON_UPGRADE_BONUSES.range,
  };
}

export function createProjectile(weapon: ShipWeapon, shooterPos: Vec, shooterVel: Vec, targetPos: Vec | null, ownerId: string, ownerType: 'player' | 'npc'): Projectile {
  const stats = getWeaponStats(weapon);
  const delta: Vec = targetPos ? targetPos.map((v, i) => v - shooterPos[i]) as Vec : [0, 0, -1];
  const length = Math.hypot(...delta) || 1;
  const direction = delta.map(v => v / length) as Vec;
  const hitscan = stats.projectileSpeed === 0;
  const lifetime = hitscan ? 0.12 : Math.min(PROJECTILE_DESPAWN_TIME, stats.range / stats.projectileSpeed);
  return {
    id: `proj_${Date.now()}_${Math.random().toString(36).slice(2)}`, ownerId, ownerType,
    position: [...shooterPos], previousPosition: [...shooterPos], direction,
    velocity: direction.map((v, i) => hitscan ? 0 : v * stats.projectileSpeed + shooterVel[i] * 0.5) as Vec,
    damage: stats.damage, lifetime, maxLifetime: lifetime, weaponKind: weapon.kind,
    range: stats.range, distanceTraveled: 0, hitscan,
  };
}

export function updateProjectile(p: Projectile, dt: number): Projectile {
  if (p.hitscan) return { ...p, lifetime: p.lifetime - dt };
  const remaining = Math.max(0, (p.range ?? Infinity) - (p.distanceTraveled ?? 0));
  const speed = Math.hypot(...p.velocity);
  const step = Math.min(dt, remaining / Math.max(speed, 0.001));
  return { ...p, previousPosition: [...p.position],
    position: p.position.map((v, i) => v + p.velocity[i] * step) as Vec,
    distanceTraveled: (p.distanceTraveled ?? 0) + speed * step,
    lifetime: p.lifetime - dt,
  };
}

// Returns the first intersection along a finite segment, including when it starts inside.
function intersect(start: Vec, end: Vec, center: Vec, radius: number): number | null {
  const d = end.map((v, i) => v - start[i]);
  const m = start.map((v, i) => v - center[i]);
  const a = d.reduce((sum, v) => sum + v * v, 0);
  const c = m.reduce((sum, v) => sum + v * v, 0) - radius * radius;
  if (c <= 0) return 0;
  if (a < 1e-12) return null;
  const b = m.reduce((sum, v, i) => sum + v * d[i], 0);
  const disc = b * b - a * c;
  if (disc < 0) return null;
  const t = (-b - Math.sqrt(disc)) / a;
  return t >= 0 && t <= 1 ? t : null;
}

export function checkProjectileCollision(p: Projectile, ship: Ship, npcs: NpcTrader[]): DamageEvent | null {
  if (p.resolved) return null;
  const start = p.previousPosition ?? p.position;
  const end = p.hitscan && p.direction
    ? p.position.map((v, i) => v + p.direction![i] * (p.range ?? 0)) as Vec : p.position;
  const candidates: { id: string; type: 'player' | 'npc'; position: Vec }[] = [];
  if (p.ownerType === 'npc') {
    if (!ship.dockedStationId && ship.hp > 0) candidates.push({ id: 'player', type: 'player', position: ship.position });
    // Friendly escorts are vulnerable; hostile NPCs cannot friendly-fire one another.
    candidates.push(...npcs.filter(n => n.hp > 0 && !n.isHostile && n.id !== p.ownerId)
      .map(n => ({ id: n.id, type: 'npc' as const, position: n.position })));
  } else {
    candidates.push(...npcs.filter(n => n.hp > 0).map(n => ({ id: n.id, type: 'npc' as const, position: n.position })));
  }
  let closest: { t: number; id: string; type: 'player' | 'npc' } | undefined;
  for (const candidate of candidates) {
    const t = intersect(start, end, candidate.position, 8);
    if (t !== null && (!closest || t < closest.t)) closest = { t, id: candidate.id, type: candidate.type };
  }
  return closest ? { targetId: closest.id, targetType: closest.type, damage: p.damage, sourceId: p.ownerId, sourceType: p.ownerType } : null;
}

export function canFireWeapon(weapon: ShipWeapon, lastFireTime: number, currentTime: number): boolean {
  return currentTime - lastFireTime >= 1000 / getWeaponStats(weapon).fireRate;
}
export function getFireEnergyCost(weapon: ShipWeapon): number { return weapon.energyCost; }
export function isInRange(shooterPos: Vec, targetPos: Vec, weapon: ShipWeapon): boolean {
  return distance(shooterPos, targetPos) <= getWeaponStats(weapon).range;
}
export function calculateLeadPosition(shooterPos: Vec, targetPos: Vec, targetVel: Vec, projectileSpeed: number): Vec {
  const time = projectileSpeed > 0 ? distance(shooterPos, targetPos) / projectileSpeed : 0;
  return targetPos.map((v, i) => v + targetVel[i] * time) as Vec;
}
