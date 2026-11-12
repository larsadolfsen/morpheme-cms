// Checks that the editor (/editor/) can save every page and blog post without changing the site:
// each body is loaded into Milkdown and written back, and both versions are rendered with Astro's
// Markdown pipeline. The HTML must be the same. The front matter, written back without changes, must
// be the same text. The fixed pages (src/data/*.json with sections) are loaded as their text with the
// sections as blocks (packages/editor/src/sections.mjs) and read back: the sections must be the same, a section
// of text with the same heading and the same HTML. Every page is also read into sections as the front page (as the
// site reads the page that is the front page without the editor, partsOfMarkdown in sections.mjs, after migrateFrontBanner in lib/front-banner.mjs, packages/editor/site/home.ts):
// they must be those the editor reads. A page whose template is changed and changed back has the same front matter (the default leaves no key; template-round-trip.mjs). Run: npm run check:editor [files...]
// A built-in sample with section colours checks that the editor and the site give the front page's sections the same colours.
// Milkdown needs a DOM; jsdom stands in for the browser.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { templateRoundTripProblem } from './template-round-trip.mjs';

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
const { makeEditor, markdownOf, partsOf, spacing } = await import('@morphemecms/cms/src/markdown.mjs');
const { introOf, partsOfMarkdown, sectionsFromParts, sectionsToMarkdown } = await import('@morphemecms/cms/src/sections.mjs');
const { migrateFrontBanner } = await import('@morphemecms/cms/lib/front-banner.mjs');
const { withSiteModules } = await import('../site/siteModules.mjs');
// The field of the sections of each fixed page (@site/collections): the sections whose text is written
// above their card (their lead), and the page's introduction above them (intro).
const [{ frontLeads }, { collections }] = await withSiteModules((load) =>
  Promise.all([load('@site/standardPages'), load('@site/collections')]),
);
const { leadsOfField } = await import('@morphemecms/cms/src/sections.mjs');
const textOf = Object.fromEntries(
  collections
    .filter((c) => c.kind === 'files')
    .flatMap((c) => c.files)
    .map((f) => [f.file, f.fields.find((x) => x.type === 'blocks')]),
);
const { migrateMarkdown } = await import('@morphemecms/cms/lib/migrate-content.mjs');
const { splitFrontmatter, writeFields } = await import('@morphemecms/cms/src/frontmatter.mjs');
const { STANDARD_TEMPLATES, templateWritten } = await import('@morphemecms/cms/lib/page-template.mjs');

const walk = (dir) =>
  (existsSync(dir) ? readdirSync(dir, { withFileTypes: true }) : []).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.md') ? [join(dir, e.name)] : [],
  );
const fixed = readdirSync('src/data')
  .filter((f) => f.endsWith('.json') && JSON.parse(readFileSync(join('src/data', f), 'utf8')).sections)
  .map((f) => join('src/data', f));
const files = process.argv.length > 2 ? process.argv.slice(2) : [...walk('src/content/blog'), ...walk('src/content/pages'), ...fixed];

// The site's own Markdown steps (astro.mjs), so a block that has become text reads the same before and after a save.
const { remarkBannerSections } = await import('@morphemecms/cms/lib/remark-banner-section.mjs');
const { remarkChecklists } = await import('@morphemecms/cms/lib/remark-checklist.mjs');
const { remarkListHeads } = await import('@morphemecms/cms/lib/remark-list-head.mjs');
const { remarkBlockLabels } = await import('@morphemecms/cms/lib/remark-block-label.mjs');
const processor = await createMarkdownProcessor({
  remarkPlugins: [remarkBannerSections, remarkChecklists, remarkListHeads, remarkBlockLabels],
});
const render = async (md) => (await processor.render(md)).code.replace(/\s+/g, ' ').trim();

