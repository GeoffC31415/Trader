import { afterEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '../../store';
import { createShip } from '../../../domain/registries/ship_registry';
import { MISSION_TEMPLATES } from '../../../domain/constants/mission_constants';
import { createMissionFromTemplate, initializeMissionArcs, generateMissionsForStation } from '../../../systems/missions/mission_generator';
import { acceptStoryMission, chooseStoryPath, dispatchMissionEvents, interactMission, tickStoryMissions, failMission } from '../mission_runtime';
import { applyChoicePermanentEffects } from '../../../systems/missions/choice_system';
import { buyCommodity, sellCommodity } from '../economy';
import { settleContracts, acceptContractAction, abandonContractAction } from '../missions';
import { requestBounty, tickOpportunities, resolveOpportunity } from '../../../systems/travel_opportunities';
import { updateProjectile, createProjectile } from '../../../systems/combat/weapon_systems';
import { WEAPON_BASE_STATS as BASE_WEAPONS } from '../../../domain/constants/weapon_constants';
const levels = { damageLevel: 0, fireRateLevel: 0, rangeLevel: 0 };
const WEAPON_BASE_STATS = { laser: { ...BASE_WEAPONS.laser, ...levels }, plasma: { ...BASE_WEAPONS.plasma, ...levels }, missile: { ...BASE_WEAPONS.missile, ...levels } };
import { updateCombat } from '../combat';
import { serializeGame, deserializeGame } from '../../../systems/persistence';
import type { GameState, Contract, NpcTrader } from '../../../domain/types/world_types';
const original = useGameStore.getState();
afterEach(() => { useGameStore.setState(original, true); vi.restoreAllMocks(); });
function fixture(id: string): GameState {
  const t = MISSION_TEMPLATES[id]; const initial = useGameStore.getInitialState();
  const station = initial.stations.find(st => st.id === t.availableAt[0])!;
  return { ...initial, hasChosenStarter: true, gameTime: 0, paused: false, npcTraders: [],
    ship: createShip('freighter', [...station.position], { dockedStationId: station.id, credits: 100000 }),
    stations: initial.stations.map(st => ({ ...st, reputation: 100 })), missions: [createMissionFromTemplate(t)],
    missionArcs: initializeMissionArcs().map(a => a.id === t.arcId ? { ...a, currentStage: t.stage, status: 'in_progress', completedMissions: t.prerequisiteMissions ?? [], choicesMade: t.branch ? { stage_2_choice: t.branch } : {} } : a),
  };
}
function fight(id: string, escort = false) {
  useGameStore.setState(acceptStoryMission(fixture(id), id));
  let s = useGameStore.getState();
  if (!escort) {
    const station = s.stations.find(st => st.id === s.npcTraders[0].toId)!;
    useGameStore.setState({ npcTraders: s.npcTraders.map(n => ({ ...n, launched: true })), ship: { ...s.ship, dockedStationId: undefined, position: [...station.position] } });
  } else {
    s.undock(); useGameStore.getState().launchMission(id);
  }
  for (let i = 0; i < 1500 && useGameStore.getState().missions.find(m => m.id === id)?.status === 'active'; i++) {
    s = useGameStore.getState();
    const protectedShip = s.npcTraders.find(n => n.isMissionEscort);
    if (protectedShip) useGameStore.setState({ ship: { ...s.ship, position: [protectedShip.position[0], protectedShip.position[1] + 20, protectedShip.position[2]] } });
    const target = s.npcTraders.find(n => n.isMissionTarget);
    if (target) s.fireWeapon(target.position);
    useGameStore.getState().tick(0.1);
  }
  return useGameStore.getState();
}

it.each<[string, Partial<GameState>]>([
  ['dock briefing', { dockIntroVisibleId: 'greenfields' }],
  ['choice', { blockingDialog: true }],
  ['story celebration', { missionCelebrationData: { missionId: 'greenfields_stage_1', credits: 0, reputationChanges: {} } }],
  ['contract celebration', { celebrationVisible: 1 }],
])('freezes flight, firing and deadlines during a blocking %s overlay', (_, patch) => {
  const s = fixture('greenfields_stage_1'); useGameStore.setState({ ...s, ...patch, ship: { ...s.ship, dockedStationId: undefined } });
  useGameStore.getState().tick(0.1); useGameStore.getState().fireWeapon([100, 0, 0]); useGameStore.getState().thrust([1, 0, 0], 0.1);
  expect(useGameStore.getState().gameTime).toBe(0); expect(useGameStore.getState().projectiles).toEqual([]); expect(useGameStore.getState().ship.velocity).toEqual([0, 0, 0]);
});
describe('actual action-pipeline integration', () => {
  it('completes a convoy battle through real weapon damage, NPC movement, and kill attribution', () => {
    const s = fight('greenfields_stage_3');
    expect(s.missions.find(m => m.id === 'greenfields_stage_3')?.status).toBe('completed');
    expect(s.ship.hp).toBeGreaterThan(0);
  });
  it('completes a moving escort with real hostile fire and actual player kills', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9);
    const s = fight('sol_city_stage_3', true);
    expect(s.missions.find(m => m.id === 'sol_city_stage_3')?.status).toBe('completed');
  });
  it('fails an undefended, launched convoy instead of auto-clearing waves while docked', () => {
    useGameStore.setState(acceptStoryMission(fixture('sol_city_stage_3'), 'sol_city_stage_3'));
    useGameStore.getState().launchMission('sol_city_stage_3');
    expect(useGameStore.getState().missions[0].launched).toBe(false);
    useGameStore.getState().undock(); useGameStore.getState().launchMission('sol_city_stage_3');
    useGameStore.setState({ ship: { ...useGameStore.getState().ship, dockedStationId: 'sol-city' } });
    for (let i = 0; i < 1500 && useGameStore.getState().missions[0].status === 'active'; i++) useGameStore.getState().tick(0.1);
    expect(useGameStore.getState().missions[0].status).toBe('failed');
  });
  it('gives defeat priority over a simultaneous final kill, even if every port was hostile', () => {
    let s = acceptStoryMission(fixture('greenfields_stage_3'), 'greenfields_stage_3');
    const victim = { ...s.npcTraders[0], hp: 1, position: [100, 0, 0] as [number, number, number] };
    s = { ...s, missions: s.missions.map(m => ({ ...m, objectives: m.objectives.map(o => o.type === 'destroy' ? { ...o, current: (o.quantity ?? 1) - 1 } : o) })),
      stations: s.stations.map(st => ({ ...st, reputation: -100, isHostile: true })), ship: { ...s.ship, position: [0, 0, 0], dockedStationId: undefined, hp: 1 }, npcTraders: [victim],
      projectiles: [createProjectile(WEAPON_BASE_STATS.laser, [0, 0, 0], [0, 0, 0], victim.position, 'player', 'player'), createProjectile(WEAPON_BASE_STATS.laser, victim.position, [0, 0, 0], [0, 0, 0], victim.id, 'npc')] };
    useGameStore.setState(s); useGameStore.getState().tick(0.1);
    expect(useGameStore.getState().missions[0].status).toBe('failed');
    expect(useGameStore.getState().ship.hp).toBe(100);
    expect(useGameStore.getState().ship.credits).toBe(99000);
    expect(useGameStore.getState().ship.dockedStationId).toBe('freeport');
  });
  it('consumes real turn-in goods and increases actual destination stock', () => {
    let s = acceptStoryMission(fixture('greenfields_stage_1'), 'greenfields_stage_1');
    const before = s.stations.find(st => st.id === 'greenfields')!.inventory.luxury_goods.stock ?? 0;
    s = { ...s, ship: { ...s.ship, cargo: { luxury_goods: 10 } } };
    s = interactMission(s, 'greenfields_stage_1', 'deliver_luxury');
    expect(s.ship.cargo.luxury_goods).toBe(0);
    expect(s.stations.find(st => st.id === 'greenfields')!.inventory.luxury_goods.stock).toBe(before + 10);
    expect(s.stations.find(st => st.id === 'greenfields')!.characterMemory?.missionsCompleted).toContain('greenfields_stage_1');
  });
  it('allows a covert operation without legal docking, but pauses outside contact range', () => {
    let s = acceptStoryMission(fixture('energy_monopoly_stage_1'), 'energy_monopoly_stage_1');
    const ceres = s.stations.find(st => st.id === 'ceres-pp')!;
    s = { ...s, ship: { ...s.ship, dockedStationId: undefined, silentRunning: true, position: [ceres.position[0] + 90, ceres.position[1], ceres.position[2]] } };
    s = interactMission(s, 'energy_monopoly_stage_1', 'dock_ceres'); s = interactMission(s, 'energy_monopoly_stage_1', 'install_device');
    s = tickStoryMissions({ ...s, gameTime: 10 }, 10, []);
    expect(s.missions[0].objectives.find(o => o.id === 'install_device')?.current).toBe(10);
    s = tickStoryMissions({ ...s, gameTime: 20, ship: { ...s.ship, position: [0, 1000, 0] } }, 10, []);
    expect(s.missions[0].objectives.find(o => o.id === 'install_device')?.current).toBe(10);
  });
  it('does not blame the player for an enemy projectile destroying a civilian', () => {
    const s = fixture('greenfields_stage_3');
    const npc: NpcTrader = { id: 'civilian', missionId: 'greenfields_stage_3', isMissionTarget: true, fromId: 'sol-city', toId: 'sol-city', position: [100, 0, 0], hp: 1, maxHp: 1 };
    const p = createProjectile(WEAPON_BASE_STATS.laser, [0, 0, 0], [0, 0, 0], npc.position, 'enemy', 'npc');
    const result = updateCombat({ ...s, ship: { ...s.ship, position: [0, 100, 0] }, npcTraders: [npc], projectiles: [p], now: 100 }, 0.1);
    expect(result.npcTraders).toHaveLength(0); expect(result.missionNpcDestroyedEvents).toEqual([]); expect(result.reputationChanges).toEqual([]);
  });
  it('purges shots owned by dead enemies when a mission is abandoned', () => {
    let s = acceptStoryMission(fixture('greenfields_stage_3'), 'greenfields_stage_3');
    s = { ...s, projectiles: [{ ...createProjectile(WEAPON_BASE_STATS.plasma, [0, 0, 0], [0, 0, 0], [100, 0, 0], 'dead-enemy', 'npc'), missionId: 'greenfields_stage_3' }] };
    expect(failMission(s, 'greenfields_stage_3', 'test').projectiles).toEqual([]);
  });
  it('homing missiles turn toward locked targets without gaining speed', () => {
    const p = { ...createProjectile(WEAPON_BASE_STATS.missile, [0, 0, 0], [0, 0, 0], [100, 0, 0], 'player', 'player'), targetId: 'enemy' };
    const next = updateProjectile(p, 0.1, [100, 0, 100]);
    expect(next.velocity[2]).toBeGreaterThan(0); expect(Math.hypot(...next.velocity)).toBeCloseTo(Math.hypot(...p.velocity));
  });
});

