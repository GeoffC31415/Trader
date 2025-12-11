import { SCALE } from './world_constants';

/**
 * Gameplay constants for interactions and ranges
 */

// Interaction ranges (in SCALE units)
export const DOCKING_RANGE = 6; // Distance from station to dock
export const MINING_RANGE = 6; // Distance from belt ring to mine
export const WAYPOINT_THRESHOLD = 3; // Visual threshold for waypoint display

// Convert to world space
export const DOCKING_RANGE_WORLD = DOCKING_RANGE * SCALE;
export const MINING_RANGE_WORLD = MINING_RANGE * SCALE;
export const WAYPOINT_THRESHOLD_WORLD = WAYPOINT_THRESHOLD * SCALE;

