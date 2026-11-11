import type { GameState, NpcTrader } from '../../domain/types/world_types';
import type { Mission } from '../../domain/types/mission_types';
import { MISSION_TEMPLATES } from '../../domain/constants/mission_constants';
import { createMissionFromTemplate, generateMissionsForStation, updateArcStatuses } from '../../systems/missions/mission_generator';
import { checkMissionCompletion, checkMissionFailure, objectiveReady, updateMissionObjectives, type MissionEvent } from '../../systems/missions/mission_validator';
import { advanceMissionArc, applyMissionRewards } from '../helpers/mission_helpers';
import { applyChoicePermanentEffects, projectWorldEffects, stripPriceModifiers } from '../../systems/missions/choice_system';
import { applyStockDeltas } from './npc';
import { recordMissionHistory } from '../helpers/character_history';
import { createNotification } from './notifications';
import { applyMissionToProfile } from './politics_module';
import { distance } from '../../shared/math/vec3';
import { DETECTION_RADIUS, updateSuspicionLevel, shouldDetectShip } from '../../systems/missions/stealth_system';
import { planNpcPath } from '../npc';
import { setTrust, defaultAssistForStation, grantAssist, hasUnconsumedToken } from '../relationships';

function applyTrust(s: GameState, mission: Mission, choiceId?: string): GameState {
  const relationships = { ...s.relationships };
  const tokens = [...(s.allyAssistTokens ?? [])];
  for (const [by, change] of Object.entries(mission.rewards.reputationChanges)) {
    const delta = Math.sign(change);
    const before = relationships[by];
    const after = setTrust(before, delta, s.gameTime * 1000);
    relationships[by] = after;
    if ((before?.tier ?? 0) < 1 && after.tier >= 1 && !hasUnconsumedToken(tokens, by)) {
      const preset = defaultAssistForStation(by);
      tokens.push(grantAssist(by, preset.type, preset.description, s.gameTime * 1000));
    }
  }
  return { ...s, relationships, allyAssistTokens: tokens, stations: recordMissionHistory(s.stations, mission, false, choiceId),
    notifications: [...(s.notifications ?? []), createNotification('success', `${mission.title} completed: ${mission.rewards.credits.toLocaleString()} credits`, 8000)].slice(-30) }; 
}
import { createEscortState, generatePirateWave, addSpawnedPirateIds, checkWaveComplete, markWaveCompleted } from '../../systems/missions/escort_system';

