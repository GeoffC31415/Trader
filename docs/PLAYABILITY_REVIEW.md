# Playability review

## Scope and verdict

Reviewed all **30 mission templates**, mission generation/progression, player actions, combat and projectile resolution, stealth, escort movement/waves, mission UI, flight/input, and relevant economy/relationship integration.

**Verdict: the narrative content is substantially ahead of the playable mechanics.** This is not primarily a balance problem. Some objectives never receive events; others are completed by unrestricted buttons or unrelated kills. Combat does not provide its advertised basic functionality. Failure and retry handling can permanently strand a story arc. Adding more encounters before fixing these foundations would multiply the problems.

Method: source tracing plus direct execution of the TypeScript simulation using Node 22's type stripping and a temporary extension-resolution hook. **24 defect reproductions passed**, including store-level actions, batched events, and a simulated escort journey. Travel speeds were simulated at 60 Hz. This was **not a browser/controller playtest**: rendering performance, visual clarity, audio fatigue, and subjective handling still require actual play sessions. Recommended timings below are initial design targets, not established player research.

No gameplay code was changed for this review. Existing uncommitted changes were left alone.

## Priority order

1. **P0 — Make outcomes trustworthy:** combat hits, target identity, mission event routing, terminal transitions, objective dependencies, collection/turn-in, deadlines, and retries.
2. **P0 — Prove every branch is completable:** explicit branch graph, prerequisite/equipment/access checks, complete mission integration tests.
3. **P1 — Make moment-to-moment actions readable and fair:** aiming, combat HUD, real escort threats, useful stealth decisions, forgiving interactions.
4. **P1 — Reduce empty travel:** cruise/route assistance, accurate speed/ETA, basic navigation for everyone, less redundant backtracking.
5. **P2 — Add systemic variation:** optional encounters, consequential supply-chain changes, faction patrols, local opportunities.

---

## 1. Confirmed implementation findings

### F1 — The starter laser is not a ranged weapon in practice [P0]

**Sources:** `src/systems/combat/weapon_systems.ts:20–122`, `src/domain/constants/weapon_constants.ts:7–15`, `src/state/modules/combat.ts:84–106`.

Laser projectile speed is zero. Creation calculates a direction, but never stores it as a ray or beam endpoint. The resulting projectile remains at the shooter, apart from half the shooter's velocity. Collision checks only whether its current position lies within a 20-unit sphere of a target. It does not raycast along the firing direction.

Reproduced:

- A stationary player aiming at an NPC 100 units away cannot hit it, despite the advertised 800-unit laser range.
- An NPC behind the player, 10 units away, gets hit even when firing in the opposite direction.

Mission enemies commonly orbit their target at **50 units**, outside that collision sphere (`src/state/modules/npc.ts:70–164`). Thus the starter loadout is effectively unusable for its intended combat loop. The NPC laser has the same fundamental problem.

**Fix:** resolve hitscan immediately using a finite ray/segment against eligible collision volumes; render the beam separately. Use swept collision for moving projectiles so shots do not tunnel between frames. Store/enforce traveled distance and weapon range: current moving projectile lifetime, rather than the range stat, determines reach. Missiles have no homing implementation despite the targeting-related comments. `getWeaponStats` also replaces NPC custom laser damage/fire-rate/range with player laser base stats.

### F2 — Hostility does not activate firing; enemies cannot damage escorts [P0]

**Sources:** `src/systems/combat/ai_combat.ts:57–88`, `src/state/modules/combat.ts:117–170`, `src/systems/combat/weapon_systems.ts:86–122`, `src/state/modules/npc.ts:47–57`.

Mission pirates and defenders set `isHostile`/`isAggressive` on the NPC, but firing checks a separate `npcAggression[npc.id]` entry. That entry is not initialized for the spawned enemies. It generally appears only after the player hits an NPC.

Enemy collision tests only the player. There is no enemy-projectile path that damages a mission escort. Pirates can chase an escort, but cannot shoot it. Contract escorts likewise have no protective combat behavior.

**Fix:** one authoritative disposition/target model. Spawn enemies with valid attack intent; resolve enemy attacks against their actual target, including escorts and protected structures. Decide friendly-fire rules explicitly. Use distinct behaviors for raiders, fleeing haulers, stationary turrets, and defenders; currently narrative turrets/convoys become generic hostile freighters with pirate movement. Hostile station defenders also lack actual pursuit behavior, and their losses are immediately replenished without a cooldown or finite reinforcement budget.

### F3 — Combat credit ignores objective identity and corrupts batched outcomes [P0]

**Sources:** `src/systems/missions/mission_validator.ts:57–65`, `src/state/modules/missions.ts:91–152`, `src/state/modules/missions.ts:870–894`, `src/systems/combat/ai_combat.ts:166–240`.

`destroy` accepts every `npc_destroyed` event, ignoring `objective.target`. Mission tick routes a kill to its owning mission **or any active combat mission**. This produces both false success and lost progress:

- One unrelated kill completes all three named convoy objectives in the Ceres raid. The two turret missions have the same shape.
- Killing an enemy for one mission advances another active combat mission.
- Two kills in one tick count as one for a quantity-based objective: every event starts from the stale `activeMissions` snapshot.
- If that stale snapshot already permits completion, multiple events can complete and reward the same mission repeatedly. Reproduced a double payout in one tick.

Acceptance spawns targets around random stations, not the mission's specified site/route. Their IDs do not match named target IDs. The spawn cargo configuration is not represented as actual loot, and the named haulers are hostile rather than civilian supply ships.

**Fix:** mission-scoped entity IDs/groups and one evolving state reducer per event batch. Count each eligible victim once, with explicit attribution/assist policy. Recheck the latest mission status before processing every event. Success rewards must be idempotent. Spawn the entities actually described, and define what happens if they escape, are destroyed by another party, or cease to exist.

### F4 — Collection missions cannot progress through ordinary buying [P0]

