// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import { JournalPanel } from '../../journal_panel';
import { useGameStore } from '../../../state/store';
import { recordJournalTransition } from '../../../systems/journal';
import { applyMissionContribution, createInitialProfile } from '../../../systems/politics/political_compass';
const original = useGameStore.getState();
afterEach(() => { cleanup(); useGameStore.setState(original, true); });
function setup() {
  const s = useGameStore.getInitialState(); useGameStore.setState({ ...s, stations: s.stations.map(st => ({ ...st, reputation: 0 })), npcTraders: [] }, true);
  useGameStore.getState().chooseStarter('freighter');
  useGameStore.setState(s => ({ ship: { ...s.ship, dockedStationId: 'sol-city' } }));
}
it('provides all eight journal pages, honest milestones and a working pause control', () => {
  setup(); render(<JournalPanel />);
  expect(screen.getByRole('navigation', { name: 'Journal pages' }).querySelectorAll('button').length).toBe(8);
  expect(screen.getByText('INDEPENDENT CADET')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Pause simulation' })); expect(useGameStore.getState().paused).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: /Ship & systems/ })); expect(screen.getByRole('heading', { name: /systems dossier/ })).toBeTruthy();
  expect(screen.queryByText('SpaceRebel42')).toBeNull();
});
it('shows cumulative commerce filters without presenting unsold inventory cashflow as profit', () => {
  setup(); useGameStore.setState(s => ({ ship: { ...s.ship, cargo: { refined_fuel: 2 } }, avgCostByCommodity: { refined_fuel: 20 } })); useGameStore.getState().sell('refined_fuel', 2);
  render(<JournalPanel />); fireEvent.click(screen.getByRole('button', { name: /Trade ledger/ }));
  expect(screen.getByText(/Cashflow is not profit/)).toBeTruthy();
  fireEvent.change(screen.getByRole('combobox', { name: 'Ledger goods' }), { target: { value: 'refined_fuel' } });
  expect(within(screen.getByRole('table', { name: 'Cumulative totals by station' })).getByText('Sol City')).toBeTruthy();
  fireEvent.change(screen.getByRole('combobox', { name: 'Ledger station' }), { target: { value: 'freeport' } });
  expect(screen.getAllByText('No trades in this selection yet.').length).toBe(2);
});
it('links political trajectory nodes to readable, keyboard-accessible event tooltips', () => {
  setup(); const s = useGameStore.getState();
  const politicalProfile = applyMissionContribution(createInitialProfile(), 'greenfields_stage_2', 'side_greenfields', 1, 12);
  useGameStore.setState(recordJournalTransition(s, { ...s, gameTime: 12, politicalProfile }));
  render(<JournalPanel />); fireEvent.click(screen.getByRole('button', { name: /Allegiances/ }));
  const compass = screen.getByRole('figure', { name: 'Political journey' });
  fireEvent.focus(within(compass).getByRole('img', { name: /Sided with Greenfields/ }));
  expect(within(compass).getByRole('status').textContent).toContain('Freedom 15, Labor 10');
  expect(screen.getByText('Influence audit trail')).toBeTruthy();
});
it('renders actual price samples and keeps chart keyboard navigation out of flight controls', () => {
  setup(); useGameStore.setState({ priceHistory: { 'sol-city': { refined_fuel: [{ time: 0, buy: 120, sell: 90 }, { time: 30000, buy: 130, sell: 95 }] } } });
  render(<JournalPanel />); fireEvent.click(screen.getByRole('button', { name: /Market observatory/ }));
  const chart = screen.getByRole('figure', { name: 'Historical board prices' });
  expect(chart.querySelectorAll('polyline').length).toBe(2);
  const node = within(chart).getByRole('img', { name: /Buy from station: 0:00/ }); fireEvent.focus(node);
  expect(within(chart).getByRole('status').textContent).toContain('120 cr');
  const keyboard = vi.fn(); window.addEventListener('keydown', keyboard);
  fireEvent.keyDown(node, { key: 'Tab' }); expect(keyboard).not.toHaveBeenCalled(); window.removeEventListener('keydown', keyboard);
});
it('searches manufacturing transformations and tracks a real manufacturing station', () => {
  setup(); render(<JournalPanel />); fireEvent.click(screen.getByRole('button', { name: /Manufacturing/ }));
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search manufacturing' }), { target: { value: 'batteries' } });
  const recipe = screen.getAllByRole('article').find(a => within(a).queryByText('Ceres Power Plant', { exact: true }))!;
  expect(within(recipe).getByText('Refined Fuel')).toBeTruthy();
  fireEvent.click(within(recipe).getByRole('button', { name: 'Track station' })); expect(useGameStore.getState().trackedStationId).toBe('ceres-pp');
});
it('retains expired world news in searchable archives and surfaces fire alerts while reading', () => {
  setup(); const s = useGameStore.getState();
  const started = recordJournalTransition(s, { ...s, marketEvents: [{ id: 'strike', title: 'Dock strike', description: 'Work stopped', effects: [], startedAt: 0, duration: 1000 }] });
  useGameStore.setState(recordJournalTransition(started, { ...started, gameTime: 2, marketEvents: [], ship: { ...started.ship, onFire: true } }));
  render(<JournalPanel />); expect(screen.getByRole('alert').textContent).toContain('FIRE ALERT');
  fireEvent.click(screen.getByRole('button', { name: /World chronicle/ }));
  const archive = screen.getByRole('region', { name: 'World history' });
  expect(within(archive).getByText('Dock strike · ended')).toBeTruthy();
  fireEvent.change(within(archive).getByRole('searchbox'), { target: { value: 'not a real event' } });
  expect(within(archive).getByText(/No matching events/)).toBeTruthy();
});
