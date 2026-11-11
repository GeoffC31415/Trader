import { z } from 'zod';
import type { GameState, Ship, Station, TradeEntry } from '../domain/types/world_types';
import type { JournalData, JournalEvent, TradeTotals } from '../domain/types/journal_types';
import { getAllFactionReputations } from './reputation/faction_system';
import { describeWorldEffect, WORLD_EFFECTS } from './missions/choice_system';

export const JOURNAL_EVENT_LIMIT = 600;
export const humanize = (id: string) => id.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
export function worldEffectDescription(id: string, stations: Station[]): string {
  return stations.reduce((text, st) => text.split(st.id).join(st.name), describeWorldEffect(id).join(' · '));
}
export const emptyTotals = (): TradeTotals => ({ transactions: 0, bought: 0, sold: 0, spent: 0, revenue: 0, knownProfit: 0, unknownCostSales: 0 });
export function addTotals(a: TradeTotals, b: TradeTotals): TradeTotals {
  return Object.fromEntries(Object.keys(a).map(k => [k, a[k as keyof TradeTotals] + b[k as keyof TradeTotals]])) as TradeTotals;
}
function recordTrade(ledger: JournalData['ledger'], t: TradeEntry): JournalData['ledger'] {
  const station = ledger[t.stationId] ?? {};
  const totals = { ...(station[t.commodityId] ?? emptyTotals()) };
  totals.transactions++; totals[t.type === 'buy' ? 'bought' : 'sold'] += t.quantity;
  totals[t.type === 'buy' ? 'spent' : 'revenue'] += t.totalPrice;
  if (t.type === 'sell') {
    if (t.realizedProfit === undefined) totals.unknownCostSales++;
    else totals.knownProfit += t.realizedProfit;
  }
  return { ...ledger, [t.stationId]: { ...station, [t.commodityId]: totals } };
}
export function createJournal(s: GameState, legacy = false): JournalData {
  return { version: 1, startedAt: s.gameTime, legacy, sequence: 1, otherIncome: 0, otherSpending: 0,
    ledger: s.tradeLog.filter(t => t.type === 'buy' || t.type === 'sell').reduce(recordTrade, {}), events: [{ id: 0, at: s.gameTime, kind: 'milestone', title: legacy ? 'Archive recording resumed' : 'Commander archive online',
      detail: legacy ? 'Earlier reputation/world events are unavailable. Retained receipts seed the ledger; unknown historical costs are not invented.' : 'Your actions, allegiances and economic footprint are now being recorded.',
      factions: getAllFactionReputations(s.stations), political: s.politicalProfile?.score ?? { freedom: 0, labor: 0 } }] };
}
export const SHIP_SYSTEMS = [
  ['canMine', 'Mining rig'], ['hasNavigationArray', 'Navigation array'], ['hasUnionMembership', 'Union membership'],
  ['hasMarketIntel', 'Market intelligence'], ['hasTradeLedger', 'Trade ledger'], ['hasTempCargo', 'Refrigerated cargo'],
  ['hasShieldedCargo', 'Shielded cargo'], ['hasFireSuppression', 'Fire suppression'],
] as const;
function shipChanges(a: Ship, b: Ship): string[] {
  const changes = SHIP_SYSTEMS.filter(([key]) => !!a[key] !== !!b[key]).map(([key, label]) => `${label}: ${b[key] ? 'installed' : 'removed'}`);
  for (const [label, from, to] of [['Hull class', a.kind, b.kind], ['Cargo capacity', a.maxCargo, b.maxCargo], ['Acceleration', a.stats.acc, b.stats.acc], ['Top speed', a.stats.vmax, b.stats.vmax], ['Weapon', a.weapon.kind, b.weapon.kind], ['Weapon damage level', a.weapon.damageLevel, b.weapon.damageLevel], ['Weapon cadence level', a.weapon.fireRateLevel, b.weapon.fireRateLevel], ['Weapon range level', a.weapon.rangeLevel, b.weapon.rangeLevel]] as const) {
    if (from !== to) changes.push(`${label}: ${from} → ${to}`);
  }
  return changes;
}

/** Applied once at the authoritative store transaction boundary, including nested mission rewards.
 * No per-frame history spam; load uses the raw setter and never replays historical actions.
 */
