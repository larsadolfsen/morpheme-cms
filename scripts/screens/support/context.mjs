import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { chromium } from 'playwright';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { serveBuilt, virtualFile } from '../../built-site.mjs';
import { iconPack } from '@morphemecms/cms/site/theme.mjs';
import { packFolder } from '@morphemecms/cms/site/icons.mjs';
import { glyphProblems } from './icon-pack.mjs';

// The editor is opened in Danish (locale da-DK below), so the texts it shows are read from its Danish messages. They are
// TypeScript, which Node does not run in node_modules (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING), so esbuild bundles
// them to plain JavaScript first, as the editor's own build does, and the result is imported from memory.
const i18nDir = fileURLToPath(new URL('../../../src/i18n/da-DK/', import.meta.url));
const bundled = await build({
  stdin: {
    contents: ['apps', 'app', 'cms', 'dashboard', 'common', 'library', 'text', 'blocks', 'forms']
      .map((name) => `export { ${name} } from './${name}.ts';`)
      .join('\n'),
    resolveDir: i18nDir,
    loader: 'ts',
  },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  logLevel: 'silent',
});
const texts = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
export const {
  apps: da,
  app: daApp,
  cms: daCms,
  dashboard: daDashboard,
  common: daCommon,
  library: daLibrary,
  text: daText,
  blocks: daBlocks,
  forms: daForms,
} = texts;

// The same messages in English, for a check that reads the site's own texts: the site's page is in the site's language (`<html lang>`), not the
// browser's, so a check on a site page picks its expected texts with `blocksOf(lang)` instead of writing them in one language.
const enDir = fileURLToPath(new URL('../../../src/i18n/en-US/', import.meta.url));
const enBundled = await build({
  stdin: { contents: "export { blocks } from './blocks.ts';", resolveDir: enDir, loader: 'ts' },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  logLevel: 'silent',
});
export const { blocks: enBlocks } = await import(
  `data:text/javascript;base64,${Buffer.from(enBundled.outputFiles[0].text).toString('base64')}`
);
/** The block messages in a page's language (its `<html lang>`: `da-DK`, `en-US`, else English). */
export const blocksOf = (lang) => (String(lang).toLowerCase().startsWith('da') ? daBlocks : enBlocks);

