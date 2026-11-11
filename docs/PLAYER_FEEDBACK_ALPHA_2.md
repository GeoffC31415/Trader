# Alpha 2: first player-feedback fixes

This is the follow-up to `playtest-alpha-1`, on the stacked branch `fix/alpha-player-feedback`. It addresses the first tester's report; it is **not** a claim that the whole campaign is human-validated.

## Critical finding: ordinary sales did not credit their revenue

`sellCommodity` consumed goods, updated inventory, calculated profit and produced a sale receipt, but returned the ship without adding the sale revenue to its credits. Contract bonuses were paid separately, which hid the defect in earlier tests focused on mission completion and cargo/stock changes. This was a correctness defect, not just unfavorable balance. Sales now credit their actual revenue exactly once. Regressions check cash balances, partial deliveries, receipts and repeated attempts to sell an empty hold.

The earlier readiness document's small tutorial loss was initially treated as a possible balance concern. That assessment was incomplete: the missing sale credit was a concrete underlying cause. Fresh tutorial testing now also checks the repaired flow; further human balance feedback is still needed.

### Existing checkpoints

The checkpoint format remains version 1, with an optional economy-ledger marker:

- New campaigns/checkpoints carry `economyVersion: 2`.
- Loading an older unmarked checkpoint restores the missing **sale revenue recorded in its retained trade ledger**, then installs the marker. Purchase costs and already-paid bonuses are not refunded/replayed.
- Repeated loading is replacement, not cumulative payment; saving/reloading the migrated campaign cannot pay the recovery twice.
- Recovery is limited to recorded sales (the ledger retains at most 500 trades). It cannot reconstruct older discarded transactions or unrecorded past story-procurement losses. No guessed windfall is awarded.
- A notification explains recovered credits. Stored story descriptions are refreshed from the current catalog without resetting progress, choices or objectives.
- The single browser-local manual/autosave slot is unchanged. Use the same browser profile and origin to load an existing campaign.

## Response to each reported issue

| Tester feedback | Change |
| --- | --- |
| Ambient music only starts after docking | No playback is attempted before a player gesture. Selecting a starter now starts the first exploration track; failed autoplay is retryable. Track requests/crossfades are cancellable so a late exploration request cannot replace newly requested station music. |
| Dock prompt appears much too far away / may overlap | Actual docking, its prompt and the waypoint pilot now share a **15m** range, rather than 60m. Only the nearest berth gets a prompt. The new starter position remains within reach of Sol City. Informational scene labels do not steal camera/pointer input. |
| Completed tutorial contract remains at 10/10 | The tracker selects only accepted commodity contracts and active stories. Completion clears its active objective ID. A remaining navigation waypoint is labelled separately and can be cleared; the objectives panel can also be minimized. |
| Accept mission appears after the description, not aligned right | Story offers use a responsive two-column card: narrative/objectives on the left, completion fee and action on the right. |
| Breaking the Chain can simply use Sol City | Sol City refuses luxury purchases for this active covert assignment. Docking there with luxury goods immediately exposes/fails it; passing through its inspection zone still uses suspicion and silent-running rules. Existing cargo is allowed; there is no fabricated patrol or mandatory invisible encounter. |
| Story handover has no sale price / drains procurement funds | Story handover is explicitly **not a market sale**. Funded missions get a one-time working budget based on legal supplier quotes (at least the authored grant). Recorded delivered acquisition cost above that budget is reimbursed at handover; the completion fee is separate. Budget/reimbursement accounting survives reset/retry and cannot be paid again by replaying a completed turn-in. Unfunded story deliveries still have their stated gross reward and costs. |
| Story cards look unlike the Market | Offers, active objectives, ended attempts and reputation locks now use the existing station-themed panels, headers and buttons. |
| Siding with Sol City shows Greenfields' Supply Cut lock / raw IDs | Locked-offer previews now honor the selected branch: the opposite branch is not advertised as merely reputation-locked. Actual reputation requirements use station names such as **Greenfields Farm**, not `greenfields`. |
| Hard to find batteries / want free-text search | Exchange/bazaar and production grids support case-insensitive partial-name search, multiple terms, clear and no-match feedback. This filters the display, not the inventory/economy. |
| Delivery tracker should name the destination, not mandate a supplier | Every commodity tracker explicitly names its delivery station and says any legal supplier is allowed. Normal contract navigation targets delivery immediately. The tutorial alone retains a suggested refinery procurement waypoint until the ten units are held, while still naming Sol City as the delivery destination. |
| Track several active assignments | A compact selector, all-assignments overview and minimize/reopen control support any mix of active stories and deliveries. Finished/failed jobs drop out. A bulk sale can also fulfill multiple matching orders without losing the later orders' payment protection. |
| Battery delivery loses a fortune / cannot finance the lot | In addition to repairing missing revenue, generated quantities reserve 20% of current credits rather than routinely requesting unaffordable 40-unit lots. Acceptance locks a fresh-cargo unit-payment floor (at least the procurement quote plus 15%, or the quoted premium sale price if higher), with a separate completion bonus. A cheaper market cannot erase it. Purchases above the lowest relevant active order's floor are rejected **before** spending money; choose another supplier, fulfill that order, or abandon it to speculate. Partial delivery pays immediately. Suppliers remain optional. |
| Respawn immediately returns to combat | Recovery clears anger records, firing cooldown records, transient shots/impacts and incidental aggressive flags. NPC fire and new station-defense spawning stand down for **45 simulation seconds**, ending early only if the player actually fires. The HUD shows the ceasefire. Political station hostility is not erased forever. |
| Hits need obvious damage-scaled effects | Actual damage creates a short-lived impact burst, sparks and floating damage number for player/enemy hulls. Player hits also show a bounded red edge flash and hull-hit notice. Scaling uses applied damage, not overkill; missed/resolved beams cannot replay the effect. |
| Damaged ships need smoke/fire | Ships below 70% hull emit procedural smoke; below 35% the plume includes fire. It follows movement and disappears after repair/recovery. This includes NPCs and escorts. Effects are bounded, lower-detail in compatibility mode, and do not require textures or extra lights. Reduced-motion preference removes expansion/moving trails and the red edge flash, retaining damage text/static hull cues. |

