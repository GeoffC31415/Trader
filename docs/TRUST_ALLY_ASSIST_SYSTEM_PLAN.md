## Trust & Ally Assist System — Implementation Plan

### Objectives
- Model evolving relationships with key characters based on player actions.
- Unlock tangible “ally assists” (escorts, waivers, discounts, rush slots) at positive trust tiers.
- Reflect trust and method in mission epilogues via narrative variants and tokens.

### Phase 1 Status (Implemented)
- Types added in `world_types.ts`:
  - `TrustRecord`, `AllyAssistToken`
  - `relationships?: Record<string, TrustRecord>`, `allyAssistTokens?: AllyAssistToken[]`
  - `missionCelebrationData.allyAssistUnlocked` extended
- Relationships helpers in `src/state/relationships.ts`:
  - `tierForScore`, `setTrust`, `hasUnconsumedToken`, `grantAssist`, `defaultAssistForStation`, `computeTrustDeltas`
- Store wiring in `src/state/store.ts`:
  - Apply trust deltas on mission completion and grant an assist token when crossing to tier +1
  - Include `allyAssistUnlocked` in `missionCelebrationData` for the celebration chip
  - Added `consumeAssist(type, by?) => boolean` action; tokens are marked consumed
  - Initialized `relationships` and `allyAssistTokens` in initial state; updated `store_backup.ts` accordingly
- UI:
  - `MissionCelebration` already displays ally assist chip when unlocked
  - Minimal Market UI in `ui/market_panel.tsx`: shows “ALLY ASSIST” pill for the current station token with a USE button wired to `consumeAssist`

### Scope (Phase 1 → 3)
- Phase 1 (MVP): Trust tracking, tier thresholds, one assist type per character, chip in celebration UI, deterministic unlock when crossing tier.
- Phase 2: Additional assist types per character, contextual spawn/use rules, UI surfacing in market/journal.
  - Implemented: buy flow consumes discount/refuel/waiver tokens and applies a 10% price reduction; Market panel shows USE button.
- Phase 3: Trust-informed narrative variants across more missions, subtle decay/cooldowns, balancing.
  - Implemented (initial): narratives now accept `trustTiers` snapshot; added trust-gated quote variants for select missions; gentle trust decay in tick loop; trust tiers included in `NarrativeContext` at mission completion.
  - Implemented (balancing): assist cooldown (60s), global cap (3 unconsumed), probabilistic repeat grants (15% when already supportive).

---

## Data Model

### Characters Registry
Link station IDs to named personas used for trust and assists.

```ts
// src/state/constants.ts (or new src/state/relationships.ts)
export const CHARACTER_INDEX = {
  'greenfields': { id: 'sana', name: 'Sana Whit' },
  'sol-city': { id: 'mira', name: 'Mira Vale' },
  'aurum-fab': { id: 'kade', name: 'Dr. Elin Kade' },
  'drydock': { id: 'harlan', name: 'Chief Harlan' },
  'ceres-pp': { id: 'ivo', name: 'Ivo Renn' },
  'sol-refinery': { id: 'rex', name: 'Rex Calder' },
  'hidden-cove': { id: 'vex', name: 'Vex Marrow' },
  'freeport': { id: 'kalla', name: 'Kalla Rook' },
} as const;
```

### Trust Scale and Tiers
- Score range: -2 (hostile) .. +2 (ally)
- Tiers: hostile (-2), skeptical (-1), neutral (0), supportive (+1), ally (+2)
- Thresholds: -2, -1, 0, +1, +2

### GameState Additions
Already added in world_types: `missionCelebrationData.allyAssistUnlocked` placeholder. Add relationships and tokens:

```ts
// src/domain/types/world_types.ts additions
export type TrustRecord = {
  score: number; // -2..+2
  tier: -2 | -1 | 0 | 1 | 2;
  lastChangeAt?: number; // epoch ms
};

export type AllyAssistToken = {
  id: string; // uid
  by: keyof typeof CHARACTER_INDEX; // stationId key
  type: 'escort' | 'discount' | 'waiver' | 'refuel' | 'repair' | 'fabrication_rush';
  description: string;
  createdAt: number;
  expiresAt?: number; // optional
  consumed?: boolean;
};

// In GameState
relationships?: Record<string, TrustRecord>; // key by character id (e.g., 'sana')
allyAssistTokens?: AllyAssistToken[];
```