let failed = 0;
// Files that still use blocks from before an update (lib/migrate-content.mjs): checked as `morpheme migrate` would write them, and
// listed at the end. The site's build runs on Cloudflare, which cannot commit, so they must not stop it.
const unmigrated = [];
// On a page the first heading is the H1 by itself (src/firstHeading.mjs): after a change to the text, and only then.
const { firstHeading } = await import('@morphemecms/cms/src/firstHeading.mjs');
const headingLevelsOf = (view) => {
  const levels = [];
  view.state.doc.forEach((node) => void (node.type.name === 'heading' && levels.push(node.attrs.level)));
  return levels;
};
for (const [markdown, edit, expected] of [
  ['## First\n\ntext\n\n# Second\n\n### Third', true, [1, 2, 3]],
  ['## First\n\ntext\n\n# Second\n\n### Third', false, [2, 1, 3]],
  ['# First\n\n# Second\n\ntext', true, [1, 2]],
  ['text only', true, []],
]) {
  const editor = await makeEditor(document.createElement('div'), markdown).use(firstHeading).create();
  const view = editor.action((ctx) => ctx.get(editorViewCtx));
  if (edit) view.dispatch(view.state.tr.insertText('x', view.state.doc.content.size - 1));
  const levels = headingLevelsOf(view);
  await editor.destroy();
  if (levels.join() === expected.join()) continue;
  failed++;
  console.log(
    `\n✗ the first heading is H1 (packages/editor/src/firstHeading.mjs)\n  text:     ${JSON.stringify(markdown)}${edit ? ' (changed)' : ''}\n  expected: ${expected}\n  got:      ${levels}`,
  );
}

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

// A text with coloured sections must give the same sections (with their colours) in the editor as on the site.
const { blockHtml } = await import('@morphemecms/cms/lib/blocks.mjs');
const colorSample = [
  '# Sample',
  '<div data-section="tint"></div>',
  '## Hours',
  'Open daily.',
  '<div data-section="accent"></div>',
  '## Steps',
  blockHtml('steps', {}),
  '## Plain',
  'End.',
].join('\n\n');
const frontSections = async (body, parts) => [
  await comparable('', sectionsFromParts(parts, frontLeads, { colors: true })),
  await comparable('', sectionsFromParts(partsOfMarkdown(migrateFrontBanner(body)), frontLeads, { colors: true })),
];
{
  const editor = await makeEditor(document.createElement('div'), colorSample).use(spacing).create();
  const [editors, site] = await frontSections(colorSample, editor.action(partsOf));
  await editor.destroy();
  if (editors !== site || !editors.includes('"sectionColor":"surface"') || !editors.includes('"sectionColor":"primary"')) {
    console.log(
      `\n✗ a text with section colors gives different sections in the editor and on the site\n  editor: ${editors}\n  site:   ${site}`,
    );
    process.exit(1);
  }
}

// The same for the H1's section (a marker before the page's H1 with an image and a width): the editor and the site give the same top.
{
  const topSample = [
    '<div data-section="" data-picture="/images/a.jpg" data-alt="A field" data-width="full"></div>',
    '# Sample',
    'Intro.',
    blockHtml('buttons', {}),
    blockHtml('steps', {}),
  ].join('\n\n');
  const editor = await makeEditor(document.createElement('div'), topSample).use(spacing).create();
  const [editors, site] = await frontSections(topSample, editor.action(partsOf));
  await editor.destroy();
  if (editors !== site || !editors.includes('"type":"top"') || !editors.includes('"width":"full"')) {
    console.log(
      `\n✗ the settings of the H1's section give different sections in the editor and on the site\n  editor: ${editors}\n  site:   ${site}`,
    );
    process.exit(1);
  }
}

// Aligned text (lib/text-align.mjs): the editor writes the alignment lines back as they were, and the site turns them into the
// classes of the blocks after them (and leaves no line behind).
{
  const { rehypeAlign } = await import('@morphemecms/cms/lib/text-align.mjs');
  const { default: rehypeRaw } = await import('rehype-raw');
  const alignSample = [
    '<div data-align="center"></div>',
    'A centred **line**',
    '<div data-align="right"></div>',
    '<p class="body-small">Small and right</p>',
    '<div data-align="center"></div>',
    '### Centred subheading',
    'Plain.',
  ].join('\n\n');
  const editor = await makeEditor(document.createElement('div'), alignSample).create();
  const saved = editor.action(markdownOf);
  await editor.destroy();
  const aligned = await createMarkdownProcessor({ rehypePlugins: [rehypeRaw, rehypeAlign] });
  const html = (await aligned.render(saved)).code;
  const ok =
    saved.trim() === alignSample &&
    html.includes('<p class="text-align-center">A centred') &&
    html.includes('<p class="body-small text-align-right">') &&
    html.includes('<h3 class="text-align-center"') &&
    !html.includes('data-align');
  if (!ok) {
    console.log(
      `\n✗ aligned text does not give the same text after a save, or the site does not align it\n  saved: ${JSON.stringify(saved)}\n  site:  ${html}`,
    );
    process.exit(1);
  }
}

