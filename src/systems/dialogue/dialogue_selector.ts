// Context-aware dialogue selection system
// Picks the best dialogue line based on player state, reputation, and history

import type { 
  DialogueLine, 
  DialogueConditions, 
  DialogueContext, 
  DialogueCategory,
  DialogueResult,
  CharacterMemory 
} from '../../domain/types/character_types';
import { getDialogueAudioPath } from '../../shared/audio/dialogue_audio';

/**
 * Select the best dialogue line from available options based on context
 * Returns null if no lines match conditions
 * Note: audioUrl is resolved asynchronously - use resolveDialogueAudio() after selection
 */
export function selectDialogue(
  lines: DialogueLine[],
  context: DialogueContext,
  preferredCategories?: DialogueCategory[]
): DialogueResult | null {
  // Filter to lines that match all conditions
  const matchingLines = lines.filter(line => matchesConditions(line, context));
  
  if (matchingLines.length === 0) {
    return null;
  }
  
  // If preferred categories specified, try those first
  if (preferredCategories && preferredCategories.length > 0) {
    for (const category of preferredCategories) {
      const categoryLines = matchingLines.filter(l => l.category === category);
      if (categoryLines.length > 0) {
        const selected = selectFromCandidates(categoryLines, context.characterMemory);
        return {
          line: selected,
          audioUrl: selected.audioFile, // May be undefined, will be resolved later
        };
      }
    }
  }
  
  // Otherwise pick from all matching
  const selected = selectFromCandidates(matchingLines, context.characterMemory);
  return {
    line: selected,
    audioUrl: selected.audioFile, // May be undefined, will be resolved later
  };
}

/**
 * Resolve audio URL for a dialogue result asynchronously
 */
export async function resolveDialogueAudio(
  result: DialogueResult | null,
  stationId: string
): Promise<DialogueResult | null> {
  if (!result) return null;
  
  // If audioFile already set, use it
  if (result.audioUrl) {
    return result;
  }
  
  // Otherwise resolve from manifest
  const audioPath = await getDialogueAudioPath(stationId, result.line.id);
  return {
    ...result,
    audioUrl: audioPath || undefined,
  };
}

/**
 * Select a greeting and a contextual line (for dock intro dual display)
 * Note: audioUrl is resolved asynchronously - use resolveDialoguePairAudio() after selection
 */
export function selectDialoguePair(
  lines: DialogueLine[],
  context: DialogueContext
): { greeting: DialogueResult | null; contextual: DialogueResult | null } {
  // Get greeting
  const greetingResult = selectDialogue(lines, context, ['greeting']);
  
  // Get contextual line (gossip, reaction, memory, concern, world)
  // Exclude the greeting we just picked
  const remainingLines = greetingResult 
    ? lines.filter(l => l.id !== greetingResult.line.id)
    : lines;
  
  const contextualResult = selectDialogue(
    remainingLines, 
    context, 
    ['reaction', 'gossip', 'memory', 'concern', 'world', 'tip']
  );
  
  return {
    greeting: greetingResult,
    contextual: contextualResult,
  };
}

/**
 * Resolve audio URLs for a dialogue pair asynchronously
 */
export async function resolveDialoguePairAudio(
  pair: { greeting: DialogueResult | null; contextual: DialogueResult | null },
  stationId: string
): Promise<{ greeting: DialogueResult | null; contextual: DialogueResult | null }> {
  const [greeting, contextual] = await Promise.all([
    resolveDialogueAudio(pair.greeting, stationId),
    resolveDialogueAudio(pair.contextual, stationId),
  ]);
  
  return { greeting, contextual };
}

/**
 * Check if a dialogue line matches all its conditions against context
 */
