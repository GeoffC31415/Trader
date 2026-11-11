# Playability implementation

This implements the correctness work and the initial travel/world improvements from [the baseline review](PLAYABILITY_REVIEW.md). The review describes the old implementation; use this document for the current behavior and remaining validation needs.

## Branch stack

The branches are deliberately stacked, not independent alternatives. The final verification branch contains all previous work.

| Branch | Main change |
| --- | --- |
| `feat/playability-foundation` | Pinned toolchain, finite hitscan/swept collisions, hostile fire and vulnerable escorts |
| `feat/mission-lifecycle` | Authoritative story contracts, custody, ordered objectives, retries, branches and finite escort waves |
| `feat/world-consequences` | Executable effect registry, noncompounding prices, production/fabrication/access consequences, market scheduling |
| `feat/flight-and-mission-controls` | Cruise, aiming/target selection, services, in-flight mission log, checkpoints and pause |
| `feat/contextual-travel-encounters` | Optional salvage, distress and procurement opportunities; DOM/input tests |
| `fix/playability-integration` | Commodity contracts, cargo ownership, defeat priority, bounties, character history, graphics controls and browser tests |
| `test/playability-verification` | Cross-system regressions, every choice branch, validated checkpoints for every live mission, route-paced escort waves and final integration fixes |
| `chore/playtest-readiness` | Integrate the existing error boundary, fix fresh-start tutorial/navigation issues, avoid compatibility-model preloads, and package a checked alpha build |
| `fix/alpha-player-feedback` | Credit sale revenue, restore legacy sale credits, protect contract finance, theme/search/track assignments, start music correctly and add close docking/recovery/damage feedback |

The gameplay branches left pre-existing entry point/error-boundary work untouched. The readiness pass integrates and tests that boundary with explicit children typing. The unrelated `tsconfig.json` and `run_trader.sh` work remains separate.

## Mission engine

`src/state/modules/mission_runtime.ts` is the authoritative story runtime. The old unused trade-action implementations and placeholder permanent-effect helper have been removed. Commodity contracts have a separate, small implementation in `src/state/modules/missions.ts`.

- Objectives have ordering/prerequisites and explicit station, commodity, basket or mission-item requirements.
- Deliveries consume actual owned goods; owned contract-escort cargo can also be handed over. Destination inventory receives the real commodity quantities.
- Documents have mission-scoped custody. They are not inferred from an unknown commodity name, and cannot bypass their pickup prerequisites.
- Purchases and mining emit acquisition events. Combat emits mission-scoped destruction events only for player-attributed lethal hits.
- Event replay and simultaneous kills are handled without stale snapshots. Failure/deadline checks precede completion; rewards, arc advancement, political scores and world effects are applied once.
- Failed/cancelled missions can be reset and accepted again at the issuer. Mission-owned NPCs, stealth/wave state and tagged enemy projectiles are cleaned up. Procurement grants are never paid twice.
- Ship defeat fails active story missions before a simultaneous final kill can award completion. Insurance restores hull/energy at an accessible port, retains cargo and charges at most 1,000 credits. If every port is hostile, Freeport provides an emergency neutral recovery berth.
- A disabled player cannot thrust or fire before recovery.
- Mission clocks use simulation seconds. Pausing, hiding the browser tab, or opening a blocking briefing/choice/celebration freezes the simulation; a background tab cannot silently exhaust deadlines.
- Commodity contracts use simulation milliseconds, including offer expiry and a seven-minute accepted delivery deadline. Expiration cannot pay a late completion bonus or repeat its penalty. Loaded escort cargo remains owned and sellable after cancellation.

### Authored campaign changes

There are **29 live templates**. The obsolete generic fabrication-stage-3 prototype remains marked deprecated and is never offered; the two actual branch-specific assignments replace it.

