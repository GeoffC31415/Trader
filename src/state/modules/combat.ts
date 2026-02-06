/**
 * Combat Module
 * 
 * Handles all combat-related logic: projectiles, collisions, damage, aggression,
 * hostile defenders, and weapon systems.
 */

import { distance } from '../../shared/math/vec3';
import {
  PLAYER_MAX_HP,
  PLAYER_MAX_ENERGY,
  ENERGY_REGEN_RATE,
  NPC_BASE_HP,
  REP_LOSS_PER_NPC_KILL,
  REP_LOSS_PER_HIT,
  WEAPON_BASE_STATS,
  WEAPON_UPGRADE_MAX_LEVELS,
} from '../../domain/constants/weapon_constants';
import { HOSTILE_EFFECTS } from '../../domain/constants/faction_constants';
import { isStationHostile } from '../../systems/reputation/faction_system';
import {
  createProjectile,
  updateProjectile,
  checkProjectileCollision,
  canFireWeapon,
  getFireEnergyCost,
} from '../../systems/combat/weapon_systems';
import {
  updateNpcAggression,
  shouldNpcFire,
  npcFireAtPlayer,
} from '../../systems/combat/ai_combat';
import type { Ship, Station, NpcTrader } from '../../domain/types/world_types';
import type { Projectile, ShipWeapon } from '../../domain/types/combat_types';

/**
 * Result of combat system update
 */
export interface CombatUpdateResult {
  ship: Ship;
  npcTraders: NpcTrader[];
  projectiles: Projectile[];
  npcAggression: Record<string, any>;
  npcLastFireTimes: Record<string, number>;
  reputationChanges: Array<{ stationId: string; delta: number }>;
  missionNpcDestroyedEvents: Array<{ npcId: string; missionId?: string }>;
}

/**
 * Update combat system for one frame
 * 
 * @param state - Current game state relevant to combat
 * @param dt - Delta time in seconds
 * @returns Updated combat state including damage events
 */
