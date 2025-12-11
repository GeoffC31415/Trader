// Character memory management helpers
// Tracks player interactions with characters for dialogue reactivity

import type { Station } from '../../domain/types/world_types';
import type { 
  CharacterMemory, 
  DialogueContext, 
  PlayerRelationshipTier,
  DialogueLine
} from '../../domain/types/character_types';
import { 
  createEmptyMemory, 
  getPlayerRelationshipTier 
} from '../../domain/types/character_types';

/**
 * Get or create character memory for a station
 */
export function getCharacterMemory(station: Station): CharacterMemory {
  // For now, we store memory on the station itself
  // This could be moved to a separate GameState property if needed
  return (station as any).characterMemory ?? createEmptyMemory();
}

/**
 * Set character memory on a station (returns updated station)
 */
export function setCharacterMemory(
  station: Station, 
  memory: CharacterMemory
): Station {
  return {
    ...station,
    characterMemory: memory,
  } as Station & { characterMemory: CharacterMemory };
}

/**
 * Build dialogue context for a station interaction
 */
export function buildDialogueContext(
  station: Station,
  globalPlayerActions: string[],
  completedArcs: string[],
  activeArcs: string[],
  currentGameTime: number
): DialogueContext {
  const memory = getCharacterMemory(station);
  const playerRep = station.reputation ?? 0;
  
  return {
    stationId: station.id,
    playerRep,
    playerRelationshipTier: getPlayerRelationshipTier(playerRep),
    characterMemory: memory,
    knownPlayerActions: [...globalPlayerActions, ...memory.knownActions],
    completedArcs,
    activeArcs,
    worldState: {}, // Can be populated with specific world state flags
    currentGameTime,
  };
}

/**
 * Significant player actions that characters should know about
 * These are tracked globally and propagate to relevant characters
 */
export const SIGNIFICANT_ACTIONS = {
  // Arc 1: Greenfields Independence
  SIDED_WITH_GREENFIELDS: 'sided_with_greenfields',
  SIDED_WITH_SOL_CITY: 'sided_with_sol_city',
  DESTROYED_SOL_CONVOY: 'destroyed_sol_convoy',
  ESCORTED_INSPECTOR: 'escorted_inspector',
  GREENFIELDS_INDEPENDENT: 'greenfields_independent',
  GREENFIELDS_CONTROLLED: 'greenfields_controlled',
  
  // Arc 2: Fabrication Wars
  CHOSE_AURUM_PATH: 'chose_aurum_path',
  CHOSE_DRYDOCK_PATH: 'chose_drydock_path',
  SABOTAGED_DRYDOCK: 'sabotaged_drydock',
  SABOTAGED_AURUM: 'sabotaged_aurum',
  AURUM_WON_CONTRACT: 'aurum_won_contract',
  DRYDOCK_WON_CONTRACT: 'drydock_won_contract',
  
  // Arc 3: Energy Monopoly
  EXPOSED_CERES: 'exposed_ceres',
  PROTECTED_CERES: 'protected_ceres',
  DEFENDED_REFINERY_CONVOY: 'defended_refinery_convoy',
  RAIDED_REFINERY_CONVOY: 'raided_refinery_convoy',
  FUEL_MARKET_FREED: 'fuel_market_freed',
  FUEL_MONOPOLY_CEMENTED: 'fuel_monopoly_cemented',
  
  // Arc 4: Pirate Accords
  JOINED_PIRATES: 'joined_pirates',
  ENFORCED_LAW: 'enforced_law',
  BROKERED_PEACE: 'brokered_peace',
  ATTACKED_SOL_DEFENSES: 'attacked_sol_defenses',
  ATTACKED_PIRATE_DEFENSES: 'attacked_pirate_defenses',
  DEFENDED_PEACE_CONFERENCE: 'defended_peace_conference',
  
  // Arc 5: Union Crisis
  SUPPORTED_STRIKE: 'supported_strike',
  BROKE_STRIKE: 'broke_strike',
  UNION_VICTORY: 'union_victory',
  CORPORATE_VICTORY: 'corporate_victory',
  
  // General actions
  BIG_TRADER: 'big_trader', // >100k credits traded at a station
  MISSION_HERO: 'mission_hero', // Completed 5+ missions for a station
  FREQUENT_VISITOR: 'frequent_visitor', // 20+ visits to a station
} as const;

/**
 * Get actions that should spread to related factions
 * When player does an action at one station, allies/rivals may hear about it
 */
