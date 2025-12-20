/**
 * Station Consumption System
 * 
 * Defines what commodities each station type consumes over time.
 * Low stock levels trigger price spikes to create dynamic supply/demand.
 */

import type { StationType } from '../../domain/types/economy_types';
import type { StationConsumption } from '../../domain/types/economy_types';

/**
 * Consumption rates by station type
 * Stations consume goods over time, creating natural demand
 */
export const stationConsumption: Record<StationType, StationConsumption[]> = {
  city: [
    // Cities (especially Sol City) consume water rapidly - large population
    { commodityId: 'water', ratePerMinute: 5.0, criticalThreshold: 80 },
    { commodityId: 'grain', ratePerMinute: 2.5, criticalThreshold: 50 },
    { commodityId: 'meat', ratePerMinute: 1.5, criticalThreshold: 30 },
    { commodityId: 'textiles', ratePerMinute: 1.8, criticalThreshold: 35 },
    { commodityId: 'medical_supplies', ratePerMinute: 0.8, criticalThreshold: 15 },
    { commodityId: 'pharmaceuticals', ratePerMinute: 0.5, criticalThreshold: 12 },
  ],
  fabricator: [
    { commodityId: 'iron_ore', ratePerMinute: 1.5, criticalThreshold: 20 },
    { commodityId: 'copper_ore', ratePerMinute: 1.2, criticalThreshold: 18 },
    { commodityId: 'silicon', ratePerMinute: 1.0, criticalThreshold: 15 },
    { commodityId: 'plastics', ratePerMinute: 1.8, criticalThreshold: 25 },
  ],
  power_plant: [
    { commodityId: 'refined_fuel', ratePerMinute: 2.5, criticalThreshold: 40 },
  ],
  refinery: [], // Refineries produce, don't consume (except raw materials which are inputs)
  trading_post: [], // Trading posts don't consume
  mine: [], // Mines produce, don't consume
  farm: [], // Farms produce, don't consume
  research: [
    { commodityId: 'data_drives', ratePerMinute: 0.8, criticalThreshold: 12 },
    { commodityId: 'microchips', ratePerMinute: 0.5, criticalThreshold: 8 },
  ],
  orbital_hab: [
    { commodityId: 'water', ratePerMinute: 1.5, criticalThreshold: 25 },
    { commodityId: 'oxygen', ratePerMinute: 1.2, criticalThreshold: 20 },
  ],
  shipyard: [
    { commodityId: 'steel', ratePerMinute: 1.0, criticalThreshold: 15 },
    { commodityId: 'alloys', ratePerMinute: 0.8, criticalThreshold: 12 },
    { commodityId: 'machinery', ratePerMinute: 0.3, criticalThreshold: 5 },
  ],
  pirate: [], // Pirates don't have structured consumption
};

/**
 * Get consumption config for a station type
 */
export function getConsumptionForStation(type: StationType): StationConsumption[] {
  return stationConsumption[type] || [];
}

/**
 * Calculate stock shortage multiplier for pricing
 * Returns 1.0 (no multiplier) to 1.5 (50% increase) based on stock level
 */
export function getShortageMultiplier(currentStock: number, criticalThreshold: number): number {
  if (currentStock >= criticalThreshold) return 1.0;
  // Linear interpolation: at threshold = 1.0, at 0 = 1.5
  const ratio = Math.max(0, currentStock / criticalThreshold);
  return 1.0 + (1 - ratio) * 0.5; // Up to 50% increase when stock is critically low
}

