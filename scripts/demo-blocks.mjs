// The demo's Blocks page (demo/src/content/pages/blocks.md) shows what the editor has today: every block it offers
// has a section, and no block on the page is one the editor no longer has. Run by `npm run check:demo` (check-demo.mjs)
// and tested in demo-blocks.test.mjs.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

/** Blocks the editor keeps only for old content (`former: true` in their index.tsx): not offered, so not on the page. */
export const legacyBlocks = {
  accordion: 'Expandable list is a Segmented list now; kept for old text that has one.',
  checklist: 'Check lists are typed in the text (lib/remark-checklist.mjs); the block stays for hidden lists and lists without points.',
  hero: 'The Banner is a section now (lib/remark-banner-section.mjs); still read and drawn where a text has one.',
  links: 'Link collection is a List now; kept for old text that has one.',
  points: 'Points with icon are a List now (lib/blocks.mjs); kept for old text that has one.',
};

/** The standard block types the editor offers (a folder with an index.tsx that is not `former`), and the former ones. */
export function editorBlocks(dir = join(root, 'src/standard')) {
  const offered = [];
  const former = [];
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, d.name, 'index.tsx');
    if (!d.isDirectory() || !existsSync(file)) continue;
    (/^\s*former:\s*true/m.test(readFileSync(file, 'utf8')) ? former : offered).push(d.name);
  }
  return { offered: offered.sort(), former: former.sort() };
}

/** The `data-block` types on a page's text. */
export const typesOnPage = (text) => [...new Set([...text.matchAll(/data-block="([^"]+)"/g)].map((m) => m[1]))].sort();

/** What is wrong between the page and the editor; empty when they agree. */
export function demoBlocksProblems(text, { offered, former }, legacy = legacyBlocks) {
  const problems = [];
  const onPage = typesOnPage(text);
  for (const type of onPage) {
    if (type in legacy) problems.push(`Blocks page shows "${type}", a legacy block the editor no longer offers (${legacy[type]}).`);
    else if (!offered.includes(type)) problems.push(`Blocks page shows "${type}", which is not an editor block.`);
  }
  for (const type of offered) {
    if (!onPage.includes(type)) problems.push(`The editor offers "${type}", but the Blocks page has no section for it.`);
  }
  for (const type of former) {
    if (!(type in legacy))
      problems.push(`"${type}" is marked former in the editor but not listed in legacyBlocks (scripts/demo-blocks.mjs).`);
  }
  for (const type of Object.keys(legacy)) {
    if (!former.includes(type))
      problems.push(`legacyBlocks lists "${type}", which is not a former block in the editor; remove it or show it.`);
  }
  return problems;
}

export const demoBlocksPage = () => readFileSync(join(root, 'demo/src/content/pages/blocks.md'), 'utf8');
