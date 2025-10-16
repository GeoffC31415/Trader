import fs from 'fs/promises';
import path from 'path';
import process from 'process';

/**
 * Organize existing icons into masters and game-ready structure
 * 
 * This script moves high-resolution originals to /masters/ subdirectory
 * and keeps only optimized versions in the main directory.
 */

async function organizeIcons(baseDir) {
  const mastersDir = path.join(baseDir, 'masters');
  
  console.log(`\n🗂️  Organizing icons in: ${baseDir}`);
  console.log(`📁 Masters directory: ${mastersDir}\n`);
  
  // Create masters directory if it doesn't exist
  await fs.mkdir(mastersDir, { recursive: true });
  
  // Read all PNG files in base directory
  const entries = await fs.readdir(baseDir, { withFileTypes: true });
  const pngFiles = entries
    .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.png'))
    .map(e => e.name);
  
  if (pngFiles.length === 0) {
    console.log('❌ No PNG files found in directory');
    return;
  }
  
  let movedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const filename of pngFiles) {
    try {
      const sourcePath = path.join(baseDir, filename);
      const masterPath = path.join(mastersDir, filename);
      
      // Check if file is large (likely a master)
      const stats = await fs.stat(sourcePath);
      const sizeMB = stats.size / 1024 / 1024;
      
      // If file is > 0.5 MB, it's likely a high-res master
      if (sizeMB > 0.5) {
        // Check if master already exists
        try {
          await fs.access(masterPath);
          console.log(`  ⊘ ${filename}: Master already exists (${sizeMB.toFixed(2)} MB) - skipped`);
          skippedCount++;
        } catch {
          // Master doesn't exist, move it
          await fs.rename(sourcePath, masterPath);
          console.log(`  ✓ ${filename}: Moved to masters (${sizeMB.toFixed(2)} MB)`);
          movedCount++;
        }
      } else {
        console.log(`  ⊘ ${filename}: Already optimized (${sizeMB.toFixed(2)} MB) - kept in place`);
        skippedCount++;
      }
    } catch (err) {
      console.error(`  ✗ ${filename}: ${err.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`✓ Moved to masters: ${movedCount}`);
  console.log(`⊘ Skipped: ${skippedCount}`);
  if (errorCount > 0) console.log(`✗ Errors: ${errorCount}`);
  console.log('\n📋 Next steps:');
  console.log('   1. High-res masters are now in /masters/');
  console.log('   2. Run resize script to create optimized versions');
  console.log('   3. Game will load from main directory\n');
}

const args = process.argv.slice(2);
const baseDir = args[0] || path.resolve(process.cwd(), 'public/icons/commodities');

organizeIcons(baseDir).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

