## Trader

Systems-driven 3D space trading game with a dynamic economy, narrative-driven mission arcs, and faction-based politics. Buy low, sell high, fabricate goods, complete story missions, engage in combat, and optimize routes across a small star system.

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
- Complete **story-driven mission arcs** with meaningful choices that affect reputation, economics, and station relationships.
- Engage in **combat** using ship weapons (laser, plasma, railgun, missile) against hostile NPCs and pirates.
- Build reputation at stations for price discounts (up to 10%), contract bonuses, and escort ship assistance.
- **Faction reputation propagation**: Actions at one station affect other stations in the same faction.
- Upgrade your ship (cargo, acceleration, top speed, weapons) and unlock capabilities (Mining Rig, Navigation Array, Mercantile Data Nexus, Union Membership).
- Replace your ship at shipyards with specialized models (Freighters, Clippers, Miners, and advanced variants).
- NPC traders travel profitable routes and subtly shift station stocks over time.
- **Dynamic dialogue system**: Station personas respond to your reputation, past actions, and world state with context-aware dialogue and voice synthesis.
- **Background music**: Ambient exploration music and station-specific themes with smooth crossfading.
- Optional tutorial guides new players through core mechanics.

Core loop:
1) Identify price gaps and route opportunities.
2) Buy goods at source → move → sell at demand destination.
3) Fabricate at intermediate stations when profitable (if permitted).
4) Complete mission arcs to unlock rewards and permanent economic effects.
5) Reinvest in upgrades and capabilities to unlock new routes and margins.

## Requirements

### Functional
- Player can select a starter ship (Freighter, Clipper, Miner, or Test Ship) and optionally enable tutorial guidance.
- Player can fly in 3D with engine power control, dock/undock, and interact with station UIs.
- **Combat system** allows firing weapons, damaging NPCs, and engaging in space battles.
- Market UI shows station inventory with buy/sell prices, stock, reputation discounts, and action buttons per commodity.
- Fabrication UI lists recipes for the current station and allows converting inputs to outputs.
- **Mission arcs** (5 major story arcs) with branching paths, meaningful choices, and faction consequences.
- **Choice system** presents major decisions with visible consequences that alter game economics and faction relationships.
- Station personas greet the player on docking with context-aware dialogue based on reputation tier, past actions, and world state.
- **Voice synthesis** for character dialogue with audio playback during dock interactions.
- Journal shows trades, derived profit per commodity, and suggested profitable routes (Navigation Array/Market Intel gated).
- Traders panel displays NPC metrics and route profitability (Market Intel gated).
- Upgrades are available at shipyards; city provides Union membership; ship replacement and weapons at shipyards.
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
- GLB/GLTF 3D models for ships and stations
- Web Audio API for music and dialogue playback

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
- Run tests: `npm test`

## Architecture and folder structure

