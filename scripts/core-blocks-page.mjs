// The system's test page for the core blocks: one page with every block the editor offers (src/standard/<type>/), the ones with
// kinds and designs in each of them. It is the pages of the demo's Blocks (demo/src/content/pages/blocks-*.md, which ship with the package) in one page
// for the blocks it shows, and the blocks it does not show are added here with props that are valid for them. `noindex` and `nofollow` are
// the CMS's own SEO settings ("Hide from search engines", "No follow"): the page is marked for robots and is not in the sitemap (check-test-page.mjs
// checks that both hold). Written only to a temporary copy of a site (test-site.mjs), never to a site's own folder.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { blockHtml } from '../lib/blocks.mjs';
import { demoBlocksTestBody } from './demo-blocks.mjs';

export const CORE_PAGE_ID = 'morpheme-check-page';
export const CORE_PAGE_FILE = `src/content/pages/${CORE_PAGE_ID}.md`;

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

/** The types of the core blocks: the folders in src/standard/ with an index.tsx (the registry collects them the same way). @returns {string[]} */
export const coreBlockTypes = () =>
  readdirSync(here('../src/standard'), { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(here(`../src/standard/${d.name}/index.tsx`)))
    .map((d) => d.name)
    .sort();

/** Blocks the demo's Blocks pages do not show, with valid props. */
export const EXTRA_BLOCKS = {
  checklist: { items: ['First point', 'Second point'] },
  rows: { from: 'highlights', howMany: 3 },
};

/** The text of the test page: the examples of the demo's Blocks pages (every component page, one after the other) with this page's own front matter, and the blocks they lack at the end. @returns {string} */
export function coreBlocksPage() {
  const body = demoBlocksTestBody();
  const shown = new Set([...body.matchAll(/data-block="([a-z]+)"/g)].map((m) => m[1]));
  const extra = coreBlockTypes()
    .filter((type) => !shown.has(type))
    .map((type) => `## ${type}\n\n${blockHtml(type, EXTRA_BLOCKS[type] ?? {})}`);
  return `---\ntitle: "Morpheme check page"\ndescription: "Every core block, for the checks."\nnoindex: true\nnofollow: true\n---\n${body.trimEnd()}\n\n${extra.join('\n\n')}\n`;
}

/**
 * What the temporary copy needs besides the page: the demo's images the page shows and the demo's Library entries for them (their alt
 * texts), for what the site does not have. Library entries are given by name, so one the site has is not replaced.
 * @param {string} root the site's root
 * @returns {{ files: Record<string, string>, copies: { from: string, to: string }[] }}
 */
export function coreTestSite(root) {
  const library = here('../demo/src/data/files');
  const files = { [CORE_PAGE_FILE]: coreBlocksPage() };
  for (const name of existsSync(library) ? readdirSync(library) : [])
    if (!existsSync(`${root}/src/data/files/${name}`)) files[`src/data/files/${name}`] = readFileSync(`${library}/${name}`, 'utf8');
  return { files, copies: [{ from: here('../demo/public/images/uploads'), to: 'public/images/uploads' }] };
}
