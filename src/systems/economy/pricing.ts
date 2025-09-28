import type { Commodity } from '../../domain/types/economy_types';
import type { StationType } from '../../domain/types/economy_types';
import type { StationInventory } from '../../domain/types/economy_types';
import { economy_constants } from './constants';
import { processRecipes, type ProcessRecipe } from './recipes';
import { ensureFeaturedInitialized, getFeaturedMultiplier } from './featured';

export const gatedCommodities = ['luxury_goods', 'pharmaceuticals', 'microchips', 'nanomaterials'] as const;
export type GatedCommodity = typeof gatedCommodities[number];

function fluctuate(value: number, volatility: number): number {
  const factor = 1 + (Math.random() * 2 - 1) * volatility;
  return Math.max(1, Math.round(value * factor));
}

export type EnsureSpreadInput = {
  buy: number;
  sell: number;
  minPercent?: number;
  minAbsolute?: number;
};

export function ensureSpread({ buy, sell, minPercent = 0.05, minAbsolute = 1 }: EnsureSpreadInput): { buy: number; sell: number } {
  const minimumPrice = 1;
  if (buy < minimumPrice) buy = minimumPrice;
  if (sell < minimumPrice) sell = minimumPrice;

  const mid = (buy + sell) / 2;
  const targetSpread = Math.max(minAbsolute, Math.floor(minPercent * Math.max(1, mid)));
  const currentSpread = buy - sell;
  if (currentSpread >= targetSpread) {
    return { buy: Math.max(minimumPrice, Math.round(buy)), sell: Math.max(minimumPrice, Math.round(sell)) };
  }
  const half = Math.floor(targetSpread / 2);
  const adjustedSell = Math.max(minimumPrice, Math.floor(mid - half));
  const adjustedBuy = Math.max(adjustedSell + targetSpread, Math.round(mid + (targetSpread - half)));
  return { buy: adjustedBuy, sell: adjustedSell };
}

type StationPriceRules = {
  cheap: string[];
  expensive: string[];
  stockBoost?: Partial<Record<string, number>>;
};

const rulesByType: Record<StationType, StationPriceRules> = {
  refinery: {
    cheap: ['hydrogen'],
    expensive: ['electronics', 'microchips', 'luxury_goods'],
    stockBoost: { refined_fuel: 200, hydrogen: 400 },
  },
  fabricator: {
    cheap: ['steel', 'plastics', 'alloys'],
    expensive: ['rare_minerals', 'spices', 'luxury_goods'],
    stockBoost: { electronics: 100, microchips: 60, alloys: 80, plastics: 120 },
  },
  power_plant: {
    cheap: ['refined_fuel'],
    expensive: ['luxury_goods', 'spices'],
    stockBoost: { batteries: 180, refined_fuel: 120 },
  },
  city: {
    cheap: ['consumer', 'food'].flatMap(() => []),
    expensive: ['refined_fuel', 'batteries', 'medical_supplies', 'pharmaceuticals', 'luxury_goods'],
    stockBoost: { water: 300, grain: 200, textiles: 150 },
  },
  trading_post: {
    cheap: [],
    expensive: [],
    stockBoost: {},
  },
  mine: {
    cheap: ['iron_ore', 'copper_ore', 'silicon', 'rare_minerals'],
    expensive: ['electronics', 'microchips'],
    stockBoost: { iron_ore: 500, copper_ore: 300, silicon: 200, rare_minerals: 50 },
  },
  farm: {
    cheap: ['grain', 'meat', 'sugar'],
    expensive: ['machinery', 'fertilizer'],
    stockBoost: { grain: 400, meat: 200, sugar: 250 },
  },
  research: {
    cheap: ['data_drives', 'microchips', 'electronics'],
    expensive: ['luxury_goods', 'spices'],
    stockBoost: { data_drives: 140, microchips: 100 },
  },
  orbital_hab: {
    cheap: ['oxygen', 'water', 'textiles'],
    expensive: ['refined_fuel', 'batteries'],
    stockBoost: { oxygen: 300, water: 300, textiles: 120 },
  },
  shipyard: {
    cheap: [],
    expensive: ['luxury_goods'],
    stockBoost: {},
  },
  pirate: {
    cheap: [],
    expensive: ['luxury_goods', 'pharmaceuticals'],
    stockBoost: {},
  },
};

