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
export const WAVE_SPAWN_DISTANCE = 8 * SCALE;

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
  wavesCompleted: number;
  hasReachedDestination: boolean;
  spawnedPirateIds: string[];
  currentWavePirateIds: string[]; // Pirates in the current active wave
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
    lastWaveTime: currentTime - WAVE_SPAWN_INTERVAL + 5, // Spawn first wave after 5 seconds
    waveCount: 0,
    wavesCompleted: 0,
    hasReachedDestination: false,
    spawnedPirateIds: [],
    currentWavePirateIds: [],
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
 * 
 * @param state - Current escort state
 * @param escortNpc - The escort NPC (can be stationary for defend-in-place)
 * @param destinationStation - Destination station
 * @param currentTime - Current game time in seconds
 * @param deltaTime - Time since last update
 * @param isDefendInPlace - True if this is a defend-at-location mission (stationary)
 */
export function updateEscortState(
  state: EscortMissionState,
  escortNpc: NpcTrader | undefined,
  destinationStation: Station | undefined,
  currentTime: number,
  deltaTime: number,
  isDefendInPlace: boolean = false
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
  
  // For defend-in-place missions, skip destination check and keep spawning waves
  // The mission completes when all defend objectives are satisfied
  if (isDefendInPlace) {
    // Check if should spawn new wave
    if (shouldSpawnWave(state.lastWaveTime, currentTime)) {
      return {
        updatedState: {
          ...updatedState,
          lastWaveTime: currentTime,
          waveCount: state.waveCount + 1,
        },
        shouldSpawnNewWave: true,
        hasReached: false, // Never "reached" for defend-in-place
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
  
  // Standard escort logic: check if reached destination
  if (!state.hasReachedDestination && destinationStation) {
    const escortPos = escortNpc.position;
    const destPos = destinationStation.position;
    const dx = escortPos[0] - destPos[0];
    const dy = escortPos[1] - destPos[1];
    const dz = escortPos[2] - destPos[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    console.log(`📏 Distance check for ${state.escortNpcId}: escort at [${escortPos.map(v => v.toFixed(0)).join(',')}], dest ${state.destinationStationId} at [${destPos.map(v => v.toFixed(0)).join(',')}], distance=${distance.toFixed(0)}, threshold=${DESTINATION_REACH_DISTANCE}`);
    
    const hasReached = distance < DESTINATION_REACH_DISTANCE;
    
    if (hasReached) {
      console.log(`📍 Escort ${state.escortNpcId} reached destination ${state.destinationStationId}`);
      return {
        updatedState: { ...updatedState, hasReachedDestination: true },
        shouldSpawnNewWave: false,
        hasReached: true,
        escortDestroyed: false,
      };
    }
  }
  
  // Debug: log spawn wave check
  const shouldSpawn = shouldSpawnWave(state.lastWaveTime, currentTime);
  console.log(`🔎 updateEscortState: hasReachedDest=${state.hasReachedDestination}, shouldSpawnWave=${shouldSpawn}, lastWaveTime=${state.lastWaveTime}, currentTime=${currentTime}, diff=${(currentTime - state.lastWaveTime).toFixed(1)}s`);
  
  // Check if should spawn new wave (only if not reached destination)
  if (!state.hasReachedDestination && shouldSpawn) {
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
    m.objectives.some(obj => obj.type === 'defend' || obj.type === 'escort')
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
 * Removes all escort states for a mission (supports multiple escorts per mission)
 */
export function cleanupEscortState(
  escortStates: Map<string, EscortMissionState>,
  missionId: string
): Map<string, EscortMissionState> {
  const updated = new Map(escortStates);
  // Remove all escort states for this mission (both exact match and composite keys)
  for (const key of updated.keys()) {
    if (key === missionId || key.startsWith(`${missionId}:`)) {
      updated.delete(key);
    }
  }
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
 * Add spawned pirate IDs to escort state (for a new wave)
 */
export function addSpawnedPirateIds(
  state: EscortMissionState,
  pirateIds: string[]
): EscortMissionState {
  return {
    ...state,
    spawnedPirateIds: [...state.spawnedPirateIds, ...pirateIds],
    currentWavePirateIds: pirateIds, // Track current wave separately
  };
}

/**
 * Check if current wave is complete (all pirates destroyed)
 */
export function checkWaveComplete(
  state: EscortMissionState,
  npcTraders: { id: string; hp: number }[]
): boolean {
  if (state.currentWavePirateIds.length === 0) return false;
  
  // Check if all pirates in the current wave are destroyed
  return state.currentWavePirateIds.every(pirateId => {
    const pirate = npcTraders.find(n => n.id === pirateId);
    return !pirate || pirate.hp <= 0;
  });
}

/**
 * Mark current wave as completed
 */
export function markWaveCompleted(
  state: EscortMissionState
): EscortMissionState {
  return {
    ...state,
    wavesCompleted: state.wavesCompleted + 1,
    currentWavePirateIds: [], // Clear current wave
  };
}

