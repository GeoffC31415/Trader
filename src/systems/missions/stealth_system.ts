// Stealth mission mechanics - detection zones and validation

import type { Ship, Station, NpcTrader } from '../../domain/types/world_types';
import type { Mission, MissionObjective } from '../../domain/types/mission_types';
import { SCALE } from '../../domain/constants/world_constants';

// ============================================================================
// Detection System
// ============================================================================

/**
 * Detection radius around stations (in world units)
 */
export const DETECTION_RADIUS = 5 * SCALE;

/**
 * Suspicion level required to trigger detection
 */
export const DETECTION_THRESHOLD = 100;

/**
 * Rate at which suspicion builds when in detection zone (per second)
 */
export const SUSPICION_BUILD_RATE = 10;

/**
 * Rate at which suspicion decays when outside detection zone (per second)
 */
export const SUSPICION_DECAY_RATE = 20;

/**
 * Stealth state for tracking suspicion levels
 */
export type StealthState = {
  stationId: string;
  suspicionLevel: number;
  detected: boolean;
};

/**
 * Check if ship is within detection radius of a station
 */
export function isInDetectionZone(
  shipPosition: [number, number, number],
  stationPosition: [number, number, number],
  detectionRadius: number = DETECTION_RADIUS
): boolean {
  const dx = shipPosition[0] - stationPosition[0];
  const dy = shipPosition[1] - stationPosition[1];
  const dz = shipPosition[2] - stationPosition[2];
  const distanceSquared = dx * dx + dy * dy + dz * dz;
  
  return distanceSquared < detectionRadius * detectionRadius;
}

/**
 * Calculate distance between two positions
 */
