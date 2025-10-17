# Asset Management Workflow

## Directory Structure

Your game now maintains **two versions** of each icon:

```
public/icons/
├── commodities/
│   ├── masters/              # High-quality originals (1024×1024)
│   │   ├── refined_fuel.png  # ~1.5 MB each
│   │   ├── hydrogen.png
│   │   └── ...
│   │
│   ├── refined_fuel.png      # Optimized for game (128×128)
│   ├── hydrogen.png          # ~15 KB each
│   └── ...
│
└── ui/
    ├── masters/              # High-quality originals (1024×1024)
    │   ├── tab_market.png
    │   └── ...
    │
    ├── tab_market.png        # Optimized for game (128×128)
    └── ...
```

### Why Two Versions?

| Version | Size | Use Case |
|---------|------|----------|
| **Masters** | 1024×1024 (~1-2 MB) | Archival, future resizing, print |
| **Game-Ready** | 128×128 (~15 KB) | Actual game use, fast loading |

## Workflow

### 1. Generate New Icons (Creates Masters)

```bash
# Commodity icons → public/icons/commodities/masters/
npm run generate:icons

# UI assets → public/icons/ui/masters/
npm run generate:ui
```

**Output:** High-quality 1024×1024 PNG files in `/masters/` subdirectory

### 2. Create Optimized Versions

```bash
# Resize commodity icons (masters → game-ready)
npm run resize:icons

# Resize UI assets
node scripts/resize_icons.mjs --input public/icons/ui/masters --output public/icons/ui
```

**Output:** Optimized 128×128 PNG files in main directory

### 3. Game Loads Optimized Versions

Your game automatically loads from the optimized directories:
- `public/icons/commodities/` (NOT /masters/)
- `public/icons/ui/` (NOT /masters/)

## Organizing Existing Icons

If you already have icons mixed together, organize them:

```bash
# Move large files to /masters/ subdirectory
npm run organize:masters

# Or specify directory
node scripts/organize_masters.mjs public/icons/ui
```

This script:
- ✅ Detects large files (> 0.5 MB = likely masters)
- ✅ Moves them to `/masters/` subdirectory
- ✅ Keeps optimized files in place
- ✅ Skips if master already exists

## Complete Workflow Example

### Starting Fresh

```bash
# 1. Generate high-quality masters
export OPENAI_API_KEY='your-key-here'
npm run generate:icons        # → commodities/masters/
npm run generate:ui           # → ui/masters/

# 2. Create optimized game versions
npm run resize:icons          # commodities/masters/ → commodities/
node scripts/resize_icons.mjs --input public/icons/ui/masters

# 3. Start game (loads from optimized directories)
npm run dev
```

### Updating Existing Setup

```bash
# 1. Organize existing icons
npm run organize:masters                                    # For commodities
node scripts/organize_masters.mjs public/icons/ui          # For UI assets

# 2. Regenerate any missing masters (if needed)
npm run generate:icons

# 3. Create/update optimized versions
npm run resize:icons
```

## Resize Script Behavior

### Default Behavior (New)
```bash
npm run resize:icons
# Input:  public/icons/commodities/masters/
# Output: public/icons/commodities/
# Result: Masters preserved, optimized copies created
```

### Custom Directories
```bash
# Specify input and output
node scripts/resize_icons.mjs \
  --input public/icons/commodities/masters \
  --output public/icons/commodities

# UI assets
node scripts/resize_icons.mjs \
  --input public/icons/ui/masters \
  --output public/icons/ui
```

### Custom Sizes
```bash
# Create medium-quality versions
node scripts/resize_icons.mjs --size 256

# Create tiny versions
node scripts/resize_icons.mjs --size 64
```

### Overwrite Mode (Old Behavior)
```bash
# WARNING: Overwrites originals
node scripts/resize_icons.mjs \
  --input public/icons/commodities \
  --output public/icons/commodities
```

## Benefits

### 🎯 Archive Quality
- Masters at full resolution (1024×1024)
- No quality loss over time
- Can regenerate any size later

### 🚀 Game Performance
- Optimized icons load instantly
- 99% smaller file sizes
- No FPS impact

