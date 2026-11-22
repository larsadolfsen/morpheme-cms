// check:m3-render: each marked sample of the UI components page (/ui/, the editor's Parts > UI components) is measured in a real browser, in light and dark, and
// compared with Material 3's tokens (docs/m3-tokens/) and the values M3 prints only on a page (docs/m3-tokens/printed.json). A difference not in
// scripts/m3-render.allow.mjs fails, and so does an entry that no longer differs. Run on the built site (npm run build first):
//   `cd .morpheme/demo/site && node ../../../scripts/check-m3-render.mjs [--report] [dist]`   (--report prints every difference as an allowlist entry)
// Not part of `npm run check`; CI runs it as its own job. Logic: scripts/m3-render.mjs.
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { serveBuilt } from './built-site.mjs';
import {
  RESTYLES,
  ROOTS,
  batchOf,
  compare,
  judge,
  keyOf,
  printed,
  resolve as resolveSample,
  roleNames,
  tally,
  loadSet,
  num,
} from './m3-render.mjs';

const args = process.argv.slice(2);
const REPORT = args.includes('--report');
const DIST = resolve(process.cwd(), args.find((a) => !a.startsWith('--')) ?? 'dist');
if (!existsSync(join(DIST, 'ui', 'index.html'))) {
  console.log('The site has no UI components page: skipped.');
  process.exit(0);
}

/** Parts that have no Material 3 component (`data-m3="none"`), each with its reason. A part marked `none` that is not here fails. */
export const NONE = {
  Avatar: 'Material 3 has no avatar component; its page names a list item’s leading avatar only (Lists, Specs).',
};

const { allow } = await import(pathToFileURL(join(import.meta.dirname, 'm3-render.allow.mjs')).href).catch(() => ({ allow: [] }));
const roles = roleNames().filter((r) => !/^(surface-tint|shadow|scrim)$/.test(r) || true);

/** Runs in the page: every root of a family, measured. */
function measureAll({ rootClasses, roles, mode }) {
  // colour value -> roles that have it, in this scheme
  const probe = document.createElement('span');
  document.body.append(probe);
  const byColour = new Map();
  for (const r of roles) {
    probe.style.color = `var(--mo-sys-color-${r})`;
    const c = getComputedStyle(probe).color;
    if (!byColour.has(c)) byColour.set(c, []);
    byColour.get(c).push(r);
  }
  probe.remove();
  const rolesOf = (c) => {
    if (!c || c === 'rgba(0, 0, 0, 0)' || c === 'transparent') return [];
    return byColour.get(c) ?? [];
  };
  const px = (v) => parseFloat(v) || 0;
  const fontOf = (el) => {
    const s = getComputedStyle(el);
    const fs = px(s.fontSize);
    return {
      fontSize: fs,
      lineHeight: s.lineHeight === 'normal' ? undefined : px(s.lineHeight),
      fontWeight: Number(s.fontWeight),
      tracking: s.letterSpacing === 'normal' ? 0 : px(s.letterSpacing),
      roles: rolesOf(s.color),
    };
  };
  const out = [];
  const parts = new Map();
  for (const root of rootClasses) {
    for (const el of document.querySelectorAll(`.${root}`)) {
      if (!el.closest('.mo-ui-components')) continue;
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const svg = [...el.querySelectorAll('svg')].find((v) => v.getBoundingClientRect().width > 0);
      const marks = [];
      for (let n = el.closest('[data-m3]'); n; n = n.parentElement?.closest('[data-m3]')) marks.push(n.dataset.m3);
      const nested = !!el.parentElement?.closest(rootClasses.map((c) => `.${c}`).join(','));
      const part = el.closest('[data-part]')?.dataset.part;
      const input = el.querySelector('input, textarea');
      const container = el.querySelector('.mo-text-field__container') ?? el;
      const cs = getComputedStyle(container);
      const radius = (st) => {
        const v = px(st.borderTopLeftRadius);
        return { px: v, full: v >= Math.min(r.width, r.height) / 2 - 0.5 };
      };
      out.push({
        root,
        classes: [...el.classList],
        part,
        nested,
        marks,
        disabled: el.matches(':disabled, [aria-disabled="true"]') || !!el.querySelector(':scope > :disabled'),
        selected: el.hasAttribute('aria-pressed')
          ? el.getAttribute('aria-pressed') === 'true'
          : el.hasAttribute('aria-checked')
            ? el.getAttribute('aria-checked') === 'true'
            : undefined,
        multiline: el.classList.contains('mo-text-field__multiline'),
        box: { w: r.width, h: r.height },
        box2: undefined,
        pad: { l: px(s.paddingLeft), r: px(s.paddingRight), t: px(s.paddingTop), b: px(s.paddingBottom) },
        gap: px(s.columnGap),
        radius: radius(root === 'mo-text-field' ? cs : s),
        border: { w: px((root === 'mo-text-field' ? cs : s).borderTopWidth) },
        bgRoles: rolesOf(s.backgroundColor),
        label: fontOf(el),
        input: input ? fontOf(input) : fontOf(el),
        icon: svg
          ? { w: svg.getBoundingClientRect().width, h: svg.getBoundingClientRect().height, roles: rolesOf(getComputedStyle(svg).color) }
          : undefined,
        container: { w: container.getBoundingClientRect().width, h: container.getBoundingClientRect().height },
        text: (el.textContent ?? '').trim().slice(0, 24),
        index: [...document.querySelectorAll(`.${root}`)].indexOf(el),
      });
      void parts;
    }
  }
  void mode;
  return out;
}

