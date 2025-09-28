import { z } from 'zod';

export type StationType = 'refinery' | 'fabricator' | 'power_plant' | 'city' | 'trading_post' | 'mine' | 'farm' | 'research' | 'orbital_hab' | 'shipyard' | 'pirate';

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