### Derived Helpers
```ts
// src/state/relationships.ts (new)
export function tierForScore(score: number): -2 | -1 | 0 | 1 | 2 { /* clamp and map */ }
export function setTrust(
  rel: TrustRecord | undefined,
  delta: number,
  now: number
): TrustRecord { /* returns new record with updated score/tier/lastChangeAt */ }
```

---

## Triggers and Trust Delta Rules
Compute deltas at mission completion using `NarrativeContext` and which side the player supported.

### Character Rules (additive per mission)
- Sana (Greenfields): stealthUsed +1; deliver early (+time bonus) +1; destroy civilians -2; side with Sol City -1.
- Mira (Sol City): no civilian casualties +1; clean audits +1; collateral damage -2; side with pirates -1.
- Kade (Aurum): on-time & precise +1; sabotage -1; high-casualty +1 efficiency but -1 optics (net 0 or configurable).
- Harlan (Drydock): protect workers/convoys +1; rush raw materials +1; sabotage only if defensive +0, otherwise -1 if harms workers.
- Ivo (Ceres): stability maintained +1; low casualties +1; deliberate market chaos -2.
- Rex (Refinery): expose manipulation +1; defend convoys +1; aid monopoly -2.
- Vex (Hidden Cove): defended peace from both sides +1; hit Sol City defenses +1; harmed civilians -2.
- Kalla (Freeport): neutrality upheld +1; enables safe trade +1; escalations that threaten Freeport -2.

### Systemic Adjustments
- Opposed factions: when +1 to one, -1 to its opposed (e.g., Sana vs. Mira; Harlan vs. Kade; Rex vs. Ivo). Clamp within [-2, 2].
- Cooldowns: prevent >1 tier change per character per mission; cap absolute delta per mission to ±1.
- Optional decay (Phase 3): small drift toward 0 over long time without interaction.

---

## Unlock Logic
- Crossing into tier +1 (supportive) awards 1 assist token for that character, once per tier crossing (debounced per character).
- Additional tokens: small chance on future completions aligned with their values (Phase 2 probability, e.g., 15%).
- Anti-spam: max 1 unconsumed token per character at a time; or shared global cap (e.g., 3).
- Record unlock in `missionCelebrationData.allyAssistUnlocked` to display chip.

```ts
// src/state/store.ts (mission completion path)
const beforeTier = getTier(state.relationships['sana']);
const after = setTrust(state.relationships['sana'], +1, now);
if (beforeTier < 1 && after.tier >= 1 && !hasUnconsumedToken('greenfields')) {
  grantAssist('greenfields', 'discount', 'Agri goods discount for 1 mission');
  missionCelebrationData.allyAssistUnlocked = { by: 'greenfields', type: 'discount', description: 'Agri discount (1 mission)' };
}
```

---

## Ally Assist Effects (Phase 1 mapping)
- Sana (Greenfields): discount token — temporary price lock/discount on agri goods at Greenfields for next purchase.
- Mira (Sol City): waiver token — skip next inspection/tariff at Sol City station.
- Kade (Aurum): fabrication_rush token — one rush slot halves fabrication time/cost for specific recipe.
- Harlan (Drydock): repair token — instant repair to full HP once; or cargo handling speed bonus for one docking.
- Ivo (Ceres): refuel token — free refuel/price lock for one large fuel purchase.
- Rex (Refinery): discount token — 10% off refined fuel once.
- Vex (Hidden Cove): escort token — spawn 1-2 pirate escorts on entering hostile sector once.
- Kalla (Freeport): safe-passage token — immunity from pirate ambush for one transit.

### Token Application Points
- Discounts/waivers/refuel/repair: applied in store actions `buy/sell/upgrade/replaceShip` or station-specific flows.
- Escorts/safe-passage: consumed on entering designated region, implemented in `npc.ts` or `updateMissionsInTick` hooks.

```ts
// src/state/store.ts
function consumeAssist(kind: AllyAssistToken['type'], by?: string): boolean { /* find & mark consumed */ }
```

---

## Store Integration

