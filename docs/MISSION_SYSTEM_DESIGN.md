# Mission System Design: Story Arcs & Combat

## Overview
This document outlines the mission arc system that adds narrative depth, faction politics, and combat mechanics to the space trading game. Each arc involves multiple missions that progress a storyline with meaningful choices that affect reputation, economics, and available gameplay.

---

## Story Arcs

### Arc 1: **The Greenfields Independence Movement**
**Characters:** Sana Whit (Greenfields), Mira Vale (Sol City)  
**Conflict:** Sol City bureaucracy vs. agricultural independence  
**Unlock:** Available from start (rep 0)

#### Background
Sol City has been slowly tightening regulations on Greenfields Farm, citing "food safety standards" but really aiming to control the food supply. Sana Whit wants to break free from Sol City's oversight and sell directly to independent stations. Mira Vale sees this as dangerous deregulation that threatens the system's stability.

#### Missions
1. **"Breaking the Chain"** - Deliver luxury goods to Greenfields without Sol City knowing
   - Accept from: Greenfields (rep 0+)
   - Type: Smuggling (avoid detection radius near Sol City)
   - Reward: 2000cr + 10 Greenfields rep, -5 Sol City rep
   - Unlocks: Choice dialogue at Greenfields

2. **"The Census"** - Investigate Sol City's inspection logs (choice mission)
   - Accept from: Greenfields (rep 10+) OR Sol City (rep 10+)
   - **Choice A (Side with Greenfields):** Steal data chips from Sol City, deliver to Greenfields
     - Reward: 3000cr + 15 Greenfields rep, -10 Sol City rep
     - Consequence: Sol City raises prices for Greenfields goods by 15%
   - **Choice B (Side with Sol City):** Report Greenfields' unregistered grow operations
     - Reward: 3000cr + 15 Sol City rep, -10 Greenfields rep
     - Consequence: Greenfields stock drops by 30% temporarily (2 real-time minutes)

3. **"Supply Cut"** - Sabotage mission (only if sided with one faction)
   - **Greenfields Path:** Destroy 3 NPC traders carrying grain from Greenfields to Sol City
     - Reward: 5000cr + 20 Greenfields rep, -20 Sol City rep
     - Consequence: Sol City grain prices spike +40% for 5 minutes
   - **Sol City Path:** Escort Sol City inspector to Greenfields (defend against pirate ambush)
     - Reward: 5000cr + 20 Sol City rep, -20 Greenfields rep
     - Consequence: Greenfields loses fabrication access for 5 minutes

4. **"New Markets"** - Finale mission
   - **Greenfields Path:** Establish direct trade route to Freeport (deliver 30 food goods)
     - Reward: 8000cr + 30 Greenfields rep, permanent -5% food prices at Greenfields
     - Unlocks: Greenfields Independence ending
   - **Sol City Path:** Lock down Greenfields trade (deliver contract enforcement to 4 stations)
     - Reward: 8000cr + 30 Sol City rep, -5% on all goods at Sol City
     - Unlocks: Sol City Control ending

**Arc Outcome:** Permanent economic shifts, new dialogue at both stations, affects later arcs

---

### Arc 2: **The Fabrication Wars**
**Characters:** Dr. Elin Kade (Aurum Fab), Chief Harlan (Drydock)  
**Conflict:** Advanced manufacturing competition  
**Unlock:** Requires Union Membership + rep 20 at either station

#### Background
Aurum Fab and Drydock both claim to be the premier advanced manufacturer. Dr. Kade wants to monopolize microchip production, while Chief Harlan argues that centralized fabrication creates dangerous supply bottlenecks. Both want exclusive contracts with key stations.

#### Missions
1. **"Patent Wars"** - Steal/protect fabrication schematics
   - Accept from: Aurum Fab (rep 20+) OR Drydock (rep 20+)
   - **Aurum Path:** Hack Drydock database, return with alloy formula
   - **Drydock Path:** Plant false schematics at Aurum Fab
   - Reward: 4000cr + 15 rep with chosen station, -15 with other
   - Consequence: Chosen station gets 10% production speed boost (recipes need less input)

