# Overwrite Behavior Guide

## Summary

Both generation and resize scripts will **OVERWRITE** existing files as you requested!

## Generation Scripts (Always Overwrite)

### ✅ Commodity Icons
```bash
npm run generate:icons
```
- **Always overwrites** existing masters
- Regenerates all 28 commodity icons
- Cost: $1.12

### ✅ UI Assets  
```bash
npm run generate:ui
```
- **Always overwrites** existing masters
- Regenerates all 39 UI asset icons
- Cost: $1.56

**Behavior:** Both generation scripts will replace any existing PNG files with the same name in the masters directories.

## Resize Script (Smart Overwrite)

### Auto-Force Mode (Masters → Game-Ready)

When resizing from masters to game-ready (different directories):

```bash
npm run resize:icons
# Input:  public/icons/commodities/masters/
# Output: public/icons/commodities/
# Result: ALWAYS OVERWRITES game-ready versions ✅
```

**Automatic behavior:**
- ✅ Detects input ≠ output directories
- ✅ Automatically enables overwrite mode
- ✅ Always regenerates game-ready versions
- ✅ Preserves masters

### Manual Force Mode

If resizing in-place or want to force overwrite:

```bash
npm run resize:icons -- --force
```

This explicitly forces overwrite regardless of file dimensions.

### Skip Mode (Efficiency)

If you want to skip already-processed files:

```bash
node scripts/resize_icons.mjs --input same-dir --output same-dir
# Without --force, will skip files already at target size
```

## Resize All (Both Types)

### Default Behavior (Overwrites)
```bash
npm run resize:all
```

**What it does:**
1. Resizes commodities: `masters/` → main dir (overwrites ✅)
2. Resizes UI assets: `masters/` → main dir (overwrites ✅)

**Result:** All game-ready versions are freshly regenerated from masters

### With Options
```bash
npm run resize:all -- --force    # Force even if same size
npm run resize:all -- --size 256 # Custom size
npm run resize:all -- --dry      # Preview only
```

## Complete Fresh Run Workflow

### Everything Overwrites ✅

```bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 1: Generate Masters (OVERWRITES)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export OPENAI_API_KEY='your-key-here'

npm run generate:icons    # Overwrites masters ✅
npm run generate:ui       # Overwrites masters ✅


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 2: Tweak Masters (Optional)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Edit files in:
# - public/icons/commodities/masters/*.png
# - public/icons/ui/masters/*.png


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 3: Create Game Versions (OVERWRITES)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

npm run resize:all        # Overwrites game-ready ✅
```

## Behavior Matrix

| Scenario | Overwrites? | Why |
|----------|-------------|-----|
| `generate:icons` | ✅ YES | Always writes files |
| `generate:ui` | ✅ YES | Always writes files |
| `resize:all` | ✅ YES | Input ≠ output (auto-force) |
| `resize:icons` (default) | ✅ YES | Input ≠ output (auto-force) |
| `resize:icons --force` | ✅ YES | Explicitly forced |
| In-place resize (same dir) | ❌ NO* | Skips if already target size |
| In-place resize --force | ✅ YES | Force overrides skip |

*Without `--force`, in-place resizing skips files already at the target size to avoid quality loss from re-encoding.

## Example Scenarios

### Scenario 1: Complete Regeneration
```bash
# Regenerate EVERYTHING from scratch
npm run generate:icons    # Masters overwritten
npm run generate:ui       # Masters overwritten  
npm run resize:all        # Game versions overwritten
```
**Result:** All 67 icons freshly generated ✅

### Scenario 2: Regenerate Game Versions Only
```bash
# Keep masters, regenerate game versions
npm run resize:all
```
**Result:** Game-ready versions overwritten, masters unchanged ✅

### Scenario 3: Regenerate Specific Masters
```bash
# Delete specific masters you want to regenerate
rm public/icons/commodities/masters/refined_fuel.png

# Regenerate (only generates missing ones)
npm run generate:icons

# Update game version
npm run resize:all
```
**Result:** Specific files regenerated ✅

### Scenario 4: Tweak and Regenerate
```bash
# 1. Generate masters
npm run generate:icons

# 2. Edit masters in Photoshop/GIMP
# ... make your changes ...

# 3. Regenerate game versions from tweaked masters
npm run resize:all        # Overwrites with your tweaks ✅
```
**Result:** Game uses your hand-tweaked versions ✅

## Safety Features

### Atomic Writes
Both scripts use atomic writes to prevent corruption:
```
1. Write to temporary file (.tmp)
2. Verify write succeeded
3. Rename to final name (atomic operation)
```

If process is interrupted, you get either the old file OR new file, never a corrupted partial file.

### Dry Run
Preview what will happen without changes:
```bash
npm run generate:icons -- --dry
npm run resize:all -- --dry
```

## Quick Reference

| Want to... | Command |
|------------|---------|
| Regenerate all masters | `npm run generate:icons && npm run generate:ui` |
| Regenerate all game versions | `npm run resize:all` |
| Regenerate everything | Above two commands in sequence |
| Force overwrite | Add `-- --force` |
| Preview changes | Add `-- --dry` |
| Custom size | Add `-- --size 256` |

## Summary

**Your Requirement:** ✅ **MET**

Both generation and resize scripts will overwrite existing files:
- ✅ Generation always overwrites masters
- ✅ Resize always overwrites game-ready versions (when using masters → game workflow)
- ✅ Fresh run regenerates everything
- ✅ Safe atomic writes prevent corruption

**You can confidently run the workflow multiple times without worrying about old files sticking around!** 🎨

