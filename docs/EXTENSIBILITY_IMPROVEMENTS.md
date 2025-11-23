# Extensibility Improvements for Trader Game

This document outlines key architectural improvements to make the codebase more extensible and maintainable.

## Executive Summary

The codebase follows good domain-driven design principles, but several areas could benefit from more extensible patterns. The main issues are:
1. **Duplication** in ship/weapon creation logic
2. **Hardcoded union types** that require changes across multiple files
3. **Large monolithic store** that mixes orchestration with business logic
4. **Missing registry/plugin patterns** for game entities
5. **Type duplication** between domain and state layers

---

## 1. Ship System Extensibility

### Current Issues

**Problem**: Adding a new ship type requires changes in 5+ places:
- `Ship['kind']` union type in `world_types.ts`
- `shipBaseStats` and `shipCaps` in `ship_constants.ts`
- `chooseStarter` action (massive if/else chain)
- `replaceShip` action (massive if/else chain)
- Ship selection UI in `market_panel.tsx`
- Ship model component in `scene/components/ships/`

**Example of duplication**:
```typescript
// In store.ts - chooseStarter (lines 904-1048)
if (kind === 'freighter') {
  const ship: Ship = { /* 20+ properties */ };
} else if (kind === 'clipper') {
  const ship: Ship = { /* 20+ properties, mostly duplicated */ };
} // ... repeated 6 times
```

### Recommended Solution: Ship Registry Pattern

**Create**: `src/domain/registries/ship_registry.ts`

```typescript
import type { Ship, ShipWeapon } from '../types/world_types';
import { WEAPON_BASE_STATS } from '../constants/weapon_constants';
import { shipBaseStats, shipCaps } from '../constants/ship_constants';

export type ShipConfig = {
  kind: Ship['kind'];
  displayName: string;
  description: string;
  baseCredits?: number;
  canMine: boolean;
  defaultWeapon?: ShipWeapon;
  // ... other config
};

export const SHIP_REGISTRY: Record<Ship['kind'], ShipConfig> = {
  freighter: {
    kind: 'freighter',
    displayName: 'Freighter',
    description: 'Slow, high cargo capacity',
    baseCredits: 10000,
    canMine: false,
    defaultWeapon: { ...WEAPON_BASE_STATS.laser, damageLevel: 0, fireRateLevel: 0, rangeLevel: 0 },
  },
  // ... other ships
};

export function createShip(
  kind: Ship['kind'],
  position: [number, number, number],
  overrides?: Partial<Ship>
): Ship {
  const config = SHIP_REGISTRY[kind];
  const baseStats = shipBaseStats[kind];
  const caps = shipCaps[kind];
  
  return {
    position,
    velocity: [0, 0, 0],
    credits: config.baseCredits ?? 0,
    cargo: {},
    maxCargo: baseStats.cargo,
    canMine: config.canMine,
    enginePower: 0,
    engineTarget: 0,
    hasNavigationArray: false,
    hasUnionMembership: false,
    hasMarketIntel: false,
    kind: config.kind,
    stats: { acc: baseStats.acc, drag: 1.0, vmax: baseStats.vmax },
    weapon: config.defaultWeapon ?? { ...WEAPON_BASE_STATS.laser, damageLevel: 0, fireRateLevel: 0, rangeLevel: 0 },
    hp: PLAYER_MAX_HP,
    maxHp: PLAYER_MAX_HP,
    energy: PLAYER_MAX_ENERGY,
    maxEnergy: PLAYER_MAX_ENERGY,
    ...overrides,
  };
}
```

**Benefits**:
- Single source of truth for ship creation
- New ships: add to registry + constants + UI
- Eliminates 200+ lines of duplication in store.ts
- Type-safe with TypeScript

**Migration Path**:
1. Create registry file
2. Refactor `chooseStarter` and `replaceShip` to use `createShip()`
3. Update UI to read from registry for ship selection
4. Remove duplicated ship creation code

---

## 2. Type System Improvements

### Current Issues

**Problem**: Ship type union is hardcoded in multiple places:
```typescript
kind: 'freighter' | 'clipper' | 'miner' | 'heavy_freighter' | 'racer' | 'industrial_miner';
```

Adding a new ship requires updating this union in:
- `world_types.ts`
- `ship_constants.ts` (Record keys)
- `store.ts` (multiple action signatures)
- Any UI components that reference ship kinds

### Recommended Solution: Const Assertion Pattern

