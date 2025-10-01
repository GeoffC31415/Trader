// Contract system constants

// Reputation thresholds for different mission tiers
export const REP_TIER_HIGH = 70;
export const REP_TIER_MID = 30;
export const REP_TIER_LOW = 0;

// Mission reputation requirements (indexed by mission tier)
export const MISSION_REP_REQUIREMENTS = [0, 25, 40, 55, 70] as const;

// Contract profit margins by tag
export const CONTRACT_PROFIT_MARGINS = {
  standard: 0.25,
  bulk: 0.35,
  rush: 0.25,
  fabrication: 0.25,
  emergency: 0.5,
} as const;

// Contract sell multipliers by tag
export const CONTRACT_SELL_MULTIPLIERS = {
  standard: 1.0,
  bulk: 1.0,
  rush: 1.12,
  fabrication: 1.0,
  emergency: 1.25,
} as const;

// Contract expiration times (in milliseconds)
export const CONTRACT_EXPIRATION_TIMES = {
  rush: 10 * 60 * 1000, // 10 minutes
  default: 20 * 60 * 1000, // 20 minutes
} as const;

// Contract generation limits
export const CONTRACTS_PER_STATION = 5;
export const CONTRACT_SUGGESTION_LIMIT = 20;
export const CONTRACT_MIN_UNITS = 5;
export const CONTRACT_MAX_UNITS = 50;
export const CONTRACT_MIN_BONUS = 200;

// Contract refresh interval (in milliseconds)
export const CONTRACT_REFRESH_INTERVAL = 180000; // 3 minutes

// Celebration display duration (in milliseconds)
export const CELEBRATION_DURATION = 4000; // 4 seconds