**Sources:** `src/state/actions/economy/buy_action.ts`, `src/state/store.ts:561–632`, `src/systems/missions/mission_validator.ts:37–45`, `src/domain/constants/mission_constants.ts:663–753,1110–1151`.

The validator supports `commodity_acquired`, but buying emits no such event. Neither mining nor fabrication emits acquisition events either. Reproduced buying copper successfully while the collection objective stays at zero.

Both Raw Materials Rush missions, and the Ceres fuel-monopoly finale, additionally contain `deliver` objectives with **no commodity target**. No normal `commodity_sold` event can match `undefined`; the mission-item UI refuses undefined targets too.

After these are fixed, the intended turn-in still needs its own transaction: Aurum's normal market rejects some recipe inputs, so using normal market sales is not a general solution.

**Fix:** explicit purchase/acquisition events with source station and transaction ID, plus typed multi-commodity turn-ins. Decide whether the task means purchase history or retained cargo. If it means retained cargo, do not permit buy/sell/rebuy to satisfy it. Reserve or guarantee necessary stock, or let the mission adapt/recover. The promised advance funding/reimbursement is not actually provided.

### F5 — Mission-item buttons fabricate progress rather than transferring items [P0]

**Sources:** `src/ui/components/market/MissionsSection.tsx:17–26,360–445`, `src/state/store.ts:1258–1365`.

Every unknown commodity ID is treated as a special mission item. The DELIVER button calls a general action that simply marks the objective complete. That action verifies neither docking location, dependencies, possession, quantity, nor cargo consumption.

Consequences:

- Diplomatic pouches, contracts, pamphlets, schematics, and economic data have no real custody lifecycle.
- `fabricated_goods_mixed` is mistaken for a mission item. Both fabrication finales accept a button click with **empty cargo**, granting completion of a nominal 50-unit delivery.
- UI prerequisites only examine unfinished `visit` objectives, not downloads, collection, or prior deliveries. Buttons are not an authoritative rule engine.
- Every local unfinished visit is shown as PICK UP, even when it means returning to report. This lets the Energy audit's final return objective be completed before leaving the issuing station.

**Fix:** distinguish ordinary commodities, tagged mission inventory, document flags, and aggregate commodity baskets. Validate and consume turn-ins in the state layer. Give each objective explicit prerequisites and interaction location. UI should display the rules, not invent them.

### F6 — The two 'stealth' missions have no detection objectives [P0/P1]

**Sources:** `src/domain/constants/mission_constants.ts:187–232,301–343`, `src/systems/missions/stealth_system.ts:123–214`, `src/state/store.ts:1367–1533`, `src/ui/components/market/MissionsSection.tsx:112–143,386–515`.

Patent Wars (Aurum) and The Audit Trail are typed as stealth, but neither defines `avoid_detection`. Stealth processing selects missions by that objective type, so these missions do not participate in the suspicion system at all.

Instead, both use a 30–35 second mouse-hold interaction. Releasing at 29.9 seconds or 35.1 seconds **fails the entire mission**, and so does leaving the button early. Reproduced permanent failure after a one-second hold. The action checks elapsed wall-clock time but not continuous presence at the site. A mouse precision/timing trap is substituting for infiltration.

The smuggling mission does use suspicion. However, its invariant starts `completed=true`, and `updateMissionObjectives` skips completed objectives, so a detection event never invalidates that invariant. The tick separately force-fails the mission, hiding the broken validator contract rather than fixing it. Detection is returned by station ID only, which also loses mission identity when several missions monitor the same station.

**Geometric fairness:** Sol City's detection radius is 150 units; Greenfields is only about 128 units from it. The smuggling check does not exempt docking. A player carrying luxury goods can accumulate suspicion while browsing Greenfields' menus, not merely while making a risky approach to Sol City.

**Fix:** treat 'remain undetected' as a live invariant, not an already-completed objective. Identify detections by mission and source. Explicitly define where scans apply, whether docking is safe, contraband rules, and whether optional stealth failure cancels the whole mission. Replace the hold trap with a progress operation that auto-finishes; interrupting should pause/reset progress unless an actual alert caused failure.

### F7 — Escort arrival bypasses combat; escort loss rules are inconsistent [P0]

**Sources:** `src/state/modules/missions.ts:244–303,307–494`, `src/systems/missions/escort_system.ts:19–32,183–276,353–393`, `src/state/modules/npc.ts:250–310`.

Reproduced **Agricultural Compliance Escort completing in 9.6 seconds without player intervention**, with the player docked. Arrival auto-completes all three defend waves and deletes surviving pirates.

Other problems:

- A single-escort mission only fails when **two** escorts die. Losing Inspector Chavez or the peace-conference proxy marks an objective failed but leaves the mission active.
- Required failed objectives count as resolved in generic completion. Success and failure policy therefore disagree.
- The three-convoy mission appears to tolerate one loss, but arrival requires every escort objective completed; one failed escort prevents that path. Any salvage result depends on unrelated wave progress rather than an explicit survival threshold.
- Waves spawn on a timer even with the previous wave alive. Starting a new wave replaces `currentWavePirateIds`, abandoning the previous wave's completion tracking.
- No mission-specific maximum wave count is supplied. A slow escort can accumulate unbounded enemies.
- Multiple defend objectives all increment for the same `wave_survived` event. The peace conference describes two attacks, defines two quantity-three defend objectives, and would satisfy both after three waves rather than two distinct attacks.
- Peace-conference 'protection' is a generic 100-HP escort proxy named `freeport`, not protection of the actual conference/station.
- Three fuel convoys leave simultaneously for different destinations. Once damage works, defending diverging routes is a feasibility problem, not just a difficulty setting.

**Fix:** explicit success predicates, per-mission casualty tolerance, bounded uniquely identified waves, and no next wave until the current one resolves unless overlap is intentional. Stage escorts until the player launches; provide follow/regroup/hold controls. Make the refinery mission one convoy with multiple ships on a shared route, or launch sequential legs. If early arrival legitimately bypasses an ambush, change the contract/UI to state that instead of awarding fictitious kills/waves.

