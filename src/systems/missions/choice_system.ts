import type { GameState, Station } from '../../domain/types/world_types';
import type { MissionChoice } from '../../domain/types/mission_types';
import { generateCommodities } from '../economy/commodities';
import { getEventPriceMultiplier } from '../economy/market_events';

type Effect = { station?: string; stations?: string[]; category?: string; commodity?: string;
  price?: number; production?: number; fabrication?: number; lock?: boolean; duration?: number;
  hostile?: boolean; closed?: boolean; feature?: string; aggression?: number; stock?: number; defense?: number; refinery?: boolean;
};
const workers = ['greenfields', 'drydock', 'sol-refinery'];
const corporate = ['sol-city', 'aurum-fab', 'ceres-pp'];
/** Every authored effect must have an executable handler; tests enforce exhaustive coverage. */
export const WORLD_EFFECTS: Record<string, Effect> = {
  sol_city_price_increase_greenfields: { station: 'sol-city', category: 'food', price: 1.15 },
  greenfields_stock_drop: { station: 'greenfields', stock: 0.7, duration: 120 },
  aurum_production_boost: { station: 'aurum-fab', production: 1.1 },
  drydock_production_boost: { station: 'drydock', production: 1.1 },
  sol_city_hostile: { stations: ['sol-city', 'sol-refinery'], hostile: true },
  black_market_access: { station: 'hidden-cove', price: 0.9, feature: 'black_market' },
  hidden_cove_hostile: { station: 'hidden-cove', hostile: true, closed: true },
  bounty_hunting_unlocked: { feature: 'bounty_hunting' },
  pirate_attacks_increase: { aggression: 1.5 }, pirate_attacks_decrease: { aggression: 0.5 },
  sol_city_grain_spike: { station: 'sol-city', commodity: 'grain', price: 1.25 },
  greenfields_fabrication_lockdown: { station: 'greenfields', lock: true, duration: 300 },
  greenfields_independence: { station: 'greenfields', production: 1.1, feature: 'independent_agriculture' },
  greenfields_food_discount: { station: 'greenfields', category: 'food', price: 0.95 },
  greenfields_controlled: { station: 'greenfields', production: 0.9 },
  sol_city_goods_discount: { station: 'sol-city', price: 0.95 },
  drydock_fabrication_disabled_temp: { station: 'drydock', lock: true, duration: 300 },
  aurum_fabrication_disabled_temp: { station: 'aurum-fab', lock: true, duration: 300 },
  drydock_fabrication_price_increase: { station: 'drydock', fabrication: 1.15 },
  aurum_fabrication_price_increase: { station: 'aurum-fab', fabrication: 1.15 },
  aurum_exclusive_supplier: { station: 'aurum-fab', production: 1.2, feature: 'aurum_supplier' },
  aurum_fabrication_discount: { station: 'aurum-fab', fabrication: 0.9 },
  drydock_exclusive_supplier: { station: 'drydock', production: 1.2, feature: 'drydock_supplier' },
  drydock_fabrication_discount: { station: 'drydock', fabrication: 0.9 },
  ceres_fuel_price_drop: { station: 'ceres-pp', category: 'fuel', price: 0.8 },
  energy_transparency: { category: 'fuel', price: 0.95 },
  fuel_shortage_continues: { category: 'fuel', price: 1.15, duration: 600 },
  ceres_monopoly_maintained: { station: 'ceres-pp', production: 1.1 },
  refinery_convoy_protection: { station: 'sol-refinery', production: 1.15 },
  refinery_convoys_disrupted: { station: 'sol-refinery', production: 0.8 },
  freeport_refinery_established: { station: 'freeport', refinery: true },
  fuel_prices_normalized: { category: 'fuel', price: 0.9 },
  ceres_fuel_monopoly_permanent: { category: 'fuel', price: 1.1 },
  ceres_fuel_discount: { station: 'ceres-pp', category: 'fuel', price: 0.8 },
  sol_city_weakened: { station: 'sol-city', defense: 0 },
  peace_agreement_active: { feature: 'peace', aggression: 0.7 },
  worker_strike_success: { stations: workers, production: 1.1 },
  corporate_price_increase_temp: { stations: corporate, price: 1.2, duration: 480 },
  strike_broken: { stations: corporate, production: 1.1 },
  worker_stations_fabrication_lockdown_temp: { stations: workers, lock: true, duration: 300 },
  union_victory: { stations: workers, production: 1.1 },
  fabrication_cost_decrease: { fabrication: 0.9 },
  worker_rights_improved: { feature: 'worker_rights', stations: workers, production: 1.05 },
  corporate_victory: { stations: corporate, production: 1.1 },
  union_weakened: { stations: workers, production: 0.9 },
  fabrication_efficiency_improved: { stations: corporate, fabrication: 0.9 },
};
const applies = (effect: Effect, station: Station) => (!effect.station || effect.station === station.id) && (!effect.stations || effect.stations.includes(station.id));
export function stripPriceModifiers(stations: Station[]): Station[] {
  return stations.map(st => ({ ...st, inventory: Object.fromEntries(Object.entries(st.inventory).map(([id, item]) => [id, {
    ...item, buy: item.unmodifiedBuy ?? item.buy, sell: item.unmodifiedSell ?? item.sell,
    unmodifiedBuy: undefined, unmodifiedSell: undefined,
  }])) }));
}
export function projectWorldEffects(s: GameState): Partial<GameState> {
  const active = (s.appliedEffects ?? []).filter(e => WORLD_EFFECTS[e.id] && (WORLD_EFFECTS[e.id].duration === undefined || s.gameTime < e.appliedAt + WORLD_EFFECTS[e.id].duration!)).map(e => WORLD_EFFECTS[e.id]);
  const commodities = Object.fromEntries(generateCommodities().map(c => [c.id, c]));
  const features = new Set(s.unlockedFeatures ?? []);
  for (const e of active) if (e.feature) features.add(e.feature);
  return {
    pirateAggressionMultiplier: active.reduce((a, e) => a * (e.aggression ?? 1), 1), unlockedFeatures: [...features],
    stations: stripPriceModifiers(s.stations).map(st => {
      const effects = active.filter(e => applies(e, st));
      const inventory = Object.fromEntries(Object.entries(st.inventory).map(([id, item]) => {
        const multiplier = effects.filter(e => (!e.category || commodities[id]?.category === e.category) && (!e.commodity || e.commodity === id)).reduce((m, e) => m * (e.price ?? 1), 1)
          * getEventPriceMultiplier(s.marketEvents ?? [], st.id, id, commodities[id]?.category ?? '');
        return [id, { ...item, unmodifiedBuy: item.buy, unmodifiedSell: item.sell, buy: Math.max(1, Math.round(item.buy * multiplier)), sell: Math.max(1, Math.round(item.sell * multiplier)) }];
      }));
      if (effects.some(e => e.refinery) && inventory.refined_fuel) inventory.refined_fuel = { ...inventory.refined_fuel, canSell: true };
      return { ...st, inventory,
        productionMultiplier: effects.reduce((a, e) => a * (e.production ?? 1), 1),
        fabricationMultiplier: effects.reduce((a, e) => a * (e.fabrication ?? 1), 1),
        fabricationDisabled: effects.some(e => e.lock),
        independentRefinery: effects.some(e => e.refinery),
        defenseStrength: effects.reduce((a, e) => a * (e.defense ?? 1), 1),
        isHostile: st.isHostile || effects.some(e => e.hostile), isClosed: st.isClosed || effects.some(e => e.closed),
      };
    }),
  };
}
export function applyChoicePermanentEffects(s: GameState, ids: string[]): Partial<GameState> {
  let next = { ...s, appliedEffects: [...(s.appliedEffects ?? [])] };
  for (const id of ids) {
    const effect = WORLD_EFFECTS[id];
    if (!effect) throw new Error(`Unknown mission effect: ${id}`);
    if (next.appliedEffects.some(e => e.id === id)) continue;
    next.appliedEffects.push({ id, appliedAt: s.gameTime });
    if (effect.stock) next.stations = next.stations.map(st => applies(effect, st) ? { ...st, inventory: Object.fromEntries(Object.entries(st.inventory).map(([id, item]) => [id, { ...item, stock: (item.stock ?? 0) * effect.stock! }])) } : st);
  }
  return { appliedEffects: next.appliedEffects, ...projectWorldEffects(next) };
}
export function describeWorldEffect(id: string): string[] {
  const e = WORLD_EFFECTS[id];
  if (!e) return [`Unknown effect: ${id}`];
  const where = e.station ?? e.stations?.join(', ') ?? 'all stations';
  const duration = e.duration ? ` for ${e.duration} simulation seconds` : '';
  const percent = (n: number) => `${n >= 1 ? '+' : ''}${Math.round((n - 1) * 100)}%`;
  const result: string[] = [];
  if (e.hostile) result.push(`${where}: hostile; docking denied and defenders respond to approaches`);
  if (e.closed) result.push(`${where}: closed; document contacts remain available through the local liaison`);
  if (e.lock) result.push(`${where}: fabrication disabled${duration}`);
  if (e.price) result.push(`${where}: ${e.commodity ?? e.category ?? 'goods'} prices ${percent(e.price)}${duration}`);
  if (e.production) result.push(`${where}: production ${percent(e.production)}${duration}`);
  if (e.fabrication) result.push(`${where}: fabrication input costs ${percent(e.fabrication)}${duration}`);
  if (e.stock) result.push(`${where}: immediate stock adjustment ${percent(e.stock)}; normal supply replenishes stock`);
  if (e.aggression) result.push(`Optional salvage raider risk ${percent(e.aggression)}`);
  if (e.refinery) result.push(`${where}: fuel refinery produces 12 units per minute`);
  if (e.defense === 0) result.push(`${where}: no new station defenders`);
  if (e.feature === 'bounty_hunting') result.push('Unlock the Sol City bounty terminal in the mission log');
  return result;
}
export function formatChoiceConsequences(choice: MissionChoice): string[] {
  return [...(choice.rewards.permanentEffects ?? []).flatMap(describeWorldEffect),
    ...Object.entries(choice.rewards.reputationChanges).map(([id, change]) => `${change >= 0 ? '+' : ''}${change} reputation at ${id}`),
    ...(choice.nextMissionId ? [`Next assignment: ${choice.nextMissionId.replace(/_/g, ' ')}`] : []),
  ];
}