2. **"Raw Materials Rush"** - Economic warfare
   - Accept from: Aurum Fab or Drydock (rep 30+)
   - Buy out all copper_ore and silicon from 3 stations before timer expires (8 minutes)
   - Deliver to quest giver
   - Reward: 6000cr + 20 rep
   - Consequence: Opponent station can't fabricate for 3 minutes (all recipes disabled)

3. **"Sabotage the Supply Line"** - Combat mission
   - Accept from: Aurum Fab or Drydock (rep 40+)
   - Destroy 5 NPC traders carrying electronics/alloys to opponent station
   - Must destroy within 10-minute window
   - Reward: 7000cr + 25 rep with chosen, -30 with opponent
   - Consequence: Opponent station raises fabrication prices 25% for 5 minutes

4. **"The Exclusive Contract"** - Finale
   - Accept from: Aurum Fab or Drydock (rep 50+)
   - Deliver massive fabricated goods order to Ceres Power Plant (50 units mixed)
   - First to complete wins exclusive supplier status
   - **Winner gets:** 12000cr + 40 rep, permanent -10% fabrication costs, Ceres PP +30 rep
   - **Loser gets:** Station temporarily closes fabrication for 5 minutes, -20 rep at both stations

**Arc Outcome:** Winner becomes preferred supplier for late-game upgrades, loser offers alternative ship weapon upgrades

---

### Arc 3: **The Energy Monopoly**
**Characters:** Ivo Renn (Ceres PP), Rex Calder (Sol Refinery)  
**Conflict:** Fuel scarcity and price manipulation  
**Unlock:** Requires Navigation Array + rep 30 at Ceres PP

#### Background
Ivo Renn at Ceres Power Plant has quietly been buying up all refined fuel from Sol Refinery and restricting supply to create artificial scarcity. Rex Calder is furious but can't prove it. Stations are starting to suffer from fuel shortages. The player must investigate and choose sides.

#### Missions
1. **"The Audit Trail"** - Investigation mission
   - Accept from: Sol Refinery (rep 30+)
   - Install monitoring device at Ceres PP without being detected
   - Stealth mission: dock, wait 30 seconds undetected, undock
   - Reward: 5000cr + 15 Sol Refinery rep
   - Unlocks: Evidence of price manipulation

2. **"Fuel the Fire"** - Choice mission
   - Accept from: Sol Refinery or Ceres PP (rep 40+)
   - **Sol Refinery Path:** Expose Ceres PP by delivering evidence to 3 stations
     - Reward: 6000cr + 20 rep at Sol Refinery, +10 rep at 3 visited stations
     - Consequence: Ceres PP fuel prices drop -20% permanently, Ceres PP rep -25
   - **Ceres PP Path:** Destroy the evidence before Rex can analyze it
     - Reward: 8000cr + 25 rep at Ceres PP
     - Consequence: Fuel shortage continues, all fuel prices +15% for 10 minutes

3. **"The Blockade"** - Combat/defense mission
   - **Sol Refinery Path:** Defend Rex's fuel convoy (3 NPC traders) from Ceres hired pirates
     - Destroy 4 pirate ships before they destroy convoy
     - Reward: 8000cr + 25 Sol Refinery rep
   - **Ceres PP Path:** Raid Sol Refinery fuel shipments (destroy 3 convoys)
     - Reward: 8000cr + 25 Ceres PP rep, -30 Sol Refinery rep

4. **"New Sources"** - Finale
   - **Sol Refinery Path:** Establish independent fuel source (deliver rare_minerals to create new refinery)
     - Deliver 40 rare_minerals to Freeport
     - Reward: 15000cr + 40 Sol Refinery rep, fuel prices normalize -10% everywhere
   - **Ceres PP Path:** Consolidate control (buy all fuel from 5 stations within 12 minutes)
     - Reward: 15000cr + 40 Ceres PP rep, permanent fuel discount -15% at Ceres PP

**Arc Outcome:** Shapes fuel economy for endgame, affects all stations' operating costs

---

### Arc 4: **The Pirate Accords**
**Characters:** Vex Marrow (Hidden Cove), Kalla Rook (Freeport), Mira Vale (Sol City)  
**Conflict:** Piracy vs. law enforcement vs. free trade  
**Unlock:** Requires rep 25 at Hidden Cove OR rep 50 at Sol City

