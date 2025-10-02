## Trader

Systems-driven space trading game with a dynamic economy. Buy low, sell high, fabricate goods, upgrade your ship, and optimize routes across a small star system.

### Contents
- Purpose and gameplay overview
- Functional and non-functional requirements
- Architecture and folder structure
- Data models and systems
- Build, run, and developer workflow
- Extending the game

## Purpose and gameplay overview

- Explore a star system containing planets, belts, and stations of different types (refinery, fabricator, city, power plant, farm, shipyard, pirate outpost, etc.).
- Trade commodities across stations. Prices vary by station type, distance, local stock, and featured arbitrage.
- Process input goods into higher-value outputs at stations with recipes (e.g., refinery, fabricator). Pirate stations allow processing without Union membership.
- Accept and complete contracts (delivery missions) with reputation-based multipliers and bonus rewards.
- Build reputation at stations for price discounts (up to 10%), contract bonuses, and escort ship assistance.
- Upgrade your ship (cargo, acceleration, top speed) and unlock capabilities (Mining Rig, Navigation Array, Mercantile Data Nexus, Union Membership).
- Replace your ship at shipyards with specialized models (Freighters, Clippers, Miners, and advanced variants).
- NPC traders travel profitable routes and subtly shift station stocks over time.
- Optional tutorial guides new players through core mechanics.

Core loop:
1) Identify price gaps and route opportunities.
2) Buy goods at source → move → sell at demand destination.
3) Fabricate at intermediate stations when profitable (if permitted).
4) Reinvest in upgrades and capabilities to unlock new routes and margins.

## Requirements

### Functional
- Player can select a starter ship (Freighter, Clipper, Miner, or Test Ship) and optionally enable tutorial guidance.
- Player can fly in 3D with engine power control, dock/undock, and interact with station UIs.
- Market UI shows station inventory with buy/sell prices, stock, reputation discounts, and action buttons per commodity.
- Fabrication UI lists recipes for the current station and allows converting inputs to outputs.
- Contracts system allows accepting delivery missions with reputation requirements, multipliers, and bonus rewards.
- Station personas greet the player on docking with unique flavor text and tips.
- Journal shows trades, derived profit per commodity, and suggested profitable routes (Navigation Array/Market Intel gated).
- Traders panel displays NPC metrics and route profitability (Market Intel gated).
- Upgrades are available at shipyards; city provides Union membership; ship replacement at shipyards.
- Mining is possible at belts when near the ring and the ship has a Mining Rig.
- NPC traders move between stations and adjust station stock on arrival; escort ships assist player cargo when reputation is high.
- Tutorial system guides through: dock at city → accept mission → travel to refinery → buy fuel → deliver fuel.

### Non-functional
- Responsive and smooth rendering at 60 FPS target on modern hardware.
- Deterministic, side-effect-light state updates (Zustand) to simplify reasoning and testing.
- Modular code structure with clear domain boundaries for ease of extension.
- Type-safe across the codebase with strict TypeScript.

## Tech stack
- Vite + React 18 + TypeScript 5
- react-three-fiber + drei (Three.js)
- Zustand for game state
- zod for schema typing of commodities

## Build and run

```bash
# Requirements: Node.js 18+ and npm 9+
npm install
npm run dev
```

- Dev server: `http://localhost:5173`
- Production build: `npm run build` (outputs to `dist/`)
- Preview built app: `npm run preview`
- Type checking: `npm run typecheck`

## Architecture and folder structure

