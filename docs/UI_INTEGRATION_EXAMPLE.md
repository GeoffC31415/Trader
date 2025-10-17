# UI Assets Integration Example

## How to Add Icons to Your Existing UI

Here are practical examples showing how to enhance your current panels with the new UI assets.

## Market Panel - Tab Icons

### Before
```tsx
<button onClick={() => setSection('hall')} className={`sci-fi-button ${section === 'hall' ? 'active' : ''}`}>
  {hallLabel}
</button>
```

### After
```tsx
import { UIIcon } from './components/ui_icon';

<button onClick={() => setSection('hall')} className={`sci-fi-button ${section === 'hall' ? 'active' : ''}`}>
  <UIIcon name="tab_market" size={16} style={{ marginRight: 6 }} />
  {hallLabel}
</button>
```

### Full Tab Bar Enhancement

```tsx
import { UIIcon } from './components/ui_icon';

// In your Market Panel component:
<div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
  <button onClick={() => setSection('hall')} className={`sci-fi-button ${section === 'hall' ? 'active' : ''}`}>
    <UIIcon name="tab_market" size={16} style={{ marginRight: 6 }} />
    {hallLabel}
  </button>
  {hasFabrication && (
    <button onClick={() => setSection('fabrication')} className={`sci-fi-button ${section === 'fabrication' ? 'active' : ''}`}>
      <UIIcon name="tab_fabrication" size={16} style={{ marginRight: 6 }} />
      ⚙ Fabrication
    </button>
  )}
  {hasProduction && (
    <button onClick={() => setSection('production')} className={`sci-fi-button ${section === 'production' ? 'active' : ''}`}>
      <UIIcon name="tab_production" size={16} style={{ marginRight: 6 }} />
      📦 Production
    </button>
  )}
  <button onClick={() => setSection('missions')} className={`sci-fi-button ${section === 'missions' ? 'active' : ''}`}>
    <UIIcon name="tab_missions" size={16} style={{ marginRight: 6 }} />
    📋 Missions {stationContracts.length > 0 && `(${stationContracts.length})`}
  </button>
</div>
```

## Journal Panel - Tab Enhancement

### Before
```tsx
<button onClick={() => setTab('ship')} className={`journal-button ${tab === 'ship' ? 'active' : ''}`}>
  Ship Status
</button>
```

### After
```tsx
import { UIIcon } from './components/ui_icon';

<button onClick={() => setTab('ship')} className={`journal-button ${tab === 'ship' ? 'active' : ''}`}>
  <UIIcon name="system_cargo" size={16} style={{ marginRight: 6 }} />
  Ship Status
</button>

<button onClick={() => setTab('trades')} className={`journal-button ${tab === 'trades' ? 'active' : ''}`}>
  <UIIcon name="icon_credits" size={16} style={{ marginRight: 6 }} />
  Trade Log
</button>

<button onClick={() => setTab('routes')} className={`journal-button ${tab === 'routes' ? 'active' : ''}`}>
  <UIIcon name="tab_routes" size={16} style={{ marginRight: 6 }} />
  Routes
</button>
```

## App.tsx - Main Navigation

### Add to your main navigation panel:

```tsx
import { UIIcon, StatusIndicator } from './ui/components/ui_icon';

// Where you have your main panel tabs:
<div className="main-nav">
  <button onClick={() => setActivePanel('market')} className={activePanel === 'market' ? 'active' : ''}>
    <UIIcon name="tab_market" size={20} />
    <span>Market</span>
  </button>
  
  <button onClick={() => setActivePanel('journal')} className={activePanel === 'journal' ? 'active' : ''}>
    <UIIcon name="tab_journal" size={20} />
    <span>Journal</span>
  </button>
</div>

// Ship status indicator (top bar):
<div className="status-bar">
  {ship.dockedStationId ? (
    <StatusIndicator 
      status="docked" 
      label={`Docked at ${dockedStation?.name}`}
      size={18}
    />
  ) : (
    <StatusIndicator status="traveling" label="In Transit" size={18} />
  )}
</div>
```

## Upgrade Menu Icons

### Enhance your shipyard upgrades:

```tsx
import { UIIcon } from './components/ui_icon';

// In your upgrade section:
<div className="data-row">
  <div>
    <div style={{ fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
      <UIIcon name="system_engine" size={20} />
      Acceleration Boost
    </div>
    <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
      Current: {ship.stats.acc.toFixed(1)}
    </div>
  </div>
  <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$1,000</div>
  <button onClick={() => upgrade('acc', 3, 1000)} className="sci-fi-button">+3 ACC</button>
</div>

<div className="data-row">
  <div>
    <div style={{ fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
      <UIIcon name="system_cargo" size={20} />
      Cargo Bay Expansion
    </div>
    <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
      Current: {ship.maxCargo} units
    </div>
  </div>
  <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$1,200</div>
  <button onClick={() => upgrade('cargo', 50, 1200)} className="sci-fi-button">+50 CARGO</button>
</div>

<div className="data-row">
  <div>
    <div style={{ fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
      <UIIcon name="system_mining" size={20} />
      Mining Rig Installation
    </div>
    <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
      Status: {ship.canMine ? '✓ INSTALLED' : '✗ NOT INSTALLED'}
    </div>
  </div>
  <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$25,000</div>
  <button onClick={() => upgrade('mining', 0, 25000)} disabled={ship.canMine} className="sci-fi-button">
    {ship.canMine ? 'OWNED' : 'INSTALL'}
  </button>
</div>

<div className="data-row">
  <div>
    <div style={{ fontWeight: 600, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
      <UIIcon name="system_navigation" size={20} />
      Navigation Array
    </div>
    <div style={{ fontSize: 11, opacity: 0.7, fontFamily: 'monospace' }}>
      Status: {ship.hasNavigationArray ? '✓ INSTALLED' : '✗ NOT INSTALLED'}
    </div>
  </div>
  <div style={{ fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>$5,000</div>
  <button onClick={() => upgrade('navigation', 0, 5000)} disabled={!!ship.hasNavigationArray} className="sci-fi-button">
    {ship.hasNavigationArray ? 'OWNED' : 'INSTALL'}
  </button>
</div>
```

