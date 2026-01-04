/**
 * Political Compass System
 * 
 * Tracks player choices across mission arcs on two axes:
 * - Freedom (positive) ↔ Order (negative)
 * - Labor (positive) ↔ Capital (negative)
 * 
 * Each mission choice contributes points to these axes,
 * allowing visualization of the player's political alignment.
 */

// ============================================================================
// Types
// ============================================================================

export type PoliticalScore = {
  freedom: number;  // -100 to +100 (negative = Order)
  labor: number;    // -100 to +100 (negative = Capital)
};

export type PoliticalScoreContribution = {
  missionId: string;
  choiceId: string;
  description: string;
  freedomDelta: number;
  laborDelta: number;
  timestamp: number;
};

export type PoliticalQuadrant = 
  | 'free_worker'      // +Freedom, +Labor
  | 'union_builder'    // -Freedom (Order), +Labor
  | 'libertarian'      // +Freedom, -Labor (Capital)
  | 'corporate_loyalist'; // -Freedom (Order), -Labor (Capital)

export type PlayerPoliticalProfile = {
  score: PoliticalScore;
  history: PoliticalScoreContribution[];
  quadrant: PoliticalQuadrant;
};

// Dummy player for scatter plot testing
export type DummyPlayer = {
  id: string;
  name: string;
  score: PoliticalScore;
};

// ============================================================================
// Constants
// ============================================================================

export const SCORE_MIN = -100;
export const SCORE_MAX = 100;

// Quadrant labels and descriptions
export const QUADRANT_INFO: Record<PoliticalQuadrant, { 
  label: string; 
  description: string;
  color: string;
}> = {
  free_worker: {
    label: 'Free Worker',
    description: 'Independence for the people. You fight for autonomy and worker empowerment.',
    color: '#22c55e', // green
  },
  union_builder: {
    label: 'Union Builder',
    description: 'Collective strength through structure. You believe in organized labor within systems.',
    color: '#3b82f6', // blue
  },
  libertarian: {
    label: 'Libertarian Trader',
    description: 'Free markets, free movement. You value autonomy above all else.',
    color: '#eab308', // yellow
  },
  corporate_loyalist: {
    label: 'Corporate Loyalist',
    description: 'Order and efficiency. You trust centralized authority to maintain stability.',
    color: '#ef4444', // red
  },
};

// ============================================================================
// Mission Score Mappings
// ============================================================================

/**
 * Score contributions for each mission/choice combination
 * Key format: `${missionId}:${choiceId}` or just `${missionId}` for non-choice missions
 */
