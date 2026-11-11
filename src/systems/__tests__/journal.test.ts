import { afterEach, expect, it, vi } from 'vitest';
import { MISSION_TEMPLATES } from '../../domain/constants/mission_constants';
import { createMissionFromTemplate } from '../missions/mission_generator';
import { useGameStore } from '../../state/store';
import { createJournal, recordJournalTransition, JOURNAL_EVENT_LIMIT } from '../journal';
import { summarizeLedger, manufacturingDirectory } from '../journal_analysis';
import { serializeGame, deserializeGame } from '../persistence';
import { recordPriceHistory, mergePriceHistory } from '../../state/modules/price_history';
import { applyMissionContribution, createInitialProfile } from '../politics/political_compass';
import type { GameState, TradeEntry, MarketEvent } from '../../domain/types/world_types';
const original = useGameStore.getState();
afterEach(() => { useGameStore.setState(original, true); vi.restoreAllMocks(); });
function setup() {
  const s = useGameStore.getInitialState();
  useGameStore.setState({ ...s, stations: s.stations.map(st => ({ ...st, reputation: 0 })), npcTraders: [], nextOpportunityAt: 99999, nextMarketEventAt: 99999,
    ship: { ...s.ship, dockedStationId: 'sol-city' } }, true);
  useGameStore.getState().chooseStarter('freighter');
  useGameStore.setState(s => ({ ship: { ...s.ship, dockedStationId: 'sol-city' } }));
  return useGameStore.getState();
}
function quote(stationId: string, commodityId: string, buy: number, sell: number) {
  useGameStore.setState(s => ({ stations: s.stations.map(st => st.id === stationId ? { ...st, inventory: { ...st.inventory, [commodityId]: { ...st.inventory[commodityId], buy, sell, stock: 100, canBuy: true, canSell: true } } } : st) }));
}
it('records actual trades, rounded faction snapshots and precise propagated station changes once', () => {
  setup(); quote('sol-city', 'refined_fuel', 20, 30); useGameStore.getState().buy('refined_fuel', 5);
  quote('sol-city', 'refined_fuel', 20, 30); useGameStore.getState().sell('refined_fuel', 5);
  const s = useGameStore.getState(), total = summarizeLedger(s.journal!).total;
  expect(total.transactions).toBe(2); expect(total.spent).toBe(100); expect(total.revenue).toBe(s.tradeLog[1].totalPrice);
  expect(total.knownProfit).toBe(s.profitByCommodity.refined_fuel); expect(total.unknownCostSales).toBe(0);
  expect(s.journal!.events.some(e => e.reputation?.some(r => r.stationId === 'sol-refinery'))).toBe(true);
  const count = s.journal!.events.length; s.sell('refined_fuel', 5); expect(useGameStore.getState().journal!.events.length).toBe(count);
});
it('includes order premiums in realized sale profit but keeps completion bonuses outside trading profit', () => {
  setup(); useGameStore.setState({ contracts: [{ id: 'order', fromId: 'sol-city', offeredById: 'sol-city', toId: 'sol-city', commodityId: 'refined_fuel', units: 2, unitBuy: 100, unitSell: 100, rewardBonus: 200, status: 'offered' }] });
  quote('sol-city', 'refined_fuel', 100, 1); useGameStore.getState().acceptContract('order');
  useGameStore.getState().buy('refined_fuel', 2); quote('sol-city', 'refined_fuel', 100, 1); useGameStore.getState().sell('refined_fuel', 2);
  const s = useGameStore.getState(), total = summarizeLedger(s.journal!).total;
  expect(total.revenue).toBe(230); expect(total.knownProfit).toBe(30); expect(s.journal!.otherIncome).toBe(200);
  expect(total.revenue - total.spent).toBe(30);
});
it('keeps cumulative station/goods totals after receipt and event windows roll over', () => {
  let s = setup();
  for (let i = 0; i < 710; i++) {
    const trade: TradeEntry = { id: `sale:${i}`, time: 1, simulationTime: i, stationId: i % 2 ? 'sol-city' : 'freeport', stationName: 'Port', stationType: 'city', commodityId: 'refined_fuel', type: 'sell', quantity: 1, unitPrice: 5, totalPrice: 5, realizedProfit: 2 };
    s = recordJournalTransition(s, { ...s, gameTime: i, ship: { ...s.ship, credits: s.ship.credits + 5 }, tradeLog: [...s.tradeLog, trade].slice(-500) });
  }
  expect(s.journal!.events.length).toBe(JOURNAL_EVENT_LIMIT); expect(s.tradeLog.length).toBe(500);
  expect(summarizeLedger(s.journal!).total.transactions).toBe(710);
  expect(summarizeLedger(s.journal!, 'freeport', 'refined_fuel').total.knownProfit).toBe(710);
  expect(() => deserializeGame(serializeGame(s))).not.toThrow();
});
it('records political causes with actual clamped coordinates and simulation time', () => {
  const s = setup();
  const profile = applyMissionContribution(createInitialProfile(), 'greenfields_stage_2', 'side_greenfields', 1, 12);
  const next = recordJournalTransition(s, { ...s, gameTime: 12, politicalProfile: profile });
  const event = next.journal!.events.find(e => e.kind === 'politics')!;
  expect(event.political).toEqual({ freedom: 15, labor: 10 }); expect(event.at).toBe(12);
  expect(event.detail).toContain('Greenfields independence'); expect(profile.history[0].simulationTime).toBe(12);
});
it('archives world event starts, expirations and effects instead of discarding expired news', () => {
  const s = setup(); const event: MarketEvent = { id: 'strike', title: 'Dockworkers strike', description: 'Work stopped at Drydock', startedAt: 0, duration: 1000, effects: [{ stationId: 'drydock', commodityId: 'machinery', priceMultiplier: 1.3 }] };
  const started = recordJournalTransition(s, { ...s, marketEvents: [event] });
  const ended = recordJournalTransition(started, { ...started, gameTime: 2, marketEvents: [] });
  expect(ended.journal!.events.filter(e => e.kind === 'world').map(e => e.title)).toEqual(['Dockworkers strike · started', 'Dockworkers strike · ended']);
  expect(deserializeGame(serializeGame(ended)).journal!.events).toEqual(ended.journal!.events);
});
it('archives temporary campaign modifier expiry exactly once using simulation time', () => {
  const s = setup();
  const enacted = recordJournalTransition(s, { ...s, appliedEffects: [{ id: 'greenfields_fabrication_lockdown', appliedAt: 0 }] });
  const ended = recordJournalTransition(enacted, { ...enacted, gameTime: 301 });
  const later = recordJournalTransition(ended, { ...ended, gameTime: 302 });
  expect(later.journal!.events.filter(e => e.title === 'Temporary consequence window ended')).toHaveLength(1);
  expect(later.journal!.events.find(e => e.title === 'World consequence enacted')!.detail).toContain('Greenfields Farm');
});
it('does not report guessed cost basis as known profit, even on an order-premium sale', () => {
  setup(); quote('sol-city', 'refined_fuel', 100, 1);
  useGameStore.setState(s => ({ ship: { ...s.ship, cargo: { refined_fuel: 1 } }, contracts: [{ id: 'old-cargo', offeredById: 'sol-city', toId: 'sol-city', commodityId: 'refined_fuel', units: 1, unitBuy: 100, unitSell: 115, status: 'offered' }] }));
  useGameStore.getState().acceptContract('old-cargo'); useGameStore.getState().sell('refined_fuel', 1);
  const total = summarizeLedger(useGameStore.getState().journal!).total;
  expect(total.unknownCostSales).toBe(1); expect(total.knownProfit).toBe(0);
});
it('weights free mining and salvage into existing paid inventory cost basis', () => {
  setup(); const belt = useGameStore.getState().belts[0];
  useGameStore.setState(s => ({ ship: { ...s.ship, dockedStationId: undefined, canMine: true, position: [belt.position[0] + belt.radius, belt.position[1], belt.position[2]], cargo: { iron_ore: 3, alloys: 3 } }, avgCostByCommodity: { iron_ore: 10, alloys: 12 } }));
  vi.spyOn(Math, 'random').mockReturnValue(.1); useGameStore.getState().mine();
  expect(useGameStore.getState().avgCostByCommodity.iron_ore).toBe(5);
  useGameStore.setState(s => ({ opportunity: { id: 'free-salvage', kind: 'salvage', position: [...s.ship.position], stationId: 'freeport', commodityId: 'alloys', quantity: 3, reward: 0, expiresAt: 100, risky: false } }));
  useGameStore.getState().resolveOpportunity('complete'); expect(useGameStore.getState().avgCostByCommodity.alloys).toBe(6);
});
it('restores journals without replaying income/events, and honestly seeds older receipts with unknown costs', () => {
  setup(); quote('sol-city', 'refined_fuel', 10, 20); useGameStore.getState().buy('refined_fuel', 1); useGameStore.getState().sell('refined_fuel', 1);
  const s = useGameStore.getState(), saved = serializeGame(s); expect(deserializeGame(saved).journal).toEqual(s.journal);
  const legacy = JSON.parse(saved); delete legacy.data.journal; legacy.data.tradeLog.forEach((t: any) => delete t.realizedProfit);
  const migrated = deserializeGame(JSON.stringify(legacy)).journal!;
  expect(migrated.legacy).toBe(true); expect(migrated.events).toHaveLength(1);
  expect(summarizeLedger(migrated).total.unknownCostSales).toBe(1); expect(summarizeLedger(migrated).total.knownProfit).toBe(0);
});
it('rejects corrupt journal sequences before installing a checkpoint', () => {
  const s = setup(); const text = JSON.parse(serializeGame(s)); text.data.journal.events[0].id = 999;
  expect(() => deserializeGame(JSON.stringify(text))).toThrow(); expect(useGameStore.getState().ship.credits).toBe(s.ship.credits);
});
it('records a real shipyard upgrade and its non-trade cost', () => {
  setup(); useGameStore.setState(s => ({ ship: { ...s.ship, dockedStationId: 'drydock' } }));
  useGameStore.getState().purchaseFireSuppression(); const s = useGameStore.getState();
  expect(s.journal!.events.some(e => e.kind === 'ship' && e.detail.includes('Fire suppression: installed'))).toBe(true);
  expect(s.journal!.otherSpending).toBe(3500);
});
it('does not create per-frame history spam for ordinary physics/production updates', () => {
  const s = setup(); s.tick(.1); const next = useGameStore.getState();
  expect(next.journal!.events.length).toBe(s.journal!.events.length);
});
it('samples at simulation zero only once, merges immutably and retains the last sixty observations', () => {
  const s = setup(); expect(recordPriceHistory(s.stations, 1, 0).priceHistory).toEqual({});
  const first = recordPriceHistory(s.stations, 0).priceHistory; const old = JSON.stringify(first);
  let current = first;
  for (let i = 1; i <= 65; i++) current = mergePriceHistory(current, recordPriceHistory(s.stations, i * 30000).priceHistory);
  expect(JSON.stringify(first)).toBe(old); expect(current['sol-city'].refined_fuel.length).toBe(60);
  expect(current['sol-city'].refined_fuel[0].time).toBe(6 * 30000);
});
it('shows only executable manufacturing recipes, with real stations, modifiers and access requirements', () => {
  const s = setup(); const rows = manufacturingDirectory(s);
  expect(rows.filter(r => r.station.id === 'hidden-cove' && r.inputId === 'electronics').map(r => r.outputId)).toEqual(['microchips']);
  const batteries = rows.find(r => r.station.id === 'ceres-pp' && r.outputId === 'batteries')!;
  expect(batteries.input).toBe(2); expect(batteries.requirements).toContain('Union membership');
});
it('transfers actual consumed input cost into manufactured goods for subsequent profit analysis', () => {
  setup(); useGameStore.setState(s => ({ ship: { ...s.ship, dockedStationId: 'sol-refinery', hasUnionMembership: true, cargo: { hydrogen: 6 } }, avgCostByCommodity: { hydrogen: 20 } }));
  useGameStore.getState().process('hydrogen', 2); const made = useGameStore.getState();
  expect(made.ship.cargo.refined_fuel).toBe(2); expect(made.avgCostByCommodity.refined_fuel).toBe(60);
  expect(made.journal!.events.some(e => e.title === 'Manufacturing completed')).toBe(true);
  quote('sol-refinery', 'refined_fuel', 150, 150); useGameStore.getState().sell('refined_fuel', 2);
  expect(summarizeLedger(useGameStore.getState().journal!).total.knownProfit).toBe(180);
});
it('rejects fractional/overflow fabrication and the covert Sol City manufacturing loophole', () => {
  setup(); useGameStore.setState(s => ({ ship: { ...s.ship, dockedStationId: 'sol-refinery', hasUnionMembership: true, cargo: { hydrogen: 6 } } }));
  useGameStore.getState().process('hydrogen', .5); expect(useGameStore.getState().ship.cargo.hydrogen).toBe(6);
  useGameStore.setState(s => ({ stations: s.stations.map(st => st.id === 'sol-refinery' ? { ...st, fabricationMultiplier: .25 } : st), ship: { ...s.ship, maxCargo: 6 } }));
  useGameStore.getState().process('hydrogen', 4); expect(useGameStore.getState().ship.cargo.hydrogen).toBe(6);
  useGameStore.setState(s => ({ ship: { ...s.ship, maxCargo: 100, dockedStationId: 'sol-city', cargo: { coffee: 30 } }, missions: [{ ...createMissionFromTemplate(MISSION_TEMPLATES.greenfields_stage_1), status: 'active' }] }));
  // Use the pure processing action precondition; a real mission fixture is not needed to test the guard.
  useGameStore.getState().process('coffee', 1); expect(useGameStore.getState().ship.cargo.coffee).toBe(30);
});
