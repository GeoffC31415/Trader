import type { Mission, MissionObjective } from '../../domain/types/mission_types';

export type MissionEvent = ({
  type: 'commodity_sold' | 'commodity_acquired'; commodityId: string; quantity: number; stationId?: string;
} | { type: 'station_docked'; stationId: string }
  | { type: 'npc_destroyed'; npcId: string; missionId?: string; targetGroup?: string }
  | { type: 'escort_reached_destination'; npcId: string }
  | { type: 'wave_survived'; waveNumber: number; missionId?: string }
  | { type: 'time_elapsed'; duration: number; stationId?: string; objectiveId?: string }
  | { type: 'detection_triggered'; stationId: string; missionId?: string }
) & { eventId?: string };

export function objectiveReady(mission: Mission, objective: MissionObjective): boolean {
  return (objective.prerequisites ?? []).every(id => mission.objectives.some(o => o.id === id && o.completed));
}
export function validateObjective(o: MissionObjective, e: MissionEvent): { completed: boolean; current: number } {
  let amount = 0;
  switch (o.type) {
    case 'deliver':
      if (!o.missionItem && e.type === 'commodity_sold' && e.commodityId === o.target && (!o.targetStation || e.stationId === o.targetStation)) amount = e.quantity;
      break;
    case 'collect': if (e.type === 'commodity_acquired' && e.commodityId === o.target) amount = e.quantity; break;
    case 'visit': if (e.type === 'station_docked' && e.stationId === o.target) amount = 1; break;
    case 'destroy': if (e.type === 'npc_destroyed' && (!o.target || o.target === e.npcId || o.target === e.targetGroup)) amount = 1; break;
    case 'escort': if (e.type === 'escort_reached_destination' && e.npcId === o.target) amount = 1; break;
    case 'defend': if (e.type === 'wave_survived') amount = 1; break;
    case 'wait': if (e.type === 'time_elapsed' && e.objectiveId === o.id && e.stationId === o.targetStation) amount = e.duration; break;
    case 'avoid_detection':
      if (e.type === 'detection_triggered' && e.stationId === o.target) return { current: 1, completed: false };
      return { current: o.current, completed: o.current === 0 };
  }
  const current = Math.min(o.quantity ?? 1, o.current + Math.max(0, amount));
  return { current, completed: current >= (o.quantity ?? 1) };
}
export function checkMissionCompletion(m: Mission): boolean {
  if (m.type === 'choice') return false;
  return m.objectives.filter(o => !o.optional).every(o => o.completed && !o.failed);
}
export function checkMissionFailure(m: Mission, now: number): { failed: boolean; reason?: string } {
  if (m.timeLimit !== undefined && m.acceptedAt !== undefined && now >= m.acceptedAt + m.timeLimit) return { failed: true, reason: 'Time limit exceeded' };
  if (m.expiresAt !== undefined && now >= m.expiresAt) return { failed: true, reason: 'Mission expired' };
  if (m.objectives.some(o => !o.optional && (o.failed || (o.type === 'avoid_detection' && o.current > 0)))) return { failed: true, reason: 'Critical objective failed' };
  return { failed: false };
}
export function updateMissionObjectives(m: Mission, e: MissionEvent): Mission {
  if (m.status !== 'active' || (e.eventId && m.seenEvents?.includes(e.eventId))) return m;
  if ('missionId' in e && e.missionId !== undefined && e.missionId !== m.id) return m;
  // Combat events must always identify their owning mission.
  if ((e.type === 'npc_destroyed' || e.type === 'wave_survived') && e.missionId !== m.id) return m;
  return { ...m,
    seenEvents: e.eventId ? [...(m.seenEvents ?? []), e.eventId] : m.seenEvents,
    objectives: m.objectives.map(o => {
      if ((o.completed && o.type !== 'avoid_detection') || o.failed || !objectiveReady(m, o)) return o;
      const result = validateObjective(o, e);
      return { ...o, ...result };
    }),
  };
}
export function calculateMissionProgress(m: Mission): number {
  const required = m.objectives.filter(o => !o.optional);
  return required.length ? required.filter(o => o.completed).length / required.length * 100 : 0;
}
export function getNextObjective(m: Mission): MissionObjective | null {
  return m.objectives.find(o => !o.completed && !o.optional && objectiveReady(m, o)) ?? null;
}
export function checkDetectionRange(a: [number, number, number], b: [number, number, number], radius: number): boolean {
  return Math.hypot(...a.map((v, i) => v - b[i])) < radius;
}