- All political choices select an exclusive route. The original descriptions of invisible raids, boycotts and cargo transfers were rewritten as honest political commitments, followed by the actual route assignment.
- Choice previews are generated from executable effect definitions, including hostility, closure and expiry, rather than unsupported narrative strings. The UI no longer truncates the consequence list to five entries.
- Fabrication procurement specifies copper/silicon purchases and real turn-ins. Its one-time grant is 4,000 credits.
- Both fabrication finales accept an explicit basket of 50 fabricated units, including partial deliveries; empty-hold completion is impossible.
- The Ceres finale requires 50 purchased fuel units and their actual handover, with a one-time 5,000-credit budget.
- The initial Greenfields luxury assignment has a minimum one-time 7,000-credit procurement budget; its completion reward is separate. Alpha 2 adjusts funded procurement budgets to legal supplier quotes and reimburses recorded turn-in cost above that working budget.
- The Greenfields food finale requires refrigerated cargo equipment before acceptance. Refrigeration meaningfully slows spoilage; docked goods do not spoil.
- Covert downloads/installations are resumable timed interactions, not precision mouse-release tests. They progress while docked, or under silent running within 100m. Moving away pauses the operation. Documents and research contacts have local liaison access even when docking is denied.
- Suspicion applies to the actual covert assignments, including the Aurum and Ceres operations. Friendly docking does not build suspicion. The security radius is reduced from the reviewed overlapping zone.
- Convoys and turrets have explicit identity and behavior. Convoys wait for interception until approached, then move toward their destination; an escaped required convoy fails the assignment. Turrets are stationary, hostile targets. Their simple shapes differ in the scene.
- Story escorts wait for explicit launch. Launch requires the player to undock and join the convoy within 200m. Fuel escorts share the same destination, require two survivors, and face four finite waves. The inspector requires one survivor and three waves; the peace conference requires one survivor and two waves.
- Escort attacks are spaced by route progress and a minimum breather, rather than spawning every remaining wave immediately after the first fight. Station defense retains time-based breathing room. Waves never replace unfinished wave tracking.
- Union Crisis requires Union membership and two completed arcs. Later document contacts remain possible after Hidden Cove closure.
- The optional tutorial offers a specific refinery-to-Sol-City fuel contract instead of relying on whichever generated commodity contract happens to appear first. Contract navigation initially points at the supplier, switches to the destination when the required cargo is held, and the tutorial waits for all ten fuel units rather than advancing after one purchase.

## Combat, controls and feedback

- Lasers intersect a finite firing ray and choose the nearest hit. Moving weapons use swept segments bounded by remaining range and lifetime. A resolved beam cannot deal damage on later frames.
- Weapon upgrades preserve base/custom weapon statistics. Locked missiles steer toward their target at bounded speed; target assistance leads moving targets for projectile weapons.
- Hostile NPCs initialize aggression from their authored flags. Cooldowns use injected simulation time, not a fresh random chance per frame.
- Enemy fire can damage friendly escorts. Enemy-caused civilian deaths do not count as player kills or impose player kill penalties.
- Baseline NPC weapons are deliberately forgiving (3 damage, 1 shot/second, 450m range), with at most two simultaneous player firing slots. Raiders still prioritize protected escorts. These are provisional balance values, not a claim that combat has been human-balanced.
- Hold Space to fire; use the mouse for independent aiming or Tab to select a nearby hostile/mission target. The HUD shows target hull/range, player hull/energy, escort hull and wave progress.
- Docked services provide repairs/recharge; Drydock provides weapons and upgrades. Missile targeting requires market intelligence.
- Silent running halves normal speed, disables weapons and reduces signature/suspicion buildup. Cruise disables weapons and requires station clearance and no nearby aggressive ships.
- Input clears on lost focus; text/select fields do not fly or fire the ship. Buttons retain normal keyboard activation and Tab navigation. Pointer-operated flight controls release button focus so holding Space does not re-activate the last clicked control.
- Middle-drag orbits the camera and the canvas wheel zooms. Camera gestures do not capture scrolling over UI panels.
- Mission completion/failure, ambush waves, market changes and optional opportunities produce bounded notifications. Character memory records visits, trade volume, mission outcomes and significant political actions; future dialogue can react to them.

## Travel and world behavior

