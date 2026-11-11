# Master integration

The stacked feature work through `ca415e9` is merged with GitHub master through `60c4002`; neither history is rewritten.

## Conflict decisions

- The newer authoritative mission runtime/catalog wins over the older missing-item workarounds. Documents retain custody/turn-in semantics, Union Crisis uses actual completed arcs rather than placeholder arc IDs, and the obsolete generic fabrication mission stays deprecated for checkpoint compatibility.
- The latest tested recovery contract wins over the older manual death screen: automatic safe-port recovery, retained cargo, exactly 50% onboard-cash loss, protected bank/warehouse assets, surviving debt and a 45-simulation-second ceasefire. There is no second 10% charge or all-cargo loss. Hit/explosion/vignette feedback uses the bounded simulation-time impact system rather than duplicate wall-clock effects.
- Upstream screenshots, fonts, animated panel tabs, station glyphs/typewriter intros, radar labels/grid/waypoint path, shared market-row refactor and HUD styling are retained. Journal/scene layering, real progress values, keyboard button navigation and reduced-motion fallbacks remain supported.
- Upstream target panel/reticle use the existing `selectedTargetId`, not a second target state. **Escape** clears it; overlays remain below the journal/mission log.
- Upstream cargo debris is connected to confirmed combat removals. It expires after 60 simulation seconds, auto-collects within 18m (or **G**), requires hold space/equipment, and cannot duplicate partial crates. Ordinary haulers retain the upstream approximate half-capacity drop model; owned escorts use half their actual carried units and retain known cost basis. Unknown older costs are not invented. Loot is transient, bounded to 64 crates and cleared on load/recovery; it does not grant mission purchases or rewards.
- Obsolete duplicate trade actions and the temporary testing-library declaration shim remain removed in favor of authoritative actions and pinned real test-library types.

## Verification

The merged tree passes **237 tests across 23 files**, typecheck, production build, **eight development Chromium smokes** and the **UI-only production tutorial/banking/checkpoint test**. Seven new debris regressions cover actual projectile kills, quantities, ownership/cost, expiry/pause, equipment and checkpoint cleanup. Existing mission/finance/fire/recovery coverage remains active.

Browser fixtures and visual-component checks are not human campaign completion, long-run balance or real-GPU performance certification. Existing Alpha 2 archives/tags are unchanged; this merge does not generate a new packet.
