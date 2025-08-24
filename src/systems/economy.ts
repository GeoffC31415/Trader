import { z } from 'zod';

export type StationType = 'refinery' | 'fabricator' | 'power_plant' | 'city' | 'trading_post' | 'mine' | 'farm' | 'research' | 'orbital_hab' | 'shipyard';

export const CommoditySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['fuel', 'gas', 'food', 'luxury', 'raw', 'industrial', 'tech', 'medical', 'energy', 'consumer']),
  baseBuy: z.number().positive(),
  baseSell: z.number().positive(),
});
export type Commodity = z.infer<typeof CommoditySchema>;

export type StationInventoryItem = {
  buy: number;
  sell: number;
  stock?: number;
  // Whether the station will buy this item from the player (player can sell to station)
  canBuy?: boolean;
  // Whether the station will sell this item to the player (player can buy from station)
  canSell?: boolean;
};
export type StationInventory = Record<string, StationInventoryItem>;

export type ProcessRecipe = {
  inputId: string;
  outputId: string;
  inputPerOutput: number;
};

export const processRecipes: Record<StationType, ProcessRecipe[]> = {
  refinery: [
    { inputId: 'iron_ore', outputId: 'steel', inputPerOutput: 2 },
    { inputId: 'copper_ore', outputId: 'alloys', inputPerOutput: 2 },
    { inputId: 'silicon', outputId: 'electronics', inputPerOutput: 3 },
    { inputId: 'hydrogen', outputId: 'refined_fuel', inputPerOutput: 3 },
    { inputId: 'refined_fuel', outputId: 'plastics', inputPerOutput: 2 },
  ],
  fabricator: [
    { inputId: 'steel', outputId: 'machinery', inputPerOutput: 2 },
    { inputId: 'electronics', outputId: 'microchips', inputPerOutput: 2 },
    { inputId: 'plastics', outputId: 'textiles', inputPerOutput: 3 },
    { inputId: 'alloys', outputId: 'machinery', inputPerOutput: 2 },
  ],
  power_plant: [
    { inputId: 'refined_fuel', outputId: 'batteries', inputPerOutput: 2 },
  ],
  city: [
    { inputId: 'coffee', outputId: 'luxury_goods', inputPerOutput: 2 },
    { inputId: 'tobacco', outputId: 'luxury_goods', inputPerOutput: 2 },
    { inputId: 'spices', outputId: 'luxury_goods', inputPerOutput: 2 },
    { inputId: 'textiles', outputId: 'luxury_goods', inputPerOutput: 4 },
  ],
  trading_post: [],
  mine: [],
  farm: [
    { inputId: 'grain', outputId: 'meat', inputPerOutput: 3 },
    { inputId: 'grain', outputId: 'sugar', inputPerOutput: 2 },
    { inputId: 'fertilizer', outputId: 'grain', inputPerOutput: 1 },
  ],
  research: [
    { inputId: 'data_drives', outputId: 'nanomaterials', inputPerOutput: 3 },
    { inputId: 'electronics', outputId: 'data_drives', inputPerOutput: 2 },
    { inputId: 'medical_supplies', outputId: 'pharmaceuticals', inputPerOutput: 2 },
    { inputId: 'microchips', outputId: 'nanomaterials', inputPerOutput: 4 },
  ],
  orbital_hab: [
    { inputId: 'water', outputId: 'oxygen', inputPerOutput: 2 },
  ],
  shipyard: [],
};

export function findRecipeForStation(type: StationType, inputId: string): ProcessRecipe | undefined {
  const list = processRecipes[type] || [];
  return list.find(r => r.inputId === inputId);
}

