import type { GameState } from '../../domain/types/world_types';
import type { Mission } from '../../domain/types/mission_types';
import { MISSION_TEMPLATES } from '../../domain/constants/mission_constants';
import { canDockAtStation } from '../../systems/reputation/faction_system';
import { applyReputationToBuyPrice } from '../modules/reputation';

/** One-time working capital, not a second reward or a repeatable retry payment. */
export function procurementBudget(s: GameState, mission: Mission): number {
  const minimum = MISSION_TEMPLATES[mission.id]?.advance ?? 0;
  if (!minimum) return 0;
  let quote = 0;
  for (const o of mission.objectives.filter(o => o.type === 'deliver' && !o.missionItem && o.target)) {
    const prices = s.stations.filter(st => canDockAtStation(st) && !(mission.id === 'greenfields_stage_1' && st.id === 'sol-city'))
      .filter(st => st.inventory[o.target!]?.canSell !== false && (st.inventory[o.target!]?.stock ?? 0) > 0)
      .map(st => applyReputationToBuyPrice(st.inventory[o.target!].buy, st.reputation ?? 0));
    if (prices.length) quote += Math.ceil(Math.min(...prices) * (o.quantity ?? 1));
  }
  return Math.max(minimum, Math.ceil(quote * 1.1));
}