#### Background
Hidden Cove pirates have been increasingly aggressive, but they claim they're just "liberating" goods from Sol City's monopolistic control. Freeport's Kalla Rook is caught in the middle - she benefits from pirate business but doesn't want full-scale war. Sol City wants to eliminate the pirates entirely.

#### Missions
1. **"Diplomatic Pouch"** - First contact
   - Accept from: Freeport (rep 15+)
   - Deliver peace proposal from Freeport to Hidden Cove
   - Risk: 30% chance of pirate ambush en route
   - Reward: 3000cr + 10 rep at both stations
   - Unlocks: Hidden Cove dialogue options

2. **"Choose Your Side"** - Major choice mission
   - Accept from: Hidden Cove (rep 25+) OR Sol City (rep 50+) OR Freeport (rep 40+)
   - Three distinct paths begin here:

   **Path A: Join the Pirates (Hidden Cove)**
   - Mission: Raid 4 Sol City convoys, deliver stolen goods to Hidden Cove
   - Reward: 10000cr + 35 Hidden Cove rep, -40 Sol City rep
   - Consequence: Sol City marks you as hostile (combat on sight)

   **Path B: Enforce the Law (Sol City)**
   - Mission: Destroy 6 pirate ships near Hidden Cove
   - Reward: 10000cr + 40 Sol City rep, -50 Hidden Cove rep (permanent hostile)
   - Consequence: Hidden Cove closes to you, pirate attacks increase 50%

   **Path C: Broker Peace (Freeport)**
   - Mission: Deliver 20 luxury goods + 20 electronics + 20 pharmaceuticals as "reparations fund"
   - Reward: 8000cr + 30 rep at all three stations
   - Consequence: Pirate attacks decrease 50%, peace agreement holds (unless you break it)

3. **"The Enforcement"** - Path-specific finale
   - **Pirate Path:** Assault Sol City defenses (destroy 3 defense turrets - new mechanic!)
     - Reward: 15000cr + 50 Hidden Cove rep, permanent black market access
   - **Law Path:** Siege Hidden Cove (destroy station defenses, close pirate base temporarily)
     - Reward: 15000cr + 50 Sol City rep, bounty hunting missions unlock
   - **Peace Path:** Defend peace conference at Freeport from extremists (both sides)
     - Reward: 12000cr + 40 rep at Freeport/Sol City/Hidden Cove

**Arc Outcome:** Fundamentally changes pirate activity in system, unlocks endgame content

---

### Arc 5: **The Union Crisis**
**Characters:** Multiple (focuses on Chief Harlan, Sana Whit, Rex Calder)  
**Conflict:** Workers' rights vs. corporate efficiency  
**Unlock:** Requires Union Membership + completion of 2 other arcs

#### Background
Union workers across the system are threatening to strike over pay and conditions. Chief Harlan is leading the movement, with support from Sana Whit and Rex Calder. Stations owned by corporations (Sol City, Aurum Fab, Ceres PP) want to break the union. This affects fabrication, prices, and station operations.

#### Missions
1. **"Organize the Stations"** - Rally mission
   - Accept from: Drydock (rep 40+)
   - Visit 5 stations, deliver union pamphlets (new trade good)
   - Timed: 15 minutes to visit all
   - Reward: 5000cr + 15 rep at all worker-aligned stations
   - Consequence: Corporate stations increase security (harder stealth)

2. **"Strike or Break"** - Major choice
   - **Union Path:** Support the strike by NOT trading at corporate stations for 10 real-time minutes
     - Reward: 8000cr + 30 rep at worker stations, -25 rep at corporate stations
     - Consequence: Corporate stations raise prices 20% for 8 minutes (simulating strike impact)
   - **Corporate Path:** Deliver strikebreakers (NPCs) to 3 corporate stations
     - Reward: 10000cr + 30 rep at corporate stations, -40 rep at worker stations
     - Consequence: Worker stations refuse fabrication for 5 minutes

