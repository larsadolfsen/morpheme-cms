// Checks the column beside a page's text (src/data/side.json, `beside` in a block's load.ts, PageLayout.astro) with the
// theme now in src/data/theme.json: puts a TEST-ONLY block and five pages, one for each template (scripts/fixtures/side/),
// in the site, builds it in a folder of its own and looks in the HTML for the template and the column the theme's
// "templates" give each, and for the width of the text (PageLayout.astro: 66ch with a column; without one the blocks span
// the column). Exposes checkSide(root), expectedFor and columnOf; used by check-themes.mjs. Removes what it
// put in the site, and the side.json it wrote, however it ends.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasSidebar, templateOf, templatesOf } from '@morphemecms/cms/lib/page-template.mjs';
import { activeTheme, themeFolder } from '@morphemecms/cms/site/theme.mjs';
import { binOf } from './bin.mjs';
import { textClasses, widthProblem } from './side-width.mjs';

const fixtures = fileURLToPath(new URL('fixtures/side/', import.meta.url));
const BLOCK = 'src/apps/side-fixture/blocks/side-test';

/** The fixture's pages: [page, its `template` in the front matter, or undefined]. */
const PAGES = [
  ['side-none', undefined],
  ['side-single', 'single'],
  ['side-left', 'sidebar-left'],
  ['side-right', 'sidebar-right'],
  ['side-full', 'full'],
];

/** What each fixture page must show with a theme that offers `offered`: [page, its template, the side of the column or null].
 * The template is the one the theme gives the page (templateOf); only a sidebar template has a column. */
export const expectedFor = (offered) =>
  PAGES.map(([page, key]) => {
    const template = templateOf({ template: key }, offered);
    return [page, template, hasSidebar(template) ? (template === 'sidebar-left' ? 'left' : 'right') : null];
  });

/** What the built page shows: its template, the side of the column beside its text (with the test block in it), and whether the block is anywhere. */
export const columnOf = (html, page) => ({
  template: html.match(/<article[^>]*\sdata-template="([\w-]+)"/)?.[1] ?? null,
  side: html.match(/class="page-with-side" data-side="(left|right)"/)?.[1] ?? null,
  column: new RegExp(String.raw`<aside class="page-side">[\s\S]*?data-side-test="/${page}/"[\s\S]*?</aside>`).test(html),
  anywhere: html.includes('data-side-test'),
  text: textClasses(html),
});

/** The templates the theme in use offers (its theme.json "templates", else the standard theme's). */
function offeredBy(root) {
  const theme = activeTheme();
  const manifest = JSON.parse(readFileSync(join(root, themeFolder(theme), 'theme.json'), 'utf8'));
  return templatesOf(manifest);
}

/** Builds the site with the fixture and checks the cases for the theme in use; throws with what is wrong. */
export function checkSide(root) {
  const put = [BLOCK, 'src/data/side.json', ...PAGES.map(([p]) => `src/content/pages/${p}.md`)].map((f) => join(root, f));
  if (put.some(existsSync)) throw new Error('Remove the side-fixture files from src/ first (scripts/check-side.mjs puts them there).');
  const out = mkdtempSync(join(tmpdir(), 'side-'));
  try {
    const offered = offeredBy(root);
    mkdirSync(join(root, BLOCK), { recursive: true });
    cpSync(join(fixtures, 'block'), join(root, BLOCK), { recursive: true });
    cpSync(join(fixtures, 'side.json'), join(root, 'src/data/side.json'));
    for (const [p] of PAGES) cpSync(join(fixtures, `${p}.md`), join(root, `src/content/pages/${p}.md`));
    execFileSync(process.execPath, [binOf('astro'), 'build', '--outDir', out], { cwd: root, stdio: 'inherit' });
    const problems = [];
    let drawn = false;
    for (const [page, template, side] of expectedFor(offered)) {
      const found = columnOf(readFileSync(join(out, page, 'index.html'), 'utf8'), page);
      if (found.template !== template) problems.push(`/${page}/ has the template ${found.template}, and should have ${template}`);
      if (side && !(found.column && found.side === side)) problems.push(`/${page}/ has no column on the ${side}, beside its text`);
      if (!side && (found.anywhere || found.side)) problems.push(`/${page}/ has the column, and should not`);
      const width = widthProblem(found.text, side);
      if (width) problems.push(`/${page}/: ${width}`);
      drawn ||= found.anywhere;
    }
    if (offered.some(hasSidebar) && !drawn) problems.push('the block was not drawn at all');
    if (problems.length) throw new Error(problems.join('\n'));
  } finally {
    rmSync(out, { recursive: true, force: true });
    rmSync(join(root, 'src/apps/side-fixture'), { recursive: true, force: true });
    for (const f of put.slice(1)) rmSync(f, { force: true });
  }
}