### 🔄 Future-Proof
- Need 256×256 later? Resize from masters
- Want 512×512 for marketing? Use masters
- Print quality? Masters are ready

### 💾 Efficient Storage
- Masters stored once
- Multiple optimized versions possible
- Clear organization

## File Sizes Reference

### Commodity Icons (28 icons)
| Version | Per Icon | Total | Storage |
|---------|----------|-------|---------|
| Masters (1024×1024) | ~1.2 MB | ~34 MB | `/masters/` |
| Game (128×128) | ~15 KB | ~0.4 MB | Main dir |
| **Savings** | **99%** | **99%** | |

### UI Assets (39 icons)
| Version | Per Icon | Total | Storage |
|---------|----------|-------|---------|
| Masters (1024×1024) | ~1.2 MB | ~47 MB | `/masters/` |
| Game (128×128) | ~15 KB | ~0.6 MB | Main dir |
| **Savings** | **99%** | **99%** | |

## Git/Version Control

### Recommended .gitignore

```gitignore
# Ignore large master files (optional - depends on workflow)
# public/icons/*/masters/

# Keep optimized game assets
!public/icons/commodities/*.png
!public/icons/ui/*.png

# Keep metadata
!public/icons/*/metadata.json
```

### Option 1: Commit Masters (Recommended)
✅ Team can regenerate optimized versions  
✅ No API costs to regenerate  
❌ Larger repo size (~80 MB)

```bash
git add public/icons/*/masters/
git add public/icons/*/*.png
git commit -m "Add icon assets (masters + optimized)"
```

### Option 2: Commit Only Optimized (Lighter)
✅ Smaller repo size (~1 MB)  
✅ Faster clones  
❌ Need API key to regenerate masters

```bash
# Add to .gitignore
echo "public/icons/*/masters/" >> .gitignore

git add public/icons/*/*.png
git commit -m "Add optimized icon assets"
```

## Automation

### Add to Build Process

```json
// package.json
{
  "scripts": {
    "prebuild": "npm run resize:icons",
    "build": "tsc -b && vite build"
  }
}
```

This ensures optimized versions are always up-to-date before building.

### CI/CD Integration

```yaml
# .github/workflows/build.yml
- name: Generate optimized assets
  run: |
    npm run organize:masters
    npm run resize:icons
    node scripts/resize_icons.mjs --input public/icons/ui/masters
```

## Troubleshooting

### "No PNG files found in masters/"
**Solution:** Run generation script first:
```bash
npm run generate:icons
```

### "Masters already exist - skipped"
**Good!** The organize script detected existing masters.

### "Input file is missing"
**Solution:** Check that masters directory exists:
```bash
ls public/icons/commodities/masters/
```

### Game shows broken images
**Solution:** Make sure optimized versions exist in main directory:
```bash
npm run resize:icons
```

## Best Practices

### ✅ Do
- Generate at highest quality (1024×1024)
- Keep masters in `/masters/` subdirectory
- Resize once after generation
- Commit both versions (or just optimized)
- Document which version is in git

### ❌ Don't
- Don't edit optimized versions directly
- Don't resize from already-resized images
- Don't delete masters unless backing up
- Don't commit without testing resize

## Quick Reference Card

```bash
# Setup (once)
npm run generate:icons        # Generate masters
npm run resize:icons          # Create optimized

# Update workflow
npm run organize:masters      # Organize existing
npm run generate:icons        # Generate new masters
npm run resize:icons          # Update optimized

# Custom sizes
node scripts/resize_icons.mjs --size 256

# Check what will happen
node scripts/resize_icons.mjs --dry
```

## Summary

| Action | Command | Result |
|--------|---------|--------|
| Generate | `npm run generate:icons` | Masters in `/masters/` |
| Optimize | `npm run resize:icons` | Game-ready in main dir |
| Organize | `npm run organize:masters` | Moves large files to `/masters/` |
| Custom size | `--size 256` | Different resolution |
| Preview | `--dry` | See what will happen |

**Your assets are now professionally organized!** 🎨📁

