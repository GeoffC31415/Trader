/**
 * Centralized Game Configuration
 * 
 * Single source of truth for all game configuration values.
 * Consolidates scattered constants from various files.
 */

import type { StationType } from '../domain/constants/station_types';

/**
 * Main game configuration type
 */
export type GameConfig = {
  economy: {
    // Price volatility/jitter
    volatility: number; // Base price volatility (0.16)
    jitterChancePerSecond: number; // Probability of jitter per second (2.0)
    jitterCommoditiesPerStation: number; // Number of commodities to jitter per station (3)
    jitterFactor: number; // Price jitter factor (0.1 = ±10%)
    
    // Price spread
    minSpreadPercent: number; // Minimum spread percentage (0.08 = 8%)
    minSpreadAbsolute: number; // Minimum absolute spread (3)
    
    // Distance premium
    distanceNorm: number; // Normalize distances by this scale (120)
    maxDistancePremium: number; // Maximum distance premium (0.4 = 40%)
    kDistByCategory: Record<string, number>; // Distance premium coefficients by category
    
    // Stock-driven pricing
    kStock: number; // Stock curve steepness (0.5)
    minStockMultiplier: number; // Minimum stock multiplier (0.85)
    maxStockMultiplier: number; // Maximum stock multiplier (1.35)
    minBuyStockMultiplier: number; // Minimum buy stock multiplier (0.9)
    maxBuyStockMultiplier: number; // Maximum buy stock multiplier (1.25)
    
    // Station affinities (price modifiers by station type and commodity category)
    affinity: Record<string, Record<string, { buy: number; sell: number }>>;
    
    // Crafting profitability floors
    craftFloorMargin: Record<string, number>;
    
    // Featured arbitrage
    featured: {
      count: number; // Number of featured opportunities (3)
      minMultiplier: number; // Minimum featured multiplier (1.5)
      maxMultiplier: number; // Maximum featured multiplier (1.8)
      candidateCategories: readonly string[]; // Categories eligible for featured
    };
  };
  
  physics: {
    defaultDrag: number; // Default drag coefficient (1.0)
    enginePowerLerpRate: number; // Engine power interpolation rate (5.0)
  };
  
  combat: {
    // Projectile lifetime
    projectileDespawnTime: number; // Seconds before projectile despawns (5.0)
    hitscanInstantHitTime: number; // Time before hitscan hits (for visuals) (0.05)
    
    // NPC behavior
    npcAggressionDuration: number; // Milliseconds NPC stays aggressive (30000)
    npcAttackCooldown: number; // Milliseconds between NPC attacks (1000)
    
    // Reputation penalties
    repLossPerNpcKill: number; // Reputation loss per NPC kill (-10)
    repLossPerHit: number; // Reputation loss per hit (not kill) (-2)
    
    // Cargo drop
    cargoDropPercentage: number; // Percentage of cargo dropped on destruction (0.5)
  };
  
  npc: {
    baseSpeed: number; // Base NPC speed
    tradeQuantity: number; // Quantity NPCs trade per trip (3)
  };
  
  audio: {
    musicEnabled: boolean; // Whether music is enabled (true)
    musicVolume: number; // Music volume 0-1 (0.7)
  };
};

/**
 * Default configuration values
 */
