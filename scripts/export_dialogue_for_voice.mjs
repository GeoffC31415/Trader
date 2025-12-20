/**
 * Export dialogue lines for voice synthesis
 * 
 * This script extracts all dialogue lines from character_dialogue.ts
 * and outputs them in a format suitable for voice synthesis processing.
 * 
 * Usage: node scripts/export_dialogue_for_voice.mjs [output-format]
 *   output-format: 'json' (default) | 'csv' | 'txt'
 * 
 * Output includes:
 * - Character name and voice direction
 * - Line ID (for file naming)
 * - Text content
 * - Voice tone hint
 * - Category for context
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Voice directions for each character (mirrors character_relationships.ts)
const VOICE_DIRECTIONS = {
  'sol-city': {
    name: 'Mira Vale',
    style: 'Polished, measured, slight condescension. Professional bureaucrat who believes in the system.',
    gender: 'female',
    age: 'mid-30s',
  },
  'sol-refinery': {
    name: 'Rex Calder',
    style: 'Gruff, working-class, direct. No-nonsense foreman who has seen it all.',
    gender: 'male',
    age: 'late-40s',
  },
  'aurum-fab': {
    name: 'Dr. Elin Kade',
    style: 'Clinical, precise, emotionally detached. Scientist first, human second.',
    gender: 'female',
    age: 'early-40s',
  },
  'greenfields': {
    name: 'Sana Whit',
    style: 'Warm, earthy, quietly fierce. Farmer who fights with patience and resolve.',
    gender: 'female',
    age: 'mid-40s',
  },
  'ceres-pp': {
    name: 'Ivo Renn',
    style: 'Dry, calculating, subtle menace. Every word is deliberate.',
    gender: 'male',
    age: 'early-50s',
  },
  'freeport': {
    name: 'Kalla Rook',
    style: 'Street-smart, charming, hint of mischief. The friendly merchant who knows everything.',
    gender: 'female',
    age: 'late-30s',
  },
  'drydock': {
    name: 'Chief Harlan',
    style: 'Blue-collar, loyal, weathered. Union man through and through.',
    gender: 'male',
    age: 'mid-50s',
  },
  'hidden-cove': {
    name: 'Vex Marrow',
    style: 'Dangerous charm, playful threat. Every smile has teeth.',
    gender: 'male',
    age: 'early-40s',
  },
};

// Manually extract dialogue data (we can't import TS directly in mjs)
// This mirrors the structure in character_dialogue.ts
const DIALOGUE_DATA = {
  'sol-city': [
    { id: 'mira_greet_stranger', text: "Welcome to Sol City. Please ensure your documentation is current before conducting business.", category: 'greeting', voiceTone: 'neutral' },
    { id: 'mira_greet_acquaint', text: "Ah, you're becoming a regular. Good. Consistency is the foundation of reliable commerce.", category: 'greeting', voiceTone: 'neutral' },
    { id: 'mira_greet_contact', text: "Good to see you again. Your trading record has been... satisfactory. We appreciate that.", category: 'greeting', voiceTone: 'warm' },
    { id: 'mira_greet_trusted', text: "Welcome back. Your reputation precedes you. Sol City values reliable partners.", category: 'greeting', voiceTone: 'warm' },
    { id: 'mira_greet_allied', text: "Always a pleasure. You've proven yourself a true friend to Sol City. How can we help today?", category: 'greeting', voiceTone: 'warm' },
    { id: 'mira_greet_firstvisit', text: "First time in Sol City? You'll find everything properly organized here. Unlike some stations.", category: 'greeting', voiceTone: 'neutral' },
    { id: 'mira_greet_longtime', text: "It's been a while. We were beginning to wonder if you'd found better markets elsewhere.", category: 'greeting', voiceTone: 'cold' },
    { id: 'mira_gossip_sana', text: "Sana Whit keeps pushing boundaries at Greenfields. Regulations exist to protect everyone, even farmers.", category: 'gossip', voiceTone: 'cold' },
    { id: 'mira_gossip_vex', text: "Vex Marrow and Hidden Cove claim to fight for freedom. Convenient how that freedom involves stealing cargo.", category: 'gossip', voiceTone: 'angry' },
    { id: 'mira_gossip_kalla', text: "Kalla Rook at Freeport operates in gray areas. Useful sometimes, but don't mistake convenience for alliance.", category: 'gossip', voiceTone: 'neutral' },
    { id: 'mira_gossip_harlan', text: "Chief Harlan's union talk sounds noble until you realize supply chains don't run on sentiment.", category: 'gossip', voiceTone: 'cold' },
    { id: 'mira_gossip_rex', text: "Rex Calder runs a clean operation. If only everyone maintained such standards.", category: 'gossip', voiceTone: 'warm' },
    { id: 'mira_react_sided_sol', text: "Your support during the Greenfields situation was noted. Sol City remembers those who uphold order.", category: 'reaction', voiceTone: 'warm' },
    { id: 'mira_react_sided_green', text: "I heard about your involvement with Greenfields. Disappointing, but perhaps you didn't understand the stakes.", category: 'reaction', voiceTone: 'cold' },
    { id: 'mira_react_enforced_law', text: "Taking action against Hidden Cove took courage. Sol City is proud to call you an ally.", category: 'reaction', voiceTone: 'warm' },
    { id: 'mira_react_joined_pirates', text: "I should have you arrested for your association with pirates. Consider our tolerance... limited.", category: 'reaction', voiceTone: 'threatening' },
    { id: 'mira_react_broke_strike', text: "Your intervention during the union situation saved us considerable trouble. That won't be forgotten.", category: 'reaction', voiceTone: 'warm' },
    { id: 'mira_tip_pharma', text: "Our hospitals pay premium for pharmaceuticals. Ceres routes are reliable if you have the cargo space.", category: 'tip', voiceTone: 'neutral' },
    { id: 'mira_tip_fuel', text: "Fuel prices are high here. Smart traders stock up at Helios Refinery before visiting.", category: 'tip', voiceTone: 'neutral' },
    { id: 'mira_tip_luxury', text: "Luxury goods move well in the city core. Mind the spread and timing.", category: 'tip', voiceTone: 'neutral' },
    { id: 'mira_concern_pirates', text: "Pirate activity has increased near the outer routes. Our patrols are stretched thin.", category: 'concern', voiceTone: 'worried' },
    { id: 'mira_concern_stability', text: "The system needs stability now more than ever. Too many factions pulling in different directions.", category: 'concern', voiceTone: 'worried' },
    { id: 'mira_farewell_neutral', text: "Safe travels. Remember, Sol City's markets are always open to lawful traders.", category: 'farewell', voiceTone: 'neutral' },
    { id: 'mira_farewell_trusted', text: "Until next time. And thank you for conducting business properly.", category: 'farewell', voiceTone: 'warm' },
    { id: 'mira_memory_bigtrader', text: "Your trading volume has been impressive. Sol City appreciates substantial commerce partners.", category: 'memory', voiceTone: 'warm' },
    { id: 'mira_memory_missions', text: "Your mission record speaks well of you. We have additional opportunities for capable operators.", category: 'memory', voiceTone: 'warm' },
  ],
  // ... other characters would be included here
  // For brevity, this script will read from the compiled JS or parse the TS file
};

/**
 * Parse the TypeScript file to extract dialogue data
 */
