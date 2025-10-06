# Trader - Manual Testing Plan
## Comprehensive Test Suite for Phases 4-7

This document provides a prioritized testing plan for human testers to validate the mission system, faction reputation, combat, and narrative content.

---

## 🔴 CRITICAL PATH TESTS (Priority 1)
These tests validate core functionality that must work for the game to be playable.

### CP-1: Basic Mission Acceptance & Completion
**Prerequisites:** Start new game with Test Ship (Dev)

**Steps:**
1. Launch game, select "Test Ship (Dev)" at startup
2. Press `E` to dock at Sol City
3. Open Market Panel → Story Missions tab
4. Find "Breaking the Chain" mission (Arc 1, Stage 1)
5. Click "ACCEPT MISSION"
6. Verify mission appears in Journal Panel → Missions tab
7. Press `Q` to undock
8. Navigate to Greenfields
9. Dock at Greenfields (`E` near station)
10. Open Market → Buy tab, buy 10 Luxury Goods
11. Undock, navigate back to Greenfields
12. Open Market → Sell tab, sell 10 Luxury Goods
13. Mission should complete automatically

**Expected Results:**
- Mission accepts without errors
- Objectives appear in Journal
- Mission tracks progress correctly
- Mission completes when objectives met
- Rewards applied: credits, reputation
- Mission marked as completed in arc tracker

**Pass/Fail:** ____________

---

### CP-2: Choice Mission Flow
**Prerequisites:** Complete Arc 1 Stage 1, have 10+ rep at Greenfields

**Steps:**
1. Dock at Greenfields or Sol City
2. Open Market → Story Missions
3. Find "The Census" (Arc 1 Stage 2)
4. Click "CHOOSE PATH" button
5. Choice dialog should open
6. Review both choice options
7. Click "Side with Greenfields"
8. Click "Choose Path →" button
9. Confirmation screen appears
10. Click "Confirm Decision"
11. Dialog closes

**Expected Results:**
- "CHOOSE PATH" button appears (not "ACCEPT MISSION")
- Dialog opens with beautiful styling
- Both choices show rewards and consequences clearly
- Confirmation step works (two-click safety)
- Mission completes on confirmation
- Credits awarded: +3000cr
- Reputation changes: +15 Greenfields, -10 Sol City
- Next mission unlocks (check Story Missions for "Supply Cut")

**Pass/Fail:** ____________

---

### CP-3: Faction Reputation Propagation
**Prerequisites:** Start with any ship

**Steps:**
1. Dock at Sol City
2. Note starting reputation at Sol City
3. Buy and sell goods 5 times (any commodity)
4. Note new reputation at Sol City (should increase)
5. Undock and dock at Sol Refinery
6. Open Market → Contracts tab
7. Check reputation at Sol Refinery
8. Compare to Sol City reputation

**Expected Results:**
- Trading at Sol City increases reputation at Sol City
- Sol Refinery reputation also increases (50% of Sol City gain)
- Both stations belong to "Sol Government" faction
- Reputation propagates automatically
- Faction standing displayed in Contracts tab

**Pass/Fail:** ____________

---

### CP-4: Combat System - Basic Engagement
**Prerequisites:** Test Ship (has weapons equipped)

**Steps:**
1. Undock from any station
2. Wait for NPC trader to spawn (check minimap)
3. Approach NPC trader
4. Press and hold Left Mouse Button to fire weapons
5. Continue firing until NPC is destroyed
6. Check reputation at NPC's home station
7. Check cargo bay for loot drops

**Expected Results:**
- Weapon fires with visual/audio feedback
- Projectiles travel and hit NPC
- NPC health decreases with hits
- NPC explodes when health reaches 0
- Reputation decreases at NPC's station (-5 per hit, -15 on kill)
- Reputation propagates to faction members
- Cargo/credits may drop from destroyed NPC

**Pass/Fail:** ____________

---

## 🟠 HIGH PRIORITY TESTS (Priority 2)
These tests validate important features that significantly impact gameplay.

### HP-1: Hostile Faction State - Docking Prevention
**Prerequisites:** Start with any ship, combat enabled

