import type { Station } from '../../domain/types/world_types';
import type { Mission } from '../../domain/types/mission_types';
import { createEmptyMemory } from '../../domain/types/character_types';
import { checkMilestoneActions, getActionPropagation } from './character_memory';

export function recordStationInteraction(stations: Station[], id: string, time: number, tradeVolume?: number): Station[] {
  return stations.map(st => {
    if (st.id !== id) return st;
    const memory = { ...(st.characterMemory ?? createEmptyMemory()) };
    if (tradeVolume !== undefined) memory.totalTradeVolume += tradeVolume;
    else { memory.visitCount++; memory.firstVisitTime ??= time; memory.lastVisitTime = time; }
    memory.knownActions = [...new Set([...memory.knownActions, ...checkMilestoneActions(memory, st.reputation ?? 0)])];
    return { ...st, characterMemory: memory };
  });
}
const choiceActions: Record<string, string> = {
  side_greenfields: 'sided_with_greenfields', side_sol_city: 'sided_with_sol_city',
  expose_ceres: 'exposed_ceres', protect_ceres: 'protected_ceres', join_pirates: 'joined_pirates', enforce_law: 'enforced_law', broker_peace: 'brokered_peace',
  support_strike: 'supported_strike', break_strike: 'broke_strike',
};
const missionActions: Record<string, string> = {
  fabrication_wars_aurum_stage_1: 'chose_aurum_path', fabrication_wars_drydock_stage_1: 'chose_drydock_path',
  greenfields_stage_3: 'destroyed_sol_convoy', sol_city_stage_3: 'escorted_inspector',
  fabrication_wars_stage_3_aurum: 'sabotaged_drydock', fabrication_wars_stage_3_drydock: 'sabotaged_aurum',
  energy_monopoly_stage_3_refinery: 'defended_refinery_convoy', energy_monopoly_stage_3_ceres: 'raided_refinery_convoy',
  pirate_accords_stage_3_pirate: 'attacked_sol_defenses', pirate_accords_stage_3_law: 'attacked_pirate_defenses', pirate_accords_stage_3_peace: 'defended_peace_conference',
};
const effectActions: Record<string, string> = {
  greenfields_independence: 'greenfields_independent', greenfields_controlled: 'greenfields_controlled',
  aurum_exclusive_supplier: 'aurum_won_contract', drydock_exclusive_supplier: 'drydock_won_contract',
  freeport_refinery_established: 'fuel_market_freed', ceres_fuel_monopoly_permanent: 'fuel_monopoly_cemented',
  union_victory: 'union_victory', corporate_victory: 'corporate_victory',
};
export function recordMissionHistory(stations: Station[], mission: Mission, failed = false, choiceId?: string): Station[] {
  const actions = failed ? [] : [choiceActions[choiceId ?? ''], missionActions[mission.id], ...(mission.rewards.permanentEffects ?? []).map(id => effectActions[id])].filter(Boolean);
  const sources = new Set([...mission.availableAt, ...Object.keys(mission.rewards.reputationChanges)]);
  return stations.map(st => {
    const known = actions.filter(action => {
      const propagation = getActionPropagation(action);
      return sources.has(st.id) || propagation.spreadsToAll || propagation.allies.includes(st.id) || propagation.rivals.includes(st.id);
    });
    if (!sources.has(st.id) && !known.length) return st;
    const memory = { ...(st.characterMemory ?? createEmptyMemory()) };
    if (sources.has(st.id)) {
      const key = failed ? 'missionsFailed' : 'missionsCompleted';
      memory[key] = [...new Set([...memory[key], mission.id])];
    }
    memory.knownActions = [...new Set([...memory.knownActions, ...known, ...checkMilestoneActions(memory, st.reputation ?? 0)])];
    return { ...st, characterMemory: memory };
  });
}