export function recordJournalTransition(before: GameState, next: GameState): GameState {
  if (!next.hasChosenStarter) return next;
  if (!before.hasChosenStarter) return { ...next, journal: createJournal(next) };
  let journal = before.journal ?? createJournal(before, true);
  const pending: Array<Omit<JournalEvent, 'id' | 'at'>> = [];
  const knownTrades = next.tradeLog === before.tradeLog ? undefined : new Set(before.tradeLog.map(t => t.id));
  const newTrades = knownTrades ? next.tradeLog.filter(t => !knownTrades.has(t.id)) : [];
  const missionChanges = next.missions.filter(m => {
    const old = before.missions.find(o => o.id === m.id);
    return old ? m.status !== old.status || m.objectives.some(o => o.completed && !old.objectives.find(x => x.id === o.id)?.completed) : m.status === 'active';
  });
  for (const m of missionChanges) pending.push({ kind: 'mission', title: `${m.title} · ${m.status}`, detail: m.objectives.filter(o => o.completed).map(o => o.description).join(' · ') || m.description });
  for (const c of next.contracts ?? []) {
    const old = before.contracts?.find(o => o.id === c.id);
    if (c.status !== 'offered' && c.status !== old?.status) pending.push({ kind: 'mission', title: `${c.title ?? `${humanize(c.commodityId)} delivery`} · ${c.status}`, detail: `${c.deliveredUnits ?? 0}/${c.units} delivered to ${next.stations.find(st => st.id === c.toId)?.name ?? humanize(c.toId)} · Completion bonus ${c.rewardBonus ?? 0} cr` });
  }
  if (next.opportunity && !before.opportunity) pending.push({ kind: 'mission', title: `${humanize(next.opportunity.kind)} opportunity detected`, detail: `Optional opportunity · advertised reward ${next.opportunity.reward} cr · expires ${next.opportunity.expiresAt.toFixed(0)}s simulation time` });
  if (before.opportunity && !next.opportunity) pending.push({ kind: 'mission', title: `${humanize(before.opportunity.kind)} opportunity ${next.gameTime >= before.opportunity.expiresAt ? 'expired' : 'closed'}`, detail: next.notifications !== before.notifications ? next.notifications?.[next.notifications.length - 1]?.message ?? 'Opportunity closed.' : 'Opportunity declined or expired.' });
  for (const t of newTrades) {
    journal = { ...journal, ledger: recordTrade(journal.ledger, t) };
    pending.push({ kind: 'trade', title: `${t.type === 'buy' ? 'Bought' : 'Sold'} ${t.quantity} ${humanize(t.commodityId)}`, detail: `${t.stationName} · ${t.totalPrice.toLocaleString()} cr · ${t.type === 'buy' ? 'Inventory acquired' : t.realizedProfit === undefined ? 'Historical cost unavailable' : `Realized profit ${t.realizedProfit.toFixed(0)} cr (bonuses separate)`}` });
  }
  const creditsDelta = next.ship.credits - before.ship.credits;
  const tradeCash = newTrades.reduce((sum, t) => sum + (t.type === 'buy' ? -t.totalPrice : t.totalPrice), 0);
  const otherCash = creditsDelta - tradeCash;
  if (otherCash !== 0) journal = { ...journal, otherIncome: journal.otherIncome + Math.max(0, otherCash), otherSpending: journal.otherSpending + Math.max(0, -otherCash) };
  const equipment = shipChanges(before.ship, next.ship);
  if (equipment.length) pending.push({ kind: 'ship', title: 'Ship configuration changed', detail: `${equipment.join(' · ')}${otherCash < 0 ? ` · ${(-otherCash).toLocaleString()} cr spent` : ''}` });
  if (!!before.ship.onFire !== !!next.ship.onFire) pending.push({ kind: 'safety', title: next.ship.onFire ? 'Onboard fire detected' : 'Onboard fire extinguished', detail: next.ship.onFire ? 'Hull integrity critical. Dock anywhere or use automatic suppression.' : next.ship.dockedStationId ? 'Station safety crews secured the ship.' : 'Automatic suppression or insurance recovery secured the ship.' });
  if (next.ship.hp > before.ship.hp && next.ship.dockedStationId) pending.push({ kind: 'ship', title: 'Hull restored', detail: `${before.ship.hp.toFixed(1)} → ${next.ship.hp.toFixed(1)} hull · ${Math.max(0, -otherCash).toFixed(0)} cr` });
  if (!newTrades.length && !missionChanges.length && before.ship.cargo !== next.ship.cargo) {
    const changed = [...new Set([...Object.keys(before.ship.cargo), ...Object.keys(next.ship.cargo)])].map(id => ({ id, delta: (next.ship.cargo[id] ?? 0) - (before.ship.cargo[id] ?? 0) })).filter(c => c.delta !== 0);
    if (changed.length) pending.push({ kind: 'industry', title: changed.some(c => c.delta < 0) && changed.some(c => c.delta > 0) ? 'Manufacturing completed' : 'Cargo transfer', detail: changed.map(c => `${humanize(c.id)} ${c.delta > 0 ? '+' : ''}${c.delta}`).join(' · ') });
  }
  const oldEvents = before.marketEvents ?? [], events = next.marketEvents ?? [];
  for (const event of events.filter(e => !oldEvents.some(o => o.id === e.id))) pending.push({ kind: 'world', title: `${event.title} · started`, detail: `${event.description} · Duration ${(event.duration / 60000).toFixed(1)} simulation min. ${event.effects.map(e => `${e.stationId ? next.stations.find(s => s.id === e.stationId)?.name ?? humanize(e.stationId) : 'All stations'} / ${humanize(e.commodityId ?? e.commodityCategory ?? 'all goods')} ×${e.priceMultiplier}`).join('; ')}` });
  for (const event of oldEvents.filter(e => !events.some(o => o.id === e.id))) pending.push({ kind: 'world', title: `${event.title} · ended`, detail: event.description });
  for (const effect of (next.appliedEffects ?? []).filter(e => !(before.appliedEffects ?? []).some(o => o.id === e.id))) pending.push({ kind: 'world', title: 'World consequence enacted', detail: worldEffectDescription(effect.id, next.stations) });
  for (const effect of before.appliedEffects ?? []) {
    const duration = WORLD_EFFECTS[effect.id]?.duration;
    if (duration !== undefined && before.gameTime < effect.appliedAt + duration && next.gameTime >= effect.appliedAt + duration) pending.push({ kind: 'world', title: 'Temporary consequence window ended', detail: worldEffectDescription(effect.id, next.stations) });
  }
  const reputation = next.stations.map(st => ({ stationId: st.id, before: before.stations.find(o => o.id === st.id)?.reputation ?? 0, after: st.reputation ?? 0 })).filter(r => r.before !== r.after);
  const profileChanged = next.politicalProfile !== before.politicalProfile && (next.politicalProfile?.history.length ?? 0) > (before.politicalProfile?.history.length ?? 0);
  if (reputation.length || profileChanged) {
    const combatHit = (next.combatImpacts ?? []).some(hit => hit.targetId !== 'player' && !(before.combatImpacts ?? []).some(old => old.id === hit.id));
    const cause = pending.find(e => e.kind === 'mission') ?? pending.find(e => e.kind === 'trade');
    pending.push({ kind: profileChanged ? 'politics' : 'reputation', title: cause ? `Influence · ${cause.title}` : profileChanged ? 'Influence · political decision' : combatHit ? 'Influence · combat damage / destruction' : next.isTestMode ? 'Influence · simulation / debug action' : 'Influence · world response',
      detail: [profileChanged ? next.politicalProfile!.history[next.politicalProfile!.history.length - 1].description : '', ...reputation.map(r => `${next.stations.find(st => st.id === r.stationId)?.name}: ${r.before.toFixed(2)} → ${r.after.toFixed(2)}`)].filter(Boolean).join(' · '),
      reputation, factions: getAllFactionReputations(next.stations), political: profileChanged ? { ...next.politicalProfile!.score } : undefined });
  }
  if (pending.length) journal = { ...journal, sequence: journal.sequence + pending.length, events: [...journal.events, ...pending.map((event, i) => ({ ...event, id: journal.sequence + i, at: next.gameTime }))].slice(-JOURNAL_EVENT_LIMIT) };
  return journal === before.journal ? next : { ...next, journal };
}

const n = z.number().finite(), positive = n.nonnegative();
const totalsSchema = z.object({ transactions: positive.int(), bought: positive, sold: positive, spent: positive, revenue: positive, knownProfit: n, unknownCostSales: positive.int() });
export const journalSchema = z.object({
  version: z.literal(1), startedAt: positive, legacy: z.boolean(), sequence: positive.int(), otherIncome: positive, otherSpending: positive,
  ledger: z.record(z.record(totalsSchema)), events: z.array(z.object({ id: positive.int(), at: positive, kind: z.enum(['milestone', 'trade', 'reputation', 'politics', 'ship', 'mission', 'world', 'safety', 'industry']), title: z.string(), detail: z.string(),
    reputation: z.array(z.object({ stationId: z.string(), before: n, after: n })).optional(), factions: z.record(n).optional(), political: z.object({ freedom: n.min(-100).max(100), labor: n.min(-100).max(100) }).optional(),
  })).max(JOURNAL_EVENT_LIMIT),
}).refine(j => j.events.every((e, i) => e.id < j.sequence && (i === 0 || e.id > j.events[i - 1].id) && (i === 0 || e.at >= j.events[i - 1].at)), 'Journal sequence is invalid');
