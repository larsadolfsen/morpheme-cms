// Proves that a changed class name did not change the look (batch T01 of the move away from Tailwind; the other batches claim "identical" with it).
//   node scripts/compare-styles.mjs <before> <after> [--pages /a/,/b/] [--limit N] [--all]
//   node scripts/compare-styles.mjs --snapshots <folder before> <folder after>
// <before> and <after> are two built sites (a folder each, like `npx astro build --outDir <folder>`; the editor's /editor/ is left out, its screens are
// compared by `--snapshots`). It opens every page of <before> in both, at 375, 700, 900 and 1300 px, light and dark, and on each section colour (the
// `…section-<colour>` class of every section is swapped to surface, primary, secondary and tertiary in turn), with animations, `data-reveal`
// and motion frozen and the fonts loaded. For every element in document order it compares the computed style of about 60 properties (type, spacing,
// colour, border, display, position, size) and the bounding box. The structure must be the same (the same tags in the same order); the class
// attributes may differ. It reports the first element that differs in each case, with its selector path and the property, and exits 1.
// `--snapshots` compares two folders of the editor's snapshots (scripts/styles-snapshot.mjs) the same way, file by file.
// `--pages` only some pages (their addresses); `--limit N` the first N pages; `--all` prints every case that differs (else the first 10).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

export const WIDTHS = [375, 700, 900, 1300];
export const SCHEMES = ['light', 'dark'];
export const SECTION_COLORS = ['surface', 'primary', 'secondary', 'tertiary'];
/** About 60 properties: type, spacing, colour, border, display, position, size. */
export const PROPERTIES = [
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'z-index',
  'float',
  'visibility',
  'overflow-x',
  'overflow-y',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'box-sizing',
  'aspect-ratio',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'flex-direction',
  'flex-wrap',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'align-items',
  'align-self',
  'justify-content',
  'justify-items',
  'justify-self',
  'order',
  'row-gap',
  'column-gap',
  'grid-template-columns',
  'grid-template-rows',
  'grid-column-start',
  'grid-column-end',
  'grid-row-start',
  'grid-row-end',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'text-align',
  'text-transform',
  'text-decoration-line',
  'white-space',
  'text-overflow',
  'vertical-align',
  'color',
  'background-color',
  'background-image',
  'opacity',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-top-style',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
  'box-shadow',
  'outline-style',
  'outline-width',
  'outline-color',
  'object-fit',
  'transform',
  'cursor',
  'pointer-events',
];
export const SKIP_TAGS = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'META', 'TITLE', 'BASE', 'HEAD'];
const SKIP = new Set(SKIP_TAGS);

/** Runs in the page: every element of the body in document order, with its tag, its path (tags and positions, no classes), a short label with its
 * classes for reading, the computed style of the properties and its bounding box (rounded to a hundredth of a pixel). */