```
src/
  App.tsx                      # Top-level UI shell (Canvas + panels)
  main.tsx                     # React entry
  index.css                    # Global styles
  
  config/
    game_config.ts             # Game configuration and settings

  domain/
    constants/
      ship_constants.ts        # Ship base and cap stats
      world_constants.ts       # SCALE and world-space helpers (sp)
      weapon_constants.ts      # Weapon stats (damage, fire rate, range)
      mission_constants.ts     # All mission arc definitions
      character_dialogue.ts    # Character-specific dialogue lines
      character_relationships.ts # Inter-character relationships
      faction_constants.ts     # Faction definitions and station assignments
      contract_constants.ts    # Contract pricing and timing
    registries/
      ship_registry.ts         # Ship type registry and lookup
    types/
      economy_types.ts         # StationType, Commodity, StationInventory, ProcessRecipe
      world_types.ts           # Station, Planet, AsteroidBelt, Ship, GameState, etc.
      combat_types.ts          # Weapon, Projectile, combat state types
      mission_types.ts         # Mission, MissionArc, MissionObjective types
      character_types.ts       # Dialogue, relationships, character memory

  shared/
    hooks/
      use_poll.ts              # Simple polling hook for UI refresh
    math/
      vec3.ts                  # Vector math, distance, bezier, lerp, etc.
    audio/
      music_audio.ts           # Background music manager with crossfading
      dialogue_audio.ts        # Voice dialogue playback
      use_music.ts             # React hook for music integration

  systems/
    economy/
      commodities.ts           # generateCommodities()
      recipes.ts               # processRecipes and findRecipeForStation()
      pricing.ts               # priceForStation(), ensureSpread(), price bias, gating
      featured.ts              # seeded featured arbitrage multipliers (time-limited)
      constants.ts             # re-export of economy_constants
    economy_constants.ts       # Tunable economy parameters (affinities, premiums, floors)
    combat/
      weapon_systems.ts        # Weapon mechanics, projectiles, damage calculation
      ai_combat.ts             # NPC combat AI, aggression, targeting
    missions/
      mission_generator.ts     # Generate missions from templates
      mission_validator.ts     # Check completion, validate objectives
      choice_system.ts         # Handle choice missions, branching paths
      stealth_system.ts        # Detection zones, stealth validation
      escort_system.ts         # Escort HP, wave spawning
    dialogue/
      dialogue_selector.ts     # Context-aware dialogue line selection
      gossip_system.ts         # Inter-character gossip and reactions
    reputation/
      faction_system.ts        # Faction rep calculation, propagation

  input/
    input_handler.ts           # Centralized input handling
    keyboard_bindings.ts       # Key binding definitions
    use_input.ts               # Input hook for components
    use_game_input.ts          # Game-specific input handling

  state/
    index.ts                   # Barrel: useGameStore + selected exports
    store.ts                   # Zustand store (tick, movement, dock/undock, trade, combat, missions)
    world/
      seed.ts                  # Static world seed (planets, stations with personas, belts, inventories)
    modules/
      combat.ts                # Combat state management
      economy.ts               # Economy state management
      missions.ts              # Mission state management
      notifications.ts         # Notification system
      npc.ts                   # NPC state management
      physics.ts               # Physics calculations
      reputation.ts            # Reputation state management
    helpers/
      contract_helpers.ts      # Contract completion and tracking logic
      reputation_helpers.ts    # Reputation-based bonus calculations
      mission_helpers.ts       # Mission progression, unlocking logic
      character_memory.ts      # Track player interactions for dialogue
    actions/
      economy/
        buy_action.ts          # Buy commodity action
        sell_action.ts         # Sell commodity action
    relationships.ts           # Character relationship management
    world.ts                   # Re-exports of commodities/planets/stations/belts
    npc.ts                     # NPC spawn and path planning utilities
    game_state.ts              # Initial game state construction
    math.ts                    # Math utilities for state calculations

  scene/
    scene_root.tsx             # R3F scene integration + input + camera follow
    components/
      primitives/
        Planet.tsx             # Planet/star mesh and label
        BeltRing.tsx           # Belt ring mesh and label with asteroids
        PlaneGrid.tsx          # Ground grid + contact shadows
      stations/
        StationVisual.tsx      # GLB model loading per station type
      ships/
        FreighterModel.tsx     # Ship mesh (freighter) with GLB models
        ClipperModel.tsx       # Ship mesh (clipper/racer)
        MinerModel.tsx         # Ship mesh (miner)
      Ship.tsx                 # Ship container and orientation
      MissionMarkers.tsx       # 3D mission objective markers

  ui/
    market_panel.tsx           # Market UI, upgrades, ship replacement, weapons, missions
    journal_panel.tsx          # Trades log, cargo, profits, routes (gated)
    traders_panel.tsx          # NPC traders and profitability metrics
    dock_intro.tsx             # Persona overlay with avatar, dialogue, and voice playback
    minimap.tsx                # 2D system map (canvas)
    celebration.tsx            # Contract completion celebration overlay
    mission_celebration.tsx    # Mission arc completion celebration
    mission_hud.tsx            # Active mission objectives display
    components/
      hud/
        ShipStatusPanel.tsx    # Ship HP, energy, weapon status
        ObjectiveHUD.tsx       # Mission objective tracker
        StarterShipSelector.tsx # Ship selection at game start
        TutorialOverlay.tsx    # Tutorial guidance overlay
      market/
        MarketHeader.tsx       # Station name and reputation
        ContractsSection.tsx   # Contract display and acceptance
        MissionsSection.tsx    # Story mission display
        FabricationSection.tsx # Recipe fabrication UI
        ProductionSection.tsx  # Station production info
        ShipyardSection.tsx    # Ship and weapon upgrades
        HallSection.tsx        # Character interaction
      shared/
        SciFiPanel.tsx         # Themed panel container
        SciFiButton.tsx        # Themed button component
        SectionHeader.tsx      # Themed section header
        CommodityGrid.tsx      # Commodity display grid
        DataRow.tsx            # Key-value data display
      mission_choice_dialog.tsx # Choice mission branching dialog
      ui_icon.tsx              # Icon component with commodity/UI icon support
      Notifications.tsx        # Toast notification system

  data/
    commodity_icon_prompts.ts  # AI prompts for commodity icon generation
    ui_asset_prompts.ts        # AI prompts for UI asset generation
    music_prompts.ts           # AI prompts for music generation

  personas/
    avatar_prompts.ts          # Prompts metadata for persona images
```

