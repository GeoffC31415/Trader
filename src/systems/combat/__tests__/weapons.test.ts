import { describe, it, expect } from 'vitest';
import { createShip } from '../../../domain/registries/ship_registry';
import { WEAPON_BASE_STATS } from '../../../domain/constants/weapon_constants';
import { createProjectile, checkProjectileCollision, updateProjectile, getWeaponStats } from '../weapon_systems';
import { shouldNpcFire } from '../ai_combat';
import type { NpcTrader } from '../../../domain/types/world_types';
const ship = createShip('freighter', [0, 0, 0]);
const npc = (id: string, x: number): NpcTrader => ({ id, position: [x, 0, 0], hp: 80, maxHp: 80, fromId: 'a', toId: 'b' });
const shot = () => createProjectile(ship.weapon, ship.position, [0, 0, 0], [100, 0, 0], 'player', 'player');
describe('ranged combat', () => {
  it('hits the first target along the aimed beam', () => {
    expect(checkProjectileCollision(shot(), ship, [npc('far', 200), npc('near', 100)])?.targetId).toBe('near');
  });
  it('never hits behind the player or beyond range', () => {
    expect(checkProjectileCollision(shot(), ship, [npc('behind', -100), npc('too far', 900)])).toBeNull();
  });
  it('sweeps fast projectiles instead of tunneling', () => {
    const p = createProjectile({ ...ship.weapon, ...WEAPON_BASE_STATS.railgun }, ship.position, [0, 0, 0], [100, 0, 0], 'player', 'player');
    expect(checkProjectileCollision(updateProjectile(p, 0.25), ship, [npc('target', 100)])?.targetId).toBe('target');
  });
  it('lets hostile NPCs fire without waiting to be attacked', () => {
    expect(shouldNpcFire({ ...npc('enemy', 100), isHostile: true }, 80, ship, undefined, 0, 10000)).toBe(true);
  });
  it('lets enemy beams damage escorts, not a docked player', () => {
    const p = createProjectile(ship.weapon, [0, 0, 0], [0, 0, 0], [100, 0, 0], 'enemy', 'npc');
    expect(checkProjectileCollision(p, { ...ship, dockedStationId: 'a' }, [{ ...npc('escort', 100), isMissionEscort: true }])?.targetId).toBe('escort');
  });
  it('preserves custom NPC weapon stats', () => {
    expect(getWeaponStats({ ...ship.weapon, damage: 8 }).damage).toBe(8);
  });
});
