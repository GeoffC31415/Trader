/**
 * React hook for managing mission dialogue audio playback
 * 
 * Handles playing audio at key mission moments:
 * - Introduction when viewing/accepting a mission
 * - Acceptance confirmation
 * - Key moments during mission progress
 * - Completion/failure monologues
 */

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../../state';
import * as missionAudio from './mission_audio';
import { gameConfig } from '../../config/game_config';

type MissionAudioState = {
  playedIntros: Set<string>;
  playedKeyMoments: Map<string, Set<string>>;
  lastMissionStatus: Map<string, string>;
};

// Global state to track what's been played this session
const audioState: MissionAudioState = {
  playedIntros: new Set(),
  playedKeyMoments: new Map(),
  lastMissionStatus: new Map(),
};

/**
 * Hook to play mission introduction audio
 * Call this when a mission is selected/viewed in the UI
 */
export function useMissionIntroAudio(missionId: string | null, isVisible: boolean = true) {
  const volumeRef = useRef(gameConfig.audio?.dialogueVolume ?? 0.8);

  useEffect(() => {
    if (!missionId || !isVisible) return;
    if (audioState.playedIntros.has(missionId)) return;

    const playIntro = async () => {
      const introPaths = await missionAudio.getMissionIntroAudio(missionId);
      if (introPaths.length > 0) {
        audioState.playedIntros.add(missionId);
        await missionAudio.playAudioSequence(introPaths, volumeRef.current);
      }
    };

    playIntro().catch(console.warn);

    return () => {
      // Don't stop on unmount - let audio finish
    };
  }, [missionId, isVisible]);
}

/**
 * Play acceptance audio for a mission
 */
export async function playMissionAcceptAudio(missionId: string): Promise<void> {
  const volume = gameConfig.audio?.dialogueVolume ?? 0.8;
  const acceptPath = await missionAudio.getMissionAcceptAudio(missionId);
  
  if (acceptPath) {
    await missionAudio.playMissionAudio(acceptPath, volume);
  }
}

/**
 * Play completion audio for a mission
 */
export async function playMissionCompleteAudio(missionId: string): Promise<void> {
  const volume = gameConfig.audio?.dialogueVolume ?? 0.8;
  const completePaths = await missionAudio.getMissionCompleteAudio(missionId);
  
  if (completePaths.length > 0) {
    await missionAudio.playAudioSequence(completePaths, volume);
  }
}

/**
 * Play a key moment audio trigger
 */
export async function playKeyMomentAudio(
  missionId: string,
  triggerId: string
): Promise<void> {
  // Check if already played
  const playedForMission = audioState.playedKeyMoments.get(missionId);
  if (playedForMission?.has(triggerId)) return;

  const volume = gameConfig.audio?.dialogueVolume ?? 0.8;
  const audioPath = await missionAudio.getKeyMomentAudio(missionId, triggerId);
  
  if (audioPath) {
    // Mark as played
    if (!audioState.playedKeyMoments.has(missionId)) {
      audioState.playedKeyMoments.set(missionId, new Set());
    }
    audioState.playedKeyMoments.get(missionId)!.add(triggerId);
    
    await missionAudio.playMissionAudio(audioPath, volume);
  }
}

/**
 * Hook to automatically handle mission audio based on state changes
 * This monitors mission status changes and triggers appropriate audio
 */
export function useMissionAudioController() {
  const missions = useGameStore(s => s.missions);
  const volumeRef = useRef(gameConfig.audio?.dialogueVolume ?? 0.8);

  useEffect(() => {
    // Check for status changes
    for (const mission of missions) {
      const lastStatus = audioState.lastMissionStatus.get(mission.id);
      const currentStatus = mission.status;

      // Mission just completed
      if (lastStatus === 'active' && currentStatus === 'completed') {
        playMissionCompleteAudio(mission.id).catch(console.warn);
      }

      // Update tracked status
      audioState.lastMissionStatus.set(mission.id, currentStatus);
    }
  }, [missions]);

  // Expose method to trigger key moments
  const triggerKeyMoment = useCallback((missionId: string, triggerId: string) => {
    playKeyMomentAudio(missionId, triggerId).catch(console.warn);
  }, []);

  return { triggerKeyMoment };
}

/**
 * Hook that provides callbacks for mission UI interactions
 */
export function useMissionAudioCallbacks() {
  const onMissionAccept = useCallback(async (missionId: string) => {
    await playMissionAcceptAudio(missionId);
  }, []);

  const onMissionView = useCallback((missionId: string) => {
    // Only play intro if not already played
    if (!audioState.playedIntros.has(missionId)) {
      const playIntro = async () => {
        const introPaths = await missionAudio.getMissionIntroAudio(missionId);
        if (introPaths.length > 0) {
          audioState.playedIntros.add(missionId);
          const volume = gameConfig.audio?.dialogueVolume ?? 0.8;
          await missionAudio.playAudioSequence(introPaths, volume);
        }
      };
      playIntro().catch(console.warn);
    }
  }, []);

  const stopAudio = useCallback(() => {
    missionAudio.stopMissionAudio();
  }, []);

  return {
    onMissionAccept,
    onMissionView,
    stopAudio,
    isPlaying: missionAudio.isMissionAudioPlaying,
  };
}

/**
 * Reset audio state (useful for new game)
 */
export function resetMissionAudioState(): void {
  audioState.playedIntros.clear();
  audioState.playedKeyMoments.clear();
  audioState.lastMissionStatus.clear();
  missionAudio.stopMissionAudio();
}

/**
 * Preload mission audio manifest
 */
export function preloadMissionAudio(): void {
  missionAudio.preloadMissionManifest();
}

