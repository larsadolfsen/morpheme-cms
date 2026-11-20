// The demo's Names view, put in the demo's built pages (run by scripts/demo-build.mjs after astro builds, never by the starter or a
// site): each page gets `<script src="/demo-names.js" defer data-blocks="type=Name|…">`, a same-origin script the pages' Content-Security-Policy
// already allows ('self'), so nothing is loosened. The block names are the editor's own (src/i18n/en-US/blocks.ts), in the order the
// blocks are on the page, which the script lays over the blocks it finds.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const BLOCK = /<div data-block="([a-z]+)"(?: data-props="([^"]*)")?\s*><\/div>/g;
// Read as text, not imported: the file is TypeScript, which not every Node runs (the build of the demo may be on an older one).
const names = {};
let key = '';
for (const line of readFileSync(fileURLToPath(new URL('../src/i18n/en-US/blocks.ts', import.meta.url)), 'utf8').split('\n')) {
  const open = /^ {2}(\w+): \{$/.exec(line);
  if (open) key = open[1].toLowerCase();
  else if (key && !names[key]) {
    const label = /^ {4}label: '(.*)',$/.exec(line);
    if (label) names[key] = label[1].replace(/\\'/g, "'");
  }
}

const frontPath = (md) => /^path:\s*"([^"]+)"/m.exec(md)?.[1];

/** The blocks of a page's text that show, as `type=Name`, in order. */
export function blockNames(md) {
  return [...md.matchAll(BLOCK)]
    .filter(([, , props]) => !/&quot;hidden&quot;:true/.test(props ?? ''))
    .map(([, type]) => `${type}=${names[type] ?? type}`);
}

/** Puts the script in every page of `dist` (not the editor's). @param {string} site the demo site's folder */
export function addNamesView(site) {
  const pages = join(site, 'src/content/pages');
  const blocksOf = new Map();
  for (const file of readdirSync(pages).filter((f) => f.endsWith('.md'))) {
    const md = readFileSync(join(pages, file), 'utf8');
    const path = frontPath(md);
    if (path) blocksOf.set(path, blockNames(md));
  }
  const dist = join(site, 'dist');
  let n = 0;
  for (const file of readdirSync(dist, { recursive: true, encoding: 'utf8' })) {
    if (!file.endsWith('.html') || file.split(/[\\/]/)[0] === 'editor') continue;
    const path = `/${file.replace(/\\/g, '/').replace(/index\.html$/, '')}`;
    const list = blocksOf.get(path) ?? [];
    const html = readFileSync(join(dist, file), 'utf8');
    if (!html.includes('</body>')) continue;
    const data = list.length ? ` data-blocks="${list.join('|').replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"` : '';
    writeFileSync(join(dist, file), html.replace('</body>', `<script src="/demo-names.js" defer${data}></script></body>`));
    n++;
  }
  return n;
}
