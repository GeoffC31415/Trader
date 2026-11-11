import { describe, it, expect } from 'vitest';
import { useGameStore } from '../../store';
import { createShip } from '../../../domain/registries/ship_registry';
import { MISSION_TEMPLATES } from '../../../domain/constants/mission_constants';
import { createMissionFromTemplate, initializeMissionArcs, generateMissionsForStation } from '../../../systems/missions/mission_generator';
import { objectiveReady } from '../../../systems/missions/mission_validator';
import { acceptStoryMission, dispatchMissionEvents, interactMission, tickStoryMissions, chooseStoryPath, retryStoryMission, failMission, settleMissions } from '../mission_runtime';
import type { GameState } from '../../../domain/types/world_types';

function fixture(id: string): GameState {
  const t = MISSION_TEMPLATES[id];
  const state = useGameStore.getInitialState();
  const station = state.stations.find(s => s.id === t.availableAt[0])!;
  return { ...state, hasChosenStarter: true, gameTime: 0,
    ship: createShip('freighter', [...station.position], { dockedStationId: station.id, credits: 100000, hasTempCargo: true, hasShieldedCargo: true }),
    stations: state.stations.map(s => ({ ...s, reputation: 100 })),
    missions: [createMissionFromTemplate(t)], npcTraders: [],
    missionArcs: initializeMissionArcs().map(a => a.id === t.arcId ? { ...a, status: 'in_progress', currentStage: t.stage, completedMissions: t.prerequisiteMissions ?? [], choicesMade: t.branch ? { stage_2_choice: t.branch } : {} } : a),
  };
}
function dock(s: GameState, id: string): GameState {
  const st = s.stations.find(st => st.id === id)!;
  return dispatchMissionEvents({ ...s, ship: { ...s.ship, position: [...st.position], dockedStationId: id } }, [{ type: 'station_docked', stationId: id }]);
}

describe('every live mission contract', () => {
  for (const t of Object.values(MISSION_TEMPLATES).filter(t => !t.deprecated)) {
    it(`${t.id} has a legal success path and exactly one payout`, () => {
      let s = fixture(t.id);
      const before = s.ship.credits;
      if (t.type === 'choice') {
        const choice = t.choiceOptions![0];
        s = chooseStoryPath(s, t.id, choice.id);
        expect(s.missions.find(m => m.id === t.id)?.status).toBe('completed');
        const credits = s.ship.credits;
        expect(chooseStoryPath(s, t.id, choice.id).ship.credits).toBe(credits);
        return;
      }
      s = acceptStoryMission(s, t.id);
      expect(s.missions[0].status).toBe('active');
      for (let step = 0; step < 100 && s.missions.find(m => m.id === t.id)?.status === 'active'; step++) {
        const m = s.missions.find(m => m.id === t.id)!;
        const o = m.objectives.find(o => !o.completed && objectiveReady(m, o));
        if (!o) break;
        if (o.type === 'destroy') {
          const targets = s.npcTraders.filter(n => n.missionId === t.id && (!o.target || n.targetGroup === o.target));
          s = dispatchMissionEvents(s, targets.map(n => ({ type: 'npc_destroyed', npcId: n.id, missionId: t.id, targetGroup: n.targetGroup, eventId: `kill:${n.id}` })));
        } else if (o.type === 'collect') {
          s = dispatchMissionEvents(s, [{ type: 'commodity_acquired', commodityId: o.target!, quantity: o.quantity! }]);
        } else if (o.type === 'visit') {
          s = dock(s, o.target!);
        } else if (o.type === 'deliver') {
          s = dock(s, o.targetStation!);
          if (!o.missionItem) s = { ...s, ship: { ...s.ship, cargo: { ...s.ship.cargo, [o.basket?.[0] ?? o.target!]: o.quantity! } } };
          s = interactMission(s, m.id, o.id);
        } else if (o.type === 'wait') {
          s = dock(s, o.targetStation!);
          s = interactMission(s, m.id, o.id);
          s = tickStoryMissions({ ...s, gameTime: s.gameTime + o.quantity! }, o.quantity!, []);
        } else if (o.type === 'escort' || o.type === 'defend') {
          s = { ...s, missions: s.missions.map(x => x.id === t.id ? { ...x, launched: true } : x) };
          for (let wave = 0; wave < (t.waves ?? 0) + 2; wave++) {
            s = tickStoryMissions({ ...s, gameTime: s.gameTime + 6 }, 0.1, []);
            s = { ...s, npcTraders: s.npcTraders.filter(n => !n.isMissionTarget) };
            s = tickStoryMissions(s, 0.1, []);
          }
          s = { ...s, npcTraders: s.npcTraders.map(n => n.isMissionEscort ? { ...n, position: [...s.stations.find(st => st.id === n.toId)!.position] } : n) };
          s = tickStoryMissions(s, 0.1, []);
        }
      }
      expect(s.missions.find(m => m.id === t.id)?.status).toBe('completed');
      expect(s.ship.credits).toBe(before + (t.advance ?? 0) + t.rewards.credits);
      expect(s.npcTraders.some(n => n.missionId === t.id)).toBe(false);
      expect(settleMissions(s).ship.credits).toBe(s.ship.credits);
    });
  }
});

