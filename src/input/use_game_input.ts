import { useEffect, useRef } from 'react';
import { useGameStore } from '../state';
import { hasBlockingOverlay, isSimulationBlocked } from '../state/helpers/simulation_clock';

/** Input is cleared on focus loss; dialogs and text fields never fly/fire the ship. */
export function useGameInput() {
  const pressed = useRef<Record<string, boolean>>({});
  const lastFacingDir = useRef<[number, number, number]>([0, 0, -1]);
  useEffect(() => {
    const clear = () => { for (const key of Object.keys(pressed.current)) pressed.current[key] = false; };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const element = e.target instanceof HTMLElement ? e.target : null;
      const key = e.key.toLowerCase();
      if (element?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return;
      if (element?.closest('button') && [' ', 'enter', 'tab'].includes(key)) return;
      const state = useGameStore.getState();
      if (key === 'p' && !e.repeat && state.hasChosenStarter && !hasBlockingOverlay(state)) { clear(); state.togglePause(); return; }
      if (isSimulationBlocked(state)) return;
      if (key === ' ' || key === 'tab') e.preventDefault();
      if (!e.repeat) {
        if (key === 'e') { state.tryDock(); return; }
        if (key === 'q') { state.undock(); return; }
        if (key === 'm') { state.mine(); return; }
        if (key === 'c') { state.toggleCruise(); return; }
        if (key === 'h') { state.toggleSilentRunning(); return; }
        if (key === 't') { state.toggleAutopilot(); return; }
        if (key === 'tab') { state.cycleTarget(); return; }
      }
      pressed.current[key] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => { pressed.current[e.key.toLowerCase()] = false; };
    const visibility = () => { clear(); if (document.hidden && !useGameStore.getState().paused) useGameStore.getState().togglePause(); };
    window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clear); document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  return { pressed: pressed.current, lastFacingDir: lastFacingDir.current };
}