for (const file of files) {
  const isPage = file.replaceAll('\\', '/').includes('src/content/pages/');
  if (file.endsWith('.json')) {
    const { sections, intro } = JSON.parse(readFileSync(file, 'utf8'));
    const field = textOf[file];
    const [before, after] = [
      await comparable(field?.intro ? intro : '', sections),
      await comparable(...(await sectionsBack(sections, intro, field))),
    ];
    if (before === after) continue;
    failed++;
    console.log(`\n✗ ${file}\n  before: ${before.slice(0, 300)}\n  after:  ${after.slice(0, 300)}`);
    continue;
  }
  const { yaml, body: written } = splitFrontmatter(readFileSync(file, 'utf8'));
  const body = migrateMarkdown(written);
  if (body !== written) unmigrated.push(file);
  // The migration is the same when it is run again.
  if (migrateMarkdown(body) !== body) {
    failed++;
    console.log(`\n✗ ${file}\n  the migration of blocks from before is not the same when it is run again`);
    continue;
  }
  if (writeFields(yaml, {}) !== yaml) {
    failed++;
    console.log(`\n✗ ${file}\n  front matter is not written back unchanged`);
    continue;
  }
  // The template (templateWritten): the theme's default leaves no key; another one is written; changing back gives the
  // front matter as it was (without the key).
  if (isPage) {
    const problem = templateRoundTripProblem(yaml, { writeFields, templateWritten, templates: STANDARD_TEMPLATES });
    if (problem) {
      failed++;
      console.log(`
✗ ${file}
  Changing the template and changing it back does not give the same front matter (${problem})`);
      continue;
    }
  }
  const root = document.createElement('div');
  // As in the editor: with the free lines between the blocks, written without them.
  // A page also has the first-heading rule: opening and saving it must not change it.
  const made = makeEditor(root, body).use(spacing);
  const editor = await (isPage ? made.use(firstHeading) : made).create();
  editor.action((ctx) => ctx.get(editorViewCtx).dispatch(ctx.get(editorViewCtx).state.tr));
  const saved = editor.action(markdownOf);
  const parts = editor.action(partsOf);
  await editor.destroy();
  if (isPage) {
    const [editors, site] = [
      await comparable('', sectionsFromParts(parts, frontLeads)),
      await comparable('', sectionsFromParts(partsOfMarkdown(migrateFrontBanner(body)), frontLeads)),
    ];
    const [editorColors, siteColors] = await frontSections(body, parts);
    if (editors !== site || editorColors !== siteColors) {
      failed++;
      const [shownEditor, shownSite] = editors !== site ? [editors, site] : [editorColors, siteColors];
      console.log(`\n✗ ${file} as the front page\n  editor: ${shownEditor.slice(0, 300)}\n  site:   ${shownSite.slice(0, 300)}`);
      continue;
    }
  }
  const [before, after] = [await render(body), await render(saved)];
  if (before === after) continue;
  failed++;
  let i = 0;
  while (before[i] === after[i]) i++;
  console.log(
    `\n✗ ${file}\n  before: …${before.slice(Math.max(0, i - 80), i + 120)}\n  after:  …${after.slice(Math.max(0, i - 80), i + 120)}`,
  );
}
if (unmigrated.length)
  console.log(
    `\n! ${unmigrated.length} file(s) use blocks or labels from before this version; the editor writes the new form when a page is saved. Run \`npx morpheme migrate\` and commit the files:\n${unmigrated.map((f) => `  ${f}`).join('\n')}`,
  );
console.log(`\n${files.length - failed} of ${files.length} files give the same page after a save in the editor.`);
process.exit(failed ? 1 : 0);