export const defaultConfig: GameConfig = {
  economy: {
    volatility: 0.16,
    jitterChancePerSecond: 2.0,
    jitterCommoditiesPerStation: 3,
    jitterFactor: 0.1,
    minSpreadPercent: 0.08,
    minSpreadAbsolute: 3,
    distanceNorm: 120,
    maxDistancePremium: 0.4,
    kDistByCategory: {
      tech: 0.35,
      medical: 0.35,
      luxury: 0.35,
      industrial: 0.25,
      energy: 0.25,
      fuel: 0.25,
      consumer: 0.2,
      food: 0.2,
      gas: 0.18,
      raw: 0.18,
    },
    kStock: 0.5,
    minStockMultiplier: 0.85,
    maxStockMultiplier: 1.35,
    minBuyStockMultiplier: 0.9,
    maxBuyStockMultiplier: 1.25,
    affinity: {
      city: {
        medical: { buy: 1.12, sell: 1.15 },
        luxury: { buy: 1.1, sell: 1.12 },
        energy: { buy: 1.06, sell: 1.08 },
      },
      power_plant: {
        fuel: { buy: 1.1, sell: 1.08 },
        energy: { buy: 1.08, sell: 1.08 },
      },
      fabricator: {
        tech: { buy: 1.06, sell: 1.1 },
        raw: { buy: 0.9, sell: 0.95 },
      },
      refinery: {
        raw: { buy: 0.92, sell: 0.96 },
        industrial: { buy: 1.05, sell: 1.06 },
      },
      farm: {
        food: { buy: 0.92, sell: 0.94 },
        consumer: { buy: 0.96, sell: 0.98 },
      },
      research: {
        tech: { buy: 1.08, sell: 1.12 },
        medical: { buy: 1.08, sell: 1.12 },
      },
      trading_post: {},
      orbital_hab: {
        consumer: { buy: 1.06, sell: 1.08 },
        energy: { buy: 1.06, sell: 1.08 },
      },
      shipyard: {
        industrial: { buy: 1.08, sell: 1.12 },
        tech: { buy: 1.05, sell: 1.1 },
      },
      pirate: {
        luxury: { buy: 1.08, sell: 1.12 },
      },
    },
    craftFloorMargin: {
      industrial: 30,
      tech: 80,
      medical: 100,
      luxury: 100,
      energy: 40,
      consumer: 20,
      food: 15,
      fuel: 25,
      gas: 15,
      raw: 15,
    },
    featured: {
      count: 3,
      minMultiplier: 1.5,
      maxMultiplier: 1.8,
      candidateCategories: ['tech', 'medical', 'luxury', 'energy', 'industrial'] as const,
    },
  },
  
  physics: {
    defaultDrag: 1.0,
    enginePowerLerpRate: 5.0,
  },
  
  combat: {
    projectileDespawnTime: 5.0,
    hitscanInstantHitTime: 0.05,
    npcAggressionDuration: 30000,
    npcAttackCooldown: 1000,
    repLossPerNpcKill: -10,
    repLossPerHit: -2,
    cargoDropPercentage: 0.5,
  },
  
  npc: {
    baseSpeed: 8,
    tradeQuantity: 3,
  },
  
  audio: {
    musicEnabled: true,
    musicVolume: 0.35,
  },
};

/**
 * Current game configuration
 * Can be updated at runtime for testing or modding
 */
export let gameConfig: GameConfig = { ...defaultConfig };

/**
 * Update game configuration
 * 
 * @param updates - Partial config updates to apply
 */
export function updateConfig(updates: Partial<GameConfig>): void {
  gameConfig = {
    ...gameConfig,
    ...Object.fromEntries(
      Object.entries(updates).map(([key, value]) => [
        key,
        typeof value === 'object' && !Array.isArray(value) && value !== null
          ? { ...(gameConfig as any)[key], ...value }
          : value,
      ])
    ),
  } as GameConfig;
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): void {
  gameConfig = { ...defaultConfig };
}

/**
 * Get economy config (convenience accessor)
 */
export function getEconomyConfig() {
  return gameConfig.economy;
}

/**
 * Get physics config (convenience accessor)
 */
export function getPhysicsConfig() {
  return gameConfig.physics;
}

/**
 * Get combat config (convenience accessor)
 */
export function getCombatConfig() {
  return gameConfig.combat;
}

/**
 * Get NPC config (convenience accessor)
 */
export function getNpcConfig() {
  return gameConfig.npc;
}

/**
 * Get audio config (convenience accessor)
 */
export function getAudioConfig() {
  return gameConfig.audio;
}

