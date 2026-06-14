import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/SuperApp|Dashboard|Home/);
  });

  test('navigation links are present', async ({ page }) => {
    await page.goto('/');
    // Check that the page has navigation elements
    const nav = page.locator('nav, header, [role="navigation"]');
    await expect(nav).toBeVisible();
  });
});

test.describe('Sales Operation', () => {
  test('sales dashboard loads', async ({ page }) => {
    await page.goto('/sales');
    await expect(page).toHaveURL(/\/sales/);
    await expect(page.locator('body')).not.toHaveText('Error');
  });
});

test.describe('Inventory Operation', () => {
  test('inventory dashboard loads', async ({ page }) => {
    await page.goto('/inventory');
    await expect(page).toHaveURL(/\/inventory/);
    await expect(page.locator('body')).not.toHaveText('Error');
  });
});

test.describe('Accounting', () => {
  test('accounting dashboard loads', async ({ page }) => {
    await page.goto('/accounting');
    await expect(page).toHaveURL(/\/accounting/);
    await expect(page.locator('body')).not.toHaveText('Error');
  });
});

test.describe('Cashflow', () => {
  test('cashflow dashboard loads', async ({ page }) => {
    await page.goto('/cashflow');
    await expect(page).toHaveURL(/\/cashflow/);
    await expect(page.locator('body')).not.toHaveText('Error');
  });
});

test.describe('Operations Portal', () => {
  test('operations portal loads', async ({ page }) => {
    await page.goto('/operations');
    await expect(page).toHaveURL(/\/operations/);
    await expect(page.locator('body')).not.toHaveText('Error');
  });
});

test.describe('HR Operation', () => {
  test('HR dashboard loads', async ({ page }) => {
    await page.goto('/hr');
    await expect(page).toHaveURL(/\/hr/);
    await expect(page.locator('body')).not.toHaveText('Error');
  });
});

test.describe('Admin Portal', () => {
  test('admin portal loads', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('body')).not.toHaveText('Error');
  });
});
