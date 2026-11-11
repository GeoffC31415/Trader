import { describe, it, expect } from 'vitest';
import { tickOpportunities, resolveOpportunity } from '../travel_opportunities';
import { useGameStore } from '../../state/store';
import type { GameState, TravelOpportunity } from '../../domain/types/world_types';
function fixture(): GameState {
  const s = useGameStore.getInitialState();
  return { ...s, hasChosenStarter: true, gameTime: 60, ship: { ...s.ship, position: [1000, 300, 1000], velocity: [10, 0, 0], cargo: {}, dockedStationId: undefined }, npcTraders: [] };
}
function offer(s: GameState, kind: TravelOpportunity['kind'], risky = false): GameState {
  return { ...s, opportunity: { id: 'op', kind, position: [...s.ship.position], stationId: 'sol-city', commodityId: kind === 'salvage' ? 'alloys' : 'refined_fuel', quantity: 3, reward: 600, expiresAt: 180, risky } };
}
describe('optional travel director', () => {
  it('uses deterministic simulation scheduling and only one visible opportunity', () => {
    const s = tickOpportunities(fixture(), () => 0.9);
    expect(s.opportunity?.kind).toBe('salvage');
    expect(tickOpportunities({ ...s, gameTime: 61 }, () => 0.1).opportunity).toEqual(s.opportunity);
    expect(tickOpportunities({ ...fixture(), gameTime: 44 }, () => 0.9).opportunity).toBeUndefined();
  });
  it('can be declined without combat, cost, or mission changes', () => {
    const s = offer(fixture(), 'salvage', true); const result = resolveOpportunity(s, 'decline');
    expect(result.ship).toEqual(s.ship); expect(result.npcTraders).toEqual(s.npcTraders); expect(result.missions).toEqual(s.missions);
  });
  it('requires physical access, cargo space, and exactly-once salvage', () => {
    const s = offer(fixture(), 'salvage');
    expect(resolveOpportunity({ ...s, ship: { ...s.ship, position: [0, 0, 0] } }, 'complete').ship.cargo).toEqual({});
    expect(resolveOpportunity({ ...s, ship: { ...s.ship, maxCargo: 2 } }, 'complete').ship.cargo).toEqual({});
    const won = resolveOpportunity(s, 'complete'); expect(won.ship.cargo.alloys).toBe(3);
    expect(resolveOpportunity(won, 'complete').ship.cargo.alloys).toBe(3);
  });
  it('distress supplies are consumed and improve actual local stock', () => {
    let s = offer(fixture(), 'distress');
    expect(resolveOpportunity(s, 'complete').opportunity).toBeDefined();
    s = { ...s, ship: { ...s.ship, cargo: { refined_fuel: 3 } } };
    const result = resolveOpportunity(s, 'complete');
    expect(result.ship.cargo.refined_fuel).toBe(0); expect(result.ship.credits).toBe(s.ship.credits + 600);
    expect(result.stations[0].inventory.refined_fuel.stock).toBe((s.stations[0].inventory.refined_fuel.stock ?? 0) + 3);
  });
  it('procurement requires docking rather than a remote payout', () => {
    let s = offer(fixture(), 'procurement'); s = { ...s, ship: { ...s.ship, cargo: { refined_fuel: 3 } } };
    expect(resolveOpportunity(s, 'complete').opportunity).toBeDefined();
    expect(resolveOpportunity({ ...s, ship: { ...s.ship, dockedStationId: 'sol-city' } }, 'complete').opportunity).toBeUndefined();
  });
  it('only an explicitly accepted risky cache creates a bounded raider', () => {
    const s = offer(fixture(), 'salvage', true); const result = resolveOpportunity(s, 'complete');
    expect(result.npcTraders).toHaveLength(1); expect(result.npcTraders[0].despawnAt).toBe(s.gameTime + 90);
  });
});
