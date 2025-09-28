import type { StationType } from '../../domain/types/economy_types';

export type ProcessRecipe = {
  inputId: string;
  outputId: string;
  inputPerOutput: number;
};

export const processRecipes: Record<StationType, ProcessRecipe[]> = {
  refinery: [
    { inputId: 'iron_ore', outputId: 'steel', inputPerOutput: 2 },
    { inputId: 'copper_ore', outputId: 'alloys', inputPerOutput: 3 },
    { inputId: 'hydrogen', outputId: 'refined_fuel', inputPerOutput: 3 },
  ],
  fabricator: [
    { inputId: 'steel', outputId: 'machinery', inputPerOutput: 3 },
    { inputId: 'electronics', outputId: 'microchips', inputPerOutput: 3 },
    { inputId: 'plastics', outputId: 'textiles', inputPerOutput: 1 },
    { inputId: 'silicon', outputId: 'electronics', inputPerOutput: 3 },
    { inputId: 'alloys', outputId: 'machinery', inputPerOutput: 3 },
  ],
  power_plant: [
    { inputId: 'refined_fuel', outputId: 'batteries', inputPerOutput: 2 },
  ],
  city: [
    { inputId: 'coffee', outputId: 'luxury_goods', inputPerOutput: 3 },
    { inputId: 'tobacco', outputId: 'luxury_goods', inputPerOutput: 3 },
    { inputId: 'spices', outputId: 'luxury_goods', inputPerOutput: 3 },
    { inputId: 'textiles', outputId: 'luxury_goods', inputPerOutput: 3 },
  ],
  trading_post: [],
  mine: [],
  farm: [
    { inputId: 'grain', outputId: 'meat', inputPerOutput: 3 },
    { inputId: 'fertilizer', outputId: 'grain', inputPerOutput: 1 },
  ],
  research: [
    { inputId: 'data_drives', outputId: 'nanomaterials', inputPerOutput: 3 },
    { inputId: 'electronics', outputId: 'data_drives', inputPerOutput: 2 },
    { inputId: 'medical_supplies', outputId: 'pharmaceuticals', inputPerOutput: 3 },
    { inputId: 'microchips', outputId: 'nanomaterials', inputPerOutput: 4 },
  ],
  orbital_hab: [
    { inputId: 'water', outputId: 'oxygen', inputPerOutput: 2 },
  ],
  shipyard: [],
  pirate: [
    { inputId: 'iron_ore', outputId: 'steel', inputPerOutput: 2 },
    { inputId: 'copper_ore', outputId: 'alloys', inputPerOutput: 3 },
    { inputId: 'hydrogen', outputId: 'refined_fuel', inputPerOutput: 3 },
    { inputId: 'steel', outputId: 'machinery', inputPerOutput: 3 },
    { inputId: 'alloys', outputId: 'machinery', inputPerOutput: 3 },
    { inputId: 'silicon', outputId: 'electronics', inputPerOutput: 3 },
    { inputId: 'electronics', outputId: 'microchips', inputPerOutput: 3 },
    { inputId: 'plastics', outputId: 'textiles', inputPerOutput: 1 },
    { inputId: 'refined_fuel', outputId: 'batteries', inputPerOutput: 2 },
    { inputId: 'coffee', outputId: 'luxury_goods', inputPerOutput: 3 },
    { inputId: 'tobacco', outputId: 'luxury_goods', inputPerOutput: 3 },
    { inputId: 'spices', outputId: 'luxury_goods', inputPerOutput: 3 },
    { inputId: 'textiles', outputId: 'luxury_goods', inputPerOutput: 3 },
    { inputId: 'grain', outputId: 'meat', inputPerOutput: 3 },
    { inputId: 'fertilizer', outputId: 'grain', inputPerOutput: 1 },
    { inputId: 'data_drives', outputId: 'nanomaterials', inputPerOutput: 3 },
    { inputId: 'electronics', outputId: 'data_drives', inputPerOutput: 2 },
    { inputId: 'medical_supplies', outputId: 'pharmaceuticals', inputPerOutput: 3 },
    { inputId: 'microchips', outputId: 'nanomaterials', inputPerOutput: 4 },
    { inputId: 'water', outputId: 'oxygen', inputPerOutput: 2 },
  ],
};

export function findRecipeForStation(type: StationType, inputId: string): ProcessRecipe | undefined {
  const list = processRecipes[type] || [];
  return list.find(r => r.inputId === inputId);
}