function parseDialogueFromTS() {
  const tsPath = path.join(__dirname, '../src/domain/constants/character_dialogue.ts');
  const content = fs.readFileSync(tsPath, 'utf-8');
  
  // Extract each character's dialogue block
  const characterBlocks = {};
  const stationIds = Object.keys(VOICE_DIRECTIONS);
  
  for (const stationId of stationIds) {
    const pattern = new RegExp(`'${stationId}':\\s*\\[([\\s\\S]*?)\\],\\s*(?:\\/\\/|'[a-z-]+':|\\};)`, 'i');
    const match = content.match(pattern);
    
    if (match) {
      const blockContent = match[1];
      characterBlocks[stationId] = parseDialogueBlock(blockContent);
    }
  }
  
  return characterBlocks;
}

/**
 * Parse a dialogue block to extract lines
 */
function parseDialogueBlock(blockContent) {
  const lines = [];
  
  // Match each dialogue object
  const linePattern = /\{\s*id:\s*'([^']+)',\s*text:\s*"([^"]+)"[^}]*category:\s*'([^']+)'[^}]*(?:voiceTone:\s*'([^']+)')?[^}]*\}/g;
  
  let match;
  while ((match = linePattern.exec(blockContent)) !== null) {
    lines.push({
      id: match[1],
      text: match[2],
      category: match[3],
      voiceTone: match[4] || 'neutral',
    });
  }
  
  return lines;
}

/**
 * Export to JSON format
 */
