import { execSync } from 'child_process';
import path from 'path';
import process from 'process';

/**
 * Resize all icon types (commodities + UI assets)
 * Convenience wrapper around resize_icons.mjs
 */

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--size' || a === '-s') args.size = argv[++i];
    else if (a === '--dry') args.dry = true;
    else if (a === '--force' || a === '-f') args.force = true;
  }
  return args;
}

const args = parseArgs(process.argv);
const sizeArg = args.size ? `--size ${args.size}` : '';
const dryArg = args.dry ? '--dry' : '';
const forceArg = args.force ? '--force' : '';
const extraArgs = [sizeArg, dryArg, forceArg].filter(Boolean).join(' ');

console.log('🎨 Resizing All Icon Assets\n');

// Resize commodities
console.log('📦 Resizing Commodity Icons...');
try {
  execSync(
    `node scripts/resize_icons.mjs --input public/icons/commodities/masters --output public/icons/commodities ${extraArgs}`,
    { stdio: 'inherit', cwd: process.cwd() }
  );
} catch (err) {
  console.error('❌ Failed to resize commodity icons');
}

console.log('\n');

// Resize UI assets
console.log('🎮 Resizing UI Assets...');
try {
  execSync(
    `node scripts/resize_icons.mjs --input public/icons/ui/masters --output public/icons/ui ${extraArgs}`,
    { stdio: 'inherit', cwd: process.cwd() }
  );
} catch (err) {
  console.error('❌ Failed to resize UI assets');
}

console.log('\n✅ All icon assets resized!\n');