## Financial rules and limits

- Ordinary trading is still market-priced and can be unprofitable. A commodity contract is a purchase order with a fresh-cargo payment floor, not a claim that every available market route is safe.
- Spoilage discounts still apply to delivered perishables. Old cargo bought expensively before accepting an order is not retroactively guaranteed profitable.
- Hostility, port closure, deadlines and cargo capacity still matter. Cancelling/failing a contract retains owned goods; it does not refund arbitrary purchases.
- Story procurement funding and commodity-order payments are different systems. Story turn-ins do not receive an extra market sale payment on top of reimbursement and their completion fee.
- The Sol City inspection rule is concrete, but there is no expanded patrol/search/confiscation simulation. The briefing now says the assignment fails and cargo is retained; it no longer promises nonexistent confiscation.

## Verification

- **174 unit/DOM/integration tests across 17 files** cover every live mission's existing contract paths plus new cash-credit, fixed-price/partial/multiple-order settlement, unaffordable offers, purchase rejection, procurement funding, inspection, ceasefire, checkpoint migration, HUD/search/styling, music startup/retry/races, close docking and damage-event/scaling/expiry regressions.
- **Five development Chromium smoke tests** cover real music playback after starter selection, held flight/fire, mission controls, search, multi-assignment tracking, close prompts, themed offer alignment, cargo turn-in and checkpoint load. Actual incoming projectile damage drives the hit UI in the combat smoke test; some campaign locations/offers/weapon preconditions are deliberately arranged.
- The **UI-only production tutorial/checkpoint test** remains separate: ordinary Freighter, real flight/trade actions, no arranged cargo/location or accelerated clock. Production build/typechecking and a clean revision-labelled alpha packet are checked with `npm run playtest:package`.
- Screenshot inspection covers the themed story cards and incoming hit feedback. These checks do not establish subjective combat quality, audible quality on a tester's sound setup, hardware FPS, accessibility completeness, or full fresh-save campaign feasibility.

The next human pass should reload the previous checkpoint, confirm any ledger recovery, repeat ordinary buy/sell and the tutorial, then try the Greenfields covert procurement and a normal battery delivery. Record before/after credits and actual invoices. Please also assess whether the new effects are readable or distracting and whether 15m docking feels appropriate in balanced graphics.
