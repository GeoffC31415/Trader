import type { Commodity } from '../../domain/types/economy_types';
import type { StationType } from '../../domain/types/economy_types';
import type { StationInventory } from '../../domain/types/economy_types';
import { economy_constants } from './constants';
import { getEconomyConfig } from '../../config/game_config';
import { processRecipes, type ProcessRecipe } from './recipes';
import { ensureFeaturedInitialized, getFeaturedMultiplier } from './featured';
import { isPerishable } from './commodity_tiers';
import { generateCommodities } from './commodities';
import type { MarketEvent } from '../../domain/types/world_types';
import { getEventPriceMultiplier } from './market_events';

// Gated commodities - require specific cargo hold upgrades
// Perishable goods require Temperature Controlled Cargo Hold
export const perishableCommodities = ['pharmaceuticals', 'meat'] as const;
export type PerishableCommodity = typeof perishableCommodities[number];

// Sensitive tech goods require Shielded Cargo Hold
export const shieldedCommodities = ['nanomaterials', 'microchips', 'data_drives', 'electronics'] as const;
export type ShieldedCommodity = typeof shieldedCommodities[number];

// Combined list for backwards compatibility and route calculations
export const gatedCommodities = [...perishableCommodities, ...shieldedCommodities] as const;
export type GatedCommodity = typeof gatedCommodities[number];

// Profit multiplier for gated commodities (they're harder to trade, so more profitable)
export const GATED_COMMODITY_PROFIT_MULTIPLIER = 2.0;

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

export type StockPriceEffect = {
  sellMultiplier: number;  // Multiplier applied to sell price (e.g., 1.15 = +15%)
  buyMultiplier: number;   // Multiplier applied to buy price
  percentChange: number;   // Percentage change displayed to player (e.g., +15 or -10)
  label: string;           // Human-readable label (e.g., "LOW STOCK +15%")
  color: string;           // Color for display
};

/**
 * Calculate the price effect from stock levels
 * @param stock - Current stock level
 * @param target - Target/baseline stock level
 * @returns Price effect information for display
 */
export function getStockPriceEffect(stock: number, target: number): StockPriceEffect {
  if (target <= 0) {
    return { sellMultiplier: 1, buyMultiplier: 1, percentChange: 0, label: '', color: '#9ca3af' };
  }
  
  const config = getEconomyConfig();
  const ratio = Math.max(0, Math.min(2, stock / target));
  const k = config.kStock;
  const m = Math.max(config.minStockMultiplier, Math.min(config.maxStockMultiplier, 1 + k * (1 - ratio)));
  const buyM = Math.max(config.minBuyStockMultiplier, Math.min(config.maxBuyStockMultiplier, m));
  
  const percentChange = Math.round((m - 1) * 100);
  
  let label = '';
  let color = '#9ca3af'; // neutral gray
  
  if (percentChange >= 15) {
    label = `LOW STOCK +${percentChange}%`;
    color = '#10b981'; // green - good for selling
  } else if (percentChange >= 5) {
    label = `LOW +${percentChange}%`;
    color = '#22c55e'; // lighter green
  } else if (percentChange <= -10) {
    label = `SURPLUS ${percentChange}%`;
    color = '#ef4444'; // red - bad for selling
  } else if (percentChange <= -5) {
    label = `HIGH ${percentChange}%`;
    color = '#f59e0b'; // amber
  } else if (percentChange !== 0) {
    label = percentChange > 0 ? `+${percentChange}%` : `${percentChange}%`;
    color = percentChange > 0 ? '#9ca3af' : '#9ca3af';
  }
  
  return { sellMultiplier: m, buyMultiplier: buyM, percentChange, label, color };
}

/**
 * Get the target/baseline stock level for a commodity at a station type
 * @param stationType - The station type
 * @param commodityId - The commodity ID
 * @returns Target stock level
 */
export function getTargetStock(stationType: StationType, commodityId: string): number {
  const rules = rulesByType[stationType];
  if (!rules) return 50;
  const cheap = rules.cheap.includes(commodityId);
  return (rules.stockBoost && (rules.stockBoost as any)[commodityId]) || (cheap ? 200 : 50);
}

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
    // Large cities like Sol City have huge water/food reserves but consume rapidly
    stockBoost: { water: 600, grain: 400, meat: 200, textiles: 200, medical_supplies: 100 },
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
  const config = getEconomyConfig();
  const norm = config.distanceNorm;
  const k = config.kDistByCategory[category] || 0.2;
  // Use squared distance for quadratic scaling: short routes = small profit, long routes = big profit
  const normalizedDist = Math.max(0, Math.min(1, distance / Math.max(1, norm)));
  const premium = k * (normalizedDist * normalizedDist);
  return Math.min(config.maxDistancePremium, premium);
}

function applyAffinity(type: StationType, category: Commodity['category'], baseBuy: number, baseSell: number): { buy: number; sell: number } {
  const config = getEconomyConfig();
  const aff = config.affinity[type]?.[category];
  if (!aff) return { buy: baseBuy, sell: baseSell };
  return { buy: Math.round(baseBuy * aff.buy), sell: Math.round(baseSell * aff.sell) };
}

function applyStockCurve(category: Commodity['category'], buy: number, sell: number, stock: number, target: number): { buy: number; sell: number } {
  if (target <= 0) return { buy, sell };
  const ratio = Math.max(0, Math.min(2, stock / target));
  const config = getEconomyConfig();
  const k = config.kStock;
  const m = Math.max(config.minStockMultiplier, Math.min(config.maxStockMultiplier, 1 + k * (1 - ratio)));
  const buyM = Math.max(config.minBuyStockMultiplier, Math.min(config.maxBuyStockMultiplier, m));
  return { buy: Math.round(buy * buyM), sell: Math.round(sell * m) };
}

