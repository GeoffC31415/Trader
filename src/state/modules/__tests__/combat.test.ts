import { describe, it, expect } from 'vitest';
import { updateCombat } from '../combat';
import { NPC_BASE_HP, PLAYER_MAX_HP, PLAYER_MAX_ENERGY } from '../../../domain/constants/weapon_constants';
import type { Ship, NpcTrader, Station } from '../../../domain/types/world_types';
import type { Projectile } from '../../../domain/types/combat_types';

describe('updateCombat', () => {
  const createTestShip = (): Ship => ({
    position: [0, 0, 0],
    velocity: [0, 0, 0],
    credits: 1000,
    cargo: {},
    maxCargo: 100,
    dockedStationId: undefined,
    canMine: false,
    enginePower: 0,
    engineTarget: 0,
    hasNavigationArray: false,
    hasUnionMembership: false,
    hasMarketIntel: false,
    kind: 'freighter',
    stats: { acc: 10, drag: 1.0, vmax: 10 },
    weapon: { kind: 'laser', damage: 10, fireRate: 1, range: 50, damageLevel: 0, fireRateLevel: 0, rangeLevel: 0 },
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP,
    energy: PLAYER_MAX_ENERGY,
    maxEnergy: PLAYER_MAX_ENERGY,
  });

  const createTestNpc = (id: string, position: [number, number, number] = [10, 0, 10]): NpcTrader => ({
    id,
    fromId: 'station1',
    toId: 'station2',
    position,
    velocity: [0, 0, 0],
    hp: NPC_BASE_HP,
    maxHp: NPC_BASE_HP,
    isHostile: false,
  });

  it('regenerates energy when not docked', () => {
    const ship = createTestShip();
    ship.energy = 50;
    ship.dockedStationId = undefined;

    const result = updateCombat(
      {
        ship,
        npcTraders: [],
        projectiles: [],
        npcAggression: {},
        npcLastFireTimes: {},
        lastFireTime: 0,
        stations: [],
      },
      1.0 // 1 second
    );

    expect(result.ship.energy).toBeGreaterThan(50);
  });

  it('does not regenerate energy when docked', () => {
    const ship = createTestShip();
    ship.energy = 50;
    ship.dockedStationId = 'station1';

    const result = updateCombat(
      {
        ship,
        npcTraders: [],
        projectiles: [],
        npcAggression: {},
        npcLastFireTimes: {},
        lastFireTime: 0,
        stations: [],
      },
      1.0
    );

    expect(result.ship.energy).toBe(50);
  });

  it('removes projectiles that hit targets', () => {
    const ship = createTestShip();
    const npc = createTestNpc('npc1', [5, 0, 5]); // Close to player
    
    const projectile: Projectile = {
      id: 'proj1',
      ownerId: 'player',
      ownerType: 'player',
      position: [5, 0, 5],
      velocity: [0, 0, 0],
      damage: 20,
      lifetime: 1.0,
      maxLifetime: 1.0,
      weaponKind: 'laser',
    };

    const result = updateCombat(
      {
        ship,
        npcTraders: [npc],
        projectiles: [projectile],
        npcAggression: {},
        npcLastFireTimes: {},
        lastFireTime: 0,
        stations: [],
      },
      0.1
    );

    // Projectile should be removed after hit
    expect(result.projectiles.length).toBeLessThan(1);
  });
});

