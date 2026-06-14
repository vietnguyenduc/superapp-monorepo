import { chromium } from 'playwright';

const URLS = [
  { name: 'login',           url: 'http://localhost:5175/' },
  { name: 'dashboard',       url: 'http://localhost:5175/dashboard' },
  { name: 'product-catalog', url: 'http://localhost:5175/product-management' },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  // Login
  console.log('🔑 Logging in...');
  await page.goto('http://localhost:5175/', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  
  const trialBtn = page.locator('button:has-text("Dùng thử")');
  await trialBtn.first().click();
  await page.waitForTimeout(3000);
  console.log(`  Logged in: ${page.url()}`);
  
  // Screenshot each page
  for (const { name, url } of URLS) {
    console.log(`\n📸 ${name}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: `screenshots/va-${name}.png`, fullPage: true });
    
    const fs = await import('fs');
    const stat = fs.statSync(`screenshots/va-${name}.png`);
    console.log(`  Size: ${(stat.size / 1024).toFixed(1)}KB | URL: ${page.url()}`);
  }
  
  await browser.close();
  console.log('\n✅ Done!');
}

main().catch(err => console.error('Fatal:', err.message));