3. **"The Negotiations"** - Finale (multi-stage)
   - Stage 1: Gather economic data from 6 stations
   - Stage 2: Deliver to neutral arbiter at Freeport
   - Stage 3: Choose final outcome:
     - **A:** Union wins - all stations pay +15% for labor but fabrication costs drop -10%
     - **B:** Corporate wins - fabrication costs stay same, worker stations lose upgrades for 10 minutes
     - **C:** Compromise - small benefits for both, +20 rep at ALL stations

**Arc Outcome:** Permanently shifts economy balance, affects all future fabrication costs

---

## New Mechanics

### 1. Weapon System

#### Ship Weapons (Base stats)
Every ship has a weapon slot with upgradeable stats:

```typescript
type ShipWeapon = {
  kind: 'laser' | 'plasma' | 'railgun' | 'missile';
  damage: number; // base damage per shot
  fireRate: number; // shots per second
  range: number; // effective range in world units
  projectileSpeed: number; // for leading targets
  energyCost: number; // energy per shot (limits sustained fire)
};
```

#### Weapon Types (Available at Drydock)
1. **Laser Cannon** (Starter)
   - Damage: 10, Fire Rate: 2/sec, Range: 800, Speed: instant (hitscan)
   - Cost: Free (default)
   - Good for: Beginners, guaranteed hits at range

2. **Plasma Burster** (Upgrade 1)
   - Damage: 25, Fire Rate: 1/sec, Range: 600, Speed: 300
   - Cost: 8000cr
   - Good for: Close combat, high damage

3. **Railgun** (Upgrade 2)
   - Damage: 50, Fire Rate: 0.5/sec, Range: 1200, Speed: 800
   - Cost: 15000cr
   - Good for: Sniping, long-range combat

4. **Missile Launcher** (Upgrade 3)
   - Damage: 75, Fire Rate: 0.33/sec, Range: 1000, Speed: 200 (tracking)
   - Cost: 25000cr + requires Market Intel upgrade
   - Good for: Tracking targets, guaranteed hits (slower)

#### Weapon Upgrade Stats (at Drydock)
- **Damage:** +10 per tier, max 5 tiers, 3000cr each
- **Fire Rate:** +0.2/sec per tier, max 3 tiers, 4000cr each
- **Range:** +100 per tier, max 3 tiers, 2000cr each

#### Combat Mechanics
- **Energy System:** Ships have energy pool (100) that regenerates 10/sec
- **Firing:** Spacebar fires weapon (when not in UI), costs energy
- **Damage:** Hits reduce target NPC HP (100 base)
- **Destruction:** NPC drops 50% of cargo, becomes debris (collectible ore)
- **Reputation Hit:** Destroying non-pirate NPCs: -10 rep at their faction stations
- **Wanted Level:** Too many attacks = bounty hunters spawn (new aggressive NPCs)

### 2. Mission Types

#### A. Standard Delivery
- Already exists (contracts)
- Enhanced with story context

#### B. Smuggling
- Avoid detection zones (spheres around stations)
- If detected: mission fails, wanted level +1
- Higher rewards than standard delivery

#### C. Combat - Destroy Targets
- Destroy X NPC traders/pirates
- Timed or patrol-based
- Drop cargo/rewards on destruction

#### D. Combat - Escort/Defend
- Protect NPC(s) from pirate waves
- Fail if escort HP drops to 0
- Waves spawn every 30 seconds

#### E. Stealth/Infiltration
- Dock at station, wait without trading, undock
- Must not trigger "suspicious" timer (30 sec idle triggers alert)
- Alternative: Hack station data (mini-game: timed button sequence)

#### F. Collection
- Gather X of commodity from Y sources
- Sources can be: stations, asteroid belts, destroyed NPCs
- Timed for urgency

#### G. Blockade/Siege
- Destroy station defenses (turrets - new entities)
- Turrets are stationary, high HP, auto-fire at player
- Requires multiple passes and repair stops

### 3. Faction & Reputation System Enhancements

#### Reputation Levels (Expanded)
- **-100 to -50:** Hostile - Station refuses docking, spawns defenders
- **-49 to -1:** Unfriendly - High prices (+50%), no contracts
- **0 to 29:** Neutral - Normal prices, basic contracts
- **30 to 69:** Friendly - Price discounts (existing system), better contracts
- **70 to 100:** Allied - Max discounts, exclusive missions, escort support

