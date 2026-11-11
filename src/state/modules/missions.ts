/** Commodity contracts. Story mission transitions live exclusively in mission_runtime.ts. */
import type { Contract, GameState, NpcTrader, Objective, Ship, Station } from '../../domain/types/world_types';
import { getSuggestedRoutes } from './economy';
import { createNotification } from './notifications';
import { getContractMultiplierBonus, getEscortCount } from '../helpers/reputation_helpers';
import { applyReputationWithPropagation, canDockAtStation } from '../../systems/reputation/faction_system';

export function settleContracts(input: GameState): GameState {
  let s = input;
  for (const c of s.contracts ?? []) {
    if (c.expiresAt === undefined || c.expiresAt > s.gameTime * 1000) continue;
    if (c.status === 'accepted') s = { ...s, ...abandonContractAction(c.id, s.contracts ?? [], s.stations, s.objectives ?? [], s.npcTraders, s.activeObjectiveId),
      notifications: [...(s.notifications ?? []), createNotification('warning', `${c.title ?? 'Contract'} expired. Your cargo is retained.`, 8000)].slice(-30) };
    else if (c.status === 'offered') s = { ...s, contracts: s.contracts!.filter(x => x.id !== c.id) };
  }
  return s;
}
export function generateContracts(stations: Station[], existing: Contract[], ship: Ship, limit = 5, now = 0): Contract[] {
  const contracts = existing.filter(c => c.status !== 'offered');
  const routes = getSuggestedRoutes(stations.filter(canDockAtStation), ship, { limit: 200, prioritizePerDistance: true });
  for (const station of stations.filter(canDockAtStation)) {
    const picks = routes.filter(r => r.toId === station.id && r.kind === 'direct').slice(0, Math.min(5, limit));
    picks.forEach((r, i) => {
      const units = Math.max(1, Math.min(40, Math.floor(r.maxUnits), ship.maxCargo));
      contracts.push({ id: `contract:${station.id}:${i}:${now}:${Math.random().toString(36).slice(2)}`, title: `Supply ${units} ${r.inputId.replace(/_/g, ' ')}`,
        status: 'offered', fromId: r.fromId, toId: r.toId, offeredById: station.id, commodityId: r.inputId,
        units, deliveredUnits: 0, unitBuy: r.unitBuy, unitSell: r.unitSell, requiredRep: i * 10,
        sellMultiplier: 1.12 + getContractMultiplierBonus(station.reputation ?? 0),
        rewardBonus: Math.max(200, Math.round(units * r.unitBuy * 0.25)), tag: i === 0 ? 'standard' : 'rush', expiresAt: now + 180000,
      });
    });
  }
  return contracts;
}
export function acceptContractAction(id: string, contracts: Contract[], objectives: Objective[], npcs: NpcTrader[], stations: Station[], ship: Ship, now = 0): Pick<GameState, 'contracts' | 'objectives' | 'npcTraders' | 'activeObjectiveId' | 'trackedStationId'> {
  const c = contracts.find(c => c.id === id && c.status === 'offered');
  if (!c) return { contracts, objectives, npcTraders: npcs };
  const station = stations.find(s => s.id === c.offeredById)!;
  const held = (ship.cargo[c.commodityId] ?? 0) + npcs.filter(n => n.isEscort && n.commodityId === c.commodityId).reduce((q, n) => q + (n.escortCargoUsed ?? 0), 0);
  const target = held >= c.units ? c.toId : c.fromId ?? c.toId;
  const escorts: NpcTrader[] = Array.from({ length: getEscortCount(station.reputation ?? 0) }, (_, i) => ({
    id: `escort:${id}:${i}`, isEscort: true, escortingContract: id, fromId: station.id, toId: c.toId, commodityId: c.commodityId,
    position: [...ship.position], velocity: [0, 0, 0], hp: 100, maxHp: 100, speed: 25, escortCargoCapacity: Math.floor(ship.maxCargo / 2), escortCargoUsed: 0, kind: 'clipper',
  }));
  return {
    contracts: contracts.map(x => x.id === id ? { ...x, status: 'accepted', expiresAt: now + 420000 } : x),
    objectives: [...objectives, { id: `obj:${id}`, targetStationId: target, label: `Deliver ${c.units} ${c.commodityId.replace(/_/g, ' ')}`, kind: 'contract', status: 'active' }],
    npcTraders: [...npcs, ...escorts], activeObjectiveId: `obj:${id}`, trackedStationId: target,
  };
}
export function abandonContractAction(id: string, contracts: Contract[], stations: Station[], objectives: Objective[], npcs: NpcTrader[], activeObjectiveId?: string): Partial<GameState> {
  const c = contracts.find(c => c.id === id && c.status === 'accepted');
  if (!c) return {};
  return { contracts: contracts.map(x => x.id === id ? { ...x, status: 'failed' } : x),
    stations: applyReputationWithPropagation(stations, c.toId, -2),
    objectives: objectives.map(o => o.id === `obj:${id}` ? { ...o, status: 'failed' } : o),
    npcTraders: npcs.filter(n => n.escortingContract !== id || (n.escortCargoUsed ?? 0) > 0).map(n => n.escortingContract === id ? { ...n, escortingContract: undefined } : n),
    activeObjectiveId: activeObjectiveId === `obj:${id}` ? undefined : activeObjectiveId,
  };
}
