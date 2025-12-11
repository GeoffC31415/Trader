/**
 * Generate voice audio files using ElevenLabs API
 * 
 * This script reads dialogue_export.json and generates MP3 files for each dialogue line
 * using the ElevenLabs text-to-speech API.
 * 
 * Usage:
 *   node scripts/generate_voices.mjs [options]
 * 
 * Options:
 *   --list-voices          List all available voices from your ElevenLabs account
 *   --force                Regenerate all files, even if they already exist
 *   --character <id>      Generate only for specific character (e.g., sol-city)
 *   --help                 Show this help message
 * 
 * Prerequisites:
 *   - ELEVENLABS_API_KEY in .env file or environment variable
 *   - voice_config.json with voice IDs mapped to characters
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

if (!ELEVENLABS_API_KEY) {
  console.error('❌ Error: ELEVENLABS_API_KEY not found in environment variables or .env file');
  console.error('   Create a .env file in the project root with: ELEVENLABS_API_KEY=your_key_here');
  process.exit(1);
}

// Rate limiting: 10 requests per second for paid plans
const RATE_LIMIT_DELAY = 100; // ms between requests
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
 * List all available voices from ElevenLabs account
 */
async function listVoices() {
  console.log('📋 Fetching available voices from ElevenLabs...\n');
  
  try {
    const response = await rateLimitedFetch(`${ELEVENLABS_API_URL}/voices`);
    const data = await response.json();
    
    if (!data.voices || data.voices.length === 0) {
      console.log('No voices found in your account.');
      return;
    }
    
    console.log(`Found ${data.voices.length} voice(s):\n`);
    console.log('─'.repeat(80));
    
    for (const voice of data.voices) {
      console.log(`\nVoice ID: ${voice.voice_id}`);
      console.log(`Name: ${voice.name}`);
      if (voice.description) console.log(`Description: ${voice.description}`);
      if (voice.labels) {
        const labels = Object.entries(voice.labels)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        if (labels) console.log(`Labels: ${labels}`);
      }
      console.log('─'.repeat(80));
    }
    
    console.log('\n💡 Copy the voice_id values into scripts/voice_config.json for each character');
  } catch (error) {
    console.error('❌ Error fetching voices:', error.message);
    process.exit(1);
  }
}

/**
 * Load dialogue export and voice config
 */