export const MISSION_SCORES: Record<string, {
  freedomDelta: number;
  laborDelta: number;
  description: string;
}> = {
  // ============================================
  // Arc 1: Greenfields Independence
  // ============================================
  
  // Stage 1: Breaking the Chain (smuggling luxury goods)
  'greenfields_stage_1:complete': {
    freedomDelta: 5,
    laborDelta: 5,
    description: 'Smuggled goods to bypass Sol City regulations',
  },
  
  // Stage 2: Choice - Side with Greenfields or Sol City
  'greenfields_stage_2:side_greenfields': {
    freedomDelta: 15,
    laborDelta: 10,
    description: 'Sided with Greenfields independence movement',
  },
  'greenfields_stage_2:side_sol_city': {
    freedomDelta: -15,
    laborDelta: 0,
    description: 'Provided evidence to Sol City regulators',
  },
  
  // Stage 3A: Destroy convoys (Greenfields path)
  'greenfields_stage_3:complete': {
    freedomDelta: 10,
    laborDelta: 5,
    description: 'Disrupted Sol City supply lines for Greenfields',
  },
  
  // Stage 3B: Escort inspector (Sol City path)
  'sol_city_stage_3:complete': {
    freedomDelta: -10,
    laborDelta: 0,
    description: 'Protected Sol City inspector on enforcement mission',
  },
  
  // Stage 4A: Greenfields Independence achieved
  'greenfields_stage_4:complete': {
    freedomDelta: 20,
    laborDelta: 10,
    description: 'Secured Greenfields independence from Sol City',
  },
  
  // Stage 4B: Sol City Control established
  'sol_city_stage_4:complete': {
    freedomDelta: -20,
    laborDelta: -5,
    description: 'Enforced Sol City control over Greenfields',
  },
  
  // ============================================
  // Arc 2: Fabrication Wars
  // ============================================
  
  // Stage 1A: Aurum - Steal Drydock data
  'fabrication_wars_aurum_stage_1:complete': {
    freedomDelta: 0,
    laborDelta: -15,
    description: 'Stole worker schematics for corporate automation',
  },
  
  // Stage 1B: Drydock - Plant fake schematics
  'fabrication_wars_drydock_stage_1:complete': {
    freedomDelta: 0,
    laborDelta: 15,
    description: 'Sabotaged corporate automation to protect workers',
  },
  
  // Stage 2: Materials race (continues direction)
  'fabrication_wars_stage_2:aurum': {
    freedomDelta: 0,
    laborDelta: -10,
    description: 'Secured materials for Aurum automation',
  },
  'fabrication_wars_stage_2:drydock': {
    freedomDelta: 0,
    laborDelta: 10,
    description: 'Secured materials for Drydock workers',
  },
  
  // Stage 3: Sabotage
  'fabrication_wars_stage_3:aurum': {
    freedomDelta: 5,
    laborDelta: -10,
    description: 'Sabotaged Drydock operations for Aurum',
  },
  'fabrication_wars_stage_3:drydock': {
    freedomDelta: -5,
    laborDelta: 10,
    description: 'Sabotaged Aurum automation for Drydock',
  },
  
  // Stage 4: Final contract
  'fabrication_wars_stage_4:aurum': {
    freedomDelta: 0,
    laborDelta: -15,
    description: 'Won Ceres contract for Aurum Fabricator',
  },
  'fabrication_wars_stage_4:drydock': {
    freedomDelta: 0,
    laborDelta: 15,
    description: 'Won Ceres contract for Drydock workers',
  },
  
  // ============================================
  // Arc 3: Energy Monopoly
  // ============================================
  
  // Stage 1: Install monitor (neutral)
  'energy_monopoly_stage_1:complete': {
    freedomDelta: 0,
    laborDelta: 0,
    description: 'Installed monitoring device at Ceres Power Plant',
  },
  
  // Stage 2: Choice - Expose or Protect Ivo
  'energy_monopoly_stage_2:expose': {
    freedomDelta: 15,
    laborDelta: 15,
    description: 'Chose to expose Ivo Renn\'s price manipulation',
  },
  'energy_monopoly_stage_2:protect': {
    freedomDelta: -15,
    laborDelta: -15,
    description: 'Chose to protect Ivo Renn\'s monopoly',
  },
  
  // Stage 3A: Defend convoys (Rex path)
  'energy_monopoly_stage_3_refinery:complete': {
    freedomDelta: 10,
    laborDelta: 10,
    description: 'Defended fuel convoys against corporate raiders',
  },
  
  // Stage 3B: Destroy convoys (Ivo path)
  'energy_monopoly_stage_3_ceres:complete': {
    freedomDelta: -10,
    laborDelta: -10,
    description: 'Destroyed competitor fuel convoys for Ceres',
  },
  
  // Stage 4A: Build micro-refinery (Rex victory)
  'energy_monopoly_stage_4_refinery:complete': {
    freedomDelta: 25,
    laborDelta: 15,
    description: 'Helped establish independent fuel production',
  },
  
  // Stage 4B: Consolidate control (Ivo victory)
  'energy_monopoly_stage_4_ceres:complete': {
    freedomDelta: -25,
    laborDelta: -15,
    description: 'Helped Ceres consolidate fuel monopoly',
  },
  
  // ============================================
  // Arc 4: Pirate Accords
  // ============================================
  
  // Stage 1: Deliver proposal (neutral)
  'pirate_accords_stage_1:complete': {
    freedomDelta: 0,
    laborDelta: 0,
    description: 'Delivered peace proposal to Hidden Cove',
  },
  
  // Stage 2: Three-way choice
  'pirate_accords_stage_2:join_pirates': {
    freedomDelta: 25,
    laborDelta: 5,
    description: 'Joined the pirate cause against Sol City',
  },
  'pirate_accords_stage_2:enforce_law': {
    freedomDelta: -25,
    laborDelta: -5,
    description: 'Chose to enforce Sol City law against pirates',
  },
  'pirate_accords_stage_2:broker_peace': {
    freedomDelta: 0,
    laborDelta: 10,
    description: 'Chose to broker peace between factions',
  },
  
  // Stage 3A: Assault Sol defenses (pirate path)
  'pirate_accords_stage_3_pirate:complete': {
    freedomDelta: 15,
    laborDelta: 0,
    description: 'Assaulted Sol City defenses with pirates',
  },
  
  // Stage 3B: Siege Hidden Cove (law path)
  'pirate_accords_stage_3_law:complete': {
    freedomDelta: -15,
    laborDelta: 0,
    description: 'Helped Sol City siege Hidden Cove',
  },
  
  // Stage 3C: Defend conference (peace path)
  'pirate_accords_stage_3_peace:complete': {
    freedomDelta: 5,
    laborDelta: 10,
    description: 'Protected peace negotiations from saboteurs',
  },
  
  // ============================================
  // Arc 5: Union Crisis
  // ============================================
  
  // Stage 1: Distribute pamphlets
  'union_crisis_stage_1:complete': {
    freedomDelta: 5,
    laborDelta: 10,
    description: 'Distributed union organizing pamphlets',
  },
  
  // Stage 2: Choice - Support or Break strike
  'union_crisis_stage_2:support_strike': {
    freedomDelta: 10,
    laborDelta: 30,
    description: 'Supported the worker strike',
  },
  'union_crisis_stage_2:break_strike': {
    freedomDelta: -10,
    laborDelta: -30,
    description: 'Helped break the worker strike',
  },
  
  // Stage 3A: Union victory
  'union_crisis_stage_3_union:complete': {
    freedomDelta: 10,
    laborDelta: 20,
    description: 'Secured union victory and worker rights',
  },
  
  // Stage 3B: Corporate victory
  'union_crisis_stage_3_corporate:complete': {
    freedomDelta: -10,
    laborDelta: -20,
    description: 'Secured corporate victory over workers',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate quadrant from current score
 */
export function getQuadrant(score: PoliticalScore): PoliticalQuadrant {
  const { freedom, labor } = score;
  
  if (freedom >= 0 && labor >= 0) return 'free_worker';
  if (freedom < 0 && labor >= 0) return 'union_builder';
  if (freedom >= 0 && labor < 0) return 'libertarian';
  return 'corporate_loyalist';
}

/**
 * Create initial political profile
 */
export function createInitialProfile(): PlayerPoliticalProfile {
  return {
    score: { freedom: 0, labor: 0 },
    history: [],
    quadrant: 'free_worker', // Starting neutral falls into top-right
  };
}

/**
 * Apply a mission contribution to the current score
 */
export function applyMissionContribution(
  profile: PlayerPoliticalProfile,
  missionId: string,
  choiceId: string | null
): PlayerPoliticalProfile {
  const key = choiceId ? `${missionId}:${choiceId}` : `${missionId}:complete`;
  const scoreData = MISSION_SCORES[key];
  
  if (!scoreData) {
    // No score mapping for this mission/choice
    return profile;
  }
  
  const contribution: PoliticalScoreContribution = {
    missionId,
    choiceId: choiceId || 'complete',
    description: scoreData.description,
    freedomDelta: scoreData.freedomDelta,
    laborDelta: scoreData.laborDelta,
    timestamp: Date.now(),
  };
  
  const newScore: PoliticalScore = {
    freedom: clampScore(profile.score.freedom + scoreData.freedomDelta),
    labor: clampScore(profile.score.labor + scoreData.laborDelta),
  };
  
  return {
    score: newScore,
    history: [...profile.history, contribution],
    quadrant: getQuadrant(newScore),
  };
}

/**
 * Clamp score to valid range
 */
function clampScore(value: number): number {
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, value));
}

