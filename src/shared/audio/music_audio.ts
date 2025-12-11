/**
 * Music audio manager for background and station music
 * 
 * Handles playback, crossfading, and volume control for game music.
 * Uses two audio channels for smooth transitions between tracks.
 */

type MusicManifest = {
  generatedAt: string;
  totalFiles: number;
  tracks: Record<string, {
    id: string;
    category: 'ambient' | 'station';
    stationId?: string;
    path: string;
    duration: number;
  }>;
};

let manifestCache: MusicManifest | null = null;

// Two audio channels for crossfading
let channelA: HTMLAudioElement | null = null;
let channelB: HTMLAudioElement | null = null;
let activeChannel: 'A' | 'B' = 'A';
let currentTrackId: string | null = null;
let isMuted = false;
let masterVolume = 1.0;

// Crossfade settings
const CROSSFADE_DURATION = 2000; // milliseconds
const FADE_STEPS = 20;
const FADE_INTERVAL = CROSSFADE_DURATION / FADE_STEPS;

/**
 * Load the music manifest (cached after first load)
 */
async function loadManifest(): Promise<MusicManifest | null> {
  if (manifestCache) {
    return manifestCache;
  }

  try {
    const response = await fetch('/audio/music/manifest.json');
    if (!response.ok) {
      console.warn('Music manifest not found, music will be disabled');
      return null;
    }
    manifestCache = await response.json();
    return manifestCache;
  } catch (error) {
    console.warn('Failed to load music manifest:', error);
    return null;
  }
}

/**
 * Get audio file path for a track ID
 */
async function getTrackPath(trackId: string): Promise<string | null> {
  const manifest = await loadManifest();
  if (!manifest) return null;

  const track = manifest.tracks[trackId];
  if (!track) return null;

  return `/${track.path}`;
}

/**
 * Get the inactive channel (for crossfading)
 */
function getInactiveChannel(): 'A' | 'B' {
  return activeChannel === 'A' ? 'B' : 'A';
}

/**
 * Get the active audio element
 */
function getActiveElement(): HTMLAudioElement | null {
  return activeChannel === 'A' ? channelA : channelB;
}

/**
 * Get the inactive audio element
 */
function getInactiveElement(): HTMLAudioElement | null {
  return activeChannel === 'A' ? channelB : channelA;
}

/**
 * Create and configure an audio element
 */
function createAudioElement(src: string): HTMLAudioElement {
  const audio = new Audio(src);
  audio.loop = true;
  audio.volume = isMuted ? 0 : masterVolume;
  return audio;
}

/**
 * Crossfade between two audio elements
 */
async function crossfade(
  fadeOut: HTMLAudioElement | null,
  fadeIn: HTMLAudioElement | null
): Promise<void> {
  if (!fadeIn) return;

  // Start the new track at volume 0
  fadeIn.volume = 0;
  await fadeIn.play().catch(() => {
    // Ignore autoplay restrictions - will be handled by user interaction
  });

  // Fade out old, fade in new
  let step = 0;
  const interval = setInterval(() => {
    step++;
    const progress = step / FADE_STEPS;

    if (fadeIn) {
      fadeIn.volume = isMuted ? 0 : progress * masterVolume;
    }

    if (fadeOut) {
      fadeOut.volume = isMuted ? 0 : (1 - progress) * masterVolume;
    }

    if (step >= FADE_STEPS) {
      clearInterval(interval);
      if (fadeOut) {
        fadeOut.pause();
        fadeOut.currentTime = 0;
      }
    }
  }, FADE_INTERVAL);
}

/**
 * Fade out and stop an audio element
 */
async function fadeOut(audio: HTMLAudioElement | null): Promise<void> {
  if (!audio) return;

  let volume = audio.volume;
  const steps = 10;
  const stepInterval = 100; // ms per step
  const volumeStep = volume / steps;

  const interval = setInterval(() => {
    volume = Math.max(0, volume - volumeStep);
    audio.volume = isMuted ? 0 : volume;

    if (volume <= 0) {
      clearInterval(interval);
      audio.pause();
      audio.currentTime = 0;
    }
  }, stepInterval);
}

/**
 * Play ambient music (exploring or combat)
 */
export async function playAmbient(state: 'exploring' | 'combat'): Promise<void> {
  const trackId = state === 'exploring' ? 'ambient_exploring' : 'ambient_combat';
  
  // Don't restart if already playing
  if (currentTrackId === trackId) {
    return;
  }

  const trackPath = await getTrackPath(trackId);
  if (!trackPath) {
    console.warn(`Music track not found: ${trackId}`);
    return;
  }

  const inactiveChannel = getInactiveChannel();
  const fadeOutElement = getActiveElement();
  
  // Create new audio element on inactive channel
  const newAudio = createAudioElement(trackPath);
  
  if (inactiveChannel === 'A') {
    channelA = newAudio;
  } else {
    channelB = newAudio;
  }

  // Crossfade
  await crossfade(fadeOutElement, newAudio);
  
  // Switch active channel
  activeChannel = inactiveChannel;
  currentTrackId = trackId;
}

/**
 * Play station-specific music
 */
export async function playStation(stationId: string): Promise<void> {
  // Don't restart if already playing this station
  if (currentTrackId === stationId) {
    return;
  }

  const trackPath = await getTrackPath(stationId);
  if (!trackPath) {
    console.warn(`Music track not found for station: ${stationId}`);
    return;
  }

  const inactiveChannel = getInactiveChannel();
  const fadeOutElement = getActiveElement();
  
  // Create new audio element on inactive channel
  const newAudio = createAudioElement(trackPath);
  
  if (inactiveChannel === 'A') {
    channelA = newAudio;
  } else {
    channelB = newAudio;
  }

  // Crossfade
  await crossfade(fadeOutElement, newAudio);
  
  // Switch active channel
  activeChannel = inactiveChannel;
  currentTrackId = stationId;
}

/**
 * Stop all music with fadeout
 */
export async function stopAll(): Promise<void> {
  await Promise.all([
    fadeOut(channelA),
    fadeOut(channelB),
  ]);
  
  currentTrackId = null;
}

/**
 * Set master volume (0-1)
 */
export function setVolume(volume: number): void {
  masterVolume = Math.max(0, Math.min(1, volume));
  
  const active = getActiveElement();
  if (active) {
    active.volume = isMuted ? 0 : masterVolume;
  }
}

/**
 * Get current volume
 */
export function getVolume(): number {
  return masterVolume;
}

/**
 * Mute/unmute music
 */
export function setMuted(muted: boolean): void {
  isMuted = muted;
  
  const active = getActiveElement();
  if (active) {
    active.volume = muted ? 0 : masterVolume;
  }
}

/**
 * Get mute state
 */
export function getMuted(): boolean {
  return isMuted;
}

/**
 * Preload manifest on app start (optional, for faster first access)
 */
export function preloadManifest(): void {
  loadManifest().catch(() => {
    // Silently fail - music will just be disabled
  });
}

/**
 * Initialize music system (call after user interaction to enable autoplay)
 */
export async function initializeMusic(): Promise<void> {
  // Preload manifest
  await preloadManifest();
  
  // Try to play a silent audio to unlock autoplay
  // This should be called after user interaction
  try {
    const testAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAo');
    await testAudio.play();
    testAudio.pause();
  } catch (error) {
    // Ignore - autoplay will be handled by user interaction
  }
}