**Steps:**
1. Dock at Sol City
2. Undock
3. Find Sol City NPC traders (blue icons on minimap)
4. Destroy 3-4 Sol City traders
5. Check reputation (Market → Contracts tab)
6. When reputation drops below -50:
   - Try to dock at Sol City (`E` near station)
   - Try to dock at Sol Refinery (`E` near station)

**Expected Results:**
- Reputation decreases with each kill (-15 per kill)
- Reputation propagates to Sol Refinery (-7.5 per kill)
- Both Sol City and Sol Refinery become "Hostile" (< -50 rep)
- Cannot dock at either station
- Console message: "Station refuses docking: reputation too low"
- Hostile status shown in UI with red indicators

**Pass/Fail:** ____________

---

### HP-2: Hostile Faction State - Defender Spawning
**Prerequisites:** Continue from HP-1 (hostile at Sol Government faction)

**Steps:**
1. Navigate towards Sol City from distance
2. Approach within 300 units (watch distance on HUD)
3. Observe space around Sol City
4. Check for new hostile NPCs spawning
5. Observe defender behavior

**Expected Results:**
- 2 defenders spawn when player enters 300-unit radius
- Defenders are Clipper ships (fast, aggressive)
- Defenders patrol around Sol City
- Defenders attack player on sight
- Defenders have increased HP (200 HP, 2x normal)
- Defenders only spawn once (no repeated spawning)
- Same behavior occurs near Sol Refinery

**Pass/Fail:** ____________

---

### HP-3: Stealth Mission - Smuggling Detection
**Prerequisites:** Complete Arc 1 Stage 1, accept Stage 2

**Steps:**
1. Accept "Breaking the Chain" at Greenfields
2. Undock and dock at any station
3. Buy 10 Luxury Goods
4. Undock
5. Fly towards Sol City (DO NOT AVOID IT)
6. Approach within 5 * SCALE units of Sol City
7. Observe HUD for detection warnings
8. Wait 10 seconds in detection zone
9. Check mission status

**Expected Results:**
- Suspicion level builds when near Sol City with contraband
- HUD shows detection warning/meter
- At 100 suspicion: mission fails
- Luxury Goods confiscated from cargo
- Reputation penalty at Sol City (-15 rep)
- Mission marked as failed
- Can retry mission after waiting

**Pass/Fail:** ____________

---

### HP-4: Escort Mission - Wave Spawning
**Prerequisites:** Escort mission available (may need to add one)

**Steps:**
1. Accept escort mission with `type: 'escort'`
2. Observe escort NPC spawn at start station
3. Undock
4. Wait 30 seconds
5. Observe pirate wave spawn
6. Wait another 30 seconds
7. Observe second wave

**Expected Results:**
- Escort NPC spawns immediately at mission start
- Escort follows path towards destination
- Pirates spawn in circular formation around escort
- 2-3 pirates per wave
- Pirates are hostile and aggressive
- Pirates attack player and escort
- Waves spawn every 30 seconds
- Mission fails if escort is destroyed
- Mission completes when escort reaches destination

**Pass/Fail:** ____________

---

### HP-5: Mission Timer - Time Limit Enforcement
**Prerequisites:** Reach Arc 2 Stage 2 (Fabrication Wars)

**Steps:**
1. Accept "Raw Materials Rush" (either Aurum or Drydock version)
2. Note time limit: 8 minutes
3. Undock
4. DO NOT complete objectives
5. Wait for timer to expire
6. Observe mission status

**Expected Results:**
- Timer displayed in Mission HUD
- Timer counts down from 8:00
- When timer reaches 0:00:
  - Mission fails automatically
  - Failure message appears
  - Mission marked as failed in Journal
  - Can retry mission later
- If completed before timer: mission succeeds

**Pass/Fail:** ____________

---

### HP-6: Multi-Objective Mission Tracking
**Prerequisites:** Reach Arc 1 Stage 4 (either path)

**Steps:**
1. Accept "Contract Enforcement" (Sol City path, Stage 4)
2. Observe objective list: deliver to 4 different stations
3. Complete objectives one at a time:
   - Dock at Greenfields, deliver 1 contract
   - Check Journal → objectives updated
   - Dock at Drydock, deliver 1 contract
   - Check Journal → objectives updated
4. Complete all 4 deliveries

