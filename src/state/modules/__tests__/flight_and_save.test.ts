import { describe, it, expect } from 'vitest';
import { createShip, getAllShipKinds } from '../../../domain/registries/ship_registry';
import { applyThrust, updatePhysics } from '../physics';
import { serializeGame, deserializeGame } from '../../../systems/persistence';
import { useGameStore } from '../../store';
import { createEscortState } from '../../../systems/missions/escort_system';

describe('flight pacing and recovery', () => {
  for (const kind of getAllShipKinds()) it(`${kind} reaches its advertised speed`, () => {
    let s = createShip(kind, [0, 0, 0]);
    for (let i = 0; i < 600; i++) s = updatePhysics(applyThrust(s, [1, 0, 0], 1 / 60), 1 / 60);
    expect(s.velocity[0]).toBeCloseTo(s.stats.vmax);
  });
  it('cruise spools for three seconds and shortens a 1200m trip', () => {
    let s = createShip('freighter', [0, 0, 0], { cruise: true });
    for (let i = 0; i < 180; i++) s = updatePhysics(applyThrust(s, [1, 0, 0], 1 / 60), 1 / 60);
    expect(s.velocity[0]).toBeLessThanOrEqual(s.stats.vmax);
    for (let i = 0; i < 22 * 60; i++) s = updatePhysics(applyThrust(s, [1, 0, 0], 1 / 60), 1 / 60);
    expect(s.position[0]).toBeGreaterThan(1200);
  });
  it('silent running trades speed for lower signature', () => {
    let s = createShip('clipper', [0, 0, 0], { silentRunning: true });
    for (let i = 0; i < 600; i++) s = updatePhysics(applyThrust(s, [1, 0, 0], 1 / 60), 1 / 60);
    expect(s.velocity[0]).toBeCloseTo(s.stats.vmax / 2);
  });
  it('round-trips maps and returns to a paused checkpoint', () => {
    const s = { ...useGameStore.getInitialState(), hasChosenStarter: true, gameTime: 100 };
    s.escortStates = new Map([['m:e', createEscortState('m', 'e', 'freeport', 100)]]);
    s.stealthStates = new Map([['m:s', { stationId: 'sol-city', suspicionLevel: 20, detected: false }]]);
    const saved = deserializeGame(serializeGame(s));
    expect(saved.escortStates).toEqual(s.escortStates);
    expect(saved.stealthStates).toEqual(s.stealthStates);
    expect(saved.ship).toEqual(s.ship); expect(saved.paused).toBe(true); expect(saved.gameTime).toBe(100);
  });
  it('rejects corrupt and future saves before touching state', () => {
    expect(() => deserializeGame('{')).toThrow();
    expect(() => deserializeGame('{"version":2,"data":{}}')).toThrow();
    const raw = JSON.parse(serializeGame(useGameStore.getInitialState())); raw.data.ship.stats.acc = -2;
    expect(() => deserializeGame(JSON.stringify(raw))).toThrow();
  });
  it('pause freezes deadlines, travel, and combat cooldowns', () => {
    const original = useGameStore.getState();
    useGameStore.setState({ hasChosenStarter: true, paused: true, gameTime: 10 });
    useGameStore.getState().tick(0.1);
    expect(useGameStore.getState().gameTime).toBe(10);
    useGameStore.setState(original, true);
  });
});
