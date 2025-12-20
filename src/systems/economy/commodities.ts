import type { Commodity } from '../../domain/types/economy_types';

export function generateCommodities(): Commodity[] {
  // Pricing tiers based on production chain depth:
  // Tier 0 (raw/farmed): Cheapest, small margins
  // Tier 1 (first processing): ~35% margin on input cost
  // Tier 2 (second processing): ~30% margin on Tier 1 input
  // Tier 3 (third processing): ~25% margin on Tier 2 input
  //
  // Recipe chain examples:
  // - hydrogen(35) x3 → refined_fuel(145) x2 → batteries(420)
  // - silicon(50) x3 → electronics(220) x3 → microchips(950)
  // - copper_ore(45) x3 → alloys(190) x3 → machinery(800)
  // - electronics(220) x2 → data_drives(620) x3 → nanomaterials(2600)
  const commons: Commodity[] = [
    // === TIER 0: Raw materials (mined/farmed) ===
    { id: 'hydrogen', name: 'Hydrogen', category: 'gas', baseBuy: 35, baseSell: 30, icon: '/icons/commodities/hydrogen.png' },
    { id: 'oxygen', name: 'Oxygen', category: 'gas', baseBuy: 45, baseSell: 38, icon: '/icons/commodities/oxygen.png' },
    { id: 'water', name: 'Water', category: 'consumer', baseBuy: 22, baseSell: 18, icon: '/icons/commodities/water.png' },
    { id: 'iron_ore', name: 'Iron Ore', category: 'raw', baseBuy: 28, baseSell: 22, icon: '/icons/commodities/iron_ore.png' },
    { id: 'copper_ore', name: 'Copper Ore', category: 'raw', baseBuy: 45, baseSell: 36, icon: '/icons/commodities/copper_ore.png' },
    { id: 'silicon', name: 'Silicon', category: 'raw', baseBuy: 50, baseSell: 42, icon: '/icons/commodities/silicon.png' },
    { id: 'rare_minerals', name: 'Rare Minerals', category: 'raw', baseBuy: 320, baseSell: 270, icon: '/icons/commodities/rare_minerals.png' },
    { id: 'grain', name: 'Grain', category: 'food', baseBuy: 12, baseSell: 9, icon: '/icons/commodities/grain.png' },
    { id: 'sugar', name: 'Sugar', category: 'food', baseBuy: 15, baseSell: 10, icon: '/icons/commodities/sugar.png' },
    { id: 'plastics', name: 'Plastics', category: 'industrial', baseBuy: 70, baseSell: 60, icon: '/icons/commodities/plastics.png' },
    { id: 'fertilizer', name: 'Fertilizer', category: 'industrial', baseBuy: 55, baseSell: 45, icon: '/icons/commodities/fertilizer.png' },
    
    // === TIER 0.5: Luxury inputs (farmed/gathered, feed into luxury_goods) ===
    { id: 'coffee', name: 'Coffee', category: 'luxury', baseBuy: 85, baseSell: 70, icon: '/icons/commodities/coffee.png' },
    { id: 'tobacco', name: 'Tobacco', category: 'luxury', baseBuy: 95, baseSell: 80, icon: '/icons/commodities/tobacco.png' },
    { id: 'spices', name: 'Spices', category: 'luxury', baseBuy: 160, baseSell: 135, icon: '/icons/commodities/spices.png' },
    { id: 'medical_supplies', name: 'Medical Supplies', category: 'medical', baseBuy: 280, baseSell: 240, icon: '/icons/commodities/medical_supplies.png' },

    // === TIER 1: First processing (from raw) ===
    // steel: 2 iron_ore(28) = 56 input → sell ~95 (+70% margin)
    { id: 'steel', name: 'Steel', category: 'industrial', baseBuy: 110, baseSell: 95, icon: '/icons/commodities/steel.png' },
    // alloys: 3 copper_ore(45) = 135 input → sell ~190 (+40% margin)
    { id: 'alloys', name: 'Advanced Alloys', category: 'industrial', baseBuy: 220, baseSell: 190, icon: '/icons/commodities/alloys.png' },
    // refined_fuel: 3 hydrogen(35) = 105 input → sell ~145 (+38% margin)
    { id: 'refined_fuel', name: 'Refined Fuel', category: 'fuel', baseBuy: 165, baseSell: 145, icon: '/icons/commodities/refined_fuel.png' },
    // electronics: 3 silicon(50) = 150 input → sell ~220 (+47% margin)
    { id: 'electronics', name: 'Electronics', category: 'tech', baseBuy: 250, baseSell: 220, icon: '/icons/commodities/electronics.png' },
    // textiles: 1 plastics(70) = 70 input → sell ~105 (+50% margin)
    { id: 'textiles', name: 'Textiles', category: 'consumer', baseBuy: 120, baseSell: 105, icon: '/icons/commodities/textiles.png' },
    // meat: 3 grain(12) = 36 input → sell ~55 (+53% margin)
    { id: 'meat', name: 'Meat', category: 'food', baseBuy: 65, baseSell: 55, icon: '/icons/commodities/meat.png' },

    // === TIER 2: Second processing ===
    // batteries: 2 refined_fuel(165) = 330 input → sell ~450 (+36% margin)
    { id: 'batteries', name: 'Batteries', category: 'energy', baseBuy: 520, baseSell: 450, icon: '/icons/commodities/batteries.png' },
    // microchips: 3 electronics(250) = 750 input → sell ~1000 (+33% margin)
    { id: 'microchips', name: 'Microchips', category: 'tech', baseBuy: 1150, baseSell: 1000, icon: '/icons/commodities/microchips.png' },
    // data_drives: 2 electronics(250) = 500 input → sell ~680 (+36% margin)
    { id: 'data_drives', name: 'Data Drives', category: 'tech', baseBuy: 780, baseSell: 680, icon: '/icons/commodities/data_drives.png' },
    // machinery: 3 alloys(220) = 660 OR 3 steel(110) = 330 → sell ~850 (29%/158% margin)
    { id: 'machinery', name: 'Machinery', category: 'industrial', baseBuy: 980, baseSell: 850, icon: '/icons/commodities/machinery.png' },
    // pharmaceuticals: 3 medical_supplies(280) = 840 input → sell ~1120 (+33% margin)
    { id: 'pharmaceuticals', name: 'Pharmaceuticals', category: 'medical', baseBuy: 1280, baseSell: 1120, icon: '/icons/commodities/pharmaceuticals.png' },

    // === TIER 3: Tertiary processing (highest value) ===
    // luxury_goods: 3 textiles(120) = 360 OR 3 coffee(85) = 255 → sell ~500 (39%/96% margin)
    { id: 'luxury_goods', name: 'Luxury Goods', category: 'luxury', baseBuy: 580, baseSell: 500, icon: '/icons/commodities/luxury_goods.png' },
    // nanomaterials: 3 data_drives(780) = 2340 OR 4 microchips(1150) = 4600 → sell ~3100 (data path +32%)
    { id: 'nanomaterials', name: 'Nanomaterials', category: 'tech', baseBuy: 3550, baseSell: 3100, icon: '/icons/commodities/nanomaterials.png' },
  ];
  return commons;
}


