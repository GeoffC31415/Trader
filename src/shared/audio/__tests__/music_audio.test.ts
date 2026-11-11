import { afterEach, beforeEach, expect, it, vi } from 'vitest';
let deny = false;
class AudioStub {
  static instances: AudioStub[] = [];
  paused = true; volume = 1; loop = false;
  constructor(public src: string) { AudioStub.instances.push(this); }
  async play() { if (deny) { deny = false; throw new Error('Autoplay denied'); } this.paused = false; }
  pause() { this.paused = true; }
}
let music: typeof import('../music_audio');
beforeEach(async () => {
  vi.resetModules(); vi.useFakeTimers(); deny = false; AudioStub.instances = [];
  vi.stubGlobal('Audio', AudioStub);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ tracks: { ambient_exploring: { path: 'explore.mp3' }, ambient_combat: { path: 'fight.mp3' }, 'sol-city': { path: 'city.mp3' } } }) }));
  music = await import('../music_audio');
});
afterEach(async () => { await music.stopAll(); vi.useRealTimers(); vi.unstubAllGlobals(); });
it('preloads metadata without creating or playing audio', async () => {
  await music.initializeMusic(); expect(AudioStub.instances).toHaveLength(0); expect(music.getPlaybackState().playing).toBe(false);
});
it('does not remember failed autoplay as playing, and retries the same track', async () => {
  deny = true; await expect(music.playAmbient('exploring')).rejects.toThrow('Autoplay');
  expect(music.getPlaybackState()).toEqual({ trackId: null, playing: false });
  await music.playAmbient('exploring'); expect(music.getPlaybackState()).toEqual({ trackId: 'ambient_exploring', playing: true });
  await music.playAmbient('exploring'); expect(AudioStub.instances).toHaveLength(2);
});
it('lets the latest requested destination win asynchronous startup races', async () => {
  const explore = music.playAmbient('exploring'), city = music.playStation('sol-city');
  await Promise.all([explore, city]); expect(music.getPlaybackState().trackId).toBe('sol-city');
  expect(AudioStub.instances.filter(a => !a.paused).map(a => a.src)).toEqual(['/city.mp3']);
});
it('retires previous fades and honors mute, volume and stop on both channels', async () => {
  await music.playAmbient('exploring'); vi.advanceTimersByTime(2200);
  const exploring = AudioStub.instances[0];
  await music.playStation('sol-city'); music.setMuted(true); vi.advanceTimersByTime(500);
  expect(AudioStub.instances.every(a => a.volume === 0)).toBe(true);
  music.setVolume(0.4); music.setMuted(false); vi.advanceTimersByTime(2200);
  expect(exploring.paused).toBe(true); expect(AudioStub.instances[1].volume).toBe(0.4);
  await music.stopAll(); expect(AudioStub.instances.every(a => a.paused)).toBe(true); expect(music.getPlaybackState().playing).toBe(false);
});