## Contract Tags

### Add visual tags to contracts:

```tsx
import { UIIcon } from './components/ui_icon';

// In your contracts display:
{stationContracts.map(c => (
  <div key={c.id} className="contract-card">
    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
      {c.tags?.includes('rush') && (
        <UIIcon name="tag_rush" size={18} />
      )}
      {c.tags?.includes('bulk') && (
        <UIIcon name="tag_bulk" size={18} />
      )}
      {c.tags?.includes('emergency') && (
        <UIIcon name="tag_emergency" size={18} />
      )}
    </div>
    
    <div className="contract-title">{c.title}</div>
    {/* Rest of contract display */}
  </div>
))}
```

## Header Stats with Icons

### Enhance your credit/cargo display:

```tsx
import { UIIcon } from './components/ui_icon';

// In your header:
<div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
  <div style={{
    padding: '8px 16px',
    background: `${colors.primary}15`,
    border: `1px solid ${colors.primary}`,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }}>
    <UIIcon name="icon_credits" size={20} />
    <div>
      <div style={{ fontSize: 9, opacity: 0.7, fontFamily: 'monospace' }}>CREDITS</div>
      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>
        ${ship.credits.toLocaleString()}
      </div>
    </div>
  </div>
  
  <div style={{
    padding: '8px 16px',
    background: `${colors.primary}15`,
    border: `1px solid ${colors.primary}`,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }}>
    <UIIcon name="system_cargo" size={20} />
    <div>
      <div style={{ fontSize: 9, opacity: 0.7, fontFamily: 'monospace' }}>CARGO</div>
      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>
        {Object.values(ship.cargo).reduce((a,b)=>a+b,0)}/{ship.maxCargo}
      </div>
    </div>
  </div>
  
  <div style={{
    padding: '8px 16px',
    background: `${colors.primary}15`,
    border: `1px solid ${colors.primary}`,
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }}>
    <UIIcon name="icon_reputation" size={20} />
    <div>
      <div style={{ fontSize: 9, opacity: 0.7, fontFamily: 'monospace' }}>REPUTATION</div>
      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace' }}>
        {(station.reputation || 0).toFixed(0)}
      </div>
    </div>
  </div>
</div>
```

## Corner Decorations

### Add to your main panels:

```tsx
import { CornerDecorations } from './components/ui_icon';

// Wrap your panel content:
<div className="sci-fi-panel" style={{ position: 'relative', padding: 20 }}>
  <CornerDecorations color={colors.primary} opacity={0.4} size={40} />
  
  {/* Your panel content here */}
</div>
```

## Gated Content Indicators

### Show locked features:

```tsx
import { UIIcon } from './components/ui_icon';

// For gated commodities:
{(!hasNav && isGated(id)) && (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444' }}>
    <UIIcon name="icon_locked" size={16} />
    <span>Requires Navigation Array</span>
  </div>
)}

// For unlocked content:
{hasNav && (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981' }}>
    <UIIcon name="icon_unlocked" size={16} />
    <span>Navigation Array Active</span>
  </div>
)}
```

## CSS Enhancements

### Add to your stylesheet:

```css
/* Icon hover effects */
.sci-fi-button:hover .ui-icon {
  filter: brightness(1.2) drop-shadow(0 0 8px currentColor);
  transition: filter 0.2s ease;
}

/* Active tab icon glow */
.sci-fi-button.active .ui-icon {
  filter: drop-shadow(0 0 10px currentColor);
}

/* Status indicator pulse */
@keyframes status-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.status-indicator {
  animation: status-pulse 2s ease-in-out infinite;
}
```

## Quick Win: Update One Panel

**Start small!** Here's the easiest way to see immediate results:

1. **Generate the icons:**
   ```bash
   npm run generate:ui
   node scripts/resize_icons.mjs --input public/icons/ui --size 128
   ```

2. **Add just tab icons to market panel:**
   ```tsx
   // At the top of market_panel.tsx
   import { UIIcon } from './components/ui_icon';
   
   // Find your tab buttons and add before the text:
   <UIIcon name="tab_market" size={16} style={{ marginRight: 6 }} />
   ```

3. **See the difference!** 🎉

That's it - you now have professional tab icons with minimal code changes.

## Progressive Enhancement

You can add icons gradually:
1. ✅ **Day 1:** Tab icons
2. ✅ **Day 2:** Status indicators
3. ✅ **Day 3:** System upgrade icons
4. ✅ **Day 4:** Header stats icons
5. ✅ **Day 5:** Corner decorations

Each addition takes 5-10 minutes and immediately improves the UI.

## Tips

- **Don't remove text labels** - Icons supplement, don't replace
- **Keep sizes consistent** - 16-20px for inline, 24-32px for headers
- **Match colors** - Use `style={{ color }}` or CSS filters
- **Test visibility** - Icons should be clear at actual display size
- **Add loading states** - Icons fade in when loaded for polish

## Result

Your game UI will look significantly more polished with minimal effort!

