/**
 * Ship Kinds - Const Assertion Pattern
 * 
 * Single source of truth for ship kind types.
 * Adding a new ship type: add to this array and update ship_constants.ts
 */

export const SHIP_KINDS = [
  'freighter',
  'clipper',
  'miner',
  'heavy_freighter',
  'racer',
  'industrial_miner',
] as const;

export type ShipKind = typeof SHIP_KINDS[number];

// Type guard
export function isValidShipKind(kind: string): kind is ShipKind {
  return (SHIP_KINDS as readonly string[]).includes(kind);
}

