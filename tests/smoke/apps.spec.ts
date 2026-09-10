import { test, expect } from '@playwright/test';

const host = process.env.SMOKE_HOST || 'http://127.0.0.1';
const apps = [
  ['admin-portal', 5173], ['cashflow', 5174],
  ['inventory-operation', 5175], ['sales-operation', 5176],
  ['hr-operation', 5177], ['accounting', 5178],
  ['operations-portal', 3006],
] as const;

for (const [app, port] of apps) {
  test(`${app}: public entry renders without a JavaScript crash`, async ({ page }) => {
    const crashes: string[] = [];
    page.on('pageerror', error => crashes.push(error.message));
    const response = await page.goto(`${host}:${port}`, { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('#root')).toContainText(/\S/);
    // A usable entry screen needs an interactive control, not just a loading spinner.
    await expect(page.locator('button:visible, input:visible, a[href]:visible').first()).toBeVisible();
    await expect(page.locator('vite-error-overlay')).toHaveCount(0);
    expect(crashes).toEqual([]);
  });
}
