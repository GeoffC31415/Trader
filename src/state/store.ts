import { create } from 'zustand';
import { ensureSpread, gatedCommodities, getPriceBiasForStation } from '../systems/economy/pricing';
import { processRecipes, findRecipeForStation } from '../systems/economy/recipes';
import { SCALE, sp } from '../domain/constants/world_constants';
import { shipCaps } from '../domain/constants/ship_constants';
import { 
  CONTRACT_PROFIT_MARGINS, 
  CONTRACT_SELL_MULTIPLIERS, 
  CONTRACT_EXPIRATION_TIMES,
  CONTRACTS_PER_STATION,
  CONTRACT_SUGGESTION_LIMIT,
  CONTRACT_MIN_UNITS,
  CONTRACT_MAX_UNITS,
  CONTRACT_MIN_BONUS,
  MISSION_REP_REQUIREMENTS,
} from '../domain/constants/contract_constants';
import { distance, clampMagnitude } from '../shared/math/vec3';
import { planets, stations as initialStations, belts } from './world';
import { spawnNpcTraders, planNpcPath } from './npc';
import { processContractCompletion, processPartialDelivery } from './helpers/contract_helpers';
import { getPriceDiscount, getContractMultiplierBonus, getEscortCount, getEscortCargoCapacity } from './helpers/reputation_helpers';
import type { GameState, RouteSuggestion, Ship, Station, Objective, Contract, NpcTrader } from '../domain/types/world_types';
import type { StationInventory } from '../domain/types/economy_types';