### F8 — Deadlines are not enforced in the normal game loop [P0]

**Sources:** `src/state/store.ts:154–306,927–1104`, `src/systems/missions/mission_validator.ts:139–161`.

Failure checking exists in `checkMissionProgress`, but no caller invokes that action. Normal ticking, docking, sales, manual completion, and kill completion do not consistently check deadlines first. Reproduced a mission accepted near time zero remaining active after a normal tick long beyond its deadline.

Wall-clock deadlines, simulation-time movement/suspicion, and frame-based update behavior are mixed. `acceptedAt` also uses a truthy check, which mishandles a legitimate zero-based game clock.

**Fix:** one injected simulation clock and one terminal evaluation path. Define deadline boundary (`now >= deadline`, for example), event ordering at the boundary, paused/menu/tab behavior, and failure precedence. Show remaining time in flight and mission UI. Do not punish reading briefings or browser focus loss by accident.

### F9 — Failed/cancelled missions cannot actually be retried [P0]

**Sources:** `src/state/store.ts:384–386`, `src/state/modules/missions.ts:835–838,982–1035`, `src/ui/components/market/MissionsSection.tsx:562`.

UI promises 'You can re-accept this mission to try again.' But the mission remains in the array, generation deduplicates all existing IDs, and acceptance only accepts `offered`. Reproduced returning to the issuer after failure and receiving no new offer.

Cancellation has the same problem. This can permanently lock an arc following a minor interaction mistake. Timed failures do not perform the same cleanup as cancellation; successful missions also leave some mission NPC/state behind.

**Fix:** separate template ID from attempt ID. Offer an explicit retry/reset policy, clean up owned NPCs/projectiles/state, restore legitimate mission items, and reset attempt progress without duplicating rewards. Decide whether retries charge a bounded fee, require a cooldown, or offer a fail-forward story alternative.

### F10 — Choices do not constrain branches, and are not transactional [P0]

**Sources:** `src/systems/missions/mission_generator.ts:20–68`, `src/state/helpers/mission_helpers.ts:11–57`, `src/state/store.ts:1197–1256`, `src/systems/missions/choice_system.ts:321–337`.

Choices are recorded, but generation never uses them. `nextMissionId` and reward unlocks do not enforce the next branch. Opposing paths can become available if reputation permits. Already-offered alternatives are not invalidated. Fabrication also retains an older generic stage-three mission alongside its two replacement branches.

`makeMissionChoice` does not require offered/active status, revalidate current reputation/location, or prevent an already committed choice. Repeated calls pay rewards and apply consequences again. A choice with no objectives also passes generic completion; if treated as active and processed by generic event handlers, it can complete without recording a choice. The ordinary UI normally opens choice missions directly while offered, so this is an engine invariant bug rather than a claim that every normal choice immediately auto-completes.

Descriptions also advertise actions that do not exist: stolen census data, convoy raids, pirate suppression, peace reparations, a ten-minute trade boycott, strikebreaker deliveries, evidence distribution/deletion. Selecting a choice immediately pays and advances instead.

**Fix:** an explicit branch graph, one committed choice per decision, and idempotent choice transitions. Either implement the described work as subsequent objectives or honestly label choices as pure decisions and remove the promised tasks. Do not give the reward for work never required.

### F11 — Many advertised world consequences are inert or lost [P1, with progression impact]

**Sources:** `src/state/helpers/mission_helpers.ts:96–138`, `src/systems/missions/choice_system.ts:11–312`, `src/state/store.ts:1232–1254`, `src/state/actions/economy/sell_action.ts:151–178`.

Non-choice `applyPermanentEffects` is effectively a stub. Several completion paths do not call it; one calculates updates but discards them. Many strings in templates do not match choice effect cases (`ceres_fuel_price_drop` versus `fuel_prices_reduced`, for example).

The stored timed/permanent-effect arrays and pirate aggression multiplier have no runtime consumers. Stock reduction, labor lockouts, attack frequency changes, supplier discounts, and new refinery promises therefore generally do not materialize. The Sol City food effect looks for `food` and `grains` IDs instead of real commodities.

Choice rewards and effects are computed independently from the old state. When an effect returns `stations`, spreading it after reward updates overwrites reputation changes. Reproduced joining pirates from 25 Hidden Cove reputation and remaining at 25 instead of receiving the advertised gain. Multiple array-based effects can similarly overwrite one another.

**Fix:** a typed effect registry with exhaustive handlers, compositional updates against the evolving transaction, and actual consumption by pricing/production/access/spawn logic. Update narrative flags from the same canonical outcome. Branch tests must assert the world consequence, not only `status='completed'`.

### F12 — Mission acceptance does not ensure the task is feasible [P0/P1]

**Sources:** `src/state/helpers/mission_helpers.ts:185–212`, `src/state/modules/missions.ts:820–979`, `src/systems/missions/mission_generator.ts:107–150`, `src/state/modules/economy.ts:274–291`.

Acceptance checks reputation and the active-mission count, but not required equipment, access, cargo handling, target existence, available stock, or expected route time.

Examples:

- New Markets needs meat, which requires the temperature-controlled hold, but the offer does not require/warn about it.
- Collections need working turn-ins, purchasing funds, and enough attainable stock; their briefings promise advances that are not deposited.
- A law-aligned Pirate Accords outcome permanently closes Hidden Cove, but Union stage one later demands a delivery there. No alternate contact or exemption exists.
- Other faction outcomes can make mandatory data-collection stations hostile.
- Union Crisis comments promise two completed arcs, but its unlock definition only checks membership. It can unlock with zero completed arcs.
- Proposed multi-ship combat escort tasks must be evaluated against the slowest eligible ship and divergent destinations, not only the test ship.

**Fix:** validate equipment/access at offer/acceptance, provide loaner gear or alternate objectives when appropriate, and guarantee a viable source/sink path. Define whether an intentionally impossible political path is a visible lock or a fail-forward branch; never silently offer it as a completable task.

### F13 — There is no real player defeat/recovery or usable combat service loop [P0/P1]

