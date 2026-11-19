import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, browser, problems, site } from './support/context.mjs';

// The demo's Typography page (demo/src/content/pages/typography.md, demo/public/demo-type.js): only the demo has it, so a built site that is not the demo
// has nothing to check. Each of the 16 type styles (Material 3's 15 roles and the lead) is shown with its class name and the size, line
// height, tracking and weight read from its computed style; then the three text lists (bullet, numbered, check) the same way.
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
  const label = `${width}px Typography page, type styles`;
  const tab = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  tab.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await tab.goto(`${site}/typography/`, { waitUntil: 'networkidle' });
  const found = await tab.evaluate((styles) => {
    // What a token is as the browser computes it: a probe that reads the four tokens of a style, in px.
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden';
    document.body.append(probe);
    const px = (value) => `${Math.round(parseFloat(value) * 100) / 100} px`;
    const rows = styles.map((name) => {
      const sample = document.querySelector(`[data-type-sample="mo-type-${name}"]`);
      const spec = document.querySelector(`[data-type-spec="mo-type-${name}"]`);
      if (!sample || !spec) return { name, missing: true };
      probe.style.cssText = `position:absolute;visibility:hidden;font-size:var(--mo-sys-typescale-${name}-size);line-height:var(--mo-sys-typescale-${name}-line-height);font-weight:var(--mo-sys-typescale-${name}-weight);letter-spacing:var(--mo-sys-typescale-${name}-tracking)`;
      const token = getComputedStyle(probe);
      const own = getComputedStyle(sample);
      const tracking = own.letterSpacing === 'normal' ? '0 px' : px(own.letterSpacing);
      return {
        name,
        classed: sample.classList.contains(`mo-type-${name}`),
        size: [own.fontSize, token.fontSize],
        lineHeight: [own.lineHeight, token.lineHeight],
        weight: [own.fontWeight, token.fontWeight],
        tracking: [own.letterSpacing, token.letterSpacing],
        shown: spec.textContent,
        want: `.mo-type-${name} Size ${px(own.fontSize)} · line height ${px(own.lineHeight)} · tracking ${tracking} · weight ${own.fontWeight}`,
        visible: sample.checkVisibility() && spec.checkVisibility(),
        overflow: sample.scrollWidth > sample.clientWidth + 1,
      };
    });
    probe.remove();
    return { rows, samples: document.querySelectorAll('[data-type-sample]').length, page: document.documentElement.scrollWidth };
  }, STYLES);
  for (const r of found.rows) {
    if (r.missing) {
      problems.push(`${label}: no sample or line for mo-type-${r.name}`);
      continue;
    }
    if (!r.classed) problems.push(`${label}: mo-type-${r.name} sample does not have its class`);
    for (const key of ['size', 'lineHeight', 'weight', 'tracking'])
      if (r[key][0] !== r[key][1]) problems.push(`${label}: mo-type-${r.name} ${key} is ${r[key][0]}, its token is ${r[key][1]}`);
    if (r.shown.replace(/\s+/g, ' ').trim() !== r.want)
      problems.push(`${label}: mo-type-${r.name} line says "${r.shown}", expected "${r.want}"`);
    if (!r.visible) problems.push(`${label}: mo-type-${r.name} is not visible`);
    if (r.overflow) problems.push(`${label}: mo-type-${r.name} sample is wider than its box`);
  }
  // The text lists: each list has its line, which says what the browser draws for the first item; the text is body medium (the prose size),
  // the list is indented, a nested list is inside the bullet and numbered ones, and a check is drawn in a colour that is not the text's.
  const lists = await tab.evaluate(() => {
    const px = (value) => `${Math.round(parseFloat(value) * 100) / 100} px`;
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:absolute;visibility:hidden;font-size:var(--mo-sys-typescale-body-medium-size);line-height:var(--mo-sys-typescale-body-medium-line-height);font-weight:var(--mo-sys-typescale-body-medium-weight)';
    document.body.append(probe);
    const token = getComputedStyle(probe);
    const rows = [...document.querySelectorAll('[data-type-list-spec]')].map((spec) => {
      const list = spec.previousElementSibling;
      const item = list?.querySelector('li');
      if (!item) return { name: spec.dataset.typeListSpec, missing: true };
      const own = getComputedStyle(item);
      const check = item.querySelector('input[type="checkbox"]');
      const tracking = own.letterSpacing === 'normal' ? '0 px' : px(own.letterSpacing);
      const marker = check ? getComputedStyle(check).backgroundColor : getComputedStyle(item, '::marker').color;
      const checks = [...list.querySelectorAll('input[type="checkbox"]')].map((c) => getComputedStyle(c).backgroundColor);
      return {
        name: spec.dataset.typeListSpec,
        tag: list.tagName,
        size: [own.fontSize, token.fontSize],
        lineHeight: [own.lineHeight, token.lineHeight],
        weight: [own.fontWeight, token.fontWeight],
        indent: parseFloat(getComputedStyle(list).paddingInlineStart),
        nested: !!list.querySelector('li > ul, li > ol'),
        want: `Size ${px(own.fontSize)} · line height ${px(own.lineHeight)} · tracking ${tracking} · weight ${own.fontWeight} · indent ${px(getComputedStyle(list).paddingInlineStart)} · item space ${px(own.marginTop)} · ${check ? 'check' : 'marker'} color ${marker}`,
        shown: spec.querySelector('[data-type-values]').textContent,
        marker,
        checked: checks[0],
        unchecked: checks.at(-1),
        visible: list.checkVisibility() && spec.checkVisibility(),
      };
    });
    probe.remove();
    return rows;
  });
  const wantLists = { bullet: 'UL', numbered: 'OL', checklist: 'UL' };
  for (const name of Object.keys(wantLists))
    if (!lists.some((l) => l.name === name)) problems.push(`${label}: no ${name} list on the page`);
  for (const l of lists) {
    const at = `${label}: ${l.name} list`;
    if (l.missing) {
      problems.push(`${at} has no item`);
      continue;
    }
    if (l.tag !== wantLists[l.name]) problems.push(`${at} is a ${l.tag}`);
    for (const key of ['size', 'lineHeight', 'weight'])
      if (l[key][0] !== l[key][1]) problems.push(`${at} ${key} is ${l[key][0]}, body medium is ${l[key][1]}`);
    if (l.shown.replace(/\s+/g, ' ').trim() !== l.want) problems.push(`${at} line says "${l.shown}", expected "${l.want}"`);
    if (l.name === 'checklist') {
      if (l.indent !== 0) problems.push(`${at} is indented ${l.indent} px, a check list has no bullet to make room for`);
      if (!l.checked || l.checked === l.unchecked)
        problems.push(`${at}: a checked item and an unchecked one are drawn alike (${l.checked})`);
    } else {
      if (!(l.indent > 0)) problems.push(`${at} has no indent`);
      if (!l.nested) problems.push(`${at} has no nested list`);
    }
    if (!l.marker || l.marker === 'rgba(0, 0, 0, 0)') problems.push(`${at} marker has no color`);
    if (!l.visible) problems.push(`${at} is not visible`);
  }
  if (found.samples !== STYLES.length) problems.push(`${label}: ${found.samples} samples, expected ${STYLES.length}`);
  if (found.page > width) problems.push(`${label}: the page scrolls sideways (${found.page} px in ${width})`);
  await tab.close();
}

