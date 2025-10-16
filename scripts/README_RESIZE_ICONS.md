# Icon Resize Script

Utility script to resize PNG icons to optimal sizes for game UI. Reduces file sizes while maintaining quality.

## Why Resize?

- **Large originals:** 1024×1024 icons are 1-3 MB each (~30+ MB total)
- **UI display:** Game displays icons at 20-32 pixels
- **Optimal size:** 128×128 provides excellent quality at 32px display
- **File savings:** 90-95% reduction in total file size
- **Faster loading:** Smaller files = faster page loads

## Installation

First, install the required dependency:

```bash
npm install
```

This installs `sharp`, a high-performance image processing library.

## Basic Usage

### Resize all commodity icons to 128×128 (recommended)

```bash
npm run resize:icons
```

This will:
- Process all PNG files in `public/icons/commodities/`
- Resize to 128×128 pixels
- Maintain transparency
- Overwrite originals
- Show before/after sizes and total savings

### Example output:

```
Resizing icons in: D:\Documents\Code\Trader\public\icons\commodities
Target size: 128x128
Output: overwrite originals

Found 28 PNG files

  ✓ refined_fuel.png: 1.87 MB -> 0.09 MB (95.2% smaller)
  ✓ hydrogen.png: 1.45 MB -> 0.08 MB (94.5% smaller)
  ✓ oxygen.png: 1.52 MB -> 0.07 MB (95.4% smaller)
  ...
  ✓ nanomaterials.png: 2.10 MB -> 0.11 MB (94.8% smaller)

────────────────────────────────────────────────────────────
Processed: 28 success, 0 failed
Total size: 48.23 MB -> 2.47 MB (94.9% reduction)
Done!
```

## Advanced Options

### Custom size
```bash
node scripts/resize_icons.mjs --size 256
```

### Different input directory
```bash
node scripts/resize_icons.mjs --input public/icons/stations
```

### Save to different directory (preserve originals)
```bash
node scripts/resize_icons.mjs --output public/icons/commodities_resized
```

### Dry run (preview without making changes)
```bash
node scripts/resize_icons.mjs --dry
```

### Combine options
```bash
node scripts/resize_icons.mjs --input public/icons/commodities --output public/icons/optimized --size 128 --dry
```

## Options Reference

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--input` | `-i` | Input directory with PNG files | `public/icons/commodities` |
| `--output` | `-o` | Output directory (defaults to overwrite) | Same as input |
| `--size` | `-s` | Target size (width and height) | `128` |
| `--dry` | | Preview changes without modifying files | `false` |

## Recommended Workflow

### 1. Generate high-quality originals
```bash
# Generate at 1024×1024 for maximum quality
npm run generate:icons
```

### 2. Preview resize
```bash
# See what would happen
npm run resize:icons -- --dry
```

### 3. Resize for production
```bash
# Optimize for web
npm run resize:icons
```

### 4. (Optional) Keep backups
```bash
# Create backup first
cp -r public/icons/commodities public/icons/commodities_backup

# Then resize
npm run resize:icons
```

## Size Recommendations

| Display Size | Recommended Icon Size | Use Case |
|--------------|----------------------|----------|
| 16-24px | 64×64 | Small UI elements |
| 24-32px | **128×128** | ⭐ Standard UI (recommended) |
| 32-48px | 256×256 | Large UI elements |
| 48-64px | 512×512 | Hero images |
| Print/Archive | 1024×1024 | Original quality |

For this game's UI (displaying at 20-32px), **128×128 is optimal**.

## Technical Details

### Image Processing
- **Library:** Sharp (fastest Node.js image processor)
- **Resize method:** `contain` (fits within bounds, maintains aspect ratio)
- **Background:** Transparent (rgba 0,0,0,0)
- **PNG compression:** Level 9 (maximum)
- **Quality:** 90% (virtually lossless for icons)

### File Safety
- Uses temporary files during processing
- Atomic rename to prevent corruption
- Original only deleted after successful resize
- Errors handled gracefully per file

### Performance
- Processes ~28 icons in 2-5 seconds
- Parallel processing (limited by I/O)
- Progress shown for each file
- Total time and savings reported

## Troubleshooting

**Error: Cannot find module 'sharp'**
```bash
npm install
```

**Error: Input file is missing**
- Check that PNG files exist in input directory
- Verify path is correct: `--input public/icons/commodities`

**Icons look blurry in game**
- Try larger size: `--size 256`
- Original display size is 32px, so 128px should be plenty

**Need originals back**
- Re-run generation script: `npm run generate:icons`
- Or restore from backup if you made one

## Batch Processing

Process multiple directories:

```bash
# Resize commodity icons
npm run resize:icons

# Resize station icons (when you create them)
node scripts/resize_icons.mjs --input public/icons/stations

# Resize avatar images
node scripts/resize_icons.mjs --input generated_avatars --size 256
```

## Integration with Build

You can add resizing to your build process:

```json
// package.json
"scripts": {
  "prebuild": "npm run resize:icons",
  "build": "tsc -b && vite build"
}
```

This automatically optimizes icons before building for production.

## File Size Comparison

| Icon Size | File Size (avg) | Total (28 icons) | vs 1024×1024 |
|-----------|----------------|------------------|--------------|
| 1024×1024 | ~1.7 MB | ~48 MB | 100% |
| 512×512 | ~0.5 MB | ~14 MB | 71% savings |
| 256×256 | ~0.18 MB | ~5 MB | 90% savings |
| **128×128** | **~0.09 MB** | **~2.5 MB** | **95% savings** ⭐ |
| 64×64 | ~0.04 MB | ~1.1 MB | 98% savings |

## Best Practices

1. **Always generate at highest quality first** (1024×1024)
2. **Keep original backups** before resizing
3. **Test in-game appearance** after resizing
4. **Use dry run** to preview changes
5. **Resize consistently** across all icon sets
6. **Document your icon sizes** for team members

## See Also

- Icon generation: `scripts/README_COMMODITY_ICONS.md`
- Quick start guide: `COMMODITY_ICONS_QUICKSTART.md`
- Full implementation: `COMMODITY_ICONS_IMPLEMENTATION.md`

