// Checks the column beside a page's text (src/data/side.json, `beside` in a block's load.ts, PageLayout.astro) with the
// theme now in src/data/theme.json: puts a TEST-ONLY block and three pages in the site (scripts/fixtures/side/), builds it
// in a folder of its own and looks in the HTML. Exposes checkSide(root, theme); used by check-themes.mjs. Removes what it
// put in the site, and the side.json it wrote, however it ends.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { binOf } from './bin.mjs';

const fixtures = fileURLToPath(new URL('fixtures/side/', import.meta.url));
const BLOCK = 'src/apps/side-fixture/blocks/side-test';
const PAGES = ['side-plain', 'side-wide', 'side-off'];

/** What the fixture's pages must show: [page, whether the column is on it]. */
export const expected = [
  ['side-plain', true],
  ['side-wide', false],
  ['side-off', false],
];

/** Whether the built page has the block beside its text, and its text's length (data-side-length). */
export const columnOf = (html) => ({
  column: /<aside class="page-side">[\s\S]*?data-side-test="\/side-plain\/"[\s\S]*?<\/aside>/.test(html),
  grid: html.includes('class="page-with-side"'),
  anywhere: html.includes('data-side-test'),
});

/** Builds the site with the fixture and checks the three cases for the theme in use; throws with what is wrong. */
export function checkSide(root) {
  const put = [BLOCK, 'src/data/side.json', ...PAGES.map((p) => `src/content/pages/${p}.md`)].map((f) => join(root, f));
  if (put.some(existsSync)) throw new Error('Remove the side-fixture files from src/ first (scripts/check-side.mjs puts them there).');
  const out = mkdtempSync(join(tmpdir(), 'side-'));
  try {
    mkdirSync(join(root, BLOCK), { recursive: true });
    cpSync(join(fixtures, 'block'), join(root, BLOCK), { recursive: true });
    cpSync(join(fixtures, 'side.json'), join(root, 'src/data/side.json'));
    for (const p of PAGES) cpSync(join(fixtures, `${p}.md`), join(root, `src/content/pages/${p}.md`));
    execFileSync(process.execPath, [binOf('astro'), 'build', '--outDir', out], { cwd: root, stdio: 'inherit' });
    const problems = [];
    for (const [page, on] of expected) {
      const html = readFileSync(join(out, page, 'index.html'), 'utf8');
      const found = columnOf(html);
      if (on && !(found.column && found.grid)) problems.push(`/${page}/ has no column beside its text`);
      if (!on && (found.anywhere || found.grid)) problems.push(`/${page}/ has the column, and should not`);
    }
    const plain = columnOf(readFileSync(join(out, 'side-plain/index.html'), 'utf8'));
    if (!plain.anywhere) problems.push('the block was not drawn at all');
    if (problems.length) throw new Error(problems.join('\n'));
  } finally {
    rmSync(out, { recursive: true, force: true });
    rmSync(join(root, 'src/apps/side-fixture'), { recursive: true, force: true });
    for (const f of put.slice(1)) rmSync(f, { force: true });
  }
}
