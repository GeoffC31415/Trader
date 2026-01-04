/**
 * Economy Production Module
 * 
 * Handles station production of commodities over time, creating dynamic supply.
 */

import type { Station } from '../../domain/types/world_types';
import type { StationInventory } from '../../domain/types/economy_types';
import { getProductionForStation } from '../../systems/economy/production';
import { recalculatePriceForStock, getTargetStock } from '../../systems/economy/pricing';

/**
 * Update station stock based on production rates
 * 
 * Uses recalculatePriceForStock to calculate prices from BASE values,
 * preventing any price compounding over time.
 * 
 * @param stations - Current stations
 * @param dt - Delta time in seconds
 * @returns Updated stations with increased stock and adjusted prices
 */
export function updateStationProduction(stations: Station[], dt: number): Station[] {
  const dtMinutes = dt / 60; // Convert seconds to minutes
  
  // Create stationsMeta once for all stations
  const stationsMeta = stations.map(s => ({ id: s.id, type: s.type, position: s.position }));
  
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
        // Recalculate prices from BASE values to prevent compounding
        const targetStock = getTargetStock(station.type, prod.commodityId);
        const newPrices = recalculatePriceForStock(
          station.type,
          prod.commodityId,
          item.buy,
          item.sell,
          newStock,
          targetStock,
          station.position,
          stationsMeta
        );
        
        inv[prod.commodityId] = {
          ...item,
          stock: newStock,
          buy: newPrices.buy,
          sell: newPrices.sell,
        };
        hasChanges = true;
      }
    }
    
    if (!hasChanges) return station;
    return { ...station, inventory: inv };
  });
}

