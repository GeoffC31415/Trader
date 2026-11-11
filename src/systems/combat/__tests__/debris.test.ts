import { afterEach, expect, it } from 'vitest';
import { useGameStore } from '../../../state/store';
import { collectDebris, updateDebris } from '../debris';
import { createProjectile } from '../weapon_systems';
import { WEAPON_BASE_STATS } from '../../../domain/constants/weapon_constants';
import { createFinance } from '../../finance';
import { serializeGame, deserializeGame } from '../../persistence';
import type { Debris, GameState } from '../../../domain/types/world_types';
const original = useGameStore.getState();
afterEach(() => useGameStore.setState(original, true));
function setup(): GameState {
  const s = useGameStore.getInitialState();
  return { ...s, hasChosenStarter: true, paused: false, ship: { ...s.ship, position: [0, 0, 0], dockedStationId: undefined, cargo: {} },
    npcTraders: [], debris: [], finance: createFinance(s.stations, 0), nextMarketEventAt: 99999, nextOpportunityAt: 99999 };
}
function crate(cargo: Record<string, number> = { iron_ore: 4 }): Debris {
  return { id: 'crate', position: [0, 0, 0], cargo, unitCosts: Object.fromEntries(Object.keys(cargo).map(id => [id, 0])), createdAt: 0, lifetime: 60000 };
}
it('collects only what fits, preserving crate residuals without cloning partial or repeated pickups', () => {
  let s = setup(); s = { ...s, ship: { ...s.ship, maxCargo: 4, cargo: { iron_ore: 2 } }, debris: [crate()], avgCostByCommodity: { iron_ore: 20 },
    finance: { ...s.finance!, warehouses: { 'sol-city': { goods: { iron_ore: 6 }, freshness: {} } } } };
  s = collectDebris(s); expect(s.ship.cargo.iron_ore).toBe(4); expect(s.debris![0].cargo.iron_ore).toBe(2);
  expect(s.avgCostByCommodity.iron_ore).toBe(16); expect(collectDebris(s)).toBe(s);
  s = collectDebris({ ...s, ship: { ...s.ship, maxCargo: 6 } });
  expect(s.ship.cargo.iron_ore).toBe(6); expect(s.debris).toEqual([]); expect(collectDebris(s).ship.cargo.iron_ore).toBe(6);
});
it('requires living, undocked, unpaused access, proximity, free space and cargo equipment', () => {
  const s = { ...setup(), debris: [crate({ meat: 4 })] };
  for (const next of [{ ...s, paused: true }, { ...s, ship: { ...s.ship, hp: 0 } }, { ...s, ship: { ...s.ship, dockedStationId: 'sol-city' } },
    { ...s, ship: { ...s.ship, position: [20, 0, 0] as [number, number, number] } }, s]) expect(collectDebris(next).ship.cargo.meat).toBeUndefined();
  expect(collectDebris({ ...s, ship: { ...s.ship, hasTempCargo: true } }).ship.cargo.meat).toBe(4);
});
it('does not invent a known zero cost for unknown older holdings, and blends actual freshness', () => {
  const s = setup();
  const next = collectDebris({ ...s, ship: { ...s.ship, cargo: { meat: 2 }, hasTempCargo: true, cargoFreshness: { meat: .5 } }, debris: [crate({ meat: 2 })], avgCostByCommodity: {} });
  expect(next.avgCostByCommodity.meat).toBeUndefined(); expect(next.ship.cargoFreshness!.meat).toBe(.75);
});
it('keeps known acquisition cost when recovering owned escort cargo', () => {
  const s = { ...setup(), avgCostByCommodity: { iron_ore: 20 } };
  const next = updateDebris(s, [{ id: 'escort', fromId: 'sol-city', toId: 'freeport', position: [0, 0, 0], hp: 1, maxHp: 10, commodityId: 'iron_ore', isEscort: true, escortCargoUsed: 10, cargoCapacity: 100 }]);
  expect(next.ship.cargo.iron_ore).toBe(5); expect(next.avgCostByCommodity.iron_ore).toBe(20);
});
it('expires and bounds debris on simulation time, freezing its lifetime when paused', () => {
  useGameStore.setState({ ...setup(), gameTime: 59.9, paused: true, debris: [{ ...crate(), position: [100, 0, 0] }] }, true);
  useGameStore.getState().tick(.1); expect(useGameStore.getState().debris).toHaveLength(1);
  useGameStore.setState({ paused: false }); useGameStore.getState().tick(.1); expect(useGameStore.getState().debris).toEqual([]);
  const s = setup(); const debris = Array.from({ length: 80 }, (_, i) => ({ ...crate(), id: `crate:${i}`, position: [100, 0, 0] as [number, number, number] }));
  expect(updateDebris({ ...s, debris }, []).debris).toHaveLength(64);
});
it('creates one drop for a real projectile kill, not again on subsequent ticks or ordinary NPC removal', () => {
  const s = setup(); const enemy = { id: 'trader', fromId: 'sol-city', toId: 'freeport', position: [50, 0, 0] as [number, number, number], hp: 1, maxHp: 10, commodityId: 'iron_ore', cargoCapacity: 10, speed: 0 };
  const weapon = { ...WEAPON_BASE_STATS.laser, damage: 100, damageLevel: 0, rangeLevel: 0, fireRateLevel: 0 };
  useGameStore.setState({ ...s, npcTraders: [enemy], projectiles: [createProjectile(weapon, s.ship.position, [0, 0, 0], enemy.position, 'player', 'player')] }, true);
  useGameStore.getState().tick(.1); expect(useGameStore.getState().debris).toHaveLength(1); expect(useGameStore.getState().debris![0].cargo.iron_ore).toBe(5);
  useGameStore.getState().tick(.1); expect(useGameStore.getState().debris).toHaveLength(1);
  useGameStore.setState({ npcTraders: [{ ...enemy, id: 'despawn', despawnAt: 0 }] }); useGameStore.getState().tick(.1); expect(useGameStore.getState().debris).toHaveLength(1);
});
it('clears transient loot and target lock on checkpoint load without restoring an obsolete death charge', () => {
  const s = { ...setup(), debris: [crate()], selectedTargetId: 'trader' };
  const loaded = deserializeGame(serializeGame(s)); expect(loaded.debris).toEqual([]); expect(loaded.selectedTargetId).toBeUndefined();
  expect(loaded.ship!.credits).toBe(s.ship.credits);
});