for (const t of Object.values(MISSION_TEMPLATES).filter(t => t.type === 'choice')) for (const choice of t.choiceOptions ?? []) it(`${t.id}/${choice.id} offers only its own next branch and cannot pay twice`, () => {
  let s = chooseStoryPath(fixture(t.id), t.id, choice.id);
  const rep = Object.fromEntries(s.stations.map(st => [st.id, 100]));
  const offers = s.stations.flatMap(st => generateMissionsForStation(st.id, rep, ['union', 'nav'], s.missionArcs, [], s.missionArcs.filter(a => a.status === 'completed').map(a => a.id)));
  expect(offers.some(m => m.id === choice.nextMissionId)).toBe(true);
  expect(offers.filter(m => m.arcId === t.arcId).every(m => MISSION_TEMPLATES[m.id].branch === choice.id)).toBe(true);
  expect(chooseStoryPath(s, t.id, choice.id).ship.credits).toBe(s.ship.credits);
  expect(s.stations.some(st => st.characterMemory?.knownActions.length)).toBe(true);
});

it('unlocked bounties require a real scoped kill and pay exactly once', () => {
  let s = fixture('greenfields_stage_1'); s = { ...s, ship: { ...s.ship, dockedStationId: 'sol-city' }, unlockedFeatures: ['bounty_hunting'] };
  s = requestBounty(s); expect(s.opportunity?.kind).toBe('bounty');
  const before = s.ship.credits; expect(resolveOpportunity(s, 'complete').ship.credits).toBe(before);
  expect(tickOpportunities(s, () => 0.9, [{ npcId: 'other' }]).ship.credits).toBe(before);
  s = tickOpportunities(s, () => 0.9, [{ npcId: `${s.opportunity!.id}:pirate` }]);
  expect(s.ship.credits).toBe(before + 1000); expect(s.opportunity).toBeUndefined();
  expect(tickOpportunities(s, () => 0.9, [{ npcId: 'already-paid' }]).ship.credits).toBe(s.ship.credits);
});

