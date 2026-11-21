// The demo's Blocks pages (demo/src/content/pages/blocks.md, the index, and blocks-<name>.md, one page for each component or special block)
// show what the editor has today: every block it offers has an example, no block on them is one the editor no longer has, and every example
// is on the page of the component that draws it. Run by `npm run check:demo` (check-demo.mjs) and tested in demo-blocks.test.mjs.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

/** Blocks the editor keeps only for old content (`former: true` in their index.tsx): not offered, so not on the page. */
export const legacyBlocks = {
  checklist: 'Check lists are typed in the text (lib/remark-checklist.mjs); the block stays for hidden lists and lists without points.',
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
    if (type in legacy) problems.push(`Blocks pages show "${type}", a legacy block the editor no longer offers (${legacy[type]}).`);
    else if (!offered.includes(type)) problems.push(`Blocks pages show "${type}", which is not an editor block.`);
  }
  for (const type of offered) {
    if (!onPage.includes(type)) problems.push(`The editor offers "${type}", but the Blocks pages have no example of it.`);
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

/** The values of the choices a field offers, read from the block's code: `blockButtonKinds` (src/standard/view.tsx) or the `options` of the field `name` in the block's index.tsx. */
export function offeredValues(source, name) {
  const at = source.search(new RegExp(`name:\\s*'${name}'`));
  if (at < 0) return [];
  const from = source.indexOf('options: [', at);
  const close = from < 0 ? -1 : source.slice(from).search(/\n\s*\],/);
  const end = close < 0 ? -1 : from + close;
  if (end < 0) return [];
  return [...source.slice(from, end).matchAll(/value:\s*'([^']*)'/g)].map((m) => m[1]);
}

