# UI Icons Workflow Guide

## Problem & Solution

### Issue
UI icons (corners, credits, distance, etc.) weren't showing on screens because they were unoptimized 1024x1024 PNGs (~1.4 MB each) that were too large to load efficiently.

### Solution
Resize high-res masters to game-ready 64x64 icons using the resize script.

## Icon Directory Structure

```
public/icons/ui/
├── masters/              # High-res originals (1024x1024, ~1.4 MB each)
│   ├── corner_tl.png
│   ├── icon_credits.png
│   ├── system_cargo.png
│   └── ... (42 total icons)
│
├── corner_tl.png         # Optimized game-ready (64x64, ~5 KB each)
├── icon_credits.png      # These are loaded by the game
├── system_cargo.png
└── ... (42 total icons)
```

## Icon Categories

### UI Corners (4)
- `corner_tl`, `corner_tr`, `corner_bl`, `corner_br` - Sci-fi panel decorations

### UI Tabs (9)
- `tab_market`, `tab_fabrication`, `tab_production`, `tab_missions`, `tab_journal`
- `tab_cargo`, `tab_routes`, `tab_traders`, `tab_ship`

### Status Indicators (6)
- `status_docked`, `status_undocked`, `status_mining`, `status_trading`
- `status_traveling`, `status_combat`

### Message Icons (5)
- `msg_info`, `msg_success`, `msg_warning`, `msg_error`, `msg_quest`

### Resource Icons (6)
- `icon_credits`, `icon_reputation`, `icon_distance`, `icon_time`
- `icon_quantity`, `icon_locked`, `icon_unlocked`

### Ship Systems (6)
- `system_engine`, `system_cargo`, `system_mining`, `system_navigation`
- `system_sensors`, `system_weapons`

### Contract Tags (5)
- `tag_standard`, `tag_bulk`, `tag_rush`, `tag_fabrication`, `tag_emergency`

## Workflow Commands

### Regenerate Optimized Icons (After adding/updating masters)
```bash
# Resize UI icons from masters to game-ready versions
node scripts/resize_icons.mjs --input public/icons/ui/masters --output public/icons/ui --size 64 --force
```

### Check Icon Sizes
```bash
# List file sizes in masters folder
ls -lh public/icons/ui/masters/*.png

# List file sizes in game folder
ls -lh public/icons/ui/*.png
```

## Icon Size Guidelines

| Location | Dimensions | File Size | Purpose |
|----------|-----------|-----------|---------|
| `/masters/` | 1024×1024 | ~1.4 MB | High-res originals for regeneration |
| Root folder | 64×64 | ~5 KB | Game-ready optimized versions |

## When Icons Don't Show

1. **Check if masters exist**: `ls public/icons/ui/masters/`
2. **Verify root icons are optimized**: Large files (>100 KB) need resizing
3. **Run resize script**: See command above
4. **Restart dev server**: `npm run dev`
5. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)

## Component Usage

The `UIIcon` component automatically:
- Loads from `public/icons/ui/` first
- Falls back to `public/icons/ui/masters/` if needed
- Hides gracefully if icon doesn't exist

```tsx
// Standard usage
<UIIcon name="icon_credits" size={20} />
<UIIcon name="system_cargo" size={24} />

// With styling
<UIIcon 
  name="tab_market" 
  size={16} 
  style={{ filter: 'drop-shadow(0 0 4px cyan)' }} 
/>
```

## Adding New UI Icons

1. Generate high-res icon (1024x1024) → save to `public/icons/ui/masters/`
2. Run resize script to create optimized version
3. Update metadata if using generation scripts
4. Restart dev server to see changes

## Related Scripts

- `scripts/resize_icons.mjs` - Resize/optimize icons
- `scripts/organize_masters.mjs` - Organize large files into masters folder
- `scripts/generate_ui_assets.mjs` - Generate new UI icons with AI

## Performance Notes

- 64×64 icons provide crisp display at typical UI sizes (16-32px)
- Total optimized icon package: ~250 KB for all 42 icons
- Unoptimized masters would be ~60 MB - 240× larger!
- Browser can cache small icons efficiently

## Troubleshooting

### Icons still not showing after resize
1. Check browser console for 404 errors
2. Verify file names match exactly (case-sensitive)
3. Clear Vite cache: `rm -rf node_modules/.vite`
4. Hard refresh browser

### Icons look blurry
- Check that optimized versions exist and aren't being upscaled
- Verify icons are 64×64 (not 32×32 or 128×128)

### New icons missing
- Ensure they're in both masters and root folders
- Run resize script after adding to masters
- Restart dev server

