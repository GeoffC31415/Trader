// Character relationship web and voice direction data
// Defines how characters relate to each other and their voice synthesis metadata

import type { CharacterRelationship, VoiceDirection } from '../types/character_types';

/**
 * Voice directions for each character - used by voice synthesis pipeline
 */
export const CHARACTER_VOICE_DIRECTIONS: Record<string, VoiceDirection> = {
  'sol-city': {
    characterId: 'sol-city',
    characterName: 'Mira Vale',
    voiceStyle: 'Polished, measured, slight condescension. Professional bureaucrat who believes in the system.',
    gender: 'female',
    ageRange: 'mid-30s',
    speechPattern: 'Uses formal language, occasionally lets frustration show through clipped sentences.',
  },
  'sol-refinery': {
    characterId: 'sol-refinery',
    characterName: 'Rex Calder',
    voiceStyle: 'Gruff, working-class, direct. No-nonsense foreman who has seen it all.',
    gender: 'male',
    ageRange: 'late-40s',
    speechPattern: 'Short sentences, practical metaphors, occasional profanity-adjacent expressions.',
  },
  'aurum-fab': {
    characterId: 'aurum-fab',
    characterName: 'Dr. Elin Kade',
    voiceStyle: 'Clinical, precise, emotionally detached. Scientist first, human second.',
    gender: 'female',
    ageRange: 'early-40s',
    speechPattern: 'Technical vocabulary, measured pauses, rarely uses contractions.',
  },
  'greenfields': {
    characterId: 'greenfields',
    characterName: 'Sana Whit',
    voiceStyle: 'Warm, earthy, quietly fierce. Farmer who fights with patience and resolve.',
    gender: 'female',
    ageRange: 'mid-40s',
    speechPattern: 'Agricultural metaphors, gentle tone that hardens when discussing Sol City.',
  },
  'ceres-pp': {
    characterId: 'ceres-pp',
    characterName: 'Ivo Renn',
    voiceStyle: 'Dry, calculating, subtle menace. Every word is deliberate.',
    gender: 'male',
    ageRange: 'early-50s',
    speechPattern: 'Data-driven language, dry humor, statements that sound like threats.',
  },
  'freeport': {
    characterId: 'freeport',
    characterName: 'Kalla Rook',
    voiceStyle: 'Street-smart, charming, hint of mischief. The friendly merchant who knows everything.',
    gender: 'female',
    ageRange: 'late-30s',
    speechPattern: 'Casual slang, knowing winks in voice, comfortable with ambiguity.',
  },
  'drydock': {
    characterId: 'drydock',
    characterName: 'Chief Harlan',
    voiceStyle: 'Blue-collar, loyal, weathered. Union man through and through.',
    gender: 'male',
    ageRange: 'mid-50s',
    speechPattern: 'Working-class directness, proud of craft, protective of workers.',
  },
  'hidden-cove': {
    characterId: 'hidden-cove',
    characterName: 'Vex Marrow',
    voiceStyle: 'Dangerous charm, playful threat. Every smile has teeth.',
    gender: 'male',
    ageRange: 'early-40s',
    speechPattern: 'Sardonic wit, theatrical flair, threats delivered as friendly advice.',
  },
};

/**
 * Character relationships - how each character feels about others
 * Organized by source character's station ID
 */