- Full thrust can reach advertised maximum speed; drag now acts as a brake instead of cancelling engine upgrades.
- Cruise spools for three seconds, then provides six-times normal maximum speed and acceleration. It disengages near stations/aggressive ships.
- A basic map is available without an upgrade. Enhanced mission intelligence remains an equipment benefit.
- Waypoints use the current story destination. Ordinary visit objectives have markers. The HUD shows distance and current-speed ETA.
- The waypoint pilot handles routine station/opportunity approaches. Manual movement cancels it. A follow-escort control follows a protected ship without cruise; it is a navigation convenience, not obstacle-avoidance AI.
- Optional travel opportunities are bounded to one visible card, expire on the simulation clock and do not interrupt active combat/escort assignments:
  - **Salvage:** approach, check hold capacity and recover real goods. A clearly advertised risky cache can attract one temporary raider only after the player chooses to recover it.
  - **Distress:** supply real fuel for credits, reputation and local inventory benefit, or relay coordinates without obligation.
  - **Procurement:** a local station requests cargo already carried by the player, with a quoted premium; completion requires actual docking and cargo consumption.
- The law accord unlocks a real Sol City bounty terminal. A bounty requires a scoped player kill, has a deadline/cooldown, pays once and cleans up on cancellation/expiry.
- Every authored permanent-effect ID has an executable handler. Effects change station prices, stock, production, fabrication input costs/availability, access, defense replenishment or optional piracy risk. Freeport's refinery actually produces fuel.
- Temporary effects expire on the simulation clock. Price modifiers are projected from unmodified values, not multiplied into yesterday's modified price. Trading preserves the correct new stock-dependent baseline.
- First market news occurs after two simulation minutes; subsequent events use a persisted 5–10-minute deadline, not frame-dependent probability. Market modifiers expire without compounding.
- NPC route selection compares inventory against real target stock, rather than comparing each stock value with itself.

## Checkpoints and graphics

- Save/load and a 30-second autosave use a versioned browser-local checkpoint. Manual save and autosave currently share one slot; this is **not** a multi-slot or portable save system.
- Checkpoints retain cargo/economy, story state, NPCs, choices, effects, deadlines, political/relationship history and stealth/escort Maps. They restore paused and clear transient projectiles/UI state.
- Zod validates the checkpoint shape, current mission catalog and required world topology before any state is installed. Corrupt/future-version saves produce an error notification without replacing the running campaign. This is corruption protection, not anti-cheat protection.
- Loading is available inside the initial ship-selection dialog.
- Graphics preferences have compatibility, balanced and high settings. Compatibility uses low-resolution rendering and procedural ship/station proxies; high enables shadows. Environment lighting is local/procedural, so startup no longer depends on a remote HDR download.

## Verification

```sh
npm ci --ignore-scripts
npm test -- --run
npm run typecheck
npm run build
npx playwright install chromium
npm run test:browser
```

At the original gameplay implementation checkpoint (before the readiness pass below):

- **140 unit/DOM/integration tests** across eleven files pass.
- All 29 live templates have a successful contract-path test and a validated checkpoint round-trip test.
- Every authored choice option has branch-offer and exactly-once payout checks.
- Integration coverage includes real projectile damage and moving convoy/escort NPCs, hostile fire and loss, simultaneous defeat/final kill priority, enemy kill attribution, actual cargo/stock changes, covert operation interruption, grant-preserving retries, contract deadlines, retained escort cargo, bounty attribution and noncompounding price changes.
- Contract-path tests deliberately arrange cargo/location to isolate mission rules. Combat/escort integration also positions the player to model aiming/following. They do **not** prove that a human can complete every entire campaign route from a fresh save without grinding.
- Two Chromium browser tests pass with external HTTPS assets blocked: WebGL startup, held movement, pause, checkpoint reload, flight-log access, and a funded courier through actual purchase plus UI acceptance/turn-in/progression. The courier test arranges locations; it does not fly its full route.
- The browser tests use software WebGL and compatibility graphics. They are smoke tests, not an FPS benchmark or a subjective handling assessment.
- The committed gameplay tree built/typechecked in a clean worktree. The original working-tree ErrorBoundary props blocker is resolved by the subsequent readiness pass below.
- The production build still warns about the large application chunk. The existing dependency tree reports 19 npm audit advisories; no breaking major-version toolchain migration was attempted as part of gameplay work.

