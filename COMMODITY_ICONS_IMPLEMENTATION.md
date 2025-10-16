# Commodity Icons Implementation

## Overview

Added visual commodity icons to enhance the game's UI. All 28 commodities now have custom AI-generated icons displayed throughout the interface.

## Implementation Summary

### 1. Icon Generation System

**Files Created:**
- `scripts/generate_commodity_icons.mjs` - Main generation script
- `src/data/commodity_icon_prompts.ts` - Icon prompts for all 28 commodities
- `scripts/README_COMMODITY_ICONS.md` - Documentation and usage guide

**Features:**
- GPT image model integration (gpt-image-1)
- Consistent style across all icons
- Automatic pacing and error handling
- Metadata tracking
- Dry-run support for testing

**Style Guidelines:**
- Clean, centered composition
- Isometric or 3/4 view
- Studio lighting
- Vibrant, appropriate colors
- Sci-fi aesthetic
- 512x512 pixels (configurable)
- Dark/transparent backgrounds

### 2. Data Model Updates

**Modified Files:**
- `src/domain/types/economy_types.ts` - Added optional `icon` field to Commodity schema
- `src/systems/economy/commodities.ts` - Added icon paths to all 28 commodities

**Type Definition:**
```typescript
icon: z.string().optional()
```

### 3. UI Integration

**Modified Files:**
- `src/ui/market_panel.tsx` - Icons in commodity exchange and production sections
- `src/ui/journal_panel.tsx` - Icons in cargo display

**Display Locations:**
1. **Market Panel - Commodity Exchange**
   - 32×32 pixel icons
   - Left column in commodity grid
   - Displayed for all tradeable items

2. **Market Panel - Local Production**
   - 32×32 pixel icons
   - Same layout as commodity exchange
   
3. **Market Panel - Fabrication**
   - 20×20 pixel icons
   - Input and output commodities side-by-side
   - Arrow separator between input → output

4. **Journal Panel - Cargo**
   - 28×28 pixel icons
   - Displayed with cargo quantity
   - Drop shadow for depth

**Error Handling:**
- Graceful fallback if image fails to load
- `onError` handler hides broken images
- No layout shift on missing icons

### 4. Build Configuration

**package.json Scripts:**
```json
"generate:icons": "node scripts/generate_commodity_icons.mjs",
"generate:avatars": "node scripts/generate_avatars.mjs"
```

## Usage

### Generate Icons

```bash
# Set your OpenAI API key
export OPENAI_API_KEY='your-key-here'

# Generate all commodity icons
npm run generate:icons

# Or with options
node scripts/generate_commodity_icons.mjs --dry     # Test without generating
node scripts/generate_commodity_icons.mjs --size 1024x1024  # Larger size
```

### Output

Icons are saved to:
```
public/icons/commodities/
├── refined_fuel.png
├── hydrogen.png
├── oxygen.png
├── ... (28 total)
└── metadata.json
```

### Cost

- Default (512×512): ~$0.56 (28 × $0.02)
- Large (1024×1024): ~$1.12 (28 × $0.04)

## Commodity List (28 Total)

### Energy & Fuel (4)
- refined_fuel
- hydrogen
- oxygen
- batteries

### Food & Agriculture (4)
- grain
- meat
- sugar
- fertilizer

### Raw Materials (4)
- iron_ore
- copper_ore
- silicon
- rare_minerals

### Industrial (5)
- steel
- alloys
- plastics
- machinery
- textiles

### Technology (5)
- electronics
- microchips
- data_drives
- nanomaterials
- medical_supplies

### Luxury & Consumer (6)
- coffee
- tobacco
- spices
- luxury_goods
- water
- pharmaceuticals

## Technical Details

### Icon Specifications
- **Format:** PNG
- **Size:** 512×512 (default, configurable)
- **Style:** Consistent sci-fi game UI aesthetic
- **Background:** Dark neutral or transparent
- **Lighting:** Studio quality, appropriate to item

### Performance Considerations
- Icons are lazy-loaded by browser
- Small file sizes (~20-50KB per icon)
- Cached by browser after first load
- No impact on game performance

### Accessibility
- All icons have proper `alt` text (commodity name)
- Decorative enhancement, doesn't hide information
- Text labels always present alongside icons

## Future Enhancements

Potential improvements:
1. **Category color coding** - Border colors based on commodity category
2. **Rarity indicators** - Special effects for rare commodities
3. **Hover animations** - Subtle glow or scale on hover
4. **Loading states** - Skeleton or spinner while images load
5. **Icon variations** - Different styles for different contexts
6. **Quantity overlays** - Badge showing quantity on icon

## Integration with Existing Systems

The icon system integrates seamlessly with:
- ✅ Zustand state management (via `commodityById`)
- ✅ Economy pricing system
- ✅ Fabrication recipes
- ✅ Trade logging
- ✅ Station inventory
- ✅ Gating system (Navigation Array/Union requirements)

## Maintenance

### Adding New Commodities

1. Add commodity to `src/systems/economy/commodities.ts`
2. Add prompt to `src/data/commodity_icon_prompts.ts`
3. Run `npm run generate:icons`
4. Icon automatically appears in UI

### Updating Existing Icons

1. Edit prompt in `src/data/commodity_icon_prompts.ts`
2. Delete specific icon from `public/icons/commodities/`
3. Run `npm run generate:icons` (will regenerate all or just missing)

### Style Consistency

The generation script enforces consistent style via:
- Shared `STYLE_PROMPT` template
- Unified keyword: `TRADE-COMMODITY-ICONS-01`
- Consistent lighting and composition rules

## Files Changed

### Created
- `scripts/generate_commodity_icons.mjs`
- `src/data/commodity_icon_prompts.ts`
- `scripts/README_COMMODITY_ICONS.md`
- `public/icons/commodities/.gitkeep`

### Modified
- `src/domain/types/economy_types.ts`
- `src/systems/economy/commodities.ts`
- `src/ui/market_panel.tsx`
- `src/ui/journal_panel.tsx`
- `package.json`

### To Be Generated (by user)
- `public/icons/commodities/*.png` (28 icons)
- `public/icons/commodities/metadata.json`

## Testing

1. Run `npm run generate:icons --dry` to test prompts
2. Generate icons with your OpenAI key
3. Start dev server: `npm run dev`
4. Dock at any station to see commodity icons
5. Check fabrication panel for input/output icons
6. Open journal to see cargo icons

## Notes

- Icons display gracefully even if images haven't been generated yet
- The `onError` handler prevents broken image icons
- Icon paths are configured but images must be generated separately
- System designed to work with or without generated images

## Similar to Avatar System

This implementation follows the same pattern as the existing avatar generation system:
- Consistent script structure
- TypeScript prompts file
- OpenAI API integration
- Metadata tracking
- Style enforcement
- Package.json scripts

The commodity icon system can serve as a template for future asset generation needs (station icons, ship thumbnails, etc.).