Design notes:
- Domain types/constants are the single source of truth shared across systems and state.
- Economy modules are split for clarity and easier tuning/testing.
- **Mission system** uses arc-based progression with branching choices and permanent economic effects.
- **Combat system** integrates with missions for destroy, escort, and defend objectives.
- **Dialogue system** uses context-aware selection based on reputation, actions, and world state.
- **Audio system** provides background music and voice dialogue with crossfading.
- State store orchestrates gameplay actions and NPC effects, keeping logic functional and side-effect minimal.
- Scene is composed of small, reusable 3D components with GLB model loading; `scene_root` handles input and camera.
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
- Defines planets, stations (+ personas with dialogue lines), belts; computes inventories via `priceForStation`.
- Each station has character-specific dialogue organized by category (greeting, gossip, tip, reaction, concern, etc.).

### Combat System
- **4 Weapon Types** with unique stats:
  - **Laser Cannon** (starter): Fast fire rate, instant hit (hitscan), 10 damage
  - **Plasma Burster**: High damage, slower projectiles, 25 damage
  - **Railgun**: Long range sniper, 50 damage, fast projectiles
  - **Missile Launcher**: Tracking missiles, 75 damage, requires Market Intel
- **Energy System**: Ships have 100 energy that regenerates at 10/sec when not docked
- **Combat Mechanics**: NPCs have HP (80), fire back when attacked, become aggressive for 30 seconds
- **Reputation Consequences**: Attacking peaceful traders damages reputation at their origin station
- **Weapon Upgrades** available at Shipyard: Damage, Fire Rate, Range (multiple tiers)

### Mission Arcs
The game features **5 major story arcs** with branching narratives:

1. **Greenfields Independence Movement** - Agricultural freedom vs. Sol City regulation
2. **The Fabrication Wars** - Competition between Aurum Fab and Drydock
3. **The Energy Monopoly** - Fuel scarcity and price manipulation investigation
4. **The Pirate Accords** - Law enforcement vs. piracy vs. free trade
5. **The Union Crisis** - Workers' rights across the system

Each arc includes:
- Multiple stages (4 stages per arc)
- **Choice missions** with 2-3 branching paths
- **Combat missions** (destroy targets, escort/defend, siege)
- **Stealth missions** (avoid detection zones)
- **Collection missions** (gather resources within time limits)
- **Permanent economic effects** based on outcomes

### Faction System
Stations belong to factions with reputation propagation:
- **Sol Government**: Sol City, Sol Refinery (Helios)
- **Independent Workers**: Greenfields, Drydock, Freeport
- **Corporate**: Aurum Fab, Ceres Power Plant
- **Pirate**: Hidden Cove

Actions at one station affect other stations in the same faction (+50% of rep change).

### Dialogue System
- **Context-aware selection**: Lines chosen based on reputation tier, past actions, world state
- **Character memory**: Tracks visit count, trade volume, time since last visit
- **Dialogue categories**: greeting, farewell, gossip, tip, reaction, memory, concern, world
- **Voice synthesis**: Audio files generated and played during dock interactions
- **Gossip system**: Characters reference and comment on other characters

### Audio System
- **Background Music**: Ambient exploration tracks and station-specific themes
- **Crossfading**: Smooth transitions between tracks (2-second crossfade)
- **Dialogue Audio**: Voice-synthesized character lines with manifest-based lookup
- **Volume Control**: Master volume and mute support

