import { z } from 'zod';
import type { GameState, Station } from '../domain/types/world_types';
import type { FinanceState, FinanceAction } from '../domain/types/finance_types';
import { commodityById } from '../state/world';
import { canDockAtStation } from './reputation/faction_system';
import { canTradeCommodity } from '../state/modules/economy';
import { createNotification } from '../state/modules/notifications';
import { shipBaseStats } from '../domain/constants/ship_constants';
import { WEAPON_COSTS, WEAPON_UPGRADE_COSTS } from '../domain/constants/weapon_constants';

export const BANK_ID = 'meridian-bank';
export const BANK_PORTS = [BANK_ID, 'sol-city', 'freeport'];
export const SAVINGS_RATE = .001, BOND_RATE = .0015, LOAN_RATE = .005;
export const LOAN_LIMIT = 10000, LOAN_TERM = 600;
export const HULL_VALUES = { freighter: 20000, clipper: 20000, miner: 10000, heavy_freighter: 60000, racer: 50000, industrial_miner: 40000 };
export const MODULE_VALUES = { canMine: 25000, hasNavigationArray: 500, hasUnionMembership: 1500, hasMarketIntel: 2500, hasTradeLedger: 750, hasTempCargo: 5000, hasShieldedCargo: 5000, hasFireSuppression: 3500 };
export function fundRisk(station: Station) {
  if (station.id === BANK_ID) return { name: 'Guaranteed bank bond', drift: BOND_RATE, volatility: 0 };
  if (station.type === 'pirate') return { name: 'High risk', drift: .01, volatility: .10 };
  if (['fabricator', 'shipyard', 'power_plant'].includes(station.type)) return { name: 'Medium risk', drift: .006, volatility: .05 };
  return { name: 'Low risk', drift: .0035, volatility: .02 };
}
export function createFinance(stations: Station[], at: number): FinanceState {
  return { version: 1, savings: 0, loan: { principal: 0, interest: 0, dueAt: at + LOAN_TERM }, funds: Object.fromEntries(stations.map(st => [st.id, { price: 100, units: 0, invested: 0 }])), warehouses: {}, lastAccrualAt: at, lastInterestAt: at, navHistory: [], lastNavAt: at, sequence: 0, entries: [] };
}
export function settleInterest(f: FinanceState, at: number): FinanceState {
  const minutes = Math.max(0, at - f.lastInterestAt) / 60;
  if (!minutes) return f;
  const bond = f.funds[BANK_ID];
  const funds = bond ? { ...f.funds, [BANK_ID]: { ...bond, price: bond.price * Math.pow(1 + BOND_RATE, minutes) } } : f.funds;
  return { ...f, funds, lastInterestAt: at, savings: f.savings * Math.pow(1 + SAVINGS_RATE, minutes), loan: { ...f.loan, interest: (f.loan.principal + f.loan.interest) * Math.pow(1 + LOAN_RATE, minutes) - f.loan.principal } };
}
function log(f: FinanceState, at: number, message: string, cashDelta = 0): FinanceState {
  return { ...f, sequence: f.sequence + 1, entries: [...f.entries, { id: f.sequence, at, message, cashDelta }].slice(-200) };
}
function refuse(s: GameState, message: string): GameState {
  return { ...s, notifications: [...(s.notifications ?? []).slice(-19), createNotification('warning', message, 6000)] };
}
export function bankingAvailable(s: GameState): boolean {
  return BANK_PORTS.includes(s.ship.dockedStationId ?? '') && s.ship.hp > 0 && s.stations.some(st => st.id === s.ship.dockedStationId && canDockAtStation(st));
}
export function financeAction(s: GameState, action: FinanceAction, amount: number, fundId?: string): GameState {
  if (!s.hasChosenStarter || !bankingAvailable(s)) return refuse(s, 'Dock at Meridian Bank, Sol City or Freeport for banking.');
  if (!['deposit', 'withdraw', 'borrow', 'repay', 'invest', 'redeem', 'redeemAll'].includes(action)) return refuse(s, 'Unknown banking action.');
  let f = settleInterest(s.finance ?? createFinance(s.stations, s.gameTime), s.gameTime);
  const all = action === 'redeemAll';
  if (all) { const fund = f.funds[fundId ?? '']; amount = fund ? fund.units * fund.price : 0; action = 'redeem'; }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e12) return refuse(s, 'Enter a finite positive credit amount.');
  // Money actions use cents; fund units remain fractional and are never rounded into free shares.
  if (!all && Math.abs(amount * 100 - Math.round(amount * 100)) > .00001) return refuse(s, 'Use at most two decimal places.');
  let cash = s.ship.credits, message = '', transfer = 0;
  if (action === 'deposit') {
    if (amount > cash) return refuse(s, 'Not enough ship credits.');
    f = { ...f, savings: f.savings + amount }; cash -= amount; transfer = -amount; message = `Deposited ${amount} cr into protected savings`;
  } else if (action === 'withdraw') {
    if (amount > f.savings) return refuse(s, 'Not enough savings.');
    f = { ...f, savings: f.savings - amount }; cash += amount; transfer = amount; message = `Withdrew ${amount} cr to ship`;
  } else if (action === 'borrow') {
    if (s.ship.dockedStationId !== BANK_ID) return refuse(s, 'New loans require a visit to Meridian Bank.');
    if (f.loan.interest > 0 && s.gameTime >= f.loan.dueAt) return refuse(s, 'Interest is overdue. Clear accrued interest before borrowing again.');
    if (f.loan.principal + amount > LOAN_LIMIT) return refuse(s, `Maximum outstanding principal is ${LOAN_LIMIT} cr.`);
    f = { ...f, loan: { ...f.loan, principal: f.loan.principal + amount, dueAt: f.loan.principal ? f.loan.dueAt : s.gameTime + LOAN_TERM } };
    cash += amount; transfer = amount; message = `Borrowed ${amount} cr · 0.5% / sim min · interest due every 10 sim min`;
  } else if (action === 'repay') {
    const paid = Math.min(amount, f.loan.principal + f.loan.interest);
    if (!paid || paid > cash) return refuse(s, 'No debt to pay, or not enough ship credits. Withdraw savings first if needed.');
    const interestPaid = Math.min(paid, f.loan.interest), principalPaid = paid - interestPaid;
    f = { ...f, loan: { principal: Math.max(0, f.loan.principal - principalPaid), interest: Math.max(0, f.loan.interest - interestPaid), dueAt: interestPaid === f.loan.interest ? s.gameTime + LOAN_TERM : f.loan.dueAt } };
    cash -= paid; transfer = -principalPaid; message = `Repaid ${paid.toFixed(2)} cr · interest first (${interestPaid.toFixed(2)} cr)`;
  } else {
    const fund = f.funds[fundId ?? ''];
    if (!fund || !s.stations.some(st => st.id === fundId)) return refuse(s, 'Unknown investment fund.');
    if (action === 'invest') {
      if (amount > f.savings) return refuse(s, 'Investments are funded from savings; deposit first.');
      f = { ...f, savings: f.savings - amount, funds: { ...f.funds, [fundId!]: { ...fund, units: fund.units + amount / fund.price, invested: fund.invested + amount } } };
      message = `Invested ${amount} cr in ${s.stations.find(st => st.id === fundId)!.name}`;
    } else {
      const value = fund.units * fund.price;
      if (amount > value + .000001) return refuse(s, 'Redemption exceeds the current investment value.');
      const redeemed = Math.min(amount, value), remaining = Math.max(0, fund.units - redeemed / fund.price);
      f = { ...f, savings: f.savings + redeemed, funds: { ...f.funds, [fundId!]: { ...fund, units: remaining, invested: remaining === 0 ? 0 : fund.invested * (1 - redeemed / value) } } };
      message = `Redeemed ${redeemed.toFixed(2)} cr to savings`;
    }
  }
  return { ...s, ship: { ...s.ship, credits: cash }, finance: log(f, s.gameTime, message, transfer) };
}
export function transferWarehouse(s: GameState, commodityId: string, quantity: number, direction: 'store' | 'retrieve'): GameState {
  const station = s.stations.find(st => st.id === s.ship.dockedStationId);
  if (!s.hasChosenStarter || s.ship.hp <= 0 || !station || !canDockAtStation(station)) return refuse(s, 'Dock at an accessible station to transfer cargo.');
  if (!['store', 'retrieve'].includes(direction) || !commodityById[commodityId] || !Number.isSafeInteger(quantity) || quantity <= 0) return refuse(s, 'Transfer a positive whole quantity of known goods.');
  let f = s.finance ?? createFinance(s.stations, s.gameTime);
  const warehouse = f.warehouses[station.id] ?? { goods: {}, freshness: {} };
  const storing = direction === 'store', source = storing ? s.ship.cargo : warehouse.goods, target = storing ? warehouse.goods : s.ship.cargo;
  if ((source[commodityId] ?? 0) < quantity) return refuse(s, 'Not enough goods at this location.');
  if (!storing && (!canTradeCommodity(s.ship, commodityId) || Object.values(s.ship.cargo).reduce((a, b) => a + b, 0) + quantity > s.ship.maxCargo)) return refuse(s, 'Retrieval requires cargo equipment and free hold space.');
  if (!storing && station.id === 'sol-city' && commodityId === 'luxury_goods' && s.missions.some(m => m.id === 'greenfields_stage_1' && m.status === 'active')) return refuse(s, 'Sol City cannot release luxury cargo during this covert assignment. Use supplies held elsewhere.');
  const shipQty = s.ship.cargo[commodityId] ?? 0, storedQty = warehouse.goods[commodityId] ?? 0;
  if (storing && !Number.isSafeInteger(storedQty + quantity)) return refuse(s, 'Warehouse quantity limit reached.');
  const shipFresh = s.ship.cargoFreshness?.[commodityId] ?? 1, storedFresh = warehouse.freshness[commodityId] ?? 1;
  const freshness = ((storing ? storedFresh : shipFresh) * (target[commodityId] ?? 0) + (storing ? shipFresh : storedFresh) * quantity) / ((target[commodityId] ?? 0) + quantity);
  const delta = storing ? -quantity : quantity;
  const nextWarehouse = { goods: { ...warehouse.goods, [commodityId]: storedQty - delta }, freshness: { ...warehouse.freshness, [commodityId]: storing ? freshness : storedFresh } };
  f = log({ ...f, warehouses: { ...f.warehouses, [station.id]: nextWarehouse } }, s.gameTime, `${storing ? 'Stored' : 'Retrieved'} ${quantity} ${commodityById[commodityId].name} at ${station.name}`);
  return { ...s, finance: f, ship: { ...s.ship, cargo: { ...s.ship.cargo, [commodityId]: shipQty + delta }, cargoFreshness: { ...s.ship.cargoFreshness, [commodityId]: storing ? shipFresh : freshness } } };
}
export function tickFinance(s: GameState, random = Math.random): GameState {
  let f = s.finance ?? createFinance(s.stations, s.gameTime);
  const steps = Math.min(120, Math.floor((s.gameTime - f.lastAccrualAt) / 60));
  if (steps <= 0) return s.finance ? s : { ...s, finance: f };
  f = settleInterest(f, s.gameTime);
  for (let step = 0; step < steps; step++) {
    const funds = Object.fromEntries(s.stations.map(st => {
      const fund = f.funds[st.id] ?? { price: 100, units: 0, invested: 0 }, risk = fundRisk(st);
      if (st.id === BANK_ID) return [st.id, fund];
      // Symmetric noise has zero mean. Riskier funds have higher expected returns,
      // but no individual station investment or holding period is guaranteed.
      const disruption = st.id !== BANK_ID && (st.isClosed || st.isHostile || st.fabricationDisabled) ? -.015 : 0;
      const change = risk.drift + disruption + (random() * 2 - 1) * risk.volatility;
      return [st.id, { ...fund, price: Math.max(.000001, fund.price * (1 + change)) }];
    }));
    f = { ...f, funds, lastAccrualAt: f.lastAccrualAt + 60 };
  }
  return { ...s, finance: log(f, s.gameTime, `${steps} banking minute(s) settled · savings interest and investment marks updated${f.loan.interest ? ` · accrued loan interest ${f.loan.interest.toFixed(2)} cr` : ''}`) };
}
export function netAssetValue(s: GameState) {
  const f = s.finance ? settleInterest(s.finance, s.gameTime) : undefined, ship = s.ship, base = shipBaseStats[ship.kind];
  const quotes: Record<string, number> = {};
  for (const [id, good] of Object.entries(commodityById)) {
    const prices = s.stations.flatMap(st => st.inventory[id]?.canBuy !== false && st.inventory[id]?.sell > 0 ? [st.inventory[id].sell] : []).sort((a, b) => a - b);
    quotes[id] = prices.length ? (prices[Math.floor((prices.length - 1) / 2)] + prices[Math.floor(prices.length / 2)]) / 2 : good.baseSell;
  }
  const valueGoods = (goods: Record<string, number>, freshness: Record<string, number> = {}) => Object.entries(goods).reduce((sum, [id, quantity]) => sum + quantity * (quotes[id] ?? 0) * (freshness[id] ?? 1), 0);
  const hull = HULL_VALUES[ship.kind] * Math.min(1, ship.hp / ship.maxHp);
  const modules = Object.entries(MODULE_VALUES).reduce((sum, [key, value]) => sum + (ship[key as keyof typeof MODULE_VALUES] && !(key === 'canMine' && ['miner', 'industrial_miner'].includes(ship.kind)) ? value : 0), 0)
    + Math.max(0, (ship.stats.acc - base.acc) / 3) * 1000 + Math.max(0, (ship.stats.vmax - base.vmax) / 3) * 1000 + Math.max(0, (ship.maxCargo - base.cargo) / 50) * 1200
    + WEAPON_COSTS[ship.weapon.kind] + ship.weapon.damageLevel * WEAPON_UPGRADE_COSTS.damage + ship.weapon.fireRateLevel * WEAPON_UPGRADE_COSTS.fireRate + ship.weapon.rangeLevel * WEAPON_UPGRADE_COSTS.range;
  const cargo = valueGoods(ship.cargo, ship.cargoFreshness) + s.npcTraders.filter(n => n.isEscort).reduce((sum, n) => sum + (n.escortCargoUsed ?? 0) * (quotes[n.commodityId ?? ''] ?? 0), 0);
  const stored = Object.values(f?.warehouses ?? {}).reduce((sum, warehouse) => sum + valueGoods(warehouse.goods, warehouse.freshness), 0);
  const investments = Object.values(f?.funds ?? {}).reduce((sum, fund) => sum + fund.units * fund.price, 0);
  const debt = (f?.loan.principal ?? 0) + (f?.loan.interest ?? 0);
  return { cash: ship.credits, savings: f?.savings ?? 0, investments, hull, modules, cargo, stored, debt, total: ship.credits + (f?.savings ?? 0) + investments + hull + modules + cargo + stored - debt };
}
export function recordAssets(before: GameState, next: GameState): GameState {
  if (!next.hasChosenStarter) return next;
  const f = next.finance ?? createFinance(next.stations, next.gameTime);
  const changed = next.ship.hp > before.ship.hp || before.ship.credits !== next.ship.credits || before.ship.cargo !== next.ship.cargo || before.finance !== next.finance;
  if (f.navHistory.length && !changed && next.gameTime - f.lastNavAt < 30) return next;
  const point = { at: next.gameTime, value: netAssetValue({ ...next, finance: f }).total };
  const history = f.navHistory[f.navHistory.length - 1]?.at === point.at ? f.navHistory.slice(0, -1) : f.navHistory;
  return { ...next, finance: { ...f, lastNavAt: next.gameTime, navHistory: [...history, point].slice(-240) } };
}
const amount = z.number().finite().nonnegative();
export const financeSchema = z.object({
  version: z.literal(1), savings: amount,
  loan: z.object({ principal: amount.max(LOAN_LIMIT), interest: amount, dueAt: amount }),
  funds: z.record(z.object({ price: amount.positive(), units: amount, invested: amount })),
  warehouses: z.record(z.object({ goods: z.record(amount.int().safe()), freshness: z.record(amount.max(1)) })),
  lastAccrualAt: amount, lastInterestAt: amount, lastNavAt: amount, sequence: amount.int(),
  navHistory: z.array(z.object({ at: amount, value: z.number().finite() })).max(240),
  entries: z.array(z.object({ id: amount.int(), at: amount, message: z.string(), cashDelta: z.number().finite().optional() })).max(200),
}).refine(f => Number.isFinite(f.savings + f.loan.principal + f.loan.interest + Object.values(f.funds).reduce((sum, fund) => sum + fund.price * fund.units, 0)) && (!f.navHistory.length || f.navHistory[f.navHistory.length - 1].at === f.lastNavAt) && f.navHistory.every((p, i) => !i || p.at > f.navHistory[i - 1].at) && f.entries.every((e, i) => e.id < f.sequence && (!i || e.id > f.entries[i - 1].id && e.at >= f.entries[i - 1].at)), 'Invalid finance history ordering');
