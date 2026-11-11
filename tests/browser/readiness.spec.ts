import { test, expect } from '@playwright/test';

// UI-only: also runs against the compiled production build. No store imports,
// arranged cargo/locations, developer starter, or accelerated simulation clock.
test('fresh tutorial flies the fuel route, trades, completes, and reloads a checkpoint', async ({ page }) => {
  test.setTimeout(240000);
  const errors: string[] = [], failedAssets: string[] = [], modelRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failedAssets.push(`${response.status()} ${response.url()}`); });
  page.on('request', request => { if (/\.glb(?:\?|$)/.test(request.url())) modelRequests.push(request.url()); });
  await page.addInitScript(() => localStorage.setItem('trader.graphics', 'low'));
  await page.route('https://**/*', route => route.abort());
  await page.goto('/');
  await page.getByRole('checkbox', { name: 'Start with tutorial' }).check();
  await page.getByRole('button', { name: 'Select Freighter', exact: true }).click();
  await expect(page.locator('canvas[data-engine]')).toBeVisible();
  await page.keyboard.press('e');
  await page.getByRole('button', { name: /Enter Station/ }).click();
  await page.getByRole('button', { name: /Missions/ }).click();
  // Tutorial generation replaces random offers with one explicit fuel contract.
  await page.getByRole('button', { name: 'ACCEPT', exact: true }).click();
  await expect(page.getByText(/Your waypoint now points to Helios Refinery/)).toBeVisible();
  await page.keyboard.press('q');
  await page.getByRole('button', { name: 'Waypoint pilot (T)', exact: true }).click();
  await page.getByRole('button', { name: /Enter Station/ }).click({ timeout: 90000 });
  await expect(page.getByText('HELIOS REFINERY', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Production/ }).click();
  await page.getByRole('spinbutton').fill('10');
  // The CSS grid has flat cells (commodity, price, stock, held, actions),
  // not semantic rows; scope the action to fuel rather than another product.
  const fuelActions = page.locator('.commodity-grid > div').filter({ has: page.getByText('refined fuel', { exact: true }) }).locator('xpath=following-sibling::div[4]');
  await fuelActions.getByRole('button', { name: 'BUY 10', exact: true }).click();
  await expect(page.getByText(/Undock and return to Sol City/)).toBeVisible();
  await page.keyboard.press('q');
  await page.getByRole('button', { name: 'Waypoint pilot (T)', exact: true }).click();
  await page.getByRole('button', { name: /Enter Station/ }).click({ timeout: 90000 });
  await expect(page.getByText('SOL CITY', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Civic Exchange/ }).click();
  await page.getByRole('spinbutton').fill('10');
  await fuelActions.getByRole('button', { name: 'SELL 10', exact: true }).click();
  await expect(page.getByText('Contract Completed!', { exact: true })).toBeVisible();
  await expect(page.getByText('Mission Reward: +$1,000', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText(/Tutorial complete! You've completed your first contract/)).toBeVisible();
  const creditText = () => page.getByText('CREDITS', { exact: true }).locator('..').innerText();
  const completedCredits = await creditText();
  expect(Number(completedCredits.replace(/[^0-9.-]/g, '')), 'A completed purchase order must actually pay its sale revenue, not only the bonus').toBeGreaterThanOrEqual(11000);
  await page.getByRole('button', { name: 'Pause (P)', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Load saved campaign', exact: true }).click();
  await expect(page.getByText('Paused — deadlines and simulation frozen.')).toBeVisible();
  await expect(page.getByText(/Tutorial complete! You've completed your first contract/)).toBeVisible();
  expect(await creditText()).toBe(completedCredits);
  await page.screenshot({ path: test.info().outputPath('tutorial-checkpoint.png') });
  await page.getByRole('button', { name: 'Close tutorial', exact: true }).click();
  await page.getByRole('button', { name: /tab journal Journal/ }).click();
  const journal = page.getByRole('region', { name: 'Commander journal' });
  await expect(journal.getByRole('heading', { name: 'Your system footprint', exact: true })).toBeVisible();
  const journalLayer = await journal.evaluate(el => Number(getComputedStyle(el.closest('.ui-overlay')!).zIndex));
  const worldLabelLayers = await page.locator('canvas[data-engine]').evaluate(canvas => [...canvas.parentElement!.parentElement!.querySelectorAll<HTMLElement>('div[style*="z-index"]')].map(el => Number(getComputedStyle(el).zIndex)).filter(Number.isFinite));
  expect(worldLabelLayers.length).toBeGreaterThan(0);
  expect(worldLabelLayers.every(layer => layer < journalLayer), 'Every scene label, including planet and belt names, must remain below the journal').toBe(true);
  await journal.getByRole('button', { name: /Trade ledger/ }).click();
  await expect(journal.getByRole('table', { name: 'Cumulative totals by goods' })).toContainText('Refined Fuel');
  await expect(journal.getByRole('table', { name: 'Cumulative totals by goods' })).toContainText('10 / 10');
  await journal.getByRole('button', { name: /Market observatory/ }).click();
  await expect(journal.getByRole('figure', { name: 'Historical board prices' })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('journal-checkpoint.png') });
  expect(errors).toEqual([]);
  expect(failedAssets).toEqual([]);
  expect(modelRequests, 'Compatibility mode must not download unused detailed models').toEqual([]);
});
