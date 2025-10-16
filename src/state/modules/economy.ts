/**
 * Economy Module
 * 
 * Handles trading, route suggestions, pricing, processing, and ship upgrades.
 */

import { distance } from '../../shared/math/vec3';
import { gatedCommodities, ensureSpread, getPriceBiasForStation } from '../../systems/economy/pricing';
import { processRecipes, findRecipeForStation } from '../../systems/economy/recipes';
import { shipCaps } from '../../domain/constants/ship_constants';
import { applyReputationWithPropagation } from '../../systems/reputation/faction_system';
import { 
  applyReputationToBuyPrice, 
  applyReputationToSellPrice,
  getReputationFromBuy,
  getReputationFromSell,
  getEscortCargoCapacity 
} from './reputation';
import type { 
  Ship, 
  Station, 
  RouteSuggestion, 
  NpcTrader 
} from '../../domain/types/world_types';
import type { StationInventory } from '../../domain/types/economy_types';

/**
 * Options for route suggestions
 */
export interface RouteSuggestionOptions {
  limit?: number;
  prioritizePerDistance?: boolean;
}

/**
 * Get suggested trading routes
 * 
 * @param stations - All stations
 * @param ship - Player ship (for cargo capacity and upgrades)
 * @param opts - Options for filtering routes
 * @returns Array of route suggestions sorted by profitability
 */
