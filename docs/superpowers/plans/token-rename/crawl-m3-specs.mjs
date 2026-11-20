// Crawl one M3 component's specs page: every token set of the (non-deprecated) token module, collecting md.comp names.
// usage: node m3crawl.mjs <slug> <out.json>   (slug as in https://m3.material.io/components/<slug>/specs)
import { createRequire } from 'module';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const slug = process.argv[2];
const out = process.argv[3];
const url = `https://m3.material.io/components/${slug}/specs`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1400 } });
const result = { slug, url, sets: {}, deprecated: [], errors: [] };
try {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);
  const names = () =>
    page.evaluate(() => {
      const found = new Set();
      const walk = (n) => {
        if (n.nodeType === 3) {
          const t = n.textContent.trim();
          if (/^md\.comp\./.test(t)) found.add(t);
        }
        if (n.shadowRoot) walk(n.shadowRoot);
        for (const c of n.childNodes) walk(c);
      };
      walk(document.body);
      return [...found];
    });
  const expandAll = async () => {
    for (const b of await page.$$('button')) {
      const text = (await b.innerText().catch(() => '')).trim();
      if (text === 'expand_all') {
        await b.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(700);
      }
    }
  };
  const triggers = () => page.$$('button.mat-mdc-menu-trigger');
  const label = async (b) => ((await b.innerText().catch(() => '')) || '').replace(/arrow_drop_down/g, '').trim();
  const count = (await triggers()).length;
  for (let i = 0; i < count; i++) {
    const trig = (await triggers())[i];
    if (!trig) continue;
    const first = await label(trig);
    if (/^\[Deprecated\]/.test(first)) {
      result.deprecated.push(first);
      continue;
    }
    await trig.click({ timeout: 5000 }).catch((e) => result.errors.push('open ' + String(e).slice(0, 60)));
    await page.waitForTimeout(600);
    const items = await page.$$eval('.token-set-option', (els) => els.map((e) => e.innerText.trim()).filter(Boolean));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    for (const item of items) {
      if (/^\[Deprecated\]/.test(item)) {
        result.deprecated.push(item);
        continue;
      }
      const t2 = (await triggers())[i];
      await t2.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(500);
      const target = page
        .locator('.token-set-option', { hasText: new RegExp('^' + item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') })
        .first();
      await target.click({ timeout: 5000 }).catch((e) => result.errors.push('item ' + item + ' ' + String(e).slice(0, 60)));
      await page.waitForTimeout(1200);
      await expandAll();
      result.sets[item] = (await names()).filter((n) => !/^md\.comp\.[a-z-]+-(button|card|chip)\./.test(n) || true);
    }
  }
  if (!count) result.errors.push('no token module menu found');
} catch (e) {
  result.errors.push(String(e).slice(0, 200));
}
await browser.close();
fs.writeFileSync(out, JSON.stringify(result, null, 1));
console.log(
  slug,
  Object.entries(result.sets)
    .map(([k, v]) => `${k}:${v.length}`)
    .join(' | '),
  'errors:',
  result.errors.length,
  'deprecated:',
  result.deprecated.length,
);