**Expected Results:**
- All 4 objectives listed in Mission HUD and Journal
- Each objective tracks independently
- Completed objectives show ✓ checkmark
- Mission completes only when ALL objectives met
- Can complete in any order
- Progress persists between docking/undocking

**Pass/Fail:** ____________

---

### HP-7: Mission Abandonment - Reputation Penalty
**Prerequisites:** Any active mission

**Steps:**
1. Accept any mission
2. Open Journal → Missions tab
3. Click "Abandon" button on active mission
4. Confirm abandonment
5. Check reputation at mission's offering station

**Expected Results:**
- Abandon button available for active missions
- Confirmation dialog appears
- Mission removed from active missions
- Reputation penalty applied: -5 at offering station
- Reputation propagates to faction members
- Mission becomes available again later
- No partial credit for incomplete objectives

**Pass/Fail:** ____________

---

## 🟡 MEDIUM PRIORITY TESTS (Priority 3)
These tests validate additional features and edge cases.

### MP-1: Price Discounts/Penalties Based on Reputation
**Prerequisites:** Start with neutral reputation

**Steps:**
1. Dock at Greenfields (assume 0 reputation)
2. Open Market → Buy tab
3. Note price of Food Goods
4. Cancel and undock
5. Trade repeatedly at Greenfields to gain +50 reputation
6. Dock again
7. Check price of Food Goods (should be cheaper)
8. Now attack Greenfields traders until -25 reputation
9. Dock again
10. Check price of Food Goods (should be more expensive)

**Expected Results:**
- **Neutral rep (0)**: Base prices
- **Friendly rep (+30 to +69)**: 5-10% discount on purchases
- **Allied rep (+70+)**: ~10% discount on purchases
- **Unfriendly rep (-1 to -49)**: +25% markup on purchases, -25% on sales
- **Hostile rep (-50+)**: +50% markup (but cannot dock anyway)
- Sell prices also affected (premiums for positive, penalties for negative)

**Pass/Fail:** ____________

---

### MP-2: Contract System Integration
**Prerequisites:** Neutral reputation at any station

**Steps:**
1. Dock at Sol Refinery
2. Open Market → Contracts tab
3. Accept a standard contract (e.g., "Deliver 5 Fuel Cells to Sol City")
4. Navigate to source station
5. Buy required goods
6. Navigate to destination station
7. Sell goods
8. Check for bonus credits
9. Check reputation gain at destination

**Expected Results:**
- Contract appears in list with requirements
- Can accept contract
- Objective appears in Journal
- Contract bonus awarded on delivery
- Reputation gain at destination station
- Reputation propagates to faction members
- Contract removed from active list

**Pass/Fail:** ____________

---

### MP-3: Mission Celebration UI
**Prerequisites:** Complete any mission

**Steps:**
1. Accept any mission
2. Complete all objectives
3. Observe celebration overlay
4. Read rewards breakdown
5. Press Spacebar to dismiss
6. Verify rewards applied

**Expected Results:**
- Celebration overlay appears automatically
- Shows mission title and completion message
- Displays rewards: credits, reputation changes
- Shows bonus effects or unlocks
- Fireworks/particle effects (if implemented)
- Spacebar dismisses overlay
- Can dismiss by clicking outside
- Rewards actually applied to player account

**Pass/Fail:** ____________

---

### MP-4: Permanent Effects - Economic Changes
**Prerequisites:** Complete Arc 1 Stage 2 (The Census), sided with Greenfields

**Steps:**
1. After completing Arc 1 Stage 2 (Greenfields path)
2. Check permanent effects in GameState
3. Dock at Sol City
4. Open Market → Buy tab
5. Check price of Food Goods
6. Compare to base prices (if known)

**Expected Results:**
- Permanent effect: `sol_city_grain_spike` active
- Sol City food prices increased by +15%
- Effect persists between sessions
- Effect applies to all food commodities
- Other stations not affected (unless faction propagation applies)
- Effect visible in some UI indicator (if implemented)

**Pass/Fail:** ____________

---

### MP-5: Timed Effects - Expiration
**Prerequisites:** Complete mission with timed effect

**Steps:**
1. Complete "The Census" (Arc 1 Stage 2), side with Sol City
2. Check Greenfields stock immediately after
3. Note timestamp
4. Wait 2 real-time minutes
5. Check Greenfields stock again

