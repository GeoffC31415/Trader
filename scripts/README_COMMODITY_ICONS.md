# Commodity Icon Generation

This directory contains scripts to generate visual assets for the game using OpenAI's image generation API.

## Generate Commodity Icons

The `generate_commodity_icons.mjs` script creates icons for all 28 commodities in the game.

### Prerequisites

1. **Node.js 18+** installed
2. **OpenAI API key** with image generation access
3. Set your API key as an environment variable:
   ```bash
   export OPENAI_API_KEY='your-api-key-here'
   ```

### Usage

Generate all commodity icons:
```bash
node scripts/generate_commodity_icons.mjs
```

This will:
- Read prompts from `src/data/commodity_icon_prompts.ts`
- Generate 28 icons using GPT image model
- Save PNG files to `public/icons/commodities/`
- Create `metadata.json` with generation details

### Options

```bash
# Dry run (test without generating)
node scripts/generate_commodity_icons.mjs --dry

# Custom output directory
node scripts/generate_commodity_icons.mjs --out public/icons/custom

# Different image size
node scripts/generate_commodity_icons.mjs --size 1024x1024

# Custom prompts file
node scripts/generate_commodity_icons.mjs --source my_prompts.ts
```

### Generated Files

Icons will be saved as:
- `public/icons/commodities/refined_fuel.png`
- `public/icons/commodities/hydrogen.png`
- `public/icons/commodities/oxygen.png`
- ... (28 total)

Plus a metadata file:
- `public/icons/commodities/metadata.json`

### Cost Estimate

- Model: `gpt-image-1`
- Size: `512x512` (default)
- Images: 28 commodities
- Estimated cost: ~$0.56 (28 × $0.02 per image)

For `1024x1024` size: ~$1.12 (28 × $0.04 per image)

### Customizing Prompts

Edit `src/data/commodity_icon_prompts.ts` to modify icon appearances:

```typescript
{
  id: 'refined_fuel',
  prompt: 'Your custom description here'
}
```

The script automatically adds consistent style guidance to ensure visual cohesion across all icons.

### Integration

Icons are automatically integrated into the game:
- Market panel commodity lists
- Fabrication recipes
- Production sections
- Journal panel (cargo display)

Icons display at 32×32 pixels in the UI with graceful fallback if the image fails to load.

### Troubleshooting

**API Key Error:**
```
Error: OPENAI_API_KEY env var is required
```
Solution: Set your OpenAI API key in the environment

**Rate Limiting:**
The script includes automatic pacing (500ms between requests) and backoff on errors (1500ms)

**Failed Generation:**
Check `metadata.json` for error details. You can re-run the script to regenerate failed images.

### Style Guidelines

Icons follow these design principles:
- Clean, centered composition
- Isometric or 3/4 view
- Studio lighting
- Vibrant, appropriate colors
- Sci-fi aesthetic
- Game UI quality
- Consistent style across all commodities

Icons are generated with transparent or dark neutral backgrounds to integrate seamlessly with the game's UI panels.