**Sources:** `src/state/modules/combat.ts:112–115,278–317`, `src/state/store.ts:313–323,646–671`, `src/ui/components/hud/ShipStatusPanel.tsx`, `src/ui/components/market/ShipyardSection.tsx`.

Hull is clamped at zero with a TODO for defeat. Reproduced a zero-hull player still thrusting and firing. The regular HUD does not show hull, energy, weapon, speed, or combat target. Weapon purchase/upgrade actions exist in state, but the current player-facing shipyard UI does not expose them. No normal repair service was found.

**Fix:** readable hull/energy/weapon feedback, functioning weapon services, repairs, and an explicit defeat policy. Prefer insurance/checkpoint recovery with transparent bounded loss over deleting a long campaign. On defeat resolve affected missions coherently, clear encounters, and offer retry. Do not introduce punitive death before this loop works.

### F14 — Existing dynamism is partly disconnected and partly unstable [P1]

**Sources:** `src/systems/economy/market_events.ts:132–148`, `src/state/store.ts:256–281`, `src/state/modules/economy.ts:213–271`, `src/state/modules/npc.ts:324–362`.

The first market-event predicate compares `currentTime` against a value freshly derived from `Date.now()`. In normal synchronous use it never becomes eligible. Reproduced the predicate remaining false with an injected fixed clock.

If an event is externally seeded, its successor probability is rolled every frame without `dt` normalization, so the advertised 5–10 minute spacing is not reliable. Last-event history is derived only from currently active events, losing history when they expire. Event price multipliers are repeatedly multiplied into current prices during jitter rather than applied once to a baseline; a temporary event can cause lasting drift to price caps.

NPC shortage detection also compares current stock to that same current stock as the supposed baseline, usually producing ratio 1 rather than a shortage. The station-economy simulation is a useful foundation, but these defects prevent it from reliably generating meaningful opportunities.

**Fix:** maintain a next-event simulation timestamp or frame-rate-independent hazard, durable event history, stable target stock, and baseline-plus-active-modifier pricing. Avoid solving monotony with an event flood or arbitrary price noise.

---

## 2. Mission-by-mission coverage and required contracts

**All 30 template IDs are covered below.** These are proposed acceptance criteria, not claims that the current implementation satisfies them. Global rules in section 3 apply to every row. Missing items should be recoverable where possible rather than forcing arbitrary failure.

### Greenfields Independence (6 templates)

| Template | Current playability | Required success and specific failure policy |
|---|---|---|
| `greenfields_stage_1` — Breaking the Chain | Ordinary luxury sales can complete it; detection boundary overlaps Greenfields and the invariant validator is broken. | Deliver 10 actual luxury units to Greenfields after acceptance; consume/credit only actual units; maintain the defined contraband invariant until delivery ends. Fail only on a real qualifying scan. Guarantee a purchasable source and explain funding/safe approach. |
| `greenfields_stage_2` — The Census | Immediate choice; described espionage/reporting tasks absent; next branch not enforced. | Commit exactly one side once. If this remains an actionable mission, steal and return tagged logs for Sana, or deliver the report to Mira, in order. Advance only the chosen branch. Real detection/loss can fail the espionage leg; otherwise this can simply be an honest pure decision. |
| `greenfields_stage_3` — Supply Cut | Generic hostile spawns, broken laser, unrelated kills count. | Stop 3 explicitly spawned grain convoys bound for Sol City. State whether 'stop' permits disabling instead of killing. Only tagged targets count. If a convoy escapes, fail or provide a declared replacement/interception window. No hidden deadline currently exists. |
| `sol_city_stage_3` — Agricultural Compliance Escort | Auto-success in 9.6 seconds; waves bypassed; single escort death does not terminally fail. | Inspector arrives alive AND 3 declared ambushes are resolved, if those waves remain contractual. Fail immediately on inspector loss. If speed can legitimately avoid ambushes, replace the wave objective with safe arrival rather than fake wave credit. |
| `greenfields_stage_4` — New Markets | 15 grain + 15 meat sales can progress; requires unadvertised temperature gear; independence effects are inert. | Deliver actual 15 grain and 15 meat to Freeport, with explicit minimum freshness if quality matters. Allow partial deliveries/replenishment. Require or loan temperature gear. Apply the actual independence/food-price outcome. No artificial failure merely for taking time unless explicitly promised. |
| `sol_city_stage_4` — Contract Enforcement | Four buttons complete documents without inventory/custody. | Issue four uniquely tracked contracts at acceptance; acknowledge one at each named station: Ceres, Aurum, Drydock, Freeport. No duplicates/wrong destinations. Provide a recovery contact if a station becomes inaccessible. Apply the declared trade-control outcome. |

### Fabrication Wars (9 templates, including one obsolete duplicate)

