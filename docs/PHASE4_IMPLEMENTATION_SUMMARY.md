# Phase 4 Implementation Summary: Advanced Mission Types

## Overview
Phase 4 of the Mission System has been successfully implemented, adding proper stealth mechanics and escort/defend mission support as outlined in the Mission System Design document.

## What Was Removed
The hardcoded stealth detection logic (lines 534-636 in `store.ts`) that was implemented for testing has been removed and replaced with a proper, modular system.

## New Files Created

### 1. `src/systems/missions/stealth_system.ts`
Complete stealth detection system with:
- **Detection zones**: Configurable radius around stations (default: 5 * SCALE)
- **Suspicion system**: Gradual build-up when in detection zone, decay when outside
- **Detection thresholds**: Triggers mission failure when suspicion reaches 100
- **Mission-specific logic**: Different detection rules per mission type
- **Consequence handling**: Confiscate contraband, apply reputation penalties
- **State cleanup**: Proper cleanup when missions complete/fail

Key Functions:
- `processStealthChecks()` - Main tick update for all active stealth missions
- `applyDetectionConsequences()` - Handle confiscation and penalties
- `shouldDetectShip()` - Mission-specific detection logic
- `updateSuspicionLevel()` - Gradual suspicion build/decay

### 2. `src/systems/missions/escort_system.ts`
Complete escort mission system with:
- **Escort NPC tracking**: HP, destination, wave timing
- **Wave spawning**: Automatic pirate waves every 30 seconds
- **Destination detection**: Checks when escort reaches target station
- **Pirate generation**: Spawns 2-3 hostile pirates per wave
- **State management**: Tracks all active escort missions

Key Functions:
- `createEscortNpc()` - Spawn mission escort at start station
- `updateEscortState()` - Process escort progress and wave timing
- `generatePirateWave()` - Spawn hostile pirates around escort
- `hasEscortReachedDestination()` - Check arrival at target

## Modified Files

### 1. `src/domain/types/world_types.ts`
**NpcTrader Type Updates:**
- Added `isMissionEscort?: boolean` - Marks NPCs spawned for defend missions
- Added `isAggressive?: boolean` - For hostile NPCs that attack on sight
- Made `commodityId` optional - Not all NPCs trade commodities (escorts, pirates)
- Made `speed` optional - Defaults provided in movement logic

**GameState Type Updates:**
- Added `stealthStates: Map<string, StealthState>` - Tracks suspicion per mission/station
- Added `escortStates: Map<string, EscortMissionState>` - Tracks escort mission progress

### 2. `src/state/store.ts`
**Imports:**
- Added stealth system functions
- Added escort system functions

**Initial State:**
- Initialize `stealthStates: new Map()`
- Initialize `escortStates: new Map()`

**tick() Function:**
- Removed hardcoded stealth detection (lines 534-636)
- Added proper stealth system integration via `processStealthChecks()`
- Added escort mission system with wave spawning
- Added mission escort NPC movement logic (follows path to destination)
- Cleanup mission states on completion/failure

**acceptMission() Function:**
- Added escort NPC spawning for missions with `type: 'escort'`
- Creates escort state tracking
- Plans path from start to destination station

**abandonMission() Function:**
- Cleanup stealth and escort states
- Remove mission NPCs (escorts and spawned pirates)

**NPC Movement Logic:**
- Added dedicated movement code for mission escorts
- Fixed optional `speed` and `commodityId` handling
- Ensured mission escorts follow paths, not player

## How It Works

### Stealth Missions (e.g., Arc 3 Stage 1: "The Audit Trail")

1. **Mission Start**: Player accepts stealth mission with `avoid_detection` objective
2. **During Mission**:
   - Every tick, `processStealthChecks()` runs for all active stealth missions
   - If player is in detection zone AND carrying contraband: suspicion builds
   - If player leaves zone or drops contraband: suspicion decays
   - When suspicion reaches 100: detection triggered
3. **Detection Consequences**:
   - Mission fails immediately
   - Contraband confiscated (e.g., luxury goods)
   - Reputation penalty at detecting station (-15 rep)
   - Mission marked as `failed`
   - Stealth state cleaned up
4. **Success Path**:
   - Complete all other objectives without detection
   - Mission completes normally

### Escort Missions (Future Use)

1. **Mission Start**: Player accepts escort mission with `type: 'escort'` and `defend` objective
2. **Escort Spawned**:
   - NPC escort spawns at start station
   - Path planned to destination station
   - Escort state tracking initialized
3. **During Mission**:
   - Escort follows path towards destination
   - Every 30 seconds: pirate wave spawns (2-3 pirates)
   - Pirates spawn in circle around escort
   - Escort HP tracked, mission fails if escort destroyed
