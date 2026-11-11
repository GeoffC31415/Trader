import type { Ship } from '../../domain/types/world_types';

export const FIRE_DAMAGE_PER_SECOND = 0.5;
export const FIRE_SUPPRESSION_COST = 3500;
export const FIRE_SUPPRESSION_SECONDS = 3;
export const FIRE_HULL_THRESHOLD = 0.35;

export function repairCost(ship: Ship): number {
  return Math.ceil(Math.max(0, ship.maxHp - ship.hp) * 5);
}

/** Fire is an incident, not simply a low-hull cosmetic. Docking anywhere puts it out. */
export function updateShipFire(ship: Ship, dt: number): Ship {
  if (ship.dockedStationId || ship.hp <= 0) return ship.onFire ? { ...ship, onFire: false, fireSeconds: 0 } : ship;
  if (!ship.onFire || !Number.isFinite(dt) || dt <= 0) return ship;
  const elapsed = ship.fireSeconds ?? 0;
  const burningFor = ship.hasFireSuppression ? Math.min(dt, Math.max(0, FIRE_SUPPRESSION_SECONDS - elapsed)) : dt;
  const hp = Math.max(0, ship.hp - burningFor * FIRE_DAMAGE_PER_SECOND);
  const suppressed = !!ship.hasFireSuppression && elapsed + dt >= FIRE_SUPPRESSION_SECONDS;
  return { ...ship, hp, onFire: !suppressed && hp > 0, fireSeconds: suppressed ? 0 : elapsed + dt };
}
