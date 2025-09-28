import type { StationType } from '../../domain/types/economy_types';
import type { Commodity } from '../../domain/types/economy_types';
import { generateCommodities } from './commodities';
import { economy_constants } from './constants';

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
  const candidates = stations.filter(s => s.type !== 'refinery' && s.type !== 'farm');
  const count = economy_constants.featured.count;
  const cats = new Set(economy_constants.featured.candidate_categories as unknown as string[]);
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
    const mult = economy_constants.featured.min_multiplier + Math.random() * (economy_constants.featured.max_multiplier - economy_constants.featured.min_multiplier);
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


