import { chromium } from 'playwright-core';
import { writeFileSync, statSync } from 'fs';

const BASE = 'http://localhost:5175';
const PAGES = [
  '/',
  '/dashboard',
  '/product-management',
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  
  for (const viewport of [{ w: 1440, h: 900, name: 'desktop' }, { w: 390, h: 844, name: 'mobile' }]) {
    const context = await browser.newContext({ viewport: { width: viewport.w, height: viewport.h } });
    const page = await context.newPage();
    
    // Login first
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2000);
    
    // Try clicking trial button
    try {
      const btn = await page.locator('button:has-text("Dùng thử")');
      if (await btn.count() > 0) {
        await btn.click();
        console.log('Clicked trial button');
        await page.waitForTimeout(4000);
      }
    } catch(e) { console.log('No trial button found'); }
    
    for (const path of PAGES) {
      const url = BASE + path;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      } catch(e) {
        console.log(`Timeout loading ${path}, continuing...`);
      }
      await page.waitForTimeout(2000);
      
      const filename = `screenshots/va-${path.replace(/\//g, '') || 'home'}-${viewport.name}.png`;
      await page.screenshot({ path: filename, fullPage: true });
      const size = statSync(filename).size;
      console.log(`${path} (${viewport.name}): ${(size/1024).toFixed(1)}KB`);
    }
    
    await context.close();
  }
  
  await browser.close();
  console.log('Visual audit complete');
}

run().catch(console.error);