/**
 * Calculate position on compass for rendering (0-1 range)
 */
export function scoreToPosition(score: PoliticalScore): { x: number; y: number } {
  return {
    x: (score.freedom - SCORE_MIN) / (SCORE_MAX - SCORE_MIN),
    y: (score.labor - SCORE_MIN) / (SCORE_MAX - SCORE_MIN),
  };
}

/**
 * Generate journey path from (0,0) through all contributions
 */
export function calculateJourneyPath(history: PoliticalScoreContribution[]): PoliticalScore[] {
  const path: PoliticalScore[] = [{ freedom: 0, labor: 0 }];
  
  let current: PoliticalScore = { freedom: 0, labor: 0 };
  
  for (const contribution of history) {
    current = {
      freedom: clampScore(current.freedom + contribution.freedomDelta),
      labor: clampScore(current.labor + contribution.laborDelta),
    };
    path.push({ ...current });
  }
  
  return path;
}

// ============================================================================
// Dummy Players for Testing
// ============================================================================

export const DUMMY_PLAYERS: DummyPlayer[] = [
  // Free Worker quadrant (+Freedom, +Labor)
  { id: 'player_001', name: 'SpaceRebel42', score: { freedom: 75, labor: 85 } },
  { id: 'player_002', name: 'FarmersFirst', score: { freedom: 45, labor: 60 } },
  { id: 'player_003', name: 'UnionPilot', score: { freedom: 30, labor: 55 } },
  { id: 'player_004', name: 'GreenfieldsHero', score: { freedom: 90, labor: 45 } },
  
  // Union Builder quadrant (-Freedom/Order, +Labor)
  { id: 'player_005', name: 'OrderlyWorker', score: { freedom: -35, labor: 70 } },
  { id: 'player_006', name: 'RegulatedUnion', score: { freedom: -55, labor: 50 } },
  { id: 'player_007', name: 'SystemicReform', score: { freedom: -20, labor: 40 } },
  
  // Libertarian quadrant (+Freedom, -Labor/Capital)
  { id: 'player_008', name: 'FreeTrade99', score: { freedom: 80, labor: -40 } },
  { id: 'player_009', name: 'ProfitPilot', score: { freedom: 55, labor: -65 } },
  { id: 'player_010', name: 'MarketForces', score: { freedom: 40, labor: -30 } },
  { id: 'player_011', name: 'SpaceCapitalist', score: { freedom: 25, labor: -50 } },
  
  // Corporate Loyalist quadrant (-Freedom/Order, -Labor/Capital)
  { id: 'player_012', name: 'CorpSecurity', score: { freedom: -70, labor: -55 } },
  { id: 'player_013', name: 'Efficiency101', score: { freedom: -45, labor: -80 } },
  { id: 'player_014', name: 'TechnocratPrime', score: { freedom: -60, labor: -45 } },
  { id: 'player_015', name: 'OrderAboveAll', score: { freedom: -80, labor: -25 } },
  
  // Near center (neutral/balanced)
  { id: 'player_016', name: 'Balanced_Ace', score: { freedom: 5, labor: -8 } },
  { id: 'player_017', name: 'Pragmatist', score: { freedom: -12, labor: 15 } },
  { id: 'player_018', name: 'NeutralTrader', score: { freedom: 8, labor: 5 } },
  
  // Extreme positions
  { id: 'player_019', name: 'PureAnarchist', score: { freedom: 95, labor: 95 } },
  { id: 'player_020', name: 'TotalControl', score: { freedom: -95, labor: -90 } },
];