export function getActionPropagation(action: string): { 
  allies: string[]; 
  rivals: string[];
  spreadsToAll: boolean;
} {
  // Actions that everyone hears about
  const universalActions = [
    SIGNIFICANT_ACTIONS.GREENFIELDS_INDEPENDENT,
    SIGNIFICANT_ACTIONS.GREENFIELDS_CONTROLLED,
    SIGNIFICANT_ACTIONS.AURUM_WON_CONTRACT,
    SIGNIFICANT_ACTIONS.DRYDOCK_WON_CONTRACT,
    SIGNIFICANT_ACTIONS.FUEL_MARKET_FREED,
    SIGNIFICANT_ACTIONS.FUEL_MONOPOLY_CEMENTED,
    SIGNIFICANT_ACTIONS.UNION_VICTORY,
    SIGNIFICANT_ACTIONS.CORPORATE_VICTORY,
  ];
  
  if (universalActions.includes(action)) {
    return { allies: [], rivals: [], spreadsToAll: true };
  }
  
  // Specific propagation rules
  const propagationMap: Record<string, { allies: string[]; rivals: string[] }> = {
    [SIGNIFICANT_ACTIONS.SIDED_WITH_GREENFIELDS]: {
      allies: ['drydock', 'sol-refinery', 'freeport'],
      rivals: ['sol-city', 'aurum-fab'],
    },
    [SIGNIFICANT_ACTIONS.SIDED_WITH_SOL_CITY]: {
      allies: ['sol-refinery', 'ceres-pp'],
      rivals: ['greenfields', 'drydock'],
    },
    [SIGNIFICANT_ACTIONS.JOINED_PIRATES]: {
      allies: ['freeport'],
      rivals: ['sol-city', 'sol-refinery'],
    },
    [SIGNIFICANT_ACTIONS.ENFORCED_LAW]: {
      allies: ['sol-city', 'sol-refinery'],
      rivals: ['hidden-cove', 'freeport'],
    },
    [SIGNIFICANT_ACTIONS.BROKERED_PEACE]: {
      allies: ['freeport'],
      rivals: [],
    },
    [SIGNIFICANT_ACTIONS.SUPPORTED_STRIKE]: {
      allies: ['greenfields', 'sol-refinery', 'drydock'],
      rivals: ['sol-city', 'aurum-fab', 'ceres-pp'],
    },
    [SIGNIFICANT_ACTIONS.BROKE_STRIKE]: {
      allies: ['sol-city', 'aurum-fab', 'ceres-pp'],
      rivals: ['greenfields', 'sol-refinery', 'drydock'],
    },
  };
  
  return propagationMap[action] ?? { allies: [], rivals: [], spreadsToAll: false };
}

/**
 * Check if a player qualifies for a milestone action at a station
 */
export function checkMilestoneActions(
  memory: CharacterMemory,
  reputation: number
): string[] {
  const newActions: string[] = [];
  
  // Big trader milestone
  if (memory.totalTradeVolume >= 100000 && !memory.knownActions.includes(SIGNIFICANT_ACTIONS.BIG_TRADER)) {
    newActions.push(SIGNIFICANT_ACTIONS.BIG_TRADER);
  }
  
  // Mission hero milestone
  if (memory.missionsCompleted.length >= 5 && !memory.knownActions.includes(SIGNIFICANT_ACTIONS.MISSION_HERO)) {
    newActions.push(SIGNIFICANT_ACTIONS.MISSION_HERO);
  }
  
  // Frequent visitor milestone
  if (memory.visitCount >= 20 && !memory.knownActions.includes(SIGNIFICANT_ACTIONS.FREQUENT_VISITOR)) {
    newActions.push(SIGNIFICANT_ACTIONS.FREQUENT_VISITOR);
  }
  
  return newActions;
}

/**
 * Create a summary of player's relationship with a character
 */
export function getRelationshipSummary(
  station: Station
): {
  tier: PlayerRelationshipTier;
  visits: number;
  tradeVolume: number;
  missionsCompleted: number;
  hasSignificantHistory: boolean;
} {
  const memory = getCharacterMemory(station);
  const rep = station.reputation ?? 0;
  
  return {
    tier: getPlayerRelationshipTier(rep),
    visits: memory.visitCount,
    tradeVolume: memory.totalTradeVolume,
    missionsCompleted: memory.missionsCompleted.length,
    hasSignificantHistory: 
      memory.visitCount >= 5 || 
      memory.missionsCompleted.length >= 1 ||
      memory.totalTradeVolume >= 10000,
  };
}
