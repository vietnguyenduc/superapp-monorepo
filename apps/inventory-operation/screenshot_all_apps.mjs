import { chromium } from 'playwright';

const APPS = [
  { name: 'sales-operation', port: 5176, pages: ['/', '/dashboard', '/products'] },
  { name: 'cashflow', port: 5177, pages: ['/', '/dashboard', '/transactions'] },
  { name: 'accounting', port: 5178, pages: ['/', '/dashboard', '/ledger'] },
  { name: 'operations-portal', port: 5179, pages: ['/', '/dashboard', '/operations'] },
  { name: 'hr-operation', port: 5180, pages: ['/', '/dashboard', '/employees'] },
  { name: 'admin-portal', port: 5181, pages: ['/', '/dashboard', '/users'] },
];

const SCREENSHOT_DIR = 'C:\\Vibecoding\\superapp-monorepo\\apps\\inventory-operation\\screenshots';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const app of APPS) {
    console.log(`\n=== ${app.name} (port ${app.port}) ===`);
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    for (const route of app.pages) {
      const url = `http://localhost:${app.port}${route}`;
      const filename = `${SCREENSHOT_DIR}\\va-${app.name}${route.replace(/\//g, '-') || '-home'}.png`;
      
      try {
        console.log(`  Navigating to ${url}...`);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(2000);
        
        // Try clicking "Dùng thử" or "Login" button if present
        const trialBtn = page.locator('text=Dùng thử').first();
        if (await trialBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('  Clicking "Dùng thử"...');
          await trialBtn.click();
          await page.waitForTimeout(3000);
        }
        
        await page.screenshot({ path: filename, fullPage: false });
        const stats = await page.evaluate(() => ({
          title: document.title,
          url: window.location.href,
          bodySize: document.body?.innerHTML?.length || 0,
        }));
        
        console.log(`  ✅ ${route} → ${filename} (${stats.title})`);
        results.push({ app: app.name, route, url: stats.url, title: stats.title, status: 'OK' });
      } catch (err) {
        console.log(`  ❌ ${route} → ${err.message}`);
        results.push({ app: app.name, route, url, title: 'ERROR', status: `FAIL: ${err.message}` });
      }
    }
    
    await context.close();
  }

  await browser.close();

  console.log('\n\n=== RESULTS SUMMARY ===');
  console.table(results);
  
  // Write results to JSON
  const fs = await import('fs');
  fs.writeFileSync(`${SCREENSHOT_DIR}\\uiux-results.json`, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${SCREENSHOT_DIR}\\uiux-results.json`);
}

main().catch(console.error);
