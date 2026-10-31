// Automatic internal links. The words come from the pages and posts themselves: their keywords
// (`keyword`, the primary one, and `keywords`, more separated by commas; under
// "Søgemaskiner" in the editor; the front page's link to / and the blog page's to /blog/, where they are shown, and the
// 404 page's to nowhere). src/data/internal-links.json, under "Søgemaskineoptimering" ›
// "Interne links" in the editor (packages/editor/defaults/internalLinks.ts): `enabled` turns the links on or off, `maxPerPage` is the
// most per page. A word links to the page it is a
// keyword of. Unlike linking every occurrence of a word, a target is
// linked once per page, at most `maxPerPage` links per page, never to the page itself, never inside
// headings or existing links, and never as part of a word joined with a hyphen (not "web" in "web-design"). Used by the Markdown pipeline (packages/editor/astro.mjs) and by an import
// script, which removes the old plugin links so they are not doubled. Each link has data-link="auto", so how many there
// are of each word can be counted after the build (packages/editor/scripts/link-counts.mjs, /editor/links.json).
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { isPreview, livePath } from './noindex.mjs';
import { stateOf } from '@interstellarcms/cms/lib/status.mjs';

const FILE = path.resolve('src/data/internal-links.json');
// The front page, the blog page and the 404 page ("Indstillinger" › "Udseende" › "Standardsider",
// packages/editor/defaults/standardPages.ts): the front page's address sends on to /, the blog page's to /blog/, and the 404 page has none.
const STANDARD = path.resolve('src/data/standard-pages.json');
const PAGES = path.resolve('src/content/pages');
const POSTS = path.resolve('src/content/blog');
// What a word may not touch to be linked: a letter, a digit, or a hyphen joining it to another word.
const LETTER = '\\p{L}\\p{N}-';
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const split = (text) =>
  String(text ?? '')
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean);

let standard;
/** A page's address as it is linked to: the front page's is /, the blog page's /blog/, and the 404 page's none (null). */
function linked(href) {
  standard ??= (() => {
    try {
      return JSON.parse(fs.readFileSync(STANDARD, 'utf8'));
    } catch {
      return {};
    }
  })();
  if (href === standard.front) return '/';
  if (href === standard.blog) return '/blog/';
  return href === standard.notFound ? null : href;
}

/** The .md files in a folder and its subfolders, as paths relative to it (none when there is no folder). */
const files = (dir) =>
  fs.existsSync(dir) ? fs.readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('.md')) : [];
const frontmatter = (file) => parse(fs.readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '') ?? {};

/** The keywords of the pages and posts: [{ href, primary, secondary }]. A page's address is its
 * `path`, or else its file name (getPages() in packages/editor/site/content.ts); a new version of a page (/ny/…)
 * gives its keywords to the page it is for, when that page exists. Only published ones are linked to
 * (packages/editor/lib/status.mjs). */
function keywordRules() {
  const entries = [
    ...files(PAGES).map((f) => {
      const data = frontmatter(path.join(PAGES, f));
      const id = f
        .replace(/\\/g, '/')
        .replace(/\.md$/, '')
        .replace(/(^|\/)index$/, '');
      return { href: data.path || `/${id}/`, data };
    }),
    ...files(POSTS).map((f) => ({ href: `/${path.basename(f, '.md')}/`, data: frontmatter(path.join(POSTS, f)) })),
  ].filter((e) => stateOf(e.data) === 'published');
  const live = new Set(
    entries
      .map((e) => e.href)
      .filter((href) => !isPreview(href))
      .map(linked),
  );
  return entries
    .map(({ href, data }) => ({ href: linked(livePath(href)), primary: split(data.keyword), secondary: split(data.keywords) }))
    .filter((r) => r.href && live.has(r.href) && (r.primary.length || r.secondary.length))
    .sort((a, b) => a.href.localeCompare(b.href));
}

let cached;
/** { enabled, maxPerPage, words: Map<lowercase word, href>, pattern } */
export function loadLinks() {
  if (cached) return cached;
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const enabled = data.enabled !== false;
  const maxPerPage = Number.isFinite(data.maxPerPage) ? data.maxPerPage : 8;
  // A word used for two pages links to the one it is the primary keyword of, then to the one it is
  // a secondary keyword of; between equals, to the first by address.
  const rules = keywordRules();
  const ranked = [...rules.map((r) => ({ href: r.href, words: r.primary })), ...rules.map((r) => ({ href: r.href, words: r.secondary }))];
  const words = new Map();
  for (const { href, words: list } of ranked)
    for (const word of list) {
      const key = word.toLowerCase();
      if (!words.has(key)) words.set(key, href);
      else if (words.get(key) !== href) console.warn(`interne links: "${word}" linker til ${words.get(key)}, ikke ${href}`);
    }
  // One regex for all words, longest first so "tryg tilknytning" wins over shorter matches.
  const all = [...words.keys()].sort((a, b) => b.length - a.length).map(escape);
  const pattern = new RegExp(`(?<![${LETTER}])(${all.join('|')})(?![${LETTER}])`, 'giu');
  cached = { enabled, maxPerPage, words, pattern };
  return cached;
}