function replace(s: GameState, m: Mission): GameState { return { ...s, missions: s.missions.map(x => x.id === m.id ? m : x) }; }
export function cleanMission(s: GameState, id: string): GameState {
  const owned = new Set(s.npcTraders.filter(n => n.missionId === id).map(n => n.id));
  return { ...s,
    npcTraders: s.npcTraders.filter(n => !owned.has(n.id)),
    projectiles: s.projectiles.filter(p => p.missionId !== id && !owned.has(p.ownerId)),
    stealthStates: new Map([...s.stealthStates].filter(([k]) => !k.startsWith(id + ':'))),
    escortStates: new Map([...s.escortStates].filter(([k]) => !k.startsWith(id + ':'))),
  };
}
export function failMission(s: GameState, id: string, reason: string, cancelled = false): GameState {
  const m = s.missions.find(m => m.id === id);
  if (!m || m.status !== 'active') return s;
  s = { ...s, stations: recordMissionHistory(s.stations, m, true), notifications: [...(s.notifications ?? []), createNotification('warning', `${m.title}: ${reason}. Reset the attempt in the mission log to retry.`, 10000)].slice(-30) };
  return cleanMission(replace(s, { ...m, status: cancelled ? 'cancelled' : 'failed', failureReason: reason, interaction: undefined }), id);
}
export function refreshMissions(s: GameState): GameState {
  const rep = Object.fromEntries(s.stations.map(st => [st.id, st.reputation ?? 0]));
  const upgrades = [s.ship.hasNavigationArray && 'nav', s.ship.hasUnionMembership && 'union'].filter(Boolean) as string[];
  const arcs = updateArcStatuses(s.missionArcs, rep, upgrades);
  const stationId = s.ship.dockedStationId;
  if (!stationId) return { ...s, missionArcs: arcs };
  const offers = generateMissionsForStation(stationId, rep, upgrades, arcs, s.missions.filter(m => m.status === 'active'), arcs.filter(a => a.status === 'completed').map(a => a.id));
  // Remove incompatible stale offers after a choice or stage transition.
  const missions = s.missions.filter(m => m.status !== 'offered' || (
    arcs.some(a => a.id === m.arcId && a.currentStage === m.stage) &&
    (!MISSION_TEMPLATES[m.id]?.branch || arcs.some(a => a.id === m.arcId && Object.values(a.choicesMade).includes(MISSION_TEMPLATES[m.id].branch!)))
  ));
  return { ...s, missionArcs: arcs, missions: [...missions, ...offers.filter(m => !missions.some(x => x.id === m.id))] };
}
export function settleMissions(input: GameState): GameState {
  let s = input;
  for (const snapshot of s.missions) {
    const m = s.missions.find(x => x.id === snapshot.id)!;
    if (m.status !== 'active') continue;
    const failure = checkMissionFailure(m, s.gameTime);
    if (failure.failed) { s = failMission(s, m.id, failure.reason!); continue; }
    if (!checkMissionCompletion(m)) continue;
    s = replace(s, { ...m, status: 'completed', interaction: undefined });
    s = applyTrust({ ...s, ...applyMissionRewards(s, m) }, m);
    s = { ...s, ...applyChoicePermanentEffects(s, m.rewards.permanentEffects ?? []) };
    s = { ...s, ...applyMissionToProfile(s, m.id, null),
      missionArcs: s.missionArcs.map(a => a.id === m.arcId ? advanceMissionArc(a, m.id) : a),
      missionCelebrationData: { missionId: m.id, credits: m.rewards.credits, reputationChanges: m.rewards.reputationChanges },
    };
    s = cleanMission(s, m.id);
  }
  return refreshMissions(s);
}
export function dispatchMissionEvents(input: GameState, events: MissionEvent[]): GameState {
  // Failure checks precede any action and each event sees the previous event's state.
  let s = settleMissions(input);
  for (const e of events) {
    s = { ...s, missions: s.missions.map(m => updateMissionObjectives(m, e)) };
    s = settleMissions(s);
  }
  return s;
}
export function missionBlocker(s: GameState, id: string): string | undefined {
  const m = s.missions.find(m => m.id === id), t = MISSION_TEMPLATES[id];
  if (!m || !t || m.status !== 'offered' || t.deprecated) return 'Mission is not available';
  if (!s.ship.dockedStationId || !m.availableAt.includes(s.ship.dockedStationId)) return 'Dock at the issuing station';
  if (s.missions.filter(m => m.status === 'active').length >= 3) return 'Finish or abandon an active mission (maximum three)';
  if (s.missions.some(x => x.arcId === m.arcId && x.status === 'active')) return 'Another mission in this arc is already active';
  const arc = s.missionArcs.find(a => a.id === m.arcId);
  if (!arc || arc.currentStage !== m.stage) return 'This story stage is no longer available';
  if (t.branch && !Object.values(arc.choicesMade).includes(t.branch)) return 'This is not your chosen branch';
  if (Object.entries(m.requiredRep ?? {}).some(([id, rep]) => (s.stations.find(st => st.id === id)?.reputation ?? 0) < rep)) return 'Improve the required station reputation';
  if (t.requiredUpgrades?.includes('tempcargo') && !s.ship.hasTempCargo) return 'Install temperature-controlled cargo at Drydock first';
  return undefined;
}
export function acceptStoryMission(s: GameState, id: string): GameState {
  if (missionBlocker(s, id)) return s;
  const original = s.missions.find(m => m.id === id)!;
  if (original.type === 'choice') return s;
  const t = MISSION_TEMPLATES[id];
  const m: Mission = { ...createMissionFromTemplate(t), status: 'active', acceptedAt: s.gameTime,
    attempt: (original.attempt ?? 0) + 1, fundingGranted: original.fundingGranted || !!t.advance, items: {}, launched: t.type !== 'escort',
  };
  for (const o of m.objectives.filter(o => o.missionItem && o.target)) m.items![o.target!] = (m.items![o.target!] ?? 0) + (o.quantity ?? 1);
  s = replace(s, m);
  s = { ...s, ship: { ...s.ship, credits: s.ship.credits + (!original.fundingGranted ? t.advance ?? 0 : 0) },
    missionArcs: s.missionArcs.map(a => a.id === m.arcId ? { ...a, status: 'in_progress', choicesMade: t.id.startsWith('fabrication_wars_') && t.stage === 1 ? { ...a.choicesMade, stage_1_choice: t.id.includes('_aurum_') ? 'aurum' : 'drydock' } : a.choicesMade } : a),
  };
  if (m.type === 'combat') {
    const targetStationId = id.includes('pirate_accords') ? (id.endsWith('_pirate') ? 'sol-city' : 'hidden-cove') : id.includes('drydock') ? 'aurum-fab' : id.includes('aurum') ? 'drydock' : id.includes('ceres') ? 'sol-refinery' : 'sol-city';
    const station = s.stations.find(st => st.id === targetStationId)!;
    const targets: NpcTrader[] = [];
    for (const o of m.objectives.filter(o => o.type === 'destroy')) for (let i = 0; i < (o.quantity ?? 1); i++) {
      const turret = id.startsWith('pirate_accords');
      const angle = (targets.length + 1) * 2.1;
      const position: [number, number, number] = [station.position[0] + Math.cos(angle) * (turret ? 100 : 600), station.position[1], station.position[2] + Math.sin(angle) * (turret ? 100 : 600)];
      targets.push({ id: `${id}:${m.attempt}:${o.target ?? o.id}:${i}`, targetGroup: o.target, missionId: id, isMissionTarget: true,
        hp: turret ? 100 : 70, maxHp: turret ? 100 : 70, position, velocity: [0, 0, 0], fromId: station.id, toId: station.id,
        isHostile: turret, isAggressive: turret, role: turret ? 'turret' : 'convoy', speed: 5, path: [position, [...station.position]], pathProgress: 0, launched: false, kind: turret ? 'miner' : 'freighter' });
    }
    s = { ...s, npcTraders: [...s.npcTraders, ...targets] };
  }
  if (m.type === 'escort') {
    const start = s.stations.find(st => st.id === s.ship.dockedStationId)!;
    const escorts: NpcTrader[] = [];
    const escortStates = new Map(s.escortStates);
    for (const o of m.objectives.filter(o => o.type === 'escort')) {
      const dest = s.stations.find(st => st.id === (o.targetStation ?? o.target))!;
      const escort: NpcTrader = { id: o.target!, missionId: id, isMissionEscort: true, launched: false,
        position: [...start.position], velocity: [0, 0, 0], hp: 240, maxHp: 240, fromId: start.id, toId: dest.id,
        isDefendInPlace: dest.id === start.id, speed: 8, path: planNpcPath(start, dest, start.position), pathProgress: 0 };
      escorts.push(escort);
      escortStates.set(`${id}:${escort.id}`, { ...createEscortState(id, escort.id, dest.id, s.gameTime), escortHp: 240, escortMaxHp: 240 });
    }
    s = { ...s, npcTraders: [...s.npcTraders, ...escorts], escortStates };
  }
  return dispatchMissionEvents(s, [{ type: 'station_docked', stationId: s.ship.dockedStationId! }]);
}
export function retryStoryMission(s: GameState, id: string): GameState {
  const m = s.missions.find(m => m.id === id);
  if (!m || !['failed', 'cancelled'].includes(m.status)) return s;
  const fresh = createMissionFromTemplate(MISSION_TEMPLATES[id]);
  return replace(cleanMission(s, id), { ...fresh, attempt: m.attempt, fundingGranted: m.fundingGranted });
}
export function chooseStoryPath(s: GameState, id: string, choiceId: string): GameState {
  if (missionBlocker(s, id)) return s;
  const m = s.missions.find(m => m.id === id)!;
  const choice = m.type === 'choice' && m.choiceOptions?.find(c => c.id === choiceId);
  if (!choice) return s;
  const arc = s.missionArcs.find(a => a.id === m.arcId)!;
  if (arc.choicesMade[`stage_${m.stage}_choice`]) return s;
  const completed: Mission = { ...m, status: 'completed', rewards: choice.rewards };
  s = replace(s, completed);
  s = applyTrust({ ...s, ...applyMissionRewards(s, completed) }, completed, choiceId);
  s = { ...s, ...applyChoicePermanentEffects(s, choice.rewards.permanentEffects ?? []) };
  s = { ...s, ...applyMissionToProfile(s, id, choiceId), missionArcs: s.missionArcs.map(a => a.id === arc.id ? advanceMissionArc({ ...a, choicesMade: { ...a.choicesMade, [`stage_${m.stage}_choice`]: choiceId } }, id) : a) };
  return refreshMissions(s);
}

