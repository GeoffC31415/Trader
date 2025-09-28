export type AvatarPrompt = {
  stationId: string;
  name: string;
  prompt: string;
};

export const avatarPrompts: AvatarPrompt[] = [
  { stationId: 'sol-city', name: 'Mira Vale', prompt: 'futuristic trade liaison, mid-30s, sleek municipal attire, tasteful gold accents, calm confident expression, sci-fi spaceport backdrop, volumetric light, cinematic, 35mm, high detail' },
  { stationId: 'sol-refinery', name: 'Rex Calder', prompt: 'industrial refinery foreman, late-40s, grease-marked utility jacket, hard hat with visor, harsh industrial lighting, pipes and tanks background, gritty realism' },
  { stationId: 'aurum-fab', name: 'Dr. Elin Kade', prompt: 'futuristic fabrication engineer, sharp features, lab coat over smart techwear, holographic schematics, cool color palette, studio lighting' },
  { stationId: 'greenfields', name: 'Sana Whit', prompt: 'spacefaring agrarian steward, practical workwear with earth tones, hydroponic greenery, gentle smile, soft sunlight, pastoral sci-fi aesthetic' },
  { stationId: 'ceres-pp', name: 'Ivo Renn', prompt: 'power plant operator, minimalist utility suit, data tablet, cool cyan UI glow, turbine backdrop, clean sci-fi style' },
  { stationId: 'freeport', name: 'Kalla Rook', prompt: 'charismatic spacer in patched jacket, eclectic pins, neon stall signs, lively bazaar vibe, bold color lighting' },
  { stationId: 'drydock', name: 'Chief Harlan', prompt: 'veteran dockmaster, heavy-duty coveralls, magnetic boots, sparks and scaffolds, warm rim light, cinematic portrait' },
  { stationId: 'hidden-cove', name: 'Vex Marrow', prompt: 'pirate quartermaster, asymmetrical armor, scars and smirk, dim red cabin lights, contraband crates, high-contrast noir sci-fi' },
];