```
src/
  App.tsx                      # Top-level UI shell (Canvas + panels)
  main.tsx                     # React entry
  index.css                    # Global styles

  domain/
    constants/
      ship_constants.ts        # Ship base and cap stats
      world_constants.ts       # SCALE and world-space helpers (sp)
    types/
      economy_types.ts         # StationType, Commodity, StationInventory, ProcessRecipe
      world_types.ts           # Station, Planet, AsteroidBelt, Ship, GameState, etc.

  shared/
    hooks/
      use_poll.ts              # Simple polling hook for UI refresh
    math/
      vec3.ts                  # Vector math, distance, bezier, lerp, etc.

  systems/
    economy/
      commodities.ts           # generateCommodities()
      recipes.ts               # processRecipes and findRecipeForStation()
      pricing.ts               # priceForStation(), ensureSpread(), price bias, gating
      featured.ts              # seeded featured arbitrage multipliers (time-limited)
      constants.ts             # re-export of economy_constants
    economy_constants.ts       # Tunable economy parameters (affinities, premiums, floors)

  state/
    index.ts                   # Barrel: useGameStore + selected exports
    store.ts                   # Zustand store (tick, movement, dock/undock, trade, process, upgrade, contracts)
    world/
      seed.ts                  # Static world seed (planets, stations with personas, belts, inventories)
    helpers/
      contract_helpers.ts      # Contract completion and tracking logic
      reputation_helpers.ts    # Reputation-based bonus calculations
    world.ts                   # Re-exports of commodities/planets/stations/belts
    npc.ts                     # NPC spawn and path planning utilities
    game_state.ts              # Initial game state construction
    math.ts                    # Math utilities for state calculations
    types.ts                   # Legacy surface (now imports from domain/types)
    constants.ts               # Legacy surface (re-exports from domain/constants)

  scene/
    scene_root.tsx             # R3F scene integration + input + camera follow
    components/
      primitives/
        Planet.tsx             # Planet/star mesh and label
        BeltRing.tsx           # Belt ring mesh and label
        PlaneGrid.tsx          # Ground grid + contact shadows
      stations/
        StationVisual.tsx      # Visuals by station type, labels
      ships/
        FreighterModel.tsx     # Ship mesh (freighter)
        ClipperModel.tsx       # Ship mesh (clipper/racer)
        MinerModel.tsx         # Ship mesh (miner)
      Ship.tsx                 # Ship container and orientation

  ui/
    market_panel.tsx           # Market UI, upgrades, ship replacement, contracts
    journal_panel.tsx          # Trades log, cargo, profits, routes (gated)
    traders_panel.tsx          # NPC traders and profitability metrics
    dock_intro.tsx             # Persona overlay when docking
    minimap.tsx                # 2D system map (canvas)
    celebration.tsx            # Contract completion celebration overlay
    components/
      reputation_badge.tsx     # Station reputation display component

  personas/
    avatar_prompts.ts          # Prompts metadata for persona images
```

Design notes:
- Domain types/constants are the single source of truth shared across systems and state.
- Economy modules are split for clarity and easier tuning/testing.
- State store orchestrates gameplay actions and NPC effects, keeping logic functional and side-effect minimal.
- Scene is composed of small, reusable 3D components; `scene_root` handles input and camera.
- UI panels are declarative and read/write via Zustand selectors/actions.

## Data models and systems (overview)

### Economy
- Commodities: defined by id, name, category, baseBuy/baseSell.
- Recipes (by StationType): map inputId → outputId at a ratio.
- Pricing (`pricing.ts`):
  - Starts from base prices; modifies by station affinity, cheap/expensive lists, randomness, and ensures a minimum spread.
  - Distance premium increases sell at non-producers proportional to distance to nearest producer.
  - Featured arbitrage multiplies price temporarily at selected stations/commodities.
  - Stock curve adjusts prices based on local stock vs target.
  - Gated goods require Navigation Array; fabrication requires Union (except pirate).

### World seed
- Located at `state/world/seed.ts`.
- Defines planets, stations (+ personas), belts; computes inventories via `priceForStation`.

### Contracts & Reputation
- **Contracts**: Delivery missions generated per station with tags (standard, bulk, rush, fabrication, emergency).
- **Reputation tracking**: Each station tracks player reputation (0-100+), increased by completing contracts.
- **Reputation bonuses**:
  - Price discounts: 0-10% off purchases based on reputation tier
  - Contract multipliers: Increased sell prices and bonus rewards for deliveries
  - Escort ships: High reputation spawns NPC escort ships that carry extra cargo for the player
- **Contract flow**: Accept at offering station → purchase goods → deliver to destination → earn bonus + reputation
- **Tutorial integration**: First contract guides player through basic trading loop

