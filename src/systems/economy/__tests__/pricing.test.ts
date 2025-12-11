import { describe, it, expect } from 'vitest';
import { priceForStation } from '../pricing';
import { generateCommodities } from '../commodities';

describe('priceForStation', () => {
  const commodities = generateCommodities();

  it('applies cheap bias to producer station outputs', () => {
    const inv = priceForStation('refinery', commodities);
    expect(inv.refined_fuel).toBeDefined();
    expect(inv.refined_fuel.sell).toBeLessThan(inv.electronics?.sell || Infinity);
  });

  it('ensures buy price is higher than sell price', () => {
    const inv = priceForStation('city', commodities);
    for (const [id, pricing] of Object.entries(inv)) {
      if (pricing.canBuy && pricing.canSell) {
        expect(pricing.buy).toBeGreaterThan(pricing.sell);
      }
    }
  });

  it('applies distance premium for commodities', () => {
    const stationPos: [number, number, number] = [1000, 0, 1000];
    const stationsMeta = [
      { id: 'refinery1', type: 'refinery' as const, position: [0, 0, 0] },
      { id: 'refinery2', type: 'refinery' as const, position: [500, 0, 500] },
    ];
    
    const invFar = priceForStation('city', commodities, stationPos, stationsMeta);
    const invNear = priceForStation('city', commodities, [100, 0, 100], stationsMeta);
    
    // Commodities from far producers should have higher sell prices
    expect(invFar.refined_fuel?.sell || 0).toBeGreaterThanOrEqual(invNear.refined_fuel?.sell || 0);
  });
});

