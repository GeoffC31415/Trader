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
- Upgrade your ship (cargo, acceleration, top speed) and unlock capabilities (Mining Rig, Navigation Array, Mercantile Data Nexus, Union Membership).
- NPC traders travel profitable routes and subtly shift station stocks over time.

Core loop:
1) Identify price gaps and route opportunities.
2) Buy goods at source → move → sell at demand destination.
3) Fabricate at intermediate stations when profitable (if permitted).
4) Reinvest in upgrades and capabilities to unlock new routes and margins.

## Requirements

### Functional
- Player can select a starter ship and optionally enable tutorial guidance.
- Player can fly in 3D, dock/undock, and interact with station UIs.
- Market UI shows station inventory with buy/sell prices, stock, and action buttons per commodity.
- Fabrication UI lists recipes for the current station and allows converting inputs to outputs.
- Journal shows trades and derived profit per commodity.
- Routes panel shows suggested profitable routes (requires Navigation Array/Market Intel as gated).
- Upgrades are available at shipyards; city provides Union membership.
- Mining is possible at belts when near the ring and the ship has a Mining Rig.
- NPC traders move between stations and adjust station stock on arrival.

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
    store.ts                   # Zustand store (tick, movement, dock/undock, trade, process, upgrade)
    world/
      seed.ts                  # Static world seed (planets, stations with personas, belts, inventories)
    world.ts                   # Re-exports of commodities/planets/stations/belts
    npc.ts                     # NPC spawn and path planning utilities
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
    market_panel.tsx           # Market UI, upgrades, ship replacement
    journal_panel.tsx          # Trades log, cargo, profits, routes (gated)
    traders_panel.tsx          # NPC traders and profitability metrics
    dock_intro.tsx             # Persona overlay when docking
    minimap.tsx                # 2D system map (canvas)

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

### State/store
- `store.ts` exposes actions: `tick`, `thrust`, `tryDock`, `undock`, `mine`, `buy`, `sell`, `process`, `upgrade`, `replaceShip`, `chooseStarter`, tutorial setters.
- `tick(dt)` applies drag, moves ship, jitters station prices slightly, advances NPCs along paths, and adjusts station stock on NPC delivery.
- `getSuggestedRoutes` computes profitable direct and process routes with gating considered.

### Scene and input
- WASD to move on the XZ plane; R/F for vertical; E to dock; Q to undock; M to mine (when near belt ring).
- Camera follows ship with smooth lerp and yaw drag with middle mouse.

### UI panels
- Market: trade, fabrication, production, upgrades, and ship replacement (at shipyards).
- Journal: cargo, trades log, profit by commodity.
- Traders: NPC routes with profitability metrics (requires Market Intel).
- Dock intro: persona overlay with avatar and flavor text on docking.

## Coding conventions
- TypeScript strict mode; prefer typed modules from `domain/types`.
- Keep pure logic in `systems` and `state` where possible; avoid local component state for core game logic.
- Favor functional updates and early returns; keep React components presentational.
- Use absolute or short relative imports (tsconfig `baseUrl: ./src`).

## Extending the game
- Add commodities: update `systems/economy/commodities.ts`.
- Add or tune recipes: update `systems/economy/recipes.ts`.
- Tune market behavior: adjust `systems/economy_constants.ts` and pricing functions.
- Add a station: edit `state/world/seed.ts` (define persona and rely on pricing to generate inventory).
- New ship model: add a mesh under `scene/components/ships/` and extend ship selection/replace logic in `state/store.ts` and `ui/market_panel.tsx`.

## Troubleshooting
- React key warnings in lists: ensure mapped children are wrapped in keyed Fragments.
- Drei/R3F version issues: `npm install` to align with lockfile; clear vite cache if needed.
- Type errors after refactors: run `npm run typecheck` and follow errors to imports from `domain/*` and `systems/economy/*`.

## License
MIT
