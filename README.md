# Trader

A systems-driven trading game with a dynamic economy. Buy low, sell high, route goods between regions, and reinvest profits into upgrades that unlock new strategies and long-term progression.

## Quick start

```bash
# prerequisites: Node.js 18+ and npm 9+
npm install
npm run dev
```

- Dev server runs at `http://localhost:5173` by default
- Production build: `npm run build` (outputs to `dist/`)
- Preview production: `npm run preview`
- Type check: `npm run typecheck`

## Core gameplay loop

1. Scan markets to find price gaps and short-term trends
2. Buy goods where supply is high and prices are depressed
3. Transport and sell where demand is strong
4. Reinvest profits into upgrades (capacity, analytics, access)
5. Adapt as events shift supply, demand, and routes

## Dynamic economy

The world evolves over time and reacts to your trades.

- Supply and demand: each commodity has production/consumption, stockpiles, and elasticity; prices mean-revert toward equilibrium with bounded volatility
- Regional modifiers: locations apply scarcity/abundance multipliers; spatial price differences enable arbitrage
- Liquidity and slippage: larger orders move price relative to local depth; fees/spread reduce net proceeds
- Events and shocks: temporary boosts/droughts, embargoes, disasters; effects decay over time
- Feedback loops: repeated buying lifts price; heavy selling can crash thin markets; stockpiles decay slowly

Implementation entry points:
- `src/systems/economy.ts` — economy tick, price updates, shocks, slippage
- `src/state/game_state.ts` — player cash, cargo, holdings, upgrades, and global state (zustand)
- `src/scene/scene_root.tsx` — render root and integration with the simulation loop

## Trading mechanics

- Commodities: distinct goods with different volatility, carry cost, and elasticity
- Orders: instant buy/sell at market; order size interacts with slippage and spread
- Capacity and carry: cargo limits cap position size; storage has soft caps and optional decay
- Risk: diversify; size positions to liquidity; keep cash for adverse moves
- Price discovery: watch spreads and short moving averages to time entries/exits

## Upgrades and progression

Spend profits to unlock compounding advantages and new playstyles.

- Cargo and logistics: increase capacity, reduce transport friction, mitigate slippage impact
- Analytics: deeper history, forecast hints, event early warnings, improved market UI
- Market access: fee reductions, licenses for restricted goods, access to premium hubs
- Operations: faster ticks, smarter route planning tools, passive contracts
- Reputation: sustained profits raise standing and improve trading terms; unlocks advanced upgrades

Progression goals can include target net worth, route dominance, or meta-challenges.

## UI guide

- Market panel — `src/ui/market_panel.tsx`: live prices, spreads, stockpiles, quick buy/sell
- Journal — `src/ui/journal_panel.tsx`: events, news, transaction log, upgrades acquired
- Minimap — `src/ui/minimap.tsx`: locations overview and route planning

## Strategy tips

- Start wide, not deep: trade 2–3 goods to reduce variance
- Trade with the tide: align with multi-tick trends; fade only at extremes
- Respect liquidity: size to depth; avoid punitive slippage in thin markets
- Compound edges: capacity + analytics + lower fees stack multiplicatively

## Project structure

```
Trader/
  src/
    scene/            # 3D scene and world
    state/            # global game state (zustand)
    systems/          # simulation (economy, ticks)
    ui/               # panels and HUD
```

Key files:
- `src/systems/economy.ts`
- `src/state/game_state.ts`
- `src/scene/scene_root.tsx`

## Configuration and tuning

- Economy parameters (fees, elasticity, stockpile decay) are defined in `src/systems/economy.ts`
- Tick rate is configured where the scene integrates the economy update

## Roadmap ideas

- AI competitors that generate organic order flow and pressure
- Contracts and deliveries with time windows and penalties
- Credit and leverage with interest and liquidation risk
- Branching tech tree with synergies and trade-offs
- Save/load profiles and seeded world generation

## Contributing

- Use Node 18+
- Run `npm run typecheck` before committing
- Keep simulation logic pure and deterministic where possible; isolate side effects at boundaries

## License

MIT
