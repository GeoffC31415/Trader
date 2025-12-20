// Gossip and rumor system - provides inter-character knowledge sharing
// Characters share information about other characters based on their relationships

import type { DialogueLine, DialogueContext } from '../../domain/types/character_types';
import { getCharacterDialogue } from '../../domain/constants/character_dialogue';
import { getCharacterRelationships, CHARACTER_NAMES } from '../../domain/constants/character_relationships';
import { matchesConditions } from './dialogue_selector';

/**
 * Gossip item that a character might share about another
 */
export type GossipItem = {
  fromCharacterId: string;
  fromCharacterName: string;
  aboutCharacterId: string;
  aboutCharacterName: string;
  attitude: string;
  text: string;
  voiceTone?: string;
};

/**
 * Get gossip lines that a character has about other characters
 * Filters by dialogue conditions (player context)
 */
export function getCharacterGossip(
  stationId: string,
  context: DialogueContext
): GossipItem[] {
  const dialogue = getCharacterDialogue(stationId);
  const fromName = CHARACTER_NAMES[stationId] || stationId;
  
  const gossipLines = dialogue.filter(line => 
    line.category === 'gossip' && 
    line.conditions?.referencesCharacter &&
    matchesConditions(line, context)
  );
  
  return gossipLines.map(line => {
    const aboutId = line.conditions!.referencesCharacter!;
    const relationships = getCharacterRelationships(stationId);
    const rel = relationships.find(r => r.targetId === aboutId);
    
    return {
      fromCharacterId: stationId,
      fromCharacterName: fromName,
      aboutCharacterId: aboutId,
      aboutCharacterName: CHARACTER_NAMES[aboutId] || aboutId,
      attitude: rel?.attitude || 'neutral',
      text: line.text,
      voiceTone: line.voiceTone,
    };
  });
}

/**
 * Get all gossip about a specific character from all other characters
 * Useful for showing what the system thinks about someone
 */
export function getGossipAboutCharacter(
  targetStationId: string,
  context: DialogueContext
): GossipItem[] {
  const allGossip: GossipItem[] = [];
  
  for (const stationId of Object.keys(CHARACTER_NAMES)) {
    if (stationId === targetStationId) continue;
    
    const gossipFromStation = getCharacterGossip(stationId, context);
    const aboutTarget = gossipFromStation.filter(g => g.aboutCharacterId === targetStationId);
    allGossip.push(...aboutTarget);
  }
  
  return allGossip;
}

/**
 * Get a random piece of gossip from any character about any other character
 * Useful for "rumor mill" style displays
 */
export function getRandomGossip(context: DialogueContext): GossipItem | null {
  const allGossip: GossipItem[] = [];
  
  for (const stationId of Object.keys(CHARACTER_NAMES)) {
    const stationGossip = getCharacterGossip(stationId, context);
    allGossip.push(...stationGossip);
  }
  
  if (allGossip.length === 0) return null;
  return allGossip[Math.floor(Math.random() * allGossip.length)];
}

/**
 * Get gossip that relates to a player's recent actions
 * Characters will talk about things the player has done
 */
export function getReactiveGossip(
  context: DialogueContext,
  recentActions: string[]
): GossipItem[] {
  const allGossip: GossipItem[] = [];
  
  for (const stationId of Object.keys(CHARACTER_NAMES)) {
    const dialogue = getCharacterDialogue(stationId);
    const fromName = CHARACTER_NAMES[stationId] || stationId;
    
    // Find reaction lines that respond to recent actions
    const reactionLines = dialogue.filter(line => {
      if (line.category !== 'reaction') return false;
      if (!matchesConditions(line, context)) return false;
      
      const requiredAction = line.conditions?.requiresAction;
      const requiredAny = line.conditions?.requiresAnyAction;
      
      if (requiredAction && recentActions.includes(requiredAction)) return true;
      if (requiredAny && requiredAny.some(a => recentActions.includes(a))) return true;
      
      return false;
    });
    
    for (const line of reactionLines) {
      allGossip.push({
        fromCharacterId: stationId,
        fromCharacterName: fromName,
        aboutCharacterId: 'player',
        aboutCharacterName: 'You',
        attitude: 'reaction',
        text: line.text,
        voiceTone: line.voiceTone,
      });
    }
  }
  
  return allGossip;
}

/**
 * Format gossip for display with attribution
 */
export function formatGossipWithAttribution(gossip: GossipItem): string {
  return `"${gossip.text}" — ${gossip.fromCharacterName}`;
}

/**
 * Get character relationships formatted for UI display
 */
export function getRelationshipNetworkDisplay(stationId: string): Array<{
  targetName: string;
  attitude: string;
  context: string;
  color: string;
}> {
  const relationships = getCharacterRelationships(stationId);
  
  return relationships
    .filter(r => r.publicKnowledge)
    .map(r => ({
      targetName: CHARACTER_NAMES[r.targetId] || r.targetId,
      attitude: r.attitude,
      context: r.context,
      color: r.attitude === 'allied' ? '#34d399' :
             r.attitude === 'friendly' ? '#60a5fa' :
             r.attitude === 'rival' ? '#f59e0b' :
             r.attitude === 'hostile' ? '#ef4444' :
             r.attitude === 'complicated' ? '#a78bfa' : '#9ca3af',
    }));
}