// Each level of a text's headings is one role of the type scale (theme/styles/base.css, "The text's headings"), and a quote is body large:
// the demo's Typography page (demo/src/content/pages/typography.md) has one of each, written "Heading 1" to "Heading 6".
const HEADINGS = {
  h1: 'display-small',
  h2: 'headline-medium',
  h3: 'title-large',
  h4: 'title-medium',
  h5: 'title-small',
  h6: 'label-medium',
};

/** H1 to H6 and the quote in the text of /typography/ have the size, line height, weight and tracking of their role's token. */
async function checkTypographyHeadings(width, height) {
  const label = `${width}px Typography page`;
  const tab = await browser.newPage({ viewport: { width, height }, locale: 'en-US' });
  tab.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
  await tab.goto(`${site}/typography/`, { waitUntil: 'networkidle' });
  const rows = await tab.evaluate((levels) => {
    const probe = document.createElement('div');
    document.body.append(probe);
    const read = (el, role) => {
      probe.style.cssText = `position:absolute;visibility:hidden;font-size:var(--mo-sys-typescale-${role}-size);line-height:var(--mo-sys-typescale-${role}-line-height);font-weight:var(--mo-sys-typescale-${role}-weight);letter-spacing:var(--mo-sys-typescale-${role}-tracking)`;
      const token = getComputedStyle(probe);
      const own = getComputedStyle(el);
      return ['fontSize', 'lineHeight', 'fontWeight', 'letterSpacing'].map((key) => [key, own[key], token[key]]);
    };
    const out = Object.entries(levels).map(([tag, role]) => {
      const n = tag.slice(1);
      const el = [...document.querySelectorAll(`main .mo-prose ${tag}`)].find((e) =>
        new RegExp(`^Heading ${n}\\b`).test(e.textContent.trim()),
      );
      return el ? { name: `${tag} (${role})`, values: read(el, role) } : { name: `${tag} (${role})`, missing: true };
    });
    const quote = document.querySelector('main .mo-prose blockquote');
    out.push(
      quote
        ? {
            name: 'quote (body-large)',
            values: read(quote, 'body-large'),
            italic: getComputedStyle(quote).fontStyle !== 'normal',
            line: parseFloat(getComputedStyle(quote).borderInlineStartWidth) > 0,
          }
        : { name: 'quote (body-large)', missing: true },
    );
    probe.remove();
    return out;
  }, HEADINGS);
  for (const r of rows) {
    if (r.missing) problems.push(`${label}: no ${r.name} in the text`);
    else {
      for (const [key, own, token] of r.values)
        if (own !== token) problems.push(`${label}: ${r.name} ${key} is ${own}, the token is ${token}`);
      if (r.italic) problems.push(`${label}: ${r.name} is italic`);
      if (r.line === false) problems.push(`${label}: ${r.name} has no line beside it`);
    }
  }
  await tab.close();
}

export function register(unit) {
  if (!existsSync(join(DIST, 'typography/index.html'))) return;
  for (const [width, height] of [
    [375, 740],
    [1280, 900],
  ]) {
    unit(`checkTypePage ${width}`, () => checkTypePage(width, height));
    unit(`checkTypographyHeadings ${width}`, () => checkTypographyHeadings(width, height));
  }
}