**Expected Results:**
- Immediately after: Greenfields stock reduced by 30%
- After 2 minutes: stock returns to normal levels
- Timed effect tracked in GameState.timedEffects
- Effect automatically expires
- No manual intervention needed

**Pass/Fail:** ____________

---

### MP-6: Multiple Choice Paths - Arc Branching
**Prerequisites:** Complete Arc 4 Stage 1

**Steps:**
1. Complete "Diplomatic Pouch" (Arc 4 Stage 1)
2. Accept "Choose Your Side" (Arc 4 Stage 2)
3. Review all 3 choice options:
   - Join Pirates (Hidden Cove)
   - Enforce Law (Sol City)
   - Broker Peace (Freeport)
4. Select "Broker Peace"
5. Confirm choice
6. Check Story Missions tab

**Expected Results:**
- All 3 choices visible in dialog
- Each choice shows distinct rewards/consequences
- Selecting "Broker Peace" unlocks `pirate_accords_stage_3_peace`
- Other stage 3 missions (pirate/law paths) do NOT appear
- Reputation bonuses: +30 at Hidden Cove, Sol City, and Freeport
- Credits: +8000cr
- Pirate aggression permanently decreased by 50%

**Pass/Fail:** ____________

---

### MP-7: Mission Prerequisites - Reputation Gating
**Prerequisites:** Low reputation at multiple stations

**Steps:**
1. Start new game with standard ship
2. Dock at Sol Refinery
3. Open Market → Story Missions
4. Find "The Audit Trail" (Arc 3 Stage 1)
5. Note required reputation: 30 at Sol Refinery
6. Try to accept mission (should be disabled/greyed out)
7. Trade repeatedly at Sol Refinery
8. Gain +30 reputation
9. Try to accept mission again

**Expected Results:**
- Mission appears in list but is locked
- Button shows "Requires: 30 rep at Sol Refinery"
- Cannot accept mission with insufficient rep
- Once requirement met: button becomes active
- Can accept mission
- Mission properly checks all reputation requirements

**Pass/Fail:** ____________

---

### MP-8: NPC Combat AI - Aggression Levels
**Prerequisites:** Test Ship, hostile state at one faction

**Steps:**
1. Be hostile at Sol Government faction (< -50 rep)
2. Approach Sol City to spawn defenders
3. Observe defender behavior
4. Now approach Freeport (neutral station)
5. Observe normal NPC trader behavior

**Expected Results:**
- **Defenders** (hostile NPCs):
  - Attack player on sight
  - Aggressive pursuit
  - Fire weapons continuously
  - Do not flee
- **Normal traders** (neutral NPCs):
  - Follow trade routes
  - Do not attack unless attacked
  - May flee if damaged
  - Return fire if engaged

**Pass/Fail:** ____________

---

## 🟢 LOW PRIORITY TESTS (Priority 4)
These tests validate polish, edge cases, and less critical features.

### LP-1: Mission Chain - Full Arc Completion
**Prerequisites:** Fresh game start

**Steps:**
1. Complete entire Arc 1 (Greenfields path):
   - Stage 1: "Breaking the Chain"
   - Stage 2: "The Census" (side with Greenfields)
   - Stage 3: "Supply Cut"
   - Stage 4: "New Markets"
2. Verify each stage unlocks the next
3. Check final rewards and permanent effects

**Expected Results:**
- All 4 stages complete in order
- Each stage unlocks next automatically
- Final rewards: credits, high reputation at Greenfields
- Permanent effect: Greenfields independence (food prices -5%)
- Arc marked as complete in Journal
- Arc completion celebration (if implemented)
- Character reactions reference arc outcome in dialogue

**Pass/Fail:** ____________

---

### LP-2: Faction UI Display - All Factions
**Prerequisites:** Interact with multiple factions

**Steps:**
1. Dock at Sol City (Sol Government)
2. Open Market → Contracts tab
3. Note faction display (name, standing, color)
4. Repeat for each faction:
   - Sol Refinery (Sol Government)
   - Greenfields (Independent Workers)
   - Drydock (Independent Workers)
   - Aurum Fab (Corporate Alliance)
   - Ceres PP (Corporate Alliance)
   - Hidden Cove (Pirate Coalition)
   - Freeport (Independent Workers)

