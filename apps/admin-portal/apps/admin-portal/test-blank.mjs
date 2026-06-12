import { chromium } from 'playwright';

const URL = process.env.TEST_URL || 'http://localhost:3002';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Collect all console messages
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    logs.push(`[PAGE_ERROR] ${err.message}`);
  });

  console.log(`Navigating to ${URL}...`);
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });

  // Wait a bit for JS to execute
  await page.waitForTimeout(3000);

  // Take screenshot for visual check
  await page.screenshot({ path: 'test-blank-screenshot.png', fullPage: true });

  // Get page content
  const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500));
  const htmlSnippet = await page.evaluate(() => document.documentElement?.innerHTML?.substring(0, 1000));

  console.log('\n=== SCREENSHOT SAVED: test-blank-screenshot.png ===');
  console.log('\n=== BODY TEXT (first 500 chars) ===');
  console.log(bodyText || '(empty)');
  console.log('\n=== HTML SNIPPET (first 1000 chars) ===');
  console.log(htmlSnippet || '(empty)');
  console.log('\n=== CONSOLE LOGS (' + logs.length + ' entries) ===');
  logs.forEach(l => console.log(l));

  await browser.close();
})();
