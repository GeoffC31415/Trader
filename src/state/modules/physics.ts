/**
 * Physics Module
 * 
 * Handles ship movement, velocity damping, position updates, and engine power.
 * All physics calculations for the player ship.
 */

import { clampMagnitude } from '../../shared/math/vec3';
import type { Ship } from '../../domain/types/world_types';

/**
 * Update ship physics for one frame
 * Applies velocity damping and position integration
 * 
 * @param ship - Current ship state
 * @param dt - Delta time in seconds
 * @returns Updated ship with new position, velocity, and engine power
 */
export function updatePhysics(ship: Ship, dt: number): Ship {
  // Apply exponential damping to velocity
  const drag = ship.stats.drag;
  const dampFactor = Math.exp(-drag * dt);
  const dampedVel: [number, number, number] = [
    ship.velocity[0] * dampFactor,
    ship.velocity[1] * dampFactor,
    ship.velocity[2] * dampFactor,
  ];

  // Clamp velocity to max speed
  const [vx, vy, vz] = clampMagnitude(dampedVel as any, ship.stats.vmax);

  // Integrate position
  const position: [number, number, number] = [
    ship.position[0] + vx * dt,
    ship.position[1] + vy * dt,
    ship.position[2] + vz * dt,
  ];

  // Smooth engine power towards target (exponential smoothing)
  const k = 10; // Smoothing factor
  const a = 1 - Math.exp(-k * dt);
  const enginePower = ship.enginePower + (ship.engineTarget - ship.enginePower) * a;

  return {
    ...ship,
    position,
    velocity: [vx, vy, vz],
    enginePower,
  };
}

/**
 * Apply thrust to ship in a given direction
 * 
 * @param ship - Current ship state
 * @param direction - Normalized direction vector [x, y, z]
 * @param dt - Delta time in seconds
 * @returns Updated ship with new velocity and engine target set to 1
 */
export function applyThrust(
  ship: Ship,
  direction: [number, number, number],
  dt: number
): Ship {
  const acc = ship.stats.acc;
  const velocity: [number, number, number] = [
    ship.velocity[0] + direction[0] * acc * dt,
    ship.velocity[1] + direction[1] * acc * dt,
    ship.velocity[2] + direction[2] * acc * dt,
  ];

  return {
    ...ship,
    velocity,
    engineTarget: 1, // Thrusting sets engine to full power
  };
}

/**
 * Set engine target power level
 * 
 * @param ship - Current ship state
 * @param target - Target power level (0-1)
 * @param isDocked - Whether ship is currently docked (forces target to 0)
 * @returns Updated ship with new engine target
 */
export function setEngineTarget(ship: Ship, target: number, isDocked: boolean): Ship {
  if (isDocked) {
    target = 0;
  }
  
  const clampedTarget = Math.max(0, Math.min(1, target));
  
  // No change needed
  if (ship.engineTarget === clampedTarget) {
    return ship;
  }

  return {
    ...ship,
    engineTarget: clampedTarget,
  };
}

