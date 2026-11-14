import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// check:screens runs on every site (npx morpheme check:screens), and a site is not the demo: a row it opens in the pages or posts
// list is one the check makes itself (FIXTURE_PAGE, "Check post") or the front page, never a title only the demo or the starter has
// (a site without "Get started" timed out after 30 s there, and nothing after it ran).
const source = readFileSync(new URL('./editor-screens.mjs', import.meta.url), 'utf8');
const ALLOWED = ['FIXTURE_PAGE', 'UNLISTED_POST', "'Check post'", "'Home'"];

test('The screens check opens only rows it has made itself or the front page', () => {
  const rows = source.split('\n').filter((line) => /main a\.list-item-container/.test(line) && /hasText:/.test(line));
  assert.ok(rows.length > 0, 'the check no longer filters list rows by text: update this test');
  for (const line of rows) {
    const text = line.match(/hasText:\s*([^}\s,]+)/)?.[1];
    assert.ok(
      ALLOWED.includes(text),
      `a list row is found by ${text}, which a site may not have: make the page in the check (make(...)) and use it\n${line.trim()}`,
    );
  }
  assert.ok(!source.includes('Get started'));
});

test('The screens check never writes to the site it checks', () => {
  // A page, a post or a list a check needs is given to the editor in memory (virtualFile in built-site.mjs), so a crash or a stray
  // commit can never leave a file in a live site's folder.
  const fsImports = [...source.matchAll(/import \{([^}]*)\} from 'node:fs'/g)].flatMap((m) => m[1].split(',').map((x) => x.trim()));
  for (const name of ['writeFileSync', 'rmSync', 'unlinkSync', 'renameSync', 'appendFileSync', 'cpSync', 'copyFileSync'])
    assert.ok(!fsImports.includes(name), `editor-screens.mjs imports ${name}: give the editor the file in memory with virtualFile instead`);
});

test('The screens check measures the system test page, never a page of the demo', () => {
  // The Blocks page is the system's (core-blocks-page.mjs), built on a temporary copy of the site: a check that opens /blocks/ of the site
  // fails on every site that has no such page.
  assert.ok(
    !/['"`]\/blocks\/['"`]/.test(source),
    "editor-screens.mjs opens the site's /blocks/ page: use onTestPage, which builds the system's test page",
  );
});