### State/store
- `store.ts` exposes actions: `tick`, `thrust`, `setEngineTarget`, `tryDock`, `undock`, `dismissDockIntro`, `mine`, `buy`, `sell`, `process`, `upgrade`, `replaceShip`, `chooseStarter`, `setTutorialActive`, `setTutorialStep`, `generateContracts`, `acceptContract`, `setTrackedStation`.
- `tick(dt)` applies drag, moves ship and NPCs, jitters station prices slightly, advances NPCs along paths, adjusts station stock on NPC delivery, spawns new NPCs, and progresses contract escorts.
- `getSuggestedRoutes` computes profitable direct and process routes with gating considered.
- Contract actions in `state/helpers/contract_helpers.ts` handle completion logic, profit tracking, and celebration triggers.

### Scene and input
- WASD to move on the XZ plane; R/F for vertical; E to dock; Q to undock; M to mine (when near belt ring).
- Camera follows ship with smooth lerp and yaw drag with middle mouse.

### UI panels
- Market: trade, fabrication, production, upgrades, ship replacement (at shipyards), and contract management.
- Journal: cargo display, trades log, profit by commodity, and route suggestions (Navigation Array/Market Intel gated).
- Traders: NPC routes with profitability metrics (requires Market Intel).
- Dock intro: persona overlay with avatar, flavor text, and contextual tips on docking.
- Celebration: Full-screen overlay with fireworks and profit breakdown when completing contracts (dismissible with spacebar or click).

## Input controls

### Keyboard
- **WASD** - Move ship on XZ plane (strafe left/right, forward/back)
- **R/F** - Vertical movement (up/down)
- **E** - Dock at nearby station (when in range)
- **Q** - Undock from current station
- **M** - Mine asteroids (when near belt ring and has Mining Rig)
- **Spacebar** - Dismiss celebration overlay

### Mouse
- **Middle mouse drag** - Rotate camera yaw around ship
- **Click** - UI interactions (trade, accept contracts, upgrades, etc.)

## Coding conventions
- TypeScript strict mode; prefer typed modules from `domain/types`.
- Keep pure logic in `systems` and `state` where possible; avoid local component state for core game logic.
- Favor functional updates and early returns; keep React components presentational.
- Use absolute or short relative imports (tsconfig `baseUrl: ./src`).

## Extending the game

### Add a Commodity
1. Edit `systems/economy/commodities.ts` → add to `generateCommodities()`
2. Define: `id`, `name`, `category`, `baseBuy`, `baseSell`
3. Optionally add to `gatedCommodities` in `pricing.ts` if requires Navigation Array

### Add/Tune Recipe
1. Edit `systems/economy/recipes.ts` → add to `processRecipes[stationType]`
2. Define: `inputId`, `outputId`, `inputPerOutput` (conversion ratio)

### Tune Economy Behavior
- Edit `systems/economy_constants.ts` for station affinities, premiums, price floors
- Adjust `JITTER_FACTOR`, `DISTANCE_PREMIUM`, `STOCK_CURVE_*` in `pricing.ts`

### Add a Station
1. Edit `state/world/seed.ts`
2. Define position, type, persona (name, title, vibe, lines, tips)
3. Optionally set initial reputation value
4. Inventory auto-generated via `priceForStation()`

### Add Ship Model
1. Create mesh component in `scene/components/ships/`
2. Add ship kind to `Ship['kind']` union type in `world_types.ts`
3. Define base stats and caps in `domain/constants/ship_constants.ts` (both `baseStats` and `shipCaps`)
4. Update `chooseStarter` and `replaceShip` actions in `store.ts`
5. Update ship selection UI in `ui/market_panel.tsx`

### Add UI Panel
1. Create component in `ui/`
2. Read state via `useGameStore(s => s.property)` with Zustand selectors
3. Call actions via `useGameStore(s => s.actionName)(params)`
4. Add tab button and conditional rendering to `App.tsx`

### Modify Contract Generation
1. Edit `generateContracts` action in `store.ts` for different generation rules
2. Adjust constants in `domain/constants/contract_constants.ts` (timings, rep requirements, pricing)
3. Update contract completion logic in `state/helpers/contract_helpers.ts`

## Troubleshooting
- React key warnings in lists: ensure mapped children are wrapped in keyed Fragments.
- Drei/R3F version issues: `npm install` to align with lockfile; clear vite cache if needed.
- Type errors after refactors: run `npm run typecheck` and follow errors to imports from `domain/*` and `systems/economy/*`.

## License
MIT