#### Faction Alignment
Stations belong to factions:
- **Sol Government:** Sol City, Sol Refinery (Helios)
- **Independent Workers:** Greenfields, Drydock, Freeport
- **Corporate:** Aurum Fab, Ceres Power Plant
- **Pirate:** Hidden Cove

**Faction Rep Propagation:**
- Actions at one station affect other stations in same faction (+50% of rep change)
- E.g., +20 rep at Sol City = +10 rep at Sol Refinery

### 4. Mission State Tracking

#### New GameState Properties
```typescript
type MissionArc = {
  id: string; // 'greenfields_independence', 'fabrication_wars', etc.
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  currentStage: number; // which mission in the arc (1-4)
  choicesMade: Record<string, string>; // 'stage_2_choice': 'side_greenfields'
  completedMissions: string[]; // mission IDs completed
  reputation: Record<string, number>; // station rep changes from this arc
};

type Mission = {
  id: string;
  arcId: string; // which arc this belongs to
  title: string;
  description: string;
  type: 'delivery' | 'combat' | 'stealth' | 'choice' | 'collection';
  objectives: MissionObjective[];
  rewards: MissionReward;
  requiredRep?: Record<string, number>; // stationId -> min rep
  expiresAt?: number;
  status: 'offered' | 'active' | 'completed' | 'failed' | 'cancelled';
};

type MissionObjective = {
  id: string;
  type: 'destroy' | 'deliver' | 'collect' | 'visit' | 'defend' | 'wait';
  target?: string; // commodityId, npcId, stationId
  quantity?: number;
  current?: number;
  completed: boolean;
};

type MissionReward = {
  credits: number;
  reputationChanges: Record<string, number>; // stationId -> rep delta
  unlocks?: string[]; // mission IDs, upgrades, etc.
  permanentEffects?: string[]; // 'fuel_prices_reduced', 'greenfields_independent'
};
```

---

## Technical Implementation Plan

### Phase 1: Combat Foundation (Week 1)
**Files to Create:**
- `src/domain/types/combat_types.ts` - Weapon, projectile, combat state types
- `src/domain/constants/weapon_constants.ts` - Weapon base stats
- `src/systems/combat/weapon_systems.ts` - Damage calculation, projectile physics
- `src/systems/combat/ai_combat.ts` - NPC combat behavior (attack, evade)

**Files to Modify:**
- `src/domain/types/world_types.ts` - Add weapon to Ship type, HP to NpcTrader
- `src/state/store.ts` - Add fireWeapon(), updateCombat() actions
- `src/scene/scene_root.tsx` - Handle spacebar for firing, projectile rendering

**Tasks:**
1. Add weapon stats to Ship in world_types.ts
2. Create weapon constants (4 weapon types, base stats)
3. Implement fireWeapon() action (spawn projectile, consume energy)
4. Create projectile entity type with velocity, damage, lifetime
5. Update tick() to move projectiles, check collisions
6. Add HP to NpcTrader, destruction logic
7. Render projectiles in R3F (line segments or small meshes)
8. Add weapon purchase/upgrade to market_panel.tsx
9. Test: Fire weapon, destroy NPC, collect dropped cargo

### Phase 2: Mission Arc System (Week 2)
**Files to Create:**
- `src/domain/types/mission_types.ts` - Mission, MissionArc, MissionObjective types
- `src/domain/constants/mission_constants.ts` - Arc definitions, mission templates
- `src/systems/missions/mission_generator.ts` - Generate missions from templates
- `src/systems/missions/mission_validator.ts` - Check completion, validate objectives
- `src/state/helpers/mission_helpers.ts` - Mission progression, unlocking logic

**Files to Modify:**
- `src/domain/types/world_types.ts` - Add GameState.missionArcs, GameState.missions
- `src/state/store.ts` - Add acceptMission(), checkMissionProgress(), completeMission()
- `src/ui/market_panel.tsx` - Add Missions tab, display available missions

