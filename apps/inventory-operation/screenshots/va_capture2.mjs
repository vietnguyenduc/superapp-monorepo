import { chromium } from 'playwright';

const URLS = [
  { name: 'login',           url: 'http://localhost:5175/' },
  { name: 'dashboard',       url: 'http://localhost:5175/dashboard' },
  { name: 'product-catalog', url: 'http://localhost:5175/product-catalog' },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  // Step 1: Login first
  console.log('🔑 Logging in...');
  await page.goto('http://localhost:5175/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  // Try all possible trial button selectors
  const selectors = [
    'button:has-text("Dùng thử")',
    'button:has-text("dùng thử")',
    'text=Dùng thử',
    'button:has-text("Trial")',
    'button:has-text("trial")',
    'a:has-text("Dùng thử")',
  ];
  
  let clicked = false;
  for (const sel of selectors) {
    const btn = page.locator(sel);
    const count = await btn.count();
    if (count > 0) {
      console.log(`  Clicking: ${sel} (${count} found)`);
      await btn.first().click();
      await page.waitForTimeout(3000);
      clicked = true;
      break;
    }
  }
  
  if (!clicked) {
    // Last resort: click any button that contains "thử"
    const allBtns = page.locator('button');
    const count = await allBtns.count();
    console.log(`  No trial button found. ${count} buttons total.`);
    for (let i = 0; i < count; i++) {
      const text = await allBtns.nth(i).textContent();
      console.log(`  Button ${i}: "${text?.trim()}"`);
    }
  }
  
  console.log(`  Current URL: ${page.url()}`);
  
  // Step 2: Screenshot each page
  for (const { name, url } of URLS) {
    console.log(`\n📸 ${name}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: `screenshots/va-${name}.png`, fullPage: true });
    
    const fs = await import('fs');
    const stat = fs.statSync(`screenshots/va-${name}.png`);
    console.log(`  Size: ${(stat.size / 1024).toFixed(1)}KB | URL: ${page.url()}`);
    
    // Check console errors
    const errors = await page.evaluate(() => {
      return window.__capturedErrors || [];
    }).catch(() => []);
    if (errors.length > 0) {
      console.log(`  Console errors: ${errors.length}`);
    }
  }
  
  await browser.close();
  console.log('\n✅ Done!');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
