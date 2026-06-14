import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const allLogs = [];
page.on('console', msg => allLogs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => allLogs.push(`[PAGE_ERROR] ${err.message}`));

await page.goto('http://localhost:5175/', { waitUntil: 'load', timeout: 20000 });
await page.waitForTimeout(5000);

// Check what's in root
const rootHtml = await page.evaluate(() => {
  const root = document.getElementById('root');
  return root ? root.innerHTML.substring(0, 2000) : 'NO ROOT';
});
console.log('=== ROOT HTML ===');
console.log(rootHtml);

// Check for errors
console.log('=== CONSOLE LOGS ===');
allLogs.forEach(l => console.log(l));

// Try clicking any button
const btnCount = await page.evaluate(() => document.querySelectorAll('button').length);
console.log('Button count:', btnCount);

await page.screenshot({ path: 'screenshots/inventory-operation/debug.png', fullPage: true });
const fs = await import('fs');
console.log('Screenshot size:', (fs.statSync('screenshots/inventory-operation/debug.png').size / 1024).toFixed(1), 'KB');

await browser.close();
