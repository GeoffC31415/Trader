import type { Mission, MissionArc } from '../../domain/types/mission_types';
import type { GameState } from '../../domain/types/world_types';
import { getMissionTemplatesByStage } from '../../domain/constants/mission_constants';
import { applyMultipleReputationChanges } from '../../systems/reputation/faction_system';

export function advanceMissionArc(arc: MissionArc, id: string): MissionArc {
  if (arc.completedMissions.includes(id)) return arc;
  const completedMissions = [...arc.completedMissions, id];
  const stage = getMissionTemplatesByStage(arc.id, arc.currentStage);
  if (!stage.some(t => completedMissions.includes(t.id))) return { ...arc, completedMissions, status: 'in_progress' };
  const next = getMissionTemplatesByStage(arc.id, arc.currentStage + 1);
  return { ...arc, completedMissions, currentStage: next.length ? arc.currentStage + 1 : arc.currentStage,
    status: next.length ? 'in_progress' : 'completed' };
}
export function applyMissionRewards(s: GameState, mission: Mission): Partial<GameState> {
  return { ship: { ...s.ship, credits: s.ship.credits + mission.rewards.credits },
    stations: applyMultipleReputationChanges(s.stations, mission.rewards.reputationChanges) };
}
