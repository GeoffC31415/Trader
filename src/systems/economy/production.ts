/**
 * Station Production System
 * 
 * Producer stations generate commodities over time.
 * Refineries produce fuel, farms produce food, etc.
 */

import type { StationType } from '../../domain/types/economy_types';

export type StationProduction = {
  commodityId: string;
  ratePerMinute: number;  // units produced per minute
  maxStock: number;       // won't produce beyond this level
};

/**
 * Production rates by station type
 * Stations produce goods over time, creating natural supply
 */
export const stationProduction: Record<StationType, StationProduction[]> = {
  refinery: [
    // Refineries produce refined fuel and steel rapidly
    { commodityId: 'refined_fuel', ratePerMinute: 8.0, maxStock: 400 },
    { commodityId: 'steel', ratePerMinute: 4.0, maxStock: 200 },
    { commodityId: 'alloys', ratePerMinute: 2.5, maxStock: 150 },
  ],
  fabricator: [
    // Fabricators produce electronics and machinery
    { commodityId: 'electronics', ratePerMinute: 3.0, maxStock: 150 },
    { commodityId: 'microchips', ratePerMinute: 1.5, maxStock: 100 },
    { commodityId: 'machinery', ratePerMinute: 2.0, maxStock: 120 },
    { commodityId: 'plastics', ratePerMinute: 4.0, maxStock: 200 },
  ],
  power_plant: [
    // Power plants produce batteries
    { commodityId: 'batteries', ratePerMinute: 5.0, maxStock: 250 },
  ],
  city: [], // Cities consume, don't produce
  trading_post: [], // Trading posts don't produce
  mine: [
    // Mines produce raw materials
    { commodityId: 'iron_ore', ratePerMinute: 6.0, maxStock: 600 },
    { commodityId: 'copper_ore', ratePerMinute: 4.0, maxStock: 400 },
    { commodityId: 'silicon', ratePerMinute: 3.0, maxStock: 300 },
    { commodityId: 'rare_minerals', ratePerMinute: 0.8, maxStock: 80 },
  ],
  farm: [
    // Farms produce food
    { commodityId: 'grain', ratePerMinute: 6.0, maxStock: 500 },
    { commodityId: 'meat', ratePerMinute: 3.0, maxStock: 300 },
    { commodityId: 'sugar', ratePerMinute: 4.0, maxStock: 350 },
  ],
  research: [
    // Research produces data drives and pharmaceuticals
    { commodityId: 'data_drives', ratePerMinute: 2.0, maxStock: 180 },
    { commodityId: 'pharmaceuticals', ratePerMinute: 1.0, maxStock: 80 },
  ],
  orbital_hab: [
    // Orbital habs produce oxygen and water (recycling)
    { commodityId: 'oxygen', ratePerMinute: 3.0, maxStock: 400 },
    { commodityId: 'water', ratePerMinute: 2.0, maxStock: 400 },
  ],
  shipyard: [], // Shipyards don't produce commodities
  pirate: [], // Pirates don't produce
};

/**
 * Get production config for a station type
 */
export function getProductionForStation(type: StationType): StationProduction[] {
  return stationProduction[type] || [];
}

