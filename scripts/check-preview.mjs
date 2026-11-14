// Checks that the editor's Preview of a page looks like the page on the site: the same markup for the page's header, text and blocks
// (what the owner approves is what visitors get), and the same computed style for the header, the sections, the blocks and the footer, at
// 390 and 1280 px, light and dark. The site's page is the built one; the Preview is opened from the editor on the same text.
// Run on the built site: npm run build && npm run check:preview (in .morpheme/demo/site/ by `npx morpheme check:preview`).
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';
import { openEditor, serveBuilt } from './built-site.mjs';

const ROOT = `${process.cwd()}/`;
const DIST = resolve(ROOT, process.argv[2] ?? 'dist');
if (!existsSync(join(DIST, 'editor/index.html'))) {
  console.error(`There is no built site in ${DIST}. Run npm run build first.`);
  process.exit(1);
}
// The pages compared: PREVIEW_PAGES, else the demo's pages that the site has, else the first five pages of the site's own (never a
// page the site does not have: a site is not the demo). The front page (home) is the site's address itself.
const builtAt = (name) => existsSync(join(DIST, name === 'home' ? '' : name, 'index.html'));
const ofSite = existsSync(join(ROOT, 'src/content/pages'))
  ? readdirSync(join(ROOT, 'src/content/pages'))
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.slice(0, -3))
      .filter(builtAt)
      .sort()
  : [];
const demoPages = ['blocks', 'about', 'get-started', 'app-store', 'contact'].filter((name) => ofSite.includes(name));
const PAGES = process.env.PREVIEW_PAGES ? process.env.PREVIEW_PAGES.split(',') : demoPages.length ? demoPages : ofSite.slice(0, 5);
if (!PAGES.length) {
  console.log('The site has no built page to compare the Preview with: skipped.');
  process.exit(0);
}
const WIDTHS = [390, 1280];
const problems = [];
const { server, site } = await serveBuilt(DIST);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

// The page's parts as one list: a tag path with its classes and the style that decides how it looks.
const STYLES = [
  'display',
  'position',
  'margin-top',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'padding-top',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'color',
  'background-color',
  'border-top-width',
  'border-top-color',
  'border-top-left-radius',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'list-style-type',
  'gap',
  'box-shadow',
];
const measure = (STYLES) => {
  // (A button or a tag chip is a link on the site, to the page of its list or tag, which the editor does not know: a button or plain text there, drawn the same.)
  const tagOf = (el) => (/^(a|button|span)$/i.test(el.tagName) && el.matches('.button, .chip') ? 'link' : el.tagName.toLowerCase());
  // (An image has the sizes the build made of it on the site, and in the Preview only the image itself, pagePreview.tsx: its size on the page is compared.)
  const drop =
    'source, script, style, template, noscript, link, meta, [data-snackbar], .snackbar-stack, dialog, [data-editor-preview], .video-facade, .carousel-indicator, .block-cards-show-all, .list-item-expand-body, .block-filters';
  // (A video's still is fetched from its host when the site is built, and by the browser in the Preview: that is the network, not the drawing. The body of a row that reads another page or post (`.list-item-expand-body`) is that page's text or excerpt, which the editor does not have. The state of a carousel's dots and of "Show all" is set by the site's scripts, which the Preview's frame does not run.)
  const root = document.body;
  const rows = [];
  const walk = (el, path) => {
    if (el.matches(drop)) return;
    const s = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    const own = [...el.childNodes]
      .filter((n) => n.nodeType === 3 && n.textContent.trim())
      .map((n) => n.textContent.trim().replace(/\s+/g, ' ').slice(0, 20));
    const attrs = [...el.attributes]
      .filter(
        (a) =>
          ![
            'class',
            'style',
            'id',
            'sizes',
            'srcset',
            'src',
            'href',
            'aria-controls',
            'for',
            'name',
            'type',
            'width',
            'height',
            'loading',
            'fetchpriority',
            'decoding',
            'target',
            'data-astro-cid',
          ].includes(a.name) &&
          !a.name.startsWith('data-astro') &&
          !a.name.startsWith('astro') &&
          a.name !== 'props' &&
          !/^(uid|prefix|component|renderer|client|opts|ssr|before-hydration)/.test(a.name),
      )
      .map((a) => `${a.name}=${a.value.slice(0, 30)}`);
    rows.push({
      path,
      tag: tagOf(el),
      cls: [...el.classList]
        .filter((c) => !c.startsWith('astro-'))
        .sort()
        .join(' '),
      attrs: attrs.join(' '),
      own: own.join('|'),
      style: Object.fromEntries(STYLES.map((p) => [p, s.getPropertyValue(p)])),
      box: [Math.round(box.width), Math.round(box.height)],
      leaf: ![...el.children].some((c) => !c.matches(drop)),
    });
    [...el.children].filter((c) => !c.matches(drop)).forEach((c, i) => walk(c, `${path}>${tagOf(c)}${i}`));
  };
  // Only the page itself: the header, main and the footer (the editor frame's own marks and the site's overlays are left out).
  for (const part of document.body.querySelectorAll(
    'body > header, body > main, body > footer, body > div > header, body > div > main, body > div > footer',
  ))
    walk(part, part.tagName.toLowerCase());
  return rows;
};