/** An interaction is authoritative: verifies location, ordering and custody, then consumes real cargo. */
export function interactMission(input: GameState, id: string, objectiveId: string): GameState {
  let s = settleMissions(input);
  let m = s.missions.find(m => m.id === id);
  const o = m?.objectives.find(o => o.id === objectiveId);
  if (!m || m.status !== 'active' || !o || o.completed || !objectiveReady(m, o)) return s;
  const stationId = o.targetStation ?? (o.type === 'visit' ? o.target : undefined);
  const station = s.stations.find(st => st.id === stationId);
  // Documents and research contacts remain accessible through a covert local liaison if docking is denied.
  const remote = (o.missionItem || o.type === 'visit' || (o.type === 'wait' && s.ship.silentRunning)) && station && distance(s.ship.position, station.position) <= 100;
  if (!station || (s.ship.dockedStationId !== station.id && !remote)) return s;
  if (o.type === 'wait') return replace(s, { ...m, interaction: { objectiveId: o.id, elapsed: o.current } });
  if (o.type === 'visit') return dispatchMissionEvents(s, [{ type: 'station_docked', stationId: station.id }]);
  if (o.type !== 'deliver') return s;
  let quantity = 0;
  if (o.missionItem && o.target) {
    quantity = Math.min((o.quantity ?? 1) - o.current, m.items?.[o.target] ?? 0);
    m = { ...m, items: { ...m.items, [o.target]: (m.items?.[o.target] ?? 0) - quantity } };
  } else {
    const cargo = { ...s.ship.cargo };
    const stock: Record<string, number> = {};
    let npcs = s.npcTraders;
    for (const item of o.basket ?? (o.target ? [o.target] : [])) {
      let needed = (o.quantity ?? 1) - o.current - quantity;
      const take = Math.min(needed, cargo[item] ?? 0);
      cargo[item] = (cargo[item] ?? 0) - take; quantity += take; stock[item] = take; needed -= take;
      npcs = npcs.map(n => {
        if (!n.isEscort || n.commodityId !== item || needed <= 0) return n;
        const supplied = Math.min(needed, n.escortCargoUsed ?? 0);
        quantity += supplied; stock[item] += supplied; needed -= supplied;
        return { ...n, escortCargoUsed: (n.escortCargoUsed ?? 0) - supplied };
      });
    }
    s = { ...s, npcTraders: npcs, ship: { ...s.ship, cargo }, stations: applyStockDeltas(stripPriceModifiers(s.stations), { [station.id]: stock }) };
    s = { ...s, ...projectWorldEffects(s) };
  }
  if (quantity <= 0) return s;
  m = { ...m, objectives: m.objectives.map(x => x.id === o.id ? { ...x, current: x.current + quantity, completed: x.current + quantity >= (x.quantity ?? 1) } : x) };
  return settleMissions(replace(s, m));
}