// Not inside links, headings, code, or the offer and price boxes.
const SKIP = new Set(['aside', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'button', 'figcaption', 'dl']);

/** The URL of the page being rendered: front matter `path` (pages) or /<file name>/ (posts). A new
 * version of a page (/ny/…) counts as the page it is for, so it links as it will once it replaces it. */
function pagePath(file) {
  const fm = file.data?.astro?.frontmatter;
  if (fm?.path) return linked(livePath(fm.path));
  const name = path.basename(file.path ?? '', '.md');
  return name ? linked(`/${name}/`) : '';
}

/** The pages a block in the text links to (packages/editor/lib/blocks.mjs): its `href` fields (emner, priskort,
 * knapper, Kort), the links in its texts (spørgsmål og svar) and the posts it picks. */
function blockLinks(node) {
  let props;
  try {
    props = JSON.parse(String(node.properties.dataProps ?? '{}'));
  } catch {
    return [];
  }
  const links = [];
  const visit = (value, key) => {
    if (typeof value === 'string') {
      if (key === 'href' && value.startsWith('/')) links.push(value.split('#')[0]);
      for (const m of value.matchAll(/\]\((\/[^)\s#]*)/g)) links.push(m[1]);
    } else if (Array.isArray(value)) value.forEach((v) => visit(v, key));
    else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => visit(v, k));
  };
  visit(props);
  if (node.properties.dataBlock === 'posts' && Array.isArray(props.picked)) links.push(...props.picked.map((id) => `/${id}/`));
  return links;
}

/** What every page's links are made from: the words and where each links to, whether they are on and how many there
 * are per page, and this file. Given to the plugin in packages/editor/astro.mjs, so it is in Astro's config: a page's text is
 * kept rendered between builds (node_modules/.astro) until it or the config changes, and a keyword changed on one page
 * changes the links on the others, so then every page is rendered again. */
export function linksDigest() {
  const { enabled, maxPerPage, words } = loadLinks();
  const text = JSON.stringify([enabled, maxPerPage, [...words], fs.readFileSync(new URL(import.meta.url), 'utf8')]);
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
}

/** Rehype plugin; `digest` (linksDigest) is not used here. */
export function rehypeAutoLinks() {
  return (tree, file) => {
    const { enabled, maxPerPage, words, pattern } = loadLinks();
    if (!enabled || !words.size) return;
    const self = pagePath(file);
    const used = new Set([self]);
    // Targets the text already links to by hand, or a block on the page links to, are not linked again.
    const collect = (node) => {
      if (node.type === 'element' && node.tagName === 'a') used.add(String(node.properties?.href ?? '').split('#')[0]);
      if (node.type === 'element' && node.properties?.dataBlock) blockLinks(node).forEach((href) => used.add(href));
      node.children?.forEach(collect);
    };
    collect(tree);
    let count = 0;

    const walk = (node) => {
      if (!node.children || count >= maxPerPage) return;
      if (node.type === 'element' && SKIP.has(node.tagName)) return;
      const out = [];
      for (const child of node.children) {
        if (child.type !== 'text' || count >= maxPerPage) {
          walk(child);
          out.push(child);
          continue;
        }
        let last = 0;
        for (const m of child.value.matchAll(pattern)) {
          const href = words.get(m[1].toLowerCase());
          if (used.has(href) || count >= maxPerPage) continue;
          used.add(href);
          count++;
          if (m.index > last) out.push({ type: 'text', value: child.value.slice(last, m.index) });
          // data-link="auto": counted after the build (packages/editor/scripts/link-counts.mjs), for the editor's list of keywords.
          out.push({ type: 'element', tagName: 'a', properties: { href, dataLink: 'auto' }, children: [{ type: 'text', value: m[1] }] });
          last = m.index + m[1].length;
        }
        if (last < child.value.length) out.push({ type: 'text', value: child.value.slice(last) });
      }
      node.children = out;
    };
    walk(tree);
  };
}

/** For the migration: turn links whose text is one of the words back into plain text. */
export function unlinkAutoWords(markdown) {
  const { words } = loadLinks();
  return markdown.replace(/(?<!!)\[([^\]\[]+)\]\((\/[^)\s]*)\)/g, (all, text) => (words.has(text.trim().toLowerCase()) ? text : all));
}
