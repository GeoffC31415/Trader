// Escort and defend mission mechanics - NPC protection and wave spawning

import type { Ship, Station, NpcTrader } from '../../domain/types/world_types';
import type { Mission } from '../../domain/types/mission_types';
import { SCALE } from '../../domain/constants/world_constants';

// ============================================================================
// Escort Mission Constants
// ============================================================================

/**
 * Escort NPC base HP
 */
export const ESCORT_HP = 100;

/**
 * Distance at which escort "reaches destination" (in world units)
 */
export const DESTINATION_REACH_DISTANCE = 6 * SCALE;

/**
 * Wave spawn interval (in seconds)
 */
export const WAVE_SPAWN_INTERVAL = 30;

/**
 * Number of enemies per wave
 */
export const ENEMIES_PER_WAVE_MIN = 2;
export const ENEMIES_PER_WAVE_MAX = 3;

/**
 * Distance from escort to spawn pirate waves (in world units)
 */
export const WAVE_SPAWN_DISTANCE = 15 * SCALE;

// ============================================================================
// Escort State Tracking
// ============================================================================

/**
 * Escort mission state
 */
export type EscortMissionState = {
  missionId: string;
  escortNpcId: string;
  escortHp: number;
  escortMaxHp: number;
  destinationStationId: string;
  lastWaveTime: number;
  waveCount: number;
  hasReachedDestination: boolean;
  spawnedPirateIds: string[];
};

/**
 * Create initial escort state for a mission
 */
export function createEscortState(
  missionId: string,
  escortNpcId: string,
  destinationStationId: string,
  currentTime: number
): EscortMissionState {
  return {
    missionId,
    escortNpcId,
    escortHp: ESCORT_HP,
    escortMaxHp: ESCORT_HP,
    destinationStationId,
    lastWaveTime: currentTime,
    waveCount: 0,
    hasReachedDestination: false,
    spawnedPirateIds: [],
  };
}

/**
 * Check if escort has reached destination
 */
export function hasEscortReachedDestination(
  escortPosition: [number, number, number],
  destinationPosition: [number, number, number]
): boolean {
  const dx = escortPosition[0] - destinationPosition[0];
  const dy = escortPosition[1] - destinationPosition[1];
  const dz = escortPosition[2] - destinationPosition[2];
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  return distance < DESTINATION_REACH_DISTANCE;
}

/**
 * Check if it's time to spawn a new wave
 */
export function shouldSpawnWave(
  lastWaveTime: number,
  currentTime: number
): boolean {
  return currentTime - lastWaveTime >= WAVE_SPAWN_INTERVAL;
}

/**
 * Calculate wave spawn position (around escort)
 */
export function calculateWaveSpawnPosition(
  escortPosition: [number, number, number],
  waveIndex: number
): [number, number, number] {
  // Spawn enemies in a circle around the escort
  const angle = (waveIndex * Math.PI * 2) / 3; // Distribute evenly
  const spawnX = escortPosition[0] + Math.cos(angle) * WAVE_SPAWN_DISTANCE;
  const spawnZ = escortPosition[2] + Math.sin(angle) * WAVE_SPAWN_DISTANCE;
  const spawnY = escortPosition[1];
  
  return [spawnX, spawnY, spawnZ];
}

/**
 * Generate pirate wave NPCs
 */
export function generatePirateWave(
  missionId: string,
  waveNumber: number,
  escortPosition: [number, number, number],
  currentTime: number
): NpcTrader[] {
  const waveSize = Math.floor(
    Math.random() * (ENEMIES_PER_WAVE_MAX - ENEMIES_PER_WAVE_MIN + 1) + ENEMIES_PER_WAVE_MIN
  );
  
  const pirates: NpcTrader[] = [];
  
  for (let i = 0; i < waveSize; i++) {
    const spawnPos = calculateWaveSpawnPosition(escortPosition, i);
    const pirateId = `pirate:${missionId}:wave${waveNumber}:${i}`;
    
    const pirate: NpcTrader = {
      id: pirateId,
      position: spawnPos,
      velocity: [0, 0, 0],
      path: [],
      pathProgress: 0,
      fromId: 'hidden-cove',
      toId: '', // No destination, just attack
      cargoCapacity: 5,
      lastTradeTime: currentTime,
      
      // Combat stats for pirates
      hp: 100, // Medium difficulty
      maxHp: 100,
      isHostile: true, // Pirates are hostile
      isMissionTarget: true,
      missionId,
      
      // Make pirate aggressive
      isAggressive: true,
    };
    
    pirates.push(pirate);
  }
  
  return pirates;
}

