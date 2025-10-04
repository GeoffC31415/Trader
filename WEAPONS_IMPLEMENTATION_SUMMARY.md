# Weapons System Implementation Summary

## ✅ Completed Features

### Core Combat System
- **4 Weapon Types** with unique stats:
  - **Laser Cannon** (starter): Fast fire rate, instant hit (hitscan), 10 damage
  - **Plasma Burster**: High damage, slower projectiles, 25 damage
  - **Railgun**: Long range sniper, 50 damage, fast projectiles
  - **Missile Launcher**: Tracking missiles (future), 75 damage, requires Market Intel
  
- **Weapon Upgrades** (available at Shipyard):
  - Damage: +10 per level (max 5 levels, 3000cr each)
  - Fire Rate: +0.2/sec per level (max 3 levels, 4000cr each)
  - Range: +100 per level (max 3 levels, 2000cr each)

### Combat Properties
- **Player Ship**:
  - HP: 100 (tracked, damage reduces HP)
  - Energy: 100 (regenerates at 10/sec when not docked)
  - Energy cost per shot (varies by weapon)
  - Fire rate limiting (can't spam fire)
  
- **NPC Traders**:
  - HP: 80 (can be destroyed)
  - Armed with basic laser weapons
  - **Fire back when attacked!** (aggressive for 30 seconds after being hit)
  - Lead targeting for moving players

### Projectile System
- Visual projectile rendering (colored by weapon type)
- Collision detection (sphere-based, 20 unit radius)
- Projectile lifetime and despawning
- Different visuals for player vs NPC projectiles (player brighter)

### Reputation & Consequences
- **Hit NPC**: -2 rep at their origin station
- **Kill NPC**: -10 rep at their origin station
- Attacking peaceful traders has economic consequences
- Pirates (isHostile: true) can be destroyed without penalty

### Integration
- **Input**: Spacebar to fire weapon
- **Energy HUD**: Energy bar displayed (needs UI implementation)
- **HP Display**: Ship HP tracked (needs UI implementation)
- **Weapon Selection**: Purchase at Shipyard (needs UI implementation)

## 📁 Files Created

### Domain Layer
- `src/domain/types/combat_types.ts` - Combat type definitions
- `src/domain/constants/weapon_constants.ts` - Weapon stats and constants

### Systems Layer
- `src/systems/combat/weapon_systems.ts` - Weapon mechanics, projectiles, damage
- `src/systems/combat/ai_combat.ts` - NPC combat AI, aggression, targeting

### Modified Files
- `src/domain/types/world_types.ts` - Added weapon, HP, energy to Ship & NpcTrader
- `src/state/store.ts` - Combat actions (fireWeapon, upgradeWeapon, purchaseWeapon), tick() combat logic
- `src/state/npc.ts` - Initialize NPC HP when spawning
- `src/scene/scene_root.tsx` - Spacebar input, projectile rendering

## 🎮 How to Use

### Player Controls
- **Spacebar**: Fire weapon at nearest NPC (or forward if no target)
- Energy regenerates automatically (10/sec)
- Can't fire while docked or if energy is insufficient

### Purchasing Weapons (at Shipyard)
```typescript
// From market_panel.tsx (needs UI implementation)
useGameStore.getState().purchaseWeapon('plasma', 8000);
useGameStore.getState().upgradeWeapon('damage', 3000);
```

### Combat Mechanics
1. **Fire at NPCs**: Press spacebar to shoot
2. **NPCs Retaliate**: Hit NPCs become aggressive and fire back for 30 seconds
3. **Destroy NPCs**: Reduce their HP to 0 (they disappear, drop cargo in future)
4. **Take Damage**: NPC projectiles hit you, reduce your HP
5. **Reputation Loss**: Attacking peaceful traders damages your reputation

## 🚀 Next Steps (Future Implementation)

### Immediate Needs (for full functionality)
1. **Combat HUD** (in scene or UI layer):
   - HP bar (top-left)
   - Energy bar (top-left)
   - Weapon indicator (current weapon type)
   - Crosshair (center screen)
   - Target HP bar (when aiming at NPC)

2. **Market Panel Weapons Tab**:
   - Display current weapon
   - Purchase buttons for each weapon type
   - Upgrade buttons (damage/fire rate/range)
   - Show current upgrade levels
   - Requirements (e.g., Market Intel for missiles)

3. **Player Death/Respawn**:
   - Respawn at last docked station
   - Credit penalty (10% of credits?)
   - Cargo loss

4. **Cargo Drops**:
   - Spawn debris when NPC destroyed
   - Collectible cargo (50% of NPC cargo)
   - Visual indication (floating containers)

### Medium-Term Enhancements
5. **Targeting System**:
   - Cycle targets with Tab key
   - Lock-on indicator
   - Lead indicator for projectile weapons
   - Range indicator

6. **Pirate NPCs**:
   - Mark certain NPCs as hostile (isHostile: true)
   - Spawn near Hidden Cove
   - Actively attack player on sight
   - Higher HP, better weapons

7. **Defense Turrets** (for missions):
   - Stationary defenses at stations
   - High HP, auto-fire at hostile players
   - Part of siege missions

8. **Wanted System**:
   - Track hostile acts (kills, hits)
   - Spawn bounty hunters when wanted level high
   - Clear wanted level by paying fines or laying low

### Mission Integration (Phase 2)
9. Integrate with mission system (MISSION_SYSTEM_DESIGN.md)
10. Combat objectives (destroy X targets)
11. Escort/defend missions
12. Blockade/siege missions

## 🐛 Known Limitations

1. **No UI for combat** - HP, energy, weapon type not displayed yet
2. **No targeting reticle** - Firing is forward-facing only
3. **No player death** - HP can reach 0 but nothing happens
4. **No cargo drops** - Destroyed NPCs don't drop collectible cargo
5. **Basic AI** - NPCs fire straight at player, no evasion
6. **No weapon switching** - Must dock at shipyard to change weapon

## 🧪 Testing Checklist

- [x] Fire weapon with spacebar
- [x] Projectiles appear and move
- [x] Projectiles hit NPCs
- [x] NPCs lose HP when hit
- [x] NPCs become aggressive when hit
- [x] NPCs fire back at player
- [x] Player takes damage from NPC projectiles
- [x] NPCs are destroyed at 0 HP
- [x] Reputation loss on NPC hit/kill
- [x] Energy consumption on fire
- [x] Energy regeneration over time
- [x] Fire rate limiting works
- [ ] Purchase weapons at shipyard (needs UI)
- [ ] Upgrade weapons at shipyard (needs UI)
- [ ] Player death/respawn (not implemented)
- [ ] Cargo drops from destroyed NPCs (not implemented)

## 📊 Performance Notes

- Projectile rendering is lightweight (sphere + line)
- Combat calculations run every tick (~60 FPS)
- Collision detection is O(projectiles * NPCs) - scales well for current NPC count
- Consider spatial partitioning if NPC count >100

## 🎨 Visual Style

- **Laser**: Red projectiles, thin beam
- **Plasma**: Green projectiles, thicker
- **Railgun**: Blue projectiles, fast streak
- **Missile**: Yellow projectiles, tracking trail (future)
- **Player projectiles**: 1.5x brighter than NPC
- **Hit effects**: None yet (add particle effects in future)

---

**Status**: Core weapons system fully functional, ready for UI integration and mission system hookup.

