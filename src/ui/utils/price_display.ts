/**
 * Utility functions for calculating and displaying adjusted prices
 * based on reputation and station type.
 */

export function getAdjustedPrices(
  basePrice: { buy: number; sell: number },
  reputation: number
): { adjBuy: number; adjSell: number } {
  const buyDiscount = Math.max(0, Math.min(0.10, 0.10 * (reputation / 100)));
  const sellPremium = Math.max(0, Math.min(0.07, 0.07 * (reputation / 100)));
  return {
    adjBuy: Math.max(1, Math.round(basePrice.buy * (1 - buyDiscount))),
    adjSell: Math.max(1, Math.round(basePrice.sell * (1 + sellPremium))),
  };
}

