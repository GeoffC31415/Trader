import { describe, expect, it } from 'vitest';
import { WORLD_EFFECTS, applyChoicePermanentEffects, projectWorldEffects } from '../choice_system';
import { MISSION_TEMPLATES } from '../../../domain/constants/mission_constants';
import { useGameStore } from '../../../state/store';
import { updateStationProduction } from '../../../state/modules/economy_production';
import { createShip } from '../../../domain/registries/ship_registry';
import { updateCargoFreshness } from '../../../state/modules/cargo_freshness';
import { shouldSpawnEvent } from '../../economy/market_events';

describe('executable world consequences', () => {
  it('has a handler for every authored consequence', () => {
    for (const t of Object.values(MISSION_TEMPLATES)) for (const id of [...(t.rewards.permanentEffects ?? []), ...(t.choiceOptions ?? []).flatMap(c => c.rewards.permanentEffects ?? [])]) expect(WORLD_EFFECTS[id], id).toBeDefined();
  });
  it('composes multiple effects without replacing prior rewards or accumulating discounts each tick', () => {
    let s = useGameStore.getInitialState();
    s = { ...s, stations: s.stations.map(st => ({ ...st, reputation: 50 })) };
    const original = s.stations.find(st => st.id === 'greenfields')!.inventory.grain.buy;
    s = { ...s, ...applyChoicePermanentEffects(s, ['greenfields_food_discount', 'aurum_production_boost']) };
    for (let i = 0; i < 100; i++) s = { ...s, ...projectWorldEffects(s) };
    expect(s.stations.find(st => st.id === 'greenfields')!.inventory.grain.buy).toBe(Math.round(original * 0.95));
    expect(s.stations.find(st => st.id === 'aurum-fab')!.productionMultiplier).toBe(1.1);
    expect(s.stations.every(st => st.reputation === 50)).toBe(true);
    expect(applyChoicePermanentEffects(s, ['greenfields_food_discount']).appliedEffects).toHaveLength(2);
  });
  it('expires temporary effects and restores base prices', () => {
    let s = useGameStore.getInitialState(); const original = s.stations[0].inventory.grain.buy;
    s = { ...s, ...applyChoicePermanentEffects(s, ['corporate_price_increase_temp']) };
    expect(s.stations[0].inventory.grain.buy).toBe(Math.round(original * 1.2));
    s = { ...s, gameTime: 480 }; s = { ...s, ...projectWorldEffects(s) };
    expect(s.stations[0].inventory.grain.buy).toBe(original);
  });
  it('establishes an actual Freeport fuel producer', () => {
    let s = useGameStore.getInitialState();
    s = { ...s, ...applyChoicePermanentEffects(s, ['freeport_refinery_established']) };
    s.stations = s.stations.map(st => st.id === 'freeport' ? { ...st, inventory: { ...st.inventory, refined_fuel: { ...st.inventory.refined_fuel, stock: 0 } } } : st);
    const after = updateStationProduction(s.stations, 60).find(st => st.id === 'freeport')!;
    expect(after.inventory.refined_fuel.stock).toBe(12); expect(after.inventory.refined_fuel.canSell).toBe(true);
  });
  it('preserves food in dock and makes refrigeration meaningful in flight', () => {
    const ship = createShip('freighter', [0, 0, 0], { cargo: { meat: 10 }, hasTempCargo: true });
    expect(updateCargoFreshness(ship, 300).cargoFreshness!.meat).toBeCloseTo(0.8);
    expect(updateCargoFreshness({ ...ship, dockedStationId: 'a' }, 300).cargoFreshness?.meat ?? 1).toBe(1);
  });
  it('uses simulation time for the first market event', () => {
    expect(shouldSpawnEvent(undefined, 119999)).toBe(false);
    expect(shouldSpawnEvent(undefined, 120000)).toBe(true);
  });
});
