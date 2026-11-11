// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { useGameStore } from '../../../state/store';
import { BankingSection } from '../market/BankingSection';
import { WarehouseSection } from '../market/WarehouseSection';
import { JournalPanel } from '../../journal_panel';
import { ShipSchematic } from '../journal/ShipSchematic';
import { netAssetValue, createFinance } from '../../../systems/finance';
import { productionChains } from '../../../systems/production_graph';
import { manufacturingDirectory } from '../../../systems/journal_analysis';
const original = useGameStore.getState();
afterEach(() => { cleanup(); useGameStore.setState(original, true); });
function setup(port = 'sol-city') {
  const s = useGameStore.getInitialState();
  useGameStore.setState({ ...s, hasChosenStarter: true, graphicsQuality: 'low', ship: { ...s.ship, dockedStationId: port, cargo: { refined_fuel: 10 } }, finance: createFinance(s.stations, 0), npcTraders: [] }, true);
  return useGameStore.getState();
}
it('warehouse controls move real goods both ways, with search and local counts', () => {
  const s = setup(); render(<WarehouseSection station={s.stations.find(st => st.id === 'sol-city')!} />);
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Warehouse transfer quantity' }), { target: { value: '4' } });
  fireEvent.click(screen.getByRole('button', { name: 'Store Refined Fuel' }));
  expect(useGameStore.getState().ship.cargo.refined_fuel).toBe(6);
  expect(useGameStore.getState().finance!.warehouses['sol-city'].goods.refined_fuel).toBe(4);
  fireEvent.click(screen.getByRole('button', { name: 'Retrieve Refined Fuel' })); expect(useGameStore.getState().ship.cargo.refined_fuel).toBe(10);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'unavailable' } }); expect(screen.getByText(/No matching cargo/)).toBeTruthy();
});
it('bank terminals provide functional deposits, investments and redemptions but require the bank for new loans', () => {
  const s = setup(); render(<BankingSection station={s.stations.find(st => st.id === 'sol-city')!} />);
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Bank transaction amount' }), { target: { value: '1000' } });
  fireEvent.click(screen.getByRole('button', { name: 'Deposit to savings' })); expect(useGameStore.getState().finance!.savings).toBe(1000);
  fireEvent.click(screen.getByRole('button', { name: 'Invest savings' })); expect(useGameStore.getState().finance!.funds['meridian-bank'].units).toBe(10);
  fireEvent.click(screen.getByRole('button', { name: 'Redeem entire holding' })); expect(useGameStore.getState().finance!.savings).toBe(1000);
  expect((screen.getByRole('button', { name: 'Borrow to ship' }) as HTMLButtonElement).disabled).toBe(true);
});
it('Meridian has a distinct persona and an operational loan facility', () => {
  const s = setup('meridian-bank'); render(<BankingSection station={s.stations.find(st => st.id === 'meridian-bank')!} />);
  expect(screen.getByText(/Director Ada Voss/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Borrow to ship' })); expect(useGameStore.getState().finance!.loan.principal).toBe(100);
});
it('command deck presents consolidated NAV and real historical observations including liabilities', () => {
  const s = setup(); const value = netAssetValue(s).total;
  useGameStore.setState({ finance: { ...s.finance!, loan: { principal: 1000, interest: 40000, dueAt: 600 }, navHistory: [{ at: 0, value }, { at: 30, value: value - 41000 }], lastNavAt: 30 }, gameTime: 30 });
  render(<JournalPanel />);
  const overview = screen.getByRole('region', { name: 'Net asset value overview' });
  expect(within(overview).getByText('Loan liability')).toBeTruthy(); expect(within(overview).getByText('Station warehouses')).toBeTruthy();
  const chart = within(overview).getByRole('figure', { name: 'Net asset value over time' }); expect(chart.querySelectorAll('circle')).toHaveLength(2);
  expect([...chart.querySelectorAll('circle')].every(node => Number(node.getAttribute('cy')) >= 0 && Number(node.getAttribute('cy')) <= 240)).toBe(true);
  expect(within(chart).getAllByRole('img').some(node => node.getAttribute('aria-label')!.includes('−') || node.getAttribute('aria-label')!.includes('-'))).toBe(true);
});
it('uses actual linked methods, including hydrogen to fuel to batteries and branching metal fabrication', () => {
  const s = setup(), chains = productionChains(manufacturingDirectory(s));
  const fuel = chains.find(c => c.nodes.some(n => n.id === 'hydrogen'))!;
  expect(fuel.edges.map(e => e.id)).toEqual(expect.arrayContaining(['hydrogen:refined_fuel', 'refined_fuel:batteries']));
  expect(fuel.edges.find(e => e.outputId === 'batteries')!.providers.some(p => p.station.id === 'ceres-pp')).toBe(true);
  for (const chain of chains) for (const edge of chain.edges) expect(chain.nodes.find(n => n.id === edge.outputId)!.column).toBeGreaterThan(chain.nodes.find(n => n.id === edge.inputId)!.column);
  expect(chains.some(c => c.edges.filter(e => e.outputId === 'machinery').length === 2)).toBe(true);
});
it('ship technical diagram has eight accessible annotations driven by real installed flags and supports manual rotation', () => {
  const s = setup(); render(<ShipSchematic ship={{ ...s.ship, hasFireSuppression: true }} quality="low" />);
  const annotations = screen.getByRole('group', { name: 'Eight upgrade annotations' });
  expect(within(annotations).getAllByRole('button')).toHaveLength(8);
  fireEvent.focus(within(annotations).getByRole('button', { name: 'Fire suppression: installed' }));
  expect(screen.getByRole('status').textContent).toContain('three simulation seconds');
  const points = screen.getByRole('group', { name: 'Annotated ship model' }).querySelector('polygon')!.getAttribute('points');
  fireEvent.click(screen.getByRole('button', { name: 'Rotate model step' }));
  expect(screen.getByRole('group', { name: 'Annotated ship model' }).querySelector('polygon')!.getAttribute('points')).not.toBe(points);
  expect(document.querySelector('canvas')).toBeNull();
});