export function generateCommodities(): Commodity[] {
  // Core/common goods
  const commons: Commodity[] = [
    { id: 'refined_fuel', name: 'Refined Fuel', category: 'fuel', baseBuy: 120, baseSell: 105 },
    { id: 'hydrogen', name: 'Hydrogen', category: 'gas', baseBuy: 35, baseSell: 30 },
    { id: 'oxygen', name: 'Oxygen', category: 'gas', baseBuy: 40, baseSell: 34 },
    { id: 'water', name: 'Water', category: 'consumer', baseBuy: 22, baseSell: 18 },
    { id: 'sugar', name: 'Sugar', category: 'food', baseBuy: 15, baseSell: 10 },
    { id: 'coffee', name: 'Coffee', category: 'luxury', baseBuy: 45, baseSell: 38 },
    { id: 'tobacco', name: 'Tobacco', category: 'luxury', baseBuy: 60, baseSell: 50 },
    { id: 'grain', name: 'Grain', category: 'food', baseBuy: 12, baseSell: 9 },
    { id: 'meat', name: 'Meat', category: 'food', baseBuy: 48, baseSell: 40 },
    { id: 'spices', name: 'Spices', category: 'luxury', baseBuy: 140, baseSell: 120 },
    { id: 'rare_minerals', name: 'Rare Minerals', category: 'raw', baseBuy: 300, baseSell: 260 },
    { id: 'iron_ore', name: 'Iron Ore', category: 'raw', baseBuy: 28, baseSell: 22 },
    { id: 'copper_ore', name: 'Copper Ore', category: 'raw', baseBuy: 45, baseSell: 36 },
    { id: 'silicon', name: 'Silicon', category: 'raw', baseBuy: 50, baseSell: 42 },
    { id: 'steel', name: 'Steel', category: 'industrial', baseBuy: 110, baseSell: 95 },
    { id: 'alloys', name: 'Advanced Alloys', category: 'industrial', baseBuy: 220, baseSell: 190 },
    { id: 'electronics', name: 'Electronics', category: 'tech', baseBuy: 250, baseSell: 220 },
    { id: 'microchips', name: 'Microchips', category: 'tech', baseBuy: 420, baseSell: 370 },
    { id: 'batteries', name: 'Batteries', category: 'energy', baseBuy: 180, baseSell: 155 },
    { id: 'medical_supplies', name: 'Medical Supplies', category: 'medical', baseBuy: 260, baseSell: 230 },
    { id: 'pharmaceuticals', name: 'Pharmaceuticals', category: 'medical', baseBuy: 360, baseSell: 320 },
    { id: 'textiles', name: 'Textiles', category: 'consumer', baseBuy: 65, baseSell: 55 },
    { id: 'plastics', name: 'Plastics', category: 'industrial', baseBuy: 80, baseSell: 68 },
    { id: 'machinery', name: 'Machinery', category: 'industrial', baseBuy: 520, baseSell: 460 },
    { id: 'fertilizer', name: 'Fertilizer', category: 'industrial', baseBuy: 90, baseSell: 75 },
    { id: 'luxury_goods', name: 'Luxury Goods', category: 'luxury', baseBuy: 800, baseSell: 700 },
    { id: 'data_drives', name: 'Data Drives', category: 'tech', baseBuy: 310, baseSell: 270 },
    { id: 'nanomaterials', name: 'Nanomaterials', category: 'tech', baseBuy: 700, baseSell: 620 },
  ];
  return commons;
}

function fluctuate(value: number, volatility: number): number {
  const factor = 1 + (Math.random() * 2 - 1) * volatility; // +/- volatility
  return Math.max(1, Math.round(value * factor));
}

export type EnsureSpreadInput = {
  buy: number;
  sell: number;
  minPercent?: number; // e.g., 0.05 = 5% of mid
  minAbsolute?: number; // absolute minimum spread in credits
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
  // Adjust symmetrically around mid to preserve average price level
  const half = Math.floor(targetSpread / 2);
  const adjustedSell = Math.max(minimumPrice, Math.floor(mid - half));
  const adjustedBuy = Math.max(adjustedSell + targetSpread, Math.round(mid + (targetSpread - half)));
  return { buy: adjustedBuy, sell: adjustedSell };
}

