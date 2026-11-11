# Trader — focused alpha playtest

**Ready for feedback, not a polished release.** Please test whether objectives are understandable, missions are achievable, and travel/combat are enjoyable. Bugs, confusion and boredom are all useful findings. You are not expected to finish the campaign in one sitting.

## Run the packaged build

1. Extract `trader-alpha-<revision>.tar.gz` into an empty directory.
2. In that directory, run `python3 -m http.server 4173 --bind 127.0.0.1` (Python 3 required), or serve it with another static HTTP server.
3. Open **http://127.0.0.1:4173** in a current desktop Chromium/Chrome/Edge or Firefox with WebGL enabled. Do **not** open `index.html` directly.
4. Keep this address/port and browser profile for subsequent sessions. Saves belong to that browser origin, not the extracted directory. Opening another copy at the same origin still uses the same save.
5. Start with **Low — compatibility** graphics if loading or rendering is slow. It uses simple models. Balanced uses detailed models; High adds shadows. Report your setting, browser, GPU and approximate frame rate/stutter.

The archive filename identifies the revision. `playtest-build.json` contains the full commit, toolchain/lockfile information and SHA-256 hashes for the build files. The adjacent archive `.sha256` checks transfer integrity; it is not a signed authenticity guarantee. For a shared host, serve the files at the site root over HTTPS and give each tester a stable URL.

### Save warning — please read

- **Manual Save and the 30-second autosave share one browser-local slot.** A new campaign can overwrite the previous one; there are no portable exports or multiple slots.
- Use a **separate browser profile** for a genuinely fresh campaign without losing your main checkpoint. Private browsing is temporary and may lose its save when closed.
- Loading restores **paused**. Press Resume when ready. Browser storage clearing, changing browser/profile/host/port or blocking storage can make a save unavailable.
- Pause before leaving a session. Pause, hidden tabs and blocking briefings/choices/celebrations freeze the simulation and deadlines; merely opening the mission log does not.

## Changes for returning Alpha 1 testers

Detailed change and verification notes: [PLAYER_FEEDBACK_ALPHA_2.md](PLAYER_FEEDBACK_ALPHA_2.md).

Alpha 2 repairs a missing-sale-revenue bug. Loading an older checkpoint restores missing sale credits from its retained trade ledger once; a notification explains the amount. This cannot reconstruct discarded older trades or unrecorded past story-procurement losses. Existing progress remains, and manual/autosave still share one slot. Use the same browser profile and origin as before.

Story cards now distinguish procurement budgets/reimbursement from completion fees. Normal delivery orders accept any legal supplier, show their exact destination, lock a fresh-cargo payment floor and prevent purchases above that floor. Ordinary trading and spoiled cargo can still lose money. The objectives tracker now supports multiple assignments and can be minimized. Please specifically retest these, first-start music, 15m docking, recovery ceasefire and combat damage effects.

## Essential controls

| Action | Control |
| --- | --- |
| Move on the flight plane | W / A / S / D |
| Move vertically | R / F |
| Dock within 15m / undock | E / Q |
| Aim / fire continuously | Mouse / hold Space |
| Cycle nearby targets | Tab while flight has focus |
| Cruise (three-second spool, weapons disabled) | C, clear of stations and aggressive ships |
| Silent running (slower, weapons disabled) | H |
| Follow tracked waypoint | T or Waypoint pilot; manual thrust cancels it |
| Orbit / zoom camera | Middle-drag / wheel over the scene |
| Pause | P or Pause button |
| Assignments, turn-ins, operations, retries | Mission log button, including in flight |
| Save / load | HUD buttons; Load also appears at starter selection |

Tab navigates buttons when UI has focus. Keyboard flight is suppressed in editable fields and blocking dialogs. Click the flight scene if a control still has keyboard focus. Do not fly while trying to type into another window.

## Session A: first-time player (about 15–25 minutes)

Try this without a developer explaining the interface. Record where you first hesitate.

- [ ] Choose **Freighter**, enable **Start with tutorial**, and start with the normal 10,000 credits. Do not use the developer Test Ship for fresh-save feasibility.
- [ ] Dock at nearby **Sol City** with E and enter the station. Open **Missions** and accept **First fuel run: Helios Refinery → Sol City** under Available Contracts. If absent, report it rather than accepting a random substitute.
- [ ] Undock with Q. The waypoint should target **Helios Refinery**, not the delivery station. Try T/Waypoint pilot; it approaches and docks automatically. Alternatively fly and dock manually.
- [ ] Enter the refinery, open **Production**, set quantity to **10**, and buy **Refined Fuel**. Buying one unit must not advance the tutorial. Buying all ten should point the waypoint back at Sol City.
- [ ] Return and dock at Sol City. Open **Civic Exchange**, set quantity to 10, and **sell the fuel**. This commodity contract completes through sale; story deliveries instead use the mission-log handover. Confirm the tutorial finishes and a completion bonus is awarded once. Record the net credit change: prices can move, so a completion bonus does not guarantee an overall trading profit.
- [ ] Pause, Save, reload the page, Load, and confirm cargo, credits, tutorial progress and paused state survive. Resume and continue.
- [ ] Try manual thrust/braking, camera orbit/zoom, cruise away from stations, and map waypoints. Is the next action obvious? Is travel too slow or too automated?

