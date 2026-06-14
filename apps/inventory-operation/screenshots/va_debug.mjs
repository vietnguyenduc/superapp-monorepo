import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  // Capture console logs
  page.on('console', msg => console.log(`[CONSOLE.${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => console.log(`[PAGE ERROR] ${err.message}`));
  
  // Login
  await page.goto('http://localhost:5175/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  const trialBtn = page.locator('button:has-text("Dùng thử")');
  await trialBtn.first().click();
  await page.waitForTimeout(3000);
  console.log(`After login: ${page.url()}`);
  
  // Navigate to product-catalog
  console.log('\n--- Navigating to /product-catalog ---');
  await page.goto('http://localhost:5175/product-catalog', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(3000);
  console.log(`Final URL: ${page.url()}`);
  console.log(`Title: ${await page.title()}`);
  
  // Check body content
  const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500) || 'NO BODY');
  console.log(`Body text: ${bodyText}`);
  
  await page.screenshot({ path: 'screenshots/va-debug-pc.png', fullPage: true });
  const fs = await import('fs');
  const stat = fs.statSync('screenshots/va-debug-pc.png');
  console.log(`Screenshot: ${(stat.size / 1024).toFixed(1)}KB`);
  
  await browser.close();
}

main().catch(err => console.error('Fatal:', err.message));
