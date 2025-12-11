/**
 * Music generation prompts for ElevenLabs Music Generation API
 * 
 * Each prompt describes the desired musical atmosphere matching
 * the station personas and game states.
 */

export type MusicTrackConfig = {
  id: string;
  prompt: string;
  duration: number; // seconds
};

export const musicPrompts = {
  ambient: {
    exploring: {
      id: 'ambient_exploring',
      prompt: 'Atmospheric ambient electronic music for space exploration. Gentle evolving synth pads, distant celestial tones, subtle cosmic textures. Slow tempo, meditative, endless void feeling. No drums, no melody. Sci-fi, minimalist, dreamlike. Seamlessly loopable. Background music for peaceful space travel.',
      duration: 180,
    } as MusicTrackConfig,
    combat: {
      id: 'ambient_combat',
      prompt: 'Intense electronic combat music. Driving synthesizers, pulsing bass, urgent percussion. Fast tempo, high energy, dangerous. Industrial undertones, sci-fi aesthetic. Tension and adrenaline. Aggressive but not overwhelming. Suitable for space combat encounters.',
      duration: 120,
    } as MusicTrackConfig,
  },
  stations: {
    'sol-city': {
      id: 'sol-city',
      prompt: 'Polished metropolitan electronic music. Clean synth leads, sophisticated chord progressions, subtle percussion. Professional, efficient, civic energy. Modern city ambiance with futuristic touches. Medium tempo, confident, orderly. Conveys a sense of organized civilization and municipal authority.',
      duration: 120,
    } as MusicTrackConfig,
    'sol-refinery': {
      id: 'sol-refinery',
      prompt: 'Industrial electronic music with mechanical rhythms. Gritty synth textures, metallic percussion, steady industrial pulse. Harsh but functional. Conveys refinery operations, fuel processing, blue-collar work ethic. Medium-fast tempo, no-nonsense, practical energy.',
      duration: 120,
    } as MusicTrackConfig,
    'aurum-fab': {
      id: 'aurum-fab',
      prompt: 'Precise technological electronic music. Clinical synth tones, precise rhythms, clean production. Conveys fabrication, automation, efficiency. Minimalist but sophisticated. Cool color palette in sound. Methodical, calculated, high-tech atmosphere.',
      duration: 120,
    } as MusicTrackConfig,
    'greenfields': {
      id: 'greenfields',
      prompt: 'Organic pastoral electronic music. Warm synth pads, gentle rhythms, earthy tones mixed with space-age textures. Conveys agricultural work, hydroponic farming, cooperative spirit. Medium tempo, grounded, welcoming. Pastoral sci-fi aesthetic.',
      duration: 120,
    } as MusicTrackConfig,
    'ceres-pp': {
      id: 'ceres-pp',
      prompt: 'Methodical electronic power plant music. Humming bass tones, steady pulse, electrical energy in sound design. Conveys grid stability, power generation, systematic operations. Medium tempo, reliable, data-driven. Cool cyan tones, clean production.',
      duration: 120,
    } as MusicTrackConfig,
    'freeport': {
      id: 'freeport',
      prompt: 'Eclectic bustling bazaar electronic music. Lively rhythms, diverse synth textures, marketplace energy. Conveys free trade, neutral ground, diverse merchants. Medium-fast tempo, charming, slightly chaotic but organized. Neon-lit spaceport atmosphere.',
      duration: 120,
    } as MusicTrackConfig,
    'drydock': {
      id: 'drydock',
      prompt: 'Heavy metallic shipyard music. Industrial percussion, metallic synth textures, worker energy. Conveys ship construction, union work, craftsmanship. Medium tempo, reliable, blue-collar pride. Sparks and scaffolds in sound design.',
      duration: 120,
    } as MusicTrackConfig,
    'hidden-cove': {
      id: 'hidden-cove',
      prompt: 'Dark edgy noir electronic music. Low bass, shadowy synth textures, dangerous undertones. Conveys pirate station, lawless frontier, underground operations. Medium tempo, mysterious, slightly menacing. High-contrast noir sci-fi aesthetic.',
      duration: 120,
    } as MusicTrackConfig,
  },
};

/**
 * Get all track configs as a flat array
 */
export function getAllTracks(): MusicTrackConfig[] {
  return [
    ...Object.values(musicPrompts.ambient),
    ...Object.values(musicPrompts.stations),
  ];
}

/**
 * Get track config by ID
 */
export function getTrackById(id: string): MusicTrackConfig | undefined {
  const allTracks = getAllTracks();
  return allTracks.find(t => t.id === id);
}

