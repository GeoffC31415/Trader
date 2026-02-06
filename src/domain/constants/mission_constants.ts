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
        'sol-refinery': 30,
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
      completedArcs: ['any_arc_1', 'any_arc_2'], // Requires completion of 2 other arcs (checked at runtime)
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
  // Arc 1: Greenfields Independence - Stage 2 (CHOICE MISSION)
  // ---------------------------------------------------------------------------
  
  greenfields_stage_2: {
    id: 'greenfields_stage_2',
    arcId: 'greenfields_independence',
    title: 'The Census',
    description: 'Sol City and Greenfields both need you to investigate inspection logs. This is a critical decision that will determine the future of Greenfields Farm.',
    type: 'choice',
    stage: 2,
    objectiveTemplates: [],
    rewards: {
      credits: 0, // Rewards come from choice
      reputationChanges: {},
    },
    requiredRep: {
      greenfields: 10,
    },
    availableAt: ['greenfields', 'sol-city'],
    prerequisiteMissions: ['greenfields_stage_1'],
    choiceOptions: [
      {
        id: 'side_greenfields',
        label: 'Side with Greenfields',
        description: 'Steal data chips from Sol City and deliver them to Sana Whit at Greenfields. Help expose Sol City\'s overreach.',
        consequences: [
          'Sol City raises prices for Greenfields goods by 15%',
          'Greenfields gains independence from Sol City regulations',
          'Future missions support agricultural autonomy',
        ],
        rewards: {
          credits: 3000,
          reputationChanges: {
            'greenfields': 15,
            'sol-city': -10,
          },
          permanentEffects: ['sol_city_price_increase_greenfields'],
          unlocks: ['greenfields_stage_3'],
        },
      },
      {
        id: 'side_sol_city',
        label: 'Side with Sol City',
        description: 'Report Greenfields\' unregistered grow operations to Mira Vale at Sol City. Maintain order and stability.',
        consequences: [
          'Greenfields stock drops by 30% temporarily (2 minutes)',
          'Sol City strengthens control over food supply',
          'Future missions support central authority',
        ],
        rewards: {
          credits: 3000,
          reputationChanges: {
            'sol-city': 15,
            'greenfields': -10,
          },
          permanentEffects: ['greenfields_stock_drop'],
          unlocks: ['sol_city_stage_3'],
        },
      },
    ],
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
        type: 'visit',
        description: 'Return to Aurum Fab',
        target: 'aurum-fab',
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
        type: 'visit',
        description: 'Deliver fake schematics to Aurum Fab',
        quantity: 1,
        target: 'aurum-fab',
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
        type: 'visit',
        description: 'Deliver proposal to Hidden Cove',
        quantity: 1,
        target: 'hidden-cove',
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
  // Arc 4: Pirate Accords - Stage 2 (THREE-WAY CHOICE MISSION)
  // ---------------------------------------------------------------------------
  
  pirate_accords_stage_2: {
    id: 'pirate_accords_stage_2',
    arcId: 'pirate_accords',
    title: 'Choose Your Side',
    description: 'The conflict between Hidden Cove, Sol City, and Freeport has reached a critical point. You must choose which path to take: join the pirates, enforce the law, or broker peace.',
    type: 'choice',
    stage: 2,
    objectiveTemplates: [],
    rewards: {
      credits: 0, // Rewards come from choice
      reputationChanges: {},
    },
    requiredRep: {
      'freeport': 15,
    },
    availableAt: ['hidden-cove', 'sol-city', 'freeport'],
    prerequisiteMissions: ['pirate_accords_stage_1'],
    choiceOptions: [
      {
        id: 'join_pirates',
        label: 'Join the Pirates (Hidden Cove)',
        description: 'Raid 4 Sol City convoys and deliver stolen goods to Hidden Cove. Fight for freedom from government control.',
        consequences: [
          'Sol City marks you as hostile (combat on sight)',
          'Access to black market trading',
          'Pirate-aligned missions unlock',
          'Cannot dock at Sol City or Sol Refinery',
        ],
        rewards: {
          credits: 10000,
          reputationChanges: {
            'hidden-cove': 35,
            'sol-city': -40,
            'sol-refinery': -20,
          },
          permanentEffects: ['sol_city_hostile', 'black_market_access'],
          unlocks: ['pirate_accords_stage_3_pirate'],
        },
        nextMissionId: 'pirate_accords_stage_3_pirate',
      },
      {
        id: 'enforce_law',
        label: 'Enforce the Law (Sol City)',
        description: 'Destroy 6 pirate ships near Hidden Cove. Help Sol City restore order and eliminate the pirate threat.',
        consequences: [
          'Hidden Cove closes permanently (becomes hostile)',
          'Bounty hunting missions unlock',
          'Law enforcement bonuses at Sol City',
          'Pirate attacks increase 50%',
        ],
        rewards: {
          credits: 10000,
          reputationChanges: {
            'sol-city': 40,
            'sol-refinery': 20,
            'hidden-cove': -50,
          },
          permanentEffects: ['hidden_cove_hostile', 'bounty_hunting_unlocked', 'pirate_attacks_increase'],
          unlocks: ['pirate_accords_stage_3_law'],
        },
        nextMissionId: 'pirate_accords_stage_3_law',
      },
      {
        id: 'broker_peace',
        label: 'Broker Peace (Freeport)',
        description: 'Deliver reparations fund (20 luxury goods + 20 electronics + 20 pharmaceuticals) to establish peace between all factions.',
        consequences: [
          'Peace agreement holds between factions',
          'Pirate attacks decrease 50%',
          'Gain reputation with all three stations',
          'Neutral path maintains all access',
        ],
        rewards: {
          credits: 8000,
          reputationChanges: {
            'freeport': 30,
            'sol-city': 30,
            'hidden-cove': 30,
          },
          permanentEffects: ['pirate_attacks_decrease'],
          unlocks: ['pirate_accords_stage_3_peace'],
        },
        nextMissionId: 'pirate_accords_stage_3_peace',
      },
    ],
  },
  
  // ---------------------------------------------------------------------------
  // Arc 1: Greenfields Independence - Stage 3 (Path-specific combat)
  // ---------------------------------------------------------------------------
  
  greenfields_stage_3: {
    id: 'greenfields_stage_3',
    arcId: 'greenfields_independence',
    title: 'Supply Cut',
    description: 'The harvest season is here, and Sana Whit needs your help to send Sol City a message they can\'t ignore. Sol City has been intercepting Greenfields shipments under the guise of "quality inspections." Three grain convoys are en route to Sol City right now—ships captained by corporate loyalists who sold out their farmer roots for Sol City security contracts.\n\nSana\'s voice is heavy with regret: "I grew up with these pilots. Shared meals. Shared dreams of independence. But they chose the comfortable lie over the hard truth." She pauses, staring at the starfield through the viewport. "Destroy those convoys. Let Sol City feel what scarcity means. Maybe then they\'ll negotiate in good faith."\n\nThis is economic warfare. The kind that echoes through ledgers and stomachs. Are you ready to cross this line?',
    type: 'combat',
    stage: 3,
    objectiveTemplates: [
      {
        id: 'destroy_sol_convoys',
        type: 'destroy',
        description: 'Destroy 3 grain convoys heading to Sol City',
        quantity: 3,
        target: 'sol_grain_convoy',
      },
    ],
    rewards: {
      credits: 5000,
      reputationChanges: {
        'greenfields': 20,
        'sol-city': -20,
      },
      permanentEffects: ['sol_city_grain_spike'],
      unlocks: ['greenfields_stage_4'],
    },
    requiredRep: {
      'greenfields': 25,
    },
    availableAt: ['greenfields'],
    prerequisiteMissions: ['greenfields_stage_2'],
  },
  
  sol_city_stage_3: {
    id: 'sol_city_stage_3',
    arcId: 'greenfields_independence',
    title: 'Agricultural Compliance Escort',
    description: 'Mira Vale\'s expression is all business, but there\'s tension in her shoulders. "We have evidence of agricultural violations at Greenfields—unregistered grow operations, unauthorized seed modifications, undocumented fertilizer compounds. This isn\'t about control; it\'s about safety. One contaminated crop could sicken thousands."\n\nShe taps a data slate, and a flight plan appears. "Inspector Chavez needs safe passage to Greenfields. Our intelligence suggests Sana Whit has hired... outside agitators. Pirates from Hidden Cove, most likely, to prevent this inspection from happening."\n\nThe inspector is an older woman with tired eyes and a well-worn inspection kit. She nods at you grimly. "I\'ve been doing this for twenty-three years. Never needed an armed escort before." She sighs. "Regulations exist for a reason. Even if people hate you for enforcing them."\n\nWaves of pirate interceptors will try to stop you. Protect Inspector Chavez at all costs.',
    type: 'escort',
    stage: 3,
    objectiveTemplates: [
      {
        id: 'escort_inspector',
        type: 'escort',
        description: 'Escort Inspector Chavez to Greenfields safely',
        target: 'inspector_chavez',
        targetStation: 'greenfields',
        quantity: 1,
      },
      {
        id: 'defend_waves',
        type: 'defend',
        description: 'Defend against pirate ambush waves',
        quantity: 3,
      },
    ],
    rewards: {
      credits: 5000,
      reputationChanges: {
        'sol-city': 20,
        'greenfields': -20,
      },
      permanentEffects: ['greenfields_fabrication_lockdown'],
      unlocks: ['sol_city_stage_4'],
    },
    requiredRep: {
      'sol-city': 25,
    },
    availableAt: ['sol-city'],
    prerequisiteMissions: ['greenfields_stage_2'],
  },
  
  // ---------------------------------------------------------------------------
  // Arc 1: Greenfields Independence - Stage 4 (Finale)
  // ---------------------------------------------------------------------------
  
  greenfields_stage_4: {
    id: 'greenfields_stage_4',
    arcId: 'greenfields_independence',
    title: 'New Markets',
    description: 'The farmhouse kitchen at Greenfields smells like fresh bread and revolution. Sana Whit spreads a handwritten contract across the table—the kind with real ink and fingerprints, not sterile holo-signatures.\n\n"Kalla Rook at Freeport has agreed to buy direct," Sana says, her voice thick with emotion. "No Sol City inspectors. No middleman tariffs. No compliance fees that bleed us dry quarter after quarter." She looks up at you with fierce hope. "Thirty units of food goods. Grain and meat—the harvest of free farmers going to free traders."\n\nOutside the viewport, you can see workers loading crates by hand, singing old work songs from Earth that nobody remembers the origins of anymore. This is more than a delivery. It\'s a declaration of independence.\n\n"This is our shot," Sana continues. "Our one chance to prove we can stand on our own. Get this cargo to Freeport, and we rewrite the rules. Fail..." She doesn\'t finish the sentence. She doesn\'t need to.\n\nThe agricultural revolution begins now.',
    type: 'delivery',
    stage: 4,
    objectiveTemplates: [
      {
        id: 'deliver_grain',
        type: 'deliver',
        description: 'Deliver 15 Grain to Freeport',
        target: 'grain',
        targetStation: 'freeport',
        quantity: 15,
      },
      {
        id: 'deliver_meat',
        type: 'deliver',
        description: 'Deliver 15 Meat to Freeport',
        target: 'meat',
        targetStation: 'freeport',
        quantity: 15,
      },
    ],
    rewards: {
      credits: 8000,
      reputationChanges: {
        'greenfields': 30,
        'freeport': 20,
      },
      permanentEffects: ['greenfields_independence', 'greenfields_food_discount'],
      unlocks: ['arc_completion_greenfields_independence'],
    },
    requiredRep: {
      'greenfields': 40,
    },
    availableAt: ['greenfields'],
    prerequisiteMissions: ['greenfields_stage_3'],
  },
  
  sol_city_stage_4: {
    id: 'sol_city_stage_4',
    arcId: 'greenfields_independence',
    title: 'Contract Enforcement',
    description: 'The municipal tower office is all clean lines and soft lighting—designed to make difficult conversations feel civilized. Mira Vale unseals a diplomatic case containing four enforcement contracts, each bearing the seal of Sol System Authority.\n\n"Greenfields violated fourteen regulatory statutes," she says, her tone measured and final. "We have documented evidence of every infraction. This isn\'t punishment—it\'s consequence. Actions have weight in a functioning society."\n\nShe hands you the contracts one by one. "Deliver these to four major stations: Ceres Power Plant, Aurum Fabricator, Drydock, and Freeport. Standard Sol City enforcement terms: Greenfields produce will require inspection certification before trade. Additional tariffs apply to cover regulatory costs."\n\nYou can see the bigger picture forming. This isn\'t about safety anymore—if it ever was. This is about bringing Greenfields to heel. About making an example. About showing the entire system what happens when you challenge Sol City\'s authority.\n\nMira meets your eyes. "Some call this oppression. I call it civilization. The choice you made reflects which matters more to you."\n\nFour stations. Four seals of control. One agricultural station\'s independence crushed under bureaucratic weight.',
    type: 'delivery',
    stage: 4,
    objectiveTemplates: [
      {
        id: 'deliver_contract_1',
        type: 'visit',
        description: 'Deliver contract to Ceres Power Plant',
        quantity: 1,
        target: 'ceres-pp',
      },
      {
        id: 'deliver_contract_2',
        type: 'visit',
        description: 'Deliver contract to Aurum Fabricator',
        quantity: 1,
        target: 'aurum-fab',
      },
      {
        id: 'deliver_contract_3',
        type: 'visit',
        description: 'Deliver contract to Drydock',
        quantity: 1,
        target: 'drydock',
      },
      {
        id: 'deliver_contract_4',
        type: 'visit',
        description: 'Deliver contract to Freeport',
        quantity: 1,
        target: 'freeport',
      },
    ],
    rewards: {
      credits: 8000,
      reputationChanges: {
        'sol-city': 30,
        'ceres-pp': 10,
        'aurum-fab': 10,
      },
      permanentEffects: ['greenfields_controlled', 'sol_city_goods_discount'],
      unlocks: ['arc_completion_sol_city_control'],
    },
    requiredRep: {
      'sol-city': 40,
    },
    availableAt: ['sol-city'],
    prerequisiteMissions: ['sol_city_stage_3'],
  },
  
  // ---------------------------------------------------------------------------
  // Arc 2: Fabrication Wars - Stage 2
  // ---------------------------------------------------------------------------
  
  fabrication_wars_stage_2_aurum: {
    id: 'fabrication_wars_stage_2_aurum',
    arcId: 'fabrication_wars',
    title: 'Raw Materials Rush - Aurum Path',
    description: 'Dr. Kade\'s lab is a cathedral of precision—every tool in its place, every surface gleaming. She doesn\'t look up from the molecular assembly diagram when you enter.\n\n"Economic warfare is the most elegant form of conflict," she says clinically. "No casualties. Just market forces and strategic timing." Finally, she turns to face you. "Drydock\'s production capacity depends on copper ore and silicon. Without these raw materials, their fabrication floor goes cold. Their workers stand idle. Their reputation crumbles."\n\nShe transfers a substantial credit line to your account. "You have eight minutes. Buy out every unit of copper ore and silicon from three stations. Doesn\'t matter what you pay—I\'ll cover the premium. Bring it all to Aurum Fab."\n\nThe implication is clear: whoever controls the raw materials controls the future. And Aurum Fab intends to be that future.\n\n"Time is a resource like any other," Dr. Kade adds, returning to her diagrams. "Don\'t waste mine."',
    type: 'collection',
    stage: 2,
    objectiveTemplates: [
      {
        type: 'deliver',
        id: 'deliver_copper',
        description: 'Deliver 20 copper ore to Aurum Fab',
        target: 'copper_ore',
        targetStation: 'aurum-fab',
        quantity: 20,
      },
      {
        id: 'deliver_silicon',
        type: 'deliver',
        description: 'Deliver 20 silicon to Aurum Fab',
        target: 'silicon',
        targetStation: 'aurum-fab',
        quantity: 20,
      },
    ],
    rewards: {
      credits: 6000,
      reputationChanges: {
        'aurum-fab': 20,
        'drydock': -20,
      },
      permanentEffects: ['drydock_fabrication_disabled_temp'],
      unlocks: ['fabrication_wars_stage_3_aurum'],
    },
    requiredRep: {
      'aurum-fab': 30,
    },
    availableAt: ['aurum-fab'],
    timeLimit: 480, // 8 minutes
    prerequisiteMissions: ['fabrication_wars_aurum_stage_1'],
  },
  
  fabrication_wars_stage_2_drydock: {
    id: 'fabrication_wars_stage_2_drydock',
    arcId: 'fabrication_wars',
    title: 'Raw Materials Rush - Drydock Path',
    description: 'Chief Harlan\'s office is all practical clutter—tools, schematics, coffee mugs that haven\'t been washed in days. He\'s reviewing a supply manifest when you arrive, and his expression is grim.\n\n"Kade\'s playing cutthroat," he growls. "Word on the wire is she\'s planning to corner the raw materials market. Starve us out like we\'re some backwater operation that can\'t compete." He tosses the manifest aside. "Well, we\'re not rolling over."\n\nHe inputs a priority requisition code into your ship\'s system. "Eight minutes. Hit three stations—buy every scrap of copper ore and silicon you can find. Pay whatever it takes. Bring it here."\n\nYou can see the frustration in his weathered face. This isn\'t how he wanted to compete—in market manipulation games instead of quality craftsmanship. But corporate players made the rules, and now everyone has to play by them.\n\n"Workers built this system," Harlan says quietly. "And we\'ll be damned if we let some antiseptic lab rat price us out of it. Move."',
    type: 'collection',
    stage: 2,
    objectiveTemplates: [
      {
        type: 'deliver',
        id: 'deliver_copper',
        description: 'Deliver 20 copper ore to Drydock',
        target: 'copper_ore',
        targetStation: 'drydock',
        quantity: 20,
      },
      {
        id: 'deliver_silicon',
        type: 'deliver',
        description: 'Deliver 20 silicon to Drydock',
        target: 'silicon',
        targetStation: 'drydock',
        quantity: 20,
      },
    ],
    rewards: {
      credits: 6000,
      reputationChanges: {
        'drydock': 20,
        'aurum-fab': -20,
      },
      permanentEffects: ['aurum_fabrication_disabled_temp'],
      unlocks: ['fabrication_wars_stage_3_drydock'],
    },
    requiredRep: {
      'drydock': 30,
    },
    availableAt: ['drydock'],
    timeLimit: 480, // 8 minutes
    prerequisiteMissions: ['fabrication_wars_drydock_stage_1'],
  },
  
  // ---------------------------------------------------------------------------
  // Arc 2: Fabrication Wars - Stage 3 (Combat)
  // ---------------------------------------------------------------------------
  
  fabrication_wars_stage_3_aurum: {
    id: 'fabrication_wars_stage_3_aurum',
    arcId: 'fabrication_wars',
    title: 'Sabotage the Supply Line - Aurum Path',
    description: 'Dr. Kade is uncharacteristically animated—well, as animated as she gets. Her fingers dance across holographic supply chain visualizations, highlighting five critical shipments.\n\n"Drydock has secured emergency suppliers," she explains with clinical precision. "Five independent traders are currently carrying electronics and alloys to their fabrication floor. If these shipments arrive, they recover. If they don\'t..." A thin smile crosses her face. "Market dominance has a certain... geometric elegance."\n\nShe brings up dossiers on each trader. They\'re not corporate loyalists or soldiers—just independent haulers taking high-paying contracts. People trying to make a living in a system where giants play chess with their livelihoods as pieces.\n\n"I\'m not asking you to enjoy this," Dr. Kade says, sensing your hesitation. "I\'m asking you to understand necessity. In three years, Aurum Fab will employ twice as many people as Drydock currently does. Efficiency creates abundance. Sentiment creates stagnation."\n\nShe transfers targeting data to your weapon systems. "Ten minutes. Five targets. Choose the future."\n\nYour weapons are hot. The clock is ticking.',
    type: 'combat',
    stage: 3,
    objectiveTemplates: [
      {
        id: 'destroy_drydock_supply',
        type: 'destroy',
        description: 'Destroy 5 supply traders heading to Drydock',
        quantity: 5,
        target: 'drydock_supply_convoy',
      },
    ],
    rewards: {
      credits: 7000,
      reputationChanges: {
        'aurum-fab': 25,
        'drydock': -30,
      },
      permanentEffects: ['drydock_fabrication_price_increase'],
      unlocks: ['fabrication_wars_stage_4_aurum'],
    },
    requiredRep: {
      'aurum-fab': 40,
    },
    availableAt: ['aurum-fab'],
    timeLimit: 600, // 10 minutes
    prerequisiteMissions: ['fabrication_wars_stage_2_aurum'],
  },
  
  fabrication_wars_stage_3_drydock: {
    id: 'fabrication_wars_stage_3_drydock',
    arcId: 'fabrication_wars',
    title: 'Sabotage the Supply Line - Drydock Path',
    description: 'The Drydock fabrication floor is quieter than usual—shifts are running light, and you can feel the anxiety in the air. Chief Harlan is in the middle of the floor, talking to workers, keeping morale up. When he sees you, he waves you into a side office.\n\n"Five shipments," he says without preamble, pulling up intercept vectors. "Aurum Fab is bringing in electronics and alloys from outside suppliers. If those shipments land, Kade locks up the market for months. Maybe years."\n\nHe leans against the wall, arms crossed. His voice drops lower. "I\'m asking you to do something I never thought I\'d ask. Hit those convoys. Stop those shipments. I know..." He trails off, jaw tight. "I know those are probably decent people just trying to earn. But if we don\'t stop them, three hundred workers here lose their jobs."\n\nThe moral calculus of survival. Five ships versus three hundred livelihoods. There\'s no clean answer.\n\n"I\'ve already tried every other option," Harlan continues, and you can hear the exhaustion in his voice. "Legal challenges. Price matching. Union negotiations. Kade\'s playing a different game—one where workers are expenses to optimize away." He meets your eyes. "Ten minutes. Stop those ships. Save these jobs."',
    type: 'combat',
    stage: 3,
    objectiveTemplates: [
      {
        id: 'destroy_aurum_supply',
        type: 'destroy',
        description: 'Destroy 5 supply traders heading to Aurum Fab',
        quantity: 5,
        target: 'aurum_supply_convoy',
      },
    ],
    rewards: {
      credits: 7000,
      reputationChanges: {
        'drydock': 25,
        'aurum-fab': -30,
      },
      permanentEffects: ['aurum_fabrication_price_increase'],
      unlocks: ['fabrication_wars_stage_4_drydock'],
    },
    requiredRep: {
      'drydock': 40,
    },
    availableAt: ['drydock'],
    timeLimit: 600, // 10 minutes
    prerequisiteMissions: ['fabrication_wars_stage_2_drydock'],
  },
  
  // ---------------------------------------------------------------------------
  // Arc 2: Fabrication Wars - Stage 4 (Finale)
  // ---------------------------------------------------------------------------
  
  fabrication_wars_stage_4_aurum: {
    id: 'fabrication_wars_stage_4_aurum',
    arcId: 'fabrication_wars',
    title: 'The Exclusive Contract - Aurum Path',
    description: 'Dr. Kade stands before a wall-sized holographic display showing Ceres Power Plant\'s fabrication requirements. The complexity is staggering—fifty units of mixed fabricated goods, each requiring precise specifications and tight delivery windows.\n\n"Ivo Renn at Ceres has announced an exclusive supplier contract," she explains, her voice carrying a rare note of intensity. "Whoever fulfills this order first becomes their sole advanced fabrication partner. It\'s a five-year deal worth more than most stations see in a decade."\n\nShe turns to you, and for the first time, you see something beyond clinical detachment in her eyes. "This is the endgame. Not just for Aurum Fab, but for the entire fabrication philosophy we represent. Centralized production. Standardized processes. Maximum efficiency. If we win this contract, we validate that model for the entire system."\n\nThe production floor below is running at maximum capacity, workers and automated systems moving in orchestrated precision. "Drydock will be attempting the same delivery," Dr. Kade continues. "Their approach is... artisanal. Handcrafted. Inefficient." A pause. "Noble, perhaps. But nobility doesn\'t power a civilization."\n\nShe transfers the cargo manifest to your system. "Fifty units. Mixed fabricated goods. First ship to dock at Ceres with the complete order wins everything. Second place..." She doesn\'t finish. She doesn\'t need to.\n\nThe future of manufacturing rides on your cargo hold.',
    type: 'delivery',
    stage: 4,
    objectiveTemplates: [
      {
        id: 'deliver_machinery',
        type: 'deliver',
        description: 'Deliver 20 machinery to Ceres Power Plant',
        target: 'machinery',
        targetStation: 'ceres-pp',
        quantity: 20,
      },
      {
        id: 'deliver_microchips',
        type: 'deliver',
        description: 'Deliver 15 microchips to Ceres Power Plant',
        target: 'microchips',
        targetStation: 'ceres-pp',
        quantity: 15,
      },
      {
        id: 'deliver_batteries',
        type: 'deliver',
        description: 'Deliver 15 batteries to Ceres Power Plant',
        target: 'batteries',
        targetStation: 'ceres-pp',
        quantity: 15,
      },
    ],
    rewards: {
      credits: 12000,
      reputationChanges: {
        'aurum-fab': 40,
        'ceres-pp': 30,
      },
      permanentEffects: ['aurum_exclusive_supplier', 'aurum_fabrication_discount'],
      unlocks: ['arc_completion_fabrication_wars_aurum'],
    },
    requiredRep: {
      'aurum-fab': 50,
    },
    availableAt: ['aurum-fab'],
    prerequisiteMissions: ['fabrication_wars_stage_3_aurum'],
  },
  
  fabrication_wars_stage_4_drydock: {
    id: 'fabrication_wars_stage_4_drydock',
    arcId: 'fabrication_wars',
    title: 'The Exclusive Contract - Drydock Path',
    description: 'The Drydock floor is a controlled storm of activity. Every worker is focused, every machine running hot. Chief Harlan stands at the center, coordinating the operation like a conductor leading an orchestra through its most challenging piece.\n\n"Ivo Renn wants fifty units of mixed fabricated goods," he tells you, voice raised over the industrial symphony. "Exclusive contract. Five years. Whoever delivers first becomes Ceres\' sole supplier." He pauses, wiping sweat from his forehead. "No pressure, right?"\n\nBut you can see the pressure in every set of shoulders on the floor. This is everything. Not just for the station, but for the principle it represents—that human craftsmanship still matters. That workers who take pride in their output can compete with automated precision.\n\n"Aurum\'s going for the same contract," Harlan continues. "They\'ve got the efficiency. The automation. The cold, perfect consistency." He gestures to the workers around you. "What we\'ve got is people. People who give a damn about quality over quantity. Who know that something made with care carries weight that algorithms can\'t measure."\n\nA young fabricator approaches with a completed alloy component, holding it up to the light to check the finish. Harlan nods approval, and the fabricator grins before hustling back to the line.\n\n"Fifty units," Harlan says, loading the cargo into your hold personally. "Every one checked by hand. Every one bearing the mark of human excellence." He seals the cargo bay door and grips your shoulder. "Get these to Ceres. Show the system that we still matter. That we can still win. That workers can still compete."\n\nThe race is on. Efficiency versus excellence. Algorithm versus artisan. The future is waiting.',
    type: 'delivery',
    stage: 4,
    objectiveTemplates: [
      {
        id: 'deliver_machinery',
        type: 'deliver',
        description: 'Deliver 20 machinery to Ceres Power Plant',
        target: 'machinery',
        targetStation: 'ceres-pp',
        quantity: 20,
      },
      {
        id: 'deliver_microchips',
        type: 'deliver',
        description: 'Deliver 15 microchips to Ceres Power Plant',
        target: 'microchips',
        targetStation: 'ceres-pp',
        quantity: 15,
      },
      {
        id: 'deliver_batteries',
        type: 'deliver',
        description: 'Deliver 15 batteries to Ceres Power Plant',
        target: 'batteries',
        targetStation: 'ceres-pp',
        quantity: 15,
      },
    ],
    rewards: {
      credits: 12000,
      reputationChanges: {
        'drydock': 40,
        'ceres-pp': 30,
      },
      permanentEffects: ['drydock_exclusive_supplier', 'drydock_fabrication_discount'],
      unlocks: ['arc_completion_fabrication_wars_drydock'],
    },
    requiredRep: {
      'drydock': 50,
    },
    availableAt: ['drydock'],
    prerequisiteMissions: ['fabrication_wars_stage_3_drydock'],
  },
  
  // ---------------------------------------------------------------------------
  // Arc 3: Energy Monopoly - Stage 2 (Choice)
  // ---------------------------------------------------------------------------
  
  energy_monopoly_stage_2: {
    id: 'energy_monopoly_stage_2',
    arcId: 'energy_monopoly',
    title: 'Fuel the Fire',
    description: 'The monitoring device has done its work. The data is undeniable: Ivo Renn has been systematically buying refined fuel from Sol Refinery at market rates, then restricting supply to create artificial scarcity. Prices have climbed forty percent in six months. Stations are rationing. Small traders are going under.\n\nRex Calder\'s hands shake with barely controlled rage as he reviews the evidence. "Proof," he says quietly. "Finally. Renn\'s been bleeding this system dry, and now we have the numbers to prove it."\n\nBut then your comm chimes. It\'s Ivo Renn himself, voice calm and measured. "Before you deliver that data to Rex, perhaps we should talk. What you found is... incomplete. Cherry-picked. I can explain the full context—and compensate you for your discretion."\n\nTwo paths diverge. Expose the truth and let the market correct itself—painful, but fair. Or accept payment to bury evidence of a crime that\'s already happening. The fuel monopoly continues either way. The question is: do you stop it or profit from it?\n\nChoose carefully. This decision will reshape the energy economy of the entire system.',
    type: 'choice',
    stage: 2,
    objectiveTemplates: [],
    rewards: {
      credits: 0,
      reputationChanges: {},
    },
    requiredRep: {
      'sol-refinery': 40,
    },
    availableAt: ['sol-refinery', 'ceres-pp'],
    prerequisiteMissions: ['energy_monopoly_stage_1'],
    choiceOptions: [
      {
        id: 'expose_ceres',
        label: 'Expose Ceres Power Plant (Sol Refinery Path)',
        description: 'Deliver the evidence to three major stations. Let everyone see what Ivo Renn has been doing. Watch fuel prices normalize as market forces reassert themselves.',
        consequences: [
          'Ceres PP fuel prices drop -20% permanently',
          'Ivo Renn loses reputation across system',
          'Sol Refinery gains allies and reputation',
          'Free market restored for fuel trading',
        ],
        rewards: {
          credits: 6000,
          reputationChanges: {
            'sol-refinery': 20,
            'greenfields': 10,
            'freeport': 10,
            'drydock': 10,
            'ceres-pp': -25,
          },
          permanentEffects: ['ceres_fuel_price_drop', 'energy_transparency'],
          unlocks: ['energy_monopoly_stage_3_refinery'],
        },
        nextMissionId: 'energy_monopoly_stage_3_refinery',
      },
      {
        id: 'protect_ceres',
        label: 'Destroy the Evidence (Ceres PP Path)',
        description: 'Accept Ivo Renn\'s payment and delete the evidence before Rex can analyze it. The monopoly continues, but you profit handsomely. The fuel shortage persists.',
        consequences: [
          'Receive substantial payment from Ivo Renn',
          'Fuel shortage continues system-wide',
          'All fuel prices +15% for 10 minutes',
          'Reputation loss at Sol Refinery',
        ],
        rewards: {
          credits: 15000,
          reputationChanges: {
            'ceres-pp': 25,
            'sol-refinery': -25,
          },
          permanentEffects: ['fuel_shortage_continues', 'ceres_monopoly_maintained'],
          unlocks: ['energy_monopoly_stage_3_ceres'],
        },
        nextMissionId: 'energy_monopoly_stage_3_ceres',
      },
    ],
  },
  
  // ---------------------------------------------------------------------------
  // Arc 3: Energy Monopoly - Stage 3 (Combat/Defense)
  // ---------------------------------------------------------------------------
  
  energy_monopoly_stage_3_refinery: {
    id: 'energy_monopoly_stage_3_refinery',
    arcId: 'energy_monopoly',
    title: 'The Blockade - Defend Refinery Convoys',
    description: 'Rex Calder meets you on the refinery deck, and he\'s wearing combat armor. That tells you everything you need to know about how serious this has become.\n\n"Ivo Renn doesn\'t take exposure well," Rex says grimly. "We\'ve received credible intelligence that he\'s hired Hidden Cove pirates to intercept our next three fuel convoys. Not to steal the cargo—to destroy it. Scorched earth retaliation."\n\nThree fuel convoys are preparing for departure. You can see the convoy pilots through the viewport—some young, some veterans, all looking nervous. These aren\'t military vessels. They\'re civilian haulers with families and mortgages and lives that don\'t include combat.\n\n"Four waves of pirate interceptors," Rex continues, pulling up tactical data. "They\'ll hit hard and fast. Professional contractors, not the usual opportunistic raiders. Ivo\'s paying premium rates for guaranteed destruction." He checks his sidearm out of habit. "I\'m going with the convoy myself. Someone needs to be willing to stand in harm\'s way for what\'s right."\n\nHe looks at you straight on. "Protect these convoys. Protect these people. Show Ivo Renn that intimidation and violence won\'t restore his monopoly. The market is free now. Let\'s keep it that way."\n\nYour weapons are hot. The convoys are launching. Four waves of paid killers are inbound.',
    type: 'escort',
    stage: 3,
    objectiveTemplates: [
      {
        id: 'defend_convoy_1',
        type: 'escort',
        description: 'Defend first fuel convoy',
        target: 'refinery_fuel_convoy_1',
        targetStation: 'greenfields',
        quantity: 1,
      },
      {
        id: 'defend_convoy_2',
        type: 'escort',
        description: 'Defend second fuel convoy',
        target: 'refinery_fuel_convoy_2',
        targetStation: 'freeport',
        quantity: 1,
      },
      {
        id: 'defend_convoy_3',
        type: 'escort',
        description: 'Defend third fuel convoy',
        target: 'refinery_fuel_convoy_3',
        targetStation: 'drydock',
        quantity: 1,
      },
      {
        id: 'survive_waves',
        type: 'defend',
        description: 'Survive 4 waves of pirate attacks',
        quantity: 4,
      },
    ],
    rewards: {
      credits: 8000,
      reputationChanges: {
        'sol-refinery': 25,
        'greenfields': 10,
        'freeport': 10,
        'drydock': 10,
        'ceres-pp': -10,
      },
      permanentEffects: ['refinery_convoy_protection'],
      unlocks: ['energy_monopoly_stage_4_refinery'],
    },
    requiredRep: {
      'sol-refinery': 45,
    },
    availableAt: ['sol-refinery'],
    prerequisiteMissions: ['energy_monopoly_stage_2'],
  },
  
  energy_monopoly_stage_3_ceres: {
    id: 'energy_monopoly_stage_3_ceres',
    arcId: 'energy_monopoly',
    title: 'The Blockade - Raid Refinery Shipments',
    description: 'Ivo Renn\'s office is all data streams and efficiency metrics. He doesn\'t waste time on pleasantries.\n\n"Rex Calder is attempting to flood the market with cheap fuel," he explains, highlighting three convoy routes. "This isn\'t competition—it\'s economic sabotage designed to destabilize energy prices system-wide. Chaos benefits no one."\n\nHe brings up financial projections. "Ceres Power Plant maintains grid stability for eight stations. Our energy reserves fund critical infrastructure—life support, agriculture, water recycling. If our operating costs spike due to artificially low fuel prices forcing us to sell at a loss, people die. It\'s that simple."\n\nThe projections show stations going dark. Systems failing. The calculus is cold but compelling.\n\n"Three convoys," Ivo continues. "Destroy them. Not to punish Rex—to prevent system-wide infrastructure collapse. I\'m offering premium compensation because this is critical." He meets your eyes. "I know how this looks. Monopolist hiring muscle to maintain control. But consider the alternative: Rex\'s naive idealism crashes fuel prices, Ceres Power Plant goes bankrupt, and eight stations lose their primary power supplier."\n\nHe transfers targeting data. "Sometimes the moral choice is the one that looks immoral from outside. Sometimes maintaining order requires actions that feel like oppression. Three convoys. Ten minutes."\n\nThe convoys are moving. Your weapons are armed. The choice has already been made.',
    type: 'combat',
    stage: 3,
    objectiveTemplates: [
      {
        id: 'destroy_convoy_1',
        type: 'destroy',
        description: 'Destroy first refinery convoy',
        target: 'refinery_fuel_convoy_1',
        quantity: 1,
      },
      {
        id: 'destroy_convoy_2',
        type: 'destroy',
        description: 'Destroy second refinery convoy',
        target: 'refinery_fuel_convoy_2',
        quantity: 1,
      },
      {
        id: 'destroy_convoy_3',
        type: 'destroy',
        description: 'Destroy third refinery convoy',
        target: 'refinery_fuel_convoy_3',
        quantity: 1,
      },
    ],
    rewards: {
      credits: 8000,
      reputationChanges: {
        'ceres-pp': 25,
        'sol-refinery': -30,
      },
      permanentEffects: ['refinery_convoys_disrupted'],
      unlocks: ['energy_monopoly_stage_4_ceres'],
    },
    requiredRep: {
      'ceres-pp': 45,
    },
    availableAt: ['ceres-pp'],
    prerequisiteMissions: ['energy_monopoly_stage_2'],
  },
  
  // ---------------------------------------------------------------------------
  // Arc 3: Energy Monopoly - Stage 4 (Finale)
  // ---------------------------------------------------------------------------
  
  energy_monopoly_stage_4_refinery: {
    id: 'energy_monopoly_stage_4_refinery',
    arcId: 'energy_monopoly',
    title: 'New Sources - Independent Refinery',
    description: 'The Sol Refinery conference room feels different now—lighter somehow, like a weight has been lifted. Rex Calder spreads geological survey data across the holo-table with barely contained excitement.\n\n"Rare minerals," he says, tapping specific deposits highlighted in the outer belt. "Catalyst-grade compounds. With the right setup, Freeport could establish an independent micro-refinery. Not big enough to replace us, but big enough to break Ivo\'s monopoly permanently."\n\nHe pulls up refinery schematics—compact, efficient, distributed. "Forty units of rare minerals. That\'s the cost of freedom. Not just for fuel prices, but for the whole system. Proof that one station, one corporation, one person can\'t corner a market forever."\n\nKalla Rook\'s voice crackles over comms from Freeport: "We\'re ready on this end, Rex. Got engineers from three stations willing to help with setup. This has become bigger than business—it\'s a statement."\n\nRex looks at you with something approaching hope. "Forty units. Deliver them to Freeport. Help us build something that shifts the balance permanently. No more monopolies. No more manufactured scarcity. Just honest competition and fair prices."\n\nHe pauses at the viewport, watching the sun\'s glare off the refinery towers. "My granddad helped build this place. Believed in honest work and fair trade. Thought the markets would regulate themselves if you just kept them free." He turns back to you. "Let\'s prove him right. Let\'s build a future where energy flows to where it\'s needed, not where it profits most to restrict it."\n\nForty units of rare minerals. The weight of economic revolution.',
    type: 'delivery',
    stage: 4,
    objectiveTemplates: [
      {
        id: 'deliver_rare_minerals',
        type: 'deliver',
        description: 'Deliver 40 rare minerals to Freeport',
        target: 'rare_minerals',
        targetStation: 'freeport',
        quantity: 40,
      },
    ],
    rewards: {
      credits: 15000,
      reputationChanges: {
        'sol-refinery': 40,
        'freeport': 30,
        'greenfields': 20,
        'drydock': 20,
      },
      permanentEffects: ['freeport_refinery_established', 'fuel_prices_normalized'],
      unlocks: ['arc_completion_energy_monopoly_refinery'],
    },
    requiredRep: {
      'sol-refinery': 50,
    },
    availableAt: ['sol-refinery'],
    prerequisiteMissions: ['energy_monopoly_stage_3_refinery'],
  },
  
  energy_monopoly_stage_4_ceres: {
    id: 'energy_monopoly_stage_4_ceres',
    arcId: 'energy_monopoly',
    title: 'Consolidate Control - Fuel Market Domination',
    description: 'Ivo Renn\'s office displays real-time fuel prices across every station in the system. You watch the numbers shift and flow like living things—supply, demand, speculation, need. He studies the data with the focus of a chess master planning moves ahead.\n\n"The refinery convoys are disrupted," he says without looking away from the screens. "Market instability is creating opportunity. Every station is scrambling for fuel reserves. Panic buying. Hoarding. Exactly as predicted."\n\nHe finally turns to face you, and his expression is unreadable. "I need you to capitalize on this moment. Visit five stations in twelve minutes. Buy every unit of refined fuel available. Doesn\'t matter what you pay—I\'ll reimburse double. Bring it all here to Ceres."\n\nThe implications are staggering. This isn\'t just maintaining a monopoly—this is cementing it permanently.\n\n"You\'re wondering if this makes you complicit," Ivo observes. "If helping me corner the fuel market makes you part of the problem." He pulls up infrastructure dependency charts. "Consider: Ceres Power Plant hasn\'t had a grid failure in nine years. Not one. That\'s because we maintain operational reserves that free-market idealists call \'hoarding.\'"\n\nHe highlights critical systems—hospitals, life support, agriculture. "These systems can\'t function on market volatility. They need guaranteed supply. Stability. Certainty. I provide that. Rex Calder provides dreams of free markets that collapse the moment supply chains hiccup."\n\nThe timer starts: twelve minutes. Five stations. Every unit of fuel you can carry. You\'re either building stability or enabling oppression. Maybe both. Maybe neither. Maybe the answer depends on who\'s asking.\n\nThe market is waiting. Choose.',
    type: 'delivery',
    stage: 4,
    objectiveTemplates: [
      {
        id: 'deliver_to_ceres',
        type: 'deliver',
        description: 'Deliver 50 refined fuel to Ceres Power Plant',
        target: 'refined_fuel',
        targetStation: 'ceres-pp',
        quantity: 50,
      },
    ],
    rewards: {
      credits: 15000,
      reputationChanges: {
        'ceres-pp': 40,
      },
      permanentEffects: ['ceres_fuel_monopoly_permanent', 'ceres_fuel_discount'],
      unlocks: ['arc_completion_energy_monopoly_ceres'],
    },
    requiredRep: {
      'ceres-pp': 50,
    },
    availableAt: ['ceres-pp'],
    timeLimit: 720, // 12 minutes
    prerequisiteMissions: ['energy_monopoly_stage_3_ceres'],
  },
  
  // ---------------------------------------------------------------------------
  // Arc 4: Pirate Accords - Stage 3 (Path-specific finales)
  // ---------------------------------------------------------------------------
  
  pirate_accords_stage_3_pirate: {
    id: 'pirate_accords_stage_3_pirate',
    arcId: 'pirate_accords',
    title: 'The Enforcement - Assault Sol City Defenses',
    description: 'Hidden Cove\'s command deck is controlled chaos—pirates planning assault vectors, checking weapon systems, running combat drills. Vex Marrow stands at the tactical display, and for once, the charming facade is gone. This is Vex the strategist, Vex the revolutionary, Vex the dangerous.\n\n"Sol City has been the boot on our neck for two generations," Vex begins, voice hard as vacuum. "They call us pirates. Criminals. Parasites. But we\'re what they created—people who refused to starve under their taxation, their regulation, their suffocating control."\n\nThe tactical display shows Sol City\'s defensive turrets—three automated weapons platforms guarding the primary approach vectors. Military-grade hardware. Built to deter exactly this kind of action.\n\n"These turrets are the symbol," Vex continues. "The iron fist in the velvet glove of \'civic authority.\' Take them down, and we prove Sol City can\'t protect what it claims to control. We prove they\'re vulnerable. We prove resistance works."\n\nAround the deck, pirates are checking gear—weapons, armor, emergency supplies. These aren\'t desperate criminals. They\'re believers. People who chose freedom over security, danger over submission.\n\n"This is war," Vex says quietly, meeting your eyes. "Not the pretend kind with market manipulation and political theater. Actual war. People will probably die. Maybe you. Maybe me. Maybe civilians caught in crossfire we can\'t prevent." A pause. "But slavery is slow death, and Sol City\'s system is slavery with better marketing."\n\nThe turrets are active. Your weapons are armed. The assault begins now.\n\n"Three turrets," Vex says. "Take them down. Show the system what revolution looks like."',
    type: 'combat',
    stage: 3,
    objectiveTemplates: [
      {
        id: 'destroy_turret_1',
        type: 'destroy',
        description: 'Destroy Sol City defense turret Alpha',
        target: 'sol_city_turret_alpha',
        quantity: 1,
      },
      {
        id: 'destroy_turret_2',
        type: 'destroy',
        description: 'Destroy Sol City defense turret Beta',
        target: 'sol_city_turret_beta',
        quantity: 1,
      },
      {
        id: 'destroy_turret_3',
        type: 'destroy',
        description: 'Destroy Sol City defense turret Gamma',
        target: 'sol_city_turret_gamma',
        quantity: 1,
      },
    ],
    rewards: {
      credits: 15000,
      reputationChanges: {
        'hidden-cove': 50,
        'sol-city': -50,
        'sol-refinery': -30,
      },
      permanentEffects: ['black_market_access', 'sol_city_weakened'],
      unlocks: ['arc_completion_pirate_accords_pirate'],
    },
    requiredRep: {
      'hidden-cove': 40,
    },
    availableAt: ['hidden-cove'],
    prerequisiteMissions: ['pirate_accords_stage_2'],
  },
  
  pirate_accords_stage_3_law: {
    id: 'pirate_accords_stage_3_law',
    arcId: 'pirate_accords',
    title: 'The Enforcement - Siege Hidden Cove',
    description: 'The Sol City security briefing room is austere and efficient—no decoration, no comfort, just tactical displays and mission parameters. Mira Vale stands at attention, flanked by two security officers in full combat gear. This isn\'t the polished civic liaison you\'ve seen before. This is Mira the enforcer.\n\n"Hidden Cove has been a cancer on this system for fifteen years," she begins, voice clipped and professional. "Theft. Extortion. Violence. They hide behind rhetoric about \'freedom\' and \'resistance,\' but at the end of the day, they\'re criminals who profit from other people\'s suffering."\n\nThe tactical display shows Hidden Cove\'s defensive installations—turrets, shields, patrol patterns. A hardened target. This isn\'t a police action. It\'s a siege.\n\n"Your mission is to destroy three critical defense turrets," Mira continues. "This will allow Sol City security forces to lock down the station temporarily. We\'re not massacring them—we\'re bringing them to justice. Due process. Rule of law. The things that separate civilization from anarchy."\n\nOne of the security officers hands you targeting data. You recognize some of the names in the pirate roster—people you\'ve traded with. Docked alongside. Shared drinks with in dimly lit cantinas.\n\n"I know this is difficult," Mira says, and for a moment, the bureaucratic armor cracks. "Some of them are good people who made bad choices. Some are genuinely dangerous. The law doesn\'t distinguish—that\'s the point. Everyone is accountable. Everyone faces consequences."\n\nShe straightens. "Three turrets. Take them down. End the pirate era. Restore order to this system. Show everyone that actions have consequences, no matter how romantic the justification."\n\nYour weapons are hot. The siege begins.',
    type: 'combat',
    stage: 3,
    objectiveTemplates: [
      {
        id: 'destroy_turret_1',
        type: 'destroy',
        description: 'Destroy Hidden Cove defense turret Alpha',
        target: 'hidden_cove_turret_alpha',
        quantity: 1,
      },
      {
        id: 'destroy_turret_2',
        type: 'destroy',
        description: 'Destroy Hidden Cove defense turret Beta',
        target: 'hidden_cove_turret_beta',
        quantity: 1,
      },
      {
        id: 'destroy_turret_3',
        type: 'destroy',
        description: 'Destroy Hidden Cove defense turret Gamma',
        target: 'hidden_cove_turret_gamma',
        quantity: 1,
      },
    ],
    rewards: {
      credits: 15000,
      reputationChanges: {
        'sol-city': 50,
        'sol-refinery': 30,
        'aurum-fab': 20,
        'hidden-cove': -60,
      },
      permanentEffects: ['hidden_cove_hostile', 'bounty_hunting_unlocked', 'pirate_attacks_increase'],
      unlocks: ['arc_completion_pirate_accords_law'],
    },
    requiredRep: {
      'sol-city': 50,
    },
    availableAt: ['sol-city'],
    prerequisiteMissions: ['pirate_accords_stage_2'],
  },
  
  pirate_accords_stage_3_peace: {
    id: 'pirate_accords_stage_3_peace',
    arcId: 'pirate_accords',
    title: 'The Enforcement - Defend Peace Conference',
    description: 'Freeport\'s main conference hall has been hastily converted into neutral ground. Kalla Rook stands at the center, coordinating security, logistics, and diplomatic protocols simultaneously. She looks exhausted but determined.\n\n"They\'re actually coming," she says, almost unable to believe it herself. "Mira Vale. Vex Marrow. Representatives from both sides. Sitting in the same room. Talking instead of shooting." She pulls up security scan data. "But not everyone wants peace."\n\nThe scans show multiple hostile contacts converging on Freeport—extremists from both sides. Sol City hard-liners who want pirate blood. Pirate zealots who see negotiation as betrayal. People for whom the conflict has become identity, purpose, meaning.\n\n"Two waves of attacks," Kalla explains. "First wave will be Sol City loyalists trying to assassinate Vex and derail negotiations. Second wave will be pirate extremists trying to kill Mira for the same reason. Both sides want the war to continue because war is simple. Peace is complicated."\n\nInside the conference hall, you can see the participants beginning to arrive. Mira Vale in her pressed civic uniform. Vex Marrow in deliberately casual armor. Both flanked by nervous security details. Both taking a massive risk by being here.\n\n"I know this seems naive," Kalla says quietly. "Thinking words can solve what weapons created. But every war ends eventually—either through victory, exhaustion, or negotiation. Victory means genocide. Exhaustion means everyone loses. This..." She gestures to the conference hall. "This is the only path where people actually win."\n\nYour weapons are hot. The first wave is inbound. Peace requires protection.\n\n"Defend this conference," Kalla says. "Defend the possibility that maybe—just maybe—we can be better than our worst impulses. Both waves. No matter what."',
    type: 'escort',
    stage: 3,
    objectiveTemplates: [
      {
        id: 'defend_wave_1',
        type: 'defend',
        description: 'Defend against Sol City extremist attack',
        quantity: 3,
      },
      {
        id: 'defend_wave_2',
        type: 'defend',
        description: 'Defend against pirate extremist attack',
        quantity: 3,
      },
      {
        id: 'protect_conference',
        type: 'escort',
        description: 'Keep Freeport conference safe',
        target: 'freeport',
        quantity: 1,
      },
    ],
    rewards: {
      credits: 12000,
      reputationChanges: {
        'freeport': 40,
        'sol-city': 30,
        'hidden-cove': 30,
      },
      permanentEffects: ['pirate_attacks_decrease', 'peace_agreement_active'],
      unlocks: ['arc_completion_pirate_accords_peace'],
    },
    requiredRep: {
      'freeport': 40,
    },
    availableAt: ['freeport'],
    prerequisiteMissions: ['pirate_accords_stage_2'],
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
        type: 'visit',
        description: 'Deliver pamphlets to Greenfields',
        quantity: 1,
        target: 'greenfields',
      },
      {
        id: 'deliver_pamphlets_2',
        type: 'visit',
        description: 'Deliver pamphlets to Sol Refinery',
        quantity: 1,
        target: 'sol-refinery',
      },
      {
        id: 'deliver_pamphlets_3',
        type: 'visit',
        description: 'Deliver pamphlets to Freeport',
        quantity: 1,
        target: 'freeport',
      },
      {
        id: 'deliver_pamphlets_4',
        type: 'visit',
        description: 'Deliver pamphlets to Hidden Cove',
        quantity: 1,
        target: 'hidden-cove',
      },
      {
        id: 'deliver_pamphlets_5',
        type: 'visit',
        description: 'Deliver pamphlets to Ceres Power Plant',
        quantity: 1,
        target: 'ceres-pp',
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
  
  // ---------------------------------------------------------------------------
  // Arc 5: Union Crisis - Stage 2 (Choice)
  // ---------------------------------------------------------------------------
  
  union_crisis_stage_2: {
    id: 'union_crisis_stage_2',
    arcId: 'union_crisis',
    title: 'Strike or Break',
    description: 'The pamphlets have done their work. Every station in the system is talking about workers\' rights, corporate exploitation, fair wages, and operational efficiency. The conversation has reached critical mass. Now comes the moment of action—and the choice that will define the labor movement\'s future.\n\nChief Harlan stands on Drydock\'s main fabrication floor, surrounded by workers holding union signs. "Tomorrow at 0600, we strike," he announces. "Corporate stations—Sol City, Aurum Fab, Ceres Power Plant—they shut down until they negotiate fair terms. No fabrication. No processing. No business as usual."\n\nThe crowd erupts in cheers. But then your comm chimes. It\'s Dr. Elin Kade, voice cold and precise: "Chief Harlan is gambling with system stability. If workers walk off corporate stations, food supplies destabilize. Power grids strain. People suffer. I\'m offering premium compensation to anyone willing to deliver strikebreakers—skilled workers who will keep operations running. Save the system from Harlan\'s idealism."\n\nTwo philosophies. Two futures. Support the strike by refusing to trade with corporate stations for ten real-time minutes—watch prices spike, feel the economic pressure, prove labor has leverage. Or deliver strikebreakers to three corporate stations—keep the system running smoothly, protect people from disruption, break the strike before it begins.\n\nWill you stand with workers fighting for dignity, or with corporations fighting for stability? The choice is yours, and the system will remember.',
    type: 'choice',
    stage: 2,
    objectiveTemplates: [],
    rewards: {
      credits: 0,
      reputationChanges: {},
    },
    requiredRep: {
      'drydock': 40,
    },
    availableAt: ['drydock', 'aurum-fab', 'sol-city', 'ceres-pp'],
    prerequisiteMissions: ['union_crisis_stage_1'],
    choiceOptions: [
      {
        id: 'support_strike',
        label: 'Support the Strike (Union Path)',
        description: 'Refuse to trade with corporate stations for 10 real-time minutes. Participate in the economic action. Show solidarity with workers fighting for fair treatment.',
        consequences: [
          'Corporate stations raise prices 20% for 8 minutes',
          'Worker stations gain reputation with you',
          'Strike gains momentum and legitimacy',
          'Corporate stations marked as hostile temporarily',
        ],
        rewards: {
          credits: 8000,
          reputationChanges: {
            'greenfields': 30,
            'drydock': 30,
            'sol-refinery': 30,
            'freeport': 20,
            'sol-city': -25,
            'aurum-fab': -25,
            'ceres-pp': -25,
          },
          permanentEffects: ['worker_strike_success', 'corporate_price_increase_temp'],
          unlocks: ['union_crisis_stage_3_union'],
        },
        nextMissionId: 'union_crisis_stage_3_union',
      },
      {
        id: 'break_strike',
        label: 'Break the Strike (Corporate Path)',
        description: 'Deliver strikebreakers (replacement workers) to three corporate stations. Keep the system running. Prevent economic chaos. Restore normal operations.',
        consequences: [
          'Worker stations refuse fabrication for 5 minutes',
          'Corporate stations gain reputation with you',
          'Strike is broken before it begins',
          'Union loses credibility',
        ],
        rewards: {
          credits: 10000,
          reputationChanges: {
            'sol-city': 30,
            'aurum-fab': 30,
            'ceres-pp': 30,
            'greenfields': -40,
            'drydock': -40,
            'sol-refinery': -40,
          },
          permanentEffects: ['strike_broken', 'worker_stations_fabrication_lockdown_temp'],
          unlocks: ['union_crisis_stage_3_corporate'],
        },
        nextMissionId: 'union_crisis_stage_3_corporate',
      },
    ],
  },
  
  // ---------------------------------------------------------------------------
  // Arc 5: Union Crisis - Stage 3 (Finale - Multi-stage negotiation)
  // ---------------------------------------------------------------------------
  
  union_crisis_stage_3_union: {
    id: 'union_crisis_stage_3_union',
    arcId: 'union_crisis',
    title: 'The Negotiations - Union Victory',
    description: 'The strike worked. Corporate stations are scrambling, supply chains are strained, and even Dr. Elin Kade has agreed to come to the negotiating table. Kalla Rook at Freeport has volunteered to arbitrate—neutral ground, neutral party, binding agreement.\n\nChief Harlan greets you on Drydock with barely restrained triumph. "We did it," he says, voice rough with emotion. "Decades of getting squeezed, ignored, devalued—and we finally pushed back hard enough to be heard."\n\nBut the work isn\'t done. "I need economic data from six stations," Harlan continues, pulling up a list. "Real numbers. Operating costs, profit margins, labor expenses. Can\'t negotiate fair terms without understanding the full picture." He hands you encrypted data collection devices. "Gather the data. Bring it to Kalla at Freeport. Let\'s prove workers can win with facts and leverage, not just slogans and strikes."\n\nThe stations are waiting. The data is critical. The future of labor relations hangs in the balance.\n\nThis is what victory looks like—not glory, but logistics. Not slogans, but spreadsheets. The unglamorous work of actually changing systems.',
    type: 'collection',
    stage: 3,
    objectiveTemplates: [
      {
        id: 'collect_data_1',
        type: 'visit',
        description: 'Collect economic data from Sol City',
        target: 'sol-city',
        quantity: 1,
      },
      {
        id: 'collect_data_2',
        type: 'visit',
        description: 'Collect economic data from Aurum Fab',
        target: 'aurum-fab',
        quantity: 1,
      },
      {
        id: 'collect_data_3',
        type: 'visit',
        description: 'Collect economic data from Greenfields',
        target: 'greenfields',
        quantity: 1,
      },
      {
        id: 'collect_data_4',
        type: 'visit',
        description: 'Collect economic data from Drydock',
        target: 'drydock',
        quantity: 1,
      },
      {
        id: 'collect_data_5',
        type: 'visit',
        description: 'Collect economic data from Ceres PP',
        target: 'ceres-pp',
        quantity: 1,
      },
      {
        id: 'collect_data_6',
        type: 'visit',
        description: 'Collect economic data from Sol Refinery',
        target: 'sol-refinery',
        quantity: 1,
      },
      {
        id: 'deliver_to_freeport',
        type: 'visit',
        description: 'Deliver all data to Freeport for arbitration',
        quantity: 1,
        target: 'freeport',
      },
    ],
    rewards: {
      credits: 12000,
      reputationChanges: {
        'greenfields': 40,
        'drydock': 40,
        'sol-refinery': 40,
        'freeport': 30,
      },
      permanentEffects: ['union_victory', 'fabrication_cost_decrease', 'worker_rights_improved'],
      unlocks: ['arc_completion_union_crisis_union'],
    },
    requiredRep: {
      'drydock': 50,
    },
    availableAt: ['drydock'],
    prerequisiteMissions: ['union_crisis_stage_2'],
  },
  
  union_crisis_stage_3_corporate: {
    id: 'union_crisis_stage_3_corporate',
    arcId: 'union_crisis',
    title: 'The Negotiations - Corporate Victory',
    description: 'The strike is broken. Workers have returned to their stations, and corporate operations have resumed normal capacity. But the tension remains—you can feel it in every docking bay, every fabrication floor, every refinery deck. This isn\'t over. It\'s just paused.\n\nDr. Elin Kade meets you in a secure conference room at Aurum Fab. "Chief Harlan is demanding arbitration," she says flatly. "Kalla Rook at Freeport has volunteered to mediate. Fine. We\'ll negotiate—but from a position of strength, not desperation."\n\nShe transfers data collection protocols to your system. "Six stations. Economic data. Operating costs, profit margins, labor expenses. I need the full picture before I sit across from Harlan and his union rhetoric." Her expression is clinical, but you detect something else underneath—maybe uncertainty, maybe respect for an opponent who actually made her sweat.\n\n"Bring the data to Freeport," Dr. Kade continues. "Let\'s see what \'fair terms\' actually look like when facts replace feelings. Maybe we find compromise. Maybe we prove unions are economically unsustainable. Either way, we negotiate with data, not emotion."\n\nThe stations are waiting. The data is critical. The future of corporate-labor relations hangs in the balance.\n\nThis is what victory looks like—not celebration, but homework. Not dominance, but preparation. The practical work of maintaining power.',
    type: 'collection',
    stage: 3,
    objectiveTemplates: [
      {
        id: 'collect_data_1',
        type: 'visit',
        description: 'Collect economic data from Sol City',
        target: 'sol-city',
        quantity: 1,
      },
      {
        id: 'collect_data_2',
        type: 'visit',
        description: 'Collect economic data from Aurum Fab',
        target: 'aurum-fab',
        quantity: 1,
      },
      {
        id: 'collect_data_3',
        type: 'visit',
        description: 'Collect economic data from Greenfields',
        target: 'greenfields',
        quantity: 1,
      },
      {
        id: 'collect_data_4',
        type: 'visit',
        description: 'Collect economic data from Drydock',
        target: 'drydock',
        quantity: 1,
      },
      {
        id: 'collect_data_5',
        type: 'visit',
        description: 'Collect economic data from Ceres PP',
        target: 'ceres-pp',
        quantity: 1,
      },
      {
        id: 'collect_data_6',
        type: 'visit',
        description: 'Collect economic data from Sol Refinery',
        target: 'sol-refinery',
        quantity: 1,
      },
      {
        id: 'deliver_to_freeport',
        type: 'visit',
        description: 'Deliver all data to Freeport for arbitration',
        quantity: 1,
        target: 'freeport',
      },
    ],
    rewards: {
      credits: 15000,
      reputationChanges: {
        'sol-city': 40,
        'aurum-fab': 40,
        'ceres-pp': 40,
        'freeport': 20,
      },
      permanentEffects: ['corporate_victory', 'union_weakened', 'fabrication_efficiency_improved'],
      unlocks: ['arc_completion_union_crisis_corporate'],
    },
    requiredRep: {
      'aurum-fab': 50,
    },
    availableAt: ['aurum-fab', 'sol-city', 'ceres-pp'],
    prerequisiteMissions: ['union_crisis_stage_2'],
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

