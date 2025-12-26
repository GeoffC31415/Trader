/**
 * Audio utilities for mission dialogue playback
 * 
 * Handles loading the mission manifest and playing sequenced audio
 * for mission introductions, key moments, and completions.
 */

type MissionFile = {
  id: string;
  filename: string;
  path: string;
};

type MissionAudioEntry = {
  characterName: string;
  stationId: string;
  title: string;
  lineCount: number;
  files: MissionFile[];
};

type MissionManifest = {
  generatedAt: string;
  totalFiles: number;
  missions: Record<string, MissionAudioEntry>;
};

let manifestCache: MissionManifest | null = null;
let currentAudioElement: HTMLAudioElement | null = null;
let audioQueue: string[] = [];
let isPlaying = false;
let onQueueComplete: (() => void) | null = null;

/**
 * Load the mission audio manifest (cached after first load)
 */
async function loadManifest(): Promise<MissionManifest | null> {
  if (manifestCache) {
    return manifestCache;
  }

  try {
    const response = await fetch('/audio/missions/manifest.json');
    if (!response.ok) {
      console.warn('Mission audio manifest not found, audio will be disabled');
      return null;
    }
    manifestCache = await response.json();
    return manifestCache;
  } catch (error) {
    console.warn('Failed to load mission audio manifest:', error);
    return null;
  }
}

/**
 * Get all audio files for a specific mission
 */
export async function getMissionAudioFiles(missionId: string): Promise<MissionFile[] | null> {
  const manifest = await loadManifest();
  if (!manifest) return null;

  const mission = manifest.missions[missionId];
  if (!mission) return null;

  return mission.files;
}

/**
 * Get audio file path by mission ID and line ID
 */
export async function getMissionAudioPath(
  missionId: string,
  lineId: string
): Promise<string | null> {
  const files = await getMissionAudioFiles(missionId);
  if (!files) return null;

  const file = files.find(f => f.id === lineId);
  if (!file) return null;

  return `/${file.path}`;
}

/**
 * Get introduction audio files for a mission (sorted by intro_N order)
 */
export async function getMissionIntroAudio(missionId: string): Promise<string[]> {
  const files = await getMissionAudioFiles(missionId);
  if (!files) return [];

  // Filter for intro files and sort by number
  const introFiles = files
    .filter(f => f.id.includes('_intro_'))
    .sort((a, b) => {
      const numA = parseInt(a.id.match(/_intro_(\d+)$/)?.[1] || '0');
      const numB = parseInt(b.id.match(/_intro_(\d+)$/)?.[1] || '0');
      return numA - numB;
    });

  return introFiles.map(f => `/${f.path}`);
}

/**
 * Get acceptance audio for a mission
 */
export async function getMissionAcceptAudio(missionId: string): Promise<string | null> {
  const files = await getMissionAudioFiles(missionId);
  if (!files) return null;

  const acceptFile = files.find(f => f.id.includes('_accept'));
  if (!acceptFile) return null;

  return `/${acceptFile.path}`;
}

/**
 * Get completion audio files for a mission (sorted by complete_N order)
 */
export async function getMissionCompleteAudio(missionId: string): Promise<string[]> {
  const files = await getMissionAudioFiles(missionId);
  if (!files) return [];

  // Filter for complete files and sort by number
  const completeFiles = files
    .filter(f => f.id.includes('_complete_'))
    .sort((a, b) => {
      const numA = parseInt(a.id.match(/_complete_(\d+)$/)?.[1] || '0');
      const numB = parseInt(b.id.match(/_complete_(\d+)$/)?.[1] || '0');
      return numA - numB;
    });

  return completeFiles.map(f => `/${f.path}`);
}

/**
 * Get key moment audio by trigger ID
 * Key moments are specific triggers during missions (e.g., "halfway", "warning", "convoy_1")
 */
export async function getKeyMomentAudio(missionId: string, triggerId: string): Promise<string | null> {
  const files = await getMissionAudioFiles(missionId);
  if (!files) return null;

  // Look for file matching the trigger ID pattern
  const triggerFile = files.find(f => f.id.includes(`_${triggerId}`));
  if (!triggerFile) return null;

  return `/${triggerFile.path}`;
}

/**
 * Stop any currently playing audio
 */
export function stopMissionAudio(): void {
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement.currentTime = 0;
    currentAudioElement = null;
  }
  audioQueue = [];
  isPlaying = false;
  onQueueComplete = null;
}

/**
 * Play a single audio file
 */
export async function playMissionAudio(
  audioPath: string,
  volume: number = 0.8
): Promise<void> {
  return new Promise((resolve, reject) => {
    stopMissionAudio();

    const audio = new Audio(audioPath);
    audio.volume = volume;
    currentAudioElement = audio;
    isPlaying = true;

    audio.onended = () => {
      isPlaying = false;
      currentAudioElement = null;
      resolve();
    };

    audio.onerror = () => {
      isPlaying = false;
      currentAudioElement = null;
      reject(new Error(`Failed to play audio: ${audioPath}`));
    };

    audio.play().catch(reject);
  });
}

/**
 * Play a sequence of audio files with optional callback on completion
 */
export async function playAudioSequence(
  audioPaths: string[],
  volume: number = 0.8,
  onComplete?: () => void
): Promise<void> {
  if (audioPaths.length === 0) {
    onComplete?.();
    return;
  }

  stopMissionAudio();
  audioQueue = [...audioPaths];
  onQueueComplete = onComplete || null;

  await playNextInQueue(volume);
}

async function playNextInQueue(volume: number): Promise<void> {
  if (audioQueue.length === 0) {
    isPlaying = false;
    onQueueComplete?.();
    onQueueComplete = null;
    return;
  }

  const nextPath = audioQueue.shift()!;
  
  try {
    await playMissionAudio(nextPath, volume);
    await playNextInQueue(volume);
  } catch (error) {
    console.warn('Audio playback error, continuing queue:', error);
    await playNextInQueue(volume);
  }
}

/**
 * Check if mission audio is currently playing
 */
export function isMissionAudioPlaying(): boolean {
  return isPlaying;
}

/**
 * Get all available key moment triggers for a mission
 */
export async function getAvailableKeyMoments(missionId: string): Promise<string[]> {
  const files = await getMissionAudioFiles(missionId);
  if (!files) return [];

  // Exclude intro, accept, complete, and fail files
  const keyMomentFiles = files.filter(f => 
    !f.id.includes('_intro_') &&
    !f.id.includes('_accept') &&
    !f.id.includes('_complete_') &&
    !f.id.includes('_fail_')
  );

  // Extract trigger IDs from filenames
  return keyMomentFiles.map(f => {
    // Extract the trigger part after the prefix
    const match = f.id.match(/_([^_]+)$/);
    return match ? match[1] : f.id;
  });
}

/**
 * Preload manifest on app start
 */
export function preloadMissionManifest(): void {
  loadManifest().catch(() => {
    // Silently fail - audio will just be disabled
  });
}

/**
 * Check if audio exists for a mission
 */
export async function hasMissionAudio(missionId: string): Promise<boolean> {
  const manifest = await loadManifest();
  if (!manifest) return false;
  return !!manifest.missions[missionId];
}