export const CHARACTER_RELATIONSHIPS: Record<string, CharacterRelationship[]> = {
  // Mira Vale (Sol City) - The Regulator
  'sol-city': [
    {
      targetId: 'greenfields',
      attitude: 'rival',
      context: 'Sana defies regulations that Mira believes protect everyone',
      publicKnowledge: true,
    },
    {
      targetId: 'sol-refinery',
      attitude: 'friendly',
      context: 'Rex runs a clean operation and pays his taxes',
      publicKnowledge: true,
    },
    {
      targetId: 'aurum-fab',
      attitude: 'neutral',
      context: 'Dr. Kade follows rules but pushes boundaries',
      publicKnowledge: true,
    },
    {
      targetId: 'hidden-cove',
      attitude: 'hostile',
      context: 'Pirates are criminals, period',
      publicKnowledge: true,
    },
    {
      targetId: 'freeport',
      attitude: 'complicated',
      context: 'Kalla operates in gray areas Mira cannot officially tolerate',
      publicKnowledge: true,
    },
    {
      targetId: 'drydock',
      attitude: 'neutral',
      context: 'Union politics are tiresome but legal',
      publicKnowledge: true,
    },
    {
      targetId: 'ceres-pp',
      attitude: 'friendly',
      context: 'Ivo keeps the lights on across the system',
      publicKnowledge: true,
    },
  ],

  // Rex Calder (Sol Refinery) - The Honest Worker
  'sol-refinery': [
    {
      targetId: 'sol-city',
      attitude: 'friendly',
      context: 'Respects order even if bureaucracy is frustrating',
      publicKnowledge: true,
    },
    {
      targetId: 'ceres-pp',
      attitude: 'rival',
      context: 'Suspects Ivo of price manipulation but cannot prove it yet',
      publicKnowledge: true,
    },
    {
      targetId: 'drydock',
      attitude: 'allied',
      context: 'Workers stick together - Chief Harlan is solid',
      publicKnowledge: true,
    },
    {
      targetId: 'greenfields',
      attitude: 'friendly',
      context: 'Farmers and refinery workers understand hard labor',
      publicKnowledge: true,
    },
    {
      targetId: 'freeport',
      attitude: 'neutral',
      context: 'Kalla is fair enough if you watch your wallet',
      publicKnowledge: true,
    },
    {
      targetId: 'aurum-fab',
      attitude: 'neutral',
      context: 'Dr. Kade is too corporate but not actively harmful',
      publicKnowledge: true,
    },
    {
      targetId: 'hidden-cove',
      attitude: 'hostile',
      context: 'Pirates cost workers their livelihoods',
      publicKnowledge: true,
    },
  ],

  // Dr. Elin Kade (Aurum Fab) - The Optimizer
  'aurum-fab': [
    {
      targetId: 'drydock',
      attitude: 'rival',
      context: 'Chief Harlan\'s artisanal approach is inefficient',
      publicKnowledge: true,
    },
    {
      targetId: 'ceres-pp',
      attitude: 'friendly',
      context: 'Ivo understands efficiency and long-term planning',
      publicKnowledge: true,
    },
    {
      targetId: 'sol-city',
      attitude: 'neutral',
      context: 'Regulations are obstacles but manageable',
      publicKnowledge: true,
    },
    {
      targetId: 'greenfields',
      attitude: 'neutral',
      context: 'Farmers serve a function in the supply chain',
      publicKnowledge: false,
    },
    {
      targetId: 'freeport',
      attitude: 'neutral',
      context: 'Useful for procurement outside official channels',
      publicKnowledge: false,
    },
    {
      targetId: 'sol-refinery',
      attitude: 'neutral',
      context: 'Adequate fuel supplier, nothing more',
      publicKnowledge: true,
    },
    {
      targetId: 'hidden-cove',
      attitude: 'neutral',
      context: 'Pirates are a statistical nuisance, not a personal concern',
      publicKnowledge: false,
    },
  ],

  // Sana Whit (Greenfields) - The Revolutionary Farmer
  'greenfields': [
    {
      targetId: 'sol-city',
      attitude: 'rival',
      context: 'Mira represents everything strangling agricultural independence',
      publicKnowledge: true,
    },
    {
      targetId: 'drydock',
      attitude: 'allied',
      context: 'Chief Harlan understands working-class solidarity',
      publicKnowledge: true,
    },
    {
      targetId: 'sol-refinery',
      attitude: 'friendly',
      context: 'Rex is good people, keeps his word',
      publicKnowledge: true,
    },
    {
      targetId: 'freeport',
      attitude: 'friendly',
      context: 'Kalla offers direct trade without Sol City middlemen',
      publicKnowledge: true,
    },
    {
      targetId: 'aurum-fab',
      attitude: 'neutral',
      context: 'Dr. Kade sees farmers as numbers, but not hostile',
      publicKnowledge: true,
    },
    {
      targetId: 'ceres-pp',
      attitude: 'complicated',
      context: 'Ivo charges fair rates but his monopoly concerns everyone',
      publicKnowledge: true,
    },
    {
      targetId: 'hidden-cove',
      attitude: 'complicated',
      context: 'Pirates are dangerous but share enemies with farmers',
      publicKnowledge: false,
    },
  ],

  // Ivo Renn (Ceres PP) - The Puppet Master
  'ceres-pp': [
    {
      targetId: 'sol-refinery',
      attitude: 'rival',
      context: 'Rex is too idealistic about free markets',
      publicKnowledge: true,
    },
    {
      targetId: 'aurum-fab',
      attitude: 'friendly',
      context: 'Dr. Kade understands the value of controlled systems',
      publicKnowledge: true,
    },
    {
      targetId: 'sol-city',
      attitude: 'friendly',
      context: 'Mira keeps order, which benefits grid stability',
      publicKnowledge: true,
    },
    {
      targetId: 'drydock',
      attitude: 'neutral',
      context: 'Union workers are a necessary component',
      publicKnowledge: true,
    },
    {
      targetId: 'greenfields',
      attitude: 'neutral',
      context: 'Farmers pay their energy bills on time',
      publicKnowledge: true,
    },
    {
      targetId: 'freeport',
      attitude: 'neutral',
      context: 'Kalla operates outside official channels - useful occasionally',
      publicKnowledge: false,
    },
    {
      targetId: 'hidden-cove',
      attitude: 'complicated',
      context: 'Pirates can be... contracted for certain operations',
      publicKnowledge: false,
    },
  ],

  // Kalla Rook (Freeport) - The Information Broker
  'freeport': [
    {
      targetId: 'hidden-cove',
      attitude: 'complicated',
      context: 'Vex brings business but brings heat too',
      publicKnowledge: true,
    },
    {
      targetId: 'sol-city',
      attitude: 'complicated',
      context: 'Mira would shut us down if she could prove anything',
      publicKnowledge: true,
    },
    {
      targetId: 'greenfields',
      attitude: 'friendly',
      context: 'Sana offers good product at fair prices',
      publicKnowledge: true,
    },
    {
      targetId: 'drydock',
      attitude: 'friendly',
      context: 'Chief Harlan deals straight, always has',
      publicKnowledge: true,
    },
    {
      targetId: 'sol-refinery',
      attitude: 'neutral',
      context: 'Rex is honest but not very interesting',
      publicKnowledge: true,
    },
    {
      targetId: 'aurum-fab',
      attitude: 'neutral',
      context: 'Dr. Kade pays well for discrete procurement',
      publicKnowledge: false,
    },
    {
      targetId: 'ceres-pp',
      attitude: 'neutral',
      context: 'Ivo knows more than he lets on',
      publicKnowledge: false,
    },
  ],

  // Chief Harlan (Drydock) - The Union Leader
  'drydock': [
    {
      targetId: 'greenfields',
      attitude: 'allied',
      context: 'Sana fights the same fight we do',
      publicKnowledge: true,
    },
    {
      targetId: 'sol-refinery',
      attitude: 'allied',
      context: 'Rex understands worker solidarity',
      publicKnowledge: true,
    },
    {
      targetId: 'aurum-fab',
      attitude: 'rival',
      context: 'Dr. Kade would automate us all out of jobs',
      publicKnowledge: true,
    },
    {
      targetId: 'ceres-pp',
      attitude: 'rival',
      context: 'Ivo talks efficiency but means exploitation',
      publicKnowledge: true,
    },
    {
      targetId: 'sol-city',
      attitude: 'neutral',
      context: 'Mira follows rules even when rules hurt workers',
      publicKnowledge: true,
    },
    {
      targetId: 'freeport',
      attitude: 'friendly',
      context: 'Kalla knows everyone and keeps confidence',
      publicKnowledge: true,
    },
    {
      targetId: 'hidden-cove',
      attitude: 'complicated',
      context: 'Pirates started as workers who got squeezed out',
      publicKnowledge: false,
    },
  ],

  // Vex Marrow (Hidden Cove) - The Pirate King
  'hidden-cove': [
    {
      targetId: 'sol-city',
      attitude: 'hostile',
      context: 'Mira represents two generations of boots on necks',
      publicKnowledge: true,
    },
    {
      targetId: 'freeport',
      attitude: 'complicated',
      context: 'Kalla plays both sides but keeps our business private',
      publicKnowledge: true,
    },
    {
      targetId: 'greenfields',
      attitude: 'friendly',
      context: 'Sana fights the same authority we do, just politely',
      publicKnowledge: false,
    },
    {
      targetId: 'drydock',
      attitude: 'neutral',
      context: 'Workers and pirates share more history than they admit',
      publicKnowledge: false,
    },
    {
      targetId: 'sol-refinery',
      attitude: 'neutral',
      context: 'Rex is no threat, just a worker keeping his head down',
      publicKnowledge: true,
    },
    {
      targetId: 'aurum-fab',
      attitude: 'neutral',
      context: 'Dr. Kade is corporate scum but pays well for quiet work',
      publicKnowledge: false,
    },
    {
      targetId: 'ceres-pp',
      attitude: 'complicated',
      context: 'Ivo has hired us before. He will again.',
      publicKnowledge: false,
    },
  ],
};

