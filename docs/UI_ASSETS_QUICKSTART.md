# UI Assets - Quick Start

## Generate UI Enhancement Icons

Add professional polish to your game interface with 39 custom UI assets.

### Step 1: Generate Icons

```bash
# Set API key
export OPENAI_API_KEY='your-key-here'

# Generate all 39 UI assets
npm run generate:ui
```

**Time:** ~20-30 seconds  
**Cost:** ~$1.56 (39 × $0.04 at 1024×1024)

### Step 2: Optimize

```bash
# Resize for optimal performance
node scripts/resize_icons.mjs --input public/icons/ui --size 128
```

**Result:** ~47 MB → ~0.6 MB (99% reduction!)

### Step 3: Use in Game

The `UIIcon` component makes it easy:

```tsx
import { UIIcon } from './components/ui_icon';

// Tab icons
<UIIcon name="tab_market" size={20} />

// Status indicators  
<UIIcon name="status_docked" size={16} />

// Message types
<UIIcon name="msg_success" size={24} />
```

## What You Get

### 📑 **7 Tab Icons**
Market, Fabrication, Production, Missions, Journal, Cargo, Routes

### 🚀 **6 Status Indicators**
Docked, Undocked, Mining, Trading, Traveling, Combat

### 💬 **5 Message Types**
Info, Success, Warning, Error, Quest

### 🎨 **4 Corner Decorations**
Sci-fi panel embellishments for all corners

### 🔧 **7 Utility Icons**
Credits, Reputation, Distance, Time, Quantity, Locked, Unlocked

### ⚙️ **5 Ship Systems**
Engine, Cargo, Mining, Navigation, Weapons

### 🏷️ **5 Contract Tags**
Standard, Bulk, Rush, Fabrication, Emergency

## Quick Integration

### Add to Tab Buttons

```tsx
<button onClick={() => setTab('market')}>
  <UIIcon name="tab_market" size={18} />
  Market
</button>
```

### Show Ship Status

```tsx
{ship.dockedStationId ? (
  <UIIcon name="status_docked" size={16} />
) : (
  <UIIcon name="status_traveling" size={16} />
)}
```

### Notification Badges

```tsx
<div className="notification success">
  <UIIcon name="msg_success" size={20} />
  Trade completed!
</div>
```

### Panel Decorations

```tsx
import { CornerDecorations } from './components/ui_icon';

<div style={{ position: 'relative' }}>
  <CornerDecorations color="#3b82f6" />
  {/* Panel content */}
</div>
```

## Benefits

✅ **Professional Look** - Polished UI feels premium  
✅ **Better UX** - Icons improve navigation  
✅ **Consistent Theme** - Unified sci-fi aesthetic  
✅ **Easy to Use** - Simple component API  
✅ **Tiny Files** - Fast loading (~15KB each)

## Examples in Your Game

I've created a reusable `UIIcon` component in `src/ui/components/ui_icon.tsx` that handles:
- Automatic fallback if icon doesn't exist
- Consistent sizing and styling
- Error handling
- Pre-built status indicators and decorations

## Full Documentation

See `scripts/README_UI_ASSETS.md` for:
- Complete usage examples
- Styling techniques
- Integration patterns
- Customization guide

## Ready to Polish Your UI! 🎨

Your game interface will look more professional and cohesive with these enhancement assets.

**Total cost:** ~$1.56 for 39 high-quality UI icons
**Time to integrate:** 15-30 minutes
**Visual impact:** Significant! ⭐