export function getSuggestedRoutes(
  stations: Station[],
  ship: Ship,
  opts?: RouteSuggestionOptions
): RouteSuggestion[] {
  const cargoCapacity = ship.maxCargo;
  const hasNav = !!ship.hasNavigationArray;
  const hasUnion = !!ship.hasUnionMembership;
  const limit = opts?.limit ?? 8;
  const prioritizePerDistance = !!opts?.prioritizePerDistance;

  const suggestions: RouteSuggestion[] = [];
  const isGated = (id: string) =>
    (gatedCommodities as readonly string[]).includes(id as any);

  // Direct trading routes
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
          fromId: a.id,
          fromName: a.name,
          fromType: a.type,
          toId: b.id,
          toName: b.name,
          toType: b.type,
          inputId: id as any,
          outputId: id as any,
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

  // Processing routes
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
          const unitMargin = unitSellOut - unitBuyIn * r.inputPerOutput;
          if (unitMargin <= 0) continue;

          const d1 = distance(s.position, p.position);
          const d2 = distance(p.position, dSt.position);
          const tripDist = d1 + d2;
          const estProfit = unitMargin * maxOutputs;
          const profitPerDistance = tripDist > 0 ? estProfit / tripDist : estProfit;

          suggestions.push({
            id: `proc:${r.inputId}->${r.outputId}:${s.id}->${p.id}->${dSt.id}`,
            kind: 'process',
            fromId: s.id,
            fromName: s.name,
            fromType: s.type,
            viaId: p.id,
            viaName: p.name,
            viaType: p.type,
            toId: dSt.id,
            toName: dSt.name,
            toType: dSt.type,
            inputId: r.inputId as any,
            outputId: r.outputId as any,
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

  // Sort by priority
  const sorter = prioritizePerDistance
    ? (a: RouteSuggestion, b: RouteSuggestion) =>
        b.profitPerDistance - a.profitPerDistance ||
        b.estProfit - a.estProfit ||
        a.tripDistance - b.tripDistance ||
        a.id.localeCompare(b.id)
    : (a: RouteSuggestion, b: RouteSuggestion) =>
        b.estProfit - a.estProfit ||
        b.profitPerDistance - a.profitPerDistance ||
        a.tripDistance - b.tripDistance ||
        a.id.localeCompare(b.id);

  return suggestions.sort(sorter).slice(0, limit);
}

/**
 * Jitter station prices randomly
 * 
 * @param stations - Current stations
 * @param dt - Delta time (affects jitter probability)
 * @returns Updated stations with jittered prices
 */
export function jitterPrices(stations: Station[], dt: number): Station[] {
  const jitterChance = Math.min(1, dt * 2);
  
  if (Math.random() >= jitterChance) {
    return stations; // No jitter this frame
  }

  return stations.map(st => {
    const inv = { ...st.inventory } as StationInventory;
    const keys = Object.keys(inv);

    // Jitter 3 random commodities per station
    for (let i = 0; i < 3; i++) {
      const k = keys[Math.floor(Math.random() * keys.length)];
      const item = inv[k];
      if (!item) continue;

      const factorBuy = 1 + (Math.random() * 2 - 1) * 0.1;
      const factorSell = 1 + (Math.random() * 2 - 1) * 0.1;
      const nextBuy = Math.max(1, Math.round(item.buy * factorBuy));
      const nextSell = Math.max(1, Math.round(item.sell * factorSell));
      const adjusted = ensureSpread({
        buy: nextBuy,
        sell: nextSell,
        minPercent: 0.08,
        minAbsolute: 3,
      });

      inv[k] = { ...item, buy: adjusted.buy, sell: adjusted.sell };
    }

    return { ...st, inventory: inv };
  });
}

/**
 * Result of buy action
 */
export interface BuyResult {
  ship: Ship;
  stations: Station[];
  npcTraders: NpcTrader[];
  avgCostByCommodity: Record<string, number>;
  trade: any;
}

/**
 * Buy commodity from docked station
 * 
 * @param ship - Player ship
 * @param stations - All stations
 * @param npcTraders - All NPC traders (for escort handling)
 * @param avgCostByCommodity - Running average costs
 * @param commodityId - Commodity to buy
 * @param quantity - Amount to buy
 * @param activeContract - Active contract if any
 * @returns Updated state or null if can't buy
 */
export function buyCommodity(
  ship: Ship,
  stations: Station[],
  npcTraders: NpcTrader[],
  avgCostByCommodity: Record<string, number>,
  commodityId: string,
  quantity: number,
  activeContract: any
): BuyResult | null {
  if (!ship.dockedStationId || quantity <= 0) return null;
  if (!ship.hasNavigationArray && (gatedCommodities as readonly string[]).includes(commodityId))
    return null;

  const station = stations.find(s => s.id === ship.dockedStationId);
  if (!station) return null;

  const item = station.inventory[commodityId];
  if (!item || item.canSell === false) return null;

  const rep = station.reputation || 0;
  const unitBuyPrice = applyReputationToBuyPrice(item.buy, rep);
  const totalCost = unitBuyPrice * quantity;

  const used = Object.values(ship.cargo).reduce((a, b) => a + b, 0);
  if (ship.credits < totalCost) return null;
  if (used + quantity > ship.maxCargo) return null;

  const prevQty = ship.cargo[commodityId] || 0;

  // Check for active escort and available capacity
  const escorts = npcTraders.filter(
    n => n.isEscort && activeContract && n.escortingContract === activeContract.id
  );

  let playerBuying = quantity;
  let escortBuying = 0;
  let updatedNpcTraders = [...npcTraders];

  // Distribute to escort if available
  if (activeContract && escorts.length > 0) {
    const totalEscortCapacity = escorts.reduce(
      (sum, e) => sum + ((e.escortCargoCapacity || 0) - (e.escortCargoUsed || 0)),
      0
    );
    escortBuying = Math.min(quantity, totalEscortCapacity);
    playerBuying = quantity - escortBuying;

    // Distribute escort cargo across escorts
    let remaining = escortBuying;
    for (const escort of escorts) {
      if (remaining <= 0) break;
      const escortAvail =
        (escort.escortCargoCapacity || 0) - (escort.escortCargoUsed || 0);
      const toLoad = Math.min(remaining, escortAvail);
      updatedNpcTraders = updatedNpcTraders.map(n =>
        n.id === escort.id
          ? { ...n, escortCargoUsed: (n.escortCargoUsed || 0) + toLoad }
          : n
      );
      remaining -= toLoad;
    }
  }

  const cargo = { ...ship.cargo, [commodityId]: prevQty + playerBuying };
  const reduced = {
    ...station.inventory,
    [commodityId]: {
      ...item,
      stock: Math.max(0, (item.stock || 0) - quantity),
    },
  };

  // Small reputation increase for fair trade at source
  const repDelta = getReputationFromBuy(quantity);
  const updatedStations = applyReputationWithPropagation(
    stations.map(s => (s.id === station.id ? { ...s, inventory: reduced } : s)),
    station.id,
    repDelta
  );

  const avgMap = { ...avgCostByCommodity } as Record<string, number>;
  const oldAvg = avgMap[commodityId] || 0;
  const newQty = prevQty + playerBuying;
  const newAvg =
    newQty > 0 ? (oldAvg * prevQty + unitBuyPrice * playerBuying) / newQty : 0;
  avgMap[commodityId] = newAvg;

  const trade = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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

  return {
    ship: { ...ship, credits: ship.credits - totalCost, cargo } as Ship,
    stations: updatedStations,
    npcTraders: updatedNpcTraders,
    avgCostByCommodity: avgMap,
    trade,
  };
}

/**
 * Sell commodity result (simplified - full version in store handles contracts/missions)
 */
export interface SellBaseResult {
  ship: Ship;
  stations: Station[];
  npcTraders: NpcTrader[];
  profitByCommodity: Record<string, number>;
  avgCostByCommodity: Record<string, number>;
  revenue: number;
  unitSellPrice: number;
  quantity: number;
  trade: any;
}

/**
 * Sell commodity to docked station (base logic without contract handling)
 * 
 * @param ship - Player ship
 * @param stations - All stations
 * @param npcTraders - All NPC traders (for escort handling)
 * @param profitByCommodity - Running profit tracking
 * @param avgCostByCommodity - Running average costs
 * @param commodityId - Commodity to sell
 * @param quantity - Amount to sell
 * @param escorts - Escort NPCs carrying cargo
 * @returns Updated state or null if can't sell
 */
export function sellCommodity(
  ship: Ship,
  stations: Station[],
  npcTraders: NpcTrader[],
  profitByCommodity: Record<string, number>,
  avgCostByCommodity: Record<string, number>,
  commodityId: string,
  quantity: number,
  escorts: NpcTrader[]
): SellBaseResult | null {
  if (!ship.dockedStationId || quantity <= 0) return null;
  if (!ship.hasNavigationArray && (gatedCommodities as readonly string[]).includes(commodityId))
    return null;

  const station = stations.find(s => s.id === ship.dockedStationId);
  if (!station) return null;

  const item = station.inventory[commodityId];
  const escortCargo = escorts.reduce((sum, e) => sum + (e.escortCargoUsed || 0), 0);
  const have = ship.cargo[commodityId] || 0;
  const totalAvailable = have + escortCargo;

  if (!item || item.canBuy === false || totalAvailable <= 0) return null;
  if (totalAvailable < quantity) return null;

  // Sell from escort first, then player
  let fromEscort = Math.min(quantity, escortCargo);
  let fromPlayer = quantity - fromEscort;

  if (have < fromPlayer) return null; // Not enough in player cargo

  const qty = quantity;
  const rep = station.reputation || 0;
  const unitSellPrice = applyReputationToSellPrice(item.sell, rep);
  const revenue = unitSellPrice * qty;
  const cargo = { ...ship.cargo, [commodityId]: have - fromPlayer };

  let nextInv = { ...station.inventory } as StationInventory;
  nextInv[commodityId] = { ...item, stock: (item.stock || 0) + qty };

  // Auto-processing at refineries
  if (station.type === 'refinery') {
    const recipe = findRecipeForStation('refinery', commodityId);
    if (recipe) {
      const produced = Math.floor(qty / recipe.inputPerOutput);
      const remainder = qty % recipe.inputPerOutput;
      const outItem = nextInv[recipe.outputId];
      if (outItem) {
        nextInv[recipe.outputId] = {
          ...outItem,
          stock: (outItem.stock || 0) + produced,
        };
      }
      nextInv[commodityId] = {
        ...nextInv[commodityId],
        stock: (nextInv[commodityId].stock || 0) - qty + remainder,
      };
    }
  }

  // Reputation gain
  const bias = getPriceBiasForStation(station.type as any, commodityId);
  const repDelta = getReputationFromSell(qty, bias, item.sell, item.buy);
  const updatedStations = applyReputationWithPropagation(
    stations.map(s => (s.id === station.id ? { ...s, inventory: nextInv } : s)),
    station.id,
    repDelta
  );

  const avgMap = { ...avgCostByCommodity } as Record<string, number>;
  const avgCost = avgMap[commodityId] || 0;
  const realized = (unitSellPrice - avgCost) * qty;
  const profit = { ...profitByCommodity } as Record<string, number>;
  profit[commodityId] = (profit[commodityId] || 0) + realized;

  if ((cargo[commodityId] || 0) === 0) {
    avgMap[commodityId] = 0;
  }

  const trade = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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

  // Clear escort cargo
  let updatedNpcTraders = [...npcTraders];
  if (fromEscort > 0) {
    let remainingToClear = fromEscort;
    for (const escort of escorts) {
      if (remainingToClear <= 0) break;
      const escortHas = escort.escortCargoUsed || 0;
      const toClear = Math.min(remainingToClear, escortHas);
      updatedNpcTraders = updatedNpcTraders.map(n =>
        n.id === escort.id
          ? { ...n, escortCargoUsed: (n.escortCargoUsed || 0) - toClear }
          : n
      );
      remainingToClear -= toClear;
    }
  }

  // Despawn escorts that have no cargo left
  updatedNpcTraders = updatedNpcTraders.filter(n => {
    if (!n.isEscort) return true;
    return (n.escortCargoUsed || 0) > 0;
  });

  return {
    ship: { ...ship, cargo } as Ship,
    stations: updatedStations,
    npcTraders: updatedNpcTraders,
    profitByCommodity: profit,
    avgCostByCommodity: avgMap,
    revenue,
    unitSellPrice,
    quantity: qty,
    trade,
  };
}

/**
 * Process commodities at docked station
 * 
 * @param ship - Player ship
 * @param dockedStationId - ID of docked station
 * @param stations - All stations
 * @param inputId - Input commodity ID
 * @param outputs - Number of outputs to produce
 * @returns Updated ship or null if can't process
 */
export function processCommodity(
  ship: Ship,
  dockedStationId: string | undefined,
  stations: Station[],
  inputId: string,
  outputs: number
): Ship | null {
  if (!dockedStationId || outputs <= 0) return null;

  const station = stations.find(s => s.id === dockedStationId);
  if (!station) return null;

  const recipe = findRecipeForStation(station.type, inputId);
  if (!recipe) return null;

  if (!ship.hasNavigationArray && (gatedCommodities as readonly string[]).includes(recipe.outputId))
    return null;

  const atPirate = station.type === 'pirate';
  if (!atPirate && !ship.hasUnionMembership) return null;

  const have = ship.cargo[inputId] || 0;
  const maxOutputs = Math.floor(have / recipe.inputPerOutput);
  const outCount = Math.max(0, Math.min(outputs, maxOutputs));
  if (outCount <= 0) return null;

  const newCargo = { ...ship.cargo };
  newCargo[inputId] = have - outCount * recipe.inputPerOutput;
  newCargo[recipe.outputId] = (newCargo[recipe.outputId] || 0) + outCount;

  return { ...ship, cargo: newCargo };
}

/**
 * Upgrade ship stat or equipment
 * 
 * @param ship - Player ship
 * @param dockedStationId - ID of docked station
 * @param stations - All stations
 * @param type - Type of upgrade
 * @param amount - Amount to upgrade by
 * @param cost - Cost of upgrade
 * @returns Updated ship or null if can't upgrade
 */
export function upgradeShip(
  ship: Ship,
  dockedStationId: string | undefined,
  stations: Station[],
  type: 'acc' | 'vmax' | 'cargo' | 'mining' | 'navigation' | 'intel' | 'union',
  amount: number,
  cost: number
): Ship | null {
  if (!dockedStationId) return null;

  const station = stations.find(s => s.id === dockedStationId);
  if (!station) return null;

  if (
    (type === 'acc' ||
      type === 'vmax' ||
      type === 'cargo' ||
      type === 'mining' ||
      type === 'navigation' ||
      type === 'intel') &&
    station.type !== 'shipyard'
  )
    return null;

  if (ship.credits < cost) return null;

  if (type === 'cargo') {
    if (ship.maxCargo >= shipCaps[ship.kind].cargo) return null;
    if (ship.maxCargo + amount > shipCaps[ship.kind].cargo) return null;
    return {
      ...ship,
      credits: ship.credits - cost,
      maxCargo: ship.maxCargo + amount,
    };
  }

  if (type === 'mining') {
    if (ship.canMine) return null;
    return { ...ship, credits: ship.credits - cost, canMine: true };
  }

  if (type === 'navigation') {
    if (ship.hasNavigationArray) return null;
    return { ...ship, credits: ship.credits - cost, hasNavigationArray: true };
  }

  if (type === 'intel') {
    if (ship.hasMarketIntel) return null;
    return { ...ship, credits: ship.credits - cost, hasMarketIntel: true };
  }

  if (type === 'union') {
    if (station.type !== 'city') return null;
    if (ship.hasUnionMembership) return null;
    return { ...ship, credits: ship.credits - cost, hasUnionMembership: true };
  }

  // Stat upgrades
  const stats = { ...ship.stats };
  if (type === 'acc') {
    if (stats.acc >= shipCaps[ship.kind].acc) return null;
    if (stats.acc + amount > shipCaps[ship.kind].acc) return null;
    stats.acc += amount;
  }

  if (type === 'vmax') {
    if (stats.vmax >= shipCaps[ship.kind].vmax) return null;
    if (stats.vmax + amount > shipCaps[ship.kind].vmax) return null;
    stats.vmax += amount;
  }

  return { ...ship, credits: ship.credits - cost, stats };
}

