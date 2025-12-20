/**
 * Economy Consumption Module
 * 
 * Handles station consumption of commodities over time, creating dynamic supply/demand.
 */

import type { Station } from '../../domain/types/world_types';
import type { StationInventory } from '../../domain/types/economy_types';
import { getConsumptionForStation } from '../../systems/economy/consumption';
import { recalculatePriceForStock, getTargetStock } from '../../systems/economy/pricing';

/**
 * Update station stock based on consumption rates
 * 
 * Uses recalculatePriceForStock to calculate prices from BASE values,
 * preventing any price compounding over time.
 * 
 * @param stations - Current stations
 * @param dt - Delta time in seconds
 * @returns Updated stations with reduced stock and adjusted prices
 */
export function updateStationConsumption(stations: Station[], dt: number): Station[] {
  const dtMinutes = dt / 60; // Convert seconds to minutes
  
  return stations.map(station => {
    const consumption = getConsumptionForStation(station.type);
    if (consumption.length === 0) return station; // No consumption for this station type
    
    const inv: StationInventory = { ...station.inventory };
    let hasChanges = false;
    
    for (const cons of consumption) {
      const item = inv[cons.commodityId];
      if (!item) continue;
      
      const currentStock = item.stock || 0;
      if (currentStock <= 0) continue; // Already depleted
      
      // Consume based on rate per minute
      const consumed = cons.ratePerMinute * dtMinutes;
      const newStock = Math.max(0, currentStock - consumed);
      
      if (newStock !== currentStock) {
        // Recalculate prices from BASE values to prevent compounding
        const targetStock = getTargetStock(station.type, cons.commodityId);
        const newPrices = recalculatePriceForStock(
          station.type,
          cons.commodityId,
          item.buy,
          item.sell,
          newStock,
          targetStock
        );
        
        inv[cons.commodityId] = {
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