function exportToJSON(dialogueData, outputPath) {
  const exportData = {
    generatedAt: new Date().toISOString(),
    totalLines: 0,
    characters: [],
  };
  
  for (const [stationId, lines] of Object.entries(dialogueData)) {
    const voiceDir = VOICE_DIRECTIONS[stationId];
    if (!voiceDir) continue;
    
    const characterData = {
      stationId,
      characterName: voiceDir.name,
      voiceDirection: voiceDir.style,
      gender: voiceDir.gender,
      ageRange: voiceDir.age,
      lineCount: lines.length,
      lines: lines.map(line => ({
        id: line.id,
        text: line.text,
        category: line.category,
        voiceTone: line.voiceTone,
        suggestedFilename: `${stationId}/${line.id}.mp3`,
      })),
    };
    
    exportData.characters.push(characterData);
    exportData.totalLines += lines.length;
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
  console.log(`✅ Exported ${exportData.totalLines} lines to ${outputPath}`);
}

/**
 * Export to CSV format (for spreadsheet review)
 */
function exportToCSV(dialogueData, outputPath) {
  const headers = ['Station ID', 'Character Name', 'Line ID', 'Category', 'Voice Tone', 'Text', 'Voice Direction'];
  const rows = [headers.join(',')];
  
  let totalLines = 0;
  
  for (const [stationId, lines] of Object.entries(dialogueData)) {
    const voiceDir = VOICE_DIRECTIONS[stationId];
    if (!voiceDir) continue;
    
    for (const line of lines) {
      const row = [
        stationId,
        voiceDir.name,
        line.id,
        line.category,
        line.voiceTone,
        `"${line.text.replace(/"/g, '""')}"`,
        `"${voiceDir.style.replace(/"/g, '""')}"`,
      ];
      rows.push(row.join(','));
      totalLines++;
    }
  }
  
  fs.writeFileSync(outputPath, rows.join('\n'));
  console.log(`✅ Exported ${totalLines} lines to ${outputPath}`);
}

/**
 * Export to TXT format (for simple review)
 */
function exportToTXT(dialogueData, outputPath) {
  const sections = [];
  let totalLines = 0;
  
  for (const [stationId, lines] of Object.entries(dialogueData)) {
    const voiceDir = VOICE_DIRECTIONS[stationId];
    if (!voiceDir) continue;
    
    const section = [
      '═'.repeat(80),
      `CHARACTER: ${voiceDir.name} (${stationId})`,
      `VOICE: ${voiceDir.style}`,
      `GENDER: ${voiceDir.gender}, AGE: ${voiceDir.age}`,
      '═'.repeat(80),
      '',
    ];
    
    for (const line of lines) {
      section.push(`[${line.category.toUpperCase()}] ${line.id}`);
      section.push(`Tone: ${line.voiceTone}`);
      section.push(`"${line.text}"`);
      section.push('');
      totalLines++;
    }
    
    sections.push(section.join('\n'));
  }
  
  const header = [
    'DIALOGUE EXPORT FOR VOICE SYNTHESIS',
    `Generated: ${new Date().toISOString()}`,
    `Total Lines: ${totalLines}`,
    '',
  ].join('\n');
  
  fs.writeFileSync(outputPath, header + '\n\n' + sections.join('\n\n'));
  console.log(`✅ Exported ${totalLines} lines to ${outputPath}`);
}

/**
 * Main execution
 */
function main() {
  const format = process.argv[2] || 'json';
  const outputDir = path.join(__dirname, '../docs');
  
  console.log('📝 Parsing dialogue from character_dialogue.ts...');
  const dialogueData = parseDialogueFromTS();
  
  const lineCount = Object.values(dialogueData).reduce((sum, lines) => sum + lines.length, 0);
  console.log(`📊 Found ${lineCount} dialogue lines across ${Object.keys(dialogueData).length} characters`);
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  switch (format.toLowerCase()) {
    case 'json':
      exportToJSON(dialogueData, path.join(outputDir, 'dialogue_export.json'));
      break;
    case 'csv':
      exportToCSV(dialogueData, path.join(outputDir, 'dialogue_export.csv'));
      break;
    case 'txt':
      exportToTXT(dialogueData, path.join(outputDir, 'dialogue_export.txt'));
      break;
    case 'all':
      exportToJSON(dialogueData, path.join(outputDir, 'dialogue_export.json'));
      exportToCSV(dialogueData, path.join(outputDir, 'dialogue_export.csv'));
      exportToTXT(dialogueData, path.join(outputDir, 'dialogue_export.txt'));
      break;
    default:
      console.error(`Unknown format: ${format}. Use 'json', 'csv', 'txt', or 'all'`);
      process.exit(1);
  }
  
  console.log('\n🎤 Ready for voice synthesis!');
  console.log('Suggested file structure for generated audio:');
  console.log('  public/audio/dialogue/{stationId}/{lineId}.mp3');
}

main();








