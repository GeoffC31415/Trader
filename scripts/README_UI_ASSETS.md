# UI Assets Generation

Generate enhancement assets for the game interface including icons, decorations, and indicators.

## What This Creates

### 📑 Tab/Section Icons (7)
- Market, Fabrication, Production, Missions, Journal, Cargo, Routes
- Used in tab navigation and section headers

### 🚀 Status Indicators (6)
- Docked, Undocked, Mining, Trading, Traveling, Combat
- Shows current ship state

### 💬 Message Type Icons (5)
- Info, Success, Warning, Error, Quest
- Used for notifications and alerts

### 🎨 Corner Decorations (4)
- Top-left, Top-right, Bottom-left, Bottom-right
- Sci-fi panel embellishments

### 🔧 Utility Icons (7)
- Credits, Reputation, Distance, Time, Quantity, Locked, Unlocked
- Common UI elements

### ⚙️ Ship System Icons (5)
- Engine, Cargo, Mining, Navigation, Weapons
- Ship systems display

### 🏷️ Contract/Mission Tags (5)
- Standard, Bulk, Rush, Fabrication, Emergency
- Mission type indicators

**Total: 39 UI assets**

## Quick Start

### Generate All UI Assets

```bash
# Set API key
export OPENAI_API_KEY='your-key-here'

# Generate all 39 assets
npm run generate:ui
```

**Cost:** ~$1.56 (39 × $0.04 at 1024×1024)

### Resize for Optimization

```bash
# Resize to optimal size
node scripts/resize_icons.mjs --input public/icons/ui --size 128
```

This reduces total size by ~95% while maintaining perfect quality.

## Usage in Code

### Import the Components

```tsx
import { UIIcon, CornerDecorations, StatusIndicator, MessageIcon } from '../ui/components/ui_icon';
```

### Tab Icons

```tsx
<button className="tab-button">
  <UIIcon name="tab_market" size={20} />
  Market
</button>

<button className="tab-button">
  <UIIcon name="tab_fabrication" size={20} />
  Fabrication
</button>
```

### Status Indicators

```tsx
// Show current ship status
<StatusIndicator status="docked" label="Docked at Sol City" />
<StatusIndicator status="mining" label="Extracting ore" />
<StatusIndicator status="traveling" />
```

### Corner Decorations

```tsx
<div className="sci-fi-panel" style={{ position: 'relative' }}>
  <CornerDecorations color="#3b82f6" opacity={0.5} size={32} />
  <h2>Panel Title</h2>
  <p>Panel content...</p>
</div>
```

### Message Icons

```tsx
<div className="notification">
  <MessageIcon type="success" />
  <span>Trade completed successfully!</span>
</div>

<div className="alert">
  <MessageIcon type="warning" size={24} />
  <span>Low fuel warning</span>
</div>
```

### Utility Icons

```tsx
// Credits display
<UIIcon name="icon_credits" size={16} />
<span>${credits.toLocaleString()}</span>

// Reputation badge
<UIIcon name="icon_reputation" size={16} />
<span>{reputation} Rep</span>

// Time remaining
<UIIcon name="icon_time" size={16} />
<span>{timeLeft}s</span>
```

### Ship System Icons

```tsx
// Upgrade menu
<div className="upgrade-row">
  <UIIcon name="system_engine" size={24} />
  <span>Engine Boost</span>
  <button>Upgrade</button>
</div>

<div className="upgrade-row">
  <UIIcon name="system_cargo" size={24} />
  <span>Cargo Expansion</span>
  <button>Upgrade</button>
</div>
```

### Contract Tags

```tsx
{contract.tags.includes('rush') && (
  <UIIcon name="tag_rush" size={18} />
)}

{contract.tags.includes('emergency') && (
  <UIIcon name="tag_emergency" size={18} />
)}
```

## Styling Tips

### Icon Colors

Use CSS filters to tint icons:

```tsx
<UIIcon 
  name="status_combat" 
  size={20}
  style={{ filter: 'hue-rotate(15deg) saturate(1.5)' }}
/>
```

### Glowing Effects