// The theme's springs (lib/motion.ts, TypeScript too): what the bar's slide and fade must last and follow.
const motionBundle = await build({
  entryPoints: [fileURLToPath(new URL('../../../lib/motion.ts', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
  logLevel: 'silent',
});
export const { SPRINGS, springCss, isMotionScheme, DEFAULT_SCHEME } = await import(
  `data:text/javascript;base64,${Buffer.from(motionBundle.outputFiles[0].text).toString('base64')}`
);

export const ROOT = `${process.cwd()}/`;
// --shard K/N runs the K-th of N disjoint parts of the checks (every N-th unit, see unit below); --list only prints which units
// that part has and runs none. With neither, everything runs, as before.
const args = process.argv.slice(2);
const shardAt = args.indexOf('--shard');
export const [SHARD, SHARDS] = shardAt >= 0 ? args[shardAt + 1].split('/').map(Number) : [1, 1];
if (!(SHARDS >= 1 && SHARD >= 1 && SHARD <= SHARDS)) {
  console.error('--shard K/N needs 1 <= K <= N, for example --shard 2/4.');
  process.exit(1);
}
export const LIST_ONLY = args.includes('--list');
// --only name runs the one unit of that name, whatever its number (to try a single check on a site), instead of a shard.
const onlyAt = args.indexOf('--only');
export const ONLY = onlyAt >= 0 ? args[onlyAt + 1] : null;
// --areas a,b,c runs the core units (scripts/screens/support/areas.mjs) and the units of those areas, spread over the shards; --areas none runs
// the core units only; --areas all, or no --areas, runs every unit. A selection that cannot be read runs everything (editor-screens.mjs).
const areasAt = args.indexOf('--areas');
export const AREAS_ARG = areasAt >= 0 ? (args[areasAt + 1] ?? '') : null;
export const DIST = resolve(
  ROOT,
  args.find((a, i) => !a.startsWith('--') && !['--shard', '--only', '--areas'].includes(args[i - 1])) ?? 'dist',
);
if (!existsSync(join(DIST, 'editor/index.html'))) {
  console.error(`There is no built site in ${DIST}. Run npm run build first.`);
  process.exit(1);
}

export const missingIcon = (name) =>
  name
    ? `the icon "${name}" does not exist (a question mark instead): write it in packages/editor/src/icon.tsx`
    : 'an icon is not an SVG file (a question mark instead)';

// Phosphor is not in the package (0.19.6): no icon is drawn as a Phosphor glyph (viewBox 0 0 256 256; Material Symbols' are 0 -960 960 960). The glyphs allowed, by how their first path starts, with the reason.
const PHOSPHOR_OK = [
  {
    d: '<rect x="68" y="72"',
    why: "the text bar's own glyphs (src/icons/text-*.svg, drawn in Phosphor's 256 box, not Phosphor's): the toolbar worker (contextual-toolbar-2) owns the bar; follow-up 2",
  },
];
export const phosphorGlyph = (d) => !PHOSPHOR_OK.some((ok) => d.startsWith(ok.d));
// The icon pack in use, as the editor resolves it (iconPack in site/theme.mjs: src/data/icons.json, else the theme's "icons", else
// Material Symbols), and its folder from the site's root: what the checks of the icons expect follows it (icon-pack.mjs).
export const PACK = iconPack();
export const PACK_FOLDER = packFolder(PACK);
/** The problems of one Phosphor glyph (its first path `d`) found in the editor's DOM. */
export const phosphorProblems = (where, d) => glyphProblems(PACK, where, '<svg viewBox="0 0 256 256">', d, (x) => !phosphorGlyph(x));

export const fallbackIcon = (name) =>
  `the icon "${name}" is from the whole of Material Symbols (not in the icon pack in use): give the pack an icon of that name if it is to stay`;

// The icons not found on the built site's pages: each one once, with the pages it is on.
export const problems = [];
const missingOn = new Map();
// The icons drawn from Material Symbols (named, with where they are: up to 3 places), listed, not failed on.
export const fallbackOn = new Map();
export const fallbackAt = (name, place) => fallbackOn.set(name, new Set([...(fallbackOn.get(name) ?? []), place]));
for (const entry of readdirSync(DIST, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
  const file = join(entry.parentPath, entry.name);
  for (const [, name] of readFileSync(file, 'utf8').matchAll(/data-icon-missing="([^"]*)"/g))
    missingOn.set(name, new Set([...(missingOn.get(name) ?? []), `/${relative(DIST, file)}`]));
  for (const [, name] of readFileSync(file, 'utf8').matchAll(/data-icon-fallback="([^"]*)"/g)) fallbackAt(name, `/${relative(DIST, file)}`);
  // The site's pages: a glyph of another pack than the one in use (the demo's pack is Material Symbols).
  // (A Phosphor glyph is a finding unless Phosphor is the pack in use; then a Material Symbols glyph is: icon-pack.mjs.)
  for (const [, tag, d] of readFileSync(file, 'utf8').matchAll(/(<svg[^>]*viewBox="[^"]*"[^>]*>)<path d="([^"]*)"/g))
    if (SHARD === 1) problems.push(...glyphProblems(PACK, `/${relative(DIST, file)}`, tag, d, (x) => !phosphorGlyph(x)));
}
// The checks over the whole built site (here: its pages' icons) run in the first shard only.
for (const [name, pages] of SHARD === 1 ? missingOn : []) {
  const shown = [...pages].slice(0, 3).join(', ');
  problems.push(`${shown}${pages.size > 3 ? ` and ${pages.size - 3} more pages` : ''}: ${missingIcon(name)}`);
}

export const { server, site } = await serveBuilt(DIST);

// A site is not the demo: what a check needs and the site does not have (a page, a post, a list), the check makes itself, as
// files in src/ that the editor reads (answered here, never saved) and removes at the end. A site that has the thing is left alone.
// (In memory, through virtualFile: the editor reads them as if they were in the site's folder, which a check never writes to.)
const make = (path, text) => virtualFile(path, text);
export const has = (path) => existsSync(join(ROOT, path)) && readdirSync(join(ROOT, path)).length > 0;
/** The file of a page the site has built with the text in the page, which its Preview is made of (the blog's list page has none): the demo's About, or the first page of the site's own that is built, never the front page. */
const builtPages = existsSync(join(ROOT, 'src/content/pages'))
  ? readdirSync(join(ROOT, 'src/content/pages'))
      .filter(
        (f) =>
          f.endsWith('.md') &&
          f !== 'home.md' &&
          existsSync(join(DIST, f.slice(0, -3), 'index.html')) &&
          readFileSync(join(DIST, f.slice(0, -3), 'index.html'), 'utf8').includes('data-editor="text"'),
      )
      .sort()
  : [];
export const BUILT_PAGE = `src/content/pages/${builtPages.includes('about.md') ? 'about.md' : (builtPages[0] ?? 'about.md')}`;
/** A page's text with a List and a List - Expand (one marked as a FAQ), for the checks of their rows: a site's page need not have them. */
export const block = (name, props) => `<div data-block="${name}" data-props="${JSON.stringify(props).replaceAll('"', '&quot;')}"></div>`;
export const LIST_PAGE = [
  '---\ntitle: "T"\ndescription: "d"\n---\n\n# T\n\nIntro.\n',
  block('list', {
    items: [
      { icon: 'schedule', title: 'One', text: 'First' },
      { icon: 'info', title: 'Two', text: 'Second' },
    ],
  }),
  block('expand', { items: [{ title: 'Row', text: 'Text' }] }),
  block('expand', { design: 'segmented', faq: true, items: [{ title: 'Why?', text: 'Because.' }] }),
].join('\n\n');
/** A page's text of our own for the checks that put a section on a heading: a site's page need not have one. */
export const PAGE_SOURCE = '---\ntitle: "T"\ndescription: "d"\n---\n\n# T\n\nIntro.\n\n## Tinted\n\nTinted text.\n';
/** The title of a page the long press, the link and the lists checks use: the demo's, or the one made here. */
export const FIXTURE_PAGE = 'Check page';
make(
  'src/content/pages/zz-check-page.md',
  `---\ntitle: "${FIXTURE_PAGE}"\n---\n\n# ${FIXTURE_PAGE}\n\nMade by check:screens, never saved.\n`,
);
/** A post that is not on the blog: the demo's, or the one made here. */
export const UNLISTED_POST = existsSync(join(ROOT, 'src/content/blog/not-on-the-blog.md'))
  ? 'A post only for those with the link'
  : 'Check post only for those with the link';
make('src/content/blog/zz-check-post.md', `---\ntitle: "Check post"\ndate: 2026-01-01\n---\n\nMade by check:screens, never saved.\n`);
make(
  'src/content/blog/zz-check-unlisted.md',
  `---\ntitle: "${UNLISTED_POST}"\ndate: 2026-01-02\nunlisted: true\n---\n\nMade by check:screens, never saved.\n`,
);
// The lists the dynamic List checks read: the demo's Testimonials and Highlights, or two made here with the same names.
for (const list of ['highlights', 'testimonials'])
  if (!has(`src/data/${list}`)) {
    const from = fileURLToPath(new URL(`../../../demo/src/data/${list}/`, import.meta.url));
    for (const name of readdirSync(from)) make(`src/data/${list}/${name}`, readFileSync(join(from, name), 'utf8'));
  }

// CHROMIUM_PATH: another Chromium than Playwright's own (one installed for another version of Playwright).
// `--list` only prints the units' names and never opens a page, so it launches no browser (a job without one can list the units).
export const browser = LIST_ONLY ? null : await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
// SCREENS_DIR (the temporary folder's morpheme-screens by default): where the images go.
export const shots = process.env.SCREENS_DIR || join(tmpdir(), 'morpheme-screens');
mkdirSync(shots, { recursive: true });
// The screens opened (each on both).
export const opened = new Set();

// The links of Settings (#settings): the rows of its list, not the drawer's or the footer's links.
export const settingsRows = () =>
  [...document.querySelectorAll('main a.mo-list__item-container')].map((a) => ({
    href: a.getAttribute('href'),
    text: a.innerText.trim().split('\n')[0],
  }));
// The items of a drawer's or rail's first level that are shown (the other levels' items are in the page, with no size), top to bottom.
export const shownItems = (selector) =>
  [...document.querySelectorAll(selector)]
    .map((e) => ({ href: e.getAttribute('href'), text: e.innerText.trim(), tag: e.tagName, ...e.getBoundingClientRect().toJSON() }))
    .filter((e) => e.width > 0 && e.height > 0);
