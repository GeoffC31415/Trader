import type { GameState, TravelOpportunity } from '../domain/types/world_types';
import { canDockAtStation, applyReputationWithPropagation } from './reputation/faction_system';
import { getTargetStock } from './economy/pricing';
import { distance } from '../shared/math/vec3';
import { createNotification } from '../state/modules/notifications';
const notify = (s: GameState, message: string): GameState => ({ ...s, notifications: [...(s.notifications ?? []), createNotification('info', message, 6000)].slice(-30) });

function clearOpportunity(s: GameState): GameState {
  const tracking = s.opportunity !== undefined && s.opportunity.id === s.trackedStationId;
  return { ...s, opportunity: undefined, trackedStationId: tracking ? undefined : s.trackedStationId,
    ship: tracking ? { ...s.ship, autopilot: false, cruise: false, cruiseSpool: 0 } : s.ship };
}
/** Optional, contextual detours, never an automatic interruption or mission requirement. */
export function tickOpportunities(input: GameState, random = Math.random): GameState {
  let s = input;
  if (s.opportunity && s.gameTime >= s.opportunity.expiresAt) s = clearOpportunity(s);
  if (s.opportunity || s.gameTime < (s.nextOpportunityAt ?? 45) || s.ship.dockedStationId || s.ship.hp <= 0 || Math.hypot(...s.ship.velocity) < 2) return s;
  if (s.missions.some(m => m.status === 'active' && (m.type === 'combat' || m.type === 'escort'))) return s;
  const friendly = s.stations.filter(canDockAtStation).sort((a, b) => distance(a.position, s.ship.position) - distance(b.position, s.ship.position));
  if (!friendly.length || distance(friendly[0].position, s.ship.position) < 180 || s.npcTraders.some(n => n.isHostile && distance(n.position, s.ship.position) < 700)) return s;
  const station = friendly[0];
  const supply = Object.entries(s.ship.cargo).filter(([id, amount]) => amount >= 3 && station.inventory[id]?.canBuy)
    .sort(([a], [b]) => (station.inventory[a].stock ?? 0) / getTargetStock(station.type, a) - (station.inventory[b].stock ?? 0) / getTargetStock(station.type, b))[0];
  const choice = random();
  const kind: TravelOpportunity['kind'] = choice < 0.33 && supply ? 'procurement' : choice < 0.66 ? 'distress' : 'salvage';
  const speed = Math.hypot(...s.ship.velocity);
  const position: [number, number, number] = kind === 'procurement' ? [...station.position] : s.ship.position.map((v, i) => v + s.ship.velocity[i] / speed * 240) as [number, number, number];
  const commodityId = kind === 'procurement' ? supply![0] : kind === 'distress' ? 'refined_fuel' : 'alloys';
  const quantity = kind === 'distress' ? 5 : 3;
  const opportunity: TravelOpportunity = { id: `opportunity:${Math.floor(s.gameTime)}`, kind, position, stationId: station.id, commodityId, quantity,
    reward: kind === 'procurement' ? Math.ceil(station.inventory[commodityId].sell * quantity * 1.5) : 600,
    expiresAt: s.gameTime + 180, risky: kind === 'salvage' && random() < Math.min(0.6, 0.2 * (s.pirateAggressionMultiplier ?? 1)),
  };
  return notify({ ...s, opportunity, nextOpportunityAt: s.gameTime + 180 + random() * 120 }, `Optional ${kind} opportunity nearby. Open its flight card to investigate or ignore it.`);
}

export function resolveOpportunity(input: GameState, action: 'complete' | 'decline' | 'relay'): GameState {
  const o = input.opportunity;
  if (!o || input.gameTime >= o.expiresAt) return clearOpportunity(input);
  if (action === 'decline') return clearOpportunity(input);
  if (action === 'relay') return notify(clearOpportunity(input), 'Coordinates relayed to local traffic. No payment or obligation.');
  if (distance(input.ship.position, o.position) > 100) return notify(input, 'Approach within 100m to interact');
  if (o.kind === 'procurement' && input.ship.dockedStationId !== o.stationId) return notify(input, 'Dock at the requesting station to hand over cargo');
  const cargo = { ...input.ship.cargo };
  if (o.kind !== 'salvage' && (cargo[o.commodityId] ?? 0) < o.quantity) return notify(input, `Requires ${o.quantity} ${o.commodityId.replace(/_/g, ' ')}`);
  if (o.kind === 'salvage') {
    const weight = Object.values(cargo).reduce((sum, q) => sum + q, 0);
    if (weight + o.quantity > input.ship.maxCargo) return notify(input, 'Not enough free cargo space');
    cargo[o.commodityId] = (cargo[o.commodityId] ?? 0) + o.quantity;
  } else cargo[o.commodityId] -= o.quantity;
  let stations = input.stations;
  if (o.kind !== 'salvage') stations = applyReputationWithPropagation(stations.map(st => st.id === o.stationId && st.inventory[o.commodityId] ? { ...st, inventory: { ...st.inventory, [o.commodityId]: { ...st.inventory[o.commodityId], stock: (st.inventory[o.commodityId].stock ?? 0) + o.quantity } } } : st), o.stationId, o.kind === 'distress' ? 4 : 2);
  let s = clearOpportunity({ ...input, stations, ship: { ...input.ship, cargo, credits: input.ship.credits + (o.kind === 'salvage' ? 0 : o.reward) } });
  if (o.risky) {
    const station = stations.find(st => st.id === o.stationId)!;
    const pirate = { id: `${o.id}:pirate`, kind: 'clipper' as const, fromId: station.id, toId: station.id, position: [o.position[0] + 180, o.position[1], o.position[2]] as [number, number, number],
      velocity: [0, 0, 0] as [number, number, number], path: [o.position], pathProgress: 0, speed: 10, cargoCapacity: 0, hp: 45, maxHp: 45, credits: 0,
      isHostile: true, isAggressive: true, isMissionTarget: true, isMissionEscort: false, role: 'raider' as const, missionId: o.id, despawnAt: s.gameTime + 90,
    };
    s = { ...s, npcTraders: [...s.npcTraders, pirate] };
  }
  return notify(s, o.risky ? 'Salvage recovered. The advertised raider threat is closing in!' : 'Opportunity completed; cargo and local supplies updated.');
}
