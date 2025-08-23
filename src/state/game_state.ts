import { create } from 'zustand';
import { Commodity, StationType, generateCommodities, StationInventory, priceForStation, findRecipeForStation, ensureSpread, processRecipes } from '../systems/economy';

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
};

export type AsteroidBelt = {
  id: string;
  name: string;
  position: [number, number, number];
  radius: number;
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
  stats: {
    acc: number; // units/s^2
    drag: number; // s^-1
    vmax: number; // units/s
  };
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
  ship: Ship;
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
  upgrade: (type: 'acc' | 'vmax' | 'cargo' | 'mining', amount: number, cost: number) => void;
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

const commodities = generateCommodities();
const planets: Planet[] = [
  { id: 'sol', name: 'Sol Prime', position: [0, 0, 0], radius: 8 },
  { id: 'aurum', name: 'Aurum', position: [80, 0, -40], radius: 6 },
  { id: 'ceres', name: 'Ceres', position: [-70, 0, 50], radius: 4 },
];

const stations: Station[] = [
  { id: 'sol-city', name: 'Sol City [Consumes: fuel/meds/lux]', type: 'city', position: [16, 0, 0], inventory: priceForStation('city', commodities) },
  { id: 'sol-refinery', name: 'Helios Refinery [Cheap: fuel/hydrogen]', type: 'refinery', position: [24, 0, -10], inventory: priceForStation('refinery', commodities) },
  { id: 'aurum-fab', name: 'Aurum Fabricator [Cheap: electronics/chips/alloys]', type: 'fabricator', position: [92, 0, -36], inventory: priceForStation('fabricator', commodities) },
  { id: 'ceres-pp', name: 'Ceres Power Plant [Cheap: batteries/fuel]', type: 'power_plant', position: [-58, 0, 60], inventory: priceForStation('power_plant', commodities) },
  { id: 'freeport', name: 'Freeport Station [Mixed market]', type: 'trading_post', position: [20, 0, 40], inventory: priceForStation('trading_post', commodities) },
  { id: 'drydock', name: 'Drydock Shipyard [Upgrades available]', type: 'shipyard', position: [0, 0, 80], inventory: priceForStation('shipyard', commodities) },
];

const belts: AsteroidBelt[] = [
  { id: 'sol-belt', name: 'Sol Belt', position: [8, 0, 28], radius: 20 },
  { id: 'ceres-belt', name: 'Ceres Belt', position: [-70, 0, 30], radius: 16 },
];

export const useGameStore = create<GameState>((set, get) => ({
  planets,
  stations,
  belts,
  ship: {
    position: [10, 0, 20],
    velocity: [0, 0, 0],
    credits: 5000,
    cargo: {},
    maxCargo: 100,
    canMine: false,
    enginePower: 0,
    engineTarget: 0,
    stats: { acc: 12, drag: 1.0, vmax: 12 },
  },
  tradeLog: [],
  profitByCommodity: {},
  avgCostByCommodity: {},
  getSuggestedRoutes: (opts) => {
    const state = get();
    const stations = state.stations;
    const cargoCapacity = state.ship.maxCargo;
    const limit = opts?.limit ?? 8;
    const prioritizePerDistance = !!opts?.prioritizePerDistance;
    const suggestions: RouteSuggestion[] = [];
    // Direct routes
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
      for (const r of recipes) {
        // Buy input at S
        for (const s of stations) {
          const sItem = s.inventory[r.inputId];
          if (!sItem) continue;
          const stockIn = Math.max(0, sItem.stock || 0);
          if (stockIn <= 0) continue;
          const maxInput = Math.max(0, Math.min(stockIn, cargoCapacity));
          const maxOutputs = Math.floor(maxInput / r.inputPerOutput);
          if (maxOutputs <= 0) continue;
          // Sell output at D
          for (const dSt of stations) {
            const dItem = dSt.inventory[r.outputId];
            if (!dItem) continue;
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
      ? (a: RouteSuggestion, b: RouteSuggestion) => (b.profitPerDistance - a.profitPerDistance) || (b.estProfit - a.estProfit)
      : (a: RouteSuggestion, b: RouteSuggestion) => (b.estProfit - a.estProfit) || (b.profitPerDistance - a.profitPerDistance);
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
          const adjusted = ensureSpread({ buy: nextBuy, sell: nextSell, minPercent: 0.04, minAbsolute: 2 });
          inv[k] = { ...item, buy: adjusted.buy, sell: adjusted.sell };
        }
        return { ...st, inventory: inv };
      });
    }

    return { ship: { ...state.ship, position, velocity: [vx, vy, vz], enginePower }, stations } as Partial<GameState> as GameState;
  }),
  thrust: (dir, dt) => set((state) => {
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
    if (state.ship.dockedStationId) return state;
    const near = state.stations.find(s => distance(s.position, state.ship.position) < 6);
    if (!near) return state;
    return { ship: { ...state.ship, dockedStationId: near.id, velocity: [0,0,0] } } as Partial<GameState> as GameState;
  }),
  undock: () => set((state) => {
    if (!state.ship.dockedStationId) return state;
    return { ship: { ...state.ship, dockedStationId: undefined } } as Partial<GameState> as GameState;
  }),
  mine: () => set((state) => {
    if (state.ship.dockedStationId) return state;
    if (!state.ship.canMine) return state;
    const belts = state.belts;
    const near = belts.find(b => {
      const d = distance(state.ship.position, b.position);
      return Math.abs(d - b.radius) < 6; // near ring
    });
    if (!near) return state;
    const used = Object.values(state.ship.cargo).reduce((a, b) => a + b, 0);
    if (used >= state.ship.maxCargo) return state;
    const room = state.ship.maxCargo - used;
    const roll = Math.random();
    const ore = roll < 0.5 ? 'iron_ore' : roll < 0.8 ? 'copper_ore' : roll < 0.95 ? 'silicon' : 'rare_minerals';
    const qty = Math.max(1, Math.min(room, Math.round(roll < 0.95 ? (1 + Math.random() * 3) : 1)));
    const cargo = { ...state.ship.cargo, [ore]: (state.ship.cargo[ore] || 0) + qty } as Record<string, number>;
    return { ship: { ...state.ship, cargo } } as Partial<GameState> as GameState;
  }),
  buy: (commodityId, quantity) => set((state) => {
    if (!state.ship.dockedStationId || quantity <= 0) return state;
    const station = state.stations.find(s => s.id === state.ship.dockedStationId);
    if (!station) return state;
    const item = station.inventory[commodityId];
    if (!item) return state;
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
    const station = state.stations.find(s => s.id === state.ship.dockedStationId);
    if (!station) return state;
    const item = station.inventory[commodityId];
    const have = state.ship.cargo[commodityId] || 0;
    if (!item || have <= 0) return state;
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
    if (!station || station.type !== 'shipyard') return state;
    if (state.ship.credits < cost) return state;
    if (type === 'cargo') {
      return { ship: { ...state.ship, credits: state.ship.credits - cost, maxCargo: state.ship.maxCargo + amount } } as Partial<GameState> as GameState;
    }
    if (type === 'mining') {
      if (state.ship.canMine) return state;
      return { ship: { ...state.ship, credits: state.ship.credits - cost, canMine: true } } as Partial<GameState> as GameState;
    }
    const stats = { ...state.ship.stats };
    if (type === 'acc') stats.acc += amount;
    if (type === 'vmax') stats.vmax += amount;
    return { ship: { ...state.ship, credits: state.ship.credits - cost, stats } } as Partial<GameState> as GameState;
  }),
}));


