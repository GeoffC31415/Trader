import type { Station, NpcTrader } from '../domain/types/world_types';
import { distance, add, sub, normalize, scale, quadraticBezier, lerp } from '../shared/math/vec3';
import { commodities } from './world';
import { SCALE } from '../domain/constants/world_constants';

const commodityById = Object.fromEntries(commodities.map(c => [c.id, c]));

function speedForCommodity(commodityId: string): number {
  const values = commodities.map(c => c.baseBuy);
  const minCost = values.reduce((m, v) => Math.min(m, v), Number.POSITIVE_INFINITY);
  const maxCost = values.reduce((m, v) => Math.max(m, v), 0);
  const c = commodityById[commodityId];
  if (!c) return 10;
  const t = (c.baseBuy - minCost) / Math.max(1e-6, (maxCost - minCost));
  const inv = 1 - t;
  const minSpeed = 6;
  const maxSpeed = 16;
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
        if (ai.canSell === false) continue;
        if (bi.canBuy === false) continue;
        const margin = bi.sell - ai.buy;
        if (margin <= 0) continue;
        routes.push({ id: `r:${id}:${a.id}->${b.id}`, fromId: a.id, toId: b.id, commodityId: id, unitBuy: ai.buy, unitSell: bi.sell, margin, distance: d });
      }
    }
  }
  routes.sort((a, b) => (b.margin / Math.max(1, b.distance)) - (a.margin / Math.max(1, a.distance)) || (b.margin - a.margin));
  return routes;
}

export function spawnNpcTraders(stations: Station[], count: number): NpcTrader[] {
  const routes = computeDirectRoutes(stations);
  const pick: NpcTrader[] = [];
  const byId: Record<string, Station> = Object.fromEntries(stations.map(s => [s.id, s]));
  for (let i = 0; i < routes.length && pick.length < count; i++) {
    const r = routes[i];
    const from = byId[r.fromId];
    const speed = speedForCommodity(r.commodityId);
    const jitter: [number, number, number] = [ (Math.random()-0.5)*0.8*SCALE, (Math.random()-0.5)*0.4*SCALE, (Math.random()-0.5)*0.8*SCALE ];
    const position: [number, number, number] = [ from.position[0] + jitter[0], from.position[1] + jitter[1], from.position[2] + jitter[2] ];
    const to = byId[r.toId];
    const path = planNpcPath(from, to, position);
    pick.push({ id: `${r.id}#${pick.length}`, commodityId: r.commodityId, fromId: r.fromId, toId: r.toId, position, speed, path, pathCursor: 1, hp: 80, maxHp: 80, isHostile: false });
  }
  while (pick.length < count && routes.length > 0) {
    const r = routes[Math.floor(Math.random() * routes.length)];
    const from = byId[r.fromId];
    const speed = speedForCommodity(r.commodityId);
    const position: [number, number, number] = [from.position[0], from.position[1], from.position[2]];
    const to = byId[r.toId];
    const path = planNpcPath(from, to, position);
    pick.push({ id: `${r.id}#${pick.length}`, commodityId: r.commodityId, fromId: r.fromId, toId: r.toId, position, speed, path, pathCursor: 1, hp: 80, maxHp: 80, isHostile: false });
  }
  return pick;
}

// Path planning: produce a gentle U-turn-ish departure curve, straight cruise, and arrival curve
export function planNpcPath(from: Station, to: Station, startPosition: [number, number, number]): [number, number, number][] {
  const p0 = startPosition;
  const p2 = to.position;
  const fromPos = from.position;
  const toPos = to.position;
  const dir = normalize(sub(toPos, fromPos));
  const away = scale(dir, SCALE * 4);
  const side: [number, number, number] = [ -dir[2], 0, dir[0] ]; // simple perpendicular on XZ plane
  const sideScaled = scale(side, SCALE * (2 + Math.random()*2));
  const departTarget = add(add(fromPos, away), sideScaled);

  // Build bezier samples for departure and arrival
  const samples = 12;
  const depart: [number, number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    depart.push(quadraticBezier(p0, departTarget, lerp(departTarget, toPos, 0.15), t));
  }

  const cruiseStart = depart[depart.length - 1];
  const cruiseEnd = lerp(fromPos, toPos, 0.85);
  const cruise: [number, number, number][] = [cruiseStart, cruiseEnd];

  const arrival: [number, number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    arrival.push(quadraticBezier(cruiseEnd, add(toPos, scale(dir, -SCALE * 3)), toPos, t));
  }

  const path = [...depart, ...cruise, ...arrival];
  // Ensure uniqueness to avoid zero-length steps
  const filtered: [number, number, number][] = [];
  for (const p of path) {
    if (filtered.length === 0) { filtered.push(p); continue; }
    const last = filtered[filtered.length - 1];
    if (distance(last, p) > 0.01) filtered.push(p);
  }
  return filtered;
}


