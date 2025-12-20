/**
 * Economy Consumption Module
 * 
 * Handles station consumption of commodities over time, creating dynamic supply/demand.
 */

import type { Station } from '../../domain/types/world_types';
import type { StationInventory } from '../../domain/types/economy_types';
import { getConsumptionForStation, getShortageMultiplier } from '../../systems/economy/consumption';

/**
 * Update station stock based on consumption rates
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
        // Apply shortage multiplier to sell price when stock is critically low
        const shortageMult = getShortageMultiplier(newStock, cons.criticalThreshold);
        const adjustedSell = Math.round(item.sell * shortageMult);
        
        inv[cons.commodityId] = {
          ...item,
          stock: newStock,
          sell: adjustedSell,
        };
        hasChanges = true;
      } else {
        // Even if stock didn't change, recalculate price multiplier in case stock is already low
        const shortageMult = getShortageMultiplier(currentStock, cons.criticalThreshold);
        const adjustedSell = Math.round(item.sell * shortageMult);
        if (adjustedSell !== item.sell) {
          inv[cons.commodityId] = {
            ...item,
            sell: adjustedSell,
          };
          hasChanges = true;
        }
      }
    }
    
    if (!hasChanges) return station;
    return { ...station, inventory: inv };
  });
}

