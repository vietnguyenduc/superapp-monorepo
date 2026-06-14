import { chromium } from 'playwright';
import { writeFileSync, existsSync, statSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const PORT = 5175;
const BASE = `http://localhost:${PORT}`;
const OUT = resolve('screenshots/inventory-operation');
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const PAGES = [
  { path: '/', name: '01-login' },
  { path: '/dashboard', name: '02-dashboard' },
  { path: '/product-management', name: '03-product-catalog' },
  { path: '/inventory-records', name: '04-inventory-records' },
  { path: '/purchase-orders', name: '05-purchase-orders' },
  { path: '/goods-receipts', name: '06-goods-receipts' },
  { path: '/supplier-management', name: '07-supplier-management' },
  { path: '/supplier-returns', name: '08-supplier-returns' },
  { path: '/inventory-mrp', name: '09-inventory-mrp' },
  { path: '/settings', name: '10-settings' },
  { path: '/profile', name: '11-profile' },
  { path: '/help', name: '12-help' },
];

const VIEWPORTS = [
  { w: 1440, h: 900, label: 'desktop' },
  { w: 390, h: 844, label: 'mobile' },
];

async function loginTrial(page) {
  // Navigate to login page
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);

  // Try multiple selectors for the trial button
  const selectors = [
    'button:has-text("Dùng thử")',
    'text=Dùng thử ngay',
    'button:has-text("Dùng thử ngay")',
    'text=Dùng thử',
    'button:contains("Dùng thử")',
    'span:has-text("Dùng thử")',
  ];

  for (const sel of selectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log(`  ✅ Found trial button: "${sel}"`);
      await btn.click();
      await page.waitForTimeout(3000);
      return true;
    }
  }

  // Fallback: find button containing "Dùng thử" text
  const allButtons = page.locator('button');
  const count = await allButtons.count();
  for (let i = 0; i < count; i++) {
    const text = await allButtons.nth(i).textContent().catch(() => '');
    if (text.includes('Dùng thử') || text.includes('dùng thử')) {
      console.log(`  ✅ Found trial button at index ${i}: "${text.trim()}"`);
      await allButtons.nth(i).click();
      await page.waitForTimeout(3000);
      return true;
    }
  }

  console.log('  ⚠️ No trial button found');
  return false;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  let loggedIn = false;
  const stats = [];

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();
    const consoleErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    // Login once per viewport
    if (!loggedIn) {
      loggedIn = await loginTrial(page);
    }

    for (const p of PAGES) {
      const filePath = resolve(OUT, `${p.name}-${vp.label}.png`);
      try {
        await page.goto(BASE + p.path, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(1500);

        await page.screenshot({ path: filePath, fullPage: true });
        const size = statSync(filePath).size;
        const status = size > 15000 ? 'OK' : (size > 5000 ? 'SMALL' : 'BLANK');
        stats.push({ page: `${p.name}-${vp.label}`, status, size: `${(size/1024).toFixed(1)}KB`, errors: consoleErrors.length });
        console.log(`  ${status === 'OK' ? '✅' : '⚠️'} ${p.name}-${vp.label}: ${(size/1024).toFixed(1)}KB (${consoleErrors.length} errors)`);
      } catch (e) {
        stats.push({ page: `${p.name}-${vp.label}`, status: 'FAIL', error: e.message });
        console.log(`  ❌ ${p.name}-${vp.label}: ${e.message}`);
      }
    }

    await ctx.close();
  }

  await browser.close();

  const summary = {
    timestamp: new Date().toISOString(),
    total: stats.length,
    passed: stats.filter(s => s.status === 'OK').length,
    small: stats.filter(s => s.status === 'SMALL').length,
    blank: stats.filter(s => s.status === 'BLANK').length,
    failed: stats.filter(s => s.status === 'FAIL').length,
    results: stats,
  };
  writeFileSync(resolve(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log('\n📊 Summary:', JSON.stringify(summary, null, 2));
}

run().catch(console.error);
