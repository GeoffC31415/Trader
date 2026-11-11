import { test, expect } from '@playwright/test';

test('searches markets, tracks multiple deliveries, themes story offers and shows only a close docking prompt', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('trader.graphics', 'low'));
  await page.route('https://**/*', route => route.abort());
  await page.goto('/'); await page.getByRole('button', { name: 'Select Freighter', exact: true }).click();
  await expect(page.getByText('Press E to dock at Sol City', { exact: true })).toHaveCount(1);
  await page.keyboard.press('e'); await page.getByRole('button', { name: /Enter Station/ }).click();
  await page.getByRole('searchbox', { name: 'Search goods' }).fill('BAT');
  await expect(page.getByText('batteries', { exact: true })).toBeVisible();
  await expect(page.getByText('hydrogen', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(page.getByText('hydrogen', { exact: true })).toBeVisible();

  // Arrange offers, then use real acceptance. These are UI fixtures, not earned campaign access.
  await page.evaluate(async () => {
    const path = '/src/state/store.ts'; const store = (await import(path)).useGameStore;
    store.setState({ contracts: ['batteries', 'refined_fuel'].map(commodityId => ({ id: `ui:${commodityId}`, offeredById: 'sol-city', fromId: 'freeport', toId: 'sol-city', commodityId, units: 2, unitBuy: 100, unitSell: 130, status: 'offered' })) });
    store.getState().acceptContract('ui:batteries'); store.getState().acceptContract('ui:refined_fuel');
  });
  await expect(page.getByText('Active assignments (2)', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Tracked assignment' }).selectOption('ui:refined_fuel');
  await expect(page.getByText('Deliver 2 refined fuel to Sol City', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Hide objectives', exact: true }).click();
  await page.getByRole('button', { name: 'Show assignments (2)', exact: true }).click();
  // Simulate a loaded checkpoint with stale objective IDs. Completed orders must still disappear.
  await page.evaluate(async () => { const path = '/src/state/store.ts'; const store = (await import(path)).useGameStore; store.setState({ contracts: store.getState().contracts.map((c: any) => ({ ...c, status: 'completed' })) }); });
  await expect(page.getByRole('progressbar', { name: 'Delivery progress' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear waypoint', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Active assignments', exact: true })).toHaveCount(0);

  await page.evaluate(async () => {
    const statePath = '/src/state/store.ts', catalogPath = '/src/domain/constants/mission_constants.ts', generatorPath = '/src/systems/missions/mission_generator.ts';
    const store = (await import(statePath)).useGameStore, s = store.getState();
    const station = s.stations.find((st: any) => st.id === 'greenfields');
    const template = (await import(catalogPath)).MISSION_TEMPLATES.greenfields_stage_1;
    store.setState({ paused: true, ship: { ...s.ship, position: [...station.position], dockedStationId: station.id }, missions: [(await import(generatorPath)).createMissionFromTemplate(template)] });
  });
  await page.getByRole('button', { name: /Missions/ }).click();
  const offer = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Breaking the Chain', exact: true }) });
  const card = await offer.boundingBox(), action = await offer.getByRole('button', { name: 'Accept mission', exact: true }).boundingBox();
  expect(action!.x).toBeGreaterThan(card!.x + card!.width * 0.6);
  await page.screenshot({ path: test.info().outputPath('story-contracts.png') });
  await page.evaluate(async () => {
    const path = '/src/state/store.ts'; const store = (await import(path)).useGameStore, s = store.getState();
    store.setState({ missions: [], missionArcs: s.missionArcs.map((a: any) => a.id === 'greenfields_independence' ? { ...a, currentStage: 3, status: 'in_progress', choicesMade: { stage_2_choice: 'side_sol_city' } } : a), ship: { ...s.ship, dockedStationId: undefined, position: [480, 0, -40] } });
  });
  await expect(page.getByText(/^Press E to dock at /)).toHaveCount(0);
  await page.evaluate(async () => {
    const path = '/src/state/store.ts'; const store = (await import(path)).useGameStore, s = store.getState(); const st = s.stations.find((st: any) => st.id === 'sol-refinery');
    store.setState({ ship: { ...s.ship, position: [st.position[0] + 10, st.position[1], st.position[2]] } });
  });
  await expect(page.getByText('Press E to dock at Helios Refinery', { exact: true })).toHaveCount(1);
  expect(errors).toEqual([]);
});
