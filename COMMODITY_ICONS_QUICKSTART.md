# Commodity Icons - Quick Start Guide

## Generate Icons in 4 Steps

### 1. Set Your OpenAI API Key

**Windows (PowerShell):**
```powershell
$env:OPENAI_API_KEY = "your-api-key-here"
```

**Mac/Linux (Bash):**
```bash
export OPENAI_API_KEY='your-api-key-here'
```

### 2. Generate All 28 Icons

```bash
npm run generate:icons
```

This will:
- Generate 28 commodity icons at 1024×1024 (high quality)
- Save to `public/icons/commodities/`
- Take ~2-3 minutes
- Cost ~$1.12 (at 1024×1024 size)

### 3. Resize for Optimal Performance

```bash
npm install  # Install sharp if not already installed
npm run resize:icons
```

This will:
- Resize all icons from 1024×1024 → 128×128
- Reduce total size from ~48 MB → ~2.5 MB (95% savings!)
- Maintain excellent quality for 32px display
- Take ~5 seconds

### 4. View in Game

```bash
npm run dev
```

Open your browser and:
1. Dock at any station (press **E** near a station)
2. Open the Market panel
3. See icons next to all commodities! ✨

## What You'll See

### Market Panel
- 🎨 32×32 icons next to each commodity
- Visual distinction between different goods
- Icons in both "Commodity Exchange" and "Local Production" tabs

### Fabrication Panel
- 🔧 Input and output icons side-by-side
- Clear visual flow: Silicon → Microchips

### Journal Panel (Cargo Tab)
- 📦 28×28 icons showing what you're carrying
- Quick visual inventory at a glance

## Customization

Want different styles? Edit the prompts:

```typescript
// src/data/commodity_icon_prompts.ts
{
  id: 'refined_fuel',
  prompt: 'Your custom description here'
}
```

Then regenerate:
```bash
npm run generate:icons
```

## Troubleshooting

**"OPENAI_API_KEY env var is required"**
→ You forgot to set your API key (see Step 1)

**"Error generating icon X"**
→ Script will continue and retry automatically
→ Check `public/icons/commodities/metadata.json` for details

**Icons not showing in game**
→ Check browser console for 404 errors
→ Verify files exist in `public/icons/commodities/`
→ Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## Cost Calculator

- **512×512**: $0.02 per image × 28 = **$0.56**
- **1024×1024** (current default): $0.04 per image × 28 = **$1.12**

**Tip:** Generate at high resolution (1024×1024), then resize to 128×128 for optimal quality + file size.

## Why Resize?

Large originals (1024×1024):
- ❌ ~48 MB total file size
- ❌ Slow page loads
- ✅ Archive quality

Resized (128×128):
- ✅ ~2.5 MB total (95% smaller!)
- ✅ Fast loading
- ✅ Perfect quality at 32px display

**Best of both worlds:** Generate at 1024×1024 (can always go back), resize to 128×128 for production.

## Test Without Generating

Want to see the prompts first?

```bash
npm run generate:icons -- --dry
```

This shows what will be generated without making API calls.

## What's Included

All 28 commodities get icons:

**Energy:** refined_fuel, hydrogen, oxygen, batteries  
**Food:** grain, meat, sugar, fertilizer  
**Raw:** iron_ore, copper_ore, silicon, rare_minerals  
**Industrial:** steel, alloys, plastics, machinery, textiles  
**Tech:** electronics, microchips, data_drives, nanomaterials, medical_supplies  
**Luxury:** coffee, tobacco, spices, luxury_goods, water, pharmaceuticals

## Next Steps

After generating icons, you might want to:

1. **Add station icons** - Follow similar pattern for station types
2. **Create ship thumbnails** - Visual ship selection screen
3. **Design faction emblems** - Faction reputation badges
4. **Mission type icons** - Visual mission categories

The generation script is reusable! Just create new prompt files following the same pattern.

## Need Help?

See full documentation: `COMMODITY_ICONS_IMPLEMENTATION.md`

Script documentation: `scripts/README_COMMODITY_ICONS.md`

---

**Enjoy your enhanced trading experience! 🚀**

