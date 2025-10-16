import type { Commodity } from '../../domain/types/economy_types';

export function generateCommodities(): Commodity[] {
  const commons: Commodity[] = [
    { id: 'refined_fuel', name: 'Refined Fuel', category: 'fuel', baseBuy: 120, baseSell: 105, icon: '/icons/commodities/refined_fuel.png' },
    { id: 'hydrogen', name: 'Hydrogen', category: 'gas', baseBuy: 35, baseSell: 30, icon: '/icons/commodities/hydrogen.png' },
    { id: 'oxygen', name: 'Oxygen', category: 'gas', baseBuy: 40, baseSell: 34, icon: '/icons/commodities/oxygen.png' },
    { id: 'water', name: 'Water', category: 'consumer', baseBuy: 22, baseSell: 18, icon: '/icons/commodities/water.png' },
    { id: 'sugar', name: 'Sugar', category: 'food', baseBuy: 15, baseSell: 10, icon: '/icons/commodities/sugar.png' },
    { id: 'coffee', name: 'Coffee', category: 'luxury', baseBuy: 45, baseSell: 38, icon: '/icons/commodities/coffee.png' },
    { id: 'tobacco', name: 'Tobacco', category: 'luxury', baseBuy: 60, baseSell: 50, icon: '/icons/commodities/tobacco.png' },
    { id: 'grain', name: 'Grain', category: 'food', baseBuy: 12, baseSell: 9, icon: '/icons/commodities/grain.png' },
    { id: 'meat', name: 'Meat', category: 'food', baseBuy: 48, baseSell: 40, icon: '/icons/commodities/meat.png' },
    { id: 'spices', name: 'Spices', category: 'luxury', baseBuy: 140, baseSell: 120, icon: '/icons/commodities/spices.png' },
    { id: 'rare_minerals', name: 'Rare Minerals', category: 'raw', baseBuy: 300, baseSell: 260, icon: '/icons/commodities/rare_minerals.png' },
    { id: 'iron_ore', name: 'Iron Ore', category: 'raw', baseBuy: 28, baseSell: 22, icon: '/icons/commodities/iron_ore.png' },
    { id: 'copper_ore', name: 'Copper Ore', category: 'raw', baseBuy: 45, baseSell: 36, icon: '/icons/commodities/copper_ore.png' },
    { id: 'silicon', name: 'Silicon', category: 'raw', baseBuy: 50, baseSell: 42, icon: '/icons/commodities/silicon.png' },
    { id: 'steel', name: 'Steel', category: 'industrial', baseBuy: 110, baseSell: 95, icon: '/icons/commodities/steel.png' },
    { id: 'alloys', name: 'Advanced Alloys', category: 'industrial', baseBuy: 180, baseSell: 150, icon: '/icons/commodities/alloys.png' },
    { id: 'electronics', name: 'Electronics', category: 'tech', baseBuy: 210, baseSell: 180, icon: '/icons/commodities/electronics.png' },
    { id: 'microchips', name: 'Microchips', category: 'tech', baseBuy: 380, baseSell: 320, icon: '/icons/commodities/microchips.png' },
    { id: 'batteries', name: 'Batteries', category: 'energy', baseBuy: 210, baseSell: 180, icon: '/icons/commodities/batteries.png' },
    { id: 'medical_supplies', name: 'Medical Supplies', category: 'medical', baseBuy: 260, baseSell: 230, icon: '/icons/commodities/medical_supplies.png' },
    { id: 'pharmaceuticals', name: 'Pharmaceuticals', category: 'medical', baseBuy: 360, baseSell: 320, icon: '/icons/commodities/pharmaceuticals.png' },
    { id: 'textiles', name: 'Textiles', category: 'consumer', baseBuy: 150, baseSell: 130, icon: '/icons/commodities/textiles.png' },
    { id: 'plastics', name: 'Plastics', category: 'industrial', baseBuy: 70, baseSell: 60, icon: '/icons/commodities/plastics.png' },
    { id: 'machinery', name: 'Machinery', category: 'industrial', baseBuy: 520, baseSell: 460, icon: '/icons/commodities/machinery.png' },
    { id: 'fertilizer', name: 'Fertilizer', category: 'industrial', baseBuy: 90, baseSell: 75, icon: '/icons/commodities/fertilizer.png' },
    { id: 'luxury_goods', name: 'Luxury Goods', category: 'luxury', baseBuy: 800, baseSell: 700, icon: '/icons/commodities/luxury_goods.png' },
    { id: 'data_drives', name: 'Data Drives', category: 'tech', baseBuy: 310, baseSell: 270, icon: '/icons/commodities/data_drives.png' },
    { id: 'nanomaterials', name: 'Nanomaterials', category: 'tech', baseBuy: 700, baseSell: 620, icon: '/icons/commodities/nanomaterials.png' },
  ];
  return commons;
}


