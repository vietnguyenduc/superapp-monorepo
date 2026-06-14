import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

await page.goto('http://localhost:5175/', { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(3000);

// Get body text
const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
console.log('=== BODY TEXT ===');
console.log(bodyText);

// Get all interactive elements
const elements = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('button, a, [role="button"], span, div[onclick]')).map(el => ({
    tag: el.tagName,
    text: (el.textContent || '').trim().substring(0, 80),
    visible: el.offsetParent !== null,
    rect: el.getBoundingClientRect ? JSON.stringify({ w: el.offsetWidth, h: el.offsetHeight, x: el.offsetLeft, y: el.offsetTop }) : ''
  })).filter(e => e.visible && e.text.length > 0);
});
console.log('=== VISIBLE ELEMENTS ===');
elements.forEach((e, i) => console.log(i, e.tag, JSON.stringify(e.text), e.rect));

await browser.close();