| Template | Current playability | Required success and specific failure policy |
|---|---|---|
| `fabrication_wars_aurum_stage_1` — Patent Wars | No stealth detection; hold trap; data delivery not ordered after download. | Reach Drydock, complete the real infiltration/download there, acquire tagged schematics, return them to Aurum. Detection should be an actual surveillance condition; interruption pauses/resets rather than destroys the campaign. |
| `fabrication_wars_drydock_stage_1` — Patent Wars | Fake schematics are not issued/consumed; pickup is a visit/button. | Issue tagged fake data at Drydock, then plant it at Aurum. Decide whether planting is an infiltration action or legal delivery, and expose that policy. Verify custody and location. |
| `fabrication_wars_stage_2_aurum` — Raw Materials Rush | Blocked: buying never emits collection events; delivery target undefined. | Purchase and deliver 20 copper + 20 silicon to Aurum within 480 simulation seconds. If 'three stations/buy all stock' is intended, track three distinct suppliers and a reservation/snapshot; otherwise correct the copy. Grant the promised advance. Fail at deadline only if insufficient delivery; replenish shortages or reserve supply. |
| `fabrication_wars_stage_2_drydock` — Raw Materials Rush | Same blockers as Aurum branch. | Same typed material contract, destination Drydock, chosen branch only. Ensure the deadline accommodates a normal eligible ship and trading interactions. |
| `fabrication_wars_stage_3` — legacy Sabotage | Duplicate generic stage-three mission can conflict with replacements; deadline not enforced. | Remove it from live generation or migrate it into exactly one canonical branch definition. Do not leave a second route that skips stage two or carries incompatible reputation/rewards. |
| `fabrication_wars_stage_3_aurum` — Sabotage | Generic enemies, kill attribution broken, deadline ineffective. | Stop 5 tagged Drydock supply traders within 600 seconds. Define target escape/NPC third-party kill policy. Publish routes/last-known positions. Only Aurum branch can offer it. |
| `fabrication_wars_stage_3_drydock` — Sabotage | Same problems. | Stop 5 tagged Aurum supply traders within 600 seconds, with the same explicit policies and Drydock branch restriction. |
| `fabrication_wars_stage_4_aurum` — Exclusive Contract | Empty-cargo button wins; no rival race; no exclusive-supplier outcome. | Turn in 50 units from a typed fabricated-goods basket at Ceres, consuming actual goods. If there is a rival race, spawn/model it, show rival progress, and fail only on a clearly defined rival win; otherwise remove the race claim. Apply Aurum supplier/discount effects. |
| `fabrication_wars_stage_4_drydock` — Exclusive Contract | Same bypass; narrative says cargo is loaded but none is. | Same contract for Drydock. Explicitly choose whether the issuer supplies sealed cargo or the player manufactures/procures it. Validate cargo capacity before issuing it. |

### Energy Monopoly (6 templates)

| Template | Current playability | Required success and specific failure policy |
|---|---|---|
| `energy_monopoly_stage_1` — Audit Trail | No real stealth; return can be credited at start; hold timing can permanently fail. | Ceres approach/infiltration -> install at Ceres -> acquire evidence -> report at Refinery, strictly in order. Define surveillance risk and install interruption separately. Cannot report evidence before obtaining it. |
| `energy_monopoly_stage_2` — Fuel the Fire | Immediate payout, evidence tasks absent, effect IDs mismatch, branches not gated. | One irreversible decision. If distribution/deletion remains promised, require acknowledged deliveries to three named stations or a verified deletion/hand-off, respectively. Apply correct fuel effects; enable only the selected next mission. |
| `energy_monopoly_stage_3_refinery` — Defend Convoys | Escorts invulnerable to enemies; all-arrival bypass; one-loss handling inconsistent; divergent routes. | Redesign as a shared-route convoy or sequential sorties. Explicitly choose 'all 3 survive' or 'at least 2 survive' and evaluate exactly that predicate, plus 4 bounded waves if retained. Failure threshold must match the stated tolerance. Resolve escaped/straggling ships and prevent indefinite orphaned missions. |
| `energy_monopoly_stage_3_ceres` — Raid Shipments | One unrelated kill completes three named objectives; narrative 10-minute limit not set. | Destroy/disable all 3 distinct tagged refinery convoys; each counts once. Set/enforce the promised 600-second limit or remove it from the briefing. Define convoy escape as a failure or another intercept leg. |
| `energy_monopoly_stage_4_refinery` — New Sources | Ordinary sale of 40 rare minerals at Freeport can work; refinery/fuel outcome absent. | Deliver 40 actual rare minerals to Freeport; legitimate buying/mining both allowed unless provenance matters. Allow partial delivery. Establish the announced refinery and normalized pricing. Ensure sourcing/funding is viable. |
| `energy_monopoly_stage_4_ceres` — Consolidate Control | Blocked collection event and undefined turn-in target; five-station requirement not tracked. | Purchase 50 fuel across 5 distinct stations and turn the required fuel in at Ceres within 720 seconds, or simplify the text to a 50-unit delivery. Prevent repeated one-unit trades from faking five suppliers. Grant defined reimbursement and apply monopoly effects. |

### Pirate Accords (5 templates)

| Template | Current playability | Required success and specific failure policy |
|---|---|---|
| `pirate_accords_stage_1` — Diplomatic Pouch | Document buttons work without custody; advertised 30% ambush absent. | Pick up one tagged pouch at Freeport and deliver it to Hidden Cove. Roll ambush eligibility once per attempt/route, not per frame; make it survivable/escapable with starter equipment. Fail only on actual irrecoverable pouch loss or declared mission defeat. |
| `pirate_accords_stage_2` — Choose Your Side | Immediate rewards; raids/law targets/reparations absent; rep rewards can be overwritten. | Commit pirate/law/peace once. Implement promised 4 convoy raids, 6 pirate eliminations, or 20 luxury + 20 electronics + 20 pharmaceuticals as actual follow-up work, OR clearly remove those requirements from choice descriptions. Show equipment/cost/access consequences before commitment. |
| `pirate_accords_stage_3_pirate` — Assault Defenses | 'Turrets' are random-station freighters; one kill can satisfy all 3 targets. | Destroy three distinct stationary Sol City turrets at that station; define defense reinforcement budget and effective suppression result. No replacement of mission turrets during the objective. Apply reduced defenses afterward. |
| `pirate_accords_stage_3_law` — Siege Hidden Cove | Same target mismatch; station is already permanently closed by the preceding choice. | Destroy three actual Hidden Cove turrets and then apply the declared siege/closure outcome. If permanent closure already occurs at the decision, there is no meaningful siege to accomplish; defer it or clarify its purpose. Only the law path offers it. |
| `pirate_accords_stage_3_peace` — Peace Conference | Two nominal attacks become three shared wave credits; conference proxy cannot be damaged by enemies; one proxy loss not terminal. | Protect a real conference asset through two distinct named attacks. If each has three enemies, encode enemy counts separately from wave counts. Fail if the protected asset is destroyed; optionally model negotiator evacuation as a recovery route. Apply peace/decreased-raiding state. |

### Union Crisis (4 templates)