function loadData() {
  const dialoguePath = path.join(__dirname, '..', 'docs', 'dialogue_export.json');
  const configPath = path.join(__dirname, 'voice_config.json');
  
  if (!fs.existsSync(dialoguePath)) {
    console.error(`❌ Error: dialogue_export.json not found at ${dialoguePath}`);
    console.error('   Run: node scripts/export_dialogue_for_voice.mjs');
    process.exit(1);
  }
  
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Error: voice_config.json not found at ${configPath}`);
    process.exit(1);
  }
  
  const dialogueData = JSON.parse(fs.readFileSync(dialoguePath, 'utf-8'));
  const voiceConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
  // Validate voice config
  const missingVoices = [];
  for (const [stationId, config] of Object.entries(voiceConfig)) {
    if (!config.voiceId || config.voiceId === '') {
      missingVoices.push(`${stationId} (${config.name})`);
    }
  }
  
  if (missingVoices.length > 0) {
    console.error('❌ Error: Missing voice IDs in voice_config.json:');
    missingVoices.forEach(name => console.error(`   - ${name}`));
    console.error('\n   Run: node scripts/generate_voices.mjs --list-voices');
    console.error('   Then update voice_config.json with voice IDs');
    process.exit(1);
  }
  
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
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
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
 * Generate manifest.json with all generated files
 */
function generateManifest(dialogueData, outputDir) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalFiles: 0,
    characters: {},
  };
  
  for (const character of dialogueData.characters) {
    const stationId = character.stationId;
    const audioDir = path.join(outputDir, stationId);
    
    if (!fs.existsSync(audioDir)) {
      continue;
    }
    
    const files = fs.readdirSync(audioDir)
      .filter(f => f.endsWith('.mp3'))
      .map(f => ({
        id: f.replace('.mp3', ''),
        filename: f,
        path: `audio/dialogue/${stationId}/${f}`,
      }));
    
    if (files.length > 0) {
      manifest.characters[stationId] = {
        characterName: character.characterName,
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
 * Main generation function
 */
async function generateVoices(options = {}) {
  const { dialogueData, voiceConfig } = loadData();
  
  const outputDir = path.join(__dirname, '..', 'public', 'audio', 'dialogue');
  const force = options.force || false;
  const characterFilter = options.character || null;
  
  // Filter characters if specified
  const charactersToProcess = characterFilter
    ? dialogueData.characters.filter(c => c.stationId === characterFilter)
    : dialogueData.characters;
  
  if (characterFilter && charactersToProcess.length === 0) {
    console.error(`❌ Error: Character "${characterFilter}" not found in dialogue export`);
    process.exit(1);
  }
  
  // Count total lines to process
  let totalLines = 0;
  let existingFiles = 0;
  const filesToGenerate = [];
  
  for (const character of charactersToProcess) {
    const stationId = character.stationId;
    const voiceId = voiceConfig[stationId]?.voiceId;
    
    if (!voiceId) {
      console.warn(`⚠️  Skipping ${character.characterName} (${stationId}): No voice ID configured`);
      continue;
    }
    
    for (const line of character.lines) {
      const outputPath = path.join(outputDir, stationId, `${line.id}.mp3`);
      
      if (fs.existsSync(outputPath) && !force) {
        existingFiles++;
        continue;
      }
      
      filesToGenerate.push({
        character: character.characterName,
        stationId,
        lineId: line.id,
        text: line.text,
        voiceId,
        outputPath,
      });
      totalLines++;
    }
  }
  
  if (filesToGenerate.length === 0) {
    console.log('✅ All audio files already generated!');
    if (!force) {
      console.log('   Use --force to regenerate all files');
    }
    generateManifest(dialogueData, outputDir);
    return;
  }
  
  console.log(`\n🎤 Generating ${filesToGenerate.length} audio file(s)...`);
  if (existingFiles > 0) {
    console.log(`   (Skipping ${existingFiles} existing file(s))`);
  }
  console.log('');
  
  let successCount = 0;
  let failCount = 0;
  const failures = [];
  
  for (let i = 0; i < filesToGenerate.length; i++) {
    const file = filesToGenerate[i];
    const progress = `[${i + 1}/${filesToGenerate.length}]`;
    
    try {
      process.stdout.write(`${progress} Generating ${file.stationId}/${file.lineId}... `);
      await generateAudio(file.text, file.voiceId, file.outputPath);
      console.log('✅');
      successCount++;
    } catch (error) {
      console.log('❌');
      console.error(`   Error: ${error.message}`);
      failCount++;
      failures.push({
        character: file.character,
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
      console.log(`   - ${f.character} / ${f.lineId}: ${f.error}`);
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
Usage: node scripts/generate_voices.mjs [options]

Options:
  --list-voices          List all available voices from your ElevenLabs account
  --force                Regenerate all files, even if they already exist
  --character <id>      Generate only for specific character (e.g., sol-city)
  --help                 Show this help message

Examples:
  node scripts/generate_voices.mjs --list-voices
  node scripts/generate_voices.mjs
  node scripts/generate_voices.mjs --force
  node scripts/generate_voices.mjs --character sol-city

Prerequisites:
  - ELEVENLABS_API_KEY in .env file or environment variable
  - voice_config.json with voice IDs mapped to characters
`);
    process.exit(0);
  }
  
  if (args.includes('--list-voices')) {
    listVoices().then(() => process.exit(0));
    return;
  }
  
  const options = {
    force: args.includes('--force'),
    character: null,
  };
  
  const characterIndex = args.indexOf('--character');
  if (characterIndex !== -1 && args[characterIndex + 1]) {
    options.character = args[characterIndex + 1];
  }
  
  generateVoices(options).catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

main();

