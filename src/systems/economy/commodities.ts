import type { Commodity } from '../../domain/types/economy_types';

export function generateCommodities(): Commodity[] {
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
    { id: 'alloys', name: 'Advanced Alloys', category: 'industrial', baseBuy: 180, baseSell: 150 },
    { id: 'electronics', name: 'Electronics', category: 'tech', baseBuy: 210, baseSell: 180 },
    { id: 'microchips', name: 'Microchips', category: 'tech', baseBuy: 380, baseSell: 320 },
    { id: 'batteries', name: 'Batteries', category: 'energy', baseBuy: 210, baseSell: 180 },
    { id: 'medical_supplies', name: 'Medical Supplies', category: 'medical', baseBuy: 260, baseSell: 230 },
    { id: 'pharmaceuticals', name: 'Pharmaceuticals', category: 'medical', baseBuy: 360, baseSell: 320 },
    { id: 'textiles', name: 'Textiles', category: 'consumer', baseBuy: 150, baseSell: 130 },
    { id: 'plastics', name: 'Plastics', category: 'industrial', baseBuy: 70, baseSell: 60 },
    { id: 'machinery', name: 'Machinery', category: 'industrial', baseBuy: 520, baseSell: 460 },
    { id: 'fertilizer', name: 'Fertilizer', category: 'industrial', baseBuy: 90, baseSell: 75 },
    { id: 'luxury_goods', name: 'Luxury Goods', category: 'luxury', baseBuy: 800, baseSell: 700 },
    { id: 'data_drives', name: 'Data Drives', category: 'tech', baseBuy: 310, baseSell: 270 },
    { id: 'nanomaterials', name: 'Nanomaterials', category: 'tech', baseBuy: 700, baseSell: 620 },
  ];
  return commons;
}