| Template | Current playability | Required success and specific failure policy |
|---|---|---|
| `union_crisis_stage_1` — Organize Stations | Five document buttons; Hidden Cove may already be permanently closed; 15-minute limit ineffective. | Issue 5 tracked pamphlet bundles and acknowledge each destination within 900 seconds. Supply a covert contact/alternate station for inaccessible Hidden Cove; otherwise lock with an explanation before acceptance. Enforce the advertised arc unlock prerequisite if retained. |
| `union_crisis_stage_2` — Strike or Break | Immediate choice; ten-minute boycott/worker deliveries absent; consequences unimplemented. | One branch commitment, followed by an actual 600-second qualifying boycott OR three named worker deliveries. Define corporate stations, prohibited transaction types, whether violation resets or fails, paused-time behavior, and visible boycott progress. A passive ten-minute idle wait is not good gameplay: offer supporting union activities during the interval. |
| `union_crisis_stage_3_union` — Negotiations | Six visits plus document button; access can be blocked by prior politics; no labor-system effects. | Gather unique tagged data from all 6 stations, then submit complete dataset at Freeport. Provide remote/covert data access when the player's own union/pirate choices prohibit docking. Apply real worker/fabrication outcomes. |
| `union_crisis_stage_3_corporate` — Negotiations | Same data-custody/access issues; same six-station errand with different dialogue. | Same ordered data contract, chosen corporate branch only. Offer a meaningfully different approach (audits, persuasion, paid access, or disputed data choices) rather than duplicating the union route. Apply actual efficiency/labor outcomes. |

---

## 3. Required mission-engine invariants

Implement these before tuning individual missions:

1. **One canonical transaction:** event -> objective state -> failure evaluation -> success evaluation -> terminal transition -> rewards/effects -> owned-entity cleanup -> next offers. No separate, subtly different implementations for sale, docking, tick, install, and manual completion.
2. **Exactly-once outcomes:** terminal missions cannot change outcome or pay again. Events and attempts have IDs. Reward/effect application is idempotent, including multiple completions in one frame.
3. **Explicit dependency graph:** pickup before download/plant/turn-in; installation before reporting; all required data before submission. Parallel objectives are declared, not inferred from array order or the presence of any `visit`.
4. **Typed objectives:** commodity basket, document custody, target entity/group, wave/encounter ID, bounded interaction, access/stealth invariant, choice. Missing targets are invalid template data, never wildcards or mission-item fallbacks.
5. **Failure beats invalid success:** evaluate critical death, asset loss, detection, and deadlines before awarding completion. Optional objectives may fail without failing the mission; required objectives cannot generically become successful merely by being marked failed.
6. **Declared recovery:** distinguish fail, cancel, pause, reset objective, retry attempt, and fail-forward. Item shortages and interrupted interactions need not be mission failures. No active mission may be left with a permanently impossible required objective.
7. **One clock:** explicit pause/briefing/hidden-tab policy. Normalize rates to simulation time. Mission acceptance at time zero is valid. Persist timing/state consistently if save/load is added.
8. **Branch/access coherence:** a chosen branch invalidates incompatible offers; one active mission per arc stage; every mandatory station can be reached or has a declared alternative. Reputation changes must not silently undo the route to the next mission.
9. **Feasibility preflight:** required equipment, cargo size/units, purchasing budget, source stock, destination acceptance, route/time budget, enemy loadout, and protected-asset survival. Test ordinary ships, not only the all-upgrades test ship.
10. **Useful feedback:** every failed action returns a visible reason; every terminal failure stores its cause and offers the correct recovery. HUD tracks the chosen mission, actual next destination/target, deadline, target health, escort health, and stealth state.

For defeat/escape attribution, decide policy explicitly: does a third-party kill count, must the player assist, can a disabled convoy surrender, can abandoned cargo be recovered, and does fleeing an encounter fail or merely leave it pending? There is no universally correct answer, but each mission needs one.

## 4. Feel and pacing

### Travel: long legs currently contain too little agency

The inner cluster is compact; local travel is not inherently too long. The outer cluster and Hidden Cove are a different matter.

Approximate straight-line times at measured full-thrust cruise speed, before acceleration, docking offsets, and navigation mistakes:

| Route | Distance | Starter freighter | Starter clipper |
|---|---:|---:|---:|
| Sol City -> Greenfields | 128 | 13 s | 6 s |
| Sol City -> Refinery | 165 | 17 s | 8 s |
| Greenfields -> Freeport | 1,119 | 113 s | 56 s |
| Aurum -> Drydock | 1,254 | 126 s | 63 s |
| Sol City -> Hidden Cove | 1,674 | 169 s | 84 s |

These are estimates from source coordinates and simulated velocities, not recorded human completion times. Actual docking shortens a leg by up to its approach radius; turns, approach, and mistakes add time. Cross-cluster round trips still require several minutes of holding movement keys.

Drag makes advertised speed misleading. At 60 Hz, the starter freighter cruises around **9.92**, clipper **19.85**, miner **8.11** despite listed maxima of 11, 20, and 11. In continuous terms terminal speed is approximately `acc / drag`, bounded by `vmax`. Buying a maximum-speed upgrade alone can accomplish nothing when acceleration/drag is the actual limit.

**Recommended changes:**

- Add a **cruise drive**: short spool-up, high speed outside encounter/station zones, braking/approach assistance, visibly distinct from combat movement. Initial target: most routine cross-cluster trips take about **25–45 seconds**, while local legs remain quick. Tune with players.
- Add route/autopilot assistance and ETA. Autopilot should remove constant key-holding, not play combat or stealth for the player. Cruises cancel or slow with a telegraphed threat and a safe reaction window, not an unannounced instant hit.
- Keep simulated world time coherent during fast travel. Do not speed up the player while leaving deadlines/escorts/production in inconsistent clocks. Prefer a physical cruise mode over arbitrary global time compression initially.
- Give everyone a basic map/compass and mission waypoint. Reserve trade analytics, remote stock intelligence, and route optimization for Navigation upgrades. Basic orientation should not be an upgrade tax.
- Fix Set waypoint: `src/ui/components/hud/ObjectiveHUD.tsx:130–154` selects the contract target or nearest station, not the story mission's next destination. `MissionMarkers` also misses ordinary visit targets because it looks for `targetStation` rather than their `target` field.
- Allow planning while cruising: inspect the mission journal, plan return cargo, monitor news, and choose a detour. Mission information should not require being docked.
- Reduce forced return legs: remote report completion for routine missions; keep physical returns when handing over unique cargo or having an important conversation is the point.
- Rework propulsion so upgrades affect measured speed as advertised. Display actual speed and ETA rather than only an engine-power percentage.

