import { chromium } from 'playwright';

async function checkConsole() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER PAGEERROR:', err.message, err.stack));
  page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));
  page.on('response', res => {
    if (res.status() >= 400) console.log('HTTP ERROR:', res.status(), res.url());
  });

  console.log('Navigating to http://localhost:4321/editor/ ...');
  try {
    await page.goto('http://localhost:4321/editor/', { waitUntil: 'networkidle', timeout: 15000 });
  } catch (e) {
    console.log('Navigation timeout/error:', e.message);
  }

  const html = await page.content();
  console.log('Page content length:', html.length);
  const bodyText = await page.innerText('body');
  console.log('Body innerText:', bodyText);

  await browser.close();
}

checkConsole().catch(console.error);