export function updateCombat(
  state: {
    ship: Ship;
    npcTraders: NpcTrader[];
    projectiles: Projectile[];
    npcAggression: Record<string, any>;
    npcLastFireTimes: Record<string, number>;
    lastFireTime: number;
    stations: Station[];
  },
  dt: number
): CombatUpdateResult {
  let ship = { ...state.ship };
  let npcTraders = [...state.npcTraders];
  let projectiles = [...state.projectiles];
  const npcAggression = { ...state.npcAggression };
  const npcLastFireTimes = { ...state.npcLastFireTimes };
  const reputationChanges: Array<{ stationId: string; delta: number }> = [];
  const missionNpcDestroyedEvents: Array<{ npcId: string; missionId?: string }> = [];

  if (ship.isDead) {
    return {
      ship,
      npcTraders,
      projectiles: [],
      npcAggression,
      npcLastFireTimes,
      reputationChanges,
      missionNpcDestroyedEvents,
    };
  }

  // Energy regeneration (only when not docked)
  if (!ship.dockedStationId) {
    ship.energy = Math.min(ship.maxEnergy, ship.energy + ENERGY_REGEN_RATE * dt);
  }

  // Update projectiles
  projectiles = projectiles
    .map(p => updateProjectile(p, dt))
    .filter(p => p.lifetime > 0);

  const currentTime = Date.now();
  const damageEvents: Array<{
    targetId: string;
    targetType: 'player' | 'npc';
    damage: number;
    sourceId: string;
    sourceType: 'player' | 'npc';
  }> = [];

  // Check projectile collisions
  const projectilesToRemove = new Set<string>();
  for (const projectile of projectiles) {
    const collision = checkProjectileCollision(projectile, ship, npcTraders);
    if (collision) {
      damageEvents.push(collision);
      projectilesToRemove.add(projectile.id);
    }
  }

  // Remove projectiles that hit
  projectiles = projectiles.filter(p => !projectilesToRemove.has(p.id));

  // Apply damage and update aggression
  for (const event of damageEvents) {
    if (event.targetType === 'player') {
      ship.hp = Math.max(0, ship.hp - event.damage);
      if (ship.hp <= 0) {
        ship.isDead = true;
        ship.velocity = [0, 0, 0];
        ship.enginePower = 0;
        ship.engineTarget = 0;
      }
    } else {
      // Damage to NPC
      npcTraders = npcTraders.map(npc => {
        if (npc.id === event.targetId) {
          const newHp = Math.max(0, npc.hp - event.damage);

          // Update aggression if hit by player
          if (event.sourceType === 'player') {
            const aggressionState = updateNpcAggression(
              npc,
              npcAggression[npc.id],
              currentTime,
              true
            );
            npcAggression[npc.id] = aggressionState;

            // Apply reputation loss for hitting NPC
            if (!npc.isHostile) {
              reputationChanges.push({ stationId: npc.fromId, delta: REP_LOSS_PER_HIT });
            }
          }

          return { ...npc, hp: newHp };
        }
        return npc;
      });
    }
  }

  // Update NPC aggression states (decay over time)
  for (const npcId of Object.keys(npcAggression)) {
    const npc = npcTraders.find(n => n.id === npcId);
    if (npc) {
      npcAggression[npcId] = updateNpcAggression(
        npc,
        npcAggression[npcId],
        currentTime,
        false
      );
    }
  }

  // NPC combat AI - fire back when aggressive
  for (const npc of npcTraders) {
    if (npc.hp <= 0) continue;

    const aggressionState = npcAggression[npc.id];
    const lastFire = npcLastFireTimes[npc.id] || 0;

    if (shouldNpcFire(npc, npc.hp, ship, aggressionState, lastFire, currentTime)) {
      const npcProjectile = npcFireAtPlayer(npc, ship);
      projectiles.push(npcProjectile);
      npcLastFireTimes[npc.id] = currentTime;
    }
  }

  // Handle NPC destruction (hp <= 0)
  const destroyedNpcs = npcTraders.filter(npc => npc.hp <= 0);

  for (const destroyed of destroyedNpcs) {
    // Track mission NPC destruction
    if (destroyed.isMissionTarget && destroyed.missionId) {
      missionNpcDestroyedEvents.push({
        npcId: destroyed.id,
        missionId: destroyed.missionId,
      });
    }

    // Apply reputation loss for kill
    if (!destroyed.isHostile) {
      reputationChanges.push({ stationId: destroyed.fromId, delta: REP_LOSS_PER_NPC_KILL });
    }

    // Drop cargo (simple: add to a nearby "debris" - for now, skip actual spawning)
    // Cargo drops are handled in the store tick (spawns debris VFX + collectibles)
  }

  // Remove dead NPCs
  npcTraders = npcTraders.filter(npc => npc.hp > 0);

  return {
    ship,
    npcTraders,
    projectiles,
    npcAggression,
    npcLastFireTimes,
    reputationChanges,
    missionNpcDestroyedEvents,
  };
}

/**
 * Spawn hostile defenders near hostile stations
 * 
 * @param npcTraders - Current NPC traders
 * @param stations - All stations
 * @param playerPos - Player ship position
 * @param isDocked - Whether player is docked
 * @returns Updated NPC traders with new defenders
 */
export function spawnHostileDefenders(
  npcTraders: NpcTrader[],
  stations: Station[],
  playerPos: [number, number, number],
  isDocked: boolean
): NpcTrader[] {
  if (isDocked) return npcTraders; // Only check when player is flying

  let updatedNpcTraders = [...npcTraders];

  for (const station of stations) {
    if (isStationHostile(station)) {
      const distToStation = distance(playerPos, station.position);

      // Spawn defenders if player is within defense spawn range
      if (distToStation < HOSTILE_EFFECTS.DEFENSE_SPAWN_DISTANCE) {
        // Check if we already have defenders for this station
        const existingDefenders = updatedNpcTraders.filter(
          npc =>
            npc.isHostile &&
            npc.fromId === station.id &&
            npc.id.startsWith(`defender:${station.id}`)
        );

        const needDefenders = HOSTILE_EFFECTS.DEFENDER_COUNT - existingDefenders.length;

        if (needDefenders > 0) {
          // Spawn new defenders
          for (let i = 0; i < needDefenders; i++) {
            const angle = (Math.PI * 2 * i) / HOSTILE_EFFECTS.DEFENDER_COUNT;
            const spawnRadius = HOSTILE_EFFECTS.DEFENSE_SPAWN_DISTANCE * 0.6;
            const defenderPos: [number, number, number] = [
              station.position[0] + Math.cos(angle) * spawnRadius,
              station.position[1],
              station.position[2] + Math.sin(angle) * spawnRadius,
            ];

            const defender: NpcTrader = {
              id: `defender:${station.id}:${Date.now()}:${i}`,
              fromId: station.id,
              toId: station.id, // Defenders patrol around station
              position: defenderPos,
              velocity: [0, 0, 0],
              speed: 1.5, // Faster than normal traders
              hp: NPC_BASE_HP * 2, // Tougher than normal NPCs
              maxHp: NPC_BASE_HP * 2,
              isHostile: true,
              isAggressive: true, // Attack player on sight
              kind: 'clipper', // Fast combat ship
            };

            updatedNpcTraders.push(defender);
          }
        }
      }
    }
  }

  return updatedNpcTraders;
}

