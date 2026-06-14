﻿﻿﻿﻿import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'inventory-operation');
mkdirSync(OUT_DIR, { recursive: true });

const BASE = 'http://localhost:5175';

const ROUTES = [
  { name: '01-login', path: '/' },
  { name: '02-dashboard', path: '/dashboard' },
  { name: '03-product-catalog', path: '/product-management' },
  { name: '04-inventory-records', path: '/inventory-records' },
  { name: '05-purchase-orders', path: '/purchase-orders' },
  { name: '06-goods-receipts', path: '/goods-receipts' },
  { name: '07-supplier-management', path: '/supplier-management' },
  { name: '08-supplier-returns', path: '/supplier-returns' },
  { name: '09-inventory-mrp', path: '/inventory-mrp' },
  { name: '10-settings', path: '/settings' },
  { name: '11-profile', path: '/profile' },
  { name: '12-help', path: '/help' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const allConsole = [];

  for (const route of ROUTES) {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({ viewport: vp });
      const page = await context.newPage();
      const consoleLogs = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleLogs.push(`[${vp.name}] ${route.path}: ${msg.text()}`);
        }
      });

      try {
        const url = BASE + route.path;
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(2000);

        // If login page, click trial button using multiple selectors
        if (route.path === '/') {
          const trialSelectors = [
            'text=Dùng thử',
            'button:has-text("Dùng thử")',
            'a:has-text("Dùng thử")',
            'span:has-text("Dùng thử")',
            'text=Dùng thử ngay',
            'button:has-text("Dùng thử ngay")',
            '[class*="trial"]',
            '[class*="demo"]',
          ];

          let clicked = false;
          for (const sel of trialSelectors) {
            const btn = page.locator(sel).first();
            if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
              console.log(`  🔍 Found trial button with selector: ${sel}`);
              await btn.click();
              await page.waitForTimeout(3000);
              clicked = true;
              break;
            }
          }

          if (!clicked) {
            // Last resort: try to find any button/link that contains "thử" or "trial"
            const allButtons = page.locator('button, a, [role="button"]');
            const count = await allButtons.count();
            for (let i = 0; i < count; i++) {
              const text = await allButtons.nth(i).textContent().catch(() => '');
              if (text.toLowerCase().includes('thử') || text.toLowerCase().includes('trial') || text.toLowerCase().includes('demo')) {
                console.log(`  🔍 Found trial element #${i}: "${text.trim()}"`);
                await allButtons.nth(i).click();
                await page.waitForTimeout(3000);
                clicked = true;
                break;
              }
            }
          }

          if (clicked) {
            // Wait for navigation to dashboard
            await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
              console.log('  ⚠️ Did not navigate to /dashboard, continuing...');
            });
            await page.waitForTimeout(2000);
          } else {
            console.log('  ⚠️ Could not find trial button, taking screenshot of login page');
          }
        }

        const filename = `${route.name}-${vp.name}.png`;
        const filepath = join(OUT_DIR, filename);
        await page.screenshot({ path: filepath, fullPage: true });

        const stats = await page.evaluate(() => ({
          title: document.title,
          scrollHeight: document.documentElement.scrollHeight,
          bodyChildCount: document.body?.children?.length || 0,
          currentUrl: window.location.href,
        }));

        results.push({
          route: route.path,
          viewport: vp.name,
          filename,
          title: stats.title,
          currentUrl: stats.currentUrl,
          scrollHeight: stats.scrollHeight,
          bodyChildren: stats.bodyChildCount,
          consoleErrors: consoleLogs.length,
        });

        allConsole.push(...consoleLogs);
        console.log(`✅ ${filename} — ${stats.title} (${vp.name}, url=${stats.currentUrl}, h=${stats.scrollHeight}px)`);
      } catch (err) {
        console.error(`❌ ${route.name}-${vp.name}: ${err.message}`);
        results.push({
          route: route.path,
          viewport: vp.name,
          filename: `${route.name}-${vp.name}.png`,
          error: err.message,
        });
      } finally {
        await context.close();
      }
    }
  }

  // Save summary
  const summary = {
    date: new Date().toISOString(),
    total: results.length,
    passed: results.filter(r => !r.error).length,
    failed: results.filter(r => r.error).length,
    results,
  };
  writeFileSync(join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
  writeFileSync(join(OUT_DIR, 'console.log'), allConsole.join('\n'));

  console.log(`\n📊 Total: ${summary.passed}/${summary.total} passed`);
  if (allConsole.length > 0) {
    console.log(`\n🔴 Console Errors (${allConsole.length}):`);
    allConsole.forEach(l => console.log(`  ${l}`));
  }

  await browser.close();
}

capture().catch(console.error);
