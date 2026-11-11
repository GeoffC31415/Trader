import { test, expect } from '@playwright/test';

test('journal links real telemetry and charts; shipyard repair and suppression resolve real weapon fires', async ({ page }) => {
  test.setTimeout(180000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('trader.graphics', 'low'));
  await page.route('https://**/*', route => route.abort());
  await page.goto('/'); await page.getByRole('button', { name: 'Select Freighter', exact: true }).click();
  await page.keyboard.press('e'); await page.getByRole('button', { name: /Enter Station/ }).click();
  // Populate a readable demonstration with real store trades and journal transactions.
  // Political/world/price preconditions and later shipyard travel are arranged, not earned campaign access.
  await page.evaluate(async () => {
    const path = '/src/state/store.ts', journalPath = '/src/systems/journal.ts', politicsPath = '/src/systems/politics/political_compass.ts';
    const store = (await import(path)).useGameStore;
    const quote = () => store.setState((s: any) => ({ stations: s.stations.map((st: any) => st.id === 'sol-city' ? { ...st, inventory: { ...st.inventory, refined_fuel: { ...st.inventory.refined_fuel, buy: 100, sell: 150, stock: 100, canBuy: true, canSell: true } } } : st) }));
    quote(); store.getState().buy('refined_fuel', 5); quote(); store.getState().sell('refined_fuel', 5);
    const s = store.getState(), politics = await import(politicsPath);
    store.setState((await import(journalPath)).recordJournalTransition(s, { ...s, gameTime: 60,
      politicalProfile: politics.applyMissionContribution(politics.createInitialProfile(), 'greenfields_stage_2', 'side_greenfields', 1, 60),
      stations: s.stations.map((st: any) => st.id === 'greenfields' ? { ...st, reputation: 40 } : st),
      lastPriceSnapshotTime: 60000,
      priceHistory: { 'sol-city': { refined_fuel: [{ time: 0, buy: 120, sell: 90 }, { time: 30000, buy: 150, sell: 105 }, { time: 60000, buy: 135, sell: 100 }] } },
      marketEvents: [{ id: 'journal-demo-strike', title: 'Drydock work stoppage', description: 'Workers suspend production during negotiations.', startedAt: 60000, duration: 180000, effects: [{ stationId: 'drydock', commodityId: 'machinery', priceMultiplier: 1.2 }] }],
    }));
  });
  await page.getByRole('button', { name: /tab journal Journal/ }).click();
  const journal = page.getByRole('region', { name: 'Commander journal' });
  await expect(journal.getByRole('heading', { name: 'Your system footprint', exact: true })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('journal-command-deck.png') });
  await journal.getByRole('button', { name: /Allegiances/ }).click();
  const compass = journal.getByRole('figure', { name: 'Political journey' });
  const decision = compass.getByRole('img', { name: /Sided with Greenfields/ }); await decision.focus();
  await expect(compass.getByRole('status')).toContainText('Freedom 15, Labor 10');
  await page.keyboard.press('Tab'); await expect(decision).not.toBeFocused();
  await page.screenshot({ path: test.info().outputPath('journal-influence.png') });
  await journal.getByRole('button', { name: /Trade ledger/ }).click();
  await expect(journal.getByRole('table', { name: 'Cumulative totals by goods' })).toContainText('Refined Fuel');
  await journal.getByRole('combobox', { name: 'Ledger station' }).selectOption('sol-city');
  await journal.getByRole('button', { name: /Manufacturing/ }).click();
  await journal.getByRole('searchbox', { name: 'Search manufacturing', exact: true }).fill('batteries');
  await journal.getByRole('button', { name: 'Refined Fuel to Batteries method' }).click();
  const ceres = journal.getByRole('article').filter({ has: page.getByText('Ceres Power Plant', { exact: true }) });
  await expect(ceres).toContainText('Refined Fuel'); await ceres.getByRole('button', { name: 'Track station', exact: true }).click();
  await page.screenshot({ path: test.info().outputPath('journal-manufacturing.png') });
  await journal.getByRole('button', { name: /Market observatory/ }).click();
  const prices = journal.getByRole('figure', { name: 'Historical board prices' });
  await expect(prices.locator('polyline')).toHaveCount(2);
  await prices.getByRole('img', { name: /Buy from station: 0:30/ }).focus();
  await expect(prices.getByRole('status')).toContainText('150 cr');
  await page.screenshot({ path: test.info().outputPath('journal-prices.png') });
  await journal.getByRole('button', { name: /World chronicle/ }).click();
  await expect(journal.getByRole('region', { name: 'World history' })).toContainText('Drydock work stoppage');
  await page.setViewportSize({ width: 640, height: 900 });
  expect(await journal.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.screenshot({ path: test.info().outputPath('journal-narrow.png') });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: /tab market Market/ }).click();
  await page.keyboard.press('q');
  const ignite = () => page.evaluate(async () => {
    const path = '/src/state/store.ts', weapons = '/src/systems/combat/weapon_systems.ts'; const store = (await import(path)).useGameStore, s = store.getState();
    const shot = (await import(weapons)).createProjectile({ ...s.ship.weapon, damage: 15 }, [s.ship.position[0] + 20, s.ship.position[1], s.ship.position[2]], [0, 0, 0], s.ship.position, 'test-fire-source', 'npc');
    store.setState({ ship: { ...s.ship, hp: 40 }, projectiles: [...s.projectiles, shot] });
  });
  const shipData = () => page.evaluate(async () => { const path = '/src/state/store.ts'; return (await import(path)).useGameStore.getState().ship; });
  await ignite(); await expect.poll(async () => (await shipData()).onFire).toBe(true);
  await expect(page.getByRole('alert').filter({ hasText: 'FIRE ALERT' }).first()).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('ship-fire-alert.png') });
  await page.keyboard.press('e'); await expect.poll(async () => (await shipData()).onFire).toBe(false);
  expect((await shipData()).hp).toBeLessThan(30); // Extinguishing is free, not a free repair.
  await page.getByRole('button', { name: /Enter Station/ }).click();
  await page.evaluate(async () => {
    const path = '/src/state/store.ts'; const store = (await import(path)).useGameStore; store.getState().undock(); const s = store.getState(), st = s.stations.find((st: any) => st.id === 'drydock');
    store.setState({ ship: { ...s.ship, position: [...st.position], velocity: [0, 0, 0] } }); store.getState().tryDock('drydock');
  });
  await page.getByRole('button', { name: /Enter Station/ }).click();
  await page.getByRole('button', { name: /^Repair ship \(/ }).click();
  expect((await shipData()).hp).toBe((await shipData()).maxHp);
  await page.getByRole('button', { name: /^Install suppression \(/ }).click();
  await expect(page.getByRole('button', { name: 'Suppression installed', exact: true })).toBeDisabled();
  await page.screenshot({ path: test.info().outputPath('shipyard-safety.png') });
  await page.keyboard.press('q'); await ignite();
  await expect.poll(async () => (await shipData()).onFire).toBe(true);
  await expect.poll(async () => (await shipData()).onFire, { timeout: 20000 }).toBe(false);
  expect((await shipData()).hp).toBeGreaterThan(22);
  await page.keyboard.press('e'); await page.getByRole('button', { name: /Enter Station/ }).click();
  await page.getByRole('button', { name: 'Pause (P)', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload(); await page.getByRole('button', { name: 'Load saved campaign', exact: true }).click();
  expect((await shipData()).hasFireSuppression).toBe(true);
  await page.getByRole('button', { name: /tab journal Journal/ }).click();
  await journal.getByRole('button', { name: /Ship & systems/ }).click();
  await expect(journal.getByRole('region', { name: 'Engineering history' })).toContainText('Fire suppression: installed');
  expect(errors).toEqual([]);
});