it('contract deadlines use simulation time and do not consume retained cargo or repeat penalties', () => {
  const s = fixture('greenfields_stage_1');
  const c: Contract = { id: 'c', toId: 'greenfields', offeredById: 'greenfields', status: 'offered', commodityId: 'grain', units: 10 };
  const accepted = { ...s, ...acceptContractAction('c', [c], [], [], s.stations, s.ship, 1000) };
  const expired = settleContracts({ ...accepted, gameTime: 421 });
  expect(expired.contracts![0].status).toBe('failed'); expect(expired.ship.cargo).toEqual(s.ship.cargo);
  expect(settleContracts(expired).stations).toEqual(expired.stations);
});

it('escorts provide real extra capacity and loaded cargo survives contract cancellation', () => {
  const s = fixture('greenfields_stage_1'); const st = s.stations.find(st => st.id === 'greenfields')!;
  const escort: NpcTrader = { id: 'e', fromId: st.id, toId: st.id, position: [...st.position], hp: 100, maxHp: 100, isEscort: true, escortingContract: 'c', commodityId: 'grain', escortCargoCapacity: 10, escortCargoUsed: 0 };
  const ship = { ...s.ship, maxCargo: 5, cargo: {} };
  const purchase = buyCommodity(ship, s.stations, [escort], {}, 'grain', 10, { id: 'c' })!;
  expect(purchase.ship.cargo.grain).toBe(5); expect(purchase.npcTraders[0].escortCargoUsed).toBe(5);
  const updates = abandonContractAction('c', [{ id: 'c', status: 'accepted', commodityId: 'grain', units: 10, toId: st.id }], purchase.stations, [], purchase.npcTraders);
  const sale = sellCommodity({ ...purchase.ship, dockedStationId: 'sol-city' }, updates.stations!, updates.npcTraders!, {}, purchase.avgCostByCommodity, 'grain', 10, updates.npcTraders!)!;
  expect(sale.ship.cargo.grain).toBe(0); expect(sale.npcTraders).toHaveLength(0);
});

