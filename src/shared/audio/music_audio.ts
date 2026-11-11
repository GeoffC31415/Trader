/** Gesture-started music with cancellable transitions and retryable autoplay failures. */
type MusicManifest = { tracks: Record<string, { path: string }> };
let manifest: Promise<MusicManifest | null> | undefined;
let active: HTMLAudioElement | null = null;
let outgoing: HTMLAudioElement | null = null;
let currentTrackId: string | null = null;
let generation = 0;
let timer: ReturnType<typeof setInterval> | undefined;
let masterVolume = 1;
let isMuted = false;

async function loadManifest(): Promise<MusicManifest | null> {
  if (!manifest) manifest = fetch('/audio/music/manifest.json').then(async response => {
    if (!response.ok) throw new Error('Music manifest unavailable');
    return await response.json() as MusicManifest;
  }).catch(error => { manifest = undefined; console.warn('Music unavailable:', error); return null; });
  return manifest;
}
function clearFade() {
  if (timer !== undefined) clearInterval(timer);
  timer = undefined;
  outgoing?.pause(); outgoing = null;
}
async function playTrack(id: string): Promise<void> {
  if (currentTrackId === id && active && !active.paused) return;
  const request = ++generation;
  const data = await loadManifest();
  if (request !== generation) return;
  const path = data?.tracks[id]?.path;
  if (!path) throw new Error(`Music track unavailable: ${id}`);
  const next = new Audio('/' + path.replace(/^\//, ''));
  next.loop = true; next.volume = 0;
  try { await next.play(); } catch (error) { next.pause(); throw error; }
  if (request !== generation) { next.pause(); return; }
  clearFade();
  outgoing = active; active = next; currentTrackId = id;
  const startVolume = outgoing?.volume ?? 0;
  let step = 0;
  timer = setInterval(() => {
    const progress = Math.min(1, ++step / 20);
    next.volume = isMuted ? 0 : progress * masterVolume;
    if (outgoing) outgoing.volume = isMuted ? 0 : (1 - progress) * Math.min(startVolume, masterVolume);
    if (progress >= 1) clearFade();
  }, 100);
}
export function playAmbient(state: 'exploring' | 'combat'): Promise<void> { return playTrack(`ambient_${state}`); }
export function playStation(stationId: string): Promise<void> { return playTrack(stationId); }
export async function stopAll(): Promise<void> {
  ++generation; clearFade(); active?.pause(); active = null; currentTrackId = null;
}
export function setVolume(volume: number): void {
  masterVolume = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 0;
  if (active) active.volume = isMuted ? 0 : masterVolume;
  if (outgoing) outgoing.volume = isMuted ? 0 : Math.min(outgoing.volume, masterVolume);
}
export function getVolume(): number { return masterVolume; }
export function setMuted(muted: boolean): void {
  isMuted = muted;
  if (active) active.volume = muted ? 0 : masterVolume;
  if (outgoing && muted) outgoing.volume = 0;
}
export function getMuted(): boolean { return isMuted; }
export function preloadManifest(): void { void loadManifest(); }
// Fetching metadata does not unlock audio. Actual playback is requested only after a gesture.
export async function initializeMusic(): Promise<void> { await loadManifest(); }
export function getPlaybackState() { return { trackId: currentTrackId, playing: !!active && !active.paused }; }
