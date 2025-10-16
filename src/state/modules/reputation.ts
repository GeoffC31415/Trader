/**
 * Reputation Module
 * 
 * Handles reputation-based calculations for pricing, bonuses, and game mechanics.
 */

import { getUnfriendlyMarkup, getEscortCount } from '../helpers/reputation_helpers';

/**
 * Calculate price discount for buying based on reputation
 * Positive reputation gives discount, negative gives markup
 * 
 * @param reputation - Station reputation (0-100 or negative)
 * @returns Discount factor (0-0.10 for discount) or markup (for negative rep)
 */
export function getBuyPriceModifier(reputation: number): {
  discount: number;
  markup: number;
} {
  // Positive rep: discount, negative rep: markup
  const discount =
    reputation >= 0 ? Math.max(0, Math.min(0.1, 0.1 * (reputation / 100))) : 0;
  const markup = reputation < 0 ? getUnfriendlyMarkup(reputation) : 0;

  return { discount, markup };
}

/**
 * Calculate price premium/penalty for selling based on reputation
 * Positive reputation gives premium, negative gives penalty
 * 
 * @param reputation - Station reputation (0-100 or negative)
 * @returns Premium factor (0-0.07 for premium) or penalty (for negative rep)
 */
export function getSellPriceModifier(reputation: number): {
  premium: number;
  penalty: number;
} {
  // Positive rep: premium, negative rep: penalty
  const premium =
    reputation >= 0 ? Math.max(0, Math.min(0.07, 0.07 * (reputation / 100))) : 0;
  const penalty = reputation < 0 ? getUnfriendlyMarkup(reputation) : 0;

  return { premium, penalty };
}

/**
 * Apply reputation modifier to a buy price
 * 
 * @param basePrice - Base buy price
 * @param reputation - Station reputation
 * @returns Adjusted price
 */
export function applyReputationToBuyPrice(
  basePrice: number,
  reputation: number
): number {
  const { discount, markup } = getBuyPriceModifier(reputation);
  return Math.max(1, Math.round(basePrice * (1 - discount + markup)));
}

/**
 * Apply reputation modifier to a sell price
 * 
 * @param basePrice - Base sell price
 * @param reputation - Station reputation
 * @returns Adjusted price
 */
export function applyReputationToSellPrice(
  basePrice: number,
  reputation: number
): number {
  const { premium, penalty } = getSellPriceModifier(reputation);
  return Math.max(1, Math.round(basePrice * (1 + premium - penalty)));
}

/**
 * Calculate reputation gain from buying
 * Small gain proportional to quantity
 * 
 * @param quantity - Number of units bought
 * @returns Reputation delta
 */
export function getReputationFromBuy(quantity: number): number {
  return Math.min(2, 0.02 * quantity);
}

/**
 * Calculate reputation gain from selling
 * Scales with station need and quantity
 * 
 * @param quantity - Number of units sold
 * @param priceBias - Station's price bias for commodity ('cheap' | 'normal' | 'expensive')
 * @param sellPrice - Sell price at station
 * @param buyPrice - Buy price at station
 * @returns Reputation delta
 */
export function getReputationFromSell(
  quantity: number,
  priceBias: 'cheap' | 'normal' | 'expensive',
  sellPrice: number,
  buyPrice: number
): number {
  const biasWeight = priceBias === 'expensive' ? 1.6 : priceBias === 'cheap' ? 0.6 : 1.0;
  const priceWeight = Math.max(0.6, Math.min(2.0, sellPrice / Math.max(1, buyPrice)));
  return Math.min(5, 0.06 * quantity * biasWeight * priceWeight);
}

/**
 * Get number of escort ships based on reputation
 * 
 * @param reputation - Station reputation
 * @returns Number of escorts (0-2)
 */
export function getEscortCountForReputation(reputation: number): number {
  return getEscortCount(reputation);
}

/**
 * Get escort cargo capacity per ship based on player ship cargo
 * 
 * @param playerCargoCapacity - Player's max cargo capacity
 * @returns Cargo capacity per escort ship
 */
export function getEscortCargoCapacity(playerCargoCapacity: number): number {
  return Math.floor(playerCargoCapacity * 0.5);
}