**Create**: `src/domain/constants/ship_kinds.ts`

```typescript
export const SHIP_KINDS = [
  'freighter',
  'clipper',
  'miner',
  'heavy_freighter',
  'racer',
  'industrial_miner',
] as const;

export type ShipKind = typeof SHIP_KINDS[number];

// Then in world_types.ts:
import type { ShipKind } from '../constants/ship_kinds';
export type Ship = {
  // ...
  kind: ShipKind;
  // ...
};
```

**Benefits**:
- Single source of truth for ship kinds
- TypeScript infers union type automatically
- Easy to add new ships: update array + add config
- Prevents typos and inconsistencies

**Apply Same Pattern To**:
- `StationType` → `STATION_TYPES` array
- `WeaponKind` → `WEAPON_KINDS` array
- `CommodityCategory` → `COMMODITY_CATEGORIES` array

---

## 3. Store Refactoring

### Current Issues

**Problem**: `store.ts` is 1550 lines and mixes:
- State initialization
- Action definitions
- Business logic orchestration
- Module coordination
- Tutorial logic
- Mission completion logic

**Example**: The `sell` action (lines 451-727) is 276 lines and handles:
- Contract completion
- Mission completion
- Celebration triggers
- Trust/relationship updates
- Tutorial progression
- Stock updates
- Escort cargo handling

### Recommended Solution: Action Composition Pattern

**Create**: `src/state/actions/` directory structure:

```
actions/
  ├── economy/
  │   ├── buy_action.ts
  │   ├── sell_action.ts
  │   └── process_action.ts
  ├── ships/
  │   ├── choose_starter_action.ts
  │   └── replace_ship_action.ts
  ├── missions/
  │   ├── accept_mission_action.ts
  │   └── complete_mission_action.ts
  └── index.ts
```

**Pattern**:
```typescript
// actions/economy/sell_action.ts
export function createSellAction(
  getState: () => GameState,
  setState: (updates: Partial<GameState>) => void
) {
  return (commodityId: string, quantity: number) => {
    const state = getState();
    
    // Delegate to modules
    const result = sellCommodity(/* ... */);
    if (!result) return;
    
    // Handle side effects
    const contractUpdates = handleContractProgress(state, result);
    const missionUpdates = handleMissionProgress(state, result);
    
    // Compose final update
    setState({
      ...result,
      ...contractUpdates,
      ...missionUpdates,
    });
  };
}

// In store.ts:
import { createSellAction } from './actions/economy/sell_action';

export const useGameStore = create<GameState>((set, get) => ({
  // ...
  sell: createSellAction(get, (updates) => set(state => ({ ...state, ...updates }))),
}));
```

**Benefits**:
- Smaller, focused action files
- Easier to test individual actions
- Better code organization
- Reusable action creators
- Store.ts becomes orchestration layer only

---

## 4. Commodity System Extensibility

### Current Issues

**Problem**: Commodities are defined in a single function, but there's no plugin/registry system for:
- Custom commodity behaviors
- Dynamic commodity generation
- Mod/plugin support
- Runtime commodity registration

### Recommended Solution: Commodity Registry with Plugins

**Create**: `src/domain/registries/commodity_registry.ts`

```typescript
import type { Commodity } from '../types/economy_types';

export type CommodityPlugin = {
  id: string;
  commodities: Commodity[];
  dependencies?: string[]; // Other plugin IDs
};

class CommodityRegistry {
  private plugins: Map<string, CommodityPlugin> = new Map();
  private commodities: Map<string, Commodity> = new Map();
  
  register(plugin: CommodityPlugin): void {
    // Check dependencies
    // Register commodities
    // Emit change event
  }
  
  getCommodity(id: string): Commodity | undefined {
    return this.commodities.get(id);
  }
  
  getAllCommodities(): Commodity[] {
    return Array.from(this.commodities.values());
  }
}

export const commodityRegistry = new CommodityRegistry();

// Register base commodities
commodityRegistry.register({
  id: 'base',
  commodities: generateCommodities(),
});
```

**Benefits**:
- Support for mods/plugins
- Runtime commodity registration
- Dependency management
- Hot-reloading support (dev mode)

---

## 5. Recipe System Improvements

### Current Issues

**Problem**: Recipes are hardcoded in a Record structure:
```typescript
export const processRecipes: Record<StationType, ProcessRecipe[]> = {
  refinery: [/* ... */],
  // ...
};
```

