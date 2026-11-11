import { afterEach, expect, it } from 'vitest';
import { useGameStore } from '../../store';
import { updateShipFire, FIRE_SUPPRESSION_COST } from '../../../systems/combat/ship_fire';
import { updateCombat } from '../combat';
import { createProjectile } from '../../../systems/combat/weapon_systems';
import { serializeGame, deserializeGame } from '../../../systems/persistence';
const original = useGameStore.getState();
afterEach(() => useGameStore.setState(original, true));
function setup() {
  const s = useGameStore.getInitialState();
  useGameStore.setState({ ...s, hasChosenStarter: true, npcTraders: [], nextOpportunityAt: 99999, nextMarketEventAt: 99999,
    ship: { ...s.ship, hp: 30, onFire: true, fireSeconds: 0, credits: 10000 } }, true);
  return useGameStore.getState();
}
it('ignites from real weapon damage below 35% hull, not low hull alone', () => {
  const s = setup(); const ship = { ...s.ship, hp: 40, onFire: false };
  const projectile = createProjectile({ ...ship.weapon, damage: 10 }, [ship.position[0] + 10, 0, ship.position[2]], [0, 0, 0], ship.position, 'attacker', 'npc');
  const result = updateCombat({ ...s, ship, projectiles: [projectile], suppressNpcFire: false, now: 1000 }, 0.01);
  expect(result.ship.hp).toBe(30); expect(result.ship.onFire).toBe(true);
  expect(updateShipFire({ ...ship, hp: 20 }, 1).hp).toBe(20);
});
it('burns slowly on simulation time; pause freezes fire and suppression', () => {
  setup(); useGameStore.getState().tick(0.1); expect(useGameStore.getState().ship.hp).toBeCloseTo(29.95);
  useGameStore.setState({ paused: true }); useGameStore.getState().tick(0.1);
  expect(useGameStore.getState().ship.hp).toBeCloseTo(29.95);
});
it('docking at any accessible station extinguishes without repairing or charging', () => {
  setup(); const st = useGameStore.getState().stations.find(s => s.id === 'greenfields')!;
  useGameStore.setState(s => ({ ship: { ...s.ship, position: [...st.position] } }));
  useGameStore.getState().addNotification({ type: 'warning', message: 'FIRE ALERT — test fixture' });
  useGameStore.getState().tryDock(st.id); const ship = useGameStore.getState().ship;
  expect(useGameStore.getState().notifications?.some(n => n.message.startsWith('FIRE ALERT'))).toBe(false);
  expect(ship.onFire).toBe(false); expect(ship.hp).toBe(30); expect(ship.credits).toBe(10000);
});
it('installs only once at a shipyard, then automatically suppresses after three seconds', () => {
  setup(); useGameStore.getState().purchaseFireSuppression(); expect(useGameStore.getState().ship.hasFireSuppression).toBeFalsy();
  useGameStore.setState(s => ({ ship: { ...s.ship, dockedStationId: 'drydock' } }));
  useGameStore.getState().purchaseFireSuppression(); useGameStore.getState().purchaseFireSuppression();
  const s = useGameStore.getState(); expect(s.ship.credits).toBe(10000 - FIRE_SUPPRESSION_COST);
  const ship = { ...s.ship, dockedStationId: undefined, onFire: true, fireSeconds: 2.9 };
  const suppressed = updateShipFire(ship, 1);
  expect(suppressed.onFire).toBe(false); expect(suppressed.hp).toBeCloseTo(29.95);
});
it('shipyard repairs restore hull/energy at the quoted price and cannot overdraw credits', () => {
  setup(); useGameStore.setState(s => ({ ship: { ...s.ship, dockedStationId: 'drydock', energy: 1, credits: 100 } }));
  useGameStore.getState().repairShip(); expect(useGameStore.getState().ship.hp).toBe(30);
  useGameStore.setState(s => ({ ship: { ...s.ship, credits: 1000 } })); useGameStore.getState().repairShip();
  const ship = useGameStore.getState().ship; expect(ship.hp).toBe(ship.maxHp); expect(ship.energy).toBe(ship.maxEnergy); expect(ship.credits).toBe(650); expect(ship.onFire).toBe(false);
});
it('insurance recovery clears lethal fire without leaving damage ticking at the recovery port', () => {
  setup(); useGameStore.setState(s => ({ ship: { ...s.ship, hp: .01 } })); useGameStore.getState().tick(.1);
  const s = useGameStore.getState(); expect(s.ship.hp).toBe(s.ship.maxHp); expect(s.ship.onFire).toBe(false);
  expect(s.ship.dockedStationId).toBeTruthy(); expect(s.ship.credits).toBe(9000);
});
it('retains an installed suppression system through ship replacement', () => {
  setup(); useGameStore.setState(s => ({ ship: { ...s.ship, dockedStationId: 'drydock', credits: 30000, hasFireSuppression: true } }));
  useGameStore.getState().replaceShip('clipper', 20000);
  expect(useGameStore.getState().ship.kind).toBe('clipper'); expect(useGameStore.getState().ship.hasFireSuppression).toBe(true);
});
it('checkpoints retain burning/suppression timers and old saves default safely', () => {
  const s = setup(); useGameStore.setState({ ship: { ...s.ship, hasFireSuppression: true, fireSeconds: 1.4 } });
  const saved = serializeGame(useGameStore.getState()); const loaded = deserializeGame(saved);
  expect(loaded.ship!.onFire).toBe(true); expect(loaded.ship!.fireSeconds).toBe(1.4); expect(loaded.ship!.hasFireSuppression).toBe(true);
  const old = JSON.parse(saved); delete old.data.ship.onFire; delete old.data.ship.fireSeconds; delete old.data.ship.hasFireSuppression;
  expect(deserializeGame(JSON.stringify(old)).ship!.onFire).toBeUndefined();
});