export function tickStoryMissions(input: GameState, dt: number, kills: { npcId: string; missionId?: string; targetGroup?: string }[]): GameState {
  let s = dispatchMissionEvents(input, kills.map(k => ({ ...k, type: 'npc_destroyed', eventId: `kill:${k.npcId}` })));
  for (const snapshot of s.missions.filter(m => m.status === 'active')) {
    let m = s.missions.find(x => x.id === snapshot.id)!;
    if (m.interaction) {
      const o = m.objectives.find(o => o.id === m.interaction!.objectiveId)!;
      const local = s.stations.find(st => st.id === o.targetStation);
      if (s.ship.dockedStationId === o.targetStation || (s.ship.silentRunning && local && distance(s.ship.position, local.position) <= 100)) s = dispatchMissionEvents(s, [{ type: 'time_elapsed', duration: dt, stationId: o.targetStation, objectiveId: o.id }]);
    }
    m = s.missions.find(x => x.id === snapshot.id)!;
    if (m.status !== 'active') continue;
    for (const o of m.objectives.filter(o => o.type === 'avoid_detection')) {
      const station = s.stations.find(st => st.id === o.target)!;
      const key = `${m.id}:${station.id}`;
      const previous = s.stealthStates.get(key)?.suspicionLevel ?? 0;
      const level = updateSuspicionLevel(previous, distance(s.ship.position, station.position) < DETECTION_RADIUS, !s.ship.dockedStationId && shouldDetectShip(s.ship, m, o), dt * (s.ship.silentRunning ? 0.25 : 1));
      const stealthStates = new Map(s.stealthStates).set(key, { stationId: station.id, suspicionLevel: level, detected: level >= 100 });
      s = { ...s, stealthStates };
      if (level >= 100) s = dispatchMissionEvents(s, [{ type: 'detection_triggered', stationId: station.id, missionId: m.id }]);
    }
    m = s.missions.find(x => x.id === snapshot.id)!;
    if (m.status === 'active' && m.type === 'combat' && s.npcTraders.some(n => n.missionId === m.id && n.role === 'convoy' && n.launched && distance(n.position, s.stations.find(st => st.id === n.toId)!.position) < 40)) {
      s = failMission(s, m.id, 'A required convoy escaped to its destination');
      continue;
    }
    if (m.status !== 'active' || m.type !== 'escort' || !m.launched) continue;
    const template = MISSION_TEMPLATES[m.id];
    const objectives = m.objectives.filter(o => o.type === 'escort');
    const living = objectives.filter(o => s.npcTraders.some(n => n.id === o.target && n.hp > 0));
    const required = template.survivorsRequired ?? objectives.length;
    if (living.length < required) { s = failMission(s, m.id, `Protected ships lost: ${required} survivors required`); continue; }
    const key = `${m.id}:${objectives[0].target}`;
    let escort = s.escortStates.get(key)!;
    if (checkWaveComplete(escort, s.npcTraders)) {
      escort = markWaveCompleted(escort);
      s = { ...s, escortStates: new Map(s.escortStates).set(key, escort) };
      s = dispatchMissionEvents(s, [{ type: 'wave_survived', missionId: m.id, waveNumber: escort.wavesCompleted, eventId: `${m.id}:wave:${escort.wavesCompleted}` }]);
    }
    if (escort.currentWavePirateIds.length === 0 && escort.waveCount < (template.waves ?? 0) && s.gameTime - escort.lastWaveTime >= 5) {
      const escortNpc = s.npcTraders.find(n => n.id === living[0].target)!;
      const wave = generatePirateWave(m.id, escort.waveCount + 1, escortNpc.position, s.gameTime).map(n => ({ ...n, role: 'raider' as const, hp: 45, maxHp: 45 }));
      escort = addSpawnedPirateIds({ ...escort, waveCount: escort.waveCount + 1, lastWaveTime: s.gameTime }, wave.map(n => n.id));
      s = { ...s, npcTraders: [...s.npcTraders, ...wave], escortStates: new Map(s.escortStates).set(key, escort) };
    }
    if (escort.wavesCompleted >= (template.waves ?? 0)) {
      const arrived = living.filter(o => {
        const npc = s.npcTraders.find(n => n.id === o.target)!;
        const dest = s.stations.find(st => st.id === o.targetStation)!;
        return distance(npc.position, dest.position) < 60;
      });
      if (arrived.length >= required) {
        m = s.missions.find(x => x.id === m.id)!;
        s = replace(s, { ...m, objectives: m.objectives.map(o => o.type === 'escort' ? { ...o, completed: true, current: 1 } : o) });
        s = settleMissions(s);
      }
    }
  }
  return s;
}
