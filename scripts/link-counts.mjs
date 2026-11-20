// After the build: how many pages and posts each keyword links from (packages/editor/site/autolinks.mjs gives its links
// data-link="auto"), in dist/editor/links.json, for "Keywords" under "Internal links" in the editor (Keywords.tsx):
// { enabled, maxPerPage, words: { "<word in lower case>": { href, pages } } } (`enabled` and `maxPerPage`: the settings of the links, which the editor's
// Preview links the text with, pagePreview.tsx), counted in the built pages, without the new versions under
// /new/ and the editor. A keyword without links is not in it.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { isPreview } from '@morphemecms/cms/site/noindex.mjs';
import { loadLinks } from '@morphemecms/cms/site/autolinks.mjs';

const ROOT = `${process.cwd()}/`;
const DIST = join(ROOT, process.argv[2] ?? 'dist');
const LINK = /<a href="([^"]+)" data-link="auto">([^<]+)<\/a>/g;
const { enabled, maxPerPage } = loadLinks();
const words = {};
for (const file of readdirSync(DIST, { recursive: true, encoding: 'utf8' }).filter((f) => f.endsWith('index.html'))) {
  const path = `/${file.replace(/index\.html$/, '')}`;
  if (path.startsWith('/editor/') || isPreview(path)) continue;
  for (const [, href, text] of readFileSync(join(DIST, file), 'utf8').matchAll(LINK)) {
    const word = text.toLowerCase();
    words[word] ??= { href, pages: 0 };
    words[word].pages++;
  }
}
writeFileSync(join(DIST, 'editor', 'links.json'), `${JSON.stringify({ enabled, maxPerPage, words })}\n`);