### State/store
- `store.ts` exposes actions: `tick`, `thrust`, `setEngineTarget`, `tryDock`, `undock`, `dismissDockIntro`, `mine`, `buy`, `sell`, `process`, `upgrade`, `replaceShip`, `chooseStarter`, combat actions (`fireWeapon`, `purchaseWeapon`, `upgradeWeapon`), mission actions (`acceptMission`, `completeMission`, `makeMissionChoice`), and more.
- `tick(dt)` applies drag, moves ship and NPCs, processes projectiles, jitters station prices slightly, advances NPCs along paths, adjusts station stock on NPC delivery, spawns new NPCs, checks mission objectives, and progresses contract escorts.
- `getSuggestedRoutes` computes profitable direct and process routes with gating considered.
- Mission state tracked in `GameState.missionArcs` and `GameState.activeMission`.

### Scene and input
- WASD to move on the XZ plane; R/F for vertical; E to dock; Q to undock; M to mine (when near belt ring).
- **Spacebar** fires weapon at nearest target (or forward if no target).
- Camera follows ship with smooth lerp and yaw drag with middle mouse.

### UI panels
- Market: trade, fabrication, production, upgrades, ship replacement (at shipyards), weapons, and mission management.
- Journal: cargo display, trades log, profit by commodity, and route suggestions (Navigation Array/Market Intel gated).
- Traders: NPC routes with profitability metrics (requires Market Intel).
- Dock intro: persona overlay with avatar, context-aware dialogue with voice playback, and contextual tips on docking.
- Celebration: Full-screen overlay with fireworks and profit breakdown when completing contracts (dismissible with spacebar or click).
- Mission HUD: Active mission objectives display with progress tracking.
- Mission Choice Dialog: Presents branching choices with consequence previews.

## Input controls

### Keyboard
- **WASD** - Move ship on XZ plane (strafe left/right, forward/back)
- **R/F** - Vertical movement (up/down)
- **E** - Dock at nearby station (when in range)
- **Q** - Undock from current station
- **M** - Mine asteroids (when near belt ring and has Mining Rig)
- **Spacebar** - Fire weapon / Dismiss celebration overlay

### Mouse
- **Middle mouse drag** - Rotate camera yaw around ship
- **Click** - UI interactions (trade, accept contracts, upgrades, etc.)

## 3D Assets

### Ships
Ships are rendered using GLB models located in `public/ships/`:
- `freighter_ship.glb` - Heavy cargo vessel
- `general_ship.glb` - Balanced general purpose ship
- `racer_ship.glb` - Fast clipper-style ship

### Stations
Stations use GLB models from `public/stations/`:
- `station_solcity.glb` - City station (Sol City)
- `station_refinery.glb` - Refinery station
- `station_fabricator.glb` - Fabrication station (Aurum Fab)
- `station_powerplant.glb` - Power plant (Ceres PP)
- `station_freeport.glb` - Trading post / Pirate stations
- `station_shipyard.glb` - Drydock shipyard
- `station_farm.glb` - Agricultural station (Greenfields)

### Asteroids
Asteroid models in `public/asteroids/`:
- `asteroid_01.glb`, `asteroid_02.glb` - Standard asteroids
- `asteroid_ore.glb` - Mineable ore asteroids

### Icons
- Commodity icons: `public/icons/commodities/` (28 commodities)
- UI icons: `public/icons/ui/` (tabs, status, systems, messages, tags)

## Coding conventions
- TypeScript strict mode; prefer typed modules from `domain/types`.
- Keep pure logic in `systems` and `state` where possible; avoid local component state for core game logic.
- Favor functional updates and early returns; keep React components presentational.
- Use absolute or short relative imports (tsconfig `baseUrl: ./src`).
- Follow snake_case for files, camelCase for functions, PascalCase for components.

## Extending the game

### Add a Commodity
1. Edit `systems/economy/commodities.ts` → add to `generateCommodities()`
2. Define: `id`, `name`, `category`, `baseBuy`, `baseSell`
3. Optionally add to `gatedCommodities` in `pricing.ts` if requires Navigation Array
4. Add icon prompt in `data/commodity_icon_prompts.ts`

### Add/Tune Recipe
1. Edit `systems/economy/recipes.ts` → add to `processRecipes[stationType]`
2. Define: `inputId`, `outputId`, `inputPerOutput` (conversion ratio)