/**
 * Update escort mission state
 */
export function updateEscortState(
  state: EscortMissionState,
  escortNpc: NpcTrader | undefined,
  destinationStation: Station | undefined,
  currentTime: number,
  deltaTime: number
): {
  updatedState: EscortMissionState;
  shouldSpawnNewWave: boolean;
  hasReached: boolean;
  escortDestroyed: boolean;
} {
  // Check if escort was destroyed
  if (!escortNpc || escortNpc.hp <= 0) {
    return {
      updatedState: state,
      shouldSpawnNewWave: false,
      hasReached: false,
      escortDestroyed: true,
    };
  }
  
  // Update escort HP
  const updatedState: EscortMissionState = {
    ...state,
    escortHp: escortNpc.hp,
  };
  
  // Check if reached destination
  if (!state.hasReachedDestination && destinationStation) {
    const hasReached = hasEscortReachedDestination(
      escortNpc.position,
      destinationStation.position
    );
    
    if (hasReached) {
      return {
        updatedState: { ...updatedState, hasReachedDestination: true },
        shouldSpawnNewWave: false,
        hasReached: true,
        escortDestroyed: false,
      };
    }
  }
  
  // Check if should spawn new wave (only if not reached destination)
  if (!state.hasReachedDestination && shouldSpawnWave(state.lastWaveTime, currentTime)) {
    return {
      updatedState: {
        ...updatedState,
        lastWaveTime: currentTime,
        waveCount: state.waveCount + 1,
      },
      shouldSpawnNewWave: true,
      hasReached: false,
      escortDestroyed: false,
    };
  }
  
  return {
    updatedState,
    shouldSpawnNewWave: false,
    hasReached: false,
    escortDestroyed: false,
  };
}

/**
 * Get all active escort missions
 */
export function getActiveEscortMissions(missions: Mission[]): Mission[] {
  return missions.filter(m => 
    m.status === 'active' && 
    m.objectives.some(obj => obj.type === 'defend')
  );
}

/**
 * Create escort NPC for mission
 */
export function createEscortNpc(
  missionId: string,
  startStation: Station,
  destinationStation: Station,
  currentTime: number
): NpcTrader {
  const escortId = `escort:${missionId}`;
  
  return {
    id: escortId,
    position: [...startStation.position] as [number, number, number],
    velocity: [0, 0, 0],
    path: [],
    pathProgress: 0,
    fromId: startStation.id,
    toId: destinationStation.id,
    cargoCapacity: 10,
    lastTradeTime: currentTime,
    
    // Escort combat stats
    hp: ESCORT_HP,
    maxHp: ESCORT_HP,
    isHostile: false,
    isMissionTarget: false,
    missionId,
    
    // Mark as mission escort
    isMissionEscort: true,
  };
}

/**
 * Calculate HP percentage for UI display
 */
export function getEscortHpPercentage(escortState: EscortMissionState): number {
  return (escortState.escortHp / escortState.escortMaxHp) * 100;
}

/**
 * Clean up escort mission state when mission ends
 */
export function cleanupEscortState(
  escortStates: Map<string, EscortMissionState>,
  missionId: string
): Map<string, EscortMissionState> {
  const updated = new Map(escortStates);
  updated.delete(missionId);
  return updated;
}

/**
 * Get pirate IDs spawned by an escort mission
 */
export function getMissionPirateIds(
  escortState: EscortMissionState | undefined
): string[] {
  return escortState?.spawnedPirateIds || [];
}

/**
 * Add spawned pirate ID to escort state
 */
export function addSpawnedPirateIds(
  state: EscortMissionState,
  pirateIds: string[]
): EscortMissionState {
  return {
    ...state,
    spawnedPirateIds: [...state.spawnedPirateIds, ...pirateIds],
  };
}