**Expected Results:**
- Faction name displayed with color coding:
  - Sol Government: Blue
  - Independent Workers: Green
  - Corporate Alliance: Purple
  - Pirate Coalition: Red
- Faction standing shown (Hostile/Unfriendly/Neutral/Friendly/Allied)
- Numeric faction reputation (average across faction stations)
- Tooltip shows faction description
- Color-coded border/background matches standing

**Pass/Fail:** ____________

---

### LP-3: Station Persona Dialogue - Arc References
**Prerequisites:** Complete some arc missions

**Steps:**
1. Complete Arc 1 Stage 2 (any path)
2. Dock at Sol City
3. Read Mira Vale's dialogue in dock intro
4. Look for references to Greenfields situation
5. Dock at Greenfields
6. Read Sana Whit's dialogue
7. Look for references to independence movement

**Expected Results:**
- Personas reference relevant arcs in dialogue
- Dialogue lines change based on arc progress (if implemented)
- Character voices consistent with established personality
- Dialogue hints at available missions
- 7+ mission-relevant lines per station persona

**Pass/Fail:** ____________

---

### LP-4: Cancel Actions - No State Changes
**Prerequisites:** Any mission available

**Steps:**
1. Open choice mission dialog
2. Select a choice
3. Do NOT confirm
4. Click Cancel or click outside dialog
5. Check mission status
6. Check reputation
7. Check credits

**Expected Results:**
- Dialog closes without changes
- Mission not accepted
- No rewards applied
- No reputation changes
- No permanent effects applied
- Can open dialog again
- Can select different choice next time

**Pass/Fail:** ____________

---

### LP-5: Loot Drops from Combat
**Prerequisites:** Empty cargo bay preferred

**Steps:**
1. Find NPC trader
2. Destroy NPC
3. Observe explosion
4. Check cargo bay for new items
5. Check credits for any gain

**Expected Results:**
- NPC drops loot on death (probabilistic)
- Loot may include:
  - Cargo (commodities NPC was carrying)
  - Credits (partial value of NPC cargo)
  - Equipment (rare chance)
- Loot auto-collected if player is nearby
- Visual indicator for loot drops (if implemented)

**Pass/Fail:** ____________

---

### LP-6: Mission Objective Variety - All Types
**Prerequisites:** Access to multiple arcs

**Test each objective type:**
- ✓ **Delivery**: Deliver X goods to Y station
- ✓ **Collection**: Buy X goods from Y station(s)
- ✓ **Combat**: Destroy X NPCs
- ✓ **Escort**: Defend NPC to destination
- ✓ **Wait**: Wait X seconds at location
- ✓ **Avoid Detection**: Stay undetected while carrying contraband
- ✓ **Mining**: Mine X ore from asteroid belt (if implemented)

**Expected Results:**
- Each objective type functions correctly
- Objective progress tracked accurately
- UI clearly shows objective requirements
- Completion triggers correctly
- Multiple objectives can combine in single mission

**Pass/Fail:** ____________

---

### LP-7: Tutorial Integration (If Enabled)
**Prerequisites:** Start new game with tutorial enabled

**Steps:**
1. Start new game
2. Follow tutorial prompts
3. Complete all tutorial steps:
   - dock_city
   - accept_mission
   - goto_refinery
   - buy_fuel
   - deliver_fuel
   - done
4. Verify tutorial advances automatically

**Expected Results:**
- Tutorial activates for new players
- Each step provides clear instruction
- Tutorial advances on correct actions
- Tutorial can be skipped (if option available)
- Tutorial missions different from regular missions
- Tutorial completion unlocks full game

**Pass/Fail:** ____________

---

### LP-8: Performance - Multiple Active Missions
**Prerequisites:** High reputation at multiple stations

**Steps:**
1. Accept 3-5 missions simultaneously
2. Have multiple missions active at once
3. Monitor performance (FPS, lag)
4. Complete one mission
5. Check if other missions still tracked correctly
6. Complete all missions

**Expected Results:**
- Multiple missions can be active simultaneously
- No performance degradation with multiple missions
- Each mission tracks independently
- Completing one doesn't affect others
- Mission HUD shows all active missions
- No conflicts or state corruption

**Pass/Fail:** ____________

---

