// Mission progression and helper functions

import type { Mission, MissionArc } from '../../domain/types/mission_types';
import type { GameState } from '../../domain/types/world_types';
import { getMissionTemplatesByStage } from '../../domain/constants/mission_constants';
import { applyMultipleReputationChanges } from '../../systems/reputation/faction_system';

/**
 * Advance mission arc to next stage
 */
export function advanceMissionArc(arc: MissionArc, completedMissionId: string): MissionArc {
  const updatedCompletedMissions = [...arc.completedMissions, completedMissionId];
  
  // Check if all missions in current stage are completed
  // For branching paths (like stage 3 in Greenfields), we only need ONE path completed
  const currentStageMissions = getMissionTemplatesByStage(arc.id, arc.currentStage);
  
  // If there are multiple missions at this stage (branching paths), check if at least one is completed
  // Otherwise, check if all are completed
  let shouldAdvance = false;
  if (currentStageMissions.length > 1) {
    // Branching path: advance if ANY mission in this stage is completed
    shouldAdvance = currentStageMissions.some(template => 
      updatedCompletedMissions.includes(template.id)
    );
  } else {
    // Linear path: advance only if ALL missions are completed
    shouldAdvance = currentStageMissions.every(template => 
      updatedCompletedMissions.includes(template.id)
    );
  }
  
  if (shouldAdvance) {
    // Move to next stage or complete arc
    const nextStage = arc.currentStage + 1;
    const hasNextStageMissions = getMissionTemplatesByStage(arc.id, nextStage).length > 0;
    
    if (hasNextStageMissions) {
      return {
        ...arc,
        currentStage: nextStage,
        completedMissions: updatedCompletedMissions,
        status: 'in_progress',
      };
    } else {
      // Arc completed
      return {
        ...arc,
        completedMissions: updatedCompletedMissions,
        status: 'completed',
      };
    }
  }
  
  return {
    ...arc,
    completedMissions: updatedCompletedMissions,
    status: 'in_progress',
  };
}

/**
 * Apply mission rewards to game state
 * Now includes faction reputation propagation
 */
export function applyMissionRewards(
  gameState: GameState,
  mission: Mission
): Partial<GameState> {
  const { rewards } = mission;
  
  // Apply credit reward
  const newCredits = gameState.ship.credits + rewards.credits;
  
  // Apply reputation changes with faction propagation
  const newStations = applyMultipleReputationChanges(
    gameState.stations,
    rewards.reputationChanges
  );
  
  // Apply permanent effects (handled separately in store actions)
  // These will modify prices, availability, etc.
  
  return {
    ship: {
      ...gameState.ship,
      credits: newCredits,
    },
    stations: newStations,
  };
}

/**
 * Apply permanent mission effects to game state
 */
export function applyPermanentEffects(
  gameState: GameState,
  effects: string[]
): Partial<GameState> {
  let updates: Partial<GameState> = {};
  
  for (const effect of effects) {
    switch (effect) {
      case 'greenfields_independent':
        // Greenfields gets permanent -5% food prices
        updates = {
          ...updates,
          // This would be tracked in station metadata
        };
        break;
        
      case 'aurum_production_boost':
        // Aurum Fab gets 10% production speed boost
        updates = {
          ...updates,
          // This affects recipe calculations
        };
        break;
        
      case 'drydock_production_boost':
        // Drydock gets 10% production speed boost
        updates = {
          ...updates,
        };
        break;
        
      case 'fuel_prices_reduced':
        // Fuel prices drop -20% at Ceres PP
        updates = {
          ...updates,
        };
        break;
        
      // Add more permanent effects as needed
    }
  }
  
  return updates;
}

/**
 * Calculate mission reward preview for UI
 */
export function getMissionRewardPreview(mission: Mission): {
  credits: number;
  reputation: { stationId: string; change: number; stationName: string }[];
  unlocks: string[];
} {
  const reputationChanges = Object.entries(mission.rewards.reputationChanges).map(
    ([stationId, change]) => ({
      stationId,
      change,
      stationName: formatStationName(stationId),
    })
  );
  
  return {
    credits: mission.rewards.credits,
    reputation: reputationChanges,
    unlocks: mission.rewards.unlocks || [],
  };
}

/**
 * Format station ID to display name
 */
function formatStationName(stationId: string): string {
  const nameMap: Record<string, string> = {
    'sol-city': 'Sol City',
    'sol-refinery': 'Sol Refinery',
    'greenfields': 'Greenfields Farm',
    'aurum-fab': 'Aurum Fab',
    'drydock': 'Drydock',
    'ceres-pp': 'Ceres Power Plant',
    'freeport': 'Freeport',
    'hidden-cove': 'Hidden Cove',
  };
  
  return nameMap[stationId] || stationId;
}

/**
 * Check if player meets mission requirements
 */
export function canAcceptMission(
  mission: Mission,
  playerReputation: Record<string, number>,
  activeMissionsCount: number,
  maxActiveMissions: number = 3
): { canAccept: boolean; reason?: string } {
  // Check active mission limit
  if (activeMissionsCount >= maxActiveMissions) {
    return {
      canAccept: false,
      reason: `You can only have ${maxActiveMissions} active missions at once`,
    };
  }
  
  // Check reputation requirements
  if (mission.requiredRep) {
    for (const [stationId, minRep] of Object.entries(mission.requiredRep)) {
      const currentRep = playerReputation[stationId] || 0;
      if (currentRep < minRep) {
        return {
          canAccept: false,
          reason: `Requires ${minRep} reputation at ${formatStationName(stationId)}`,
        };
      }
    }
  }
  
  return { canAccept: true };
}

/**
 * Get active missions for a specific arc
 */
export function getActiveMissionsByArc(missions: Mission[], arcId: string): Mission[] {
  return missions.filter(m => m.arcId === arcId && m.status === 'active');
}

/**
 * Get mission time remaining (in seconds)
 */
export function getMissionTimeRemaining(mission: Mission, currentTime: number): number | null {
  if (!mission.timeLimit || !mission.acceptedAt) return null;
  
  const elapsed = currentTime - mission.acceptedAt;
  const remaining = mission.timeLimit - elapsed;
  
  return Math.max(0, remaining);
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds === 0) return 'Expired';
  
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  
  return `${secs}s`;
}