Adding recipes requires editing the central file, and there's no way to:
- Add recipes dynamically
- Override recipes per station
- Support recipe plugins

### Recommended Solution: Recipe Registry with Station Overrides

**Create**: `src/domain/registries/recipe_registry.ts`

```typescript
export type RecipeRegistry = {
  // Base recipes by station type
  baseRecipes: Record<StationType, ProcessRecipe[]>;
  // Station-specific overrides
  stationOverrides: Map<string, ProcessRecipe[]>;
  // Dynamic recipes (added at runtime)
  dynamicRecipes: ProcessRecipe[];
};

export function getRecipesForStation(
  stationId: string,
  stationType: StationType,
  registry: RecipeRegistry
): ProcessRecipe[] {
  // Check station override first
  if (registry.stationOverrides.has(stationId)) {
    return registry.stationOverrides.get(stationId)!;
  }
  
  // Merge base + dynamic recipes
  const base = registry.baseRecipes[stationType] || [];
  return [...base, ...registry.dynamicRecipes];
}
```

**Benefits**:
- Station-specific recipe customization
- Runtime recipe addition
- Better testability (mock registry)
- Recipe plugins support

---

## 6. Mission System Extensibility

### Current State

The mission system appears well-structured with:
- `mission_generator.ts` for generation
- `mission_validator.ts` for validation
- `mission_helpers.ts` for rewards
- Mission types and arcs

### Potential Improvements

**Add**: Mission Type Registry

```typescript
// src/domain/registries/mission_type_registry.ts
export type MissionTypeHandler = {
  type: string;
  canGenerate: (context: MissionGenerationContext) => boolean;
  generate: (context: MissionGenerationContext) => Mission;
  validate: (mission: Mission, state: GameState) => ValidationResult;
  onComplete: (mission: Mission, state: GameState) => Partial<GameState>;
};

export const missionTypeRegistry = new Map<string, MissionTypeHandler>();

// Register built-in types
missionTypeRegistry.set('delivery', deliveryMissionHandler);
missionTypeRegistry.set('escort', escortMissionHandler);
// ...
```

**Benefits**:
- Custom mission types via plugins
- Runtime mission type registration
- Better separation of concerns
- Easier to test mission logic

---

## 7. Module System Enhancements

### Current State

Good start with modules in `src/state/modules/`:
- `physics.ts`
- `economy.ts`
- `combat.ts`
- `missions.ts`
- `npc.ts`
- `reputation.ts`

### Potential Improvements

**Add**: Module Lifecycle Hooks

```typescript
// src/state/modules/module_types.ts
export interface GameModule {
  name: string;
  onTick?: (state: GameState, dt: number) => Partial<GameState>;
  onInit?: (state: GameState) => Partial<GameState>;
  onCleanup?: (state: GameState) => Partial<GameState>;
}

// src/state/module_manager.ts
export class ModuleManager {
  private modules: Map<string, GameModule> = new Map();
  
  register(module: GameModule): void {
    this.modules.set(module.name, module);
  }
  
  tick(state: GameState, dt: number): Partial<GameState> {
    let updates: Partial<GameState> = {};
    for (const module of this.modules.values()) {
      if (module.onTick) {
        Object.assign(updates, module.onTick(state, dt));
      }
    }
    return updates;
  }
}
```

**Benefits**:
- Plugin modules can hook into game loop
- Better module isolation
- Easier to disable/enable modules
- Module dependencies

---

## 8. Type Duplication Elimination

### Current Issues

**Problem**: Types are duplicated between:
- `src/domain/types/world_types.ts` (domain layer)
- `src/state/types.ts` (state layer, legacy)

**Example**: `Ship` type appears in both files with slight differences.

### Recommended Solution: Single Source of Truth

**Action Items**:
1. Audit `state/types.ts` - identify what's actually used
2. Migrate all references to `domain/types/`
3. Remove `state/types.ts` or make it re-export only
4. Update imports across codebase

**Benefits**:
- Single source of truth
- No type drift
- Easier maintenance
- Clearer architecture

---

## 9. Configuration System

### Current Issues

**Problem**: Configuration is scattered:
- Constants in `domain/constants/`
- Some config in `systems/economy_constants.ts`
- Hardcoded values in various files

### Recommended Solution: Centralized Config System

**Create**: `src/config/game_config.ts`