export function capture({ properties, skip }) {
  const out = [];
  const path = (e) => {
    const parts = [];
    for (let n = e; n && n !== document.documentElement; n = n.parentElement) {
      const same = n.parentElement ? [...n.parentElement.children].filter((c) => c.tagName === n.tagName) : [n];
      parts.unshift(`${n.tagName.toLowerCase()}${same.length > 1 ? `:nth-of-type(${same.indexOf(n) + 1})` : ''}`);
    }
    return parts.join(' > ');
  };
  const label = (e) =>
    `${e.tagName.toLowerCase()}${e.id ? `#${e.id}` : ''}${[...e.classList]
      .slice(0, 3)
      .map((c) => `.${c}`)
      .join('')}`;
  for (const e of document.body.querySelectorAll('*')) {
    if (skip.includes(e.tagName) || (e.closest('svg') && e.tagName !== 'svg')) continue;
    const s = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    out.push({
      tag: e.tagName,
      path: path(e),
      label: label(e),
      style: properties.map((p) => s.getPropertyValue(p)),
      box: [r.x, r.y, r.width, r.height].map((n) => Math.round(n * 100) / 100),
    });
  }
  return out;
}

/** What to do in a page before it is captured: no animation, no reveal, no smooth scroll, all images loaded, fonts ready. */
export const FREEZE_CSS = `*, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; caret-color: transparent !important; }
[data-reveal] { opacity: 1 !important; transform: none !important; translate: none !important; visibility: visible !important; }`;
export async function settle(page) {
  await page.addStyleTag({ content: FREEZE_CSS });
  await page.evaluate(async () => {
    for (const e of document.querySelectorAll('[data-reveal]')) e.removeAttribute('data-reveal');
    for (const img of document.querySelectorAll('img[loading="lazy"]')) img.loading = 'eager';
    await Promise.all([...document.images].map((i) => (i.complete ? null : i.decode().catch(() => {}))));
    await document.fonts.ready;
  });
}

const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
/** The same answer every run: an image from another host (an avatar, a video thumbnail) is a 1 px image at once and anything else from another host is refused, so a slow or blocked network can not change a page. */
export async function stubOutside(page, origin) {
  await page.route('**/*', (route) => {
    const request = route.request();
    if (request.url().startsWith(origin) || /^(data|blob):/.test(request.url())) return route.continue();
    return request.resourceType() === 'image' ? route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL }) : route.abort();
  });
}

/** After a change of the screen, the colour scheme or the density: every animation finished, then two frames, so a part that moves into place (the floating button, a spring) is where it ends. */
export async function settled(page) {
  await page.evaluate(
    () =>
      new Promise((done) => {
        for (const a of document.getAnimations()) {
          // One tied to a scroll position has no end in time: finishing it would cut it from the scroll.
          if (typeof ScrollTimeline === 'function' && a.timeline instanceof ScrollTimeline) continue;
          try {
            a.finish();
          } catch {}
        }
        requestAnimationFrame(() => requestAnimationFrame(done));
        // A page that is not drawn (no frame) must not wait for ever.
        setTimeout(done, 2000);
      }),
  );
  await page.waitForTimeout(100);
}

/** The first difference between two captures, or null. Same tags in the same order first; then, element by element, the properties, then the box. */
export function firstDifference(before, after) {
  const n = Math.min(before.length, after.length);
  for (let i = 0; i < n; i++) {
    if (before[i].tag !== after[i].tag)
      return {
        kind: 'structure',
        index: i,
        path: before[i].path,
        label: before[i].label,
        detail: `the element is <${before[i].tag.toLowerCase()}> before and <${after[i].tag.toLowerCase()}> after`,
      };
    for (let p = 0; p < PROPERTIES.length; p++)
      if (before[i].style[p] !== after[i].style[p])
        return {
          kind: 'style',
          index: i,
          path: before[i].path,
          label: before[i].label,
          property: PROPERTIES[p],
          before: before[i].style[p],
          after: after[i].style[p],
        };
    const names = ['x', 'y', 'width', 'height'];
    for (let b = 0; b < 4; b++)
      if (before[i].box[b] !== after[i].box[b])
        return {
          kind: 'box',
          index: i,
          path: before[i].path,
          label: before[i].label,
          property: `box ${names[b]}`,
          before: before[i].box[b],
          after: after[i].box[b],
        };
  }
  if (before.length !== after.length)
    return {
      kind: 'structure',
      index: n,
      path: (before[n] ?? after[n]).path,
      label: (before[n] ?? after[n]).label,
      detail: `${before.length} elements before, ${after.length} after`,
    };
  return null;
}

export const describe = (d) =>
  d.kind === 'structure'
    ? `element ${d.index} ${d.path} (${d.label}): the structure differs, ${d.detail}`
    : `element ${d.index} ${d.path} (${d.label}): ${d.property} was ${d.before}, is ${d.after}`;

// ---- Two folders of snapshots -------------------------------------------------------------------------------------------------------

const readSnapshot = (file) => JSON.parse((file.endsWith('.gz') ? gunzipSync(readFileSync(file)) : readFileSync(file)).toString());

/** The cases that differ between two folders of snapshots (every file in one must be in the other). */
export function compareSnapshots(beforeDir, afterDir) {
  const list = (d) =>
    readdirSync(d)
      .filter((f) => /\.json(\.gz)?$/.test(f))
      .sort();
  const was = new Set(list(beforeDir));
  const problems = [];
  let compared = 0;
  for (const file of list(afterDir)) {
    if (!was.delete(file)) {
      problems.push({ where: file, text: 'only exists after' });
      continue;
    }
    compared++;
    const d = firstDifference(readSnapshot(join(beforeDir, file)).elements, readSnapshot(join(afterDir, file)).elements);
    if (d) problems.push({ where: file, text: describe(d) });
  }
  for (const file of was) problems.push({ where: file, text: 'only exists before' });
  return { compared, problems };
}

// ---- Two built sites -----------------------------------------------------------------------------------------------------------------

const pagesOf = (dir) =>
  readdirSync(dir, { recursive: true })
    .filter((f) => f.endsWith('.html') && !f.startsWith('editor/') && statSync(join(dir, f)).isFile())
    .map((f) => `/${f.replace(/index\.html$/, '')}`)
    .sort();

async function compareSites(beforeDir, afterDir, { only, limit, all }) {
  const { chromium } = await import('playwright');
  const { serveBuilt } = await import('./built-site.mjs');
  const [a, b] = await Promise.all([serveBuilt(beforeDir), serveBuilt(afterDir)]);
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
  const was = pagesOf(beforeDir);
  const now = new Set(pagesOf(afterDir));
  let pages = only ?? was;
  if (limit) pages = pages.slice(0, limit);
  const problems = [];
  for (const page of was) if (!now.has(page) && pages.includes(page)) problems.push({ where: page, text: 'only exists before' });
  pages = pages.filter((p) => now.has(p));
  let cases = 0;
  const open = async (site, width, address) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'en-US', reducedMotion: 'reduce' });
    const page = await context.newPage();
    await stubOutside(page, site);
    await page.goto(`${site}${address}`, { waitUntil: 'load' });
    await settle(page);
    return { page, context };
  };
  const grab = (page) => page.evaluate(capture, { properties: PROPERTIES, skip: [...SKIP] });
  const withColor = (page, color) =>
    page.evaluate(
      ([c, all]) => {
        // The colour of a section is the kind `mo-is-<colour>` on the `mo-text-section`.
        for (const e of document.querySelectorAll('.mo-text-section'))
          for (const name of [...e.classList]) if (all.some((k) => name === `mo-is-${k}`)) e.classList.replace(name, `mo-is-${c}`);
      },
      [color, SECTION_COLORS],
    );
  for (const address of pages) {
    for (const width of WIDTHS) {
      const [x, y] = [await open(a.site, width, address), await open(b.site, width, address)];
      const sections = await x.page.evaluate(() => document.querySelectorAll('.mo-text-section').length);
      for (const scheme of SCHEMES) {
        await Promise.all([x.page, y.page].map((p) => p.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })));
        for (const color of sections ? SECTION_COLORS : [null]) {
          if (color) await Promise.all([withColor(x.page, color), withColor(y.page, color)]);
          await Promise.all([settled(x.page), settled(y.page)]);
          cases++;
          const d = firstDifference(await grab(x.page), await grab(y.page));
          if (d) problems.push({ where: `${address} at ${width} px, ${scheme}${color ? `, section ${color}` : ''}`, text: describe(d) });
        }
      }
      await Promise.all([x.context.close(), y.context.close()]);
    }
  }
  await browser.close();
  a.server.close();
  b.server.close();
  return { compared: cases, pages: pages.length, problems };
}

// ---- The command ---------------------------------------------------------------------------------------------------------------------

function report({ compared, problems }, what, all) {
  if (!problems.length) {
    console.log(`No differences: ${compared} ${what} are the same.`);
    return 0;
  }
  const shown = all ? problems : problems.slice(0, 10);
  console.error(`${problems.length} of ${compared} ${what} differ. The first difference of each:\n`);
  for (const p of shown) console.error(`${p.where}\n  ${p.text}\n`);
  if (shown.length < problems.length) console.error(`… and ${problems.length - shown.length} more (--all prints them).`);
  return 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const option = (name) => {
    const at = args.indexOf(name);
    return at >= 0 ? args[at + 1] : null;
  };
  const values = new Set([option('--pages'), option('--limit')].filter(Boolean));
  const positional = args.filter((arg) => !arg.startsWith('--') && !values.has(arg)).map((d) => resolve(process.cwd(), d));
  const [before, after] = positional;
  if (!before || !after || !existsSync(before) || !existsSync(after)) {
    console.error(
      'Usage: node scripts/compare-styles.mjs <built site before> <built site after> [--pages /a/,/b/] [--limit N] [--all]\n       node scripts/compare-styles.mjs --snapshots <folder before> <folder after>',
    );
    process.exit(1);
  }
  const all = args.includes('--all');
  if (args.includes('--snapshots')) {
    process.exit(
      report(compareSnapshots(before, after), `snapshots (${relative(process.cwd(), before)} and ${relative(process.cwd(), after)})`, all),
    );
  }
  const only = option('--pages')?.split(',');
  const result = await compareSites(before, after, { only, limit: Number(option('--limit')) || 0, all });
  process.exit(report(result, `cases (${result.pages} pages, ${WIDTHS.join(', ')} px, light and dark, every section colour)`, all));
}
