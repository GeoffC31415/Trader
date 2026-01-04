/**
 * Export Mission Dialogue for Voice Generation
 * 
 * This script extracts all mission dialogue from mission_dialogue.ts
 * and exports it to a JSON format compatible with the voice generation pipeline.
 * 
 * Usage:
 *   node scripts/export_mission_dialogue.mjs
 * 
 * Output:
 *   docs/mission_dialogue_export.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Voice config mapping (same as regular dialogue)
const voiceConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'voice_config.json'), 'utf-8')
);

/**
 * Import a TypeScript module from src/ by transpiling it in-memory.
 * This avoids duplicating mission dialogue between the game and export pipeline.
 */
async function importTsModule(tsFilePath) {
  const sourceText = fs.readFileSync(tsFilePath, 'utf-8');
  const { outputText } = ts.transpileModule(sourceText, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      // mission_dialogue.ts / mission_constants.ts use no JSX, no decorators, etc.
    },
    fileName: tsFilePath,
  });
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(outputText, 'utf-8').toString('base64')}`;
  return await import(moduleUrl);
}

/**
 * Build export structure
 */
async function buildExport() {
  const missionDialogueModule = await importTsModule(
    path.join(__dirname, '..', 'src', 'systems', 'missions', 'mission_dialogue.ts')
  );
  const missionConstantsModule = await importTsModule(
    path.join(__dirname, '..', 'src', 'domain', 'constants', 'mission_constants.ts')
  );

  const getAllDialogueLinesForExport = missionDialogueModule.getAllDialogueLinesForExport;
  if (typeof getAllDialogueLinesForExport !== 'function') {
    throw new Error('mission_dialogue.ts did not export getAllDialogueLinesForExport()');
  }

  const missionTemplates = missionConstantsModule.MISSION_TEMPLATES;
  if (!missionTemplates || typeof missionTemplates !== 'object') {
    throw new Error('mission_constants.ts did not export MISSION_TEMPLATES');
  }

  const exportData = {
    generatedAt: new Date().toISOString(),
    description: 'Mission dialogue export for ElevenLabs voice generation',
    totalLines: 0,
    emotionTagsUsed: new Set(),
    missions: [],
  };
  
  // Get all dialogue lines from the game source
  const allLines = getAllDialogueLinesForExport();

  // Group lines by missionId -> stationId, since some missions have alternate voice sets.
  const byMission = new Map();
  for (const line of allLines) {
    if (!byMission.has(line.missionId)) byMission.set(line.missionId, new Map());
    const byStation = byMission.get(line.missionId);
    if (!byStation.has(line.stationId)) byStation.set(line.stationId, []);
    byStation.get(line.stationId).push(line);
  }

  // Prefer canonical station variants when multiple exist for the same missionId.
  // This keeps manifest keys aligned with in-game mission IDs.
  const preferredStationByMissionId = {
    // Greenfields stage 2 is offered at both stations but the canonical voice set is Sana at Greenfields.
    greenfields_stage_2: 'greenfields',
  };

  const missionIds = Object.keys(missionTemplates).sort();

  for (const missionId of missionIds) {
    const template = missionTemplates[missionId];
    const stationMap = byMission.get(missionId);
    if (!stationMap) {
      console.warn(`⚠️  No dialogue found for mission: ${missionId}`);
      continue;
    }

    const preferredStation = preferredStationByMissionId[missionId];
    const stationId = preferredStation && stationMap.has(preferredStation)
      ? preferredStation
      : Array.from(stationMap.keys())[0];

    const missionLines = stationMap.get(stationId) || [];

    const config = voiceConfig[stationId];
    if (!config) {
      console.warn(`⚠️  No voice config for station: ${stationId} (mission: ${missionId})`);
      continue;
    }

    // Sort lines in a sensible order for export/readability
    const phaseRank = {
      introduction: 1,
      acceptance: 2,
      key_moment: 3,
      completion_success: 4,
      completion_failure: 5,
    };
    missionLines.sort((a, b) => {
      const ra = phaseRank[a.phase] || 99;
      const rb = phaseRank[b.phase] || 99;
      if (ra !== rb) return ra - rb;
      return a.lineId.localeCompare(b.lineId);
    });

    const missionExport = {
      missionId,
      title: template?.title || missionId,
      characterName: missionLines[0]?.characterName || 'Unknown',
      stationId,
      voiceDirection: config.description,
      gender: config.gender,
      ageRange: config.ageRange,
      lineCount: missionLines.length,
      lines: [],
    };

    for (const line of missionLines) {
      // Extract emotion tags from text
      const emotionTags = [];
      const tagMatches = line.text.match(/\[([^\]]+)\]/g);
      if (tagMatches) {
        tagMatches.forEach(tag => {
          const tagContent = tag.slice(1, -1);
          emotionTags.push(tagContent);
          exportData.emotionTagsUsed.add(tagContent);
        });
      }
      
      missionExport.lines.push({
        id: line.lineId,
        text: line.text,
        phase: line.phase,
        voiceTone: line.emotionTag || 'neutral',
        emotionTags: emotionTags.length > 0 ? emotionTags : undefined,
        suggestedFilename: `missions/${stationId}/${missionId}/${line.lineId}.mp3`,
      });
      
      exportData.totalLines++;
    }
    
    missionExport.linesWithEmotionTags = missionExport.lines.filter(l => l.emotionTags).length;
    exportData.missions.push(missionExport);
  }
  
  // Convert Set to sorted array
  exportData.emotionTagsUsed = Array.from(exportData.emotionTagsUsed).sort();
  
  return exportData;
}

/**
 * Main
 */
async function main() {
  console.log('📋 Exporting mission dialogue for voice generation...\n');
  
  const exportData = await buildExport();
  
  // Write to docs folder
  const outputPath = path.join(__dirname, '..', 'docs', 'mission_dialogue_export.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  
  console.log('═'.repeat(60));
  console.log('📊 EXPORT SUMMARY');
  console.log('═'.repeat(60));
  console.log(`   Total missions: ${exportData.missions.length}`);
  console.log(`   Total lines: ${exportData.totalLines}`);
  console.log(`   Emotion tags used: ${exportData.emotionTagsUsed.length}`);
  console.log('═'.repeat(60));
  
  console.log('\n📁 Missions by character:\n');
  
  const byCharacter = {};
  for (const mission of exportData.missions) {
    const key = `${mission.characterName} (${mission.stationId})`;
    if (!byCharacter[key]) {
      byCharacter[key] = { count: 0, lines: 0 };
    }
    byCharacter[key].count++;
    byCharacter[key].lines += mission.lineCount;
  }
  
  for (const [char, stats] of Object.entries(byCharacter)) {
    console.log(`   ${char}: ${stats.count} mission(s), ${stats.lines} lines`);
  }
  
  console.log(`\n✅ Exported to: ${outputPath}`);
  console.log('\n💡 Next steps:');
  console.log('   1. Run: node scripts/generate_mission_voices.mjs --preview');
  console.log('   2. Run: node scripts/generate_mission_voices.mjs');
}

main().catch(err => {
  console.error('❌ Export failed:', err);
  process.exit(1);
});