export const useGameStore = create<GameState>((set, get) => ({
  planets,
  stations: initialStations,
  belts,
  npcTraders: spawnNpcTraders(initialStations, 24),
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
    hasMarketIntel: false,
    kind: 'freighter',
    stats: { acc: 12, drag: 1.0, vmax: 12 },
  },
  hasChosenStarter: false,
  tutorialActive: false,
  tutorialStep: 'dock',
  tradeLog: [],
  profitByCommodity: {},
  avgCostByCommodity: {},
  dockIntroVisibleId: undefined,
  objectives: [],
  activeObjectiveId: undefined,
  contracts: [],
  trackedStationId: undefined,
  celebrationVisible: undefined,
  celebrationSellRevenue: undefined,
  celebrationBonusReward: undefined,
  // Generate per-station mission offers (5 each) with rep gates
  // Missions are just contracts with metadata and optional emergency sell multipliers
  getSuggestedRoutes: (opts) => {
    const state = get();
    const stations = state.stations;
    const cargoCapacity = state.ship.maxCargo;
    const hasNav = !!state.ship.hasNavigationArray;
    const hasUnion = !!state.ship.hasUnionMembership;
    const limit = opts?.limit ?? 8;
    const prioritizePerDistance = !!opts?.prioritizePerDistance;
    const suggestions: RouteSuggestion[] = [];
    const isGated = (id: string) => (gatedCommodities as readonly string[]).includes(id as any);
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
          if (ai.canSell === false) continue;
          if (bi.canBuy === false) continue;
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
    for (const p of stations) {
      const recipes = processRecipes[p.type] || [];
      if (recipes.length === 0) continue;
      const canProcessAtP = hasUnion || p.type === 'pirate';
      for (const r of recipes) {
        if (!canProcessAtP) continue;
        if (!hasNav && (isGated(r.inputId) || isGated(r.outputId))) continue;
        for (const s of stations) {
          const sItem = s.inventory[r.inputId];
          if (!sItem || sItem.canSell === false) continue;
          const stockIn = Math.max(0, sItem.stock || 0);
          if (stockIn <= 0) continue;
          const maxInput = Math.max(0, Math.min(stockIn, cargoCapacity));
          const maxOutputs = Math.floor(maxInput / r.inputPerOutput);
          if (maxOutputs <= 0) continue;
          for (const dSt of stations) {
            const dItem = dSt.inventory[r.outputId];
            if (!dItem || dItem.canBuy === false) continue;
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
  // Helper: reputation-based price adjustments
  // Discount applied when buying from a station (max ~10% at 100 rep)
  // Premium applied when selling to a station (max ~7% at 100 rep)
  // Note: We apply only to player transaction prices, not to station inventory values.
  tick: (dt) => set((state) => {
    const drag = state.ship.stats.drag;
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

    const k = 10;
    const a = 1 - Math.exp(-k * dt);
    const enginePower = state.ship.enginePower + (state.ship.engineTarget - state.ship.enginePower) * a;

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

    const stationById: Record<string, Station> = Object.fromEntries(stations.map(s => [s.id, s]));
    const stationStockDelta: Record<string, Record<string, number>> = {};
    const npcTraders = state.npcTraders.map(npc => {
      const dest = stationById[npc.toId];
      const src = stationById[npc.fromId];
      if (!dest || !src) return npc;
      const step = npc.speed * dt;
      let path = npc.path;
      let cursor = npc.pathCursor ?? 0;
      if (!path || path.length < 2) {
        // Lazy plan in case older saves or missing
        const from = stationById[npc.fromId];
        path = planNpcPath(from, dest, npc.position);
        cursor = 1;
      }
      let position: [number, number, number] = npc.position;
      while (cursor < (path?.length || 0)) {
        const target = path![cursor];
        const dx = target[0] - position[0];
        const dy = target[1] - position[1];
        const dz = target[2] - position[2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist <= step) {
          position = [target[0], target[1], target[2]];
          cursor += 1;
          continue;
        }
        const ux = dx / Math.max(1e-6, dist);
        const uy = dy / Math.max(1e-6, dist);
        const uz = dz / Math.max(1e-6, dist);
        position = [ position[0] + ux * step, position[1] + uy * step, position[2] + uz * step ];
        break;
      }
      // Arrived at end of path -> deliver and reverse route
      if (cursor >= (path?.length || 0)) {
        const deliver = 3;
        const srcInv = src.inventory[npc.commodityId];
        const dstInv = dest.inventory[npc.commodityId];
        if (srcInv && srcInv.canSell !== false && dstInv && dstInv.canBuy !== false) {
          stationStockDelta[src.id] = stationStockDelta[src.id] || {};
          stationStockDelta[src.id][npc.commodityId] = (stationStockDelta[src.id][npc.commodityId] || 0) - deliver;
          stationStockDelta[dest.id] = stationStockDelta[dest.id] || {};
          stationStockDelta[dest.id][npc.commodityId] = (stationStockDelta[dest.id][npc.commodityId] || 0) + deliver;
        }
        // Reverse route; plan curved path back
        const backPath = planNpcPath(dest, src, dest.position);
        return { ...npc, position: [dest.position[0], dest.position[1], dest.position[2]], fromId: npc.toId, toId: npc.fromId, path: backPath, pathCursor: 1 };
      }
      return { ...npc, position, path, pathCursor: cursor };
    });

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
    const acc = state.ship.stats.acc;
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
    const next: Partial<GameState> = { ship: { ...state.ship, dockedStationId: near.id, velocity: [0,0,0] } as Ship, dockIntroVisibleId: near.id };
    if (state.tutorialActive && state.tutorialStep === 'dock') {
      (next as any).tutorialStep = 'buy';
    }
    return next as Partial<GameState> as GameState;
  }),
  dismissDockIntro: () => set((state) => {
    if (!state.ship.dockedStationId) return state;
    if (!state.dockIntroVisibleId) return state;
    return { dockIntroVisibleId: undefined } as Partial<GameState> as GameState;
  }),
  undock: () => set((state) => {
    if (!state.hasChosenStarter) return state;
    if (!state.ship.dockedStationId) return state;
    return { ship: { ...state.ship, dockedStationId: undefined }, dockIntroVisibleId: undefined } as Partial<GameState> as GameState;
  }),
  mine: () => set((state) => {
    if (!state.hasChosenStarter) return state;
    if (state.ship.dockedStationId) return state;
    if (!state.ship.canMine) return state;
    const belts = state.belts;
    const near = belts.find(b => {
      const d = distance(state.ship.position, b.position);
      return Math.abs(d - b.radius) < 6 * SCALE;
    });
    if (!near) return state;
    const used = Object.values(state.ship.cargo).reduce((a, b) => a + b, 0);
    if (used >= state.ship.maxCargo) return state;
    const room = state.ship.maxCargo - used;
    const roll = Math.random();
    let ore: keyof Ship['cargo'] = 'iron_ore';
    if (near.tier === 'common') {
      ore = roll < 0.5 ? 'iron_ore' : roll < 0.8 ? 'copper_ore' : roll < 0.95 ? 'silicon' : 'rare_minerals';
    } else {
      ore = roll < 0.3 ? 'iron_ore' : roll < 0.6 ? 'copper_ore' : roll < 0.85 ? 'silicon' : 'rare_minerals';
    }
    const qty = Math.max(1, Math.min(room, Math.round(ore === 'rare_minerals' ? 1 : (1 + Math.random() * 3))));
    const cargo = { ...state.ship.cargo, [ore]: (state.ship.cargo[ore] || 0) + qty } as Record<string, number>;
    return { ship: { ...state.ship, cargo } } as Partial<GameState> as GameState;
  }),
  buy: (commodityId, quantity) => set((state) => {
    if (!state.ship.dockedStationId || quantity <= 0) return state;
    if (!state.ship.hasNavigationArray && (gatedCommodities as readonly string[]).includes(commodityId)) return state;
    const station = state.stations.find(s => s.id === state.ship.dockedStationId);
    if (!station) return state;
    const item = station.inventory[commodityId];
    if (!item || item.canSell === false) return state;
    const rep = station.reputation || 0;
    const buyDiscount = Math.max(0, Math.min(0.10, 0.10 * (rep / 100)));
    const unitBuyPrice = Math.max(1, Math.round(item.buy * (1 - buyDiscount)));
    const totalCost = unitBuyPrice * quantity;
    const used = Object.values(state.ship.cargo).reduce((a, b) => a + b, 0);
    if (state.ship.credits < totalCost) return state;
    if (used + quantity > state.ship.maxCargo) return state;
    const prevQty = state.ship.cargo[commodityId] || 0;
    // Check for active escort and available capacity
    const activeContract = (state.contracts || []).find(c => c.status === 'accepted' && c.commodityId === commodityId);
    const escorts = state.npcTraders.filter(n => n.isEscort && activeContract && n.escortingContract === activeContract.id);
    
    let playerBuying = quantity;
    let escortBuying = 0;
    let npcTraders = [...state.npcTraders];
    
    // Distribute to escort if available
    if (activeContract && escorts.length > 0) {
      const totalEscortCapacity = escorts.reduce((sum, e) => sum + ((e.escortCargoCapacity || 0) - (e.escortCargoUsed || 0)), 0);
      escortBuying = Math.min(quantity, totalEscortCapacity);
      playerBuying = quantity - escortBuying;
      
      // Distribute escort cargo across escorts
      let remaining = escortBuying;
      for (const escort of escorts) {
        if (remaining <= 0) break;
        const escortAvail = (escort.escortCargoCapacity || 0) - (escort.escortCargoUsed || 0);
        const toLoad = Math.min(remaining, escortAvail);
        npcTraders = npcTraders.map(n => 
          n.id === escort.id 
            ? { ...n, escortCargoUsed: (n.escortCargoUsed || 0) + toLoad }
            : n
        );
        remaining -= toLoad;
      }
    }
    
    const cargo = { ...state.ship.cargo, [commodityId]: prevQty + playerBuying };
    const reduced = { ...station.inventory, [commodityId]: { ...item, stock: Math.max(0, (item.stock || 0) - quantity) } };
    // Small reputation increase for fair trade at source
    const repDelta = Math.min(2, 0.02 * quantity);
    const stations = state.stations.map(s => s.id === station.id ? { ...s, inventory: reduced, reputation: Math.max(0, Math.min(100, (s.reputation || 0) + repDelta)) } : s);
    const avgMap = { ...state.avgCostByCommodity } as Record<string, number>;
    const oldAvg = avgMap[commodityId] || 0;
    const newQty = prevQty + playerBuying;
    const newAvg = newQty > 0 ? ((oldAvg * prevQty) + (unitBuyPrice * playerBuying)) / newQty : 0;
    avgMap[commodityId] = newAvg;
    const trade = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      time: Date.now(),
      stationId: station.id,
      stationName: station.name,
      stationType: station.type,
      commodityId,
      type: 'buy' as const,
      quantity,
      unitPrice: unitBuyPrice,
      totalPrice: totalCost,
    };
    const tradeLog = [...state.tradeLog, trade];
    const next: Partial<GameState> = { ship: { ...state.ship, credits: state.ship.credits - totalCost, cargo } as Ship, stations, avgCostByCommodity: avgMap, tradeLog, npcTraders };
    if (state.tutorialActive && state.tutorialStep === 'buy') {
      (next as any).tutorialStep = 'sell';
    }
    return next as Partial<GameState> as GameState;
  }),
  sell: (commodityId, quantity) => set((state) => {
    if (!state.ship.dockedStationId || quantity <= 0) return state;
    if (!state.ship.hasNavigationArray && (gatedCommodities as readonly string[]).includes(commodityId)) return state;
    const station = state.stations.find(s => s.id === state.ship.dockedStationId);
    if (!station) return state;
    const item = station.inventory[commodityId];
    
    // Check escort cargo
    const activeContract = (state.contracts || []).find(c => 
      c.status === 'accepted' && 
      c.toId === station.id && 
      c.commodityId === commodityId
    );
    const escorts = state.npcTraders.filter(n => n.isEscort && activeContract && n.escortingContract === activeContract.id);
    const escortCargo = escorts.reduce((sum, e) => sum + (e.escortCargoUsed || 0), 0);
    
    const have = state.ship.cargo[commodityId] || 0;
    const totalAvailable = have + escortCargo;
    if (!item || item.canBuy === false || totalAvailable <= 0) return state;
    if (totalAvailable < quantity) return state;
    
    // Sell from escort first, then player
    let fromEscort = Math.min(quantity, escortCargo);
    let fromPlayer = quantity - fromEscort;
    
    if (have < fromPlayer) return state; // Not enough in player cargo
    
    const qty = quantity;
    const rep = station.reputation || 0;
    const sellPremium = Math.max(0, Math.min(0.07, 0.07 * (rep / 100)));
    const unitSellPrice = Math.max(1, Math.round(item.sell * (1 + sellPremium)));
    const revenue = unitSellPrice * qty;
    const cargo = { ...state.ship.cargo, [commodityId]: have - fromPlayer };
    let nextInv = { ...station.inventory } as StationInventory;
    nextInv[commodityId] = { ...item, stock: (item.stock || 0) + qty };
    if (station.type === 'refinery') {
      const recipe = findRecipeForStation('refinery', commodityId);
      if (recipe) {
        const produced = Math.floor(qty / recipe.inputPerOutput);
        const remainder = qty % recipe.inputPerOutput;
        const outItem = nextInv[recipe.outputId];
        if (outItem) {
          nextInv[recipe.outputId] = { ...outItem, stock: (outItem.stock || 0) + produced };
        }
        nextInv[commodityId] = { ...nextInv[commodityId], stock: ((nextInv[commodityId].stock || 0) - qty) + remainder };
      }
    }
    // Reputation gain scales with station need and quantity
    const bias = getPriceBiasForStation(station.type as any, commodityId);
    const biasW = bias === 'expensive' ? 1.6 : (bias === 'cheap' ? 0.6 : 1.0);
    const priceW = Math.max(0.6, Math.min(2.0, (item.sell || 1) / Math.max(1, item.buy || 1)));
    const repDelta = Math.min(5, 0.06 * qty * biasW * priceW);
    const stations = state.stations.map(s => s.id === station.id ? { ...s, inventory: nextInv, reputation: Math.max(0, Math.min(100, (s.reputation || 0) + repDelta)) } : s);
    const avgMap = { ...state.avgCostByCommodity } as Record<string, number>;
    const avgCost = avgMap[commodityId] || 0;
    const realized = (unitSellPrice - avgCost) * qty;
    const profit = { ...state.profitByCommodity } as Record<string, number>;
    profit[commodityId] = (profit[commodityId] || 0) + realized;
    if ((cargo[commodityId] || 0) === 0) {
      avgMap[commodityId] = 0;
    }
    const trade = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      time: Date.now(),
      stationId: station.id,
      stationName: station.name,
      stationType: station.type,
      commodityId,
      type: 'sell' as const,
      quantity: qty,
      unitPrice: unitSellPrice,
      totalPrice: revenue,
    };
    const tradeLog = [...state.tradeLog, trade];
    
    // Check for contract progress/completion
    let contracts = state.contracts || [];
    let objectives = state.objectives || [];
    let activeObjectiveId = state.activeObjectiveId;
    let totalCredits = state.ship.credits + revenue;
    let showCelebration = false;
    let celebrationBuyCost = 0;
    let celebrationSellRev = 0;
    let celebrationBonusAmount = 0;
    let npcTraders = [...state.npcTraders];
    
    // Clear escort cargo
    if (fromEscort > 0 && activeContract) {
      let remainingToClear = fromEscort;
      for (const escort of escorts) {
        if (remainingToClear <= 0) break;
        const escortHas = escort.escortCargoUsed || 0;
        const toClear = Math.min(remainingToClear, escortHas);
        npcTraders = npcTraders.map(n => 
          n.id === escort.id 
            ? { ...n, escortCargoUsed: (n.escortCargoUsed || 0) - toClear }
            : n
        );
        remainingToClear -= toClear;
      }
    }
    
    if (activeContract) {
      const previousDelivered = activeContract.deliveredUnits || 0;
      const remainingNeeded = activeContract.units - previousDelivered;
      const nowDelivering = Math.min(qty, remainingNeeded);
      const newTotalDelivered = previousDelivered + nowDelivering;
      
      // Apply contract pricing to delivered units
      let unitPay = unitSellPrice;
      if (activeContract.sellMultiplier && activeContract.sellMultiplier > 1) {
        unitPay = Math.max(1, Math.round(unitSellPrice * activeContract.sellMultiplier));
      }
      // Add extra revenue for contract units
      const extraRevenue = (unitPay - unitSellPrice) * nowDelivering;
      totalCredits += extraRevenue;
      
      // Check if contract is now complete
      if (newTotalDelivered >= activeContract.units) {
        // Contract completed! Process completion
        const completion = processContractCompletion({
          activeContract,
          nowDelivering,
          unitSellPrice,
          tradeLog,
          contracts,
          objectives,
          activeObjectiveId,
        });
        
        contracts = completion.contracts;
        objectives = completion.objectives;
        activeObjectiveId = completion.activeObjectiveId;
        celebrationBuyCost = completion.celebrationBuyCost;
        celebrationSellRev = completion.celebrationSellRevenue;
        celebrationBonusAmount = completion.celebrationBonusAmount;
        totalCredits += completion.bonusCredits;
        showCelebration = true;
        
        // Despawn escorts for this contract
        npcTraders = npcTraders.filter(n => !(n.isEscort && n.escortingContract === activeContract.id));
      } else {
        // Partial delivery - update progress
        contracts = processPartialDelivery({
          activeContract,
          newTotalDelivered,
          contracts,
        });
      }
    }
    
    const next: Partial<GameState> = { 
      ship: { ...state.ship, credits: totalCredits, cargo } as Ship, 
      stations, 
      profitByCommodity: profit, 
      avgCostByCommodity: avgMap, 
      tradeLog,
      contracts,
      objectives,
      activeObjectiveId,
      npcTraders,
      celebrationVisible: showCelebration ? Date.now() : state.celebrationVisible,
      celebrationBuyCost: showCelebration ? celebrationBuyCost : state.celebrationBuyCost,
      celebrationSellRevenue: showCelebration ? celebrationSellRev : state.celebrationSellRevenue,
      celebrationBonusReward: showCelebration ? celebrationBonusAmount : state.celebrationBonusReward
    };
    if (state.tutorialActive) {
      if (state.tutorialStep === 'sell') {
        (next as any).tutorialStep = 'join_union';
      } else if (state.tutorialStep === 'fabricate_sell') {
        (next as any).tutorialStep = 'done';
        (next as any).tutorialActive = false;
      }
    }
    return next as Partial<GameState> as GameState;
  }),
  process: (inputId, outputs) => set((state) => {
    if (!state.ship.dockedStationId || outputs <= 0) return state;
    const station = state.stations.find(s => s.id === state.ship.dockedStationId);
    if (!station) return state;
    const recipe = findRecipeForStation(station.type, inputId);
    if (!recipe) return state;
    if (!state.ship.hasNavigationArray && (gatedCommodities as readonly string[]).includes(recipe.outputId)) return state;
    const atPirate = station.type === 'pirate';
    if (!atPirate && !state.ship.hasUnionMembership) return state;
    const have = state.ship.cargo[inputId] || 0;
    const maxOutputs = Math.floor(have / recipe.inputPerOutput);
    const outCount = Math.max(0, Math.min(outputs, maxOutputs));
    if (outCount <= 0) return state;
    const newCargo = { ...state.ship.cargo };
    newCargo[inputId] = have - outCount * recipe.inputPerOutput;
    newCargo[recipe.outputId] = (newCargo[recipe.outputId] || 0) + outCount;
    const next: Partial<GameState> = { ship: { ...state.ship, cargo: newCargo } as Ship };
    if (state.tutorialActive && state.tutorialStep === 'fabricate_process') {
      (next as any).tutorialStep = 'fabricate_sell';
    }
    return next as Partial<GameState> as GameState;
  }),
  upgrade: (type, amount, cost) => set((state) => {
    if (!state.ship.dockedStationId) return state;
    const station = state.stations.find(s => s.id === state.ship.dockedStationId);
    if (!station) return state;
    if ((type === 'acc' || type === 'vmax' || type === 'cargo' || type === 'mining' || type === 'navigation' || type === 'intel') && station.type !== 'shipyard') return state;
    if (state.ship.credits < cost) return state;
    if (type === 'cargo') {
      if (state.ship.maxCargo >= shipCaps[state.ship.kind].cargo) return state;
      if (state.ship.maxCargo + amount > shipCaps[state.ship.kind].cargo) return state;
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
    if (type === 'intel') {
      if (state.ship.hasMarketIntel) return state;
      return { ship: { ...state.ship, credits: state.ship.credits - cost, hasMarketIntel: true } } as Partial<GameState> as GameState;
    }
    if (type === 'union') {
      if (station.type !== 'city') return state;
      if (state.ship.hasUnionMembership) return state;
      const next: Partial<GameState> = { ship: { ...state.ship, credits: state.ship.credits - cost, hasUnionMembership: true } as Ship };
      if (state.tutorialActive && state.tutorialStep === 'join_union') {
        (next as any).tutorialStep = 'fabricate_process';
      }
      return next as Partial<GameState> as GameState;
    }
    const stats = { ...state.ship.stats };
    if (type === 'acc') {
      if (stats.acc >= shipCaps[state.ship.kind].acc) return state;
      if (stats.acc + amount > shipCaps[state.ship.kind].acc) return state;
      stats.acc += amount;
    }
    if (type === 'vmax') {
      if (stats.vmax >= shipCaps[state.ship.kind].vmax) return state;
      if (stats.vmax + amount > shipCaps[state.ship.kind].vmax) return state;
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
      next = { position: basePosition, velocity: baseVelocity, credits: state.ship.credits - cost, cargo: {}, maxCargo: 300, canMine: state.ship.canMine, enginePower: 0, engineTarget: 0, hasNavigationArray: state.ship.hasNavigationArray, hasUnionMembership: state.ship.hasUnionMembership, hasMarketIntel: state.ship.hasMarketIntel, kind: 'freighter', stats: { acc: 10, drag: 1.0, vmax: 11 } };
    } else if (kind === 'clipper') {
      next = { position: basePosition, velocity: baseVelocity, credits: state.ship.credits - cost, cargo: {}, maxCargo: 60, canMine: state.ship.canMine, enginePower: 0, engineTarget: 0, hasNavigationArray: state.ship.hasNavigationArray, hasUnionMembership: state.ship.hasUnionMembership, hasMarketIntel: state.ship.hasMarketIntel, kind: 'clipper', stats: { acc: 18, drag: 0.9, vmax: 20 } };
    } else if (kind === 'miner') {
      next = { position: basePosition, velocity: baseVelocity, credits: state.ship.credits - cost, cargo: {}, maxCargo: 80, canMine: true, enginePower: 0, engineTarget: 0, hasNavigationArray: state.ship.hasNavigationArray, hasUnionMembership: state.ship.hasUnionMembership, hasMarketIntel: state.ship.hasMarketIntel, kind: 'miner', stats: { acc: 9, drag: 1.1, vmax: 11 } };
    } else if (kind === 'heavy_freighter') {
      next = { position: basePosition, velocity: baseVelocity, credits: state.ship.credits - cost, cargo: {}, maxCargo: 600, canMine: state.ship.canMine, enginePower: 0, engineTarget: 0, hasNavigationArray: state.ship.hasNavigationArray, hasUnionMembership: state.ship.hasUnionMembership, hasMarketIntel: state.ship.hasMarketIntel, kind: 'heavy_freighter', stats: { acc: 9, drag: 1.0, vmax: 12 } };
    } else if (kind === 'racer') {
      next = { position: basePosition, velocity: baseVelocity, credits: state.ship.credits - cost, cargo: {}, maxCargo: 40, canMine: state.ship.canMine, enginePower: 0, engineTarget: 0, hasNavigationArray: state.ship.hasNavigationArray, hasUnionMembership: state.ship.hasUnionMembership, hasMarketIntel: state.ship.hasMarketIntel, kind: 'racer', stats: { acc: 24, drag: 0.85, vmax: 28 } };
    } else if (kind === 'industrial_miner') {
      next = { position: basePosition, velocity: baseVelocity, credits: state.ship.credits - cost, cargo: {}, maxCargo: 160, canMine: true, enginePower: 0, engineTarget: 0, hasNavigationArray: state.ship.hasNavigationArray, hasUnionMembership: state.ship.hasUnionMembership, hasMarketIntel: state.ship.hasMarketIntel, kind: 'industrial_miner', stats: { acc: 10, drag: 1.05, vmax: 12 } };
    }
    next = { ...next!, dockedStationId: state.ship.dockedStationId } as Ship;
    return { ship: next } as Partial<GameState> as GameState;
  }),
  chooseStarter: (kind, opts) => set((state) => {
    const basePosition: [number, number, number] = state.ship.position;
    const baseVelocity: [number, number, number] = [0, 0, 0];
    if (kind === 'freighter') {
      const ship: Ship = { position: basePosition, velocity: baseVelocity, credits: 10000, cargo: {}, maxCargo: 300, canMine: false, enginePower: 0, engineTarget: 0, hasNavigationArray: false, hasUnionMembership: false, hasMarketIntel: false, kind: 'freighter', stats: { acc: 10, drag: 1.0, vmax: 11 } };
      return { ship, hasChosenStarter: true, tutorialActive: !!opts?.tutorial, tutorialStep: 'dock' } as Partial<GameState> as GameState;
    }
    if (kind === 'clipper') {
      const ship: Ship = { position: basePosition, velocity: baseVelocity, credits: 10000, cargo: {}, maxCargo: 60, canMine: false, enginePower: 0, engineTarget: 0, hasNavigationArray: false, hasUnionMembership: false, hasMarketIntel: false, kind: 'clipper', stats: { acc: 18, drag: 0.9, vmax: 20 } };
      return { ship, hasChosenStarter: true, tutorialActive: !!opts?.tutorial, tutorialStep: 'dock' } as Partial<GameState> as GameState;
    }
    if ((kind as any) === 'test') {
      // Spawn a racer with all upgrades and max caps for testing
      const credits = 999999;
      const kindR: Ship['kind'] = 'racer';
      const ship: Ship = {
        position: basePosition,
        velocity: baseVelocity,
        credits,
        cargo: {},
        maxCargo: shipCaps[kindR].cargo,
        canMine: true,
        enginePower: 0,
        engineTarget: 0,
        hasNavigationArray: true,
        hasUnionMembership: true,
        hasMarketIntel: true,
        kind: kindR,
        stats: { acc: shipCaps[kindR].acc, drag: 0.85, vmax: shipCaps[kindR].vmax },
      };
      return { ship, hasChosenStarter: true, tutorialActive: false, tutorialStep: 'dock' } as Partial<GameState> as GameState;
    }
    const ship: Ship = { position: basePosition, velocity: baseVelocity, credits: 0, cargo: {}, maxCargo: 80, canMine: true, enginePower: 0, engineTarget: 0, hasNavigationArray: false, hasUnionMembership: false, hasMarketIntel: false, kind: 'miner', stats: { acc: 9, drag: 1.1, vmax: 11 } };
    return { ship, hasChosenStarter: true, tutorialActive: !!opts?.tutorial, tutorialStep: 'dock' } as Partial<GameState> as GameState;
  }),
  setTutorialActive: (active) => set((state) => {
    if (state.tutorialActive === active) return state;
    const next: Partial<GameState> = { tutorialActive: active };
    if (active && state.tutorialStep === 'done') (next as any).tutorialStep = 'dock';
    return next as Partial<GameState> as GameState;
  }),
  setTutorialStep: (step) => set((state) => {
    if (state.tutorialStep === step) return state;
    return { tutorialStep: step } as Partial<GameState> as GameState;
  }),
  setTrackedStation: (stationId) => set((state) => {
    return { trackedStationId: stationId } as Partial<GameState> as GameState;
  }),
  generateContracts: (opts) => set((state) => {
    const limit = opts?.limit ?? CONTRACTS_PER_STATION;
    const stations = state.stations;
    const nextContracts = [...(state.contracts || [])].filter(c => c.status !== 'offered');
    for (const st of stations) {
      // Derive candidate routes where goods are needed AT this station (destination)
      const suggestions = state.getSuggestedRoutes({ limit: CONTRACT_SUGGESTION_LIMIT, prioritizePerDistance: true })
        .filter(r => r.toId === st.id);
      // Choose up to 5 missions per station with increasing rep gates
      const picks = suggestions.slice(0, 10);
      const perStation: Contract[] = [];
      for (let i = 0; i < Math.min(CONTRACTS_PER_STATION, picks.length); i++) {
        const r = picks[i];
        const units = Math.max(CONTRACT_MIN_UNITS, Math.min(CONTRACT_MAX_UNITS, r.maxUnits));
        const tag: Contract['tag'] = i === 0 ? 'standard' : (i === 1 ? 'bulk' : (i === 2 ? 'rush' : (i === 3 ? 'fabrication' : 'emergency')));
        const requiredRep = MISSION_REP_REQUIREMENTS[i];
        // Apply reputation bonus to contract multipliers
        const stationRep = st.reputation || 0;
        const baseMultiplier = CONTRACT_SELL_MULTIPLIERS[tag];
        const repBonus = getContractMultiplierBonus(stationRep);
        const sellMultiplier = baseMultiplier + repBonus;
        const fromId = r.fromId;
        const toId = r.toId;
        const offeredById = st.id;
        const title = tag === 'emergency'
          ? `Emergency: ${r.inputId.replace(/_/g,' ')} to ${r.toName}`
          : tag === 'rush'
          ? `Rush Delivery: ${r.inputId.replace(/_/g,' ')} to ${r.toName}`
          : tag === 'bulk'
          ? `Bulk Order: ${units} ${r.inputId.replace(/_/g,' ')}`
          : tag === 'fabrication'
          ? `Process & Deliver: ${r.inputId.replace(/_/g,' ')} via ${r.viaName}`
          : `Standard Run: ${r.inputId.replace(/_/g,' ')} to ${r.toName}`;
        // Ensure profitability: bonus should cover buying costs + profit margin
        // Total payout = (unitSell * units) + rewardBonus
        // Player cost = (unitBuy * units)
        // We want: Total payout > Player cost with good margin
        const buyCost = r.unitBuy * units;
        const sellRevenue = r.unitSell * units * sellMultiplier;
        const baseProfit = sellRevenue - buyCost;
        // Add bonus to ensure minimum profit margin on total investment
        const minProfitMargin = CONTRACT_PROFIT_MARGINS[tag];
        const desiredProfit = buyCost * minProfitMargin;
        const rewardBonus = Math.max(CONTRACT_MIN_BONUS, Math.round(Math.max(0, desiredProfit - baseProfit) + (buyCost * 0.15)));
        perStation.push({
          id: `m:${st.id}:${i}:${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
          fromId,
          toId,
          commodityId: r.inputId,
          units,
          unitBuy: r.unitBuy,
          unitSell: r.unitSell,
          rewardBonus,
          status: 'offered',
          expiresAt: Date.now() + (tag === 'rush' ? CONTRACT_EXPIRATION_TIMES.rush : CONTRACT_EXPIRATION_TIMES.default),
          offeredById,
          requiredRep,
          title,
          tag,
          sellMultiplier: sellMultiplier,
        });
      }
      nextContracts.push(...perStation);
      if (nextContracts.length >= limit * stations.length) break;
    }
    return { contracts: nextContracts } as Partial<GameState> as GameState;
  }),
  acceptContract: (id) => set((state) => {
    const contracts = (state.contracts || []).map(c => c.id === id ? { ...c, status: 'accepted' } : c);
    const chosen = contracts.find(c => c.id === id);
    const objectives: Objective[] = [...(state.objectives || [])];
    let npcTraders = [...state.npcTraders];
    
    if (chosen) {
      const stationName = state.stations.find(s => s.id === chosen.toId)?.name || chosen.toId;
      const obj: Objective = { 
        id: `obj:${id}`, 
        label: `Deliver ${chosen.units} ${chosen.commodityId.replace(/_/g,' ')} to ${stationName}`, 
        targetStationId: chosen.toId, 
        kind: 'contract', 
        status: 'active' 
      };
      objectives.push(obj);
      
      // Spawn escort ships based on reputation at offering station
      const offeringStation = state.stations.find(s => s.id === chosen.offeredById);
      if (offeringStation) {
        const stationRep = offeringStation.reputation || 0;
        const escortCount = getEscortCount(stationRep);
        const playerCargo = shipCaps[state.ship.kind]?.cargo ?? 100;
        const escortCargoPerShip = Math.floor(playerCargo * 0.5);
        
        for (let i = 0; i < escortCount; i++) {
          const escortId = `escort:${id}:${i}`;
          const escort: NpcTrader = {
            id: escortId,
            shipKind: 'clipper',
            commodityId: chosen.commodityId,
            fromId: chosen.offeredById,
            toId: chosen.toId,
            speed: 80,
            position: [
              state.ship.position[0] + (i + 1) * 30,
              state.ship.position[1],
              state.ship.position[2] + (i + 1) * 30,
            ],
            velocity: [0, 0, 0],
            isEscort: true,
            escortingContract: id,
            escortCargoCapacity: escortCargoPerShip,
            escortCargoUsed: 0,
          };
          npcTraders.push(escort);
        }
      }
    }
    
    return { 
      contracts, 
      objectives, 
      npcTraders,
      activeObjectiveId: chosen ? `obj:${id}` : state.activeObjectiveId, 
      trackedStationId: chosen?.toId || state.trackedStationId 
    } as Partial<GameState> as GameState;
  }),
  abandonContract: (id) => set((state) => {
    const contracts = (state.contracts || []).map(c => c.id === id ? { ...c, status: 'failed' } : c);
    // Minor rep penalty at destination if known
    const chosen = (state.contracts || []).find(c => c.id === id);
    let stations = state.stations;
    if (chosen?.toId) {
      stations = stations.map(s => s.id === chosen.toId ? { ...s, reputation: Math.max(0, ((s.reputation || 0) - 2)) } : s);
    }
    const objectives = (state.objectives || []).map(o => o.id === `obj:${id}` ? { ...o, status: 'failed' } : o);
    const activeObjectiveId = state.activeObjectiveId === `obj:${id}` ? undefined : state.activeObjectiveId;
    
    // Despawn escorts for this contract
    const npcTraders = state.npcTraders.filter(n => !(n.isEscort && n.escortingContract === id));
    
    return { contracts, stations, objectives, activeObjectiveId, npcTraders } as Partial<GameState> as GameState;
  }),
}));