### Combat should create decisions, not require ramming a target

Start with a readable arcade trading-game combat model, not a large combat simulation:

- Aim independently of velocity; add reticle, selected-target cycling, range indication, modest aim assist, and projectile lead indicator. The present fire direction follows movement, making shooting and evasive maneuvering fight each other.
- Fire while Space is held in the simulation loop, with weapon cooldown there; do not rely on OS key-repeat timing.
- Show hit confirmation, damage, incoming-fire direction, hull, energy, weapon cooldown, and protected-asset health. Use distinct sound/visual feedback for misses, armor hits, low energy, and target destruction.
- Give enemies roles: interceptors harass, bombers threaten escorts, haulers flee/surrender, turrets control approach lanes. Publish target intent so the player can prioritize.
- Offer trader-friendly alternatives: pay a toll, outrun a raid, call a faction patrol, disable engines, surrender selected cargo, or use an escort token. Not every trading encounter should demand a kill.
- Supply repairs, insurance, checkpoint recovery, and sensible equipment recommendations. Avoid missions that assume an expensive gun whose purchase UI does not exist.
- Design a small encounter around a few decisions over roughly 30–90 seconds; use longer battles only for well-signposted finales. Do not equate more HP or endlessly spawning pirates with depth.

### Stealth needs controllable risk

A radius plus ten-second suspicion timer is a starting scaffold, not a satisfying stealth loop. The player needs ways to influence exposure:

- Visible patrol/scanner sweeps and scan countdowns, not invisible failure radii extending into a friendly station's menu.
- Low-signature/silent-running mode that trades speed or energy regeneration for lower visibility.
- A few intentional occluders or cover corridors; avoid adding a full occlusion simulation unless the routes use it.
- Clear distinction among suspicion, scan lock, confirmed contraband, and combat alert.
- Counterplay: break line of sight, leave the scan cone, use forged paperwork, bribe, spend an ally favor, or choose a longer safe route.
- Downloads/installations with location-bound progress and auto-completion. If a patrol interrupts, the player responds to the patrol; success should not hinge on releasing a mouse at exactly 30–35 seconds.
- No guaranteed conflict between mandatory 30-second interaction and ten-second detection. Author phase-specific scan rules or give an actual countermeasure/cover route.

### Escort pacing should respect the player's preparation

- Start with a launch confirmation rather than moving the escort as soon as Accept is clicked.
- Keep the player within a useful engagement distance, with regroup/hold signals and clear warnings if the convoy leaves protection range.
- Use a shared route and preauthored ambush opportunities. A short trip should not claim three waves that physically cannot occur before arrival.
- Give survival thresholds and remaining attack count before launch. Offer reduced rewards for declared partial success, not contradictory internal `failed` flags.
- End decisively: arrival, threat resolution, reward, cleanup. Never leave a mission active forever because one irreplaceable NPC vanished.

### Routine work should not be a collection of friction traps

- Replace hold traps with forgiving progress operations, keyboard-accessible controls, and resumable work where appropriate.
- Stop global flight/action keys while typing in inputs or interacting with dialogs; clear held keys on blur/visibility change (`src/input/use_game_input.ts`).
- Give immediate visible explanations for a failed purchase, capacity/equipment limit, unavailable mission, or exhausted active-mission slots. Some current failures only log to the console.
- Add cargo manifests, buy-max/fill-order actions, and explicit mission turn-ins distinct from ordinary market sales.
- Tie food freshness to comprehensible handling decisions. Current cargo decay runs while docked too, and temperature-controlled cargo enables trading but does not slow the five-minute decay. State that clearly or make refrigeration actually preserve goods. Check mission minimum freshness and menu-time policy.
- Add save/resume and checkpoint recovery before expecting players to invest in multi-arc campaigns; the current store has no persistence implementation.

## 5. Make the world dynamic through consequences, not constant interruptions

The repository already has production, consumption, NPC trade, character relationships, factions, and narrative effects. **Connect those existing systems before introducing a larger feature list.**

### First: make missions visibly change the economy

Examples of a coherent loop:

1. Pirates intercept a refinery convoy.
2. Fuel delivery fails, reducing a particular station's actual reserves.
3. A bounded shortage raises its fuel/battery prices and creates an emergency contract.
4. The player can profit, replace the shipment, or escort the next one.
5. The station recovers; its news and character dialogue acknowledge the player's intervention.

Likewise, Greenfields independence should alter permitted trade routes/tariffs, Fabrication Wars should alter real production/contracts, and peace should visibly change patrol/raiding behavior. These changes make repeated journeys different without requiring a random fight every trip.

### Then: a small, optional encounter pool

Use an encounter director with a cooldown, per-route exposure budget, faction context, and an escape/decline path:

| Encounter | Meaningful choice | Persistent result |
|---|---|---|
| Distress beacon | Divert time/cargo, call help, or continue | Survivor contact, reputation, recovered cargo, or missed opportunity |
| Customs patrol | Safe lane, scan, paperwork, bribe, or evade | Access/trust/legal status; not automatic combat |
| Damaged trader | Sell repairs/fuel, tow/escort, or ignore | New trade contact and a delivered or failed shipment |
| Salvage signal | Investigate, buy coordinates, or avoid risk | Actual cargo/blueprint, possible ownership dispute |
| Localized hazard | Safer slower route versus fast dangerous corridor | ETA, cargo condition, temporary shipping disruption |
| Live procurement offer | Detour or keep current contract | Real stock movement, reputation, temporary route opportunity |