/**
 * Fire player weapon
 * 
 * @param ship - Player ship
 * @param lastFireTime - Last time weapon was fired
 * @param targetPos - Optional target position for homing projectiles
 * @returns Updated ship and new projectile, or null if can't fire
 */
export function firePlayerWeapon(
  ship: Ship,
  lastFireTime: number,
  targetPos: [number, number, number] | null
): { ship: Ship; projectile: Projectile } | null {
  // Can't fire while docked
  if (ship.dockedStationId) return null;

  const currentTime = Date.now();
  const weapon = ship.weapon;

  // Check fire rate cooldown
  if (!canFireWeapon(weapon, lastFireTime, currentTime)) {
    return null;
  }

  // Check energy cost
  const energyCost = getFireEnergyCost(weapon);
  if (ship.energy < energyCost) {
    return null;
  }

  // Create projectile
  const projectile = createProjectile(
    weapon,
    ship.position,
    ship.velocity,
    targetPos,
    'player',
    'player'
  );

  const updatedShip = {
    ...ship,
    energy: ship.energy - energyCost,
  };

  return { ship: updatedShip, projectile };
}

/**
 * Upgrade player weapon
 * 
 * @param ship - Player ship
 * @param upgradeType - Type of upgrade (damage, fireRate, range)
 * @param cost - Cost of upgrade
 * @returns Updated ship with upgraded weapon, or null if can't upgrade
 */
export function upgradePlayerWeapon(
  ship: Ship,
  upgradeType: 'damage' | 'fireRate' | 'range',
  cost: number
): Ship | null {
  if (ship.credits < cost) return null;

  const weapon = { ...ship.weapon };
  const maxLevel = WEAPON_UPGRADE_MAX_LEVELS[upgradeType];

  if (upgradeType === 'damage') {
    if (weapon.damageLevel >= maxLevel) return null;
    weapon.damageLevel += 1;
  } else if (upgradeType === 'fireRate') {
    if (weapon.fireRateLevel >= maxLevel) return null;
    weapon.fireRateLevel += 1;
  } else if (upgradeType === 'range') {
    if (weapon.rangeLevel >= maxLevel) return null;
    weapon.rangeLevel += 1;
  }

  return {
    ...ship,
    credits: ship.credits - cost,
    weapon,
  };
}

/**
 * Purchase new weapon
 * 
 * @param ship - Player ship
 * @param weaponKind - Type of weapon to purchase
 * @param cost - Cost of weapon
 * @returns Updated ship with new weapon, or null if can't purchase
 */
export function purchasePlayerWeapon(
  ship: Ship,
  weaponKind: 'laser' | 'plasma' | 'railgun' | 'missile',
  cost: number,
  hasMarketIntel: boolean
): Ship | null {
  if (ship.credits < cost) return null;

  // Can't buy missile launcher without Market Intel
  if (weaponKind === 'missile' && !hasMarketIntel) return null;

  const weapon: ShipWeapon = {
    ...WEAPON_BASE_STATS[weaponKind],
    damageLevel: 0,
    fireRateLevel: 0,
    rangeLevel: 0,
  };

  return {
    ...ship,
    credits: ship.credits - cost,
    weapon,
  };
}