export type PriceBias = 'cheap' | 'expensive' | 'normal';
export function getPriceBiasForStation(type: StationType, commodityId: string): PriceBias {
  const rules = rulesByType[type];
  if (!rules) return 'normal';
  if (rules.cheap.includes(commodityId)) return 'cheap';
  if (rules.expensive.includes(commodityId)) return 'expensive';
  return 'normal';
}

function dist(a: [number, number, number], b: [number, number, number]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

type StationMeta = { id: string; type: StationType; position: [number, number, number] };

const allRecipeOutputs = new Set<string>(
  Object.values(processRecipes).flatMap(list => list.map(r => r.outputId))
);

function nearestProducerDistance(commodityId: string, here: [number, number, number] | undefined, stations: StationMeta[] | undefined): number {
  if (!here || !stations || stations.length === 0) return 0;
  const producerTypes = new Set<StationType>();
  for (const [stype, list] of Object.entries(processRecipes) as [StationType, ProcessRecipe[]][]) {
    if (list.some(r => r.outputId === commodityId)) producerTypes.add(stype);
  }
  if (producerTypes.size === 0) return 0;
  let best = Number.POSITIVE_INFINITY;
  for (const s of stations) {
    if (!producerTypes.has(s.type)) continue;
    const d = dist(here, s.position);
    if (d < best) best = d;
  }
  return Number.isFinite(best) ? best : 0;
}

function distancePremiumFor(category: Commodity['category'], distance: number): number {
  const norm = economy_constants.distance_norm;
  const k = (economy_constants.k_dist_by_category as any)[category] || 0.2;
  const premium = k * Math.max(0, Math.min(1, distance / Math.max(1, norm)));
  return Math.min(economy_constants.max_distance_premium, premium);
}

function applyAffinity(type: StationType, category: Commodity['category'], baseBuy: number, baseSell: number): { buy: number; sell: number } {
  const matrix = (economy_constants.affinity as any)[type] || {};
  const entry = matrix[category];
  if (!entry) return { buy: baseBuy, sell: baseSell };
  return { buy: Math.round(baseBuy * entry.buy), sell: Math.round(baseSell * entry.sell) };
}

function applyStockCurve(category: Commodity['category'], buy: number, sell: number, stock: number, target: number): { buy: number; sell: number } {
  if (target <= 0) return { buy, sell };
  const ratio = Math.max(0, Math.min(2, stock / target));
  const k = economy_constants.k_stock;
  const m = Math.max(economy_constants.min_stock_multiplier, Math.min(economy_constants.max_stock_multiplier, 1 + k * (1 - ratio)));
  const buyM = Math.max(economy_constants.min_buy_stock_multiplier, Math.min(economy_constants.max_buy_stock_multiplier, m));
  return { buy: Math.round(buy * buyM), sell: Math.round(sell * m) };
}

function getCraftFloorFor(category: Commodity['category']): number {
  const map = economy_constants.craft_floor_margin as any;
  return map[category] || 20;
}

export function priceForStation(type: StationType, commodities: Commodity[], here?: [number, number, number], stationsMeta?: StationMeta[], stationId?: string): StationInventory {
  ensureFeaturedInitialized(stationsMeta);
  const rules = rulesByType[type];
  const volatility = 0.16;
  const inv: StationInventory = {};
  const recipes = processRecipes[type] || [];
  const inputSet = new Set(recipes.map(r => r.inputId));
  const outputSet = new Set(recipes.map(r => r.outputId));
  const isProducer = recipes.length > 0;
  for (const c of commodities) {
    const cheap = rules.cheap.includes(c.id);
    const expensive = rules.expensive.includes(c.id);
    const buyMultiplier = cheap ? 0.45 : expensive ? 1.75 : 1.0;
    const sellMultiplier = cheap ? 0.55 : expensive ? 1.9 : 1.0;
    let baseBuy = Math.round(c.baseBuy * buyMultiplier);
    let baseSell = Math.round(c.baseSell * sellMultiplier);
    const withAffinity = applyAffinity(type, c.category, baseBuy, baseSell);
    baseBuy = withAffinity.buy;
    baseSell = withAffinity.sell;
    const buy = fluctuate(baseBuy, volatility);
    let sell = fluctuate(baseSell, volatility);
    const adjusted = ensureSpread({ buy, sell, minPercent: 0.08, minAbsolute: 3 });
    const d = nearestProducerDistance(c.id, here, stationsMeta);
    const distPremium = distancePremiumFor(c.category, d);
    const featuredM = getFeaturedMultiplier(stationId, c.id);
    let sellExtra = Math.round(adjusted.sell * (1 + distPremium));
    sellExtra = Math.round(sellExtra * featuredM);
    const isGlobalOutput = allRecipeOutputs.has(c.id);
    const sellWithPremium = Math.round(
      (isGlobalOutput && !outputSet.has(c.id)) ? Math.max(sellExtra, adjusted.sell) : Math.max(adjusted.sell, sellExtra * 0.95)
    );
    const stock = (rules.stockBoost && (rules.stockBoost as any)[c.id]) || (cheap ? 200 : 50);
    const withStock = applyStockCurve(c.category, adjusted.buy, sellWithPremium, stock, stock);
    if (isProducer) {
      if (outputSet.has(c.id)) {
        inv[c.id] = { buy: withStock.buy, sell: withStock.sell, stock, canBuy: false, canSell: true };
        continue;
      }
      if (inputSet.has(c.id)) {
        const isFood = c.category === 'food' || c.id === 'water';
        const forceBuy = isFood;
        inv[c.id] = { buy: withStock.buy, sell: withStock.sell, stock, canBuy: forceBuy, canSell: false };
        continue;
      }
      const isFood = c.category === 'food' || c.id === 'water';
      const canBuy = isFood || true;
      inv[c.id] = { buy: withStock.buy, sell: withStock.sell, stock, canBuy, canSell: false };
      continue;
    }
    let canBuy = true;
    const isFood = c.category === 'food' || c.id === 'water';
    if (isFood) canBuy = true;
    if (c.id === 'refined_fuel' || c.id === 'batteries') canBuy = true;
    let finalSell = withStock.sell;
    if (isGlobalOutput && !outputSet.has(c.id)) {
      let chosen: ProcessRecipe | undefined;
      for (const list of Object.values(processRecipes)) {
        const found = list.find(r => r.outputId === c.id);
        if (found) { chosen = found; break; }
      }
      if (chosen) {
        const inputCheap = rules.cheap.includes(chosen.inputId);
        const inputExp = rules.expensive.includes(chosen.inputId);
        let estBuy = 0;
        // We need a rough base buy for the input, use relative multipliers on a notional price
        estBuy = Math.round(100 * (inputCheap ? 0.45 : inputExp ? 1.75 : 1.0));
        const floor = getCraftFloorFor(c.category);
        const minSell = (estBuy * chosen.inputPerOutput) + floor;
        if (finalSell < minSell) finalSell = minSell;
      }
    }
    const baseFloor = Math.round(c.baseSell * (1 + 0.1 + distPremium));
    if (finalSell < baseFloor) finalSell = baseFloor;
    inv[c.id] = { buy: withStock.buy, sell: finalSell, stock, canBuy, canSell: true };
  }
  return inv;
}


