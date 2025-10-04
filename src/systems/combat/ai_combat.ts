// NPC combat AI - attack behavior, target selection, firing logic

import type { NpcTrader, Ship } from '../../domain/types/world_types';
import type { NpcAggressionState, ShipWeapon, Projectile } from '../../domain/types/combat_types';
import { distance } from '../../shared/math/vec3';
import { 
  NPC_WEAPON_DAMAGE, 
  NPC_WEAPON_FIRE_RATE, 
  NPC_WEAPON_RANGE,
  NPC_AGGRESSION_DURATION,
  NPC_WEAPON_ENERGY_COST,
  WEAPON_BASE_STATS,
} from '../../domain/constants/weapon_constants';
import { createProjectile, isInRange, calculateLeadPosition } from './weapon_systems';

// Check if NPC should become aggressive (was attacked recently)
export function updateNpcAggression(
  npc: NpcTrader,
  aggressionState: NpcAggressionState | undefined,
  currentTime: number,
  wasJustAttacked: boolean
): NpcAggressionState {
  if (!aggressionState) {
    aggressionState = {
      npcId: npc.id,
      isAggressive: false,
    };
  }

  // If just attacked, become aggressive
  if (wasJustAttacked) {
    return {
      ...aggressionState,
      isAggressive: true,
      targetId: 'player', // always target player for now
      lastAttackedTime: currentTime,
    };
  }

  // Check if aggression should expire
  if (aggressionState.isAggressive && aggressionState.lastAttackedTime) {
    const timeSinceAttack = currentTime - aggressionState.lastAttackedTime;
    if (timeSinceAttack > NPC_AGGRESSION_DURATION) {
      return {
        ...aggressionState,
        isAggressive: false,
        targetId: undefined,
      };
    }
  }

  return aggressionState;
}

// Decide if NPC should fire at player
export function shouldNpcFire(
  npc: NpcTrader,
  npcHp: number,
  ship: Ship,
  aggressionState: NpcAggressionState | undefined,
  lastFireTime: number,
  currentTime: number
): boolean {
  // Must be alive and aggressive
  if (npcHp <= 0 || !aggressionState?.isAggressive) {
    return false;
  }

  // Must have player as target
  if (aggressionState.targetId !== 'player') {
    return false;
  }

  // Check fire rate cooldown
  const fireInterval = 1000 / NPC_WEAPON_FIRE_RATE;
  if (currentTime - lastFireTime < fireInterval) {
    return false;
  }

  // Check if player is in range
  const dist = distance(npc.position, ship.position);
  if (dist > NPC_WEAPON_RANGE) {
    return false;
  }

  // Random chance to fire (70% when in range and ready)
  return Math.random() < 0.7;
}

// Create NPC weapon (simplified, non-upgradeable)
export function getNpcWeapon(): ShipWeapon {
  return {
    kind: 'laser',
    damage: NPC_WEAPON_DAMAGE,
    fireRate: NPC_WEAPON_FIRE_RATE,
    range: NPC_WEAPON_RANGE,
    projectileSpeed: 0, // hitscan
    energyCost: NPC_WEAPON_ENERGY_COST,
    damageLevel: 0,
    fireRateLevel: 0,
    rangeLevel: 0,
  };
}

// Fire weapon from NPC at player
export function npcFireAtPlayer(
  npc: NpcTrader,
  ship: Ship
): Projectile {
  const weapon = getNpcWeapon();
  
  // Lead target slightly for moving targets
  const leadPos = calculateLeadPosition(
    npc.position,
    ship.position,
    ship.velocity,
    weapon.projectileSpeed
  );

  return createProjectile(
    weapon,
    npc.position,
    npc.velocity || [0, 0, 0],
    leadPos,
    npc.id,
    'npc'
  );
}

// Steer NPC toward player when aggressive (simple pursuit)
export function getNpcAggressiveDirection(
  npc: NpcTrader,
  ship: Ship,
  aggressionState: NpcAggressionState | undefined
): [number, number, number] | null {
  if (!aggressionState?.isAggressive) {
    return null;
  }

  const dx = ship.position[0] - npc.position[0];
  const dy = ship.position[1] - npc.position[1];
  const dz = ship.position[2] - npc.position[2];
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (len < 0.001) {
    return null;
  }

  // Return normalized direction toward player
  return [dx / len, dy / len, dz / len];
}

// Calculate optimal firing distance (stay at range)
export function getOptimalAttackDistance(): number {
  return NPC_WEAPON_RANGE * 0.7; // Stay at 70% of max range
}


