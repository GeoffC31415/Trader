import type { GameState } from '../domain/types/world_types';

export function storedGoods(s: Pick<GameState, 'finance'>): Record<string, number> {
  const goods: Record<string, number> = {};
  for (const warehouse of Object.values(s.finance?.warehouses ?? {})) for (const [id, qty] of Object.entries(warehouse.goods)) goods[id] = (goods[id] ?? 0) + qty;
  return goods;
}
export function ownedQuantity(s: Pick<GameState, 'ship' | 'npcTraders' | 'finance'>, id: string): number {
  return (s.ship.cargo[id] ?? 0) + s.npcTraders.filter(n => n.isEscort && n.commodityId === id).reduce((sum, n) => sum + (n.escortCargoUsed ?? 0), 0) + (storedGoods(s)[id] ?? 0);
}