## Alpha readiness pass

The player-facing instructions, session checklist, save warning and bug-report template are in [PLAYTEST.md](PLAYTEST.md).

- Integrated the existing React error boundary and entry-point wrapper, fixed `children` typing and explicit empty fallbacks, and added six render/recovery tests. The actual working tree now typechecks/builds, not just a separate clean checkout.
- A UI-only fresh-start check found a tutorial bug missed by the earlier arranged-state test: contracts generated before starter selection were not replaced on the first Sol City docking. The docking transaction now creates the promised ten-fuel offer immediately; the regression models pre-existing random offers.
- The same check caught waypoint docking at a closer overlapping berth (Greenfields instead of Helios). Navigation now requests its intended station explicitly; manual E docking still selects the nearest berth. Explicit docking targets cannot bypass the 60m range/access rules. Procurement opportunities retain their requesting station as the docking target.
- Updated tutorial instructions to the actual Missions, Production and exchange tabs, and kept the authored completion message visible until Close tutorial is selected (it previously disappeared immediately). Removed eager GLB preloads so compatibility graphics does not fetch detailed ship/station/asteroid models, and migrated the deprecated Vite asset-glob option.
- **147 unit/DOM/integration tests across twelve files**, **four development Chromium browser smoke tests**, and **one UI-only production browser smoke test** pass. The added controls smoke arranges late-campaign offers and checks launch rejection while docked, actual escort launch, abandonment cleanup/reset/reacceptance, target selection and held fire causing real damage. It does not fly a complete escort battle.
- The fresh tutorial browser check uses only normal UI controls and real-time flight: normal Freighter, initial docking, contract acceptance, waypoint flight to Helios, ten-unit purchase, return flight, fuel sale/completion, save, page reload and paused restoration. No store imports, cargo/location injection, developer ship or accelerated clock are used in that test. It also asserts no failed HTTP assets, page errors or compatibility-mode GLB downloads.
- `npm run playtest:check` runs typechecks, unit tests, build and both browser suites. `npm run playtest:package` requires a clean revision, repeats those checks without reusing stale servers, and bundles `dist/`, the checklist, revision/toolchain/file-hash metadata and an archive SHA-256 checksum. See the checklist for extraction and HTTP serving. This is not a byte-identical archive guarantee.
- Existing dependency advisories remain **19** (1 low, 4 moderate, 11 high, 3 critical); the critical entries include development tooling (`vitest`, `@vitest/ui`, `tinypool`). Do not expose development/test UI servers publicly. Distribute the compiled static packet for this private alpha. Large chunks/assets still need release-hardening work.

At Alpha 1, screenshot inspection identified completed contract information remaining on the HUD, target markers overlapping panels, and tutorial runs ending roughly 150–200 credits below the initial balance despite the completion bonus. The loss was initially treated as a possible balance concern. **Alpha 2 investigation found an actual cash-credit defect:** ordinary sale revenue was calculated/logged but never added to the ship. This is repaired and covered by cash-balance tests, with limited legacy-ledger recovery. See the follow-up below; the earlier assessment was incomplete.

These are scripted browser exercises plus screenshot inspection, **not a human playtest**, hardware FPS measurement or proof of fresh-save completion of every campaign branch. No speculative balance changes were made in the readiness pass.

## Alpha 2: first player-feedback follow-up

See [the item-by-item fixes, financial rules, legacy checkpoint recovery and verification limits](PLAYER_FEEDBACK_ALPHA_2.md).

