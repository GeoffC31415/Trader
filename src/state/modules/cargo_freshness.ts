/**
 * Cargo Freshness Module
 * 
 * Handles decay of perishable goods (food, medical) in player cargo.
 * Decays linearly from 100% to 0% over 5 minutes.
 * At 0% freshness, goods are worthless but still take cargo space.
 */

import type { Ship } from '../../domain/types/world_types';
import { generateCommodities } from '../../systems/economy/commodities';

export const DECAY_TIME_SECONDS = 5 * 60; // 5 minutes to reach 0% (decays to worthless)
const MIN_FRESHNESS = 0.0; // Can decay all the way to 0% (worthless but still takes cargo space)

/**
 * Get spoilage time in seconds for perishable goods
 */
export function getSpoilageTimeSeconds(): number {
  return DECAY_TIME_SECONDS;
}

/**
 * Format spoilage time as human-readable string (e.g., "5 min" or "2:30")
 */
export function formatSpoilageTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) {
    return `${seconds}s`;
  }
  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Perishable commodity categories
 */
const PERISHABLE_CATEGORIES = ['food', 'medical'] as const;

/**
 * Check if a commodity is perishable
 */
function isPerishable(commodityId: string): boolean {
  const commodities = generateCommodities();
  const commodity = commodities.find(c => c.id === commodityId);
  if (!commodity) return false;
  return PERISHABLE_CATEGORIES.includes(commodity.category as any);
}

/**
 * Update cargo freshness for perishable goods
 * 
 * @param ship - Current ship state
 * @param dt - Delta time in seconds
 * @returns Updated ship with decayed freshness
 */
export function updateCargoFreshness(ship: Ship, dt: number): Ship {
  const cargoFreshness = { ...ship.cargoFreshness } || {};
  let hasChanges = false;

  for (const [commodityId, quantity] of Object.entries(ship.cargo)) {
    if (quantity <= 0) {
      // Remove freshness tracking for empty cargo
      if (cargoFreshness[commodityId] !== undefined) {
        delete cargoFreshness[commodityId];
        hasChanges = true;
      }
      continue;
    }

    if (!isPerishable(commodityId)) continue; // Not perishable

    // Initialize freshness to 1.0 if not set
    let freshness = cargoFreshness[commodityId] ?? 1.0;

    // Decay: freshness decreases linearly from 1.0 to 0.0 over DECAY_TIME_SECONDS
    // At DECAY_TIME_SECONDS, freshness reaches 0% (worthless but still takes cargo space)
    const decayRate = 1.0 / DECAY_TIME_SECONDS; // Decay from 1.0 to 0.0
    freshness = Math.max(0.0, freshness - decayRate * dt);

    if (freshness !== (cargoFreshness[commodityId] ?? 1.0)) {
      cargoFreshness[commodityId] = freshness;
      hasChanges = true;
    }
  }

  if (!hasChanges) return ship;
  return { ...ship, cargoFreshness };
}

/**
 * Get freshness multiplier for sell price
 * Returns 1.0 for non-perishables, freshness value for perishables
 */
export function getFreshnessMultiplier(
  cargoFreshness: Record<string, number> | undefined,
  commodityId: string
): number {
  if (!isPerishable(commodityId)) return 1.0;
  return cargoFreshness?.[commodityId] ?? 1.0;
}