### Where
- `checkMissionProgress` and `completeMission` paths already set `missionCelebrationData` with `NarrativeContext` (done).
- Extend these to:
  1) Compute trust deltas per character from mission + context.
  2) Update `relationships` map via pure helpers.
  3) If crossing into tier +1 or +2, issue an `AllyAssistToken` and include it in `missionCelebrationData.allyAssistUnlocked`.
  4) Persist to state.

### New Helpers (src/state/relationships.ts)
- `applyMissionTrustDeltas(state, mission, ctx): { relationships, unlockedToken? }` — pure.
- `grantAssist(stationId, type, description): AllyAssistToken` — deterministic ID and metadata.
- `hasUnconsumedToken(stationId): boolean`
- `consumeAssist(type, stationId?)` — mark consumed.

---

## UI Surfacing
- Celebration (already): shows chip with ally and assist type when unlocked.
- Market Panel: show small badge “Ally assist available” near relevant action (buy/repair/fabricate), with a “Use” CTA that calls `consumeAssist`.
  - Implemented: USE sets `pendingAssist` and consumes token; next buy at that station applies scoped effect (refuel: refined fuel at Ceres only; discount: station-scoped; waiver: neutral multiplier pending tariff mechanic).
- Dock Intro/Persona overlays: optional line variant based on trust tier.
- Journal/Traders Panel: show trust tiers per character and tokens list.

---

## Narrative Variants Tie-in
- In `mission_completion_narratives`, add variant predicates using trust:

```ts
variants: [{
  when: (ctx) => (ctx.sidedWith === 'greenfields') || (/* read tier via injected context if needed */ false),
  quote: { text: 'You enforced the law without spectacle. I can work with that.', speaker: 'Mira Vale' }
}]
```

Note: Current `NarrativeContext` doesn’t include trust; keep variants focused on method/time/casualties. Use quotes/content to acknowledge assists indirectly.

---

## Balancing & Rules of Thumb
- Cap deltas per mission at ±1 per character.
- Crossing +1 yields 1 token; +2 yields a stronger token or refresh existing.
- Only one unconsumed token per character at a time (global cap 3).
- Cooldown: minimum 1 mission between token grants from the same character.

---

## Telemetry & Save
- Increment counters: `trustDeltaApplied`, `tokensGranted`, `tokensConsumed` (optional in-memory stats).
- All structures live inside `GameState`, persisted by store like other state.

---

## Testing Plan
- Unit: `tierForScore`, `setTrust`, `applyMissionTrustDeltas`, `grantAssist`, `consumeAssist`.
- Integration: mission completion flow updates relationships, grants token, sets celebration chip.
- UI: snapshot for chip and market badge; simulate token consumption once.
- NPC: escort spawn occurs once and respects consumed token.

---

## Rollout Checklist (PR-by-PR)
1) Types & helpers
   - Add `TrustRecord`, `AllyAssistToken`, `relationships`, `allyAssistTokens` to `GameState`.
   - Create `src/state/relationships.ts` helpers.
2) Store wiring (Phase 1)
   - In mission completion, call `applyMissionTrustDeltas()` and `grantAssist()` when crossing tier; include `allyAssistUnlocked` in celebration data.
   - Add `consumeAssist()` and integrate with `buy/sell/repair/fabricate` paths where relevant.
3) UI (Phase 1)
   - Market/journal minimal badges and a single “Use assist” CTA per relevant action.
4) Effects (Phase 1)
   - Implement one effect per character (listed above). Keep logic local to relevant action code.
5) NPC (Phase 2)
   - Escort/safe passage token consumption and spawn in `npc.ts` or mission tick.
6) Balancing (Phase 3)
   - Add cooldowns, cap tokens, optional probability for repeat grants, optional decay.

---

## Risks & Mitigations
- Power creep from stacked assists → cap tokens and apply cooldowns; tokens consumed on use.
- Conflicting assists during missions → enforce one active assist per character at a time.
- Narrative mismatch with assists → keep variants method-based; let chips communicate assist context.

---

## Implementation Notes
- Keep helpers pure and tested; the store should orchestrate composition.
- Prefer small, composable deltas based on `NarrativeContext` booleans/metrics.
- Don’t block mission flow on assists; they are optional bonuses.


