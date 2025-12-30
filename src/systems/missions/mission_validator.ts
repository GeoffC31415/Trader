// Mission objective validation and completion checking

import type { Mission, MissionObjective } from '../../domain/types/mission_types';
import type { Ship, Station } from '../../domain/types/world_types';

/**
 * Check if a mission objective is completed based on game events
 */
export function validateObjective(
  objective: MissionObjective,
  event: MissionEvent
): { completed: boolean; current: number } {
  switch (objective.type) {
    case 'deliver':
      if (event.type === 'commodity_sold' && event.commodityId === objective.target) {
        // Check if we need to deliver to a specific station
        if (objective.targetStation) {
          // Must deliver to the specified station
          if (event.stationId === objective.targetStation) {
            const newCurrent = objective.current + (event.quantity || 0);
            return {
              completed: newCurrent >= (objective.quantity || 0),
              current: newCurrent,
            };
          }
        } else {
          // No specific station required, any sale counts
          const newCurrent = objective.current + (event.quantity || 0);
          return {
            completed: newCurrent >= (objective.quantity || 0),
            current: newCurrent,
          };
        }
      }
      break;
      
    case 'collect':
      if (event.type === 'commodity_acquired' && event.commodityId === objective.target) {
        const newCurrent = objective.current + (event.quantity || 0);
        return {
          completed: newCurrent >= (objective.quantity || 0),
          current: newCurrent,
        };
      }
      break;
      
    case 'visit':
      if (event.type === 'station_docked' && event.stationId === objective.target) {
        const newCurrent = objective.current + 1;
        return {
          completed: newCurrent >= (objective.quantity || 1),
          current: newCurrent,
        };
      }
      break;
      
    case 'destroy':
      if (event.type === 'npc_destroyed' && event.npcId) {
        const newCurrent = objective.current + 1;
        return {
          completed: newCurrent >= (objective.quantity || 1),
          current: newCurrent,
        };
      }
      break;
      
    case 'escort':
      // Escort objective - track if escort NPC reaches destination
      if (event.type === 'escort_reached_destination' && event.npcId === objective.target) {
        return {
          completed: true,
          current: 1,
        };
      }
      break;
      
    case 'defend':
      // Defend missions - track if escort survives (legacy support)
      if (event.type === 'escort_reached_destination' && event.npcId === objective.target) {
        return {
          completed: true,
          current: 1,
        };
      }
      // Wave survival - increment current for each wave survived
      if (event.type === 'wave_survived') {
        const newCurrent = objective.current + 1;
        return {
          completed: newCurrent >= (objective.quantity || 1),
          current: newCurrent,
        };
      }
      break;
      
    case 'wait':
      if (event.type === 'time_elapsed' && event.duration) {
        const newCurrent = objective.current + event.duration;
        return {
          completed: newCurrent >= (objective.quantity || 0),
          current: newCurrent,
        };
      }
      break;
      
    case 'avoid_detection':
      if (event.type === 'detection_triggered' && event.stationId === objective.target) {
        // Detection fails the objective immediately
        return {
          completed: false,
          current: 1, // Mark as triggered
        };
      }
      // If no detection event, keep current state (should start as completed)
      break;
  }
  
  return {
    completed: objective.completed,
    current: objective.current,
  };
}

/**
 * Check if all required objectives are completed
 */
export function checkMissionCompletion(mission: Mission): boolean {
  const requiredObjectives = mission.objectives.filter(obj => !obj.optional);
  return requiredObjectives.every(obj => obj.completed);
}

/**
 * Check if mission has failed (time expired, critical objective failed, etc.)
 */
export function checkMissionFailure(mission: Mission, currentTime: number): { failed: boolean; reason?: string } {
  // Check time limit
  if (mission.timeLimit && mission.acceptedAt) {
    const elapsed = currentTime - mission.acceptedAt;
    if (elapsed > mission.timeLimit) {
      return { failed: true, reason: 'Time limit exceeded' };
    }
  }
  
  // Check expiration
  if (mission.expiresAt && currentTime > mission.expiresAt) {
    return { failed: true, reason: 'Mission expired' };
  }
  
  // Check for failed critical objectives (like detection in stealth missions)
  const hasFailedCriticalObjective = mission.objectives.some(obj => {
    return obj.type === 'avoid_detection' && !obj.optional && obj.current > 0;
  });
  
  if (hasFailedCriticalObjective) {
    return { failed: true, reason: 'Detected by station security' };
  }
  
  return { failed: false };
}

/**
 * Update mission objectives based on game event
 */
export function updateMissionObjectives(
  mission: Mission,
  event: MissionEvent
): Mission {
  const updatedObjectives = mission.objectives.map(objective => {
    if (objective.completed) return objective;
    
    const validation = validateObjective(objective, event);
    return {
      ...objective,
      current: validation.current,
      completed: validation.completed,
    };
  });
  
  return {
    ...mission,
    objectives: updatedObjectives,
  };
}

/**
 * Calculate mission progress percentage
 */
export function calculateMissionProgress(mission: Mission): number {
  const requiredObjectives = mission.objectives.filter(obj => !obj.optional);
  if (requiredObjectives.length === 0) return 100;
  
  const completedCount = requiredObjectives.filter(obj => obj.completed).length;
  return (completedCount / requiredObjectives.length) * 100;
}

/**
 * Get next incomplete objective
 */
export function getNextObjective(mission: Mission): MissionObjective | null {
  return mission.objectives.find(obj => !obj.completed && !obj.optional) || null;
}

// ============================================================================
// Mission Event Types
// ============================================================================

export type MissionEvent =
  | { type: 'commodity_sold'; commodityId: string; quantity: number; stationId: string }
  | { type: 'commodity_acquired'; commodityId: string; quantity: number }
  | { type: 'station_docked'; stationId: string }
  | { type: 'npc_destroyed'; npcId: string }
  | { type: 'escort_reached_destination'; npcId: string }
  | { type: 'wave_survived'; waveNumber: number }
  | { type: 'time_elapsed'; duration: number }
  | { type: 'detection_triggered'; stationId: string };

/**
 * Check if ship is in detection range of a station (for stealth missions)
 */
export function checkDetectionRange(
  shipPosition: [number, number, number],
  stationPosition: [number, number, number],
  detectionRadius: number
): boolean {
  const dx = shipPosition[0] - stationPosition[0];
  const dy = shipPosition[1] - stationPosition[1];
  const dz = shipPosition[2] - stationPosition[2];
  const distanceSquared = dx * dx + dy * dy + dz * dz;
  
  return distanceSquared < detectionRadius * detectionRadius;
}

