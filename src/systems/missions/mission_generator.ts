// Mission generation from templates

import type { Mission, MissionTemplate, MissionArc } from '../../domain/types/mission_types';
import type { Station } from '../../domain/types/world_types';
import { MISSION_TEMPLATES, MISSION_ARCS } from '../../domain/constants/mission_constants';

/**
 * Generate available missions for a station based on player reputation and arc progress
 */
export function generateMissionsForStation(
  stationId: string,
  playerReputation: Record<string, number>,
  playerUpgrades: string[],
  missionArcs: MissionArc[],
  activeMissions: Mission[],
  completedArcIds: string[]
): Mission[] {
  const availableMissions: Mission[] = [];
  
  // Check each mission template
  for (const template of Object.values(MISSION_TEMPLATES)) {
    // Skip if mission isn't available at this station
    if (!template.availableAt.includes(stationId)) {
      continue;
    }
    
    // Check if arc is unlocked
    const arc = missionArcs.find(a => a.id === template.arcId);
    if (!arc || arc.status === 'locked') {
      continue;
    }
    
    // Check if arc is completed
    if (arc.status === 'completed') {
      continue;
    }
    
    // Check if mission stage matches current arc stage
    if (template.stage !== arc.currentStage) {
      continue;
    }
    
    // Check if mission is already active or completed
    const isActive = activeMissions.some(m => m.id === template.id);
    const isCompleted = arc.completedMissions.includes(template.id);
    if (isActive || isCompleted) {
      continue;
    }
    
    // Check reputation requirements
    if (template.requiredRep) {
      const meetsRepRequirements = Object.entries(template.requiredRep).every(
        ([stId, minRep]) => (playerReputation[stId] || 0) >= minRep
      );
      if (!meetsRepRequirements) {
        continue;
      }
    }
    
    // Check prerequisite missions
    if (template.prerequisiteMissions) {
      const hasPrerequisites = template.prerequisiteMissions.every(
        prereqId => arc.completedMissions.includes(prereqId)
      );
      if (!hasPrerequisites) {
        continue;
      }
    }
    
    // Generate mission from template
    const mission = createMissionFromTemplate(template);
    availableMissions.push(mission);
  }
  
  return availableMissions;
}

/**
 * Create a mission instance from a template
 */
export function createMissionFromTemplate(template: MissionTemplate): Mission {
  return {
    id: template.id,
    arcId: template.arcId,
    title: template.title,
    description: template.description,
    type: template.type,
    stage: template.stage,
    objectives: template.objectiveTemplates.map(objTemplate => ({
      ...objTemplate,
      current: 0,
      completed: false,
    })),
    rewards: template.rewards,
    requiredRep: template.requiredRep,
    availableAt: template.availableAt,
    timeLimit: template.timeLimit,
    status: 'offered',
    choiceOptions: template.choiceOptions,
  };
}

/**
 * Check if an arc should be unlocked based on player state
 */
export function checkArcUnlock(
  arcId: string,
  playerReputation: Record<string, number>,
  playerUpgrades: string[],
  completedArcCount: number
): boolean {
  const arcDefinition = MISSION_ARCS[arcId];
  if (!arcDefinition) return false;
  
  const requirements = arcDefinition.unlockRequirements;
  if (!requirements) return true;
  
  // Check reputation requirements
  if (requirements.reputation) {
    const meetsRepRequirements = Object.entries(requirements.reputation).every(
      ([stationId, minRep]) => (playerReputation[stationId] || 0) >= minRep
    );
    if (!meetsRepRequirements) return false;
  }
  
  // Check upgrade requirements
  if (requirements.upgrades) {
    const hasAllUpgrades = requirements.upgrades.every(upgrade => 
      playerUpgrades.includes(upgrade)
    );
    if (!hasAllUpgrades) return false;
  }
  
  // Check completed arc requirements (for Union Crisis)
  if (requirements.completedArcs) {
    if (completedArcCount < requirements.completedArcs.length) {
      return false;
    }
  }
  
  // Special check for Pirate Accords (requires rep 25 at Hidden Cove OR rep 50 at Sol City)
  if (arcId === 'pirate_accords') {
    const hiddenCoveRep = playerReputation['hidden-cove'] || 0;
    const solCityRep = playerReputation['sol-city'] || 0;
    return hiddenCoveRep >= 25 || solCityRep >= 50;
  }
  
  return true;
}

/**
 * Initialize mission arcs for a new game
 */
export function initializeMissionArcs(): MissionArc[] {
  return Object.values(MISSION_ARCS).map(arcDef => ({
    ...arcDef,
    status: arcDef.id === 'greenfields_independence' ? 'available' : 'locked',
    currentStage: 1,
    choicesMade: {},
    completedMissions: [],
  }));
}

/**
 * Update arc statuses based on player state
 */
export function updateArcStatuses(
  arcs: MissionArc[],
  playerReputation: Record<string, number>,
  playerUpgrades: string[]
): MissionArc[] {
  const completedArcCount = arcs.filter(arc => arc.status === 'completed').length;
  
  return arcs.map(arc => {
    // Skip if already completed
    if (arc.status === 'completed') {
      return arc;
    }
    
    // Check if should be unlocked
    const shouldUnlock = checkArcUnlock(
      arc.id,
      playerReputation,
      playerUpgrades,
      completedArcCount
    );
    
    if (shouldUnlock && arc.status === 'locked') {
      return { ...arc, status: 'available' };
    }
    
    return arc;
  });
}

