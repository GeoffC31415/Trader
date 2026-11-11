import { afterEach, expect, it } from 'vitest';
import { useGameStore } from '../../store';
import { updateCombat } from '../combat';
import { createProjectile } from '../../../systems/combat/weapon_systems';
import { WEAPON_BASE_STATS } from '../../../domain/constants/weapon_constants';
import { impactStrength, hullSeverity } from '../../../systems/combat/feedback';
import { dockingCandidate } from '../../helpers/docking';
const initial = useGameStore.getInitialState(), original = useGameStore.getState();
afterEach(() => useGameStore.setState(original, true));
it('emits one damage-scaled impact for actual hull damage, not missed/resolved shots or overkill', () => {
  const ship = { ...initial.ship, position: [0, 0, 0] as [number, number, number], dockedStationId: undefined };
  const enemy = { id: 'enemy', fromId: 'sol-city', toId: 'sol-city', position: [100, 0, 0] as [number, number, number], hp: 7, maxHp: 70 };
  const weapon = { ...WEAPON_BASE_STATS.laser, damage: 100, damageLevel: 0, rangeLevel: 0, fireRateLevel: 0 };
  const state = { ...initial, ship, npcTraders: [enemy], now: 1000, projectiles: [createProjectile(weapon, ship.position, [0, 0, 0], enemy.position, 'player', 'player')] };
  const hit = updateCombat(state, 0.1);
  expect(hit.combatImpacts).toEqual([expect.objectContaining({ targetId: 'enemy', damage: 7, at: 1, position: enemy.position })]);
  expect(updateCombat({ ...state, ...hit, now: 1100 }, 0.1).combatImpacts).toEqual([]);
  const incoming = updateCombat({ ...state, npcTraders: [], projectiles: [createProjectile(weapon, enemy.position, [0, 0, 0], ship.position, 'enemy', 'npc')] }, 0.1);
  expect(incoming.combatImpacts[0].targetId).toBe('player'); expect(incoming.combatImpacts[0].damage).toBe(100);
});
it('expires visual impacts on the simulation clock, keeping them transient and bounded', () => {
  useGameStore.setState({ ...initial, hasChosenStarter: true, paused: false, npcTraders: [], gameTime: 10, combatImpacts: Array.from({ length: 80 }, (_, i) => ({ id: `${i}`, targetId: 'player', damage: 3, at: 10, position: [0, 0, 0] as [number, number, number] })) }, true);
  useGameStore.getState().tick(0.1); expect(useGameStore.getState().combatImpacts).toHaveLength(48);
  for (let i = 0; i < 10; i++) useGameStore.getState().tick(0.1);
  expect(useGameStore.getState().combatImpacts).toEqual([]);
});
it('scales hit effects and persistent hull damage safely, including large or invalid values', () => {
  expect(impactStrength(30)).toBeGreaterThan(impactStrength(3)); expect(impactStrength(100000)).toBe(3);
  expect(impactStrength(NaN)).toBe(0); expect(impactStrength(-3)).toBe(0);
  expect(hullSeverity(50, 100)).toBe(0.5); expect(hullSeverity(10, 100)).toBeGreaterThan(0.65); expect(hullSeverity(100, 100)).toBe(0);
});
it('uses one close berth for prompts and E, with no docking sixty metres away', () => {
  const city = initial.stations.find(st => st.id === 'sol-city')!;
  expect(dockingCandidate(initial.stations, [city.position[0] + 16, city.position[1], city.position[2]])).toBeUndefined();
  expect(dockingCandidate(initial.stations, [city.position[0] + 10, city.position[1], city.position[2]])?.id).toBe(city.id);
  useGameStore.setState({ ...initial, hasChosenStarter: true, ship: { ...initial.ship, position: [city.position[0] + 16, city.position[1], city.position[2]] } }, true);
  useGameStore.getState().tryDock(); expect(useGameStore.getState().ship.dockedStationId).toBeUndefined();
});