## Session B: story, combat and recovery (30–60 minutes, may span sessions)

These assignments unlock through reputation and earlier stages; they are not all offered immediately. Record actual time/credits needed to reach them. Do not grind indefinitely to satisfy this checklist—an access or financing problem is itself a finding.

- [ ] Visit **Greenfields**, accept the luxury-goods assignment, find a legal supplier, buy the actual cargo, return and use **Hand over cargo / document** in the mission log. Check the one-time procurement budget and separate completion reward. Note any supplier access, hold-capacity or money dead end.
- [ ] At the political choice, read **all** consequences. Pick one branch; confirm the next assignment and world changes match what was promised. Do not assume neutral or cheaper options are consequence-free.
- [ ] Try a combat assignment (Greenfields' later convoy battle is one route). Verify target identity/range, Tab selection and held Space fire; check hull/energy and completion feedback. Was target selection understandable? Did combat require meaningful decisions?
- [ ] Reach a story escort, such as the **Sol City inspector** route. Undock, join the waiting convoy within 200m, explicitly launch it, then try **Follow escort**. Check escort hull, finite wave progress and actual arrival. An escort must not complete while you remain docked.
- [ ] Test loss: let an escort be destroyed, abandon an assignment, or lose your own hull. Check the reason is intelligible and failure does not also pay success. Insurance should retain cargo, repair the ship at an accessible port and charge at most 1,000 credits. Verify the 45-simulation-second ceasefire clears incidental anger and prevents an immediate reattack; firing ends protection.
- [ ] Retry a failed/abandoned assignment at its issuer, then accept it again. Check for old enemies/shots, duplicate rewards, or a repeated procurement grant. Existing cargo remains yours, so avoid buying it twice unnecessarily.
- [ ] Save/reload during an unfinished assignment and confirm objectives, deadline, cargo, escorts and consequences remain coherent. Expect transient projectiles to be cleared on load.

## Session C: optional stress/accessibility checks

- [ ] Try a timed covert operation: approach the contact, use silent running within 100m or dock, start the operation, leave and return. It should pause/resume rather than fail because of mouse-release timing. Record suspicion clarity.
- [ ] Accept or ignore one optional salvage/distress/procurement opportunity. Verify cargo consumption, quoted payment and any **advertised** risk. Does it improve travel or distract from it?
- [ ] Open a briefing, choice or celebration, switch to another tab, then return. No simulation/deadline should have advanced during a blocking overlay or hidden tab.
- [ ] Try keyboard-only UI use, smaller windows, readable targets, graphics changes and audio volume/mute. Report overlap, focus traps, unreadable colors/text, unexpected audio or input leaking through dialogs.
- [ ] If continuing into another story arc, note access conflicts, reputation recovery, supplier affordability and deadline pressure. A full fresh-save campaign is **not yet human-validated**.

## Report template

```text
Build revision (archive filename or playtest-build.json):
Browser/version, OS, GPU, window size, graphics setting:
Fresh campaign or loaded checkpoint? Starter ship:
Mission/arc/station; approximate session time:
Expected:
Observed:
Steps to reproduce:
Cargo/credits/reputation/deadline, if relevant:
Screenshot/console error, if available:
Handling / objective clarity / travel / combat / escort difficulty (1–5):
Most confusing or least enjoyable moment:
```

For a blocker, stop and record the state rather than editing browser storage to get past it. A screenshot and precise last action are more useful than “mission broken.” If a checkpoint is valuable, keep that browser profile intact; there is no supported export yet.

## Maintainer: produce the next packet

Use a clean checkout of the intended revision, Node 20+ (this pass uses Node 22), npm and `tar`:

```sh
npm ci --ignore-scripts
npx playwright install chromium
# On Linux, install Playwright's OS libraries separately if prompted.
npm run playtest:package
```

Packaging refuses dirty/untracked source rather than mislabelling local edits as the committed revision. If you have unrelated work, leave it alone and use a separate clean clone/worktree. The command typechecks, runs unit/DOM/integration tests, builds, runs development smoke tests and the **UI-only production tutorial/checkpoint test**, then produces `artifacts/trader-alpha-<revision>.tar.gz` and its checksum. Ports 4174 and 4175 must be free; no stale dev server is reused during packaging. To check without packaging, run `npm run playtest:check` (stop any existing dev server if you need a fresh one).

This is a revision-labelled, lockfile-based workflow, **not** a claim of byte-for-byte reproducible archives, a security audit, human campaign completion, or hardware performance certification. Integration tests arrange some combat/escort preconditions; browser software rendering is not a substitute for testing real GPUs. Large bundled assets/chunks and existing dependency advisories remain release-hardening work before a public production launch. Do not expose Vite/Vitest development or test UI servers publicly; distribute this compiled static packet instead.
