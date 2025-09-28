import { create } from 'zustand';
import { Commodity, StationType, generateCommodities, StationInventory, priceForStation, findRecipeForStation, ensureSpread, processRecipes, gatedCommodities } from '../systems/economy';

const SCALE = 10;
const sp = (p: [number, number, number]): [number, number, number] => [p[0] * SCALE, p[1] * SCALE, p[2] * SCALE];

export type Station = {
  id: string;
  name: string;
  type: StationType;
  position: [number, number, number];
  inventory: StationInventory;
};

export type Planet = {
  id: string;
  name: string;
  position: [number, number, number];
  radius: number;
  color?: string;
  isStar?: boolean;
};

export type AsteroidBelt = {
  id: string;
  name: string;
  position: [number, number, number];
  radius: number;
  tier: 'common' | 'rare';
};

export type Ship = {
  position: [number, number, number];
  velocity: [number, number, number];
  credits: number;
  cargo: Record<Commodity['id'], number>;
  maxCargo: number;
  dockedStationId?: string;
  canMine: boolean;
  enginePower: number; // 0..1 smoothed visual power
  engineTarget: number; // 0 or 1 based on thrust input
  hasNavigationArray?: boolean;
  hasUnionMembership?: boolean;
  kind: 'freighter' | 'clipper' | 'miner' | 'heavy_freighter' | 'racer' | 'industrial_miner';
  stats: {
    acc: number; // units/s^2
    drag: number; // s^-1
    vmax: number; // units/s
  };
};

export type NpcTrader = {
  id: string;
  commodityId: Commodity['id'];
  fromId: string;
  toId: string;
  position: [number, number, number];
  speed: number; // units per second, derived from commodity cost
};