**Tasks:**
1. Define MissionArc, Mission, MissionObjective types
2. Create mission constant templates for all 5 arcs (stage 1 missions only)
3. Implement mission generation (based on rep, arc progress)
4. Add missions array to GameState
5. Create acceptMission() - move mission to active, create objectives
6. Create checkMissionProgress() - called in tick(), sell(), combat events
7. Create completeMission() - apply rewards, unlock next stage
8. Build Missions UI panel (list available, active, completed)
9. Test: Accept mission, complete objective, receive reward

### Phase 3: Mission Types - Delivery & Combat (Week 3)
**Files to Modify:**
- `src/systems/missions/mission_validator.ts` - Add delivery, combat objective validation
- `src/state/store.ts` - Hook sell() to check delivery objectives, hook combat to check destroy objectives
- `src/systems/combat/ai_combat.ts` - Add mission-specific NPC spawning (targets, escorts)

**Tasks:**
1. Implement delivery objective validation (sell commodity at target station)
2. Implement combat objective validation (destroy specific NPCs)
3. Create spawnMissionNPCs() - spawn combat targets with HP, AI behavior
4. Add mission markers in scene (highlight target NPCs, stations)
5. Create mission HUD display (objectives, progress)
6. Test Arc 1 Stage 1 (Breaking the Chain - smuggling delivery)
7. Test Arc 2 Stage 3 (Sabotage - destroy 5 NPCs)

### Phase 4: Advanced Mission Types (Week 4)
**Files to Create:**
- `src/systems/missions/stealth_system.ts` - Detection zones, stealth validation
- `src/systems/missions/escort_system.ts` - Escort HP, wave spawning

**Files to Modify:**
- `src/systems/missions/mission_validator.ts` - Add stealth, escort, collection validation
- `src/state/store.ts` - Add stealthCheck() to tick(), escort HP tracking

**Tasks:**
1. Implement stealth detection zones (spheres around stations)
2. Add detection check in tick() when mission is active stealth type
3. Implement escort/defend missions (protect NPC from waves)
4. Add wave spawning system (every 30 sec, spawn 2-3 pirates)
5. Implement collection missions (gather from multiple sources)
6. Test Arc 3 Stage 1 (Audit Trail - stealth mission)
7. Test Arc 4 Path B Stage 3 (Enforce Law - destroy pirates)

### Phase 5: Choice System & Branching (Week 5)
**Files to Create:**
- `src/systems/missions/choice_system.ts` - Handle choice missions, branching paths
- `src/ui/components/mission_choice_dialog.tsx` - Dialog UI for choice missions

**Files to Modify:**
- `src/domain/types/mission_types.ts` - Add choice-specific mission properties
- `src/state/helpers/mission_helpers.ts` - Track choices, unlock appropriate next missions
- `src/state/store.ts` - Add makeMissionChoice() action

**Tasks:**
1. Define choice mission structure (multiple outcomes per mission)
2. Create makeMissionChoice() - records choice, activates chosen path
3. Build choice dialog UI (present options, consequences)
4. Implement arc branching (choice determines next mission)
5. Track permanent effects from choices (price changes, station closures)
6. Apply permanent effects to economy/stations
7. Test Arc 1 Stage 2 (Census - choice between Greenfields/Sol City)
8. Test Arc 4 Stage 2 (Choose Your Side - three-way choice)

### Phase 6: Faction System & Propagation (Week 6)
**Files to Create:**
- `src/domain/constants/faction_constants.ts` - Faction definitions, station assignments
- `src/systems/reputation/faction_system.ts` - Faction rep calculation, propagation

**Files to Modify:**
- `src/state/helpers/reputation_helpers.ts` - Add faction rep propagation
- `src/state/store.ts` - Apply faction rep changes on all rep-affecting actions
- `src/ui/market_panel.tsx` - Display faction standing alongside station rep

**Tasks:**
1. Define factions (Sol Government, Workers, Corporate, Pirate)
2. Assign stations to factions
3. Implement faction rep propagation (+50% of station rep change to faction)
4. Add faction standing display in UI
5. Implement hostile state (station refuses docking at rep < -50)
6. Add station defense NPCs (spawn when player approaches if hostile)
7. Test: Attack Sol City convoy, see rep drop at Sol City + Sol Refinery
8. Test: Reach hostile status, get attacked on approach

