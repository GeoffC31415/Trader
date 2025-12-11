// Audio utilities for dialogue playback
// Loads manifest and provides audio file path lookup

type DialogueManifest = {
  generatedAt: string;
  totalFiles: number;
  characters: Record<string, {
    characterName: string;
    lineCount: number;
    files: Array<{
      id: string;
      filename: string;
      path: string;
    }>;
  }>;
};

let manifestCache: DialogueManifest | null = null;

/**
 * Load the dialogue manifest (cached after first load)
 */
async function loadManifest(): Promise<DialogueManifest | null> {
  if (manifestCache) {
    return manifestCache;
  }

  try {
    const response = await fetch('/audio/dialogue/manifest.json');
    if (!response.ok) {
      console.warn('Dialogue manifest not found, audio will be disabled');
      return null;
    }
    manifestCache = await response.json();
    return manifestCache;
  } catch (error) {
    console.warn('Failed to load dialogue manifest:', error);
    return null;
  }
}

/**
 * Get audio file path for a dialogue line
 * Returns the full URL path (e.g., "/audio/dialogue/sol-city/mira_greet_stranger.mp3")
 */
export async function getDialogueAudioPath(
  stationId: string,
  lineId: string
): Promise<string | null> {
  const manifest = await loadManifest();
  if (!manifest) return null;

  const character = manifest.characters[stationId];
  if (!character) return null;

  const file = character.files.find(f => f.id === lineId);
  if (!file) return null;

  // Return path with leading slash for Vite public assets
  return `/${file.path}`;
}

/**
 * Preload manifest on app start (optional, for faster first access)
 */
export function preloadManifest(): void {
  loadManifest().catch(() => {
    // Silently fail - audio will just be disabled
  });
}