export type TradeEntry = {
  id: string;
  time: number; // epoch ms
  stationId: string;
  stationName: string;
  stationType: StationType;
  commodityId: Commodity['id'];
  type: 'buy' | 'sell';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type GameState = {
  planets: Planet[];
  stations: Station[];
  belts: AsteroidBelt[];
  npcTraders: NpcTrader[];
  ship: Ship;
  hasChosenStarter: boolean;
  tradeLog: TradeEntry[];
  profitByCommodity: Record<Commodity['id'], number>;
  avgCostByCommodity: Record<Commodity['id'], number>;
  getSuggestedRoutes: (opts?: { limit?: number; prioritizePerDistance?: boolean }) => RouteSuggestion[];
  tick: (dt: number) => void;
  thrust: (dir: [number, number, number], dt: number) => void;
  setEngineTarget: (target: number) => void;
  tryDock: () => void;
  undock: () => void;
  mine: () => void;
  buy: (commodityId: string, quantity: number) => void;
  sell: (commodityId: string, quantity: number) => void;
  process: (inputId: string, outputs: number) => void;
  upgrade: (type: 'acc' | 'vmax' | 'cargo' | 'mining' | 'navigation' | 'union', amount: number, cost: number) => void;
  replaceShip: (kind: 'freighter' | 'clipper' | 'miner' | 'heavy_freighter' | 'racer' | 'industrial_miner', cost: number) => void;
  chooseStarter: (kind: 'freighter' | 'clipper' | 'miner') => void;
};

export type RouteSuggestion = {
  id: string;
  kind: 'direct' | 'process';
  fromId: string;
  fromName: string;
  fromType: StationType;
  toId: string;
  toName: string;
  toType: StationType;
  viaId?: string;
  viaName?: string;
  viaType?: StationType;
  inputId: Commodity['id'];
  outputId: Commodity['id'];
  inputPerOutput: number; // 1 for direct routes
  unitBuy: number; // price paid per input unit at source
  unitSell: number; // price received per output unit at destination
  unitMargin: number; // per output unit margin (after conversion)
  maxUnits: number; // number of output units deliverable given cargo and stock
  tripDistance: number;
  estProfit: number;
  profitPerDistance: number;
};

function distance(a: [number, number, number], b: [number, number, number]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

function clampMagnitude(v: [number, number, number], maxLen: number): [number, number, number] {
  const len = Math.hypot(v[0], v[1], v[2]);
  if (len <= maxLen || len === 0) return v;
  const s = maxLen / len;
  return [v[0]*s, v[1]*s, v[2]*s];
}

export const shipCaps: Record<Ship['kind'], { acc: number; vmax: number; cargo: number }> = {
  freighter: { acc: 18, vmax: 18, cargo: 1200 },
  heavy_freighter: { acc: 22, vmax: 22, cargo: 2000 },
  clipper: { acc: 30, vmax: 36, cargo: 180 },
  racer: { acc: 40, vmax: 46, cargo: 120 },
  miner: { acc: 16, vmax: 18, cargo: 500 },
  industrial_miner: { acc: 18, vmax: 20, cargo: 1000 },
};

export const shipBaseStats: Record<Ship['kind'], { acc: number; vmax: number; cargo: number }> = {
  freighter: { acc: 10, vmax: 11, cargo: 300 },
  heavy_freighter: { acc: 9, vmax: 12, cargo: 600 },
  clipper: { acc: 18, vmax: 20, cargo: 60 },
  racer: { acc: 24, vmax: 28, cargo: 40 },
  miner: { acc: 9, vmax: 11, cargo: 80 },
  industrial_miner: { acc: 10, vmax: 12, cargo: 160 },
};

const commodities = generateCommodities();
const commodityById: Record<string, Commodity> = Object.fromEntries(commodities.map(c => [c.id, c]));
const minCost = commodities.reduce((m, c) => Math.min(m, c.baseBuy), Number.POSITIVE_INFINITY);
const maxCost = commodities.reduce((m, c) => Math.max(m, c.baseBuy), 0);

function speedForCommodity(commodityId: string): number {
  const c = commodityById[commodityId];
  if (!c) return 10;
  const t = (c.baseBuy - minCost) / Math.max(1e-6, (maxCost - minCost)); // 0=cheapest,1=most expensive
  const inv = 1 - t;
  const minSpeed = 6; // slowest for most expensive
  const maxSpeed = 16; // fastest for cheapest
  return minSpeed + inv * (maxSpeed - minSpeed);
}

type DirectRoute = {
  id: string;
  fromId: string;
  toId: string;
  commodityId: string;
  unitBuy: number;
  unitSell: number;
  margin: number;
  distance: number;
};

function computeDirectRoutes(stations: Station[]): DirectRoute[] {
  const routes: DirectRoute[] = [];
  for (let i = 0; i < stations.length; i++) {
    const a = stations[i];
    for (let j = 0; j < stations.length; j++) {
      if (i === j) continue;
      const b = stations[j];
      const d = distance(a.position, b.position);
      const keys = Object.keys(a.inventory);
      for (const id of keys) {
        const ai = a.inventory[id];
        const bi = b.inventory[id];
        if (!ai || !bi) continue;
        if (ai.canSell === false) continue; // cannot buy from A
        if (bi.canBuy === false) continue; // cannot sell to B
        const margin = bi.sell - ai.buy;
        if (margin <= 0) continue;
        routes.push({ id: `r:${id}:${a.id}->${b.id}`, fromId: a.id, toId: b.id, commodityId: id, unitBuy: ai.buy, unitSell: bi.sell, margin, distance: d });
      }
    }
  }
  // Sort by desirability: margin/distance then margin
  routes.sort((a, b) => (b.margin / Math.max(1, b.distance)) - (a.margin / Math.max(1, a.distance)) || (b.margin - a.margin));
  return routes;
}

function spawnNpcTraders(stations: Station[], count: number): NpcTrader[] {
  const routes = computeDirectRoutes(stations);
  const pick: NpcTrader[] = [];
  const byId: Record<string, Station> = Object.fromEntries(stations.map(s => [s.id, s]));
  for (let i = 0; i < routes.length && pick.length < count; i++) {
    const r = routes[i];
    const from = byId[r.fromId];
    const speed = speedForCommodity(r.commodityId);
    const jitter: [number, number, number] = [ (Math.random()-0.5)*0.8*SCALE, (Math.random()-0.5)*0.4*SCALE, (Math.random()-0.5)*0.8*SCALE ];
    const position: [number, number, number] = [ from.position[0] + jitter[0], from.position[1] + jitter[1], from.position[2] + jitter[2] ];
    pick.push({ id: `${r.id}#${pick.length}`, commodityId: r.commodityId, fromId: r.fromId, toId: r.toId, position, speed });
  }
  // If not enough routes, duplicate with random choices
  while (pick.length < count && routes.length > 0) {
    const r = routes[Math.floor(Math.random() * routes.length)];
    const from = byId[r.fromId];
    const speed = speedForCommodity(r.commodityId);
    pick.push({ id: `${r.id}#${pick.length}`, commodityId: r.commodityId, fromId: r.fromId, toId: r.toId, position: [from.position[0], from.position[1], from.position[2]], speed });
  }
  return pick;
}
const planets: Planet[] = [
  { id: 'sun', name: 'Sol', position: sp([0, 0, 0]), radius: 12 * SCALE, color: '#ffd27f', isStar: true },
  // Orbits around the sun
  { id: 'aurum', name: 'Aurum', position: sp([40, 0, 0]), radius: 6 * SCALE, color: '#b08d57' },
  { id: 'ceres', name: 'Ceres', position: sp([-45, 0, 78]), radius: 4 * SCALE, color: '#7a8fa6' },
];

const stations: Station[] = [
  // Near Aurum
  { id: 'sol-city', name: 'Sol City [Consumes: fuel/meds/lux]', type: 'city', position: sp([52, 0, 6]), inventory: priceForStation('city', commodities) },
  { id: 'sol-refinery', name: 'Helios Refinery [Cheap: fuel/hydrogen]', type: 'refinery', position: sp([48, 0, -10]), inventory: priceForStation('refinery', commodities) },
  { id: 'aurum-fab', name: 'Aurum Fabricator [Cheap: electronics/chips/alloys]', type: 'fabricator', position: sp([40, 0, -14]), inventory: priceForStation('fabricator', commodities) },
  { id: 'greenfields', name: 'Greenfields Farm [Food production: grain/meat/sugar]', type: 'farm', position: sp([44, 0, -4]), inventory: priceForStation('farm', commodities) },
  // Near Ceres
  { id: 'ceres-pp', name: 'Ceres Power Plant [Cheap: batteries/fuel]', type: 'power_plant', position: sp([-56, 0, 86]), inventory: priceForStation('power_plant', commodities) },
  { id: 'freeport', name: 'Freeport Station [Mixed market]', type: 'trading_post', position: sp([-40, 0, 70]), inventory: priceForStation('trading_post', commodities) },
  { id: 'drydock', name: 'Drydock Shipyard [Upgrades available]', type: 'shipyard', position: sp([-30, 0, 90]), inventory: priceForStation('shipyard', commodities) },
  // Pirate outpost, off the system plane (y != 0) and far from core
  { id: 'hidden-cove', name: 'Hidden Cove [Pirate: All fabrication]', type: 'pirate', position: sp([0, 40, 160]), inventory: priceForStation('pirate', commodities) },
];

const belts: AsteroidBelt[] = [
  { id: 'inner-belt', name: 'Common Belt', position: sp([0, 0, 0]), radius: 60 * SCALE, tier: 'common' },
  { id: 'outer-belt', name: 'Rare Belt', position: sp([0, 0, 0]), radius: 120 * SCALE, tier: 'rare' },
];

export const useGameStore = create<GameState>((set, get) => ({
  planets,
  stations,
  belts,
  npcTraders: spawnNpcTraders(stations, 24),
  ship: {
    position: sp([50, 0, 8]),
    velocity: [0, 0, 0],
    credits: 0,
    cargo: {},
    maxCargo: 100,
    canMine: false,
    enginePower: 0,
    engineTarget: 0,
    hasNavigationArray: false,
    hasUnionMembership: false,
    kind: 'freighter',
    stats: { acc: 12, drag: 1.0, vmax: 12 },
  },
  hasChosenStarter: false,
  tradeLog: [],
  profitByCommodity: {},
  avgCostByCommodity: {},
  getSuggestedRoutes: (opts) => {
    const state = get();
    const stations = state.stations;
    const cargoCapacity = state.ship.maxCargo;
    const hasNav = !!state.ship.hasNavigationArray;
    const hasUnion = !!state.ship.hasUnionMembership;
    const limit = opts?.limit ?? 8;
    const prioritizePerDistance = !!opts?.prioritizePerDistance;
    const suggestions: RouteSuggestion[] = [];
    const isGated = (id: string) => gatedCommodities.includes(id as any);
    // Direct routes
    for (let i = 0; i < stations.length; i++) {
      const a = stations[i];
      for (let j = 0; j < stations.length; j++) {
        if (i === j) continue;
        const b = stations[j];
        const d = distance(a.position, b.position);
        const keys = Object.keys(a.inventory);
        for (const id of keys) {
          if (!hasNav && isGated(id)) continue;
          const ai = a.inventory[id];
          const bi = b.inventory[id];
          if (!ai || !bi) continue;
          // Respect directional trading rules for route suggestions
          if (ai.canSell === false) continue; // cannot buy from A
          if (bi.canBuy === false) continue; // cannot sell to B
          const margin = bi.sell - ai.buy;
          if (margin <= 0) continue;
          const stock = Math.max(0, ai.stock || 0);
          if (stock <= 0) continue;
          const maxUnits = Math.max(0, Math.min(stock, cargoCapacity));
          if (maxUnits <= 0) continue;
          const estProfit = margin * maxUnits;
          const profitPerDistance = d > 0 ? estProfit / d : estProfit;
          suggestions.push({
            id: `direct:${id}:${a.id}->${b.id}`,
            kind: 'direct',
            fromId: a.id, fromName: a.name, fromType: a.type,
            toId: b.id, toName: b.name, toType: b.type,
            inputId: id as any, outputId: id as any,
            inputPerOutput: 1,
            unitBuy: ai.buy,
            unitSell: bi.sell,
            unitMargin: margin,
            maxUnits,
            tripDistance: d,
            estProfit,
            profitPerDistance,
          });
        }
      }
    }
    // Processing routes: S -> P (process) -> D
    for (const p of stations) {
      const recipes = processRecipes[p.type] || [];
      if (recipes.length === 0) continue;
      const canProcessAtP = hasUnion || p.type === 'pirate';
      for (const r of recipes) {
        if (!canProcessAtP) continue;
        if (!hasNav && (isGated(r.inputId) || isGated(r.outputId))) continue;
        // Buy input at S
        for (const s of stations) {
          const sItem = s.inventory[r.inputId];
          if (!sItem || sItem.canSell === false) continue; // must be able to buy input at S
          const stockIn = Math.max(0, sItem.stock || 0);
          if (stockIn <= 0) continue;
          const maxInput = Math.max(0, Math.min(stockIn, cargoCapacity));
          const maxOutputs = Math.floor(maxInput / r.inputPerOutput);
          if (maxOutputs <= 0) continue;
          // Sell output at D
          for (const dSt of stations) {
            const dItem = dSt.inventory[r.outputId];
            if (!dItem || dItem.canBuy === false) continue; // must be able to sell output at D
            const unitBuyIn = sItem.buy;
            const unitSellOut = dItem.sell;
            const unitMargin = unitSellOut - (unitBuyIn * r.inputPerOutput);
            if (unitMargin <= 0) continue;
            const d1 = distance(s.position, p.position);
            const d2 = distance(p.position, dSt.position);
            const tripDist = d1 + d2;
            const estProfit = unitMargin * maxOutputs;
            const profitPerDistance = tripDist > 0 ? estProfit / tripDist : estProfit;
            suggestions.push({
              id: `proc:${r.inputId}->${r.outputId}:${s.id}->${p.id}->${dSt.id}`,
              kind: 'process',
              fromId: s.id, fromName: s.name, fromType: s.type,
              viaId: p.id, viaName: p.name, viaType: p.type,
              toId: dSt.id, toName: dSt.name, toType: dSt.type,
              inputId: r.inputId as any, outputId: r.outputId as any,
              inputPerOutput: r.inputPerOutput,
              unitBuy: unitBuyIn,
              unitSell: unitSellOut,
              unitMargin,
              maxUnits: maxOutputs,
              tripDistance: tripDist,
              estProfit,
              profitPerDistance,
            });
          }
        }
      }
    }
    const sorter = prioritizePerDistance
      ? (a: RouteSuggestion, b: RouteSuggestion) =>
          (b.profitPerDistance - a.profitPerDistance)
          || (b.estProfit - a.estProfit)
          || (a.tripDistance - b.tripDistance)
          || a.id.localeCompare(b.id)
      : (a: RouteSuggestion, b: RouteSuggestion) =>
          (b.estProfit - a.estProfit)
          || (b.profitPerDistance - a.profitPerDistance)
          || (a.tripDistance - b.tripDistance)
          || a.id.localeCompare(b.id);
    return suggestions.sort(sorter).slice(0, limit);
  },
  tick: (dt) => set((state) => {
    // Damping and integration
    const drag = state.ship.stats.drag; // s^-1
    const dampFactor = Math.exp(-drag * dt);
    const dampedVel: [number, number, number] = [
      state.ship.velocity[0] * dampFactor,
      state.ship.velocity[1] * dampFactor,
      state.ship.velocity[2] * dampFactor,
    ];
    const [vx, vy, vz] = clampMagnitude(dampedVel as any, state.ship.stats.vmax);
    const position: [number, number, number] = [
      state.ship.position[0] + vx * dt,
      state.ship.position[1] + vy * dt,
      state.ship.position[2] + vz * dt,
    ];

    // Smooth engine power towards target (visual only)
    const k = 10; // responsiveness
    const a = 1 - Math.exp(-k * dt);
    const enginePower = state.ship.enginePower + (state.ship.engineTarget - state.ship.enginePower) * a;

    // Lightweight price fluctuation: every ~0.5s, tweak a handful of items per station
    const jitterChance = Math.min(1, dt * 2);
    let stations = state.stations;
    if (Math.random() < jitterChance) {
      stations = state.stations.map(st => {
        const inv = { ...st.inventory } as StationInventory;
        const keys = Object.keys(inv);
        for (let i = 0; i < 3; i++) {
          const k = keys[Math.floor(Math.random() * keys.length)];
          const item = inv[k];
          if (!item) continue;
          const factorBuy = 1 + (Math.random() * 2 - 1) * 0.1;
          const factorSell = 1 + (Math.random() * 2 - 1) * 0.1;
          const nextBuy = Math.max(1, Math.round(item.buy * factorBuy));
          const nextSell = Math.max(1, Math.round(item.sell * factorSell));
          const adjusted = ensureSpread({ buy: nextBuy, sell: nextSell, minPercent: 0.08, minAbsolute: 3 });
          inv[k] = { ...item, buy: adjusted.buy, sell: adjusted.sell };
        }
        return { ...st, inventory: inv };
      });
    }

    // Update NPC traders
    const stationById: Record<string, Station> = Object.fromEntries(stations.map(s => [s.id, s]));
    const stationStockDelta: Record<string, Record<string, number>> = {};
    const npcTraders: NpcTrader[] = state.npcTraders.map(npc => {
      const dest = stationById[npc.toId];
      const src = stationById[npc.fromId];
      if (!dest || !src) return npc;
      const dx = dest.position[0] - npc.position[0];
      const dy = dest.position[1] - npc.position[1];
      const dz = dest.position[2] - npc.position[2];
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      const step = npc.speed * dt;
      if (dist <= step || dist < 0.5) {
        // Arrived: apply a small delivery and swap direction
        const deliver = 3;
        const srcInv = src.inventory[npc.commodityId];
        const dstInv = dest.inventory[npc.commodityId];
        if (srcInv && srcInv.canSell !== false && dstInv && dstInv.canBuy !== false) {
          stationStockDelta[src.id] = stationStockDelta[src.id] || {};
          stationStockDelta[src.id][npc.commodityId] = (stationStockDelta[src.id][npc.commodityId] || 0) - deliver;
          stationStockDelta[dest.id] = stationStockDelta[dest.id] || {};
          stationStockDelta[dest.id][npc.commodityId] = (stationStockDelta[dest.id][npc.commodityId] || 0) + deliver;
        }
        // Swap route and reset position to exact destination (start next leg)
        const next: NpcTrader = { ...npc, position: [dest.position[0], dest.position[1], dest.position[2]], fromId: npc.toId, toId: npc.fromId };
        return next;
      }
      const ux = dx / dist;
      const uy = dy / dist;
      const uz = dz / dist;
      const nx = npc.position[0] + ux * step;
      const ny = npc.position[1] + uy * step;
      const nz = npc.position[2] + uz * step;
      return { ...npc, position: [nx, ny, nz] };
    });

    // Apply accumulated station stock changes (clamped at >= 0)
    if (Object.keys(stationStockDelta).length > 0) {
      stations = stations.map(s => {
        const delta = stationStockDelta[s.id];
        if (!delta) return s;
        const inv: StationInventory = { ...s.inventory };
        for (const cid of Object.keys(delta)) {
          const item = inv[cid];
          if (!item) continue;
          const nextStock = Math.max(0, (item.stock || 0) + delta[cid]);
          inv[cid] = { ...item, stock: nextStock };
        }
        return { ...s, inventory: inv };
      });
    }

    return { ship: { ...state.ship, position, velocity: [vx, vy, vz], enginePower }, stations, npcTraders } as Partial<GameState> as GameState;
  }),
  thrust: (dir, dt) => set((state) => {
    if (!state.hasChosenStarter) return state;
    if (state.ship.dockedStationId) return state;
    const acc = state.ship.stats.acc; // units per s^2
    const velocity: [number, number, number] = [
      state.ship.velocity[0] + dir[0] * acc * dt,
      state.ship.velocity[1] + dir[1] * acc * dt,
      state.ship.velocity[2] + dir[2] * acc * dt,
    ];
    return { ship: { ...state.ship, velocity, engineTarget: 1 } } as Partial<GameState> as GameState;
  }),
  setEngineTarget: (target) => set((state) => {
    if (state.ship.dockedStationId) target = 0;
    const t = Math.max(0, Math.min(1, target));
    if (state.ship.engineTarget === t) return state;
    return { ship: { ...state.ship, engineTarget: t } } as Partial<GameState> as GameState;
  }),
  tryDock: () => set((state) => {
    if (!state.hasChosenStarter) return state;
    if (state.ship.dockedStationId) return state;
    const near = state.stations.find(s => distance(s.position, state.ship.position) < 6 * SCALE);
    if (!near) return state;
    return { ship: { ...state.ship, dockedStationId: near.id, velocity: [0,0,0] } } as Partial<GameState> as GameState;
  }),
  undock: () => set((state) => {
    if (!state.hasChosenStarter) return state;
    if (!state.ship.dockedStationId) return state;
    return { ship: { ...state.ship, dockedStationId: undefined } } as Partial<GameState> as GameState;
  }),
  mine: () => set((state) => {
    if (!state.hasChosenStarter) return state;
    if (state.ship.dockedStationId) return state;
    if (!state.ship.canMine) return state;
    const belts = state.belts;
    const near = belts.find(b => {
      const d = distance(state.ship.position, b.position);
      return Math.abs(d - b.radius) < 6 * SCALE; // near ring
    });
    if (!near) return state;
    const used = Object.values(state.ship.cargo).reduce((a, b) => a + b, 0);
    if (used >= state.ship.maxCargo) return state;
    const room = state.ship.maxCargo - used;
    const roll = Math.random();
    // Belt-tier-based distribution
    let ore: keyof Ship['cargo'] = 'iron_ore';
    if (near.tier === 'common') {
      ore = roll < 0.5 ? 'iron_ore' : roll < 0.8 ? 'copper_ore' : roll < 0.95 ? 'silicon' : 'rare_minerals';
    } else {
      // rare belt: higher chance for silicon and rare minerals
      ore = roll < 0.3 ? 'iron_ore' : roll < 0.6 ? 'copper_ore' : roll < 0.85 ? 'silicon' : 'rare_minerals';
    }
    const qty = Math.max(1, Math.min(room, Math.round(ore === 'rare_minerals' ? 1 : (1 + Math.random() * 3))));
    const cargo = { ...state.ship.cargo, [ore]: (state.ship.cargo[ore] || 0) + qty } as Record<string, number>;
    return { ship: { ...state.ship, cargo } } as Partial<GameState> as GameState;
  }),
  buy: (commodityId, quantity) => set((state) => {
    if (!state.ship.dockedStationId || quantity <= 0) return state;
    // Gating for high-profit goods
    if (!state.ship.hasNavigationArray && (gatedCommodities as readonly string[]).includes(commodityId)) return state;
    const station = state.stations.find(s => s.id === state.ship.dockedStationId);
    if (!station) return state;
    const item = station.inventory[commodityId];
    if (!item || item.canSell === false) return state;
    const totalCost = item.buy * quantity;
    const used = Object.values(state.ship.cargo).reduce((a, b) => a + b, 0);
    if (state.ship.credits < totalCost) return state;
    if (used + quantity > state.ship.maxCargo) return state;
    const prevQty = state.ship.cargo[commodityId] || 0;
    const cargo = { ...state.ship.cargo, [commodityId]: prevQty + quantity };
    const reduced = { ...station.inventory, [commodityId]: { ...item, stock: Math.max(0, (item.stock || 0) - quantity) } };
    const stations = state.stations.map(s => s.id === station.id ? { ...s, inventory: reduced } : s);
    // Update average cost basis
    const avgMap = { ...state.avgCostByCommodity } as Record<string, number>;
    const oldAvg = avgMap[commodityId] || 0;
    const newQty = prevQty + quantity;
    const newAvg = newQty > 0 ? ((oldAvg * prevQty) + (item.buy * quantity)) / newQty : 0;
    avgMap[commodityId] = newAvg;
    // Log trade
    const trade: TradeEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      time: Date.now(),
      stationId: station.id,
      stationName: station.name,
      stationType: station.type,
      commodityId,
      type: 'buy',
      quantity,
      unitPrice: item.buy,
      totalPrice: totalCost,
    };
    const tradeLog = [...state.tradeLog, trade];
    return { ship: { ...state.ship, credits: state.ship.credits - totalCost, cargo }, stations, avgCostByCommodity: avgMap, tradeLog } as Partial<GameState> as GameState;
  }),
  sell: (commodityId, quantity) => set((state) => {
    if (!state.ship.dockedStationId || quantity <= 0) return state;
    // Gating for high-profit goods
    if (!state.ship.hasNavigationArray && (gatedCommodities as readonly string[]).includes(commodityId)) return state;
    const station = state.stations.find(s => s.id === state.ship.dockedStationId);
    if (!station) return state;
    const item = station.inventory[commodityId];
    const have = state.ship.cargo[commodityId] || 0;
    if (!item || item.canBuy === false || have <= 0) return state;
    const qty = Math.min(quantity, have);
    const revenue = item.sell * qty;
    const cargo = { ...state.ship.cargo, [commodityId]: have - qty };
    let nextInv = { ...station.inventory } as StationInventory;
    // Base: station receives ore
    nextInv[commodityId] = { ...item, stock: (item.stock || 0) + qty };
    // If refinery, convert ore to metal based on recipe
    if (station.type === 'refinery') {
      const recipe = findRecipeForStation('refinery', commodityId);
      if (recipe) {
        const produced = Math.floor(qty / recipe.inputPerOutput);
        const remainder = qty % recipe.inputPerOutput;
        const outItem = nextInv[recipe.outputId];
        if (outItem) {
          nextInv[recipe.outputId] = { ...outItem, stock: (outItem.stock || 0) + produced };
        }
        // Adjust ore stock to only keep remainder (simulate immediate processing)
        nextInv[commodityId] = { ...nextInv[commodityId], stock: ((nextInv[commodityId].stock || 0) - qty) + remainder };
      }
    }
    const stations = state.stations.map(s => s.id === station.id ? { ...s, inventory: nextInv } : s);
    // Realized profit using moving average cost
    const avgMap = { ...state.avgCostByCommodity } as Record<string, number>;
    const avgCost = avgMap[commodityId] || 0;
    const realized = (item.sell - avgCost) * qty;
    const profit = { ...state.profitByCommodity } as Record<string, number>;
    profit[commodityId] = (profit[commodityId] || 0) + realized;
    // Reset avg cost if position closed
    if ((cargo[commodityId] || 0) === 0) {
      avgMap[commodityId] = 0;
    }
    // Log trade
    const trade: TradeEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      time: Date.now(),
      stationId: station.id,
      stationName: station.name,
      stationType: station.type,
      commodityId,
      type: 'sell',
      quantity: qty,
      unitPrice: item.sell,
      totalPrice: revenue,
    };
    const tradeLog = [...state.tradeLog, trade];
    return { ship: { ...state.ship, credits: state.ship.credits + revenue, cargo }, stations, profitByCommodity: profit, avgCostByCommodity: avgMap, tradeLog } as Partial<GameState> as GameState;
  }),
  process: (inputId, outputs) => set((state) => {
    if (!state.ship.dockedStationId || outputs <= 0) return state;
    const station = state.stations.find(s => s.id === state.ship.dockedStationId);
    if (!station) return state;
    const recipe = findRecipeForStation(station.type, inputId);
    if (!recipe) return state;
    // Block producing gated outputs without Navigation Array
    if (!state.ship.hasNavigationArray && (gatedCommodities as readonly string[]).includes(recipe.outputId)) return state;
    // Require union membership unless at pirate station
    const atPirate = station.type === 'pirate';
    if (!atPirate && !state.ship.hasUnionMembership) return state;
    const have = state.ship.cargo[inputId] || 0;
    const maxOutputs = Math.floor(have / recipe.inputPerOutput);
    const outCount = Math.max(0, Math.min(outputs, maxOutputs));
    if (outCount <= 0) return state;
    const newCargo = { ...state.ship.cargo };
    newCargo[inputId] = have - outCount * recipe.inputPerOutput;
    newCargo[recipe.outputId] = (newCargo[recipe.outputId] || 0) + outCount;
    return { ship: { ...state.ship, cargo: newCargo } } as Partial<GameState> as GameState;
  }),
  upgrade: (type, amount, cost) => set((state) => {
    if (!state.ship.dockedStationId) return state;
    const station = state.stations.find(s => s.id === state.ship.dockedStationId);
    if (!station) return state;
    // Ship upgrades only at shipyard
    if ((type === 'acc' || type === 'vmax' || type === 'cargo' || type === 'mining' || type === 'navigation') && station.type !== 'shipyard') return state;
    if (state.ship.credits < cost) return state;
    const caps = shipCaps[state.ship.kind];
    if (type === 'cargo') {
      if (state.ship.maxCargo >= caps.cargo) return state;
      if (state.ship.maxCargo + amount > caps.cargo) return state;
      return { ship: { ...state.ship, credits: state.ship.credits - cost, maxCargo: state.ship.maxCargo + amount } } as Partial<GameState> as GameState;
    }
    if (type === 'mining') {
      if (state.ship.canMine) return state;
      return { ship: { ...state.ship, credits: state.ship.credits - cost, canMine: true } } as Partial<GameState> as GameState;
    }
    if (type === 'navigation') {
      if (state.ship.hasNavigationArray) return state;
      return { ship: { ...state.ship, credits: state.ship.credits - cost, hasNavigationArray: true } } as Partial<GameState> as GameState;
    }
    if (type === 'union') {
      // Union membership purchasable only at city
      if (station.type !== 'city') return state;
      if (state.ship.hasUnionMembership) return state;
      return { ship: { ...state.ship, credits: state.ship.credits - cost, hasUnionMembership: true } } as Partial<GameState> as GameState;
    }
    const stats = { ...state.ship.stats };
    if (type === 'acc') {
      if (stats.acc >= caps.acc) return state;
      if (stats.acc + amount > caps.acc) return state;
      stats.acc += amount;
    }
    if (type === 'vmax') {
      if (stats.vmax >= caps.vmax) return state;
      if (stats.vmax + amount > caps.vmax) return state;
      stats.vmax += amount;
    }
    return { ship: { ...state.ship, credits: state.ship.credits - cost, stats } } as Partial<GameState> as GameState;
  }),
  replaceShip: (kind, cost) => set((state) => {
    if (!state.ship.dockedStationId) return state;
    const station = state.stations.find(s => s.id === state.ship.dockedStationId);
    if (!station || station.type !== 'shipyard') return state;
    if (state.ship.credits < cost) return state;
    const usedCargo = Object.values(state.ship.cargo).reduce((a, b) => a + b, 0);
    if (usedCargo > 0) return state;
    const basePosition: [number, number, number] = state.ship.position;
    const baseVelocity: [number, number, number] = [0, 0, 0];
    let next: Ship | undefined;
    if (kind === 'freighter') {
      next = {
        position: basePosition,
        velocity: baseVelocity,
        credits: state.ship.credits - cost,
        cargo: {},
        maxCargo: 300,
        canMine: state.ship.canMine, // keep mining rig if owned
        enginePower: 0,
        engineTarget: 0,
        hasNavigationArray: state.ship.hasNavigationArray,
        hasUnionMembership: state.ship.hasUnionMembership,
        kind: 'freighter',
        stats: { acc: 10, drag: 1.0, vmax: 11 },
      };
    } else if (kind === 'clipper') {
      next = {
        position: basePosition,
        velocity: baseVelocity,
        credits: state.ship.credits - cost,
        cargo: {},
        maxCargo: 60,
        canMine: state.ship.canMine,
        enginePower: 0,
        engineTarget: 0,
        hasNavigationArray: state.ship.hasNavigationArray,
        hasUnionMembership: state.ship.hasUnionMembership,
        kind: 'clipper',
        stats: { acc: 18, drag: 0.9, vmax: 20 },
      };
    } else if (kind === 'miner') {
      next = {
        position: basePosition,
        velocity: baseVelocity,
        credits: state.ship.credits - cost,
        cargo: {},
        maxCargo: 80,
        canMine: true,
        enginePower: 0,
        engineTarget: 0,
        hasNavigationArray: state.ship.hasNavigationArray,
        hasUnionMembership: state.ship.hasUnionMembership,
        kind: 'miner',
        stats: { acc: 9, drag: 1.1, vmax: 11 },
      };
    } else if (kind === 'heavy_freighter') {
      next = {
        position: basePosition,
        velocity: baseVelocity,
        credits: state.ship.credits - cost,
        cargo: {},
        maxCargo: 600,
        canMine: state.ship.canMine,
        enginePower: 0,
        engineTarget: 0,
        hasNavigationArray: state.ship.hasNavigationArray,
        hasUnionMembership: state.ship.hasUnionMembership,
        kind: 'heavy_freighter',
        stats: { acc: 9, drag: 1.0, vmax: 12 },
      };
    } else if (kind === 'racer') {
      next = {
        position: basePosition,
        velocity: baseVelocity,
        credits: state.ship.credits - cost,
        cargo: {},
        maxCargo: 40,
        canMine: state.ship.canMine,
        enginePower: 0,
        engineTarget: 0,
        hasNavigationArray: state.ship.hasNavigationArray,
        hasUnionMembership: state.ship.hasUnionMembership,
        kind: 'racer',
        stats: { acc: 24, drag: 0.85, vmax: 28 },
      };
    } else if (kind === 'industrial_miner') {
      next = {
        position: basePosition,
        velocity: baseVelocity,
        credits: state.ship.credits - cost,
        cargo: {},
        maxCargo: 160,
        canMine: true,
        enginePower: 0,
        engineTarget: 0,
        hasNavigationArray: state.ship.hasNavigationArray,
        hasUnionMembership: state.ship.hasUnionMembership,
        kind: 'industrial_miner',
        stats: { acc: 10, drag: 1.05, vmax: 12 },
      };
    }
    // Preserve docking state
    next = { ...next!, dockedStationId: state.ship.dockedStationId } as Ship;
    return { ship: next } as Partial<GameState> as GameState;
  }),
  chooseStarter: (kind) => set((state) => {
    const basePosition: [number, number, number] = state.ship.position;
    const baseVelocity: [number, number, number] = [0, 0, 0];
    if (kind === 'freighter') {
      const ship: Ship = {
        position: basePosition,
        velocity: baseVelocity,
        credits: 10000,
        cargo: {},
        maxCargo: 300,
        canMine: false,
        enginePower: 0,
        engineTarget: 0,
        hasNavigationArray: false,
        hasUnionMembership: false,
        kind: 'freighter',
        stats: { acc: 10, drag: 1.0, vmax: 11 },
      };
      return { ship, hasChosenStarter: true } as Partial<GameState> as GameState;
    }
    if (kind === 'clipper') {
      const ship: Ship = {
        position: basePosition,
        velocity: baseVelocity,
        credits: 10000,
        cargo: {},
        maxCargo: 60,
        canMine: false,
        enginePower: 0,
        engineTarget: 0,
        hasNavigationArray: false,
        hasUnionMembership: false,
        kind: 'clipper',
        stats: { acc: 18, drag: 0.9, vmax: 20 },
      };
      return { ship, hasChosenStarter: true } as Partial<GameState> as GameState;
    }
    // miner
    const ship: Ship = {
      position: basePosition,
      velocity: baseVelocity,
      credits: 0,
      cargo: {},
      maxCargo: 80,
      canMine: true,
      enginePower: 0,
      engineTarget: 0,
      hasNavigationArray: false,
      hasUnionMembership: false,
      kind: 'miner',
      stats: { acc: 9, drag: 1.1, vmax: 11 },
    };
    return { ship, hasChosenStarter: true } as Partial<GameState> as GameState;
  }),
}));


