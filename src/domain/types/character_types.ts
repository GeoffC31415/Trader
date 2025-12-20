// Character relationship and dialogue types for the narrative system

/**
 * Dialogue line with conditions for context-aware selection
 * Lines are designed to be voice-ready (10-30 words, natural speech)
 */
export type DialogueLine = {
  id: string;
  text: string;
  conditions?: DialogueConditions;
  priority?: number; // Higher = prefer this line when multiple match
  category: DialogueCategory;
  // Voice synthesis metadata
  voiceTone?: 'neutral' | 'warm' | 'cold' | 'angry' | 'worried' | 'amused' | 'threatening';
  audioFile?: string; // Path to generated audio file (filled in after voice synthesis)
};

export type DialogueCategory = 
  | 'greeting'    // Rep-tier based welcomes
  | 'farewell'    // Send-off lines
  | 'gossip'      // References other characters
  | 'tip'         // Trading/gameplay advice
  | 'reaction'    // Responds to player choices/actions
  | 'memory'      // "Last time you were here..."
  | 'concern'     // Character's current worries/situation
  | 'world';      // Comments on world state/events

export type DialogueConditions = {
  // Reputation requirements
  minRep?: number;
  maxRep?: number;
  
  // Player action requirements
  requiresAction?: string;      // Player must have done this: 'sided_with_greenfields'
  excludesAction?: string;      // Player must NOT have done this
  requiresAnyAction?: string[]; // Player must have done at least one
  excludesAnyAction?: string[]; // Player must NOT have done any
  
  // Visit/interaction conditions
  isFirstVisit?: boolean;       // Never docked here before
  daysSinceVisit?: number;      // Minimum days since last dock
  minTradeVolume?: number;      // Credits traded at this station
  
  // Mission conditions
  hasMissionFrom?: string;      // Has active mission from this character
  completedMission?: string;    // Has completed specific mission
  completedArc?: string;        // Has completed an arc
  arcInProgress?: string;       // Has arc currently in progress
  
  // Character references
  referencesCharacter?: string; // Line talks about another character (stationId)
  
  // World state
  worldState?: string;          // Check for specific world condition
};

/**
 * Relationship between two characters
 */
export type CharacterRelationship = {
  targetId: string;             // Other character's station ID
  attitude: RelationshipAttitude;
  context: string;              // Brief description: "Former business partners"
  publicKnowledge: boolean;     // Player can see this relationship
};

export type RelationshipAttitude = 
  | 'allied'       // Close allies, mutual support
  | 'friendly'     // Positive relationship
  | 'neutral'      // No strong feelings
  | 'rival'        // Competition/opposition
  | 'hostile'      // Active antagonism
  | 'complicated'; // Mixed feelings, history

/**
 * Player's relationship status with a character
 */
export type PlayerRelationshipTier = 
  | 'stranger'     // rep 0-9: Never met or barely known
  | 'acquaintance' // rep 10-29: Some interaction
  | 'contact'      // rep 30-49: Regular business
  | 'trusted'      // rep 50-69: Reliable partner
  | 'allied';      // rep 70+: Close ally

/**
 * Memory of player actions that characters know about
 * Stored per-station, tracks significant interactions
 */
export type CharacterMemory = {
  // Significant player actions this character knows about
  knownActions: string[];
  
  // Interaction history
  firstVisitTime?: number;      // Game time of first dock
  lastVisitTime?: number;       // Game time of most recent dock
  visitCount: number;           // Total times docked
  totalTradeVolume: number;     // Credits traded at this station
  
  // Mission history with this character
  missionsOffered: string[];    // Mission IDs offered
  missionsCompleted: string[];  // Mission IDs completed
  missionsFailed: string[];     // Mission IDs failed/abandoned
  
  // Dialogue tracking (avoid repetition)
  recentDialogueIds: string[];  // Last N dialogue IDs shown
  lastGreetingId?: string;      // Prevent same greeting twice in a row
};

/**
 * Voice direction for a character (used by voice synthesis)
 */
export type VoiceDirection = {
  characterId: string;
  characterName: string;
  voiceStyle: string;           // "Polished, measured, slight condescension"
  gender: 'male' | 'female';
  ageRange: string;             // "mid-30s", "late-40s"
  accent?: string;              // Optional accent hint
  speechPattern?: string;       // "Uses agricultural metaphors", "Very direct"
};

/**
 * Extended persona with conditional dialogue system
 */
export type ExtendedPersona = {
  id: string;
  name: string;
  title: string;
  vibe: string;
  avatarPrompt: string;
  
  // Voice synthesis metadata
  voiceDirection: VoiceDirection;
  
  // Character relationships
  relationships: CharacterRelationship[];
  
  // Conditional dialogue (replaces simple string arrays)
  dialogue: DialogueLine[];
  
  // Legacy fallback arrays (for backwards compatibility)
  lines?: string[];
  tips?: string[];
};

/**
 * Result from dialogue selection - includes text and optional audio
 */
export type DialogueResult = {
  line: DialogueLine;
  audioUrl?: string;
};

/**
 * Context passed to dialogue selector
 */
export type DialogueContext = {
  stationId: string;
  playerRep: number;
  playerRelationshipTier: PlayerRelationshipTier;
  characterMemory: CharacterMemory;
  knownPlayerActions: string[]; // Global actions across all characters
  completedArcs: string[];
  activeArcs: string[];
  worldState: Record<string, boolean>;
  currentGameTime: number;
};

/**
 * Helper to determine player relationship tier from reputation
 */
export function getPlayerRelationshipTier(rep: number): PlayerRelationshipTier {
  if (rep >= 70) return 'allied';
  if (rep >= 50) return 'trusted';
  if (rep >= 30) return 'contact';
  if (rep >= 10) return 'acquaintance';
  return 'stranger';
}

/**
 * Human-readable names for relationship tiers
 */
export const RELATIONSHIP_TIER_DISPLAY: Record<PlayerRelationshipTier, { name: string; color: string }> = {
  stranger: { name: 'Stranger', color: '#6b7280' },
  acquaintance: { name: 'Acquaintance', color: '#9ca3af' },
  contact: { name: 'Contact', color: '#60a5fa' },
  trusted: { name: 'Trusted', color: '#34d399' },
  allied: { name: 'Allied', color: '#fbbf24' },
};

/**
 * Default empty character memory
 */
export function createEmptyMemory(): CharacterMemory {
  return {
    knownActions: [],
    visitCount: 0,
    totalTradeVolume: 0,
    missionsOffered: [],
    missionsCompleted: [],
    missionsFailed: [],
    recentDialogueIds: [],
  };
}