### Phase 7: Arc Content Creation (Week 7-8)
**Files to Modify:**
- `src/domain/constants/mission_constants.ts` - Add all missions for all 5 arcs (stages 2-4)
- `src/state/world/seed.ts` - Add arc-specific dialogue to station personas

**Tasks:**
1. Write all mission data for Arc 1 (Greenfields Independence) stages 2-4
2. Write all mission data for Arc 2 (Fabrication Wars) stages 2-4
3. Write all mission data for Arc 3 (Energy Monopoly) stages 2-4
4. Write all mission data for Arc 4 (Pirate Accords) stages 2-4
5. Write all mission data for Arc 5 (Union Crisis) stages 2-3
6. Add mission-specific dialogue lines to station personas
7. Create mission completion celebration variations (different per arc)
8. Test each arc end-to-end

### Phase 8: Polish & Balance (Week 9)
**Tasks:**
1. Balance mission rewards (credits, rep)
2. Balance weapon damage, NPC HP
3. Balance mission timers (completion times)
4. Add mission fail states (timer expires, objective fails)
5. Add mission abandon penalty (rep loss)
6. Add mission markers in minimap
7. Add combat sound effects (weapon fire, explosions)
8. Add mission notification system (objective complete, new mission available)
9. Playtest all arcs for difficulty curve
10. Bug fixes and edge cases

### Phase 9: Advanced Features (Week 10 - Optional)
**Potential Additions:**
1. **Bounty Hunting:** Dynamic missions to hunt player-hostile NPCs
2. **Station Turrets:** Stationary defenses for siege missions
3. **Wanted System:** Escalating bounty hunters if player commits crimes
4. **Black Market:** Hidden Cove exclusive trades (stolen goods, illegal upgrades)
5. **Dynamic Events:** Random mission triggers based on economy state
6. **Multi-stage Battles:** Large fleet combat with multiple waves
7. **Alliance Benefits:** Permanent bonuses for completing arcs (escort fleets, station discounts)

---

## UI/UX Considerations

### Mission Panel (new tab in market_panel.tsx)
**Sections:**
1. **Active Missions:** Current mission with objectives, timer, progress bar
2. **Available Missions:** List of missions at current station (filtered by rep)
3. **Completed Missions:** History (for reference, flavor text)
4. **Mission Details:** Expanded view with full description, rewards, warnings

### Mission HUD (overlay in scene_root.tsx)
**Elements:**
1. **Objective Tracker:** Top-left corner, current objective + progress (e.g., "Destroy Traders: 2/5")
2. **Timer:** Top-center, countdown for timed missions
3. **Mission Markers:** 3D markers pointing to target stations/NPCs
4. **Warning Indicators:** "DETECTED" flash for stealth missions, "ESCORT HP: 45%" for escorts

### Combat HUD
**Elements:**
1. **Energy Bar:** Bottom-left, shows weapon energy (100%)
2. **Crosshair:** Center screen, changes color on target lock
3. **Target HP:** Above target NPC when aimed at (health bar)
4. **Wanted Level:** Stars (1-5) in top-right if player has bounty

### Choice Dialog
**Design:**
- Modal overlay when choice mission accepted
- 2-3 option buttons with clear consequences
- "This choice is permanent" warning
- Preview of reputation changes

---

## Balancing Guidelines

### Mission Rewards
- **Stage 1:** 2000-5000cr, 10-15 rep
- **Stage 2:** 4000-8000cr, 15-25 rep
- **Stage 3:** 6000-10000cr, 20-30 rep
- **Stage 4:** 10000-20000cr, 30-50 rep

### Combat Balance
- **Player starting HP:** 100
- **NPC trader HP:** 50-80 (easy targets)
- **NPC pirate HP:** 100-150 (medium targets)
- **NPC bounty hunter HP:** 150-200 (hard targets)
- **Station turret HP:** 300-500 (very hard)

### Weapon DPS
- **Laser:** 20 DPS (beginner-friendly)
- **Plasma:** 25 DPS (close range)
- **Railgun:** 25 DPS (long range)
- **Missile:** 25 DPS (tracking, forgiving)