- Ordinary sales now pay actual revenue once. Older checkpoints recover the missing revenue from retained sale receipts, mark the economy ledger migrated, and do not replay bonuses or purchases. Unlogged/discarded history cannot be reconstructed.
- Delivery orders are sized to working capital, accept any legal supplier, lock a fresh-cargo payment floor, prevent purchases above active payment floors, and pay partial/bulk-multiple-order deliveries correctly. Their receipts include the order premium; completion bonuses remain separate.
- Funded story deliveries use quote-adjusted working budgets and recorded-cost reimbursement. Greenfields' covert order cannot purchase luxury goods at Sol City, and docking there with the cargo exposes the assignment. Briefings now describe real mechanics instead of promising nonexistent confiscation.
- Story cards use station-themed controls and a right-aligned offer action. Locked previews honor the chosen branch and display station names. Goods grids support text search. The HUD supports multiple live assignments, explicit delivery destinations, an overview and minimize/reopen; completed jobs disappear.
- Initial exploration music begins after the starter gesture, with retryable autoplay failure and cancellable transitions. Docking/prompt/navigation share a close 15m berth; only the nearest prompt appears. Recovery clears anger and provides 45 simulation seconds of ceasefire, ending if the player fires.
- Real damage drives bounded impact/spark/number feedback, a player-hit HUD cue, and persistent smoke/fire by hull severity. Reduced-motion and compatibility graphics have quieter effects. These are visual cues, not changes to collision/damage balance.
- **175 tests across 17 unit/DOM/integration files**, **five development Chromium smoke tests** and the **UI-only production tutorial/checkpoint test** pass, along with typechecking/build and clean-checkout packet generation. No human campaign completion or real-GPU performance claim is implied.

## Open-world journal and ship safety

See [the eight-page journal, accounting/history rules, fire mechanics and retest notes](OPEN_WORLD_JOURNAL.md). This follow-up is stacked on Alpha 2; the old Alpha 2 packet does not change.

- Actual low-hull combat hits can ignite persistent fires: 0.5 hull/second, extinguished by successful docking, paid repairs or a shipyard suppression system (3,500 credits; three-second automatic response). Saved timers use simulation time and recovery clears lethal fires.
- Authoritative store transitions record trades, faction/station influence, political history, engineering, crafting and world consequences. Bounded event/receipt windows have separate cumulative station/goods trade totals; legacy gaps are disclosed rather than invented.
- A responsive eight-page commander journal replaces the old presentation, with real political and public-price charts, keyboard/pointer readouts, manufacturing/production locations, ship systems, searchable archives and cosmetic ranks/milestones. Chart/UI refresh is sampled once per second, not every physics frame. The world continues unless explicitly paused.
- Manufacturing transfers acquisition cost to output, mining/salvage weight free inventory correctly, and the UI does not advertise an ambiguous input conversion that the runtime cannot select. Fractional/overflow and prohibited covert manufacturing are rejected.
- **205 tests in 20 files**, **six development Chromium smokes**, typecheck/build and the extended **UI-only production tutorial/checkpoint/journal test** pass. The new development journal/fire demonstration uses arranged campaign/price/world/travel prerequisites; production journal data comes from the real tutorial route. Neither is fresh-save human campaign completion or real-GPU certification.

## Still requires human validation or a separate content iteration

1. Play the actual complete campaign branches from fresh starter saves, including legal supplier access, reputation recovery, operation approaches, cargo financing, every loss/retry and mixed-arc access conflicts.
2. Measure route times and FPS on real hardware in balanced/high modes. Tune cruise, camera handling, enemy damage/engagement slots, escort spacing and rewards from those observations. The old review's timing table describes the old flight model.
3. Review keyboard-only focus, small-screen HUD overflow, readable target markers, audio consent/volume and color/accessibility with actual users.
4. Expand encounter variety only after testing this small optional pool. Richer faction patrols, inspections, branching distress stories, discovery/anomaly content and a larger encounter catalog remain design extensions, not secretly simulated systems.
5. Portable/multiple saves, obstacle avoidance, a larger economic simulation, richer stealth/security behavior, and a broader narrative-action catalog are not included here. The concrete existing mission tasks were made executable or honestly rewritten rather than pretending those larger systems already exist.
