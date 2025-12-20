/**
 * Commodity Tier System
 * 
 * Calculates production chain depth (tier) for commodities.
 * Tier 0 = raw materials, higher tiers = deeper in production chain.
 */

import { processRecipes } from './recipes';
import { generateCommodities } from './commodities';

const commodities = generateCommodities();
const commodityById = Object.fromEntries(commodities.map(c => [c.id, c]));

/**
 * Calculate the production tier of a commodity
 * Tier 0 = raw materials (not produced from other commodities)
 * Tier 1+ = produced from commodities of lower tiers
 */
export function getCommodityTier(commodityId: string): number {
  // Build reverse lookup: what produces this commodity?
  const producers: string[] = [];
  
  for (const recipes of Object.values(processRecipes)) {
    for (const recipe of recipes) {
      if (recipe.outputId === commodityId) {
        producers.push(recipe.inputId);
      }
    }
  }
  
  // If no producers, it's Tier 0 (raw material)
  if (producers.length === 0) {
    return 0;
  }
  
  // Tier is max(input tiers) + 1
  const inputTiers = producers.map(inputId => getCommodityTier(inputId));
  return Math.max(...inputTiers) + 1;
}

/**
 * Get tier label for display
 */
export function getTierLabel(tier: number): string {
  switch (tier) {
    case 0: return 'RAW';
    case 1: return 'TIER 1';
    case 2: return 'TIER 2';
    case 3: return 'TIER 3';
    default: return `TIER ${tier}`;
  }
}

/**
 * Get tier color for display
 */
export function getTierColor(tier: number): string {
  switch (tier) {
    case 0: return '#94a3b8'; // Gray for raw
    case 1: return '#10b981'; // Green for tier 1
    case 2: return '#3b82f6'; // Blue for tier 2
    case 3: return '#f59e0b'; // Amber for tier 3
    default: return '#8b5cf6'; // Purple for higher tiers
  }
}

/**
 * Check if a commodity is perishable
 */
export function isPerishable(commodityId: string): boolean {
  const commodity = commodityById[commodityId];
  if (!commodity) return false;
  return commodity.category === 'food' || commodity.category === 'medical';
}