const compare = (label, live, preview) => {
  const out = [];
  const n = Math.max(live.length, preview.length);
  let shift = 0;
  for (let i = 0; i < n && out.length < 25; i++) {
    const a = live[i],
      b = preview[i];
    if (!a || !b) {
      out.push(`${label}: the ${a ? 'Preview ends' : 'site ends'} at element ${i} (${(a ?? b).path})`);
      break;
    }
    if (a.path !== b.path) {
      out.push(`${label}: the structure differs at ${a.path} / ${b.path}`);
      break;
    }
    if (a.cls !== b.cls || a.attrs !== b.attrs || a.own !== b.own) {
      out.push(
        `${label}: markup differs at ${a.path} (${['path', 'cls', 'attrs', 'own'].filter((k) => a[k] !== b[k]).join(', ')})\n    site:    <${a.tag} class="${a.cls}" ${a.attrs}> ${a.own}\n    Preview: <${b.tag} class="${b.cls}" ${b.attrs}> ${b.own}`,
      );
    }
    const diff = Object.keys(a.style)
      .filter((p) => a.style[p] !== b.style[p])
      .map((p) => `${p}: ${a.style[p]} / ${b.style[p]}`);
    if (diff.length) out.push(`${label}: ${a.path} <${a.tag} class="${a.cls}"> style differs (site / Preview): ${diff.join('; ')}`);
    else if (a.leaf && (Math.abs(a.box[0] - b.box[0]) > 1 || Math.abs(a.box[1] - b.box[1]) > 1))
      out.push(`${label}: ${a.path} <${a.tag} class="${a.cls}"> size ${a.box} / ${b.box}`);
  }
  return out;
};

for (const scheme of ['light', 'dark']) {
  for (const width of WIDTHS) {
    for (const name of PAGES) {
      const label = `${name} ${width}px ${scheme}`;
      const path = `src/content/pages/${name}.md`;
      const context = await browser.newContext({ viewport: { width, height: 900 }, locale: 'en-US', colorScheme: scheme });
      const page = await context.newPage();
      page.on('pageerror', (e) => problems.push(`${label}: ${e.message}`));
      await openEditor(page, site);
      await page.goto(`${site}/editor/#${path}`);
      await page.getByRole('button', { name: 'Preview' }).first().click();
      await page.waitForFunction(() => document.querySelector('dialog[open] iframe'), null, { timeout: 30_000 });
      const frame = page.frames().find((f) => f !== page.mainFrame());
      await frame.waitForSelector('[data-editor="text"]', { timeout: 30_000 });
      // The Preview's size chips set the frame's width; the frame is as wide as the window.
      await page.mouse.move(1, 895);
      await page.waitForTimeout(500);
      const frameWidth = await frame.evaluate(() => innerWidth);
      const previewRows = await frame.evaluate(measure, STYLES);
      if (process.env.PREVIEW_VERBOSE) console.log(`${label}: frame ${frameWidth}px, ${liveRows.length} / ${previewRows.length} elements`);
      const live = await context.newPage();
      await live.setViewportSize({ width: frameWidth, height: 900 });
      await live.goto(name === 'home' ? `${site}/` : `${site}/${name}/`);
      await live.waitForSelector('main');
      await live.waitForTimeout(300);
      const liveRows = await live.evaluate(measure, STYLES);
      problems.push(...compare(label, liveRows, previewRows));
      await context.close();
    }
  }
}
await browser.close();
server.close();
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('The Preview looks like the site.');
