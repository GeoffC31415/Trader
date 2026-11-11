import { test, expect, type Page } from '@playwright/test';

// Deliberately arranged late-campaign preconditions; unlike readiness.spec.ts,
// this checks controls/integration, not fresh-save access to these assignments.
async function arrangeOffer(page: Page, id: string) {
  await page.evaluate(async id => {
    const storePath = '/src/state/store.ts', catalogPath = '/src/domain/constants/mission_constants.ts', generatorPath = '/src/systems/missions/mission_generator.ts';
    const store = (await import(storePath)).useGameStore;
    const template = (await import(catalogPath)).MISSION_TEMPLATES[id];
    const mission = (await import(generatorPath)).createMissionFromTemplate(template);
    const s = store.getInitialState();
    const station = s.stations.find((st: any) => st.id === template.availableAt[0]);
    store.setState({ ...s, hasChosenStarter: true, paused: true, graphicsQuality: 'low',
      missions: [mission], npcTraders: [], stations: s.stations.map((st: any) => ({ ...st, reputation: 100 })),
      ship: { ...s.ship, position: [...station.position], dockedStationId: station.id },
      missionArcs: s.missionArcs.map((arc: any) => arc.id === template.arcId ? { ...arc, status: 'in_progress', currentStage: template.stage, completedMissions: template.prerequisiteMissions ?? [], choicesMade: template.branch ? { stage_2_choice: template.branch } : {} } : arc),
    });
  }, id);
}

test('escort launch, abandonment/retry, and held combat fire use real UI actions', async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('trader.graphics', 'low'));
  await page.route('https://**/*', route => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Select Freighter', exact: true }).click();
  await arrangeOffer(page, 'sol_city_stage_3');
  await page.getByRole('button', { name: 'Mission log', exact: true }).click();
  const log = page.getByRole('dialog', { name: 'Mission log' });
  await log.getByRole('button', { name: 'Accept mission', exact: true }).click();
  const launched = () => page.evaluate(async () => { const path = '/src/state/store.ts'; return (await import(path)).useGameStore.getState().missions.find((m: any) => m.id === 'sol_city_stage_3')?.launched; });
  await log.getByRole('button', { name: 'Launch convoy / begin defense' }).click();
  expect(await launched()).toBe(false);
  await log.getByRole('button', { name: 'Close log' }).click();
  await page.getByRole('button', { name: /UNDOCK/ }).click();
  await page.getByRole('button', { name: 'Mission log', exact: true }).click();
  await log.getByRole('button', { name: 'Launch convoy / begin defense' }).click();
  expect(await launched()).toBe(true);
  await expect(page.getByRole('progressbar', { name: 'Escort hull' })).toBeVisible();
  await log.getByRole('button', { name: 'Abandon (retry available)' }).click();
  await expect(log.getByText('Abandoned by player', { exact: true })).toBeVisible();
  expect(await page.evaluate(async () => { const path = '/src/state/store.ts'; return (await import(path)).useGameStore.getState().npcTraders.filter((n: any) => n.missionId === 'sol_city_stage_3').length; })).toBe(0);
  await log.getByRole('button', { name: 'Reset attempt', exact: true }).click();
  await log.getByRole('button', { name: 'Close log' }).click();
  await page.getByRole('button', { name: 'Resume', exact: true }).first().click();
  await page.keyboard.press('e');
  await page.getByRole('button', { name: /Enter Station/ }).click();
  await page.getByRole('button', { name: 'Mission log', exact: true }).click();
  await log.getByRole('button', { name: 'Accept mission', exact: true }).click();
  expect(await page.evaluate(async () => { const path = '/src/state/store.ts'; const s = (await import(path)).useGameStore.getState(); return { attempt: s.missions.find((m: any) => m.id === 'sol_city_stage_3')?.attempt, credits: s.ship.credits }; })).toEqual({ attempt: 2, credits: 10000 });
  await log.getByRole('button', { name: 'Close log' }).click();

  await arrangeOffer(page, 'greenfields_stage_3');
  await page.getByRole('button', { name: 'Mission log', exact: true }).click();
  await log.getByRole('button', { name: 'Accept mission', exact: true }).click();
  await log.getByRole('button', { name: 'Close log' }).click();
  await page.getByRole('button', { name: /UNDOCK/ }).click();
  await page.getByRole('button', { name: 'Resume', exact: true }).first().click();
  await page.locator('canvas[data-engine]').click({ position: { x: 700, y: 500 } });
  await page.keyboard.press('Tab');
  const target = await page.evaluate(async () => { const path = '/src/state/store.ts'; const s = (await import(path)).useGameStore.getState(); const n = s.npcTraders.find((n: any) => n.id === s.selectedTargetId); return { id: n.id, hp: n.hp }; });
  await page.keyboard.down('Space');
  try {
    await expect.poll(() => page.evaluate(async id => { const path = '/src/state/store.ts'; return (await import(path)).useGameStore.getState().npcTraders.find((n: any) => n.id === id)?.hp ?? 0; }, target.id), { timeout: 20000 }).toBeLessThan(target.hp);
  } finally { await page.keyboard.up('Space'); }
  expect(await page.evaluate(async () => { const path = '/src/state/store.ts'; return (await import(path)).useGameStore.getState().combatImpacts.length; })).toBeGreaterThan(0);
  // Move off the station mesh so the ship/plume can be inspected, then arrange an
  // incoming weapon, not a hull mutation: actual collision drives the flash/smoke.
  await page.evaluate(async () => { const path = '/src/state/store.ts'; const store = (await import(path)).useGameStore, s = store.getState(); store.setState({ ship: { ...s.ship, position: [s.ship.position[0], s.ship.position[1], s.ship.position[2] + 160] } }); });
  await page.waitForTimeout(1500); // Camera follow, not an accelerated simulation clock.
  await page.evaluate(async () => {
    const statePath = '/src/state/store.ts', weaponsPath = '/src/systems/combat/weapon_systems.ts';
    const store = (await import(statePath)).useGameStore, s = store.getState();
    const shot = (await import(weaponsPath)).createProjectile({ ...s.ship.weapon, damage: 80 }, [s.ship.position[0] + 20, s.ship.position[1], s.ship.position[2]], [0, 0, 0], s.ship.position, 'smoke-test-attacker', 'npc');
    store.setState({ projectiles: [...s.projectiles, shot] });
  });
  await expect(page.getByLabel('Incoming damage', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Pause (P)', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Hull hit' })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('combat-controls.png') });
  expect(errors).toEqual([]);
});
