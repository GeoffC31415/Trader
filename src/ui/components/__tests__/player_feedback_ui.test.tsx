// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useGameStore } from '../../../state';
import { ObjectiveHUD } from '../hud/ObjectiveHUD';
import { CommodityGrid } from '../shared/CommodityGrid';
import { MissionsSection } from '../market/MissionsSection';
import { MarketPanel } from '../../market_panel';
import { createMissionFromTemplate } from '../../../systems/missions/mission_generator';
import { MISSION_TEMPLATES } from '../../../domain/constants/mission_constants';
import type { Contract } from '../../../domain/types/world_types';
const original = useGameStore.getState();
afterEach(() => { cleanup(); useGameStore.setState(original, true); });
const s = useGameStore.getInitialState();
const orders: Contract[] = [
  { id: 'a', fromId: 'freeport', toId: 'aurum-fab', commodityId: 'batteries', units: 5, deliveredUnits: 1, status: 'accepted' },
  { id: 'b', fromId: 'sol-refinery', toId: 'sol-city', commodityId: 'refined_fuel', units: 10, status: 'accepted' },
];
const hud = { missions: [], contracts: orders, activeEscorts: [], stations: s.stations, ship: s.ship, onSetTrackedStation: vi.fn() };
it('shows the precise delivery destination, not a mandatory source', () => {
  render(<ObjectiveHUD {...hud} contracts={[orders[0]]} />);
  expect(screen.getByText(`Deliver 5 batteries to ${s.stations.find(st => st.id === 'aurum-fab')!.name}`)).toBeTruthy();
  expect(screen.getByText(/Any legal supplier/)).toBeTruthy(); expect(screen.queryByText(/Freeport/)).toBeNull();
});
it('removes finished contracts even if their old objective ID or waypoint remains in the save', () => {
  const view = render(<ObjectiveHUD {...hud} contracts={[orders[0]]} trackedStationId="aurum-fab" />);
  view.rerender(<ObjectiveHUD {...hud} contracts={[{ ...orders[0], status: 'completed' }]} trackedStationId="aurum-fab" />);
  expect(screen.queryByRole('progressbar', { name: 'Delivery progress' })).toBeNull();
  expect(screen.queryByText(/Deliver 5/)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Clear waypoint' })); expect(hud.onSetTrackedStation).toHaveBeenCalledWith(undefined);
});
it('selects and summarizes multiple live assignments and can minimize without abandoning them', () => {
  const mission = { ...createMissionFromTemplate(MISSION_TEMPLATES.greenfields_stage_1), status: 'active' as const };
  render(<ObjectiveHUD {...hud} missions={[mission]} />);
  expect(screen.getByText('Active assignments (3)')).toBeTruthy();
  fireEvent.change(screen.getByRole('combobox', { name: 'Tracked assignment' }), { target: { value: 'b' } });
  expect(screen.getByText('Deliver 10 refined fuel to Sol City')).toBeTruthy();
  expect(hud.onSetTrackedStation).toHaveBeenCalledWith('sol-city');
  fireEvent.click(screen.getByRole('button', { name: 'All assignments' })); expect(screen.getAllByRole('listitem')).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: 'Hide objectives' })); expect(screen.queryByRole('combobox')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Show assignments (3)' })); expect(screen.getByRole('combobox')).toBeTruthy();
});
it('searches goods by case-insensitive partial name and supports clearing or no matches', () => {
  const station = s.stations[0];
  render(<CommodityGrid station={station} ship={s.ship} qty={1} hasTradeLedger={false} items={['batteries', 'refined_fuel'].map(id => [id, station.inventory[id]])} onBuy={vi.fn()} onSell={vi.fn()} />);
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search goods' }), { target: { value: 'BAT' } });
  expect(screen.getByText('batteries', { exact: true })).toBeTruthy(); expect(screen.queryByText('refined fuel', { exact: true })).toBeNull();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'does not exist' } }); expect(screen.getByRole('status').textContent).toContain('No goods match');
  fireEvent.click(screen.getByRole('button', { name: 'Clear search' })); expect(screen.getByText('refined fuel', { exact: true })).toBeTruthy();
});
it('uses themed story panels, a right-hand action column and human-readable reputation requirements', () => {
  const station = s.stations.find(st => st.id === 'greenfields')!;
  render(<MissionsSection station={station} stations={s.stations} stationMissions={[createMissionFromTemplate(MISSION_TEMPLATES.greenfields_stage_1)]} activeMissions={[]} failedMissions={[]} missionArcs={s.missionArcs} onAcceptMission={vi.fn()} onAbandonMission={vi.fn()} onSetChoiceDialog={vi.fn()} repLockedNextMissions={[{ arcId: 'greenfields_independence', arcName: '', stage: 3, missionId: 'greenfields_stage_3', title: 'Supply Cut', description: '', deficits: [{ stationId: 'greenfields', current: 0, required: 25, missing: 25 }] }]} />);
  expect(screen.getByRole('button', { name: 'Accept mission' }).closest('aside')?.style.textAlign).toBe('right');
  expect(screen.getByText(`${station.name}: 0 / 25 reputation · 25 more required`)).toBeTruthy();
  expect(screen.getByText('Story contracts').closest('.sci-fi-panel-farm')).toBeTruthy();
});
it('never advertises the opposite branch as a reputation-locked assignment', () => {
  const station = s.stations.find(st => st.id === 'greenfields')!;
  useGameStore.setState({ ...s, hasChosenStarter: true, ship: { ...s.ship, dockedStationId: station.id, position: [...station.position] }, missionArcs: s.missionArcs.map(a => a.id === 'greenfields_independence' ? { ...a, status: 'in_progress', currentStage: 3, choicesMade: { stage_2_choice: 'side_sol_city' } } : a) }, true);
  render(<MarketPanel />); fireEvent.click(screen.getByRole('button', { name: /Missions/ }));
  expect(screen.queryByText(/Supply Cut/)).toBeNull();
});
