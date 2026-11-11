// @vitest-environment jsdom
import { StrictMode } from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { useGameInput } from '../use_game_input';
import { useGameStore } from '../../state';
import { MissionLog } from '../../ui/components/hud/MissionLog';
const initial = useGameStore.getState();
beforeEach(() => { useGameStore.setState({ hasChosenStarter: true }); });
afterEach(() => { cleanup(); useGameStore.setState(initial, true); });
function Probe() { useGameInput(); return <input aria-label="Trade quantity" />; }
describe('keyboard and mission-log interaction', () => {
  it('does not duplicate listeners in StrictMode and ignores held toggle repeats', () => {
    const toggle = vi.fn(); useGameStore.setState({ toggleCruise: toggle });
    render(<StrictMode><Probe /></StrictMode>);
    fireEvent.keyDown(window, { key: 'c' }); fireEvent.keyDown(window, { key: 'c', repeat: true });
    expect(toggle).toHaveBeenCalledTimes(1);
  });
  it('never flies or toggles while editing text or using browser shortcuts', () => {
    const toggle = vi.fn(); useGameStore.setState({ toggleCruise: toggle });
    const ui = render(<Probe />);
    fireEvent.keyDown(ui.getByLabelText('Trade quantity'), { key: 'c' });
    fireEvent.keyDown(window, { key: 'c', ctrlKey: true });
    expect(toggle).not.toHaveBeenCalled();
  });
  it('allows docking shortcuts after a button click but leaves button Tab navigation alone', () => {
    const undock = vi.fn(); const target = vi.fn(); useGameStore.setState({ undock, cycleTarget: target });
    const ui = render(<><button>Flight control</button><Probe /></>);
    fireEvent.keyDown(ui.getByText('Flight control'), { key: 'q' });
    fireEvent.keyDown(ui.getByText('Flight control'), { key: 'Tab' });
    expect(undock).toHaveBeenCalledTimes(1); expect(target).not.toHaveBeenCalled();
  });
  it('offers load before a starter is chosen and exposes a flight-accessible log', () => {
    const load = vi.fn(); useGameStore.setState({ loadGame: load, hasChosenStarter: false });
    const ui = render(<MissionLog />);
    fireEvent.click(ui.getByText('Load')); expect(load).toHaveBeenCalledTimes(1);
    fireEvent.click(ui.getByText('Mission log')); expect(ui.getByRole('dialog', { name: 'Mission log' })).toBeTruthy();
    fireEvent.click(ui.getByText('Close log')); expect(ui.queryByRole('dialog', { name: 'Mission log' })).toBeNull();
  });
});