## 🔧 EDGE CASE TESTS

### EC-1: Docked When Becoming Hostile
**Steps:**
1. Dock at Sol City with neutral reputation
2. While docked, use console/actions to reduce reputation to hostile level
3. Try to undock (`Q`)
4. Once undocked, try to redock (`E`)

**Expected Results:**
- Can undock from station even when hostile
- Cannot redock once undocked
- Defenders may spawn after undocking

**Pass/Fail:** ____________

---

### EC-2: Mission Escort Dies Early
**Steps:**
1. Accept escort mission
2. Let pirates spawn
3. Intentionally allow escort to be destroyed
4. Check mission status

**Expected Results:**
- Mission fails when escort dies
- Failure message displayed
- Mission marked as failed
- Can retry mission later
- Spawned pirates may persist or despawn

**Pass/Fail:** ____________

---

### EC-3: Double Faction Propagation Prevention
**Steps:**
1. Complete mission that rewards rep at multiple stations in same faction
2. Example: Mission gives +10 at Sol City AND +10 at Sol Refinery
3. Check final reputation values

**Expected Results:**
- Direct rewards applied (100%)
- Propagation does NOT double-apply
- Correct algorithm prevents cascading propagation
- Total reputation reasonable (not 150-200% inflated)

**Pass/Fail:** ____________

---

## 📊 Testing Notes

### General Guidelines
- **Test Ship (Dev)**: Use for quick access to all features
  - Max credits, max upgrades, no restrictions
  - Good for testing high-level content quickly

- **Standard Ship**: Use for realistic player experience
  - Tests progression systems
  - Validates economy balance
  - Better for full playthroughs

### Bug Reporting Template
When you find an issue, report:
```
Test ID: [e.g., HP-3]
Description: [What went wrong]
Steps to Reproduce: [Exact steps]
Expected: [What should happen]
Actual: [What actually happened]
Screenshots: [If applicable]
Console Errors: [Any errors in browser console]
```

### Performance Metrics to Watch
- **FPS**: Should maintain 60 FPS on modern hardware
- **Load times**: Docking/undocking should be instant
- **State updates**: UI should update immediately
- **Memory**: No memory leaks over extended play

### Known Limitations (Not Bugs)
1. **Timed effects processing**: Tracked but may not fully apply to economy yet
2. **Escort AI**: Basic pathfinding, doesn't defend itself
3. **Defender cleanup**: Hostile defenders don't despawn if reputation improves
4. **Closed stations**: Marked closed but may still be accessible

---

## ✅ Completion Checklist

**Phase 4 (Stealth & Escort):**
- [ ] CP-1: Basic mission completion
- [ ] HP-3: Stealth detection
- [ ] HP-4: Escort wave spawning
- [ ] HP-5: Timer enforcement

**Phase 5 (Choice System):**
- [ ] CP-2: Choice mission flow
- [ ] MP-6: Multi-path branching
- [ ] LP-4: Cancel safety
- [ ] MP-4: Permanent effects

**Phase 6 (Faction System):**
- [ ] CP-3: Faction propagation
- [ ] HP-1: Docking prevention (hostile)
- [ ] HP-2: Defender spawning
- [ ] MP-1: Price reputation modifiers
- [ ] LP-2: Faction UI display

**Phase 7 (Arc Content):**
- [ ] LP-1: Full arc completion
- [ ] LP-3: Persona dialogue
- [ ] HP-6: Multi-objective tracking
- [ ] LP-6: Objective variety

**Combat & Integration:**
- [ ] CP-4: Basic combat
- [ ] MP-8: NPC AI behavior
- [ ] LP-5: Loot drops

**General Systems:**
- [ ] HP-7: Mission abandonment
- [ ] MP-2: Contract integration
- [ ] MP-3: Celebration UI
- [ ] MP-7: Rep gating
- [ ] LP-8: Performance test

---

**Total Tests: 38**
- Critical: 4
- High Priority: 8
- Medium Priority: 8
- Low Priority: 8
- Edge Cases: 3
- Other: 7

**Estimated Testing Time:**
- Quick pass (Critical + High): ~2-3 hours
- Full pass (all tests): ~6-8 hours
- Complete arc playthroughs: +4-6 hours

---

Good hunting, pilot! 🚀
