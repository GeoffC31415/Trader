/**
 * Generate Mission Voice Audio Files using ElevenLabs API
 * 
 * This script reads mission_dialogue_export.json and generates MP3 files
 * for each mission dialogue line using the ElevenLabs text-to-speech API.
 * 
 * Usage:
 *   node scripts/generate_mission_voices.mjs [options]
 * 
 * Options:
 *   --preview              Preview what would be generated without making API calls
 *   --force                Regenerate all files, even if they already exist
 *   --mission <id>         Generate only for specific mission (e.g., greenfields_stage_1)
 *   --station <id>         Generate only for specific station (e.g., greenfields)
 *   --help                 Show this help message
 * 
 * Prerequisites:
 *   - ELEVENLABS_API_KEY in .env file or environment variable
 *   - voice_config.json with voice IDs mapped to characters
 *   - mission_dialogue_export.json (run export_mission_dialogue.mjs first)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      }
    }
  }
}

loadEnv();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const ELEVENLABS_MODEL = 'eleven_v3';

// Rate limiting
const RATE_LIMIT_DELAY = 100;
let lastRequestTime = 0;

async function rateLimitedFetch(url, options = {}) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }
  
  return response;
}

/**
 * Load mission dialogue export and voice config
 */
function loadData() {
  const dialoguePath = path.join(__dirname, '..', 'docs', 'mission_dialogue_export.json');
  const configPath = path.join(__dirname, 'voice_config.json');
  
  if (!fs.existsSync(dialoguePath)) {
    console.error(`❌ Error: mission_dialogue_export.json not found at ${dialoguePath}`);
    console.error('   Run: node scripts/export_mission_dialogue.mjs');
    process.exit(1);
  }
  
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Error: voice_config.json not found at ${configPath}`);
    process.exit(1);
  }
  
  const dialogueData = JSON.parse(fs.readFileSync(dialoguePath, 'utf-8'));
  const voiceConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
  return { dialogueData, voiceConfig };
}

/**
 * Generate audio for a single line
 */
async function generateAudio(text, voiceId, outputPath, retries = 3) {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await rateLimitedFetch(
        `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text: text,
            model_id: ELEVENLABS_MODEL,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.35, // Slightly higher for emotional mission dialogue
              use_speaker_boost: true,
            },
          }),
        }
      );
      
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(outputPath, Buffer.from(buffer));
      return true;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      console.warn(`   ⚠️  Retry ${attempt}/${retries} for: ${path.basename(outputPath)}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return false;
}

/**
 * Generate manifest.json for mission audio files
 */
function generateManifest(dialogueData, outputDir) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalFiles: 0,
    missions: {},
  };
  
  for (const mission of dialogueData.missions) {
    const missionDir = path.join(outputDir, mission.stationId, mission.missionId);
    
    if (!fs.existsSync(missionDir)) {
      continue;
    }
    
    const files = fs.readdirSync(missionDir)
      .filter(f => f.endsWith('.mp3'))
      .map(f => ({
        id: f.replace('.mp3', ''),
        filename: f,
        path: `audio/missions/${mission.stationId}/${mission.missionId}/${f}`,
      }));
    
    if (files.length > 0) {
      manifest.missions[mission.missionId] = {
        characterName: mission.characterName,
        stationId: mission.stationId,
        title: mission.title,
        lineCount: files.length,
        files: files,
      };
      manifest.totalFiles += files.length;
    }
  }
  
  const manifestPath = path.join(outputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Generated manifest.json with ${manifest.totalFiles} files`);
}

/**
 * Preview mode
 */
