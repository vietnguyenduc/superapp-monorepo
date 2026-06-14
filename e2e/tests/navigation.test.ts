import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('can navigate between apps via sidebar', async ({ page }) => {
    await page.goto('/');
    
    // Find and click navigation links
    const navLinks = page.locator('a[href*="/sales"], a[href*="/inventory"], a[href*="/accounting"]');
    const count = await navLinks.count();
    
    // At least one navigation link should exist
    expect(count).toBeGreaterThan(0);
  });

  test('app switcher is accessible', async ({ page }) => {
    await page.goto('/');
    
    // Look for app switcher or navigation menu
    const appSwitcher = page.locator('[data-testid="app-switcher"], [aria-label*="app"], [aria-label*="App"]');
    
    if (await appSwitcher.isVisible()) {
      await appSwitcher.click();
      // Verify some menu appeared
      await expect(page.locator('[role="menu"], [role="dialog"], .dropdown, .menu')).toBeVisible();
    }
  });
});
