/**
 * Station Types - Const Assertion Pattern
 * 
 * Single source of truth for station type types.
 */

export const STATION_TYPES = [
  'refinery',
  'fabricator',
  'power_plant',
  'city',
  'trading_post',
  'mine',
  'farm',
  'research',
  'orbital_hab',
  'shipyard',
  'pirate',
] as const;

export type StationType = typeof STATION_TYPES[number];

// Type guard
export function isValidStationType(type: string): type is StationType {
  return (STATION_TYPES as readonly string[]).includes(type);
}