### Mission Timers
- **Delivery:** 10-15 minutes (no timer unless rush)
- **Combat:** 5-10 minutes (find and destroy targets)
- **Stealth:** No timer (but detection fails mission)
- **Escort:** Duration until destination reached (3-8 minutes)
- **Collection:** 10-15 minutes (gather resources)

---

## Narrative Design: Character Motivations

### Sana Whit (Greenfields)
**Motivation:** Protect farmer independence, resist corporate control  
**Arc Role:** Protagonist in Arc 1, supporter in Arc 5  
**Voice:** Warm but fierce, uses agricultural metaphors

### Mira Vale (Sol City)
**Motivation:** Maintain order and stability, even if heavy-handed  
**Arc Role:** Antagonist in Arc 1, law-and-order rep in Arc 4  
**Voice:** Polished, bureaucratic, subtly condescending

### Dr. Elin Kade (Aurum Fab)
**Motivation:** Scientific progress through efficiency and centralization  
**Arc Role:** Competitor in Arc 2, corporate side in Arc 5  
**Voice:** Precise, technical, emotionally detached

### Chief Harlan (Drydock)
**Motivation:** Workers' rights, fair pay, autonomy  
**Arc Role:** Competitor in Arc 2, leader in Arc 5  
**Voice:** Gruff, straightforward, loyal

### Rex Calder (Sol Refinery)
**Motivation:** Keep fuel flowing, protect refinery workers  
**Arc Role:** Victim in Arc 3, supporter in Arc 5  
**Voice:** Practical, no-nonsense, suspicious of fancy words

### Ivo Renn (Ceres Power Plant)
**Motivation:** Maximize grid efficiency, profit from scarcity  
**Arc Role:** Antagonist in Arc 3, corporate side in Arc 5  
**Voice:** Dry humor, data-driven, subtly manipulative

### Kalla Rook (Freeport)
**Motivation:** Free trade, no questions asked, profit from chaos  
**Arc Role:** Neutral broker in Arc 4, mediator throughout  
**Voice:** Streetwise, charming, slight rogue

### Vex Marrow (Hidden Cove)
**Motivation:** Freedom from government control, "liberation" of goods  
**Arc Role:** Pirate leader in Arc 4, wildcard in others  
**Voice:** Dangerous wit, disarming charm, underlying threat

---

## Lore Integration

### System Background (Player discovers through missions)
- System was originally corporate-owned (Aurum Mining Corporation)
- Workers revolted 50 years ago, established stations
- Sol City formed as government compromise
- Hidden Cove founded by exiled revolutionaries
- Current tension: Old corporate interests (Aurum Fab, Ceres PP) vs. workers (Drydock, Greenfields)
- Player enters during period of rising conflict

### Mission Arc Consequences
- Arcs can be completed in any order (except Arc 5 requires 2 others)
- Choices in one arc affect NPC dialogue in others
- Final state of system depends on player choices across all arcs
- Multiple endings possible based on faction alignment

---

## Future Expansion Ideas

### Arc 6: **The Corporate Takeover** (DLC/Update)
- Mega-corp attempts to buy out all stations
- Multi-arc conclusion based on previous choices
- Final battle or negotiation determines system future

### Arc 7: **The Discovery** (DLC/Update)
- Alien artifact found in outer belt
- Stations compete for control
- Unlocks new tech, new station type

### Multiplayer Considerations (Far Future)
- Player choices in missions affect shared universe state
- PvP combat with weapon system
- Co-op mission arcs (2-4 players)
- Faction wars (player factions)

---

## Conclusion

This mission system adds 20+ hours of story content, meaningful choices, and combat gameplay while preserving the core trading sim mechanics. The modular arc design allows for iterative implementation and expansion. Each arc can be developed and tested independently, with shared systems (combat, missions) built first.

**Estimated Development Time:** 9-10 weeks for core content, additional time for polish and expansion arcs.

**Next Steps:**
1. Review and approve arc concepts
2. Begin Phase 1 (Combat Foundation)
3. Prototype first mission from Arc 1
4. Iterate based on gameplay feel

