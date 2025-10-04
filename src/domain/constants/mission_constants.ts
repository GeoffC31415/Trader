// Mission arc definitions and templates

import type { MissionTemplate, MissionArc } from '../types/mission_types';

// ============================================================================
// Arc Definitions
// ============================================================================

export const MISSION_ARCS: Record<string, Omit<MissionArc, 'status' | 'currentStage' | 'choicesMade' | 'completedMissions'>> = {
  greenfields_independence: {
    id: 'greenfields_independence',
    name: 'The Greenfields Independence Movement',
    description: 'Sol City bureaucracy threatens agricultural independence. Help Sana Whit break free from corporate control, or side with Mira Vale to maintain order.',
    characters: ['greenfields', 'sol-city'],
    unlockRequirements: {
      reputation: {}, // Available from start
    },
  },
  
  fabrication_wars: {
    id: 'fabrication_wars',
    name: 'The Fabrication Wars',
    description: 'Aurum Fab and Drydock compete for manufacturing supremacy. Choose which station will dominate advanced fabrication.',
    characters: ['aurum-fab', 'drydock'],
    unlockRequirements: {
      reputation: {
        'aurum-fab': 20,
        'drydock': 20,
      },
      upgrades: ['union'], // Requires Union Membership
    },
  },
  
  energy_monopoly: {
    id: 'energy_monopoly',
    name: 'The Energy Monopoly',
    description: 'Ivo Renn at Ceres Power Plant is manipulating fuel prices. Help Rex Calder expose the conspiracy or join the monopoly.',
    characters: ['ceres-pp', 'sol-refinery'],
    unlockRequirements: {
      reputation: {
        'ceres-pp': 30,
      },
      upgrades: ['nav'], // Requires Navigation Array
    },
  },
  
  pirate_accords: {
    id: 'pirate_accords',
    name: 'The Pirate Accords',
    description: 'Hidden Cove pirates clash with Sol City law enforcement. Broker peace, join the pirates, or enforce the law.',
    characters: ['hidden-cove', 'freeport', 'sol-city'],
    unlockRequirements: {
      reputation: {
        // Requires rep 25 at Hidden Cove OR rep 50 at Sol City
      },
    },
  },
  
  union_crisis: {
    id: 'union_crisis',
    name: 'The Union Crisis',
    description: 'Workers across the system threaten to strike. Support Chief Harlan\'s movement or side with corporate efficiency.',
    characters: ['drydock', 'greenfields', 'sol-refinery'],
    unlockRequirements: {
      upgrades: ['union'], // Requires Union Membership
      // Requires completion of 2 other arcs (checked at runtime)
    },
  },
};

// ============================================================================
// Mission Templates - Stage 1
// ============================================================================

