import type { StationType } from '../../domain/types/economy_types';
import type { Commodity } from '../../domain/types/economy_types';
import { generateCommodities } from './commodities';
import { getEconomyConfig } from '../../config/game_config';

type StationMeta = { id: string; type: StationType; position: [number, number, number] };
type FeaturedKey = string; // `${stationId}:${commodityId}`
type FeaturedEntry = { multiplier: number; expiresAt: number };

let featuredMap: Map<FeaturedKey, FeaturedEntry> | undefined;

export function ensureFeaturedInitialized(stations: StationMeta[] | undefined): void {
  if (featuredMap && featuredMap.size > 0) {
    const now = Date.now();
    for (const [k, v] of featuredMap) if (v.expiresAt <= now) featuredMap.delete(k);
    if (featuredMap.size > 0) return;
  }
  if (!stations || stations.length === 0) return;
  featuredMap = new Map();
  const config = getEconomyConfig();
  const candidates = stations.filter(s => s.type !== 'refinery' && s.type !== 'farm');
  const count = config.featured.count;
  const cats = new Set(config.featured.candidateCategories);
  const pool: { station: StationMeta; commodityId: string }[] = [];
  for (const st of candidates) {
    for (const c of generateCommodities()) {
      if (!cats.has(c.category)) continue;
      pool.push({ station: st, commodityId: c.id });
    }
  }
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const picked = pool.splice(idx, 1)[0];
    const mult = config.featured.minMultiplier + Math.random() * (config.featured.maxMultiplier - config.featured.minMultiplier);
    const ttlMs = (20 + Math.floor(Math.random() * 10)) * 60 * 1000; // 20-30 minutes
    featuredMap.set(`${picked.station.id}:${picked.commodityId}`, { multiplier: mult, expiresAt: Date.now() + ttlMs });
  }
}

export function getFeaturedMultiplier(stationId: string | undefined, commodityId: Commodity['id']): number {
  if (!stationId || !featuredMap) return 1;
  const key = `${stationId}:${commodityId}`;
  const entry = featuredMap.get(key);
  if (!entry) return 1;
  if (entry.expiresAt <= Date.now()) {
    featuredMap.delete(key);
    return 1;
  }
  return entry.multiplier;
}

/**
 * Get all active featured arbitrage opportunities
 * Returns array of opportunities with station ID, commodity ID, multiplier, and time remaining
 */
export type FeaturedOpportunity = {
  stationId: string;
  commodityId: string;
  multiplier: number;
  expiresAt: number;
  remainingMs: number;
};

export function getActiveFeaturedOpportunities(): FeaturedOpportunity[] {
  if (!featuredMap) return [];
  
  const now = Date.now();
  const opportunities: FeaturedOpportunity[] = [];
  
  for (const [key, entry] of featuredMap) {
    if (entry.expiresAt <= now) continue;
    
    const [stationId, commodityId] = key.split(':');
    opportunities.push({
      stationId,
      commodityId,
      multiplier: entry.multiplier,
      expiresAt: entry.expiresAt,
      remainingMs: entry.expiresAt - now,
    });
  }
  
  // Sort by multiplier descending (best deals first)
  return opportunities.sort((a, b) => b.multiplier - a.multiplier);
}