/**
 * Get all relationships for a character
 */
export function getCharacterRelationships(stationId: string): CharacterRelationship[] {
  return CHARACTER_RELATIONSHIPS[stationId] || [];
}

/**
 * Get relationship between two characters
 */
export function getRelationshipBetween(fromId: string, toId: string): CharacterRelationship | undefined {
  const relationships = CHARACTER_RELATIONSHIPS[fromId] || [];
  return relationships.find(r => r.targetId === toId);
}

/**
 * Get all characters who have a specific attitude toward a target
 */
export function getCharactersWithAttitude(
  targetId: string, 
  attitude: CharacterRelationship['attitude']
): string[] {
  const result: string[] = [];
  for (const [sourceId, relationships] of Object.entries(CHARACTER_RELATIONSHIPS)) {
    const rel = relationships.find(r => r.targetId === targetId && r.attitude === attitude);
    if (rel) result.push(sourceId);
  }
  return result;
}

/**
 * Get voice direction for a character
 */
export function getVoiceDirection(stationId: string): VoiceDirection | undefined {
  return CHARACTER_VOICE_DIRECTIONS[stationId];
}

/**
 * Character display names by station ID
 */
export const CHARACTER_NAMES: Record<string, string> = {
  'sol-city': 'Mira Vale',
  'sol-refinery': 'Rex Calder',
  'aurum-fab': 'Dr. Elin Kade',
  'greenfields': 'Sana Whit',
  'ceres-pp': 'Ivo Renn',
  'freeport': 'Kalla Rook',
  'drydock': 'Chief Harlan',
  'hidden-cove': 'Vex Marrow',
};
