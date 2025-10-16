import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import sharp from 'sharp';

const DEFAULT_INPUT = path.resolve(process.cwd(), 'public/icons/commodities/masters');
const DEFAULT_OUTPUT = path.resolve(process.cwd(), 'public/icons/commodities');
const DEFAULT_SIZE = 128;

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--input' || a === '-i') args.input = argv[++i];
    else if (a === '--output' || a === '-o') args.output = argv[++i];
    else if (a === '--size' || a === '-s') args.size = parseInt(argv[++i], 10);
    else if (a === '--dry') args.dry = true;
    else if (a === '--force' || a === '-f') args.force = true;
  }
  return args;
}

async function getAllPngFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const pngFiles = entries
    .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.png'))
    .map(e => path.join(dir, e.name));
  return pngFiles;  
}

async function resizeImage(inputPath, outputPath, size, dry = false, force = false) {
  const beforeStats = await fs.stat(inputPath);
  const beforeSize = (beforeStats.size / 1024 / 1024).toFixed(2);

  // Check current dimensions to avoid re-encoding already-resized images
  const metadata = await sharp(inputPath).metadata();
  const currentWidth = metadata.width;
  const currentHeight = metadata.height;

  // Skip if already the target size (unless force flag is set)
  if (!force && currentWidth === size && currentHeight === size) {
    console.log(`  ⊘ ${path.basename(inputPath)}: Already ${size}×${size} (skipped, use --force to overwrite)`);
    return null; // Don't count in totals
  }

  if (dry) {
    // Estimate: typically 95-97% reduction for 1024->128
    const estimatedSize = (beforeStats.size * 0.05 / 1024 / 1024).toFixed(2);
    console.log(`  [DRY] ${path.basename(inputPath)}: ${beforeSize} MB (${currentWidth}×${currentHeight}) -> ~${estimatedSize} MB (${size}×${size})`);
    return { before: beforeStats.size, after: beforeStats.size * 0.05 };
  }

  await sharp(inputPath)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 } // transparent background
    })
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(outputPath);

  const afterStats = await fs.stat(outputPath);
  const afterSize = (afterStats.size / 1024 / 1024).toFixed(2);
  const savings = ((1 - afterStats.size / beforeStats.size) * 100).toFixed(1);

  console.log(`  ✓ ${path.basename(inputPath)}: ${beforeSize} MB (${currentWidth}×${currentHeight}) -> ${afterSize} MB (${size}×${size}) [${savings}% smaller]`);
  
  return { before: beforeStats.size, after: afterStats.size };
}

async function resizeAll({ input, output, size, dry, force }) {
  const inputDir = input || DEFAULT_INPUT;
  const outputDir = output || DEFAULT_OUTPUT; // default: separate optimized directory
  const targetSize = size || DEFAULT_SIZE;
  
  // Auto-enable force when input/output are different (masters → game-ready workflow)
  const autoForce = inputDir !== outputDir;
  const shouldForce = force || autoForce;

  console.log(`\n📸 Master Icons: ${inputDir}`);
  console.log(`🎮 Game Icons: ${outputDir}`);
  console.log(`📐 Target size: ${targetSize}×${targetSize}`);
  if (shouldForce) console.log('🔄 Mode: OVERWRITE (will replace existing files)');
  if (dry) console.log('🔍 DRY RUN - no files will be modified\n');
  else console.log('');

  const pngFiles = await getAllPngFiles(inputDir);
  
  if (pngFiles.length === 0) {
    console.log('No PNG files found.');
    return;
  }

  console.log(`Found ${pngFiles.length} PNG files\n`);

  // Create output directory if different from input
  if (outputDir !== inputDir) {
    await fs.mkdir(outputDir, { recursive: true });
  }

  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  let totalBeforeSize = 0;
  let totalAfterSize = 0;

  for (let i = 0; i < pngFiles.length; i++) {
    const inputPath = pngFiles[i];
    const filename = path.basename(inputPath);
    const outputPath = path.join(outputDir, filename);

    try {
      // Use temp file to avoid corruption if overwriting
      const tempPath = outputPath + '.tmp';
      const result = await resizeImage(inputPath, dry ? outputPath : tempPath, targetSize, dry, shouldForce);

      if (result === null) {
        // Already correct size, skipped
        skippedCount++;
        continue;
      }

      if (result) {
        totalBeforeSize += result.before;
        totalAfterSize += result.after;
      }

      if (!dry && outputDir === inputDir) {
        // Overwrite original atomically
        await fs.rename(tempPath, outputPath);
      } else if (!dry) {
        await fs.rename(tempPath, outputPath);
      }

      successCount++;
    } catch (err) {
      console.error(`  ✗ ${filename}: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Processed: ${successCount} resized, ${skippedCount} skipped, ${errorCount} failed`);
  
  if (successCount > 0 && totalBeforeSize > 0) {
    const totalSavings = ((1 - totalAfterSize / totalBeforeSize) * 100).toFixed(1);
    const beforeMB = (totalBeforeSize / 1024 / 1024).toFixed(2);
    const afterMB = (totalAfterSize / 1024 / 1024).toFixed(2);
    if (dry) {
      console.log(`Estimated total: ${beforeMB} MB -> ~${afterMB} MB (~${totalSavings}% reduction)`);
    } else {
      console.log(`Total size: ${beforeMB} MB -> ${afterMB} MB (${totalSavings}% reduction)`);
    }
  }
  
  console.log(dry ? '\nNo files modified (dry run)\n' : 'Done!\n');
}

(async () => {
  try {
    const args = parseArgs(process.argv);
    await resizeAll({
      input: args.input,
      output: args.output,
      size: args.size,
      dry: !!args.dry,
      force: !!args.force,
    });
  } catch (err) {
    console.error('Error:', err?.message || err);
    process.exit(1);
  }
})();