```typescript
export type GameConfig = {
  economy: {
    jitterFactor: number;
    distancePremium: number;
    stockCurveSteepness: number;
  };
  physics: {
    defaultDrag: number;
    maxVelocity: number;
  };
  combat: {
    baseFireRate: number;
    projectileLifetime: number;
  };
  // ... other config sections
};

export const defaultConfig: GameConfig = {
  economy: {
    jitterFactor: 0.02,
    distancePremium: 0.001,
    stockCurveSteepness: 2.0,
  },
  // ...
};

export let gameConfig: GameConfig = { ...defaultConfig };

export function updateConfig(updates: Partial<GameConfig>): void {
  gameConfig = { ...gameConfig, ...updates };
}
```

**Benefits**:
- Single place for all configuration
- Runtime config updates
- Config validation
- Environment-specific configs (dev/prod)

---

## 10. Event System

### Current Issues

**Problem**: Side effects are scattered throughout actions:
- Tutorial progression checks in multiple actions
- Mission completion checks in sell action
- Celebration triggers in multiple places

### Recommended Solution: Event Bus Pattern

**Create**: `src/state/events/event_bus.ts`

```typescript
export type GameEvent =
  | { type: 'commodity_bought'; commodityId: string; quantity: number }
  | { type: 'commodity_sold'; commodityId: string; quantity: number }
  | { type: 'contract_completed'; contractId: string }
  | { type: 'mission_completed'; missionId: string }
  | { type: 'ship_upgraded'; upgradeType: string }
  | // ... more events
  ;

export class EventBus {
  private handlers: Map<string, Array<(event: GameEvent) => void>> = new Map();
  
  on<T extends GameEvent>(type: T['type'], handler: (event: T) => void): void {
    const handlers = this.handlers.get(type) || [];
    handlers.push(handler as any);
    this.handlers.set(type, handlers);
  }
  
  emit(event: GameEvent): void {
    const handlers = this.handlers.get(event.type) || [];
    handlers.forEach(h => h(event));
  }
}

export const eventBus = new EventBus();

// In store actions:
sell: (commodityId, quantity) => {
  // ... sell logic
  eventBus.emit({ type: 'commodity_sold', commodityId, quantity });
  // Tutorial/mission handlers subscribe to events
}
```

**Benefits**:
- Decoupled side effects
- Easier to add new event handlers
- Better testability
- Plugin system can subscribe to events

---

## Implementation Priority

### Phase 1: High Impact, Low Risk
1. **Ship Registry Pattern** - Eliminates massive duplication
2. **Type Const Assertion Pattern** - Prevents type drift
3. **Type Duplication Elimination** - Clean up architecture

### Phase 2: Medium Impact, Medium Risk
4. **Store Action Composition** - Better organization
5. **Configuration System** - Centralized config
6. **Event System** - Decouple side effects

### Phase 3: Lower Priority, Higher Complexity
7. **Commodity Registry** - Plugin support
8. **Recipe Registry** - Advanced customization
9. **Mission Type Registry** - Custom mission types
10. **Module Lifecycle** - Plugin modules

---

## Migration Strategy

### For Each Improvement:

1. **Create new structure** alongside existing code
2. **Migrate incrementally** - one feature at a time
3. **Add tests** for new patterns
4. **Update documentation** in `.cursorrules`
5. **Remove old code** once migration complete

### Example: Ship Registry Migration

```typescript
// Step 1: Create registry (non-breaking)
export const SHIP_REGISTRY = { /* ... */ };

// Step 2: Create helper function
export function createShip(kind, position, overrides) { /* ... */ }

// Step 3: Update chooseStarter to use registry
chooseStarter: (kind, opts) => {
  const ship = createShip(kind, state.ship.position);
  // ... rest of logic
}

// Step 4: Update replaceShip similarly
// Step 5: Remove old if/else chains
// Step 6: Update UI to use registry
```

---

## Testing Considerations

Each improvement should include:

1. **Unit tests** for new registry/helper functions
2. **Integration tests** for action refactoring
3. **Type tests** to ensure TypeScript catches errors
4. **Regression tests** to ensure existing behavior preserved

---

## Conclusion

These improvements will make the codebase:
- **More maintainable** - Less duplication, clearer structure
- **More extensible** - Registry patterns enable plugins
- **More testable** - Smaller, focused functions
- **More type-safe** - Single source of truth for types
- **Easier to onboard** - Clearer architecture

Start with Phase 1 improvements for immediate benefits, then gradually adopt Phase 2 and 3 patterns as needed.

