// Contrast (WCAG 2.x AA) of every block's text, icons and control borders against what is painted behind them, on the
// built site and in the editor (typed in place: resting, and each block selected), light and dark, on a phone and a
// computer, with every installed theme. Run on the demo: npm run build && npm run check:contrast (in .morpheme/demo/site/:
// node ../../../bin/morpheme.mjs check:contrast).
//
// A test page is made of the demo's Blocks page once on each section colour (surface, primary, secondary, tertiary), built
// to a folder of its own, so every block and every variant of it that changes a colour is on one page. The site's pages
// (home, contact, about …) are scanned too. Each text, icon and outlined control gets its computed colour against the
// effective background: the backgrounds of its ancestors, composited over each other (alpha handled) down to the page's.
// 4.5:1 for text, 3:1 for large text (24 px, or 18.66 px bold), icons and the border of a control (outlined button, field).
// A background that is an image or a gradient cannot be read: the pair is listed as "manual", never as a failure.
// Placeholders and disabled controls: placeholders are checked (4.5:1), disabled controls are exempt (WCAG 1.4.3).
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { activeTheme, installedThemes } from '@morphemecms/cms/site/theme.mjs';
import { binOf } from './bin.mjs';
import { buildOutDir } from './build-out.mjs';
import { openEditor, serveBuilt } from './built-site.mjs';
import { blockHtml } from '../lib/blocks.mjs';

const ROOT = `${process.cwd()}/`;
const PAGE = 'src/content/pages/contrast-test.md';
// CONTRAST_SECTIONS=surface,tint,accent: the section colours of an older version (v0.16.0 has no primary, secondary or tertiary).
const SECTIONS = process.env.CONTRAST_SECTIONS ? process.env.CONTRAST_SECTIONS.split(',') : ['surface', 'primary', 'secondary', 'tertiary'];
const SIZES = [
  [375, 740],
  [1280, 900],
];
const SCHEMES = ['light', 'dark'];
// CONTRAST_THEMES=saturn,mercury: only these themes (default: the theme in use, and with --all every installed theme).
const all = process.argv.includes('--all');
const themes = process.env.CONTRAST_THEMES ? process.env.CONTRAST_THEMES.split(',') : all ? installedThemes() : [activeTheme()];
const reportFile = process.env.CONTRAST_REPORT;