type StationPriceRules = {
  cheap: string[];
  expensive: string[];
  stockBoost?: Partial<Record<string, number>>; // default stock amounts
};

const rulesByType: Record<StationType, StationPriceRules> = {
  refinery: {
    cheap: ['hydrogen', 'refined_fuel'],
    expensive: ['electronics', 'microchips', 'luxury_goods'],
    stockBoost: { refined_fuel: 200, hydrogen: 400 },
  },
  fabricator: {
    cheap: ['steel', 'plastics', 'electronics', 'microchips', 'alloys'],
    expensive: ['rare_minerals', 'spices', 'luxury_goods'],
    stockBoost: { electronics: 100, microchips: 60, alloys: 80 },
  },
  power_plant: {
    cheap: ['batteries', 'refined_fuel'],
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
};

export type PriceBias = 'cheap' | 'expensive' | 'normal';
export function getPriceBiasForStation(type: StationType, commodityId: string): PriceBias {
  const rules = rulesByType[type];
  if (!rules) return 'normal';
  if (rules.cheap.includes(commodityId)) return 'cheap';
  if (rules.expensive.includes(commodityId)) return 'expensive';
  return 'normal';
}

export function priceForStation(type: StationType, commodities: Commodity[]): StationInventory {
  const rules = rulesByType[type];
  const volatility = 0.1;
  const inv: StationInventory = {};
  const recipes = processRecipes[type] || [];
  const inputSet = new Set(recipes.map(r => r.inputId));
  const outputSet = new Set(recipes.map(r => r.outputId));
  const isProducer = recipes.length > 0;
  for (const c of commodities) {
    const cheap = rules.cheap.includes(c.id);
    const expensive = rules.expensive.includes(c.id);
    // Asymmetric multipliers to create clearer trade opportunities
    const buyMultiplier = cheap ? 0.75 : expensive ? 1.25 : 1.0;
    const sellMultiplier = cheap ? 0.85 : expensive ? 1.35 : 1.0;
    const baseBuy = Math.round(c.baseBuy * buyMultiplier);
    const baseSell = Math.round(c.baseSell * sellMultiplier);
    const buy = fluctuate(baseBuy, volatility);
    const sell = fluctuate(baseSell, volatility);
    const adjusted = ensureSpread({ buy, sell, minPercent: 0.04, minAbsolute: 2 });
    const stock = (rules.stockBoost && (rules.stockBoost as any)[c.id]) || (cheap ? 200 : 50);
    // Directional trading rules (outputs take precedence over inputs for chained recipes)
    if (isProducer) {
      if (outputSet.has(c.id)) {
        // Sell outputs, but do not buy them
        inv[c.id] = { buy: adjusted.buy, sell: adjusted.sell, stock, canBuy: false, canSell: true };
        continue;
      }
      if (inputSet.has(c.id)) {
        // Do not trade pure inputs (neither buy nor sell)
        // Except: food is always bought by stations
        const isFood = c.category === 'food' || c.id === 'water';
        const forceBuy = isFood;
        inv[c.id] = { buy: adjusted.buy, sell: adjusted.sell, stock, canBuy: forceBuy, canSell: false };
        continue;
      }
      // Other unrelated goods: buy only
      // Ensure everyone buys food. Also ensure non-producers for specific energy goods buy them.
      const isFood = c.category === 'food' || c.id === 'water';
      const canBuy = isFood || true;
      inv[c.id] = { buy: adjusted.buy, sell: adjusted.sell, stock, canBuy, canSell: false };
      continue;
    }
    // 3) Non-producing stations trade normally in both directions
    let canBuy = true;
    // All stations buy food
    const isFood = c.category === 'food' || c.id === 'water';
    if (isFood) canBuy = true;
    // Stations that don't produce refined_fuel or batteries should buy them
    if (c.id === 'refined_fuel' || c.id === 'batteries') canBuy = true;
    inv[c.id] = { buy: adjusted.buy, sell: adjusted.sell, stock, canBuy, canSell: true };
  }
  return inv;
}


