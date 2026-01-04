/**
 * Politics Module
 * 
 * Handles political compass score updates when missions are completed
 * or choices are made.
 */

import type { GameState } from '../../domain/types/world_types';
import type { PlayerPoliticalProfile } from '../../systems/politics/political_compass';
import {
  createInitialProfile,
  applyMissionContribution,
} from '../../systems/politics/political_compass';

/**
 * Get or initialize the political profile
 */
export function getOrCreateProfile(state: GameState): PlayerPoliticalProfile {
  return state.politicalProfile || createInitialProfile();
}

/**
 * Apply a mission completion to the political profile
 * @param multiplier - Score multiplier (1.0 for success, 0.5 for failure)
 */
export function applyMissionToProfile(
  state: GameState,
  missionId: string,
  choiceId: string | null,
  multiplier: number = 1.0
): Partial<GameState> {
  const currentProfile = getOrCreateProfile(state);
  const updatedProfile = applyMissionContribution(currentProfile, missionId, choiceId, multiplier);
  
  return {
    politicalProfile: updatedProfile,
  };
}

/**
 * Initialize political profile for a new game
 */
export function initializePoliticalProfile(): PlayerPoliticalProfile {
  return createInitialProfile();
}