/**
 * Recalculate prices for a commodity based on current stock levels
 * Used after trading to immediately reflect price changes
 * 
 * IMPORTANT: This function calculates prices from commodity BASE values to avoid
 * compounding multipliers. It applies station type modifiers, affinity, and then
 * stock curve - all from scratch based on the new stock level.
 * 
 * @param stationType - The station type
 * @param commodityId - The commodity to recalculate
 * @param _currentBuy - (deprecated, unused) Current buy price
 * @param _currentSell - (deprecated, unused) Current sell price  
 * @param stock - Current stock level
 * @param targetStock - Target/baseline stock level
 * @returns Updated buy and sell prices
 */
export function recalculatePriceForStock(
  stationType: StationType,
  commodityId: string,
  _currentBuy: number,
  _currentSell: number,
  stock: number,
  targetStock: number
): { buy: number; sell: number } {
  // Get commodity base prices - ALWAYS calculate from base to avoid compounding
  const commodities = generateCommodities();
  const commodity = commodities.find(c => c.id === commodityId);
  if (!commodity) {
    // Fallback: return current prices unchanged if commodity not found
    return { buy: _currentBuy, sell: _currentSell };
  }
  
  const rules = rulesByType[stationType];
  if (!rules) {
    return { buy: commodity.baseBuy, sell: commodity.baseSell };
  }
  
  // Apply station type modifiers (cheap/expensive)
  const cheap = rules.cheap.includes(commodityId);
  const expensive = rules.expensive.includes(commodityId);
  const buyMultiplier = cheap ? 0.45 : expensive ? 1.75 : 1.0;
  const sellMultiplier = cheap ? 0.55 : expensive ? 1.9 : 1.0;
  
  let baseBuy = Math.round(commodity.baseBuy * buyMultiplier);
  let baseSell = Math.round(commodity.baseSell * sellMultiplier);
  
  // Apply affinity
  const config = getEconomyConfig();
  const aff = config.affinity[stationType]?.[commodity.category];
  if (aff) {
    baseBuy = Math.round(baseBuy * aff.buy);
    baseSell = Math.round(baseSell * aff.sell);
  }
  
  // Ensure minimum spread
  const adjusted = ensureSpread({
    buy: baseBuy,
    sell: baseSell,
    minPercent: config.minSpreadPercent,
    minAbsolute: config.minSpreadAbsolute,
  });
  
  // Apply stock curve (this is the only dynamic multiplier based on current stock)
  const result = applyStockCurve(commodity.category, adjusted.buy, adjusted.sell, stock, targetStock);
  
  // Safety cap: prices should never exceed 10x base (prevents any edge case runaway)
  const MAX_MULTIPLIER = 10;
  const maxBuy = commodity.baseBuy * MAX_MULTIPLIER;
  const maxSell = commodity.baseSell * MAX_MULTIPLIER;
  
  return {
    buy: Math.min(result.buy, maxBuy),
    sell: Math.min(result.sell, maxSell),
  };
}

function getCraftFloorFor(category: Commodity['category']): number {
  const config = getEconomyConfig();
  return config.craftFloorMargin[category] || 20;
}

export function priceForStation(type: StationType, commodities: Commodity[], here?: [number, number, number], stationsMeta?: StationMeta[], stationId?: string, activeEvents?: MarketEvent[]): StationInventory {
  ensureFeaturedInitialized(stationsMeta);
  const rules = rulesByType[type];
  const config = getEconomyConfig();
  const volatility = config.volatility;
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
    const adjusted = ensureSpread({ buy, sell, minPercent: config.minSpreadPercent, minAbsolute: config.minSpreadAbsolute });
    const d = nearestProducerDistance(c.id, here, stationsMeta);
    const distPremium = distancePremiumFor(c.category, d);
    const featuredM = getFeaturedMultiplier(stationId, c.id);
    // Apply market event multipliers (optional - only if provided)
    const eventMult = (activeEvents && activeEvents.length > 0)
      ? getEventPriceMultiplier(activeEvents, stationId || '', c.id, c.category)
      : 1.0;
    // Perishable goods have 50% higher sell prices (compensates for spoilage risk)
    const perishableBonus = isPerishable(c.id) ? 1.5 : 1.0;
    // Gated commodities (require special cargo holds) have higher profit margins
    const gatedBonus = (gatedCommodities as readonly string[]).includes(c.id) ? GATED_COMMODITY_PROFIT_MULTIPLIER : 1.0;
    let sellExtra = Math.round(adjusted.sell * (1 + distPremium) * perishableBonus * gatedBonus);
    sellExtra = Math.round(sellExtra * featuredM * eventMult);
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
    // Base floor ensures minimum profitability even on short routes
    // 20% base margin + distance premium ensures trades are always worth making
    // Perishable goods have 50% higher floor (compensates for spoilage risk)
    // Gated commodities have higher floor (reward for investing in cargo upgrades)
    const baseFloor = Math.round(c.baseSell * (1 + 0.2 + distPremium) * perishableBonus * gatedBonus);
    if (finalSell < baseFloor) finalSell = baseFloor;
    inv[c.id] = { buy: withStock.buy, sell: finalSell, stock, canBuy, canSell: true };
  }
  return inv;
}


