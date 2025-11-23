/**
 * Weapon Kinds - Const Assertion Pattern
 * 
 * Single source of truth for weapon kind types.
 */

export const WEAPON_KINDS = [
  'laser',
  'plasma',
  'railgun',
  'missile',
] as const;

export type WeaponKind = typeof WEAPON_KINDS[number];

// Type guard
export function isValidWeaponKind(kind: string): kind is WeaponKind {
  return (WEAPON_KINDS as readonly string[]).includes(kind);
}

