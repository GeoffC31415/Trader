/**
 * Reputation tier thresholds and perk calculations
 */

export type ReputationTier = 'stranger' | 'trusted' | 'partner' | 'champion' | 'hero';

export const REPUTATION_TIERS = {
  STRANGER: 0,
  TRUSTED: 25,
  PARTNER: 50,
  CHAMPION: 75,
  HERO: 100,
} as const;

/**
 * Get reputation tier for a given reputation value
 */
export function getReputationTier(reputation: number): ReputationTier {
  if (reputation >= REPUTATION_TIERS.HERO) return 'hero';
  if (reputation >= REPUTATION_TIERS.CHAMPION) return 'champion';
  if (reputation >= REPUTATION_TIERS.PARTNER) return 'partner';
  if (reputation >= REPUTATION_TIERS.TRUSTED) return 'trusted';
  return 'stranger';
}

/**
 * Get price discount percentage for a reputation tier
 */
export function getPriceDiscount(reputation: number): number {
  const tier = getReputationTier(reputation);
  switch (tier) {
    case 'hero': return 0.20; // 20% discount
    case 'champion': return 0.15; // 15% discount
    case 'partner': return 0.10; // 10% discount
    case 'trusted': return 0.05; // 5% discount
    default: return 0; // No discount
  }
}

/**
 * Get contract multiplier bonus for reputation
 */
export function getContractMultiplierBonus(reputation: number): number {
  const tier = getReputationTier(reputation);
  if (tier === 'partner' || tier === 'champion' || tier === 'hero') {
    return 0.38; // Better multiplier for rush contracts (1.5x instead of 1.12x)
  }
  return 0;
}

/**
 * Get number of escort ships based on reputation
 */
export function getEscortCount(reputation: number): number {
  const tier = getReputationTier(reputation);
  if (tier === 'hero') return 2;
  if (tier === 'champion') return 1;
  return 0;
}

/**
 * Get escort cargo capacity multiplier
 */
export function getEscortCargoCapacity(playerCargoCapacity: number, escortCount: number): number {
  return Math.floor(playerCargoCapacity * 0.5 * escortCount);
}

/**
 * Get tier display name and color
 */
export function getTierDisplay(tier: ReputationTier): { name: string; color: string } {
  switch (tier) {
    case 'hero':
      return { name: 'Station Hero', color: '#fbbf24' }; // Gold
    case 'champion':
      return { name: 'Station Champion', color: '#a855f7' }; // Purple
    case 'partner':
      return { name: 'Valued Partner', color: '#3b82f6' }; // Blue
    case 'trusted':
      return { name: 'Trusted Trader', color: '#10b981' }; // Green
    default:
      return { name: 'Trader', color: '#6b7280' }; // Gray
  }
}

/**
 * Get perks description for a tier
 */
export function getTierPerks(reputation: number): string[] {
  const tier = getReputationTier(reputation);
  const perks: string[] = [];
  
  if (tier === 'trusted' || tier === 'partner' || tier === 'champion' || tier === 'hero') {
    perks.push(`${(getPriceDiscount(reputation) * 100).toFixed(0)}% better buy prices`);
  }
  
  if (tier === 'partner' || tier === 'champion' || tier === 'hero') {
    perks.push('Enhanced contract rewards');
  }
  
  if (tier === 'champion' || tier === 'hero') {
    perks.push(`${getEscortCount(reputation)} escort ship${getEscortCount(reputation) > 1 ? 's' : ''} on missions`);
  }
  
  if (tier === 'hero') {
    perks.push('Legendary contracts available');
  }
  
  return perks;
}

