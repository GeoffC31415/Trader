import { describe, it, expect } from 'vitest';
import { getPriceDiscount, getContractMultiplierBonus } from '../reputation_helpers';

describe('reputation_helpers', () => {
  describe('getPriceDiscount', () => {
    it('returns 0% discount at 0 reputation', () => {
      expect(getPriceDiscount(0)).toBe(0);
    });

    it('returns 20% hero discount at 100 reputation', () => {
      expect(getPriceDiscount(100)).toBeCloseTo(0.20, 2);
    });

    it('returns 10% partner discount at 50 reputation', () => {
      expect(getPriceDiscount(50)).toBeCloseTo(0.10, 2);
    });

    it('caps discount at 20%', () => {
      expect(getPriceDiscount(200)).toBeLessThanOrEqual(0.20);
    });
  });

  describe('getContractMultiplierBonus', () => {
    it('returns no additive bonus at 0 reputation', () => {
      expect(getContractMultiplierBonus(0)).toBe(0);
    });

    it('returns higher multiplier at higher reputation', () => {
      const low = getContractMultiplierBonus(25);
      const high = getContractMultiplierBonus(75);
      expect(high).toBeGreaterThan(low);
    });
  });
});

