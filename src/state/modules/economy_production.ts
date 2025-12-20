/**
 * Economy Production Module
 * 
 * Handles station production of commodities over time, creating dynamic supply.
 */

import type { Station } from '../../domain/types/world_types';
import type { StationInventory } from '../../domain/types/economy_types';
import { getProductionForStation } from '../../systems/economy/production';

/**
 * Update station stock based on production rates
 * 
 * @param stations - Current stations
 * @param dt - Delta time in seconds
 * @returns Updated stations with increased stock
 */
export function updateStationProduction(stations: Station[], dt: number): Station[] {
  const dtMinutes = dt / 60; // Convert seconds to minutes
  
  return stations.map(station => {
    const production = getProductionForStation(station.type);
    if (production.length === 0) return station; // No production for this station type
    
    const inv: StationInventory = { ...station.inventory };
    let hasChanges = false;
    
    for (const prod of production) {
      const item = inv[prod.commodityId];
      if (!item) continue;
      
      const currentStock = item.stock || 0;
      
      // Don't produce beyond max stock
      if (currentStock >= prod.maxStock) continue;
      
      // Produce based on rate per minute
      const produced = prod.ratePerMinute * dtMinutes;
      const newStock = Math.min(prod.maxStock, currentStock + produced);
      
      if (newStock !== currentStock) {
        inv[prod.commodityId] = {
          ...item,
          stock: newStock,
        };
        hasChanges = true;
      }
    }
    
    if (!hasChanges) return station;
    return { ...station, inventory: inv };
  });
}