export function matchesConditions(line: DialogueLine, context: DialogueContext): boolean {
  const conditions = line.conditions;
  
  // No conditions = always matches
  if (!conditions) {
    return true;
  }
  
  // Check reputation bounds
  if (conditions.minRep !== undefined && context.playerRep < conditions.minRep) {
    return false;
  }
  if (conditions.maxRep !== undefined && context.playerRep > conditions.maxRep) {
    return false;
  }
  
  // Check required actions
  if (conditions.requiresAction && !context.knownPlayerActions.includes(conditions.requiresAction)) {
    return false;
  }
  
  // Check excluded actions
  if (conditions.excludesAction && context.knownPlayerActions.includes(conditions.excludesAction)) {
    return false;
  }
  
  // Check requiresAnyAction (at least one must be present)
  if (conditions.requiresAnyAction && conditions.requiresAnyAction.length > 0) {
    const hasAny = conditions.requiresAnyAction.some(action => 
      context.knownPlayerActions.includes(action)
    );
    if (!hasAny) return false;
  }
  
  // Check excludesAnyAction (none can be present)
  if (conditions.excludesAnyAction && conditions.excludesAnyAction.length > 0) {
    const hasAny = conditions.excludesAnyAction.some(action => 
      context.knownPlayerActions.includes(action)
    );
    if (hasAny) return false;
  }
  
  // Check first visit
  if (conditions.isFirstVisit !== undefined) {
    const isFirst = context.characterMemory.visitCount === 0;
    if (conditions.isFirstVisit !== isFirst) return false;
  }
  
  // Check days since visit
  if (conditions.daysSinceVisit !== undefined && context.characterMemory.lastVisitTime) {
    const daysSince = (context.currentGameTime - context.characterMemory.lastVisitTime) / (24 * 60 * 60);
    if (daysSince < conditions.daysSinceVisit) return false;
  }
  
  // Check trade volume
  if (conditions.minTradeVolume !== undefined) {
    if (context.characterMemory.totalTradeVolume < conditions.minTradeVolume) return false;
  }
  
  // Check mission from character
  if (conditions.hasMissionFrom) {
    // Would need to check active missions - for now, pass
  }
  
  // Check completed mission
  if (conditions.completedMission) {
    if (!context.characterMemory.missionsCompleted.includes(conditions.completedMission)) {
      return false;
    }
  }
  
  // Check completed arc
  if (conditions.completedArc) {
    if (!context.completedArcs.includes(conditions.completedArc)) {
      return false;
    }
  }
  
  // Check arc in progress
  if (conditions.arcInProgress) {
    if (!context.activeArcs.includes(conditions.arcInProgress)) {
      return false;
    }
  }
  
  // Check world state
  if (conditions.worldState) {
    if (!context.worldState[conditions.worldState]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Select best line from candidates, considering priority and recent history
 * Uses randomization to provide variety in dialogue
 */
function selectFromCandidates(
  candidates: DialogueLine[], 
  memory: CharacterMemory
): DialogueLine {
  if (candidates.length === 1) {
    return candidates[0];
  }
  
  // Sort by priority (higher first)
  const sorted = [...candidates].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  
  // Get highest priority value
  const maxPriority = sorted[0].priority || 0;
  
  // Get all lines with highest priority
  const topPriority = sorted.filter(l => (l.priority || 0) === maxPriority);
  
  // Filter out recently used lines if possible
  const notRecent = topPriority.filter(l => 
    !memory.recentDialogueIds.includes(l.id)
  );
  
  // Pick randomly from non-recent, or all if all are recent
  const pool = notRecent.length > 0 ? notRecent : topPriority;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

/**
 * Get lines of specific categories that match conditions
 */
export function getMatchingLinesByCategory(
  lines: DialogueLine[],
  context: DialogueContext,
  categories: DialogueCategory[]
): DialogueLine[] {
  return lines.filter(line => 
    categories.includes(line.category) && matchesConditions(line, context)
  );
}

/**
 * Get all gossip lines that reference a specific character
 */
export function getGossipAbout(
  lines: DialogueLine[],
  context: DialogueContext,
  targetCharacterId: string
): DialogueLine[] {
  return lines.filter(line => 
    line.category === 'gossip' &&
    line.conditions?.referencesCharacter === targetCharacterId &&
    matchesConditions(line, context)
  );
}

/**
 * Get reaction lines for specific player actions
 */
export function getReactionsTo(
  lines: DialogueLine[],
  context: DialogueContext,
  actions: string[]
): DialogueLine[] {
  return lines.filter(line => {
    if (line.category !== 'reaction') return false;
    if (!line.conditions?.requiresAction && !line.conditions?.requiresAnyAction) return false;
    
    // Check if this reaction is for one of the specified actions
    if (line.conditions.requiresAction && actions.includes(line.conditions.requiresAction)) {
      return matchesConditions(line, context);
    }
    if (line.conditions.requiresAnyAction) {
      const hasRelevant = line.conditions.requiresAnyAction.some(a => actions.includes(a));
      if (hasRelevant) return matchesConditions(line, context);
    }
    
    return false;
  });
}

/**
 * Update character memory after showing dialogue
 */
export function recordDialogueShown(
  memory: CharacterMemory,
  lineId: string,
  category: DialogueCategory,
  maxRecent: number = 10
): CharacterMemory {
  const recentDialogueIds = [lineId, ...memory.recentDialogueIds].slice(0, maxRecent);
  
  return {
    ...memory,
    recentDialogueIds,
    lastGreetingId: category === 'greeting' ? lineId : memory.lastGreetingId,
  };
}

/**
 * Update character memory on station visit
 */
export function recordVisit(
  memory: CharacterMemory,
  gameTime: number
): CharacterMemory {
  return {
    ...memory,
    firstVisitTime: memory.firstVisitTime ?? gameTime,
    lastVisitTime: gameTime,
    visitCount: memory.visitCount + 1,
  };
}

/**
 * Update character memory on trade
 */
export function recordTrade(
  memory: CharacterMemory,
  creditAmount: number
): CharacterMemory {
  return {
    ...memory,
    totalTradeVolume: memory.totalTradeVolume + Math.abs(creditAmount),
  };
}

/**
 * Add a known action to character memory
 */
export function recordAction(
  memory: CharacterMemory,
  actionId: string
): CharacterMemory {
  if (memory.knownActions.includes(actionId)) {
    return memory;
  }
  return {
    ...memory,
    knownActions: [...memory.knownActions, actionId],
  };
}

