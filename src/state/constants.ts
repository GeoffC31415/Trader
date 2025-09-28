export const SCALE = 10;

export const sp = (p: [number, number, number]): [number, number, number] => [
  p[0] * SCALE,
  p[1] * SCALE,
  p[2] * SCALE,
];

import type { Ship } from './types';

export const shipCaps: Record<Ship['kind'], { acc: number; vmax: number; cargo: number }> = {
  freighter: { acc: 18, vmax: 18, cargo: 1200 },
  heavy_freighter: { acc: 22, vmax: 22, cargo: 2000 },
  clipper: { acc: 30, vmax: 36, cargo: 180 },
  racer: { acc: 40, vmax: 46, cargo: 120 },
  miner: { acc: 16, vmax: 18, cargo: 500 },
  industrial_miner: { acc: 18, vmax: 20, cargo: 1000 },
};

export const shipBaseStats: Record<Ship['kind'], { acc: number; vmax: number; cargo: number }> = {
  freighter: { acc: 10, vmax: 11, cargo: 300 },
  heavy_freighter: { acc: 9, vmax: 12, cargo: 600 },
  clipper: { acc: 18, vmax: 20, cargo: 60 },
  racer: { acc: 24, vmax: 28, cargo: 40 },
  miner: { acc: 9, vmax: 11, cargo: 80 },
  industrial_miner: { acc: 10, vmax: 12, cargo: 160 },
};