### Tune Economy Behavior
- Edit `systems/economy_constants.ts` for station affinities, premiums, price floors
- Adjust `JITTER_FACTOR`, `DISTANCE_PREMIUM`, `STOCK_CURVE_*` in `pricing.ts`

### Add a Station
1. Edit `state/world/seed.ts`
2. Define position, type, persona (name, title, vibe, lines, tips)
3. Add character dialogue lines in `domain/constants/character_dialogue.ts`
4. Assign to faction in `domain/constants/faction_constants.ts`
5. Optionally set initial reputation value
6. Inventory auto-generated via `priceForStation()`

### Add Ship Model
1. Create mesh component in `scene/components/ships/`
2. Add ship kind to `Ship['kind']` union type in `world_types.ts`
3. Define base stats and caps in `domain/constants/ship_constants.ts` (both `baseStats` and `shipCaps`)
4. Register in `domain/registries/ship_registry.ts`
5. Update `chooseStarter` and `replaceShip` actions in `store.ts`
6. Update ship selection UI in `ui/market_panel.tsx`

### Add UI Panel
1. Create component in `ui/`
2. Read state via `useGameStore(s => s.property)` with Zustand selectors
3. Call actions via `useGameStore(s => s.actionName)(params)`
4. Add tab button and conditional rendering to `App.tsx`

### Add a Mission Arc
1. Define arc structure in `domain/constants/mission_constants.ts`
2. Add mission templates for each stage (4 stages recommended)
3. Define choice points with `choiceOptions` for branching
4. Add character-specific dialogue in `domain/constants/character_dialogue.ts`
5. Register arc unlocking conditions in mission generator
6. Test full arc playthrough with all branches

### Add a Weapon Type
1. Add weapon definition in `domain/constants/weapon_constants.ts`
2. Update `weapon_systems.ts` for any special behavior
3. Add purchase option in shipyard UI
4. Add visual rendering in projectile system

### Add Character Dialogue
1. Edit `domain/constants/character_dialogue.ts`
2. Add lines with appropriate `DialogueConditions`
3. Set `category` (greeting, gossip, tip, reaction, etc.)
4. Set `priority` for line selection preference
5. Optional: Generate voice audio via `scripts/generate_voices.mjs`

### Modify Contract Generation
1. Edit `generateContracts` action in `store.ts` for different generation rules
2. Adjust constants in `domain/constants/contract_constants.ts` (timings, rep requirements, pricing)
3. Update contract completion logic in `state/helpers/contract_helpers.ts`

## Asset Generation Scripts

Located in `scripts/`:
- `generate_commodity_icons.mjs` - Generate commodity icons via AI
- `generate_ui_assets.mjs` - Generate UI icons and elements
- `generate_avatars.mjs` - Generate character avatar images
- `generate_music.mjs` - Generate background music tracks
- `generate_voices.mjs` - Generate character voice dialogue
- `export_dialogue_for_voice.mjs` - Export dialogue lines for voice synthesis
- `resize_icons.mjs` - Resize generated icons to standard sizes
- `organize_masters.mjs` - Organize master asset files

## Troubleshooting
- React key warnings in lists: ensure mapped children are wrapped in keyed Fragments.
- Drei/R3F version issues: `npm install` to align with lockfile; clear vite cache if needed.
- Type errors after refactors: run `npm run typecheck` and follow errors to imports from `domain/*` and `systems/economy/*`.
- Audio not playing: Check browser console for autoplay restrictions; ensure manifest files exist.
- GLB models not loading: Verify file paths in `public/` directory and preload statements.

## Documentation

Detailed documentation is available in the `docs/` folder:
- `MISSION_SYSTEM_DESIGN.md` - Complete mission arc system specification
- `WEAPONS_IMPLEMENTATION_SUMMARY.md` - Combat system details
- `PHASE4_IMPLEMENTATION_SUMMARY.md` through `PHASE7_IMPLEMENTATION_SUMMARY.md` - Implementation phases
- `EXTENSIBILITY_IMPROVEMENTS.md` - Architecture improvements
- `UI_ENHANCEMENT_SUMMARY.md` - UI system documentation
- `TESTING_PLAN.md` - Testing strategy and checklists

## License
MIT
