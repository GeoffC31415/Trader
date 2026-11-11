import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => { await page.addInitScript(() => localStorage.setItem('trader.graphics', 'low')); });

test('renders WebGL, flies with held input, pauses, and loads a checkpoint', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  // The game must not depend on external HDR/font services to start.
  await page.route('https://**/*', route => route.abort());
  await page.goto('/');
  await page.getByRole('button', { name: 'Select Freighter', exact: true }).click();
  await expect(page.locator('canvas[data-engine]')).toBeVisible();
  const before = await page.evaluate(async () => { const path = '/src/state/store.ts'; return (await import(path)).useGameStore.getState().ship.position; });
  await page.keyboard.down('w');
  await expect.poll(() => page.evaluate(async p => { const path = '/src/state/store.ts'; const s = (await import(path)).useGameStore.getState(); return Math.hypot(...s.ship.position.map((v: number, i: number) => v - p[i])); }, before), { timeout: 15000 }).toBeGreaterThan(1);
  await page.keyboard.up('w');
  await page.getByRole('button', { name: 'Pause (P)', exact: true }).click();
  const time = await page.evaluate(async () => { const path = '/src/state/store.ts'; return (await import(path)).useGameStore.getState().gameTime; });
  await page.waitForTimeout(300);
  expect(await page.evaluate(async () => { const path = '/src/state/store.ts'; return (await import(path)).useGameStore.getState().gameTime; })).toBe(time);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Load saved campaign', exact: true }).click();
  await expect(page.getByText('Paused — deadlines and simulation frozen.')).toBeVisible();
  await page.getByRole('button', { name: 'Mission log', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Mission log' })).toBeVisible();
  await page.screenshot({ path: 'test-results/flight-checkpoint.png' });
  expect(errors).toEqual([]);
});

test('accepts a funded courier assignment, consumes real cargo, and advances the story', async ({ page }) => {
  await page.route('https://**/*', route => route.abort());
  await page.goto('/'); await page.getByRole('button', { name: 'Select Freighter', exact: true }).click();
  // Arrange only the location/paused clock, then use real docking, acceptance and turn-in actions.
  await page.evaluate(async () => { const path = '/src/state/store.ts'; const store = (await import(path)).useGameStore; const s = store.getState(); const st = s.stations.find((x: any) => x.id === 'greenfields'); store.setState({ paused: true, ship: { ...s.ship, position: [...st.position] } }); store.getState().tryDock(); });
  await page.getByRole('button', { name: /Enter Station/ }).click();
  await page.getByRole('button', { name: 'Mission log', exact: true }).click();
  const log = page.getByRole('dialog', { name: 'Mission log' });
  await log.getByRole('button', { name: 'Accept mission', exact: true }).click();
  await expect.poll(() => page.evaluate(async () => { const path = '/src/state/store.ts'; return (await import(path)).useGameStore.getState().ship.credits; })).toBe(17000);
  // Buy the real cargo from a legal supplier using the actual economy transaction.
  await page.evaluate(async () => { const path = '/src/state/store.ts'; const store = (await import(path)).useGameStore; const s = store.getState(); const supplier = s.stations.find((st: any) => st.inventory.luxury_goods.canSell && st.inventory.luxury_goods.stock >= 10); store.setState({ ship: { ...s.ship, position: [...supplier.position], dockedStationId: supplier.id } }); store.getState().buy('luxury_goods', 10); const next = store.getState(); const dest = next.stations.find((st: any) => st.id === 'greenfields'); store.setState({ ship: { ...next.ship, position: [...dest.position], dockedStationId: dest.id } }); });
  await log.getByRole('button', { name: 'Hand over cargo / document', exact: true }).click();
  const result = await page.evaluate(async () => { const path = '/src/state/store.ts'; const s = (await import(path)).useGameStore.getState(); return { status: s.missions.find((m: any) => m.id === 'greenfields_stage_1').status, cargo: s.ship.cargo.luxury_goods, next: s.missions.some((m: any) => m.id === 'greenfields_stage_2' && m.status === 'offered') }; });
  expect(result).toEqual({ status: 'completed', cargo: 0, next: true });
});
