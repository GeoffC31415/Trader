/**
 * Price History Module
 * 
 * Tracks price history for each station/commodity pair for player analysis.
 */

import type { Station } from '../../domain/types/world_types';
import type { PriceSnapshot } from '../../domain/types/world_types';

const SNAPSHOT_INTERVAL_MS = 30000; // 30 seconds
const MAX_SNAPSHOTS_PER_COMMODITY = 20; // Keep last 20 snapshots (10 minutes of history)

/**
 * Record price snapshots for all stations
 * 
 * @param stations - Current stations
 * @param currentTime - Current timestamp in ms
 * @param lastSnapshotTime - Last snapshot timestamp (undefined if never)
 * @returns Updated price history and new snapshot time
 */
export function recordPriceHistory(
  stations: Station[],
  currentTime: number,
  lastSnapshotTime?: number
): {
  priceHistory: Record<string, Record<string, PriceSnapshot[]>>;
  lastSnapshotTime: number;
} {
  // Only snapshot every 30 seconds
  if (lastSnapshotTime && currentTime - lastSnapshotTime < SNAPSHOT_INTERVAL_MS) {
    return {
      priceHistory: {},
      lastSnapshotTime: lastSnapshotTime,
    };
  }

  const history: Record<string, Record<string, PriceSnapshot[]>> = {};

  for (const station of stations) {
    const stationHistory: Record<string, PriceSnapshot[]> = {};
    
    for (const [commodityId, item] of Object.entries(station.inventory)) {
      const snapshot: PriceSnapshot = {
        time: currentTime,
        buy: item.buy,
        sell: item.sell,
      };
      
      stationHistory[commodityId] = [snapshot];
    }
    
    history[station.id] = stationHistory;
  }

  return {
    priceHistory: history,
    lastSnapshotTime: currentTime,
  };
}

/**
 * Merge new snapshots into existing price history
 * 
 * @param existing - Existing price history
 * @param newSnapshots - New snapshots to merge
 * @returns Merged price history with old snapshots trimmed
 */
export function mergePriceHistory(
  existing: Record<string, Record<string, PriceSnapshot[]>>,
  newSnapshots: Record<string, Record<string, PriceSnapshot[]>>
): Record<string, Record<string, PriceSnapshot[]>> {
  const merged: Record<string, Record<string, PriceSnapshot[]>> = { ...existing };

  for (const [stationId, stationHistory] of Object.entries(newSnapshots)) {
    if (!merged[stationId]) {
      merged[stationId] = {};
    }

    for (const [commodityId, snapshots] of Object.entries(stationHistory)) {
      const existingSnapshots = merged[stationId][commodityId] || [];
      const combined = [...existingSnapshots, ...snapshots];
      
      // Sort by time and keep only the most recent MAX_SNAPSHOTS_PER_COMMODITY
      const sorted = combined.sort((a, b) => a.time - b.time);
      merged[stationId][commodityId] = sorted.slice(-MAX_SNAPSHOTS_PER_COMMODITY);
    }
  }

  return merged;
}

/**
 * Get price history for a specific station and commodity
 */
export function getPriceHistory(
  priceHistory: Record<string, Record<string, PriceSnapshot[]>> | undefined,
  stationId: string,
  commodityId: string
): PriceSnapshot[] {
  if (!priceHistory) return [];
  return priceHistory[stationId]?.[commodityId] || [];
}