function previewGeneration(options = {}) {
  const { dialogueData, voiceConfig } = loadData();
  
  const outputDir = path.join(__dirname, '..', 'public', 'audio', 'missions');
  const force = options.force || false;
  const missionFilter = options.mission || null;
  const stationFilter = options.station || null;
  
  // Filter missions
  let missionsToProcess = dialogueData.missions;
  if (missionFilter) {
    missionsToProcess = missionsToProcess.filter(m => m.missionId === missionFilter);
  }
  if (stationFilter) {
    missionsToProcess = missionsToProcess.filter(m => m.stationId === stationFilter);
  }
  
  if (missionsToProcess.length === 0) {
    console.error('❌ Error: No missions match the filter criteria');
    process.exit(1);
  }
  
  console.log('\n📋 PREVIEW MODE - No audio will be generated\n');
  console.log('═'.repeat(80));
  console.log(`Model: ${ELEVENLABS_MODEL} (supports v3 audio tags)`);
  console.log('═'.repeat(80));
  
  let totalNew = 0;
  let totalExisting = 0;
  let totalWithTags = 0;
  
  for (const mission of missionsToProcess) {
    const stationId = mission.stationId;
    const voiceId = voiceConfig[stationId]?.voiceId;
    const voiceName = voiceConfig[stationId]?.name || 'Unknown';
    
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`🎯 ${mission.title}`);
    console.log(`   Mission: ${mission.missionId}`);
    console.log(`   Character: ${mission.characterName} (${stationId})`);
    console.log(`   Voice: ${voiceName} (${voiceId ? voiceId.substring(0, 8) + '...' : 'NOT CONFIGURED'})`);
    console.log(`${'─'.repeat(80)}`);
    
    if (!voiceId) {
      console.log('   ⚠️  SKIPPED - No voice ID configured\n');
      continue;
    }
    
    const newLines = [];
    const existingLines = [];
    
    // Group lines by phase for cleaner output
    const linesByPhase = {};
    for (const line of mission.lines) {
      if (!linesByPhase[line.phase]) {
        linesByPhase[line.phase] = [];
      }
      
      const outputPath = path.join(outputDir, stationId, mission.missionId, `${line.id}.mp3`);
      const exists = fs.existsSync(outputPath);
      const hasEmotionTags = line.emotionTags && line.emotionTags.length > 0;
      
      if (exists && !force) {
        existingLines.push(line);
        totalExisting++;
      } else {
        linesByPhase[line.phase].push({ ...line, hasEmotionTags });
        totalNew++;
        if (hasEmotionTags) totalWithTags++;
      }
    }
    
    // Print lines by phase
    const phaseOrder = ['introduction', 'acceptance', 'key_moment', 'completion_success', 'completion_failure'];
    const phaseLabels = {
      introduction: '📖 INTRODUCTION',
      acceptance: '✅ ACCEPTANCE',
      key_moment: '⚡ KEY MOMENTS',
      completion_success: '🎉 SUCCESS COMPLETION',
      completion_failure: '❌ FAILURE COMPLETION',
    };
    
    for (const phase of phaseOrder) {
      const lines = linesByPhase[phase] || [];
      if (lines.length === 0) continue;
      
      console.log(`\n   ${phaseLabels[phase]} (${lines.length} lines):\n`);
      for (const line of lines) {
        const tagIndicator = line.hasEmotionTags ? '🎭' : '  ';
        console.log(`   ${tagIndicator} ${line.id}`);
        console.log(`      "${line.text.substring(0, 80)}${line.text.length > 80 ? '...' : ''}"`);
      }
    }
    
    if (existingLines.length > 0) {
      console.log(`\n   ✅ EXISTING: ${existingLines.length} files (use --force to regenerate)`);
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(80));
  console.log(`   Missions to process: ${missionsToProcess.length}`);
  console.log(`   New files to generate: ${totalNew}`);
  console.log(`   Lines with emotion tags: ${totalWithTags} 🎭`);
  console.log(`   Existing files (skipped): ${totalExisting}`);
  console.log(`   Total lines in export: ${dialogueData.totalLines}`);
  console.log('═'.repeat(80));
  console.log('\n💡 To generate audio, run without --preview flag');
  console.log('   node scripts/generate_mission_voices.mjs [--force] [--mission <id>] [--station <id>]\n');
}

/**
 * Main generation function
 */
