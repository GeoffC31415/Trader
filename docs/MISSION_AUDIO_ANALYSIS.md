# Mission Audio Analysis

## Summary

**Issue**: Audio not playing for later mission stages (e.g., `energy_monopoly_stage_3_refinery` - "The Blockade - Defend Refinery Convoys")

**Root Cause**: Missions without generated audio are missing from `public/audio/missions/manifest.json`, so `getMissionIntroAudio()` returns `[]` and playback silently does nothing.

**Status (2026-01-04)**:
- Arc 3 (Energy Monopoly) dialogue is now defined and included in `docs/mission_dialogue_export.json` (export shows **17 missions / 191 lines**).
- Arc 3 stages 2–4 still need MP3 generation + manifest regeneration via `scripts/generate_mission_voices.mjs`.

## Mission Status Overview

### ✅ Missions WITH Audio (12 total)
These missions have audio files generated and present in `public/audio/missions/manifest.json`:

1. **Arc 1: Greenfields Independence**
   - ✅ `greenfields_stage_1` - Breaking the Chain
   - ✅ `greenfields_stage_2` - The Census (Greenfields Side)
   - ✅ `greenfields_stage_2_sol` - The Census (Sol City Side)
   - ✅ `greenfields_stage_3` - Supply Cut
   - ✅ `greenfields_stage_4` - New Markets - Independence Finale
   - ✅ `sol_city_stage_3` - Agricultural Compliance Escort

2. **Arc 2: Fabrication Wars**
   - ✅ `fabrication_wars_aurum_stage_1` - Patent Wars (Aurum Path)
   - ✅ `fabrication_wars_drydock_stage_1` - Patent Wars (Drydock Path)

3. **Arc 3: Energy Monopoly**
   - ✅ `energy_monopoly_stage_1` - The Audit Trail

4. **Arc 4: Pirate Accords**
   - ✅ `pirate_accords_stage_1` - Diplomatic Pouch
   - ✅ `pirate_accords_stage_2_vex` - Choose Your Side (Vex Introduction)

5. **Arc 5: Union Crisis**
   - ✅ `union_crisis_stage_1` - Organize the Stations

### 🟡 Missions WITH Dialogue Defined, but Audio NOT Generated Yet (5 total)

These missions are now present in `docs/mission_dialogue_export.json`, but will not play until audio is generated (and the manifest is regenerated):

3. **Arc 3: Energy Monopoly**
   - 🟡 `energy_monopoly_stage_2` - Fuel the Fire
   - 🟡 `energy_monopoly_stage_3_refinery` - The Blockade - Defend Refinery Convoys
   - 🟡 `energy_monopoly_stage_3_ceres` - The Blockade - Raid Refinery Shipments
   - 🟡 `energy_monopoly_stage_4_refinery` - New Sources - Independent Refinery
   - 🟡 `energy_monopoly_stage_4_ceres` - Consolidate Control - Fuel Market Domination

### ❌ Missions WITHOUT Dialogue Export (Remaining)

These missions exist in the templates but have NO dialogue defined, so no audio files were generated:

1. **Arc 1: Greenfields Independence**
   - ❌ `sol_city_stage_4` - Enforcement Contracts Distribution

2. **Arc 2: Fabrication Wars** (6 missing missions)
   - ❌ `fabrication_wars_stage_2_aurum` - Supply Chain Competition (Aurum Path)
   - ❌ `fabrication_wars_stage_2_drydock` - Supply Chain Competition (Drydock Path)
   - ❌ `fabrication_wars_stage_3` - The Sabotage (Choice mission)
   - ❌ `fabrication_wars_stage_3_aurum` - Supply Chain Sabotage (Aurum Path)
   - ❌ `fabrication_wars_stage_3_drydock` - The Human Cost (Drydock Path)
   - ❌ `fabrication_wars_stage_4_aurum` - The Efficiency Doctrine (Aurum Finale)
   - ❌ `fabrication_wars_stage_4_drydock` - Craftsmanship Vindicated (Drydock Finale)

4. **Arc 4: Pirate Accords** (4 missing missions)
   - ❌ `pirate_accords_stage_2` - Choose Your Side (Choice mission)
   - ❌ `pirate_accords_stage_3_pirate` - The Enforcement - Assault Sol City Defenses
   - ❌ `pirate_accords_stage_3_law` - The Enforcement - Siege Hidden Cove
   - ❌ `pirate_accords_stage_3_peace` - The Enforcement - Defend Peace Conference

5. **Arc 5: Union Crisis** (3 missing missions)
   - ❌ `union_crisis_stage_2` - Strike or Break (Choice mission)
   - ❌ `union_crisis_stage_3_union` - The Negotiations - Union Victory
   - ❌ `union_crisis_stage_3_corporate` - The Negotiations - Corporate Victory

## Technical Details

### How Audio Works

1. **Dialogue Definition**: Mission dialogue is manually defined in `scripts/export_mission_dialogue.mjs`
2. **Export**: Running the export script generates `docs/mission_dialogue_export.json`
3. **Voice Generation**: Audio files are generated from the export JSON
4. **Manifest**: Generated audio files are registered in `public/audio/missions/manifest.json`
5. **Playback**: The UI calls `getMissionIntroAudio(missionId)` which looks up files in the manifest

### Why Audio Doesn't Play

When clicking "LISTEN" for `energy_monopoly_stage_3_refinery`:

1. `playIntro()` calls `missionAudio.getMissionIntroAudio('energy_monopoly_stage_3_refinery')`
2. This loads the manifest and looks for `manifest.missions['energy_monopoly_stage_3_refinery']`
3. The mission is **not in the manifest** because audio files have not been generated for it yet
4. `getMissionIntroAudio()` returns an empty array `[]`
5. `playAudioSequence([])` immediately completes without playing anything
6. The button shows "LISTEN" but nothing happens

### Code Flow

```typescript
// In MissionsSection.tsx
const playIntro = useCallback(async (missionId: string) => {
  const introPaths = await missionAudio.getMissionIntroAudio(missionId);
  // introPaths is [] for missions without audio
  if (introPaths.length > 0) {
    await missionAudio.playAudioSequence(introPaths, volume);
  } else {
    // Silently fails - no error, just no audio
    setPlayingIntro(null);
  }
}, [playingIntro]);
```

## Recommendations

### Immediate Fix (Arc 3: Generate Audio + Manifest)

Now that Arc 3 dialogue is exported, generate the new MP3s + regenerate the manifest:

1. Preview (no API calls):

```bash
node scripts/generate_mission_voices.mjs --preview --mission energy_monopoly_stage_3_refinery
```

2. Generate (requires `ELEVENLABS_API_KEY`):

```bash
node scripts/generate_mission_voices.mjs --mission energy_monopoly_stage_3_refinery
node scripts/generate_mission_voices.mjs --mission energy_monopoly_stage_3_ceres
node scripts/generate_mission_voices.mjs --mission energy_monopoly_stage_4_refinery
node scripts/generate_mission_voices.mjs --mission energy_monopoly_stage_4_ceres
```

Optionally include Stage 2:

```bash
node scripts/generate_mission_voices.mjs --mission energy_monopoly_stage_2
```

> Note: this script also regenerates `public/audio/missions/manifest.json` automatically at the end.

### Dialogue Definition Reference (Already Implemented)

```javascript
{
  missionId: 'energy_monopoly_stage_3_refinery',
  characterId: 'helios-rep',
  characterName: 'Rex Calder',
  stationId: 'sol-refinery',
  title: 'The Blockade - Defend Refinery Convoys',
  lines: [
    // Introduction lines (6-7 lines)
    { id: 'energy_s3_refinery_intro_1', phase: 'introduction', text: '...', emotionTag: '...' },
    // ... more intro lines
    { id: 'energy_s3_refinery_accept', phase: 'acceptance', text: '...', emotionTag: '...' },
    // Key moments during mission
    { id: 'energy_s3_refinery_wave_1', phase: 'key_moment', text: '...', emotionTag: '...' },
    // Completion lines
    { id: 'energy_s3_refinery_complete_1', phase: 'completion_success', text: '...', emotionTag: '...' },
    // ... more completion lines
  ],
}
```

### Long-term Solution

1. **Add all missing mission dialogue** to `scripts/export_mission_dialogue.mjs` (17 missions)
2. **Run export script**: `node scripts/export_mission_dialogue.mjs`
3. **Generate audio files**: `node scripts/generate_mission_voices.mjs`
4. **Regenerate manifest**: The manifest should be auto-generated when audio files are created

### Priority Order

Based on user progression and story importance:

1. **High Priority** (User reported):
   - `energy_monopoly_stage_3_refinery` - The Blockade - Defend Refinery Convoys
   - `energy_monopoly_stage_3_ceres` - The Blockade - Raid Refinery Shipments
   - `energy_monopoly_stage_4_refinery` - New Sources - Independent Refinery
   - `energy_monopoly_stage_4_ceres` - Consolidate Control

2. **Medium Priority** (Story completion):
   - `fabrication_wars_stage_3_aurum` - Supply Chain Sabotage
   - `fabrication_wars_stage_3_drydock` - The Human Cost
   - `fabrication_wars_stage_4_aurum` - The Efficiency Doctrine
   - `fabrication_wars_stage_4_drydock` - Craftsmanship Vindicated
   - `pirate_accords_stage_3_pirate` - Assault Sol City Defenses
   - `pirate_accords_stage_3_law` - Siege Hidden Cove
   - `pirate_accords_stage_3_peace` - Defend Peace Conference
   - `union_crisis_stage_3_union` - The Negotiations - Union Victory
   - `union_crisis_stage_3_corporate` - The Negotiations - Corporate Victory

3. **Lower Priority** (Earlier stages, choice missions):
   - `energy_monopoly_stage_2` - Fuel the Fire (Choice mission)
   - `fabrication_wars_stage_2_aurum` - Supply Chain Competition
   - `fabrication_wars_stage_2_drydock` - Supply Chain Competition
   - `fabrication_wars_stage_3` - The Sabotage (Choice mission)
   - `pirate_accords_stage_2` - Choose Your Side (Choice mission)
   - `union_crisis_stage_2` - Strike or Break (Choice mission)
   - `sol_city_stage_4` - Enforcement Contracts Distribution

## Verification Steps

To verify which missions have audio:

1. Check manifest: `public/audio/missions/manifest.json` - lists all missions with audio files
2. Check export script: `scripts/export_mission_dialogue.mjs` - lists all missions with dialogue defined
3. Check audio files: `public/audio/missions/` - actual MP3 files organized by station/mission

## Notes

- Choice missions (`energy_monopoly_stage_2`, `pirate_accords_stage_2`, etc.) may not need intro audio since they're presented as choice dialogs
- Some missions may intentionally not have audio (e.g., very short missions, tutorial missions)
- The manifest is generated automatically when audio files are created - it should not be edited manually

