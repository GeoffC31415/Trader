import { describe, it, expect } from 'vitest';
import { getPriceDiscount, getContractMultiplierBonus } from '../reputation_helpers';

describe('reputation_helpers', () => {
  describe('getPriceDiscount', () => {
    it('returns 0% discount at 0 reputation', () => {
      expect(getPriceDiscount(0)).toBe(0);
    });

    it('returns 10% discount at 100 reputation', () => {
      expect(getPriceDiscount(100)).toBeCloseTo(0.10, 2);
    });

    it('returns 5% discount at 50 reputation', () => {
      expect(getPriceDiscount(50)).toBeCloseTo(0.05, 2);
    });

    it('caps discount at 10%', () => {
      expect(getPriceDiscount(200)).toBeLessThanOrEqual(0.10);
    });
  });

  describe('getContractMultiplierBonus', () => {
    it('returns 1.0x multiplier at 0 reputation', () => {
      expect(getContractMultiplierBonus(0)).toBe(1.0);
    });

    it('returns higher multiplier at higher reputation', () => {
      const low = getContractMultiplierBonus(25);
      const high = getContractMultiplierBonus(75);
      expect(high).toBeGreaterThan(low);
    });
  });
});

