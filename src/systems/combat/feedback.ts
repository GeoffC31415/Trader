/** Bounded, damage-scaled visuals; effects never participate in collision or kill credit. */
export function impactStrength(damage: number): number {
  return Number.isFinite(damage) ? Math.min(3, Math.max(0, Math.sqrt(Math.max(0, damage) / 10))) : 0;
}
export function hullSeverity(hp: number, maxHp: number): number {
  return maxHp > 0 ? Math.max(0, Math.min(1, 1 - hp / maxHp)) : 0;
}