```tsx
<UIIcon 
  name="msg_success"
  size={24}
  style={{ 
    filter: 'drop-shadow(0 0 8px #22c55e)',
    animation: 'pulse 2s infinite'
  }}
/>
```

### Animations

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

## Integration Examples

### Enhanced Tab Navigation

```tsx
const tabs = [
  { id: 'market', icon: 'tab_market', label: 'Market' },
  { id: 'fabrication', icon: 'tab_fabrication', label: 'Fabrication' },
  { id: 'missions', icon: 'tab_missions', label: 'Missions' },
];

{tabs.map(tab => (
  <button key={tab.id} onClick={() => setTab(tab.id)}>
    <UIIcon name={tab.icon} size={18} />
    {tab.label}
  </button>
))}
```

### Status Bar

```tsx
<div className="status-bar">
  {ship.dockedStationId ? (
    <StatusIndicator status="docked" label={station.name} />
  ) : ship.isMining ? (
    <StatusIndicator status="mining" label="Extracting ore" />
  ) : (
    <StatusIndicator status="traveling" label="In transit" />
  )}
</div>
```

### Notification System

```tsx
type Notification = {
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
};

{notifications.map((notif, i) => (
  <div key={i} className={`notification notification-${notif.type}`}>
    <MessageIcon type={notif.type} />
    <span>{notif.message}</span>
  </div>
))}
```

### Decorated Panels

```tsx
<div className="sci-fi-panel" style={{ position: 'relative', padding: 20 }}>
  <CornerDecorations color="#3b82f6" />
  
  <h2 style={{ marginBottom: 16 }}>
    <UIIcon name="tab_market" size={24} />
    Market Overview
  </h2>
  
  <div className="panel-content">
    {/* Content here */}
  </div>
</div>
```

## Customization

### Edit Prompts

Modify `src/data/ui_asset_prompts.ts`:

```typescript
{
  id: 'tab_market',
  prompt: 'Your custom prompt here for different style'
}
```

### Add New Assets

Add to the array in `ui_asset_prompts.ts`:

```typescript
{
  id: 'my_custom_icon',
  prompt: 'Description of your custom UI icon'
}
```

Then regenerate:
```bash
npm run generate:ui
```

## File Sizes

| Size | File Size (avg) | Total (39 icons) | Use Case |
|------|----------------|------------------|----------|
| 1024×1024 | ~1.2 MB | ~47 MB | Original quality |
| **128×128** | **~0.015 MB** | **~0.6 MB** | **Recommended** ⭐ |
| 64×64 | ~0.008 MB | ~0.3 MB | Tiny icons |

Recommended: Generate at 1024×1024, resize to 128×128.

## Benefits

✅ **Consistent Visual Language** - Unified icon style across UI
✅ **Professional Polish** - Enhances perceived quality
✅ **Better UX** - Icons aid recognition and navigation
✅ **Sci-fi Aesthetic** - Reinforces game theme
✅ **Accessible** - Visual indicators support text labels

## Advanced: Programmatic Icons

Create a mapping for easy access:

```tsx
// src/ui/components/icon_map.ts
export const ICON_MAP = {
  tabs: {
    market: 'tab_market',
    fabrication: 'tab_fabrication',
    production: 'tab_production',
    missions: 'tab_missions',
    journal: 'tab_journal',
    cargo: 'tab_cargo',
    routes: 'tab_routes',
  },
  status: {
    docked: 'status_docked',
    undocked: 'status_undocked',
    mining: 'status_mining',
    trading: 'status_trading',
    traveling: 'status_traveling',
    combat: 'status_combat',
  },
  messages: {
    info: 'msg_info',
    success: 'msg_success',
    warning: 'msg_warning',
    error: 'msg_error',
    quest: 'msg_quest',
  },
  // ... etc
};

// Usage
<UIIcon name={ICON_MAP.tabs.market} size={20} />
<UIIcon name={ICON_MAP.status.docked} size={16} />
```

## See Also

- Commodity icons: `scripts/README_COMMODITY_ICONS.md`
- Resize script: `scripts/README_RESIZE_ICONS.md`
- Avatar generation: `scripts/generate_avatars.mjs`