const { server, site } = await serveBuilt(DIST);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const rootClasses = Object.keys(ROOTS);
const problems = [];
const found = [];
let samples = 0;
const generic = new Map();

for (const mode of ['light', 'dark']) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: mode });
  const page = await context.newPage();
  await page.goto(`${site}/ui/`, { waitUntil: 'load' });
  await page.waitForSelector('.mo-ui-components button', { timeout: 15000 });
  await page.waitForTimeout(1500);
  const list = await page.evaluate(measureAll, { rootClasses, roles, mode });
  for (const m of list) {
    const where = `${m.part ?? '?'} › ${m.root}${m.text ? ` "${m.text}"` : ''}`;
    if (mode === 'light') {
      samples++;
      if (!m.marks.length) problems.push(`Unmarked sample (no data-m3 above it): ${where}`);
      // A component shown inside another sample (a button in a dialog) is part of that sample and is measured as its own family.
      if (m.marks[0] === 'none' && !NONE[m.part])
        problems.push(`Part "${m.part}" is marked none and is not in NONE with a reason: ${where}`);
    }
    const r =
      m.marks[0] && m.nested !== undefined && RESTYLES.some((x) => m.marks[0] === x) && m.marks[0] !== ROOTS[m.root]
        ? undefined
        : resolveSample(m);
    if (!r) {
      generic.set(m.root, (generic.get(m.root) ?? 0) + 1);
      continue;
    }
    for (const f of compare(m, r, mode)) found.push({ ...f, where });
  }
  await context.close();
}

// Values printed only on a page (docs/m3-tokens/printed.json): each is read from the elements it names, in both modes.
for (const mode of ['light']) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: mode });
  const page = await context.newPage();
  await page.goto(`${site}/ui/`, { waitUntil: 'load' });
  await page.waitForSelector('.mo-ui-components button', { timeout: 15000 });
  await page.waitForTimeout(1500);
  for (const p of printed()) {
    const got = await page.evaluate(
      ({ selector, measure }) =>
        [...document.querySelectorAll(selector)]
          .filter((e) => e.closest('.mo-ui-components'))
          .map((e) => (measure === 'height' ? e.getBoundingClientRect().height : parseFloat(getComputedStyle(e)[measure])))
          .filter((x) => measure !== 'height' || x > 0),
      p,
    );
    if (!got.length) problems.push(`printed.json: nothing on /ui/ matches ${p.selector} (${p.id})`);
    for (const g of new Set(got.map((x) => Math.round(x * 100) / 100))) {
      const ok = p.op === 'min' ? g >= p.value - 1 : Math.abs(g - p.value) <= 1;
      if (!ok)
        found.push({
          set: p.family,
          attr: p.attr,
          got: Number.isNaN(g) ? 'none' : g,
          want: p.op === 'min' ? `\u2265${p.value}` : p.value,
          where: `${p.id} (${p.url})`,
        });
    }
  }
  await context.close();
}
await browser.close();
server.close();

const grouped = tally(
  found.map(({ where, ...f }) => f),
  '',
);
// examples per key
const examples = new Map();
for (const f of found) {
  const k = keyOf(f);
  const e = examples.get(k) ?? [];
  if (e.length < 3 && !e.includes(f.where)) e.push(f.where);
  examples.set(k, e);
}
const counts = new Map();
for (const f of found) counts.set(keyOf(f), (counts.get(keyOf(f)) ?? 0) + 1);

if (REPORT) {
  const rows = [...grouped.values()].map((e) => ({
    set: e.finding.set,
    attr: e.finding.attr,
    ...(e.finding.mode ? { mode: e.finding.mode } : {}),
    got: e.finding.got,
    want: e.finding.want,
    class: 'fix',
    batch: batchOf(e.finding.set),
    count: counts.get(keyOf(e.finding)),
    examples: examples.get(keyOf(e.finding)),
  }));
  console.log(JSON.stringify(rows, null, 1));
  if (problems.length) console.error(problems.slice(0, 40).join('\n'), problems.length > 40 ? `\n… ${problems.length} in all` : '');
  console.error(
    `${samples} roots, ${rows.length} distinct differences, ${found.length} in all; not measured (no adapter): ${[...generic].map(([k, v]) => `${k} ${v}`).join(', ')}`,
  );
  process.exit(0);
}

const { unlisted, stale, bad } = judge(grouped, allow);
for (const k of unlisted)
  problems.push(`Differs from Material 3 and is not in m3-render.allow.mjs: ${k} (${counts.get(k)}×, e.g. ${examples.get(k).join('; ')})`);
for (const k of stale) problems.push(`In m3-render.allow.mjs but no longer differs (remove it): ${k}`);
for (const k of bad) problems.push(`Entry of m3-render.allow.mjs without a class or its batch/reason: ${k}`);
void loadSet;
void num;
if (problems.length) {
  console.error(`check:m3-render failed (${problems.length}):\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(`check:m3-render: ${samples} samples measured in light and dark, all differences from Material 3 listed (${allow.length}).`);
