// Critical CSS: a built page carries only the styles its first screen needs, inline, and loads the site's whole stylesheet
// (_astro/*.css, cached once for every page) without blocking the first render. Astro builds the pages with a plain
// <link rel="stylesheet"> (astro.mjs, `inlineStylesheets: 'never'`); this step runs after the build and before the policy
// (lib/csp.mjs), so the loader script below gets its hash like every other inline script.
//
// A page is only changed when its critical CSS was made. On any failure (no extractor, an extractor that throws or returns
// nothing, a stylesheet that cannot be read) the page keeps the plain, blocking <link>: slower, never unstyled.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beastiesExtractor } from './criticalExtract.mjs';

/** Turns the blocking stylesheet link back on once the page is parsed: the full sheet is loaded already (at low priority), and
 * what the first screen needs is in the page. A script, not an `onload` attribute, because the policy allows scripts by hash only. */
export const LOADER = "for(const l of document.querySelectorAll('link[data-mo-css]'))l.media='all'";

const LINK = /<link\b[^>]*>/gi;
const attr = (tag, name) => new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i').exec(tag)?.[1];

/** The stylesheets of a page that are files of the site (not another address), as `{ tag, href }`. @param {string} html */
export function stylesheetLinks(html) {
  return [...html.matchAll(LINK)]
    .filter(([tag]) => /^stylesheet$/i.test(attr(tag, 'rel') ?? '') && !attr(tag, 'media') && !/\sdata-mo-css\b/.test(tag))
    .map(([tag]) => ({ tag, href: attr(tag, 'href') ?? '' }))
    .filter(({ href }) => href.startsWith('/') && !href.startsWith('//') && /\.css(\?|$)/.test(href));
}

/** The at-rules the critical CSS needs whole, whatever the page's markup shows: every `@font-face` (without it the first paint uses the
 * fallback font and the page shifts when the real one arrives) and the `@keyframes` an inline rule names. Rules the critical CSS has already are left out.
 * @param {string} css the whole stylesheet @param {string} critical what was found for the page */
export function neededAtRules(css, critical) {
  const rules = [...css.matchAll(/@font-face\s*\{[^{}]*\}/g)].map((m) => m[0]);
  for (const m of css.matchAll(/@keyframes\s+([\w-]+)\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g)) {
    if (new RegExp(`animation[^;{}]*[\\s:,]${m[1]}(?![\\w-])`).test(critical)) rules.push(m[0]);
  }
  return rules.filter((rule) => !critical.includes(rule)).join('');
}

/** The page with its critical CSS inline and its stylesheets loaded without blocking, or `undefined` to keep the page as it is.
 * @param {string} html @param {(href: string) => string | undefined} read the text of a stylesheet, by its address
 * @param {(input: { html: string, css: string }) => Promise<string | undefined> | string | undefined} extract the critical CSS of a page, from its whole stylesheet */
export async function withCriticalCss(html, read, extract) {
  const links = stylesheetLinks(html);
  if (!links.length || html.includes('<style data-critical>') || !/<\/head\s*>/i.test(html)) return undefined;
  try {
    const css = links.map(({ href }) => read(href));
    if (css.some((c) => typeof c !== 'string')) return undefined;
    const sheet = css.join('\n');
    const found = await extract({ html, css: sheet });
    // Nothing found, or text that would end its own <style>: keep the blocking link.
    if (!found?.trim() || /<\/style/i.test(found)) return undefined;
    const critical = found + neededAtRules(sheet, found);
    if (/<\/style/i.test(critical)) return undefined;
    let out = html;
    for (const { tag, href } of links) {
      const late = tag.replace(/\s*\/?>$/, ' media="print" data-mo-css>');
      out = out.replace(tag, `${late}<noscript><link rel="stylesheet" href="${href}"></noscript>`);
    }
    // The critical CSS goes before the first stylesheet, so the page's own rules come after it in the cascade as they did.
    const first = out.search(/<link\b[^>]*data-mo-css/i);
    out = `${out.slice(0, first)}<style data-critical>${critical}</style>${out.slice(first)}`;
    return out.replace(/<\/head\s*>/i, `<script>${LOADER}</script></head>`);
  } catch {
    return undefined;
  }
}

/** The Astro integration (astro.mjs): critical CSS in every page of the site after it is built. The editor's page (/editor/) keeps its link.
 * @param {{ extractor?: (root: string) => Promise<((input: { html: string, css: string }) => Promise<string | undefined> | string | undefined) | undefined> }} [options] @returns {import('astro').AstroIntegration} */
export function criticalCss({ extractor = beastiesExtractor } = {}) {
  return {
    name: 'critical-css',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const extract = await extractor(root).catch(() => undefined);
        if (!extract) return logger.info('Critical CSS: no extractor, the pages keep their stylesheet link.');
        const sheets = new Map();
        const read = (href) => {
          const path = href.split('?')[0];
          if (!sheets.has(path)) {
            try {
              sheets.set(path, readFileSync(join(root, path), 'utf8'));
            } catch {
              sheets.set(path, undefined);
            }
          }
          return sheets.get(path);
        };
        let done = 0;
        const files = readdirSync(root, { recursive: true, encoding: 'utf8' }).filter(
          (f) => f.endsWith('.html') && f.split(/[\\/]/)[0] !== 'editor',
        );
        for (const file of files) {
          const html = readFileSync(join(root, file), 'utf8');
          const out = await withCriticalCss(html, read, extract);
          if (out) {
            writeFileSync(join(root, file), out);
            done++;
          }
        }
        logger.info(`Critical CSS in ${done} of ${files.length} pages; the others keep their stylesheet link.`);
      },
    },
  };
}