/** Browser side (a string for page.evaluate): scans `root` and gives one record per pair of colours. */
const scan = `(root) => {
  const canvas = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  // A CSS colour as [r, g, b, a] (the browser's own parsing: rgb(), oklch(), color-mix() … all come out as pixels).
  const rgba = (css) => {
    canvas.clearRect(0, 0, 1, 1);
    canvas.fillStyle = '#000';
    canvas.fillStyle = css;
    canvas.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = canvas.getImageData(0, 0, 1, 1).data;
    // getImageData premultiplies away the alpha: ask again over white and black to get the colour and its alpha.
    canvas.clearRect(0, 0, 1, 1);
    canvas.fillStyle = '#fff'; canvas.fillRect(0, 0, 1, 1); canvas.fillStyle = css; canvas.fillRect(0, 0, 1, 1);
    const w = canvas.getImageData(0, 0, 1, 1).data;
    canvas.clearRect(0, 0, 1, 1);
    canvas.fillStyle = '#000'; canvas.fillRect(0, 0, 1, 1); canvas.fillStyle = css; canvas.fillRect(0, 0, 1, 1);
    const k = canvas.getImageData(0, 0, 1, 1).data;
    const alpha = 1 - (w[0] - k[0]) / 255;
    return alpha <= 0.001 ? [0, 0, 0, 0] : [Math.round(k[0] / alpha), Math.round(k[1] / alpha), Math.round(k[2] / alpha), alpha];
  };
  const over = (front, back, extra = 1) => {
    const a = front[3] * extra;
    return [0, 1, 2].map((i) => front[i] * a + back[i] * (1 - a)).concat(1);
  };
  const lum = ([R, G, B]) => {
    const [r, g, b] = [R, G, B].map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const sectionOf = (el) => {
    const s = el.closest('[class*="text-section-"], [data-section-color]');
    if (!s) return 'surface';
    return s.getAttribute('data-section-color') ?? (/text-section-(surface|primary|secondary|tertiary)/.exec(s.className)?.[1] ?? 'surface');
  };
  const blockOf = (el) => {
    const card = el.closest('.site-block-card');
    if (card) return 'editor ' + (card.getAttribute('aria-label') ?? '').toLowerCase();
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const cls = typeof e.className === 'string' ? e.className : '';
      const t = e.getAttribute('data-block') ?? (/\\bblock-in-text\\b/.test(cls) || e.classList.contains('site-block-inline') ? /\\bblock-(?!in-text)([a-z]+)/.exec(cls)?.[1] : null);
      if (t) return t;
    }
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const t = /\\b(header|footer|mobile-menu|cookie-consent|page-header|action-bar|hero|post-card|popup)\\b/.exec(typeof e.className === 'string' ? e.className : '') ?? (['HEADER','FOOTER','NAV'].includes(e.tagName) ? [e.tagName.toLowerCase()] : null);
      if (t) return t[1] ?? t[0];
    }
    return 'text';
  };
  const VARIANT = /(filled|tonal|elevated|outlined|text|primary|secondary|tertiary|error|active|selected|open|surface|inverse|container|neutral)/;
  const variantOf = (el, blockEl) => {
    const out = new Set();
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      for (const c of typeof e.className === 'string' ? e.className.split(/\\s+/) : []) if (VARIANT.test(c) && !/^(ProseMirror|prose)/.test(c) && !c.startsWith('text-section-')) out.add(c);
      if (e === blockEl) break;
    }
    return [...out].sort().join(' ');
  };
  const hidden = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0 || e.hidden || e.getAttribute('aria-hidden') === 'true' && e.tagName === 'IMG') return true;
      if ((e.tagName === 'DETAILS') && !e.open && el !== e && !el.closest('summary')) return true;
    }
    const r = el.getBoundingClientRect();
    return r.width < 1 || r.height < 1 || (r.width <= 1 && r.height <= 1);
  };
  // What is behind an element: the painted backgrounds of the ancestors, composited; 'manual' when one is an image or a gradient.
  const behind = (el) => {
    const layers = [];
    let manual = null;
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.backgroundImage !== 'none' && !/^url\\("?data:image\\/svg/.test(s.backgroundImage)) { manual = manual ?? (s.backgroundImage.startsWith('url') ? 'image background' : 'gradient background'); }
      const c = rgba(s.backgroundColor);
      if (c[3] > 0) { layers.push(c); if (c[3] >= 0.999) break; }
      // A picture laid behind the content (absolute img or video among the element's siblings).
      if (e !== el) for (const m of e.querySelectorAll(':scope > img, :scope > picture, :scope > video')) if (getComputedStyle(m).position === 'absolute') manual = manual ?? 'picture behind';
      if (e === document.documentElement) break;
    }
    let back = rgba(getComputedStyle(document.documentElement).backgroundColor);
    if (back[3] < 0.999) back = over(back, [255, 255, 255, 1]);
    for (const c of layers.reverse()) back = over(c, back);
    return { back, manual };
  };
  const opacityOf = (el) => { let o = 1; for (let e = el; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; };
  const records = [];
  const push = (el, kind, front, back, min, extra) => {
    const blockEl = el.closest('[data-block], .block-in-text, .site-block-inline');
    const r = ratio(over(front, back), back);
    records.push({ block: blockOf(el), variant: variantOf(el, blockEl), section: sectionOf(el), kind, fg: hex(over(front, back)), bg: hex(back), ratio: r, min, text: (extra.text ?? '').slice(0, 40), manual: extra.manual, tag: el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.split(/\\s+/)[0] : '') });
  };
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    const text = n.textContent.replace(/\\s+/g, ' ').trim();
    if (!text || seen.has(el) || el.closest('svg, script, style, option, noscript, template')) continue;
    if (el.closest(':disabled, [aria-disabled="true"], [disabled]')) continue;
    if (hidden(el)) continue;
    seen.add(el);
    const s = getComputedStyle(el);
    const size = parseFloat(s.fontSize);
    const bold = parseInt(s.fontWeight, 10) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const { back, manual } = behind(el);
    const front = rgba(s.color);
    front[3] *= opacityOf(el);
    push(el, 'text', front, back, large ? 3 : 4.5, { text, manual });
  }
  for (const svg of root.querySelectorAll('svg')) {
    if (hidden(svg) || svg.closest(':disabled, [aria-disabled="true"]') || svg.closest('[data-icon-hidden]')) continue;
    const s = getComputedStyle(svg);
    const paint = (v) => (v && v !== 'none' && v !== 'transparent' ? v : null);
    const fill = paint(s.fill) ?? paint(getComputedStyle(svg.querySelector('path, circle, rect, g') ?? svg).fill);
    const stroke = paint(s.stroke);
    const css = fill ?? stroke;
    if (!css) continue;
    const { back, manual } = behind(svg);
    const front = rgba(css);
    front[3] *= opacityOf(svg);
    push(svg, 'icon', front, back, 3, { text: svg.getAttribute('data-icon') ?? svg.getAttribute('aria-label') ?? '', manual });
  }
  // The border of a control: outlined buttons, fields.
  for (const el of root.querySelectorAll('a, button, input, textarea, select, summary')) {
    if (hidden(el) || el.closest(':disabled, [aria-disabled="true"]')) continue;
    const s = getComputedStyle(el);
    if (el.matches('input, textarea, select') || el.matches('[class*="button-outline"]')) {
      const w = parseFloat(s.borderTopWidth);
      if (w > 0 && s.borderTopStyle !== 'none') {
        const { back, manual } = behind(el.parentElement ?? el);
        push(el, 'border', rgba(s.borderTopColor), back, 3, { text: el.textContent ?? el.getAttribute('aria-label') ?? '', manual });
      }
    }
    if (el.matches('input, textarea')) {
      const p = getComputedStyle(el, '::placeholder');
      if (el.getAttribute('placeholder')) {
        const { back, manual } = behind(el);
        const front = rgba(p.color);
        front[3] *= parseFloat(p.opacity);
        push(el, 'placeholder', front, back, 4.5, { text: el.getAttribute('placeholder'), manual });
      }
    }
  }
  return records;
}`;