export const MISSION_TEMPLATES: Record<string, MissionTemplate> = {
  
  // ---------------------------------------------------------------------------
  // Arc 1: Greenfields Independence - Stage 1
  // ---------------------------------------------------------------------------
  
  greenfields_stage_1: {
    id: 'greenfields_stage_1',
    arcId: 'greenfields_independence',
    title: 'Breaking the Chain',
    description: 'Sana Whit needs luxury goods delivered to Greenfields without Sol City knowing. Avoid flying near Sol City while carrying contraband luxury goods, or they will be confiscated.',
    type: 'delivery',
    stage: 1,
    objectiveTemplates: [
      {
        id: 'deliver_luxury',
        type: 'deliver',
        description: 'Deliver 10 Luxury Goods to Greenfields',
        target: 'luxury_goods', // commodity ID
        targetStation: 'greenfields', // destination station
        quantity: 10,
      },
      {
        id: 'avoid_sol_city',
        type: 'avoid_detection',
        description: 'Don\'t get caught near Sol City with contraband',
        target: 'sol-city',
        optional: false,
      },
    ],
    rewards: {
      credits: 2000,
      reputationChanges: {
        greenfields: 10,
        'sol-city': -5,
      },
    },
    requiredRep: {
      greenfields: 0,
    },
    availableAt: ['greenfields'],
  },
  
  // ---------------------------------------------------------------------------
  // Arc 2: Fabrication Wars - Stage 1
  // ---------------------------------------------------------------------------
  
  fabrication_wars_aurum_stage_1: {
    id: 'fabrication_wars_aurum_stage_1',
    arcId: 'fabrication_wars',
    title: 'Patent Wars - Aurum Path',
    description: 'Dr. Elin Kade wants you to steal fabrication schematics from Drydock. Infiltrate their database and return with the alloy formula.',
    type: 'stealth',
    stage: 1,
    objectiveTemplates: [
      {
        id: 'dock_drydock',
        type: 'visit',
        description: 'Dock at Drydock',
        target: 'drydock',
        quantity: 1,
      },
      {
        id: 'steal_data',
        type: 'wait',
        description: 'Wait 30 seconds to download data',
        quantity: 30,
      },
      {
        id: 'return_aurum',
        type: 'deliver',
        description: 'Return data to Aurum Fab',
        target: 'data_chip', // special mission item
        targetStation: 'aurum-fab',
        quantity: 1,
      },
    ],
    rewards: {
      credits: 4000,
      reputationChanges: {
        'aurum-fab': 15,
        'drydock': -15,
      },
      permanentEffects: ['aurum_production_boost'],
    },
    requiredRep: {
      'aurum-fab': 20,
    },
    availableAt: ['aurum-fab'],
  },
  
  fabrication_wars_drydock_stage_1: {
    id: 'fabrication_wars_drydock_stage_1',
    arcId: 'fabrication_wars',
    title: 'Patent Wars - Drydock Path',
    description: 'Chief Harlan wants you to plant false schematics at Aurum Fab to throw off their research. Deliver the fake data.',
    type: 'delivery',
    stage: 1,
    objectiveTemplates: [
      {
        id: 'pick_up_fake_data',
        type: 'visit',
        description: 'Pick up fake schematics from Drydock',
        target: 'drydock',
        quantity: 1,
      },
      {
        id: 'deliver_fake_data',
        type: 'deliver',
        description: 'Deliver fake schematics to Aurum Fab',
        target: 'fake_data_chip',
        targetStation: 'aurum-fab',
        quantity: 1,
      },
    ],
    rewards: {
      credits: 4000,
      reputationChanges: {
        'drydock': 15,
        'aurum-fab': -15,
      },
      permanentEffects: ['drydock_production_boost'],
    },
    requiredRep: {
      'drydock': 20,
    },
    availableAt: ['drydock'],
  },
  
  // ---------------------------------------------------------------------------
  // Arc 2: Fabrication Wars - Stage 3 (Combat Test)
  // ---------------------------------------------------------------------------
  
  fabrication_wars_stage_3: {
    id: 'fabrication_wars_stage_3',
    arcId: 'fabrication_wars',
    title: 'Sabotage the Supply Line',
    description: 'Destroy 5 NPC traders carrying electronics or alloys to disrupt the enemy\'s fabrication supply chain. Must destroy within 10 minutes.',
    type: 'combat',
    stage: 3,
    objectiveTemplates: [
      {
        id: 'destroy_traders',
        type: 'destroy',
        description: 'Destroy 5 supply traders',
        quantity: 5,
      },
    ],
    rewards: {
      credits: 7000,
      reputationChanges: {
        'aurum-fab': 25, // Rewards whoever you chose in stage 1
        'drydock': -30,
      },
    },
    requiredRep: {
      'aurum-fab': 40,
    },
    availableAt: ['aurum-fab'],
    timeLimit: 600, // 10 minutes
    prerequisiteMissions: ['fabrication_wars_aurum_stage_1'],
  },
  
  // ---------------------------------------------------------------------------
  // Arc 3: Energy Monopoly - Stage 1
  // ---------------------------------------------------------------------------
  
  energy_monopoly_stage_1: {
    id: 'energy_monopoly_stage_1',
    arcId: 'energy_monopoly',
    title: 'The Audit Trail',
    description: 'Rex Calder suspects Ivo Renn is manipulating fuel prices. Install a monitoring device at Ceres Power Plant without being detected.',
    type: 'stealth',
    stage: 1,
    objectiveTemplates: [
      {
        id: 'dock_ceres',
        type: 'visit',
        description: 'Dock at Ceres Power Plant',
        target: 'ceres-pp',
        quantity: 1,
      },
      {
        id: 'install_device',
        type: 'wait',
        description: 'Wait 30 seconds to install device undetected',
        quantity: 30,
      },
      {
        id: 'return_refinery',
        type: 'visit',
        description: 'Return to Sol Refinery',
        target: 'sol-refinery',
        quantity: 1,
      },
    ],
    rewards: {
      credits: 5000,
      reputationChanges: {
        'sol-refinery': 15,
      },
      unlocks: ['energy_monopoly_stage_2'],
    },
    requiredRep: {
      'sol-refinery': 30,
    },
    availableAt: ['sol-refinery'],
  },
  
  // ---------------------------------------------------------------------------
  // Arc 4: Pirate Accords - Stage 1
  // ---------------------------------------------------------------------------
  
  pirate_accords_stage_1: {
    id: 'pirate_accords_stage_1',
    arcId: 'pirate_accords',
    title: 'Diplomatic Pouch',
    description: 'Kalla Rook wants you to deliver a peace proposal to Hidden Cove. There\'s a 30% chance of pirate ambush en route.',
    type: 'delivery',
    stage: 1,
    objectiveTemplates: [
      {
        id: 'pick_up_proposal',
        type: 'visit',
        description: 'Pick up peace proposal from Freeport',
        target: 'freeport',
        quantity: 1,
      },
      {
        id: 'deliver_proposal',
        type: 'deliver',
        description: 'Deliver proposal to Hidden Cove',
        target: 'diplomatic_pouch',
        targetStation: 'hidden-cove',
        quantity: 1,
      },
    ],
    rewards: {
      credits: 3000,
      reputationChanges: {
        'freeport': 10,
        'hidden-cove': 10,
      },
      unlocks: ['pirate_accords_stage_2'],
    },
    requiredRep: {
      'freeport': 15,
    },
    availableAt: ['freeport'],
  },
  
  // ---------------------------------------------------------------------------
  // Arc 5: Union Crisis - Stage 1
  // ---------------------------------------------------------------------------
  
  union_crisis_stage_1: {
    id: 'union_crisis_stage_1',
    arcId: 'union_crisis',
    title: 'Organize the Stations',
    description: 'Chief Harlan needs you to rally support for the union. Visit 5 stations and deliver union pamphlets within 15 minutes.',
    type: 'collection',
    stage: 1,
    objectiveTemplates: [
      {
        id: 'deliver_pamphlets_1',
        type: 'deliver',
        description: 'Deliver pamphlets to Greenfields',
        target: 'union_pamphlet',
        targetStation: 'greenfields',
        quantity: 1,
      },
      {
        id: 'deliver_pamphlets_2',
        type: 'deliver',
        description: 'Deliver pamphlets to Sol Refinery',
        target: 'union_pamphlet',
        targetStation: 'sol-refinery',
        quantity: 1,
      },
      {
        id: 'deliver_pamphlets_3',
        type: 'deliver',
        description: 'Deliver pamphlets to Freeport',
        target: 'union_pamphlet',
        targetStation: 'freeport',
        quantity: 1,
      },
      {
        id: 'deliver_pamphlets_4',
        type: 'deliver',
        description: 'Deliver pamphlets to Hidden Cove',
        target: 'union_pamphlet',
        targetStation: 'hidden-cove',
        quantity: 1,
      },
      {
        id: 'deliver_pamphlets_5',
        type: 'deliver',
        description: 'Deliver pamphlets to Ceres Power Plant',
        target: 'union_pamphlet',
        targetStation: 'ceres-pp',
        quantity: 1,
      },
    ],
    rewards: {
      credits: 5000,
      reputationChanges: {
        'greenfields': 15,
        'drydock': 15,
        'sol-refinery': 15,
        'freeport': 15,
      },
      unlocks: ['union_crisis_stage_2'],
    },
    requiredRep: {
      'drydock': 40,
    },
    availableAt: ['drydock'],
    timeLimit: 900, // 15 minutes
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getArcById(arcId: string): Omit<MissionArc, 'status' | 'currentStage' | 'choicesMade' | 'completedMissions'> | undefined {
  return MISSION_ARCS[arcId];
}

export function getMissionTemplateById(missionId: string): MissionTemplate | undefined {
  return MISSION_TEMPLATES[missionId];
}

export function getMissionTemplatesByArc(arcId: string): MissionTemplate[] {
  return Object.values(MISSION_TEMPLATES).filter(template => template.arcId === arcId);
}

export function getMissionTemplatesByStage(arcId: string, stage: number): MissionTemplate[] {
  return Object.values(MISSION_TEMPLATES).filter(
    template => template.arcId === arcId && template.stage === stage
  );
}

