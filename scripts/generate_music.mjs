/**
 * Generate music tracks using ElevenLabs Music Generation API
 * 
 * This script reads music_prompts.ts and generates MP3 files for each track
 * using the ElevenLabs Music Generation API.
 * 
 * Usage:
 *   node scripts/generate_music.mjs [options]
 * 
 * Options:
 *   --force                Regenerate all files, even if they already exist
 *   --track <id>           Generate only for specific track (e.g., ambient_exploring)
 *   --list                 List all available tracks
 *   --help                 Show this help message
 * 
 * Prerequisites:
 *   - ELEVENLABS_API_KEY in .env file or environment variable
 *   - Music prompts defined in src/data/music_prompts.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

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

// Rate limiting: Music generation is slower, use longer delay
const RATE_LIMIT_DELAY = 2000; // ms between requests (2 seconds)
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
 * Load music prompts from TypeScript file
 * We'll parse the exported musicPrompts object using regex
 */
function loadMusicPrompts() {
  const promptsPath = path.join(__dirname, '..', 'src', 'data', 'music_prompts.ts');
  
  if (!fs.existsSync(promptsPath)) {
    console.error(`❌ Error: music_prompts.ts not found at ${promptsPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(promptsPath, 'utf-8');
  const tracks = [];
  
  // Parse ambient tracks - find the ambient section and parse each track
  const ambientMatch = content.match(/ambient:\s*\{/);
  if (ambientMatch) {
    // Find the matching closing brace by counting braces
    let startPos = ambientMatch.index + ambientMatch[0].length;
    let braceCount = 1;
    let pos = startPos;
    
    while (braceCount > 0 && pos < content.length) {
      if (content[pos] === '{') braceCount++;
      if (content[pos] === '}') braceCount--;
      pos++;
    }
    
    const ambientContent = content.substring(startPos, pos - 1);
    
    // Parse exploring track - match id, prompt, and duration (handle type assertions)
    const exploringMatch = ambientContent.match(/exploring:\s*\{[^}]*id:\s*['"]([^'"]+)['"][^}]*prompt:\s*['"]([^'"]+)['"][^}]*duration:\s*(\d+)/s);
    if (exploringMatch) {
      tracks.push({
        id: exploringMatch[1],
        prompt: exploringMatch[2].replace(/\\'/g, "'").replace(/\\n/g, ' '), // Unescape quotes and newlines
        duration: parseInt(exploringMatch[3]),
        category: 'ambient',
      });
    }
    
    // Parse combat track
    const combatMatch = ambientContent.match(/combat:\s*\{[^}]*id:\s*['"]([^'"]+)['"][^}]*prompt:\s*['"]([^'"]+)['"][^}]*duration:\s*(\d+)/s);
    if (combatMatch) {
      tracks.push({
        id: combatMatch[1],
        prompt: combatMatch[2].replace(/\\'/g, "'").replace(/\\n/g, ' '),
        duration: parseInt(combatMatch[3]),
        category: 'ambient',
      });
    }
  }
  
  // Parse station tracks - match each station entry in the stations object
  // Match the entire stations object with balanced braces
  const stationsMatch = content.match(/stations:\s*\{/);
  if (stationsMatch) {
    // Find the matching closing brace by counting braces
    let startPos = stationsMatch.index + stationsMatch[0].length;
    let braceCount = 1;
    let pos = startPos;
    
    while (braceCount > 0 && pos < content.length) {
      if (content[pos] === '{') braceCount++;
      if (content[pos] === '}') braceCount--;
      pos++;
    }
    
    const stationsContent = content.substring(startPos, pos - 1);
    
    // Match each station entry: 'station-id': { id: '...', prompt: '...', duration: ... }
    // Handle prompts that may span multiple lines by matching until the closing quote
    const stationPattern = /'([^']+)':\s*\{[^}]*id:\s*['"]([^'"]+)['"][^}]*prompt:\s*['"]([^'"]+)['"][^}]*duration:\s*(\d+)/gs;
    let match;
    
    while ((match = stationPattern.exec(stationsContent)) !== null) {
      tracks.push({
        id: match[2],
        prompt: match[3].replace(/\\'/g, "'").replace(/\\n/g, ' '), // Unescape quotes and newlines
        duration: parseInt(match[4]),
        category: 'station',
        stationId: match[1],
      });
    }
  }
  
  if (tracks.length === 0) {
    console.error('❌ Error: Could not parse any tracks from music_prompts.ts');
    console.error('   Make sure the file follows the expected format');
    process.exit(1);
  }
  
  return tracks;
}

/**
 * Generate music for a single track
 */
async function generateMusic(prompt, duration, outputPath, retries = 3) {
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`   Generating ${duration}s track...`);
      
      const response = await rateLimitedFetch(
        `${ELEVENLABS_API_URL}/music/generate`,
        {
          method: 'POST',
          body: JSON.stringify({
            prompt: prompt,
            duration: duration,
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
      await new Promise(resolve => setTimeout(resolve, 3000 * attempt));
    }
  }
  
  return false;
}

/**
 * Generate manifest.json with all generated files
 */
function generateManifest(tracks, outputDir) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalFiles: 0,
    tracks: {},
  };
  
  for (const track of tracks) {
    const audioPath = track.category === 'ambient' 
      ? `audio/music/ambient/${track.id}.mp3`
      : `audio/music/stations/${track.id}.mp3`;
    
    const fullPath = path.join(outputDir, track.category === 'ambient' ? 'ambient' : 'stations', `${track.id}.mp3`);
    
    if (fs.existsSync(fullPath)) {
      manifest.tracks[track.id] = {
        id: track.id,
        category: track.category,
        stationId: track.stationId,
        path: audioPath,
        duration: track.duration,
      };
      manifest.totalFiles++;
    }
  }
  
  const manifestPath = path.join(outputDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Generated manifest.json with ${manifest.totalFiles} files`);
}

/**
 * List all available tracks
 */
function listTracks() {
  const tracks = loadMusicPrompts();
  
  console.log(`\n📋 Available music tracks (${tracks.length}):\n`);
  console.log('─'.repeat(80));
  
  const ambientTracks = tracks.filter(t => t.category === 'ambient');
  const stationTracks = tracks.filter(t => t.category === 'station');
  
  if (ambientTracks.length > 0) {
    console.log('\n🌌 Ambient Tracks:');
    for (const track of ambientTracks) {
      console.log(`   ${track.id} (${track.duration}s)`);
    }
  }
  
  if (stationTracks.length > 0) {
    console.log('\n🏢 Station Tracks:');
    for (const track of stationTracks) {
      console.log(`   ${track.id} (${track.duration}s) - ${track.stationId}`);
    }
  }
  
  console.log('\n' + '─'.repeat(80));
}

/**
 * Main generation function
 */
async function generateMusicTracks(options = {}) {
  const tracks = loadMusicPrompts();
  
  const outputDir = path.join(__dirname, '..', 'public', 'audio', 'music');
  const force = options.force || false;
  const trackFilter = options.track || null;
  
  // Filter tracks if specified
  const tracksToProcess = trackFilter
    ? tracks.filter(t => t.id === trackFilter)
    : tracks;
  
  if (trackFilter && tracksToProcess.length === 0) {
    console.error(`❌ Error: Track "${trackFilter}" not found`);
    console.error('   Use --list to see available tracks');
    process.exit(1);
  }
  
  // Count files to process
  let totalTracks = 0;
  let existingFiles = 0;
  const filesToGenerate = [];
  
  for (const track of tracksToProcess) {
    const outputPath = path.join(
      outputDir,
      track.category === 'ambient' ? 'ambient' : 'stations',
      `${track.id}.mp3`
    );
    
    if (fs.existsSync(outputPath) && !force) {
      existingFiles++;
      continue;
    }
    
    filesToGenerate.push({
      ...track,
      outputPath,
    });
    totalTracks++;
  }
  
  if (filesToGenerate.length === 0) {
    console.log('✅ All music files already generated!');
    if (!force) {
      console.log('   Use --force to regenerate all files');
    }
    generateManifest(tracks, outputDir);
    return;
  }
  
  console.log(`\n🎵 Generating ${filesToGenerate.length} music track(s)...`);
  if (existingFiles > 0) {
    console.log(`   (Skipping ${existingFiles} existing file(s))`);
  }
  console.log('   Note: Music generation takes longer than voice generation');
  console.log('');
  
  let successCount = 0;
  let failCount = 0;
  const failures = [];
  
  for (let i = 0; i < filesToGenerate.length; i++) {
    const track = filesToGenerate[i];
    const progress = `[${i + 1}/${filesToGenerate.length}]`;
    
    try {
      process.stdout.write(`${progress} Generating ${track.id}... `);
      await generateMusic(track.prompt, track.duration, track.outputPath);
      console.log('✅');
      successCount++;
    } catch (error) {
      console.log('❌');
      console.error(`   Error: ${error.message}`);
      failCount++;
      failures.push({
        trackId: track.id,
        error: error.message,
      });
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log(`✅ Success: ${successCount} track(s)`);
  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount} track(s)`);
    console.log('\nFailed tracks:');
    failures.forEach(f => {
      console.log(`   - ${f.trackId}: ${f.error}`);
    });
  }
  console.log('═'.repeat(80));
  
  // Generate manifest
  generateManifest(tracks, outputDir);
}

/**
 * Main entry point
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node scripts/generate_music.mjs [options]

Options:
  --force                Regenerate all files, even if they already exist
  --track <id>          Generate only for specific track (e.g., ambient_exploring)
  --list                 List all available tracks
  --help                 Show this help message

Examples:
  node scripts/generate_music.mjs --list
  node scripts/generate_music.mjs
  node scripts/generate_music.mjs --force
  node scripts/generate_music.mjs --track ambient_exploring

Prerequisites:
  - ELEVENLABS_API_KEY in .env file or environment variable
  - Music prompts defined in src/data/music_prompts.ts

Note: Music generation takes longer than voice generation. Be patient!
`);
    process.exit(0);
  }
  
  if (args.includes('--list')) {
    listTracks();
    process.exit(0);
  }
  
  const options = {
    force: args.includes('--force'),
    track: null,
  };
  
  const trackIndex = args.indexOf('--track');
  if (trackIndex !== -1 && args[trackIndex + 1]) {
    options.track = args[trackIndex + 1];
  }
  
  generateMusicTracks(options).catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

main();