/** The page's records, as the unique pairs with how often each one is on the page. */
function unique(records, view) {
  const map = new Map();
  for (const r of records) {
    const key = [view, r.block, r.variant, r.section, r.kind, r.fg, r.bg, r.min, r.manual ?? ''].join('|');
    if (!map.has(key)) map.set(key, { ...r, view, count: 0 });
    map.get(key).count++;
  }
  return [...map.values()];
}

// The test page: the Blocks page on each section colour, one after the other.
const blocksText = readFileSync(join(ROOT, 'src/content/pages/blocks.md'), 'utf8');
const body = blocksText.replace(/^---[\s\S]*?---\n/, '');
// Every kind of button (Material's five), whatever the Blocks page shows.
const kinds = `## Button kinds\n\n${blockHtml('buttons', {
  items: ['filled', 'tonal', 'elevated', 'outlined', 'text'].map((kind) => ({
    label: kind,
    to: 'page',
    href: '/about/',
    kind,
    icon: 'arrow-right',
  })),
})}\n`;
// A section runs from its marker to the next H1 or H2, so each heading gets the marker.
const on = (c) => `${body}\n${kinds}`.replace(/^(#{1,2} )/gm, `<div data-section="${c}"></div>\n\n$1`);
const testPage = `---\ntitle: "Contrast test"\ndescription: "Made by check:contrast, never saved."\n---\n\n${SECTIONS.map(on).join('\n\n')}\n`;

const pages = ['/contrast-test/', '/', '/contact/', '/about/', '/get-started/', '/app-store/', '/blog-page/', '/privacy-policy/'];
const results = [];
const manualSeen = new Set();
const started = Date.now();
const themeFile = join(ROOT, 'src/data/theme.json');
const themeBefore = readFileSync(themeFile, 'utf8');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

try {
  writeFileSync(join(ROOT, PAGE), testPage);
  for (const theme of themes) {
    writeFileSync(themeFile, `${JSON.stringify({ theme }, null, 2)}\n`);
    const out = buildOutDir(ROOT, `contrast-${theme}`);
    try {
      execFileSync(process.execPath, [binOf('astro'), 'build', '--outDir', out], { cwd: ROOT, stdio: 'pipe' });
      const { server, site } = await serveBuilt(out);
      try {
        for (const scheme of SCHEMES) {
          for (const [width, height] of SIZES) {
            const phone = width < 600;
            const ctx = { viewport: { width, height }, colorScheme: scheme, hasTouch: phone, isMobile: phone, locale: 'en-US' };
            // The site.
            const page = await browser.newPage(ctx);
            await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' }).catch(() => {});
            for (const path of pages) {
              const response = await page.goto(`${site}${path}`).catch(() => null);
              if (!response || response.status() >= 400) continue;
              await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
              // Scrolled through once (what fades in when seen has faded in), and every fold open, so what is inside is read too.
              await page.evaluate(async () => {
                for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) {
                  scrollTo(0, y);
                  await new Promise((r) => setTimeout(r, 40));
                }
                scrollTo(0, 0);
              });
              await page.waitForTimeout(400);
              await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
              await page.waitForTimeout(500);
              const records = await page.evaluate(`(${scan})(document.body)`);
              results.push(...unique(records, `${theme} site ${scheme} ${width}${path === '/contrast-test/' ? '' : ` ${path}`}`));
            }
            await page.close();
            // The editor, typed in place: at rest, then each block selected.
            const editor = await browser.newPage(ctx);
            editor.on('pageerror', () => {});
            await openEditor(editor, site);
            await editor.goto(`${site}/editor/#${PAGE}`);
            await editor.waitForSelector('.ProseMirror [data-section-color="tertiary"]', { timeout: 60_000 }).catch(() => {});
            await editor.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
            await editor.mouse.move(0, 0);
            const view = `${theme} editor ${scheme} ${width}`;
            results.push(...unique(await editor.evaluate(`(${scan})(document.querySelector('.ProseMirror'))`), `${view} resting`));
            const inline = await editor.locator('.ProseMirror .site-block-inline').count();
            for (let i = 0; i < inline; i++) {
              const block = editor.locator('.ProseMirror .site-block-inline').nth(i);
              await block.scrollIntoViewIfNeeded().catch(() => {});
              const field = block.locator('input, textarea, [contenteditable="true"], .inline-list-field').first();
              if (!(await field.count())) continue;
              await field.click({ timeout: 2000 }).catch(() => {});
              await editor.mouse.move(0, 0);
              const records = await editor.evaluate(`(${scan})(document.querySelectorAll('.ProseMirror .site-block-inline')[${i}])`);
              results.push(...unique(records, `${view} selected`));
            }
            await editor.close();
          }
        }
      } finally {
        server.close();
      }
    } finally {
      rmSync(out, { recursive: true, force: true });
    }
  }
} finally {
  rmSync(join(ROOT, PAGE), { force: true });
  writeFileSync(themeFile, themeBefore);
  await browser.close();
}

const failed = results.filter((r) => !r.manual && r.ratio < r.min);
const manual = results.filter((r) => r.manual);
const checked = results.filter((r) => !r.manual);
if (reportFile) writeFileSync(reportFile, JSON.stringify(results, null, 1));

// Failures grouped by cause: the block, its design (card, button …), the section colour, the part and the colours, with the
// views each is in (the full list of pairs is in the file CONTRAST_REPORT names).
const design = (v) =>
  v
    .split(/\s+/)
    .filter((c) => /^(card|button)-/.test(c))
    .join(' ') || '-';
const groups = new Map();
for (const r of failed) {
  const key = [r.block.replace(/^editor /, ''), design(r.variant), r.section, r.kind, r.fg, r.bg].join(' | ');
  const g = groups.get(key) ?? { r, views: new Set(), worst: 99, text: r.text };
  g.views.add(r.view.split(' ').slice(1).join(' '));
  g.worst = Math.min(g.worst, r.ratio);
  groups.set(key, g);
}
console.log(
  `Contrast: ${checked.length} pairs checked (${themes.join(', ')}; ${Math.round((Date.now() - started) / 1000)} s), ${failed.length} fail in ${groups.size} groups, ${manual.length} need a manual look (image or gradient behind).`,
);
for (const [key, g] of [...groups].sort((a, b) => a[1].worst - b[1].worst).slice(0, 60)) {
  console.log(`  ${key}: ${g.worst.toFixed(2)}:1 (needs ${g.r.min}) "${g.text}" in ${g.views.size} views, e.g. ${[...g.views][0]}`);
}
if (groups.size > 60) console.log(`  … and ${groups.size - 60} more groups (see the report file).`);
if (failed.length) process.exit(1);
