import type { Debris, GameState, NpcTrader } from '../../domain/types/world_types';
import { CARGO_DROP_PERCENTAGE } from '../../domain/constants/weapon_constants';
import { commodityById } from '../../state/world';
import { canTradeCommodity } from '../../state/modules/economy';
import { isSimulationBlocked } from '../../state/helpers/simulation_clock';
import { ownedQuantity } from '../inventory_ownership';
import { distance } from '../../shared/math/vec3';

export const DEBRIS_PICKUP_RANGE = 18;

/** Consume only the units actually recovered. A full hold must not clone a partial crate. */
export function collectDebris(s: GameState): GameState {
  if (isSimulationBlocked(s) || s.ship.hp <= 0 || s.ship.dockedStationId || !s.debris?.length) return s;
  let free = Math.max(0, Math.floor(s.ship.maxCargo - Object.values(s.ship.cargo).reduce((sum, q) => sum + q, 0)));
  if (!free) return s;
  const cargo = { ...s.ship.cargo }, freshness = { ...s.ship.cargoFreshness }, costs = { ...s.avgCostByCommodity };
  const debris: Debris[] = [];
  let changed = false;
  for (const crate of s.debris) {
    if (s.gameTime * 1000 >= crate.createdAt + crate.lifetime) { changed = true; continue; }
    if (distance(s.ship.position, crate.position) > DEBRIS_PICKUP_RANGE) { debris.push(crate); continue; }
    const remaining = { ...crate.cargo };
    for (const [id, quantity] of Object.entries(crate.cargo)) {
      if (!commodityById[id] || !canTradeCommodity(s.ship, id)) continue;
      const take = Math.min(free, Math.max(0, Math.floor(quantity)));
      if (!take) continue;
      const held = cargo[id] ?? 0, owned = ownedQuantity({ ...s, ship: { ...s.ship, cargo } }, id);
      const unitCost = crate.unitCosts?.[id];
      if ((!owned || costs[id] !== undefined) && unitCost !== undefined) costs[id] = ((costs[id] ?? 0) * owned + unitCost * take) / (owned + take);
      else delete costs[id]; // Do not turn an unknown legacy/escort basis into free goods.
      freshness[id] = (held * (freshness[id] ?? 1) + take) / (held + take);
      cargo[id] = held + take; remaining[id] -= take; free -= take; changed = true;
    }
    if (Object.values(remaining).some(q => q > 0)) debris.push({ ...crate, cargo: remaining });
  }
  return changed ? { ...s, debris, avgCostByCommodity: costs, ship: { ...s.ship, cargo, cargoFreshness: freshness } } : s;
}

/** Combat-confirmed removals only: route completion and timed despawning do not produce loot. */
export function updateDebris(s: GameState, destroyed: NpcTrader[]): GameState {
  let debris = (s.debris ?? []).filter(crate => s.gameTime * 1000 < crate.createdAt + crate.lifetime);
  for (const npc of destroyed) {
    const id = npc.commodityId;
    if (!id || !commodityById[id]) continue;
    const carried = npc.isEscort ? npc.escortCargoUsed ?? 0 : npc.cargoCapacity ?? 0;
    const quantity = Math.floor(carried * CARGO_DROP_PERCENTAGE);
    if (!Number.isSafeInteger(quantity) || quantity <= 0) continue;
    const crateId = `debris:${npc.id}:${s.gameTime}`;
    if (debris.some(crate => crate.id === crateId)) continue;
    const cost = npc.isEscort ? s.avgCostByCommodity[id] : 0;
    debris.push({ id: crateId, position: [...npc.position], cargo: { [id]: quantity },
      unitCosts: cost === undefined ? {} : { [id]: cost }, createdAt: s.gameTime * 1000, lifetime: 60000 });
  }
  return collectDebris({ ...s, debris: debris.slice(-64) });
}
