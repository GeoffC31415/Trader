// Mission system types for story arcs and missions

export type MissionType = 
  | 'delivery' 
  | 'combat' 
  | 'stealth' 
  | 'choice' 
  | 'collection'
  | 'escort'
  | 'investigation';

export type MissionStatus = 'offered' | 'active' | 'completed' | 'failed' | 'cancelled';
export type ArcStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export type MissionObjectiveType = 
  | 'destroy' 
  | 'deliver' 
  | 'collect' 
  | 'visit' 
  | 'defend' 
  | 'wait'
  | 'avoid_detection'
  | 'escort';

export type MissionObjective = {
  id: string;
  type: MissionObjectiveType;
  description: string;
  target?: string; // commodityId, npcId, stationId
  targetStation?: string; // for deliver missions - which station to deliver to
  quantity?: number;
  current: number;
  completed: boolean;
  failed?: boolean; // true if this objective failed (e.g., escort destroyed)
  optional?: boolean;
};

export type MissionReward = {
  credits: number;
  reputationChanges: Record<string, number>; // stationId -> rep delta
  unlocks?: string[]; // mission IDs, upgrades, etc.
  permanentEffects?: string[]; // 'fuel_prices_reduced', 'greenfields_independent'
};

export type Mission = {
  id: string;
  arcId: string; // which arc this belongs to
  title: string;
  description: string;
  type: MissionType;
  stage: number; // which stage in the arc (1-4)
  objectives: MissionObjective[];
  rewards: MissionReward;
  requiredRep?: Record<string, number>; // stationId -> min rep
  availableAt: string[]; // station IDs where mission can be accepted
  expiresAt?: number; // game time when mission expires
  timeLimit?: number; // seconds to complete after accepting
  acceptedAt?: number; // game time when mission was accepted
  status: MissionStatus;
  choiceOptions?: MissionChoice[]; // for choice missions
};

export type MissionChoice = {
  id: string;
  label: string;
  description: string;
  consequences: string[]; // human-readable consequences
  rewards: MissionReward;
  nextMissionId?: string; // unlocks specific next mission
};

export type MissionArc = {
  id: string;
  name: string;
  description: string;
  characters: string[]; // station IDs or character names
  status: ArcStatus;
  currentStage: number; // which mission in the arc (1-4)
  choicesMade: Record<string, string>; // 'stage_2_choice': 'side_greenfields'
  completedMissions: string[]; // mission IDs completed
  unlockRequirements?: {
    reputation?: Record<string, number>; // stationId -> min rep
    upgrades?: string[]; // required upgrades
    completedArcs?: string[]; // required completed arcs
  };
};

export type MissionTemplate = {
  id: string;
  arcId: string;
  title: string;
  description: string;
  type: MissionType;
  stage: number;
  objectiveTemplates: Omit<MissionObjective, 'current' | 'completed'>[];
  rewards: MissionReward;
  requiredRep?: Record<string, number>;
  availableAt: string[];
  timeLimit?: number;
  choiceOptions?: MissionChoice[];
  prerequisiteMissions?: string[]; // mission IDs that must be completed first
};

// Narrative rendering context captured at completion time
export type NarrativeContext = {
  playerName?: string;
  shipKind?: string;
  deliveredUnits?: number;
  commodityName?: string;
  timeElapsedSec?: number;
  enemiesDestroyed?: number;
  stealthUsed?: boolean;
  routeStart?: string;
  routeEnd?: string;
  stationsVisited?: string[];
  casualties?: number;
  sidedWith?: 'greenfields' | 'sol_city' | 'aurum' | 'drydock' | 'pirates' | 'law' | 'peace';
  priceDeltaApplied?: number;
  // Phase 3: trust snapshot for narrative variants
  trustTiers?: Record<string, number>; // stationId -> tier (-2..2)
  trustScores?: Record<string, number>; // optional raw scores
};

