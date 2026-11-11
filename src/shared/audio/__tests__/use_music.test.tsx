// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useGameStore } from '../../../state';
import { useMusicController } from '../use_music';
import * as audio from '../music_audio';
vi.mock('../music_audio', () => ({ preloadManifest: vi.fn(), setVolume: vi.fn(), stopAll: vi.fn(), playAmbient: vi.fn(), playStation: vi.fn(), getPlaybackState: vi.fn() }));
const original = useGameStore.getState();
let playback = { trackId: null as string | null, playing: false };
function Harness() { useMusicController(); return <button onClick={() => useGameStore.getState().chooseStarter('freighter')}>Start</button>; }
beforeEach(() => {
  vi.clearAllMocks(); playback = { trackId: null, playing: false };
  useGameStore.setState(useGameStore.getInitialState(), true);
  vi.mocked(audio.getPlaybackState).mockImplementation(() => playback);
  vi.mocked(audio.playAmbient).mockImplementation(async state => { playback = { trackId: `ambient_${state}`, playing: true }; });
  vi.mocked(audio.playStation).mockImplementation(async station => { playback = { trackId: station, playing: true }; });
});
afterEach(() => { cleanup(); useGameStore.setState(original, true); });
it('starts exploration on the first starter-selection gesture, without requiring docking or combat', async () => {
  render(<Harness />); expect(audio.playAmbient).not.toHaveBeenCalled();
  fireEvent.pointerDown(screen.getByRole('button')); fireEvent.click(screen.getByRole('button'));
  await waitFor(() => expect(audio.playAmbient).toHaveBeenCalledWith('exploring'));
  expect(audio.playStation).not.toHaveBeenCalled();
});
it('retries a denied first play on the next gesture rather than permanently marking it initialized', async () => {
  vi.mocked(audio.playAmbient).mockRejectedValueOnce(new Error('Autoplay denied'));
  render(<Harness />); fireEvent.pointerDown(screen.getByRole('button')); fireEvent.click(screen.getByRole('button'));
  await waitFor(() => expect(audio.playAmbient).toHaveBeenCalledTimes(1));
  await new Promise(resolve => setTimeout(resolve, 0));
  fireEvent.pointerDown(screen.getByRole('button'));
  await waitFor(() => expect(audio.playAmbient).toHaveBeenCalledTimes(2));
  expect(playback.playing).toBe(true);
});