4. **Mission Complete**:
   - Escort reaches destination (within 6 * SCALE distance)
   - `escort_reached_destination` event triggers
   - Mission completes, rewards applied
   - Escort state cleaned up

### Wave Spawning Details
- **Interval**: 30 seconds between waves
- **Count**: 2-3 pirates per wave
- **Spawn Location**: Circle around escort at 15 * SCALE radius
- **Pirate Stats**: 100 HP, hostile, marked as mission targets
- **Tracking**: All spawned pirate IDs tracked in escort state

## Integration with Existing Systems

### Combat System
- Pirate waves are hostile NPCs that attack player and escort
- Use existing combat AI and weapon systems
- Pirates are marked with `isMissionTarget` and `missionId`

### Mission Validator
- Stealth missions use `avoid_detection` objectives
- Escort missions use `defend` objectives
- Detection and escort completion handled via `MissionEvent` types

### NPC System
- Mission escorts follow paths like regular traders
- Separate movement logic from contract escorts (player followers)
- Proper cleanup when missions end

## Testing Notes

### Stealth Mission (Arc 3 Stage 1)
Mission ID: `energy_monopoly_stage_1`  
Requirements: Navigation Array, Rep 30 at Sol Refinery

**Test Steps:**
1. Accept mission at Sol Refinery
2. Dock at Ceres Power Plant
3. Wait 30 seconds (wait objective)
4. Return to Sol Refinery
5. Should NOT be detected (stealth missions don't have detection during dock)

### Smuggling Mission (Arc 1 Stage 1)
Mission ID: `greenfields_stage_1`  
Requirements: Rep 0 at Greenfields

**Test Steps:**
1. Accept mission at Greenfields
2. Buy 10 Luxury Goods from any station
3. Fly towards Greenfields
4. AVOID Sol City (stay > 5 * SCALE away while carrying luxury goods)
5. Deliver to Greenfields
6. If detected near Sol City: contraband confiscated, mission fails

### Escort Mission (Not Yet in Mission Constants)
Would need to add an escort mission template to test wave spawning.

## Mission Templates Ready for Testing

Current mission templates that use Phase 4 features:
1. ✅ `greenfields_stage_1` - Smuggling with stealth detection
2. ✅ `energy_monopoly_stage_1` - Pure stealth mission
3. ✅ `fabrication_wars_aurum_stage_1` - Stealth infiltration
4. ⏸️ Escort missions - Template would need to be added

## Configuration Constants

### Stealth System
```typescript
DETECTION_RADIUS = 5 * SCALE;          // Detection zone size
DETECTION_THRESHOLD = 100;             // Suspicion level to trigger
SUSPICION_BUILD_RATE = 10;             // Per second in zone
SUSPICION_DECAY_RATE = 20;             // Per second out of zone
```

### Escort System
```typescript
ESCORT_HP = 100;                       // Escort base HP
DESTINATION_REACH_DISTANCE = 6 * SCALE; // Arrival threshold
WAVE_SPAWN_INTERVAL = 30;              // Seconds between waves
ENEMIES_PER_WAVE_MIN = 2;              // Min pirates per wave
ENEMIES_PER_WAVE_MAX = 3;              // Max pirates per wave
WAVE_SPAWN_DISTANCE = 15 * SCALE;      // Spawn radius around escort
```

## Next Steps (Phase 5)

Phase 4 is complete. Next phase would be:
- Choice system & branching missions
- Mission choice dialog UI
- Arc branching based on player choices
- Permanent effects from choices

## Known Limitations

1. **Stealth Detection Logic**: Currently only checks for specific contraband items per mission. Could be expanded to:
   - Speed-based detection (moving too fast)
   - Time-based detection (lingering too long)
   - Weapon fire detection

2. **Escort AI**: Mission escorts follow paths but don't actively defend themselves or evade attacks. Could be improved with:
   - Evasive maneuvers
   - Return fire at attackers
   - Formation flying with player support

3. **Wave Difficulty**: All waves spawn with same difficulty. Could be improved with:
   - Escalating difficulty per wave
   - Boss waves every N waves
   - Wave composition based on player level

## Success Criteria

✅ Stealth detection zones implemented  
✅ Suspicion system with gradual build/decay  
✅ Mission-specific detection logic  
✅ Escort NPC spawning and tracking  
✅ Wave spawning system (30 sec intervals)  
✅ Pirate wave generation (2-3 per wave)  
✅ Escort destination detection  
✅ Proper state cleanup on mission end  
✅ No linting errors  
✅ Proper type safety maintained  

## Conclusion

Phase 4 is fully implemented and ready for testing. The stealth system provides a robust, extensible framework for detection-based missions, and the escort system provides the foundation for defend missions with dynamic combat encounters. All systems are properly integrated with existing combat, mission, and NPC systems.