export function calculateDistance(
  pos1: [number, number, number],
  pos2: [number, number, number]
): number {
  const dx = pos1[0] - pos2[0];
  const dy = pos1[1] - pos2[1];
  const dz = pos1[2] - pos2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Check if ship should be detected based on mission conditions
 */
export function shouldDetectShip(
  ship: Ship,
  mission: Mission,
  objective: MissionObjective
): boolean {
  // For smuggling missions, check if carrying contraband
  if (mission.id === 'greenfields_stage_1') {
    // Check for luxury goods contraband
    const hasContraband = !!(ship.cargo['luxury_goods'] && ship.cargo['luxury_goods'] > 0);
    return hasContraband;
  }
  
  // For stealth missions, detection depends on ship behavior
  if (mission.type === 'stealth') {
    // Can add more complex detection logic here:
    // - Moving too fast increases detection
    // - Being docked is safe
    // - Certain cargo types trigger detection
    return !ship.dockedStationId; // Not detected while docked
  }
  
  return true; // Default: can be detected
}

/**
 * Update suspicion level based on ship proximity and behavior
 */
export function updateSuspicionLevel(
  currentLevel: number,
  isInZone: boolean,
  shouldDetect: boolean,
  deltaTime: number
): number {
  if (isInZone && shouldDetect) {
    // Build suspicion when in zone
    return Math.min(DETECTION_THRESHOLD, currentLevel + SUSPICION_BUILD_RATE * deltaTime);
  } else {
    // Decay suspicion when out of zone
    return Math.max(0, currentLevel - SUSPICION_DECAY_RATE * deltaTime);
  }
}

/**
 * Check if detection is triggered based on suspicion level
 */
export function isDetectionTriggered(suspicionLevel: number): boolean {
  return suspicionLevel >= DETECTION_THRESHOLD;
}

/**
 * Get all active stealth missions
 */
export function getActiveStealthMissions(missions: Mission[]): Mission[] {
  return missions.filter(m => 
    m.status === 'active' && 
    m.objectives.some(obj => obj.type === 'avoid_detection')
  );
}

/**
 * Get detection objectives for a mission
 */
export function getDetectionObjectives(mission: Mission): MissionObjective[] {
  return mission.objectives.filter(obj => 
    obj.type === 'avoid_detection' && obj.completed
  );
}

/**
 * Process stealth checks for all active missions
 */
export function processStealthChecks(
  ship: Ship,
  stations: Station[],
  missions: Mission[],
  stealthStates: Map<string, StealthState>,
  deltaTime: number
): {
  detectedStations: string[];
  updatedStealthStates: Map<string, StealthState>;
} {
  const detectedStations: string[] = [];
  const updatedStealthStates = new Map(stealthStates);
  
  const stealthMissions = getActiveStealthMissions(missions);
  
  for (const mission of stealthMissions) {
    const detectionObjectives = getDetectionObjectives(mission);
    
    for (const objective of detectionObjectives) {
      const targetStationId = objective.target;
      if (!targetStationId) continue;
      
      const targetStation = stations.find(s => s.id === targetStationId);
      if (!targetStation) continue;
      
      // Check if in detection zone
      const inZone = isInDetectionZone(ship.position, targetStation.position);
      const shouldDetect = shouldDetectShip(ship, mission, objective);
      
      // Get or create stealth state for this station
      const stateKey = `${mission.id}:${targetStationId}`;
      const currentState = updatedStealthStates.get(stateKey) || {
        stationId: targetStationId,
        suspicionLevel: 0,
        detected: false,
      };
      
      // Update suspicion level
      const newSuspicionLevel = updateSuspicionLevel(
        currentState.suspicionLevel,
        inZone,
        shouldDetect,
        deltaTime
      );
      
      // Check if detection triggered
      const wasDetected = currentState.detected;
      const isDetected = isDetectionTriggered(newSuspicionLevel);
      
      // Update state
      updatedStealthStates.set(stateKey, {
        stationId: targetStationId,
        suspicionLevel: newSuspicionLevel,
        detected: isDetected,
      });
      
      // If newly detected, add to list
      if (isDetected && !wasDetected) {
        detectedStations.push(targetStationId);
      }
    }
  }
  
  return {
    detectedStations,
    updatedStealthStates,
  };
}

/**
 * Apply detection consequences (confiscate contraband, apply penalties)
 */
export function applyDetectionConsequences(
  ship: Ship,
  stations: Station[],
  detectedStationId: string,
  mission: Mission
): {
  updatedShip: Ship;
  updatedStations: Station[];
  confiscatedItems: { commodityId: string; quantity: number }[];
} {
  let updatedShip = { ...ship };
  let updatedStations = [...stations];
  const confiscatedItems: { commodityId: string; quantity: number }[] = [];
  
  // Confiscate contraband based on mission type
  if (mission.id === 'greenfields_stage_1') {
    // Confiscate luxury goods
    const luxuryGoods = updatedShip.cargo['luxury_goods'] || 0;
    if (luxuryGoods > 0) {
      confiscatedItems.push({ commodityId: 'luxury_goods', quantity: luxuryGoods });
      const newCargo = { ...updatedShip.cargo };
      delete newCargo['luxury_goods'];
      updatedShip = { ...updatedShip, cargo: newCargo };
    }
  }
  
  // Apply reputation penalty at detecting station
  updatedStations = updatedStations.map(s => 
    s.id === detectedStationId 
      ? { ...s, reputation: Math.max(-100, (s.reputation || 0) - 15) }
      : s
  );
  
  return {
    updatedShip,
    updatedStations,
    confiscatedItems,
  };
}

/**
 * Get suspicion level for a specific mission/station combination
 */
export function getSuspicionLevel(
  stealthStates: Map<string, StealthState>,
  missionId: string,
  stationId: string
): number {
  const stateKey = `${missionId}:${stationId}`;
  const state = stealthStates.get(stateKey);
  return state?.suspicionLevel || 0;
}

/**
 * Clear stealth states for a completed or failed mission
 */
export function clearMissionStealthStates(
  stealthStates: Map<string, StealthState>,
  missionId: string
): Map<string, StealthState> {
  const updated = new Map(stealthStates);
  for (const [key, _] of updated.entries()) {
    if (key.startsWith(`${missionId}:`)) {
      updated.delete(key);
    }
  }
  return updated;
}