describe('mission safety invariants', () => {
  it('counts a batch of three distinct kills, rejects unrelated or replayed kills', () => {
    let s = acceptStoryMission(fixture('greenfields_stage_3'), 'greenfields_stage_3');
    const targets = s.npcTraders;
    s = dispatchMissionEvents(s, [{ type: 'npc_destroyed', missionId: 'other', npcId: 'unrelated' }]);
    expect(s.missions[0].objectives[0].current).toBe(0);
    const e = { type: 'npc_destroyed' as const, npcId: targets[0].id, targetGroup: targets[0].targetGroup, missionId: s.missions[0].id, eventId: 'kill:1' };
    s = dispatchMissionEvents(s, [e, e]);
    expect(s.missions[0].objectives[0].current).toBe(1);
    s = dispatchMissionEvents(s, targets.slice(1).map(n => ({ type: 'npc_destroyed', npcId: n.id, targetGroup: n.targetGroup, missionId: n.missionId, eventId: n.id })));
    expect(s.missions[0].status).toBe('completed');
  });
  it('does not fabricate goods or turn in at the wrong station', () => {
    let s = acceptStoryMission(fixture('fabrication_wars_stage_4_aurum'), 'fabrication_wars_stage_4_aurum');
    expect(interactMission(s, s.missions[0].id, 'deliver_mixed_fabricated').missions[0].objectives[0].current).toBe(0);
    s = dock(s, 'ceres-pp');
    expect(interactMission(s, s.missions[0].id, 'deliver_mixed_fabricated').missions[0].status).toBe('active');
  });
  it('cannot report the audit before installing, and interruption is recoverable', () => {
    let s = acceptStoryMission(fixture('energy_monopoly_stage_1'), 'energy_monopoly_stage_1');
    s = interactMission(s, s.missions[0].id, 'return_refinery');
    expect(s.missions[0].objectives.find(o => o.id === 'return_refinery')?.completed).toBe(false);
    s = dock(s, 'ceres-pp'); s = interactMission(s, s.missions[0].id, 'install_device');
    s = tickStoryMissions(s, 1, []);
    expect(s.missions[0].status).toBe('active');
  });
  it('deadline takes precedence over the final action, including acceptance at zero', () => {
    let s = acceptStoryMission(fixture('energy_monopoly_stage_3_ceres'), 'energy_monopoly_stage_3_ceres');
    s = dispatchMissionEvents({ ...s, gameTime: 600 }, s.npcTraders.map(n => ({ type: 'npc_destroyed', npcId: n.id, targetGroup: n.targetGroup, missionId: n.missionId })));
    expect(s.missions[0].status).toBe('failed');
  });
  it('can retry without duplicating procurement grants', () => {
    let s = acceptStoryMission(fixture('fabrication_wars_stage_2_aurum'), 'fabrication_wars_stage_2_aurum');
    const credits = s.ship.credits;
    s = acceptStoryMission(retryStoryMission(failMission(s, s.missions[0].id, 'test'), s.missions[0].id), s.missions[0].id);
    expect(s.ship.credits).toBe(credits); expect(s.missions[0].status).toBe('active'); expect(s.missions[0].attempt).toBe(2);
  });
  it('single escort loss fails; no waves spawn before launch', () => {
    let s = acceptStoryMission(fixture('sol_city_stage_3'), 'sol_city_stage_3');
    s = tickStoryMissions({ ...s, gameTime: 50 }, 1, []);
    expect(s.npcTraders.filter(n => n.isMissionTarget)).toHaveLength(0);
    s = { ...s, missions: s.missions.map(m => ({ ...m, launched: true })), npcTraders: [] };
    expect(tickStoryMissions(s, 1, []).missions[0].status).toBe('failed');
  });
  it('keeps incompatible branches out of generation', () => {
    const s = fixture('energy_monopoly_stage_3_ceres');
    const result = generateMissionsForStation('sol-refinery', { 'sol-refinery': 100 }, ['nav'], s.missionArcs, [], []);
    expect(result.some(m => m.id === 'energy_monopoly_stage_3_refinery')).toBe(false);
  });
});
