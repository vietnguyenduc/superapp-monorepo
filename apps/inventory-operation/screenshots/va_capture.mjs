import { chromium } from 'playwright';

const URLS = [
  'http://localhost:5175/',
  'http://localhost:5175/dashboard',
  'http://localhost:5175/product-catalog'
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  for (const url of URLS) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      
      // Try clicking "Dùng thử" on login page
      const trialBtn = page.locator('button:has-text("Dùng thử")');
      const trialCount = await trialBtn.count();
      if (trialCount > 0) {
        await trialBtn.first().click();
        await page.waitForTimeout(3000);
      }
      
      const name = url.replace('http://localhost:5175/', '').replace(/\//g, '-') || 'login';
      await page.screenshot({ path: `screenshots/va-${name}.png`, fullPage: true });
      
      const fs = await import('fs');
      const stat = fs.statSync(`screenshots/va-${name}.png`);
      console.log(`✅ ${name}: ${(stat.size / 1024).toFixed(1)}KB | URL: ${page.url()}`);
    } catch (err) {
      console.log(`❌ ${url}: ${err.message}`);
    }
    
    await page.close();
  }
  
  await browser.close();
}

main();
