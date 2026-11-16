import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, browser, problems, site } from './support/context.mjs';

// The demo's Type page (demo/src/content/pages/type.md, demo/public/demo-type.js): only the demo has it, so a built site that is not the demo
// has nothing to check. Each of the 16 type styles (Material 3's 15 roles and the lead) is shown with its class name and the size, line
// height, tracking and weight read from its computed style.
const STYLES = [
  'display-large',
  'display-medium',
  'display-small',
  'headline-large',
  'headline-medium',
  'headline-small',
  'title-large',
  'lead',
  'title-medium',
  'title-small',
  'body-large',
  'body-medium',
  'body-small',
  'label-large',
  'label-medium',
  'label-small',
];

/** Every style on the page has the size, line height, weight and tracking of its token, and the line under it says the same and names the class. */
async function checkTypePage(width, height) {
  const label = `${width}px Type page`;
  const tab = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  tab.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await tab.goto(`${site}/type/`, { waitUntil: 'networkidle' });
  const found = await tab.evaluate((styles) => {
    // What a token is as the browser computes it: a probe that reads the four tokens of a style, in px.
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden';
    document.body.append(probe);
    const px = (value) => `${Math.round(parseFloat(value) * 100) / 100} px`;
    const rows = styles.map((name) => {
      const sample = document.querySelector(`[data-type-sample="type-${name}"]`);
      const spec = document.querySelector(`[data-type-spec="type-${name}"]`);
      if (!sample || !spec) return { name, missing: true };
      probe.style.cssText = `position:absolute;visibility:hidden;font-size:var(--type-${name}-size);line-height:var(--type-${name}-line-height);font-weight:var(--type-${name}-weight);letter-spacing:var(--type-${name}-tracking)`;
      const token = getComputedStyle(probe);
      const own = getComputedStyle(sample);
      const tracking = own.letterSpacing === 'normal' ? '0 px' : px(own.letterSpacing);
      return {
        name,
        classed: sample.classList.contains(`type-${name}`),
        size: [own.fontSize, token.fontSize],
        lineHeight: [own.lineHeight, token.lineHeight],
        weight: [own.fontWeight, token.fontWeight],
        tracking: [own.letterSpacing, token.letterSpacing],
        shown: spec.textContent,
        want: `.type-${name} Size ${px(own.fontSize)} · line height ${px(own.lineHeight)} · tracking ${tracking} · weight ${own.fontWeight}`,
        visible: sample.checkVisibility() && spec.checkVisibility(),
        overflow: sample.scrollWidth > sample.clientWidth + 1,
      };
    });
    probe.remove();
    return { rows, samples: document.querySelectorAll('[data-type-sample]').length, page: document.documentElement.scrollWidth };
  }, STYLES);
  for (const r of found.rows) {
    if (r.missing) {
      problems.push(`${label}: no sample or line for type-${r.name}`);
      continue;
    }
    if (!r.classed) problems.push(`${label}: type-${r.name} sample does not have its class`);
    for (const key of ['size', 'lineHeight', 'weight', 'tracking'])
      if (r[key][0] !== r[key][1]) problems.push(`${label}: type-${r.name} ${key} is ${r[key][0]}, its token is ${r[key][1]}`);
    if (r.shown.replace(/\s+/g, ' ').trim() !== r.want)
      problems.push(`${label}: type-${r.name} line says "${r.shown}", expected "${r.want}"`);
    if (!r.visible) problems.push(`${label}: type-${r.name} is not visible`);
    if (r.overflow) problems.push(`${label}: type-${r.name} sample is wider than its box`);
  }
  if (found.samples !== STYLES.length) problems.push(`${label}: ${found.samples} samples, expected ${STYLES.length}`);
  if (found.page > width) problems.push(`${label}: the page scrolls sideways (${found.page} px in ${width})`);
  await tab.close();
}

export function register(unit) {
  if (!existsSync(join(DIST, 'type/index.html'))) return;
  for (const [width, height] of [
    [375, 740],
    [1280, 900],
  ])
    unit(`checkTypePage ${width}`, () => checkTypePage(width, height));
}
