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

/** The values of the choices a field offers, read from the block's code: `buttonKinds` (src/standard/view.tsx) or the `options` of the field `name` in the block's index.tsx. */
export function offeredValues(source, name) {
  const at = source.search(new RegExp(`name:\\s*'${name}'`));
  if (at < 0) return [];
  const from = source.indexOf('options: [', at);
  const end = from < 0 ? -1 : source.indexOf('\n      ],', from);
  if (end < 0) return [];
  return [...source.slice(from, end).matchAll(/value:\s*'([^']*)'/g)].map((m) => m[1]);
}

/** The styles that must each be shown: [block, prop, the value an empty prop stands for]; the values come from the editor's code. */
export const styleChecks = [
  ['cards', 'design', ''],
  ['cards', 'color', ''],
  ['cards', 'media', 'icon'],
  ['cards', 'phone', ''],
  ['segmented', 'show', ''],
  ['posts', 'design', ''],
  ['posts', 'show', 'categories'],
  ['testimonials', 'layout', 'cards'],
];

const propsOf = (text, type) =>
  [...text.matchAll(/data-block="([^"]+)" data-props="([^"]*)"/g)]
    .filter((m) => m[1] === type)
    .map((m) => JSON.parse(m[2].replaceAll('&quot;', '"').replaceAll('&amp;', '&')));

/** What the page does not show of the styles a block offers: every button kind, and each value of the choices in styleChecks, plus a table with and without header and rows with a background. */
export function styleProblems(text, dir = join(root, 'src/standard')) {
  const problems = [];
  const buttons = propsOf(text, 'buttons').flatMap((p) => p.items ?? []);
  const view = readFileSync(join(dir, 'view.tsx'), 'utf8');
  const kinds = [...(view.match(/buttonKinds = \[([^\]]*)\]/)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
  if (!kinds.length) problems.push('buttonKinds not found in src/standard/view.tsx.');
  for (const k of kinds) {
    if (!buttons.some((b) => (b.kind ?? 'filled') === k)) problems.push(`The Buttons example shows no "${k}" button.`);
  }
  for (const [type, prop, empty] of styleChecks) {
    const file = join(dir, type, 'index.tsx');
    const values = existsSync(file) ? offeredValues(readFileSync(file, 'utf8'), prop) : [];
    if (!values.length) {
      problems.push(`No options found for "${prop}" of "${type}" in its code; fix styleChecks (scripts/demo-blocks.mjs).`);
      continue;
    }
    const blocks = propsOf(text, type);
    for (const v of values) {
      if (!blocks.some((p) => (p[prop] || empty) === v))
        problems.push(`The Blocks page shows no "${type}" with ${prop} "${v || 'default'}".`);
    }
  }
  const tables = propsOf(text, 'table');
  if (!tables.some((p) => p.header === false)) problems.push('The Blocks page shows no table without a header row.');
  if (!tables.some((p) => p.striped === true)) problems.push('The Blocks page shows no striped table.');
  return problems;
}

export const demoBlocksPage = () => readFileSync(join(root, 'demo/src/content/pages/blocks.md'), 'utf8');
