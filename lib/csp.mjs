// The Content Security Policy of every page the site builds, as a <meta http-equiv> at the top of its <head>: the
// browser runs only the scripts the build put in the page (each inline one by its hash) and those from the site's own
// address, and loads from elsewhere only what is allowed below. So HTML that gets into a page after the build (in the
// editor's preview, by a fault in a script) can run nothing. What the build wrote is trusted: the addresses of the
// scripts, frames and pictures in a page (HTML written in a page's text, an embed) are allowed on that page.
// Allowed everywhere besides: the videos (video.mjs plays them from YouTube's and Vimeo's players), what the site gives
// (`site`: its measuring, packages/editor/site/siteCsp.mjs) and what each app installed gives (`src/apps/<app>/csp.json`, in
// packages/editor/site/siteCsp.mjs too), with the addresses allowed in the editor (the site's own, config.csp). The editor's page (/editor/) has its own, stricter policy: GitHub, the stills of the videos,
// and nothing of the site's or the apps'. Styles may be inline (the pages have style="…" and React sets them).
// A meta tag cannot say who may frame a page; X-Frame-Options in packages/editor/pages/_headers.txt does.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { joined } from './cspSources.mjs';

// What a site or an app may add to the policy, and the checks of it, without Node, so the site's Worker can use them too.
export { allows, isSource, joined, KINDS, kindOf, sourcesProblems } from './cspSources.mjs';

/** @typedef {import('./cspSources.mjs').Sources} Sources */

/** What the videos need on the site: their players, put in place when a video is played (video.mjs). */
const VIDEOS = { frame: ['https://www.youtube-nocookie.com', 'https://player.vimeo.com'] };

/** What the editor needs (GitHub it asks through the site's Worker, on its own address: github.ts): Vimeo's details of a video and the stills of the videos
 * (standard/video/view.ts), and what it makes in the browser (pictures, files) as blob: and data:. */
const EDITOR = {
  img: ['blob:', 'https://i.ytimg.com', 'https://i.vimeocdn.com', 'https://images.unsplash.com'],
  connect: ['blob:', 'data:', 'https://vimeo.com', 'https://api.unsplash.com'],
};

// An inline script that runs (not JSON, JSON-LD or a template).
const RUNS = /^(module|text\/javascript|application\/javascript)?$/i;
const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const attr = (attrs, name) => new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, 'i').exec(attrs)?.[1];

/** The hash of each inline script that runs in a page, as CSP writes it. @param {string} html */
export function scriptHashes(html) {
  const hashes = new Set();
  for (const [, attrs, code] of html.matchAll(SCRIPT))
    if (attr(attrs, 'src') === undefined && RUNS.test(attr(attrs, 'type') ?? ''))
      hashes.add(`'sha256-${createHash('sha256').update(code, 'utf8').digest('base64')}'`);
  return [...hashes];
}

/** The other addresses (origins) a page's HTML loads its scripts, frames and pictures from.
 * @param {string} html @returns {Required<Pick<Sources, 'script' | 'frame' | 'img'>>} */
export function pageOrigins(html) {
  const found = { script: new Set(), frame: new Set(), img: new Set() };
  const add = (set, url) => {
    try {
      const { protocol, origin } = new URL(url.replace(/&amp;/g, '&'));
      if (protocol === 'https:' || protocol === 'http:') set.add(origin);
    } catch {}
  };
  for (const [, attrs] of html.matchAll(/<script\b([^>]*)>/gi)) add(found.script, attr(attrs, 'src') ?? '');
  for (const [, attrs] of html.matchAll(/<iframe\b([^>]*)>/gi)) add(found.frame, attr(attrs, 'src') ?? attr(attrs, 'data-src') ?? '');
  for (const [, attrs] of html.matchAll(/<(?:img|source)\b([^>]*)>/gi)) {
    add(found.img, attr(attrs, 'src') ?? '');
    for (const part of (attr(attrs, 'srcset') ?? '').split(',')) add(found.img, part.trim().split(/\s+/)[0]);
  }
  return { script: [...found.script], frame: [...found.frame], img: [...found.img] };
}

/** The policy, from its directives (an empty one is left out, `none` when it must say so).
 * @param {Record<string, (string | undefined)[]>} directives */
function policy(directives) {
  return Object.entries(directives)
    .map(([name, values]) => [name, [...new Set(values.filter(Boolean))]])
    .map(([name, values]) => `${name} ${values.length ? values.join(' ') : "'none'"}`)
    .join('; ');
}

/** A page's policy: on the site, or the editor's (`editor`). @param {string} html
 * @param {{ editor?: boolean, site?: Sources, images?: string[] }} options */
export function pagePolicy(html, { editor = false, site = {}, images = [] }) {
  const page = pageOrigins(html);
  const s = editor ? joined(EDITOR, { img: images }) : joined(VIDEOS, site, page);
  return policy({
    'default-src': ["'self'"],
    'script-src': ["'self'", ...scriptHashes(html), ...s.script],
    'style-src': ["'self'", "'unsafe-inline'", ...s.style],
    'img-src': ["'self'", 'data:', ...s.img],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", ...s.connect],
    'media-src': ["'self'", ...(editor ? ['blob:', 'data:'] : [])],
    // The editor shows a page in a frame of its own (srcdoc, PageFrame in ui.tsx).
    'frame-src': editor ? ["'self'", 'blob:', 'data:'] : s.frame,
    'worker-src': ["'self'"],
    'form-action': ["'self'", ...s.form],
    'object-src': [],
    'base-uri': ["'self'"],
  });
}

/** The policy as the first thing in a page's <head> (after its charset, which must stay in its first bytes).
 * @param {string} html @param {string} value */
export function withPolicy(html, value) {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">`;
  const at = /<meta\s+charset\s*=\s*"?[\w-]+"?\s*\/?>/i.exec(html) ?? /<head\b[^>]*>/i.exec(html);
  if (!at) return undefined;
  const end = at.index + at[0].length;
  return html.slice(0, end) + meta + html.slice(end);
}

/** The Astro integration that writes the policy into every page built (packages/editor/astro.mjs).
 * @param {{ site?: Sources }} [options] @returns {import('astro').AstroIntegration} */
export function csp({ site = {} } = {}) {
  return {
    name: 'content-security-policy',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const files = readdirSync(root, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.html'));
        const pages = files.map((file) => ({ file, html: readFileSync(join(root, file), 'utf8') }));
        // The editor shows the site's pages in its preview, with their pictures.
        const images = [...new Set(pages.flatMap((p) => pageOrigins(p.html).img))];
        const missing = [];
        for (const { file, html } of pages) {
          const editor = file.split(/[\\/]/)[0] === 'editor';
          const out = withPolicy(html, pagePolicy(html, { editor, site, images }));
          if (out) writeFileSync(join(root, file), out);
          else missing.push(file);
        }
        if (missing.length) throw new Error(`Content-Security-Policy: ingen <head> i ${missing.join(', ')}`);
        logger.info(`${pages.length} sider har en Content-Security-Policy.`);
      },
    },
  };
}