async function generateVoices(options = {}) {
  if (!ELEVENLABS_API_KEY) {
    console.error('❌ Error: ELEVENLABS_API_KEY not found in environment variables or .env file');
    console.error('   Create a .env file in the project root with: ELEVENLABS_API_KEY=your_key_here');
    process.exit(1);
  }
  
  const { dialogueData, voiceConfig } = loadData();
  
  const outputDir = path.join(__dirname, '..', 'public', 'audio', 'missions');
  const force = options.force || false;
  const missionFilter = options.mission || null;
  const stationFilter = options.station || null;
  
  // Filter missions
  let missionsToProcess = dialogueData.missions;
  if (missionFilter) {
    missionsToProcess = missionsToProcess.filter(m => m.missionId === missionFilter);
  }
  if (stationFilter) {
    missionsToProcess = missionsToProcess.filter(m => m.stationId === stationFilter);
  }
  
  if (missionsToProcess.length === 0) {
    console.error('❌ Error: No missions match the filter criteria');
    process.exit(1);
  }
  
  // Collect all files to generate
  const filesToGenerate = [];
  let existingFiles = 0;
  
  for (const mission of missionsToProcess) {
    const stationId = mission.stationId;
    const voiceId = voiceConfig[stationId]?.voiceId;
    
    if (!voiceId) {
      console.warn(`⚠️  Skipping ${mission.characterName} (${stationId}): No voice ID configured`);
      continue;
    }
    
    for (const line of mission.lines) {
      const outputPath = path.join(outputDir, stationId, mission.missionId, `${line.id}.mp3`);
      
      if (fs.existsSync(outputPath) && !force) {
        existingFiles++;
        continue;
      }
      
      filesToGenerate.push({
        missionId: mission.missionId,
        missionTitle: mission.title,
        character: mission.characterName,
        stationId,
        lineId: line.id,
        phase: line.phase,
        text: line.text,
        voiceId,
        outputPath,
      });
    }
  }
  
  if (filesToGenerate.length === 0) {
    console.log('✅ All mission audio files already generated!');
    if (!force) {
      console.log('   Use --force to regenerate all files');
    }
    generateManifest(dialogueData, outputDir);
    return;
  }
  
  console.log(`\n🎤 Generating ${filesToGenerate.length} mission audio file(s) using ${ELEVENLABS_MODEL}...`);
  if (existingFiles > 0) {
    console.log(`   (Skipping ${existingFiles} existing file(s))`);
  }
  console.log('');
  
  let successCount = 0;
  let failCount = 0;
  const failures = [];
  let currentMission = '';
  
  for (let i = 0; i < filesToGenerate.length; i++) {
    const file = filesToGenerate[i];
    
    // Print mission header when it changes
    if (file.missionId !== currentMission) {
      currentMission = file.missionId;
      console.log(`\n📁 ${file.missionTitle} (${file.missionId})`);
    }
    
    const progress = `[${i + 1}/${filesToGenerate.length}]`;
    const hasEmotionTags = /\[[^\]]+\]/.test(file.text);
    const tagIndicator = hasEmotionTags ? '🎭 ' : '';
    const phaseLabel = file.phase.replace('_', ' ').toUpperCase();
    
    try {
      process.stdout.write(`   ${progress} ${tagIndicator}[${phaseLabel}] ${file.lineId}... `);
      await generateAudio(file.text, file.voiceId, file.outputPath);
      console.log('✅');
      successCount++;
    } catch (error) {
      console.log('❌');
      console.error(`      Error: ${error.message}`);
      failCount++;
      failures.push({
        mission: file.missionId,
        lineId: file.lineId,
        error: error.message,
      });
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log(`✅ Success: ${successCount} file(s)`);
  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount} file(s)`);
    console.log('\nFailed files:');
    failures.forEach(f => {
      console.log(`   - ${f.mission} / ${f.lineId}: ${f.error}`);
    });
  }
  console.log('═'.repeat(80));
  
  // Generate manifest
  generateManifest(dialogueData, outputDir);
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node scripts/generate_mission_voices.mjs [options]

Options:
  --preview              Preview what would be generated without making API calls
  --force                Regenerate all files, even if they already exist
  --mission <id>         Generate only for specific mission (e.g., greenfields_stage_1)
  --station <id>         Generate only for specific station (e.g., greenfields)
  --help                 Show this help message

Model: ${ELEVENLABS_MODEL} (supports v3 audio tags)

ElevenLabs v3 Audio Tags (embedded in text):
  - Emotional states: [excited], [nervous], [frustrated], [sorrowful], [calm]
  - Reactions: [sigh], [laughs], [gulps], [gasps], [whispers]
  - Cognitive beats: [pauses], [hesitates], [stammers], [resigned tone]
  - Tone cues: [cheerfully], [flatly], [deadpan], [playfully], [warmly]

Examples:
  node scripts/generate_mission_voices.mjs --preview
  node scripts/generate_mission_voices.mjs
  node scripts/generate_mission_voices.mjs --force
  node scripts/generate_mission_voices.mjs --mission greenfields_stage_1
  node scripts/generate_mission_voices.mjs --station greenfields

Workflow:
  1. Run: node scripts/export_mission_dialogue.mjs
  2. Run: node scripts/generate_mission_voices.mjs --preview  (review what will be generated)
  3. Run: node scripts/generate_mission_voices.mjs           (generate audio files)

Output:
  Audio files: public/audio/missions/{stationId}/{missionId}/{lineId}.mp3
  Manifest: public/audio/missions/manifest.json
`);
    process.exit(0);
  }
  
  const options = {
    force: args.includes('--force'),
    mission: null,
    station: null,
  };
  
  const missionIndex = args.indexOf('--mission');
  if (missionIndex !== -1 && args[missionIndex + 1]) {
    options.mission = args[missionIndex + 1];
  }
  
  const stationIndex = args.indexOf('--station');
  if (stationIndex !== -1 && args[stationIndex + 1]) {
    options.station = args[stationIndex + 1];
  }
  
  // Preview mode
  if (args.includes('--preview')) {
    previewGeneration(options);
    return;
  }
  
  generateVoices(options).catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

main();