/** The styles that must each be shown: [block, prop, the value an empty prop stands for]; the values come from the editor's code. */
export const styleChecks = [
  ['cards', 'design', ''],
  ['cards', 'color', ''],
  ['cards', 'media', 'icon'],
  ['cards', 'phone', ''],
  ['list', 'design', '', 'rows/listParts.ts'],
  ['expand', 'design', '', 'rows/listParts.ts'],
  ['posts', 'design', ''],
  ['posts', 'show', 'categories'],
  ['testimonials', 'layout', 'cards'],
  ['imagegrid', 'card', 'filled'],
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
  const kinds = [...(view.match(/blockButtonKinds = \[([^\]]*)\]/)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((m) => m[1]);
  if (!kinds.length) problems.push('blockButtonKinds not found in src/standard/view.tsx.');
  for (const k of kinds) {
    if (!buttons.some((b) => (b.kind ?? 'filled') === k)) problems.push(`The Buttons example shows no "${k}" button.`);
  }
  for (const [type, prop, empty, source] of styleChecks) {
    const file = join(dir, source ?? join(type, 'index.tsx'));
    const values = existsSync(file) ? offeredValues(readFileSync(file, 'utf8'), prop) : [];
    if (!values.length) {
      problems.push(`No options found for "${prop}" of "${type}" in its code; fix styleChecks (scripts/demo-blocks.mjs).`);
      continue;
    }
    const blocks = propsOf(text, type);
    for (const v of values) {
      if (!blocks.some((p) => (p[prop] || empty) === v))
        problems.push(`The Blocks pages show no "${type}" with ${prop} "${v || 'default'}".`);
    }
  }
  const tables = propsOf(text, 'table');
  if (!tables.some((p) => p.header === false)) problems.push('The Blocks pages show no table without a header row.');
  if (!tables.some((p) => p.striped === true)) problems.push('The Blocks pages show no striped table.');
  return problems;
}

/**
 * The pages of the demo's Blocks, by their address `/blocks/<slug>/` (file `blocks-<slug>.md`). A page is one main component that draws
 * its examples (kind `basic`: a plain arrangement of the owner's own rows, cells, buttons and media, which the component draws), or one
 * special block (kind `special`: it has its own content source or its own logic). `types` are the blocks whose examples are on the page;
 * a basic page's `via` is what the code of those blocks reaches (pageProblems reads it from the code, never from a block's name).
 * The examples of one block type are all on one page. The index (blocks.md) lists these pages and has no example of its own.
 */
export const blockPages = {
  buttons: { title: 'Buttons', kind: 'basic', types: ['buttons'], via: '@theme/ui/Button' },
  cards: { title: 'Cards', kind: 'basic', types: ['cards', 'notice'], via: '@theme/ui/Card' },
  lists: { title: 'Lists', kind: 'basic', types: ['list', 'expand'], via: '@theme/ui/List' },
  steps: { title: 'Steps', kind: 'basic', types: ['steps'], via: '<ol' },
  tables: { title: 'Tables', kind: 'basic', types: ['table', 'cookies'], via: '<table' },
  testimonials: { title: 'Testimonials', kind: 'special', types: ['testimonials'] },
  'price-cards': { title: 'Price cards', kind: 'special', types: ['pricecards'] },
  'blog-posts': { title: 'Blog posts', kind: 'special', types: ['posts'] },
  'image-grid': { title: 'Image grid', kind: 'special', types: ['imagegrid'] },
  video: { title: 'Video', kind: 'special', types: ['video'] },
  // Kind `sections`: the page of the section colours. Its sections hold examples of the main blocks, which belong on their own component's page, so
  // it has no `types`, and its examples are not held to the home and twice rules (each differs in its props, and exampleProblems still holds them apart).
  'section-colours': { title: 'Section colours', kind: 'sections', types: [] },
};

const pagesDir = join(root, 'demo/src/content/pages');

/** The file name of a component page. */
export const blockPageFile = (slug) => `blocks-${slug}.md`;

/** The index and the component pages as they are on disk: `{ index, pages: { slug: text } }`. */
export function demoBlockPages(dir = pagesDir) {
  const files = readdirSync(dir)
    .filter((f) => /^blocks-.+\.md$/.test(f))
    .sort();
  return {
    index: readFileSync(join(dir, 'blocks.md'), 'utf8'),
    pages: Object.fromEntries(files.map((f) => [f.slice('blocks-'.length, -'.md'.length), readFileSync(join(dir, f), 'utf8')])),
  };
}

const withoutFrontMatter = (text) => text.replace(/^---\n[\s\S]*?\n---\n/, '');

/** The examples of every component page, one text: what the checks over the blocks read (the index has none). */
export const demoBlocksPage = (dir = pagesDir) =>
  Object.values(demoBlockPages(dir).pages)
    .map((text) => withoutFrontMatter(text))
    .join('\n');

/** The text of the test page for the checks (core-blocks-page.mjs, check-contrast.mjs): every component page's examples under one heading, each page's title a heading of its own. */
export function demoBlocksTestBody(dir = pagesDir) {
  const { pages } = demoBlockPages(dir);
  const slugs = [...Object.keys(blockPages).filter((slug) => slug in pages), ...Object.keys(pages).filter((slug) => !(slug in blockPages))];
  // The section colours page is left out: the checks that read the test body put every page in each section colour themselves.
  const body = slugs
    .filter((slug) => blockPages[slug]?.kind !== 'sections')
    .map((slug) => withoutFrontMatter(pages[slug]).replace(/^## /gm, '### ').replace(/^# /m, '## ').trim());
  return `# Blocks\n\n${body.join('\n\n')}\n`;
}

/** Whether the code of a block reaches `needle` (an import of a theme part, or its own markup): the block's own files and, through their imports from the theme, the files they draw with. */
export function blockReaches(type, needle, themeDir = join(root, 'theme')) {
  const seen = new Set();
  const walk = (file) => {
    if (seen.has(file) || !existsSync(file)) return false;
    seen.add(file);
    const code = readFileSync(file, 'utf8');
    if (code.includes(needle)) return true;
    for (const [, path] of code.matchAll(/from '@theme\/((?:blocks|components)\/[^']+)'/g))
      for (const ext of ['.tsx', '.ts']) if (walk(join(themeDir, `${path}${ext}`))) return true;
    return false;
  };
  const folder = join(themeDir, 'blocks', type);
  return existsSync(folder) && readdirSync(folder).some((f) => /\.tsx?$/.test(f) && walk(join(folder, f)));
}

const examplesOf = (text) => [...withoutFrontMatter(text).matchAll(/^<div data-block="([^"]+)"(?: data-props="([^"]*)")?/gm)];

/**
 * What is wrong with the set of pages: a page without its file, a file that is not a page, a page not at its address, the index missing
 * a page or showing an example, an example on the page of another component, the same example twice, and a basic page whose blocks the
 * code does not draw with the page's component (`check.code: false` leaves that out).
 */
export function pageProblems({ index, pages }, registry = blockPages, check = { code: true }) {
  const problems = [];
  const slugs = Object.keys(registry);
  for (const slug of slugs)
    if (!(slug in pages)) problems.push(`The Blocks page "${registry[slug].title}" has no file (${blockPageFile(slug)}).`);
  for (const slug of Object.keys(pages))
    if (!(slug in registry)) problems.push(`${blockPageFile(slug)} is not in blockPages (scripts/demo-blocks.mjs).`);
  const home = new Map();
  for (const [slug, page] of Object.entries(registry))
    for (const type of page.types) {
      if (home.has(type))
        problems.push(`"${type}" is on two Blocks pages ("${home.get(type)}" and "${slug}"); its examples are all on one.`);
      home.set(type, slug);
    }
  const seen = new Map();
  for (const [slug, text] of Object.entries(pages)) {
    const page = registry[slug];
    if (!page) continue;
    if (!text.includes(`\npath: "/blocks/${slug}/"\n`))
      problems.push(`${blockPageFile(slug)} is not at /blocks/${slug}/ (its front matter path).`);
    if (!text.includes(`\n# ${page.title}\n`)) problems.push(`${blockPageFile(slug)} has no "# ${page.title}" heading.`);
    if (!text.includes('\n[All blocks](/blocks/)\n'))
      problems.push(`${blockPageFile(slug)} has no link back to the index ("[All blocks](/blocks/)").`);
    for (const [, type, props = ''] of examplesOf(text)) {
      if (page.kind !== 'sections' && !page.types.includes(type))
        problems.push(
          `An example of "${type}" is on the "${page.title}" page; it belongs on "${registry[home.get(type)]?.title ?? 'no page'}".`,
        );
      const key = `${type}${props}`;
      if (page.kind !== 'sections' && seen.has(key))
        problems.push(`An example of "${type}" is on two Blocks pages ("${seen.get(key)}" and "${slug}").`);
      seen.set(key, slug);
    }
  }
  for (const slug of slugs)
    if (!index.includes(`/blocks/${slug}/`))
      problems.push(`The Blocks index does not list the "${registry[slug].title}" page (/blocks/${slug}/).`);
  for (const [, type, props = ''] of examplesOf(index)) {
    const hrefs = [...props.matchAll(/&quot;href&quot;:&quot;([^&]*)&quot;/g)].map((m) => m[1]);
    if (type !== 'list' || !hrefs.length || hrefs.some((href) => !slugs.some((slug) => href === `/blocks/${slug}/`)))
      problems.push(`The Blocks index shows an example of "${type}"; it only lists the pages (a List of links).`);
  }
  if (check.code)
    for (const page of Object.values(registry))
      if (page.kind === 'basic')
        for (const type of page.types)
          if (!blockReaches(type, page.via))
            problems.push(`"${type}" is on the "${page.title}" page, but its code does not draw with ${page.via}.`);
  return problems;
}

/**
 * Each example has a "##" subheading naming it (or a "###" under a "##" that shows its designs together), between the example before it and itself (a sentence about the block may stand between
 * them), the subheadings differ, and no two examples of a block are the same.
 */
export function exampleProblems(text) {
  const problems = [];
  const seen = new Map();
  const headings = new Set();
  let heading = '';
  let section = '';
  for (const line of text.split('\n')) {
    const m = line.match(/^<div data-block="([^"]+)"(?: data-props="([^"]*)")?/);
    if (!m) {
      if (line.startsWith('# ')) heading = section = '';
      if (line.startsWith('## ')) heading = section = line.slice(3).trim();
      // A "###" names one design of the example in its "##" section.
      if (line.startsWith('### ')) heading = `${section}, ${line.slice(4).trim()}`;
      continue;
    }
    const [, type, props = ''] = m;
    const list = seen.get(type) ?? [];
    list.push({ props, heading });
    seen.set(type, list);
    heading = '';
  }
  for (const [type, list] of seen) {
    for (const [i, e] of list.entries()) {
      if (!e.heading) problems.push(`Example ${i + 1} of "${type}" on the Blocks pages has no "##" subheading naming it.`);
      else if (headings.has(e.heading)) problems.push(`Two examples on the Blocks pages share the subheading "${e.heading}".`);
      headings.add(e.heading);
      if (list.findIndex((o) => o.props === e.props) !== i)
        problems.push(
          `Two examples of "${type}" on the Blocks pages are the same${e.heading ? ` ("${e.heading}")` : ''}; show a real difference.`,
        );
    }
  }
  return problems;
}
