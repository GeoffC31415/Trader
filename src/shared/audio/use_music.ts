/**
 * React hook for managing game music based on game state
 * 
 * Automatically switches between ambient and station music
 * based on docking status and combat state.
 */

import { useEffect, useRef, useMemo } from 'react';
import { useGameStore } from '../../state';
import * as musicAudio from './music_audio';
import { gameConfig } from '../../config/game_config';

let musicInitialized = false;

/**
 * Hook to control music playback based on game state
 * 
 * Music Change Conditions:
 * 1. Station Music: Changes when docking at a station (dockedStationId changes)
 * 2. Ambient Music: Changes when:
 *    - Undocking (dockedStationId becomes undefined)
 *    - Entering combat: projectiles.length > 0 OR any NPC has isAggressive === true
 *    - Exiting combat: projectiles.length === 0 AND no NPCs are aggressive
 * 
 * Frequency:
 * - Station changes: Only when docking/undocking (infrequent, player-initiated)
 * - Combat changes: 
 *    - Entering: When first projectile fired or NPC becomes aggressive
 *    - Exiting: When last projectile despawns (5s) AND NPC aggression expires (30s)
 *    - Projectiles despawn after 5 seconds
 *    - NPC aggression lasts 30 seconds after being hit
 */
export function useMusicController(): void {
  const dockedStationId = useGameStore(s => s.ship.dockedStationId);
  const projectiles = useGameStore(s => s.projectiles);
  const npcAggression = useGameStore(s => s.npcAggression);
  const musicEnabled = gameConfig.audio?.musicEnabled ?? true;
  const musicVolume = gameConfig.audio?.musicVolume ?? 0.7;
  
  const lastDockedStationRef = useRef<string | undefined>(undefined);
  const lastCombatStateRef = useRef<boolean>(false);
  const initializedRef = useRef(false);

  // Memoize combat state calculation to avoid recalculating on every render
  // This computes: are there active projectiles OR aggressive NPCs?
  const inCombat = useMemo(() => {
    const hasActiveProjectiles = projectiles.length > 0;
    const hasAggressiveNpcs = Object.values(npcAggression).some(
      agg => agg?.isAggressive === true
    );
    return hasActiveProjectiles || hasAggressiveNpcs;
  }, [projectiles.length, npcAggression]);

  // Initialize music system once (after first user interaction)
  useEffect(() => {
    if (!musicInitialized && musicEnabled) {
      // Initialize on first mount - this will be called after user interaction
      musicAudio.initializeMusic().catch(() => {
        // Silently fail - will retry on user interaction
      });
      musicInitialized = true;
    }
    
    // Set volume from config
    if (musicEnabled) {
      musicAudio.setVolume(musicVolume);
    }
  }, [musicEnabled, musicVolume]);

  // Handle music playback based on game state
  useEffect(() => {
    if (!musicEnabled) {
      return;
    }

    // Handle station music
    if (dockedStationId) {
      // If docked, play station music (only changes when station ID changes)
      if (lastDockedStationRef.current !== dockedStationId) {
        musicAudio.playStation(dockedStationId).catch(error => {
          console.warn('Failed to play station music:', error);
        });
        lastDockedStationRef.current = dockedStationId;
        lastCombatStateRef.current = false; // Reset combat state when docking
      }
    } else {
      // If not docked, play ambient music based on combat state
      // Only change music if combat state actually changed or we just undocked
      const combatStateChanged = lastCombatStateRef.current !== inCombat;
      const stationChanged = lastDockedStationRef.current !== undefined;

      if (combatStateChanged || stationChanged) {
        const ambientState = inCombat ? 'combat' : 'exploring';
        musicAudio.playAmbient(ambientState).catch(error => {
          console.warn('Failed to play ambient music:', error);
        });
        lastCombatStateRef.current = inCombat;
        lastDockedStationRef.current = undefined;
      }
    }
  }, [dockedStationId, inCombat, musicEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't stop music on unmount - let it continue playing
      // Music will be managed by the next component mount
    };
  }, []);
}

/**
 * Initialize music after user interaction (call from button click, etc.)
 */
export function initializeMusicOnInteraction(): void {
  if (!musicInitialized) {
    musicAudio.initializeMusic().catch(() => {
      // Silently fail
    });
    musicInitialized = true;
  }
}