Do not add all of these initially. Implement **two or three polished event types** whose outcomes feed the existing economy. Most should be avoidable. Players on their fifth cargo run should not be forced into their fifth identical ambush.

### Differentiate missions through approaches

Avoid solving every narrative with 'visit several stations and click Deliver':

- Convoy sabotage: negotiate a diversion, disable the ship, steal a manifest, or destroy it, with different reputation costs.
- Stealth acquisition: forged docking authority, a silent approach, a risky remote download, or an ally contact.
- Economic warfare: reserve stock, disrupt a supplier, win a logistics race, or expose price manipulation with actual market evidence.
- Negotiations: choose which accurate dataset to disclose, mediate a concession, or protect an informant instead of doing the same six-station lap twice.

Keep variants within a small reusable set of well-tested mechanics. Narrative choices only feel meaningful when the world and next playable objectives differ.

## 6. Verification plan and definition of playable

### Immediate automated suite

Use the project-pinned toolchain; do not count a differently versioned `npx` download as validation. Existing Vitest coverage is narrow and contains stale fixtures (e.g. invalid objective types and incomplete weapon definitions). In this environment the earlier Vitest invocation could not run because dependencies including `jsdom` were missing; typechecking also reported substantial errors. The direct Node reproductions above bypassed those runner issues, but are not a replacement for restoring the normal suite.

Required tests:

- **Template validation:** every target/station/commodity/effect exists; intentional mission items are registered; every nonterminal branch reaches a finale; no obsolete duplicate offers; dependencies have no cycles; choices resolve to valid exclusive branches.
- **Every template:** a legal success sequence, wrong-location/target/quantity sequences, out-of-order sequence, each defined failure, recovery/retry, exactly-once rewards, exact world effect, NPC/state cleanup, and next offer.
- **Combat integration:** actual fire action -> collision -> damage -> victim destruction -> mission credit. Include hitscan direction/range, projectile tunneling, third-party/assist attribution, faction hostility, escort damage, and defeat recovery.
- **Batching:** multiple kills in one tick, several missions affected by a sale, simultaneous success/failure, final kill at deadline, detection and delivery ordering. No lost events, duplicate rewards, or first-completion early-return starvation.
- **Stealth:** entering/leaving scan zones, docked policy, carrying/not carrying contraband, optional invariant failure, multiple missions watching one station, installation interruption and relocation.
- **Escorts:** required escort loss, allowed casualty count, arrival before/after waves, stragglers, missing NPCs, overlapping waves if supported, no infinite reinforcements, abandon/retry cleanup.
- **Access/feasibility:** cross-arc choice combinations, minimum eligible ship/equipment, depleted source stock, insufficient funds, full hold, perishable quality, permanently closed stations.
- **Clock/performance independence:** 30/60/144 Hz, long frame, hidden tab, pause, zero-based clock, and save/resume. Seed randomness and inject clock for reproducibility.

### Browser playtest checklist

1. Fresh freighter game: understand navigation, get first mission, source cargo, deliver, and find next story step without developer knowledge.
2. Fresh clipper/miner: confirm no starter option is unknowingly trapped by money, handling, cargo, or equipment.
3. Complete every branch from an ordinary save/loadout, not only direct state injection. Record mission duration, travel share, failed interactions, and moments where the next action is unclear.
4. Deliberately lose combat, fail stealth, lose escorts, abandon, and retry. The campaign must remain usable.
5. Repeat five profitable routes. Record whether anything meaningful changes and how long the player spends simply holding a key.
6. Test accessibility: keyboard-only station actions, focus/blur, small display, readable threat indicators, and no required precision holds.
7. Profile representative busy combat/escort scenes. The current UI subscribes to rapidly changing store objects and `MissionMarkers` uses React state each frame; this is a performance risk to measure, not a proven FPS defect from this review.

Initial pacing metrics: empty transit duration, meaningful decisions per trip, time to first successful mission, failure causes, retry recovery time, percent of mission time spent backtracking, combat hit rate, and whether players correctly predict the consequence of a choice. Do not optimize only for more events per minute.

### Reproduction evidence

Temporary files used in this review:

- `/tmp/trader-review-loader.mjs`
- `/tmp/trader-playability-audit.mjs` (21 reproductions plus travel simulation)
- `/tmp/trader-playability-extra.mjs` (3 additional reproductions)
- `/tmp/trader-playability-results.txt`
- `/tmp/trader-playability-extra-results.txt`

Executed with:

```sh
node --experimental-strip-types --import /tmp/trader-review-loader.mjs /tmp/trader-playability-audit.mjs
node --experimental-strip-types --import /tmp/trader-review-loader.mjs /tmp/trader-playability-extra.mjs
```

These scripts deliberately assert the observed defects to verify the review, not desired behavior; they should be converted into proper regression tests with corrected expectations during implementation.

## 7. Suggested implementation sequence

**Milestone 1 — Trustworthy playable slice:** restore pinned build/test tooling; repair hitscan and enemy/escort damage; centralize mission transitions/events/clock; implement typed deliveries/collection, retry and defeat; expose essential combat services/HUD. Make one delivery, one combat, one stealth, and one escort genuinely work end to end.

**Milestone 2 — Complete campaign correctness:** migrate all 30 templates (remove the obsolete duplicate), enforce branches and prerequisites, implement or rewrite every advertised task, apply real effects, solve cross-arc access, and run the per-template success/failure/retry suite. Do not declare an arc complete just because its status changes.

**Milestone 3 — Better handling and less dead time:** cruise, reliable waypoint/ETA, basic map, movement-independent aiming, forgiving interactions, remote reporting where appropriate, save/checkpoints, and mission pacing adjustments based on actual playtests.

**Milestone 4 — Dynamic world:** repair market events/shortage baselines, connect mission outcomes to real shipping and production, then add a small context-sensitive encounter pool and alternate approaches.

**Bottom line:** make the game trust the player's actions, then respect the player's time, then surprise the player. Right now it too often does none of those consistently.
