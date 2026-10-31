// Checks that the editor (/editor/) can save every page and blog post without changing the site:
// each body is loaded into Milkdown and written back, and both versions are rendered with Astro's
// Markdown pipeline. The HTML must be the same. The front matter, written back without changes, must
// be the same text. The fixed pages (src/data/*.json with sections) are loaded as their text with the
// sections as blocks (packages/editor/src/sections.mjs) and read back: the sections must be the same, a section
// of text with the same heading and the same HTML. Every page is also read into sections as the front page (as the
// site reads the page that is the front page without the editor, partsOfMarkdown in sections.mjs, packages/editor/site/home.ts):
// they must be those the editor reads. Run: npm run check:editor [files...]
// Milkdown needs a DOM; jsdom stands in for the browser.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
globalThis.window = dom.window;
for (const key of [
  'document',
  'Node',
  'Element',
  'HTMLElement',
  'MutationObserver',
  'getComputedStyle',
  'requestAnimationFrame',
  'DOMParser',
  'Event',
  'CustomEvent',
])
  globalThis[key] = dom.window[key];
for (const key of ['addEventListener', 'removeEventListener', 'dispatchEvent']) globalThis[key] = dom.window[key].bind(dom.window);

const { editorViewCtx } = await import('@milkdown/kit/core');
const { createMarkdownProcessor } = await import('@astrojs/markdown-remark');
const { makeEditor, markdownOf, partsOf, spacing } = await import('@interstellarcms/cms/src/markdown.mjs');
const { introOf, partsOfMarkdown, sectionsFromParts, sectionsToMarkdown } = await import('@interstellarcms/cms/src/sections.mjs');
const { withSiteModules } = await import('../site/siteModules.mjs');
// The field of the sections of each fixed page (@site/collections): the sections whose text is written
// above their card (their lead), and the page's introduction above them (intro).
const [{ frontLeads }, { collections }] = await withSiteModules((load) =>
  Promise.all([load('@site/standardPages'), load('@site/collections')]),
);
const { leadsOfField } = await import('@interstellarcms/cms/src/sections.mjs');
const textOf = Object.fromEntries(
  collections
    .filter((c) => c.kind === 'files')
    .flatMap((c) => c.files)
    .map((f) => [f.file, f.fields.find((x) => x.type === 'blocks')]),
);
const { splitFrontmatter, writeFields } = await import('@interstellarcms/cms/src/frontmatter.mjs');

const walk = (dir) =>
  (existsSync(dir) ? readdirSync(dir, { withFileTypes: true }) : []).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.md') ? [join(dir, e.name)] : [],
  );
const fixed = readdirSync('src/data')
  .filter((f) => f.endsWith('.json') && JSON.parse(readFileSync(join('src/data', f), 'utf8')).sections)
  .map((f) => join('src/data', f));
const files = process.argv.length > 2 ? process.argv.slice(2) : [...walk('src/content/blog'), ...walk('src/content/pages'), ...fixed];

const processor = await createMarkdownProcessor();
const render = async (md) => (await processor.render(md)).code.replace(/\s+/g, ' ').trim();

let failed = 0;
// A fixed page's introduction and sections, as the editor reads them back.
async function sectionsBack(sections, intro, field) {
  const leads = leadsOfField(field);
  const editor = await makeEditor(
    document.createElement('div'),
    sectionsToMarkdown(sections, leads, field?.intro ? intro : undefined),
  ).create();
  let parts = editor.action(partsOf);
  let back = '';
  if (field?.intro) [back, parts] = introOf(parts);
  await editor.destroy();
  return [back, sectionsFromParts(parts, leads)];
}
// The text of a section of text, and of the front page's top, as HTML.
const comparable = async (intro, sections) =>
  JSON.stringify([
    intro ?? '',
    ...(await Promise.all(
      sections.map(async (s) =>
        s.type === 'text' ? { ...s, body: await render(s.body) } : s.type === 'hero' ? { ...s, text: await render(s.text) } : s,
      ),
    )),
  ]);

for (const file of files) {
  if (file.endsWith('.json')) {
    const { sections, intro } = JSON.parse(readFileSync(file, 'utf8'));
    const field = textOf[file];
    const [before, after] = [
      await comparable(field?.intro ? intro : '', sections),
      await comparable(...(await sectionsBack(sections, intro, field))),
    ];
    if (before === after) continue;
    failed++;
    console.log(`\n✗ ${file}\n  før:    ${before.slice(0, 300)}\n  efter:  ${after.slice(0, 300)}`);
    continue;
  }
  const { yaml, body } = splitFrontmatter(readFileSync(file, 'utf8'));
  if (writeFields(yaml, {}) !== yaml) {
    failed++;
    console.log(`\n✗ ${file}\n  front matter skrives ikke tilbage uændret`);
    continue;
  }
  const root = document.createElement('div');
  // As in the editor: with the free lines between the blocks, written without them.
  const editor = await makeEditor(root, body).use(spacing).create();
  editor.action((ctx) => ctx.get(editorViewCtx).dispatch(ctx.get(editorViewCtx).state.tr));
  const saved = editor.action(markdownOf);
  const parts = editor.action(partsOf);
  await editor.destroy();
  if (file.includes('src/content/pages/')) {
    const [editors, site] = [
      await comparable('', sectionsFromParts(parts, frontLeads)),
      await comparable('', sectionsFromParts(partsOfMarkdown(body), frontLeads)),
    ];
    if (editors !== site) {
      failed++;
      console.log(`\n✗ ${file} som forside\n  editoren: ${editors.slice(0, 300)}\n  sitet:    ${site.slice(0, 300)}`);
      continue;
    }
  }
  const [before, after] = [await render(body), await render(saved)];
  if (before === after) continue;
  failed++;
  let i = 0;
  while (before[i] === after[i]) i++;
  console.log(
    `\n✗ ${file}\n  før:    …${before.slice(Math.max(0, i - 80), i + 120)}\n  efter:  …${after.slice(Math.max(0, i - 80), i + 120)}`,
  );
}
console.log(`\n${files.length - failed} af ${files.length} filer giver samme side efter en gem i editoren.`);
process.exit(failed ? 1 : 0);
