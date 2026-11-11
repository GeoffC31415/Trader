import { afterEach, expect, it } from 'vitest';
import { useGameStore } from '../../store';
import { createMissionFromTemplate } from '../../../systems/missions/mission_generator';
import { MISSION_TEMPLATES } from '../../../domain/constants/mission_constants';
import { generateContracts, contractUnitPayout } from '../missions';
import { serializeGame, deserializeGame } from '../../../systems/persistence';
import type { Contract } from '../../../domain/types/world_types';
const original = useGameStore.getState();
afterEach(() => useGameStore.setState(original, true));
function setup(stationId = 'sol-city') {
  const initial = useGameStore.getInitialState();
  const station = initial.stations.find(st => st.id === stationId)!;
  useGameStore.setState({ ...initial, hasChosenStarter: true, paused: false, npcTraders: [],
    ship: { ...initial.ship, position: [...station.position], dockedStationId: stationId, credits: 10000 },
    stations: initial.stations.map(st => ({ ...st, reputation: 0 })),
  }, true);
}
function fuelOrder(): Contract {
  return { id: 'fuel', offeredById: 'sol-city', toId: 'sol-city', fromId: 'freeport', commodityId: 'refined_fuel', units: 4, unitBuy: 100, unitSell: 105, rewardBonus: 200, status: 'offered' };
}
function dock(id: string) {
  const s = useGameStore.getState();
  useGameStore.setState({ ship: { ...s.ship, dockedStationId: id, position: [...s.stations.find(st => st.id === id)!.position] } });
}
function price(id: string, buy: number, sell: number) {
  useGameStore.setState(s => ({ stations: s.stations.map(st => st.id === id ? { ...st, inventory: { ...st.inventory, refined_fuel: { ...st.inventory.refined_fuel, buy, sell, stock: 100, canBuy: true, canSell: true } } } : st) }));
}
function story() {
  setup('greenfields');
  useGameStore.setState({ missions: [createMissionFromTemplate(MISSION_TEMPLATES.greenfields_stage_1)] });
  useGameStore.getState().acceptMission('greenfields_stage_1');
}
it('sizes delivery offers to available working capital rather than unaffordable forty-unit lots', () => {
  setup(); const s = useGameStore.getState();
  const offers = generateContracts(s.stations, [], s.ship);
  expect(offers.length).toBeGreaterThan(0);
  expect(offers.every(c => c.units * c.unitBuy! <= s.ship.credits * 0.8)).toBe(true);
});
it('credits actual market-sale revenue without needing a contract or a completion bonus', () => {
  setup(); const s = useGameStore.getState();
  useGameStore.setState({ ship: { ...s.ship, cargo: { refined_fuel: 5 } }, contracts: [], avgCostByCommodity: { refined_fuel: 10 } });
  price('sol-city', 25, 20);
  useGameStore.getState().sell('refined_fuel', 5);
  expect(useGameStore.getState().ship.credits).toBe(10100);
  expect(useGameStore.getState().ship.cargo.refined_fuel).toBe(0);
  useGameStore.getState().sell('refined_fuel', 5);
  expect(useGameStore.getState().ship.credits).toBe(10100);
});
it('locks profitable delivery payment, accepts another supplier and pays partial deliveries despite a market crash', () => {
  setup(); useGameStore.setState({ contracts: [fuelOrder()] });
  useGameStore.getState().acceptContract('fuel');
  expect(useGameStore.getState().trackedStationId).toBe('sol-city');
  const payout = contractUnitPayout(useGameStore.getState().contracts![0]);
  expect(payout).toBeGreaterThan(100);
  dock('sol-refinery'); price('sol-refinery', 100, 1);
  useGameStore.getState().buy('refined_fuel', 4);
  expect(useGameStore.getState().ship.credits).toBe(9600);
  dock('sol-city'); price('sol-city', 1, 1);
  useGameStore.getState().sell('refined_fuel', 2);
  expect(useGameStore.getState().ship.credits).toBe(9600 + 2 * payout);
  expect(useGameStore.getState().contracts![0].status).toBe('accepted');
  price('sol-city', 1, 1);
  useGameStore.getState().sell('refined_fuel', 2);
  const done = useGameStore.getState();
  expect(done.ship.credits).toBe(9600 + 4 * payout + 200);
  expect(done.contracts![0].status).toBe('completed');
  expect(done.activeObjectiveId).toBeUndefined();
  expect(done.tradeLog.slice(-1)[0]?.totalPrice).toBe(2 * payout);
  expect(done.celebrationBuyCost).toBe(400); expect(done.celebrationSellRevenue).toBe(4 * payout);
  done.sell('refined_fuel', 2); expect(useGameStore.getState().ship.credits).toBe(done.ship.credits);
});
it('allocates one bulk sale across multiple matching orders without selling the remainder at an unprotected market rate', () => {
  setup(); useGameStore.setState({ contracts: [fuelOrder(), { ...fuelOrder(), id: 'second' }] });
  useGameStore.getState().acceptContract('fuel'); useGameStore.getState().acceptContract('second');
  dock('sol-refinery'); price('sol-refinery', 100, 1); useGameStore.getState().buy('refined_fuel', 8);
  dock('sol-city'); price('sol-city', 1, 1); useGameStore.getState().sell('refined_fuel', 8);
  const done = useGameStore.getState(); const payout = contractUnitPayout(done.contracts![0]);
  expect(done.contracts!.every(c => c.status === 'completed')).toBe(true);
  expect(done.ship.credits).toBe(10000 - 800 + 8 * payout + 400);
  expect(done.tradeLog.slice(-1)[0].totalPrice).toBe(8 * payout);
});
it('rejects a loss-making contract purchase before spending credits or taking cargo', () => {
  setup(); useGameStore.setState({ contracts: [fuelOrder()] }); useGameStore.getState().acceptContract('fuel');
  dock('sol-refinery'); price('sol-refinery', 500, 1);
  useGameStore.getState().buy('refined_fuel', 4);
  expect(useGameStore.getState().ship.credits).toBe(10000);
  expect(useGameStore.getState().ship.cargo.refined_fuel ?? 0).toBe(0);
  expect(useGameStore.getState().notifications?.slice(-1)[0]?.message).toContain('Purchase blocked');
});
it('checks the lowest active payment floor when buying for several same-commodity orders', () => {
  setup(); useGameStore.setState({ contracts: [{ ...fuelOrder(), id: 'high', unitSell: 250 }, fuelOrder()] });
  useGameStore.getState().acceptContract('high'); useGameStore.getState().acceptContract('fuel');
  dock('sol-refinery'); price('sol-refinery', 120, 1); useGameStore.getState().buy('refined_fuel', 4);
  expect(useGameStore.getState().ship.credits).toBe(10000);
  useGameStore.getState().abandonContract('fuel'); useGameStore.getState().buy('refined_fuel', 4);
  expect(useGameStore.getState().ship.cargo.refined_fuel).toBe(4);
});
it('funds story procurement and reimburses recorded turn-in cost above the advance, without double payment', () => {
  story(); const funded = useGameStore.getState(); const budget = funded.missions[0].procurementBudget!;
  useGameStore.setState({ ship: { ...funded.ship, credits: 30000 + budget } });
  dock('freeport');
  useGameStore.setState(s => ({ stations: s.stations.map(st => st.id === 'freeport' ? { ...st, inventory: { ...st.inventory, luxury_goods: { ...st.inventory.luxury_goods, buy: budget / 10 + 500, stock: 20, canSell: true } } } : st) }));
  useGameStore.getState().buy('luxury_goods', 10);
  expect(useGameStore.getState().ship.cargo.luxury_goods).toBe(10);
  dock('greenfields'); useGameStore.getState().completeMissionObjective('greenfields_stage_1', 'deliver_luxury');
  const done = useGameStore.getState(); expect(done.missions[0].status).toBe('completed');
  expect(done.ship.credits).toBeCloseTo(32000);
  done.completeMissionObjective('greenfields_stage_1', 'deliver_luxury'); expect(useGameStore.getState().ship.credits).toBe(done.ship.credits);
});
it('does not allow Sol City to supply the covert order and exposes contraband on docking there', () => {
  story(); dock('sol-city');
  useGameStore.getState().buy('luxury_goods', 1);
  expect(useGameStore.getState().ship.cargo.luxury_goods ?? 0).toBe(0);
  expect(useGameStore.getState().notifications?.slice(-1)[0]?.message).toContain('covert order');
  const s = useGameStore.getState();
  useGameStore.setState({ ship: { ...s.ship, dockedStationId: undefined, cargo: { luxury_goods: 10 } } });
  useGameStore.getState().tryDock();
  expect(useGameStore.getState().missions[0].status).toBe('failed');
  expect(useGameStore.getState().ship.cargo.luxury_goods).toBe(10);
});
it('clears anger and provides a real recovery ceasefire, ending it only when a shot is fired', () => {
  setup(); const s = useGameStore.getState();
  useGameStore.setState({ gameTime: 10, ship: { ...s.ship, hp: 0, dockedStationId: undefined },
    npcTraders: [{ id: 'angry', fromId: 'sol-city', toId: 'sol-city', position: [...s.ship.position], role: 'turret', hp: 100, maxHp: 100, isAggressive: true, isHostile: true }],
    npcAggression: { angry: { npcId: 'angry', isAggressive: true, lastAttackedTime: 10000 } },
  });
  useGameStore.getState().tick(0.1);
  const recovered = useGameStore.getState(); expect(recovered.npcAggression).toEqual({});
  expect(recovered.npcTraders[0].isAggressive).toBe(false); expect(recovered.recoveryGraceUntil).toBeGreaterThan(recovered.gameTime);
  recovered.dismissDockIntro(); useGameStore.getState().undock();
  for (let i = 0; i < 30; i++) useGameStore.getState().tick(0.1);
  expect(useGameStore.getState().ship.hp).toBe(100); expect(useGameStore.getState().projectiles).toEqual([]);
  useGameStore.getState().fireWeapon([1000, 0, 0]); expect(useGameStore.getState().recoveryGraceUntil).toBeUndefined();
});
it('recovers recorded missing alpha-1 sale credits once, without replaying bonuses or refunding purchases', () => {
  setup(); const snapshot = JSON.parse(serializeGame(useGameStore.getState()));
  delete snapshot.data.economyVersion;
  snapshot.data.tradeLog = [
    { id: 'sale', type: 'sell', time: 1, stationId: 'sol-city', commodityId: 'grain', quantity: 5, unitPrice: 20, totalPrice: 100 },
    { id: 'buy', type: 'buy', time: 2, stationId: 'greenfields', commodityId: 'grain', quantity: 5, unitPrice: 10, totalPrice: 50 },
  ];
  const loaded = deserializeGame(JSON.stringify(snapshot));
  expect(loaded.ship!.credits).toBe(10100); expect(loaded.economyVersion).toBe(2);
  expect(loaded.notifications![0].message).toContain('Recovered 100');
  useGameStore.setState(loaded);
  const again = deserializeGame(serializeGame(useGameStore.getState()));
  expect(again.ship!.credits).toBe(10100); expect(again.notifications).toEqual([]);
});
it('checkpoints preserve purchase-order rates and recovery deadlines, not hit flashes', () => {
  setup(); useGameStore.setState({ contracts: [fuelOrder()] }); useGameStore.getState().acceptContract('fuel');
  useGameStore.setState({ recoveryGraceUntil: 45, combatImpacts: [{ id: 'hit', targetId: 'player', damage: 10, at: 0, position: [0, 0, 0] }] });
  const loaded = deserializeGame(serializeGame(useGameStore.getState()));
  expect(loaded.contracts![0].unitPayout).toBeGreaterThan(100); expect(loaded.recoveryGraceUntil).toBe(45); expect(loaded.combatImpacts).toEqual([]);
});
