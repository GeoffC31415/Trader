# Open-world journal and ship safety

These changes follow Alpha 2 on the stacked `feat/open-world-journal` branch. The existing `playtest-alpha-2` archive is unchanged; use a build of this branch to test them. This is an implemented feature pass, not human certification of balance, accessibility, performance or a complete campaign.

## Ship fires, repairs and suppression

- Surviving combat damage ignites an onboard fire when hull is at or below **35%**. Low hull alone does not invent a new fire.
- A burning ship loses **0.5 hull per simulation second**. The HUD and journal warn about the fire; the ship's fire effects follow its actual burning state. Low-hull smoke remains a separate damage cue.
- **Successful docking at any accessible station extinguishes the fire for free.** It does not heal hull, charge repair fees, or grant access to hostile/denied stations. Stale fire-warning toasts are removed when extinguished.
- Drydock's **Shipyard Office → Hull repair & safety** offers repair/recharge and automatic suppression. The existing docked HUD repair button remains available too.
- Repairs cost **ceil(missing hull × 5) credits**, restore hull and energy, and extinguish fire. Insufficient funds do not spend credits or repair the ship.
- **Automatic fire suppression costs 3,500 credits**, once, at a shipyard. It extinguishes a fire after **three simulation seconds**, without restoring hull or requiring consumables. It survives ship replacement and checkpoint reloads.
- Timers/damage pause with the simulation, blocking dialogs and hidden tabs. A lethal fire uses normal insurance recovery, which clears the fire. Fire state, elapsed suppression time and installed equipment are saved.

These damage, timer and price values are provisional tuning choices. Suppression is not damage immunity; another damaging hit at critical hull can start another fire.

## Commander journal

Open **Journal** in the top navigation. It has eight pages, responsive layouts, live telemetry sampled once per second, searchable/paginated archives, station/goods filters and an explicit simulation pause button. Opening it does **not** automatically pause the world. Hull integrity stays in the header and an active fire has its own warning.

| Page | What it shows |
| --- | --- |
| **Command deck** | Current faction standings, the real political journey, cosmetic career rank and operational milestones. No invented XP, players, rewards or gameplay bonuses. |
| **Allegiances** | Faction reputation derived from actual station standings, per-station reputation, political progression, before/after reputation changes, exact station deltas and the transaction context. |
| **Trade ledger** | Purchased/sold quantities, spending, receipts, cashflow and known realized profit, grouped by station or goods; recent transaction receipts; separate non-trade income/spending. |
| **Ship & systems** | Current hull, energy, propulsion, cargo, installed upgrades and engineering/fire/repair history. |
| **Manufacturing** | Actual player conversions and passive production, station locations, inputs/outputs, effective ratios and equipment/access requirements; waypoint tracking and recorded player conversion history. |
| **Market observatory** | Historical public purchase/sale quotes for a station and commodity, with hover/focus readouts. |
| **World chronicle** | Active market events, enacted campaign consequences and archived start/end/temporary-window-expiry events. |
| **Trade routes** | Existing market-intelligence route suggestions, still requiring that upgrade and clearly labelled estimates rather than guaranteed net profit. |

Political and price-chart nodes support keyboard focus as well as pointer hover. Their readouts identify the event, coordinates or quote, and available simulation time. The political graph uses the player's actual contribution history, not the former dummy-player presentation. Journal keyboard interaction does not issue flight commands.

World labels, mission annotations and navigation widgets are layered below the journal instead of appearing over its charts. Small windows use a horizontally scrolling page selector and an internally scrolling content area.

## Accounting and manufacturing rules

- Trade statistics use actual recorded purchases, sales and fulfilled-order premiums. Purchase-order bonuses, story budgets/fees/reimbursements and other wallet movements are **not silently called trade profit**.
- Cashflow is receipts minus purchases; **it is not realized profit**. Unsold cargo can make cashflow negative without being a realized loss. Manufacturing can also transfer acquisition cost between goods, so per-goods cashflow/profit need not reconcile in isolation.
- Missing historical cost basis is marked **unknown**, not guessed to be profitable. Quotes are public board values, not necessarily the discounted/penalized prices actually paid by this ship.
- Consumed manufacturing input cost transfers into the weighted output cost basis. Free mining/salvage is weighted into existing paid holdings rather than leaving an inflated per-unit cost. Owned escort goods remain part of the cost calculation.
- Fractional manufacturing requests and output overflow are rejected. Manufacturing cannot evade the active Sol City luxury-procurement restriction.
- The directory and fabrication UI show only conversions that the current input-based runtime can actually select. An ambiguous second conversion for the same input is not advertised as executable. Passive production is identified separately from player fabrication.
- Faction influence is reported with exact station before/after changes and faction snapshots. A shared simulation transaction can contain several actions; its context is not a new causal simulation. Normal price noise is not logged as a reputation-changing action.

## Persistence and history limits

The browser-local checkpoint remains the same **single slot** and still needs the same browser profile and origin. Loading replaces state without replaying journal entries, purchases, income or rewards.

- Latest **600 journal events** retained.
- Latest **500 trade receipts** retained.
- **Cumulative station/goods totals survive both trimming windows** once journaling is active.
- Price boards retain **60 samples per station/goods**, sampled every **30 simulation seconds**: roughly 30 minutes when the buffer is full, not an unlimited historical database.
- Old checkpoints seed trade analysis from their retained receipts. Earlier discarded trades, missing cost basis, past upgrades/rep changes/world events, and unlogged non-trade income/spending cannot be reconstructed. The journal discloses these gaps. Political history without a simulation timestamp remains usable without pretending the time is known.
- Optional journal data is schema-validated with finite accounting, ordered event/time IDs and bounded windows. Corrupt data is rejected, not silently substituted into the running campaign.

## Verification and human retest

- **205 unit/DOM/integration tests across 20 files**, typechecking and production build pass.
- **Six development Chromium browser tests** pass. The new journal test uses actual store trades and weapon projectiles, real UI charts/filters/shipyard purchases, fire damage/extinguishing/suppression and save/reload. Political/world/price prerequisites and shipyard travel are explicitly **arranged fixtures**, not evidence of earned campaign progression.
- The **UI-only fresh tutorial/checkpoint test also runs against production**. It flies/trades normally, verifies actual credit balance across reload, then checks the saved journal's fuel quantities and historical-price page. It does not import the store, inject cargo/position, or accelerate time.
- Desktop, 640px-window, chart, manufacturing and shipyard screenshots were inspected. Software-WebGL Chromium is not real-GPU performance certification, human accessibility validation or a balance playtest.

Please retest from a normal save: take damage, dock while burning, distinguish extinguishing from repair, buy suppression, and verify its timing after save/reload. Compare journal quantities/profit with invoices, complete a political choice and inspect its tooltip, use manufacturing directions, wait for real price samples/world-event expiry, and check readability/focus at your normal window size. Report the revision, acquisition invoices and before/after balances for accounting findings.
