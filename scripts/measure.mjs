import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:4321/editor/#ny/blog', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const data = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('section[aria-labelledby]'));
    return sections.map((sec, i) => {
      const btn = sec.querySelector('button');
      const secRect = sec.getBoundingClientRect();
      const btnRect = btn ? btn.getBoundingClientRect() : null;
      const secStyle = window.getComputedStyle(sec);
      const btnStyle = btn ? window.getComputedStyle(btn) : null;
      return {
        index: i,
        id: sec.getAttribute('aria-labelledby'),
        secTop: secRect.top,
        secBottom: secRect.bottom,
        secHeight: secRect.height,
        secMarginTop: secStyle.marginTop,
        secMarginBottom: secStyle.marginBottom,
        secPaddingTop: secStyle.paddingTop,
        secPaddingBottom: secStyle.paddingBottom,
        btnTop: btnRect ? btnRect.top : null,
        btnBottom: btnRect ? btnRect.bottom : null,
        btnHeight: btnRect ? btnRect.height : null,
        btnMarginTop: btnStyle ? btnStyle.marginTop : null,
        btnMarginBottom: btnStyle ? btnStyle.marginBottom : null,
        btnPaddingTop: btnStyle ? btnStyle.paddingTop : null,
        btnPaddingBottom: btnStyle ? btnStyle.paddingBottom : null,
      };
    });
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
}

main().catch(console.error);
