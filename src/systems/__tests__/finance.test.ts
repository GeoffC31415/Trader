import { afterEach, expect, it } from 'vitest';
import { useGameStore } from '../../state/store';
import { createFinance, financeAction, tickFinance, transferWarehouse, netAssetValue, recordAssets, fundRisk, BANK_ID } from '../finance';
import { deserializeGame, serializeGame } from '../persistence';
import type { GameState } from '../../domain/types/world_types';
const original = useGameStore.getState();
afterEach(() => useGameStore.setState(original, true));
function setup(port = 'sol-city'): GameState {
  const s = useGameStore.getInitialState();
  useGameStore.setState({ ...s, hasChosenStarter: true, ship: { ...s.ship, cargo: { refined_fuel: 10 }, dockedStationId: port }, npcTraders: [], finance: createFinance(s.stations, 0), journal: undefined, nextMarketEventAt: 99999, nextOpportunityAt: 99999 }, true);
  return useGameStore.getState();
}
it('deposits and withdrawals conserve total assets without counting transfers as income/spending', () => {
  const s = setup(), nav = netAssetValue(s).total;
  s.bankAction('deposit', 4000); s.bankAction('withdraw', 1000);
  const next = useGameStore.getState(); expect(next.ship.credits).toBe(7000); expect(next.finance!.savings).toBe(3000);
  expect(netAssetValue(next).total).toBeCloseTo(nav); expect(next.journal!.otherIncome).toBe(0); expect(next.journal!.otherSpending).toBe(0);
});
it('rejects overdrafts, invalid amounts, inaccessible terminals and offsite borrowing atomically', () => {
  for (const amount of [NaN, Infinity, -1, 0, .001, 10001]) {
    const s = setup(); const next = financeAction(s, 'deposit', amount); expect(next.ship.credits).toBe(10000); expect(next.finance!.savings).toBe(0);
  }
  expect(financeAction(setup('drydock'), 'deposit', 10).finance!.savings).toBe(0);
  expect(financeAction(setup(), 'borrow', 10).finance!.loan.principal).toBe(0);
  const s = setup(); const hostile = { ...s, stations: s.stations.map(st => st.id === 'sol-city' ? { ...st, isClosed: true } : st) };
  expect(financeAction(hostile, 'deposit', 10).finance!.savings).toBe(0);
});
it('loans create equal liabilities, cap principal, accrue interest and repay interest before principal', () => {
  let s = setup(BANK_ID), nav = netAssetValue(s).total;
  s = financeAction(s, 'borrow', 1000); expect(netAssetValue(s).total).toBeCloseTo(nav);
  expect(financeAction(s, 'borrow', 10000).finance!.loan.principal).toBe(1000);
  s = tickFinance({ ...s, gameTime: 60 }, () => .5); expect(s.finance!.loan.interest).toBeCloseTo(5);
  expect(netAssetValue(s).total).toBeCloseTo(nav - 5);
  s = financeAction(s, 'repay', 105); expect(s.finance!.loan.interest).toBe(0); expect(s.finance!.loan.principal).toBeCloseTo(900);
  expect(s.ship.credits).toBe(10895);
});
it('overdue interest restricts new credit without seizing bank balances or preventing repayment', () => {
  let s = financeAction(setup(BANK_ID), 'borrow', 1000); s = financeAction(s, 'deposit', 500);
  s = tickFinance({ ...s, gameTime: 600 }, () => .5);
  expect(financeAction(s, 'borrow', 1).finance!.loan.principal).toBe(1000);
  const interest = s.finance!.loan.interest;
  s = financeAction(s, 'repay', Math.ceil(interest * 100) / 100); expect(s.finance!.loan.interest).toBe(0);
  expect(financeAction(s, 'borrow', 1).finance!.loan.principal).toBeGreaterThan(1000);
  expect(s.finance!.savings).toBeGreaterThan(500);
});
it('prorates interest from actual deposit/loan time rather than granting a whole previous minute', () => {
  let s = { ...setup(BANK_ID), gameTime: 59 };
  s = financeAction(s, 'deposit', 1000); s = financeAction(s, 'borrow', 1000);
  s = tickFinance({ ...s, gameTime: 60 }, () => .5);
  expect(s.finance!.savings).toBeCloseTo(1000 * Math.pow(1.001, 1 / 60));
  expect(s.finance!.loan.interest).toBeCloseTo(1000 * (Math.pow(1.005, 1 / 60) - 1));
});
it('cannot arbitrage a guaranteed bond by borrowing just before the market minute', () => {
  let s = { ...setup(BANK_ID), gameTime: 59.9 };
  s = financeAction(s, 'borrow', 10000); s = financeAction(s, 'deposit', 10000); s = financeAction(s, 'invest', 10000, BANK_ID);
  const before = netAssetValue(s).total;
  s = tickFinance({ ...s, gameTime: 60 }, () => .5); s = financeAction(s, 'redeemAll', 0, BANK_ID);
  expect(netAssetValue(s).total).toBeLessThan(before);
});
it('bank bonds guarantee a lower return while station risk/reward and loss bounds scale together', () => {
  const s = setup(); const bank = s.stations.find(st => st.id === BANK_ID)!;
  const low = s.stations.find(st => st.id === 'sol-city')!, medium = s.stations.find(st => st.id === 'drydock')!, high = s.stations.find(st => st.type === 'pirate')!;
  expect(fundRisk(bank).drift).toBeLessThan(fundRisk(low).drift); expect(fundRisk(low).drift).toBeLessThan(fundRisk(medium).drift); expect(fundRisk(medium).drift).toBeLessThan(fundRisk(high).drift);
  const down = tickFinance({ ...s, gameTime: 60 }, () => 0), up = tickFinance({ ...s, gameTime: 60 }, () => 1);
  expect(down.finance!.funds[BANK_ID].price).toBeCloseTo(100.15);
  expect(down.finance!.funds[high.id].price).toBeCloseTo(91); expect(up.finance!.funds[high.id].price).toBeCloseTo(111);
  for (const st of [low, medium, high]) expect((down.finance!.funds[st.id].price + up.finance!.funds[st.id].price) / 2).toBeCloseTo(100 * (1 + fundRisk(st).drift));
});
it('invests savings and redeems fractional holdings exactly once without minting cash or losing dust', () => {
  let s = financeAction(setup(), 'deposit', 1000), nav = netAssetValue(s).total;
  s = financeAction(s, 'invest', 750, BANK_ID); expect(netAssetValue(s).total).toBeCloseTo(nav);
  s = tickFinance({ ...s, gameTime: 60 }, () => .5);
  const expected = s.finance!.savings + s.finance!.funds[BANK_ID].units * s.finance!.funds[BANK_ID].price;
  s = financeAction(s, 'redeemAll', 0, BANK_ID);
  expect(s.finance!.funds[BANK_ID].units).toBe(0); expect(s.finance!.savings).toBeCloseTo(expected);
  expect(financeAction(s, 'redeemAll', 0, BANK_ID).finance!.savings).toBe(s.finance!.savings);
});
it('warehouse transfers are local, asset-neutral and cannot retrieve more than capacity or holdings', () => {
  const s = setup(), nav = netAssetValue(s).total;
  const stored = transferWarehouse(s, 'refined_fuel', 6, 'store'); expect(stored.ship.cargo.refined_fuel).toBe(4);
  expect(stored.finance!.warehouses['sol-city'].goods.refined_fuel).toBe(6); expect(netAssetValue(stored).total).toBeCloseTo(nav);
  expect(transferWarehouse({ ...stored, ship: { ...stored.ship, dockedStationId: 'freeport' } }, 'refined_fuel', 1, 'retrieve').ship.cargo.refined_fuel).toBe(4);
  for (const qty of [0, -1, .5, NaN, Infinity, 7]) expect(transferWarehouse(stored, 'refined_fuel', qty, 'retrieve').ship.cargo.refined_fuel).toBe(4);
  expect(transferWarehouse({ ...stored, ship: { ...stored.ship, maxCargo: 4 } }, 'refined_fuel', 1, 'retrieve').ship.cargo.refined_fuel).toBe(4);
});
it('preserves perishable freshness through climate-controlled storage, without laundering spoiled goods', () => {
  let s = setup(); s = { ...s, ship: { ...s.ship, cargo: { meat: 10 }, cargoFreshness: { meat: .4 }, hasTempCargo: true } };
  s = transferWarehouse(s, 'meat', 10, 'store'); s = transferWarehouse(s, 'meat', 10, 'retrieve');
  expect(s.ship.cargoFreshness!.meat).toBeCloseTo(.4);
  s = transferWarehouse(s, 'meat', 10, 'store');
  expect(transferWarehouse({ ...s, ship: { ...s.ship, hasTempCargo: false } }, 'meat', 10, 'retrieve').ship.cargo.meat).toBe(0);
});
it('retains warehouse acquisition basis after a ship sale, later purchases and retrieval', () => {
  setup(); useGameStore.setState({ avgCostByCommodity: { refined_fuel: 100 } });
  useGameStore.getState().transferWarehouse('refined_fuel', 5, 'store');
  const quote = (buy: number, sell: number) => useGameStore.setState(s => ({ stations: s.stations.map(st => st.id === 'sol-city' ? { ...st, inventory: { ...st.inventory, refined_fuel: { buy, sell, stock: 100, canBuy: true, canSell: true } } } : st) }));
  quote(100, 150); useGameStore.getState().sell('refined_fuel', 5); expect(useGameStore.getState().avgCostByCommodity.refined_fuel).toBe(100);
  quote(200, 150); useGameStore.getState().buy('refined_fuel', 5); expect(useGameStore.getState().avgCostByCommodity.refined_fuel).toBeCloseTo(150);
  useGameStore.getState().transferWarehouse('refined_fuel', 5, 'retrieve'); expect(useGameStore.getState().ship.cargo.refined_fuel).toBe(10);
});
it('manufacturing includes warehoused output in its weighted cost basis', () => {
  setup('ceres-pp'); useGameStore.setState(s => ({ ship: { ...s.ship, cargo: { refined_fuel: 2 }, hasUnionMembership: true }, avgCostByCommodity: { refined_fuel: 100, batteries: 50 }, finance: { ...s.finance!, warehouses: { 'ceres-pp': { goods: { batteries: 2 }, freshness: { batteries: 1 } } } } }));
  useGameStore.getState().process('refined_fuel', 1);
  expect(useGameStore.getState().ship.cargo.batteries).toBe(1); expect(useGameStore.getState().avgCostByCommodity.batteries).toBe(100);
});
it('cannot use Sol City storage to evade the active covert procurement restriction', () => {
  let s = setup(); s = { ...s, ship: { ...s.ship, cargo: { luxury_goods: 10 } } }; s = transferWarehouse(s, 'luxury_goods', 10, 'store');
  s = { ...s, missions: [{ id: 'greenfields_stage_1', status: 'active' } as GameState['missions'][number]] };
  expect(transferWarehouse(s, 'luxury_goods', 10, 'retrieve').ship.cargo.luxury_goods).toBe(0);
});
it('death loses exactly half onboard cash, once, while preserving savings, investments, storage and debt', () => {
  setup(BANK_ID); useGameStore.getState().bankAction('borrow', 1000); useGameStore.getState().bankAction('deposit', 4000); useGameStore.getState().bankAction('invest', 1000, BANK_ID); useGameStore.getState().transferWarehouse('refined_fuel', 5, 'store');
  const before = useGameStore.getState().finance!;
  useGameStore.setState(s => ({ ship: { ...s.ship, hp: 0, dockedStationId: undefined } })); useGameStore.getState().tick(.1);
  const next = useGameStore.getState(); expect(next.ship.credits).toBe(3500); expect(next.finance!.loan.principal).toBe(1000); expect(next.finance!.savings).toBe(before.savings); expect(next.finance!.funds).toEqual(before.funds); expect(next.finance!.warehouses).toEqual(before.warehouses);
  next.tick(.1); expect(useGameStore.getState().ship.credits).toBe(3500);
});
it('banking rates and market marks freeze when simulation is paused or blocked', () => {
  setup(); useGameStore.getState().bankAction('deposit', 1000);
  useGameStore.setState({ paused: true, gameTime: 60 }); const before = useGameStore.getState().finance;
  useGameStore.getState().tick(.1); expect(useGameStore.getState().finance).toBe(before);
});
it('values a final capped upgrade as a complete purchased upgrade step', () => {
  setup('drydock'); const before = netAssetValue(useGameStore.getState()).total;
  for (let i = 0; i < 2; i++) useGameStore.getState().upgrade('acc', 3, 1000);
  useGameStore.getState().upgrade('acc', 2, 1000); // Explicit partial-step service request, not the UI's +3 button.
  expect(useGameStore.getState().ship.stats.acc).toBe(18); expect(netAssetValue(useGameStore.getState()).modules).toBe(3000);
  expect(netAssetValue(useGameStore.getState()).total).toBeCloseTo(before);
});
it('NAV includes goods in all locations, upgrades, investments and loan liabilities without double counting', () => {
  let s = setup(BANK_ID); s = financeAction(s, 'deposit', 2000); s = financeAction(s, 'invest', 1000, BANK_ID); s = financeAction(s, 'borrow', 500);
  const v = netAssetValue(s); expect(v.total).toBeCloseTo(v.cash + v.savings + v.investments + v.hull + v.modules + v.cargo + v.stored - v.debt);
  const upgraded = { ...s, ship: { ...s.ship, hasFireSuppression: true, credits: s.ship.credits - 3500 } };
  expect(netAssetValue(upgraded).total).toBeCloseTo(v.total);
});
it('persists complete accounts/history without replaying interest and seeds an older bank-less world safely', () => {
  let s = financeAction(setup(), 'deposit', 1000); s = tickFinance({ ...s, gameTime: 60 }, () => .5); s = recordAssets(s, s);
  const text = serializeGame(s), restored = deserializeGame(text); expect(restored.finance).toEqual(s.finance); expect(deserializeGame(text).finance).toEqual(s.finance);
  const legacy = JSON.parse(text); delete legacy.data.finance; legacy.data.stations = legacy.data.stations.filter((st: { id: string }) => st.id !== BANK_ID);
  const migrated = deserializeGame(JSON.stringify(legacy)); expect(migrated.stations!.some(st => st.id === BANK_ID)).toBe(true); expect(migrated.finance!.savings).toBe(0); expect(migrated.finance!.lastAccrualAt).toBe(60);
});
it('rejects corrupt warehouse goods, negative balances, future clocks and invalid funds without replacing the game', () => {
  const text = serializeGame(setup());
  for (const corrupt of [(f: any) => f.savings = -1, (f: any) => f.lastInterestAt = 100, (f: any) => f.funds = {}, (f: any) => f.warehouses = { nowhere: { goods: { refined_fuel: 1 }, freshness: {} } }, (f: any) => f.warehouses = { 'sol-city': { goods: { counterfeit: 1 }, freshness: {} } }]) {
    const data = JSON.parse(text); corrupt(data.data.finance); expect(() => deserializeGame(JSON.stringify(data))).toThrow();
  }
});