for (const t of Object.values(MISSION_TEMPLATES).filter(t => !t.deprecated)) it(`${t.id} survives a validated campaign checkpoint`, () => {
  const s = t.type === 'choice' ? chooseStoryPath(fixture(t.id), t.id, t.choiceOptions![0].id) : acceptStoryMission(fixture(t.id), t.id);
  const loaded = deserializeGame(serializeGame(s));
  expect(loaded.missions).toEqual(s.missions); expect(loaded.escortStates).toEqual(s.escortStates); expect(loaded.paused).toBe(true);
});
it('rejects incomplete world topology and corrupted contract collections', () => {
  const snapshot = JSON.parse(serializeGame(fixture('greenfields_stage_1')));
  snapshot.data.contracts = 'corrupt'; expect(() => deserializeGame(JSON.stringify(snapshot))).toThrow();
  snapshot.data.contracts = []; snapshot.data.stations = snapshot.data.stations.slice(1);
  expect(() => deserializeGame(JSON.stringify(snapshot))).toThrow();
});
it('guides the tutorial to its actual supplier, waits for the full cargo, then tracks the destination', () => {
  const s = useGameStore.getInitialState();
  useGameStore.setState(s, true);
  // Match the real mounted UI: random contracts exist before choosing a starter.
  useGameStore.getState().generateContracts();
  useGameStore.getState().chooseStarter('freighter', { tutorial: true });
  useGameStore.getState().tryDock();
  expect(useGameStore.getState().contracts?.filter(c => c.status === 'offered').map(c => c.id)).toEqual(['tutorial:fuel']);
  useGameStore.getState().dismissDockIntro();
  useGameStore.getState().acceptContract('tutorial:fuel');
  expect(useGameStore.getState().trackedStationId).toBe('sol-refinery');
  useGameStore.getState().undock();
  const refinery = s.stations.find(st => st.id === 'sol-refinery')!;
  useGameStore.setState({ ship: { ...useGameStore.getState().ship, position: [...refinery.position] } });
  useGameStore.getState().tryDock(); useGameStore.getState().dismissDockIntro();
  useGameStore.getState().buy('refined_fuel', 1);
  expect(useGameStore.getState().tutorialStep).toBe('buy_fuel');
  useGameStore.getState().buy('refined_fuel', 9);
  expect(useGameStore.getState().tutorialStep).toBe('deliver_fuel'); expect(useGameStore.getState().trackedStationId).toBe('sol-city');
  expect(useGameStore.getState().objectives?.find(o => o.id === 'obj:tutorial:fuel')?.targetStationId).toBe('sol-city');
  useGameStore.getState().undock();
  const city = s.stations.find(st => st.id === 'sol-city')!;
  useGameStore.setState({ ship: { ...useGameStore.getState().ship, position: [...city.position] } });
  useGameStore.getState().tryDock(); useGameStore.getState().dismissDockIntro();
  useGameStore.getState().sell('refined_fuel', 10);
  expect(useGameStore.getState().contracts?.find(c => c.id === 'tutorial:fuel')?.status).toBe('completed');
  expect(useGameStore.getState().tutorialStep).toBe('done');
  expect(useGameStore.getState().tutorialActive).toBe(true); // Keep the completion message visible until explicitly closed.
});
it('docks at an explicit navigation destination rather than a closer overlapping station', () => {
  const initial = useGameStore.getInitialState();
  useGameStore.setState({ ...initial, hasChosenStarter: true, ship: { ...initial.ship, position: [493, 0, -47], dockedStationId: undefined } }, true);
  useGameStore.getState().tryDock();
  expect(useGameStore.getState().ship.dockedStationId).toBe('greenfields');
  useGameStore.getState().undock();
  useGameStore.getState().tryDock('sol-refinery');
  expect(useGameStore.getState().ship.dockedStationId).toBe('sol-refinery');
  useGameStore.getState().undock();
  useGameStore.getState().tryDock('sol-city');
  expect(useGameStore.getState().ship.dockedStationId).toBeUndefined(); // Explicit targets still require range.
});
it('stock repricing does not accidentally discard a permanent discount after buying', () => {
  let s = fixture('greenfields_stage_1'); s = { ...s, ...applyChoicePermanentEffects(s, ['greenfields_food_discount']) };
  useGameStore.setState(s); useGameStore.getState().buy('grain', 10);
  const item = useGameStore.getState().stations.find(st => st.id === 'greenfields')!.inventory.grain;
  expect(item.buy).toBe(Math.round(item.unmodifiedBuy! * 0.95));
});
