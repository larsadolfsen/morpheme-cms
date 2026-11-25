import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { PUBLIC_IMPORTS, publicImportOf } from '../lib/public-imports.mjs';
import { docList, docProblems, nearest, problemsOf, specifiers } from './check-imports.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

/** A made-up folder: files by path. */
function folder(files) {
  const dir = mkdtempSync(join(tmpdir(), 'imports-'));
  for (const [p, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, p)), { recursive: true });
    writeFileSync(join(dir, p), text);
  }
  return dir;
}

test('every public import is a file of the package, and the list has no repeats', () => {
  assert.equal(new Set(PUBLIC_IMPORTS).size, PUBLIC_IMPORTS.length);
  for (const e of PUBLIC_IMPORTS) {
    const base = join(root, e.replace('@morphemecms/cms/', ''));
    const hit = ['', '.ts', '.tsx', '.mjs', '.js', '.astro'].some((x) => existsSync(base + x));
    assert.ok(hit, `${e} has no file`);
  }
});

test('publicImportOf: exact, query, one folder level for /*, and nothing else', () => {
  assert.equal(publicImportOf('@morphemecms/cms/src/icon'), '@morphemecms/cms/src/icon');
  assert.equal(publicImportOf('@morphemecms/cms/src/icon?raw'), '@morphemecms/cms/src/icon');
  assert.equal(publicImportOf('@morphemecms/cms/src/store'), null);
  assert.equal(publicImportOf('@morphemecms/cms/src/standard/buttons/index'), null);
});

test('specifiers finds static, dynamic, require and glob imports, with their lines, and not a comment', () => {
  const text = [
    "// import x from '@morphemecms/cms/src/nope';",
    "import a from '@morphemecms/cms/src/icon';",
    "export { b } from './b';",
    "const c = await import('@morphemecms/cms/src/store');",
    "const g = import.meta.glob('@morphemecms/cms/pages/*.tsx');",
  ].join('\n');
  const found = specifiers(text, 'x.ts');
  assert.deepEqual(
    found.map((f) => [f.spec, f.line]),
    [
      ['@morphemecms/cms/src/icon', 2],
      ['./b', 3],
      ['@morphemecms/cms/src/store', 4],
      ['@morphemecms/cms/pages/*.tsx', 5],
    ],
  );
});

test('an .astro file: frontmatter and script are read, the markup is not', () => {
  const text =
    "---\nimport a from '@morphemecms/cms/src/icon';\n---\n<p>import b from '@morphemecms/cms/src/store'</p>\n<script>\n  import c from '@morphemecms/cms/lib/motion';\n</script>\n";
  assert.deepEqual(
    specifiers(text, 'x.astro').map((f) => [f.spec, f.line]),
    [
      ['@morphemecms/cms/src/icon', 2],
      ['@morphemecms/cms/lib/motion', 6],
    ],
  );
});

test('a made-up theme: an import inside the list passes, @morphemecms/cms/src/store fails with file, line and nearest name', () => {
  const dir = folder({
    'ui/Ok.tsx': "import { Icon } from '@morphemecms/cms/src/icon';\nimport x from '@theme/ui/Button';\nexport default () => null;\n",
    'ui/Bad.tsx': "import a from './a';\nimport { store } from '@morphemecms/cms/src/store';\nexport default () => null;\n",
    'ui/Virtual.tsx': "import v from 'virtual:site';\n",
    'ui/Ok.test.tsx': "import { store } from '@morphemecms/cms/src/store';\n",
  });
  try {
    const found = problemsOf(dir, 'theme', 'theme');
    assert.equal(found.length, 2);
    const bad = found.find((p) => p.kind === 'outside');
    assert.equal(bad.file, 'theme/ui/Bad.tsx');
    assert.equal(bad.line, 2);
    assert.equal(bad.spec, '@morphemecms/cms/src/store');
    assert.ok(PUBLIC_IMPORTS.includes(bad.near));
    assert.ok(found.some((p) => p.kind === 'virtual' && p.file === 'theme/ui/Virtual.tsx'));
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test('a made-up app: a dynamic import and a glob into the package are caught; a hook outside the three modules fails', () => {
  const dir = folder({
    'View.tsx':
      "const m = () => import('@morphemecms/cms/src/store');\nconst g = import.meta.glob('@morphemecms/cms/pages/*');\nexport default () => null;\n",
    'hooks/seo.ts':
      "import { hash } from '@morphemecms/cms/lib/hooks';\nimport { icon } from '@morphemecms/cms/src/icon';\nimport self from '@app/self';\nimport './own';\n",
    'after-build.ts': "import fs from 'node:fs';\n",
  });
  try {
    const found = problemsOf(dir, 'app', 'src/apps/demo');
    assert.deepEqual(
      found.map((p) => `${p.kind} ${p.file}:${p.line} ${p.spec}`).sort(),
      [
        'outside src/apps/demo/View.tsx:1 @morphemecms/cms/src/store',
        'outside src/apps/demo/View.tsx:2 @morphemecms/cms/pages/*',
        'sandbox src/apps/demo/after-build.ts:1 node:fs',
        'sandbox src/apps/demo/hooks/seo.ts:2 @morphemecms/cms/src/icon',
      ].sort(),
    );
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test('nearest names an allowed specifier of the same folder', () => {
  assert.equal(nearest('@morphemecms/cms/src/standard/view2'), '@morphemecms/cms/src/standard/view');
  assert.ok(nearest('@morphemecms/cms/lib/nothing').startsWith('@morphemecms/cms/lib/'));
});

test('the docs section equals the lib file; a section that differs fails', () => {
  const md = readFileSync(join(root, 'docs/app-contract.md'), 'utf8');
  assert.deepEqual(docProblems(md), []);
  assert.deepEqual([...docList(md)].sort(), [...PUBLIC_IMPORTS].sort());
  const first = PUBLIC_IMPORTS[0];
  const missing = docProblems(md.replace(`- \`${first}\``, '- `@morphemecms/cms/src/extra`'));
  assert.equal(missing.length, 2);
  assert.ok(missing.some((m) => m.includes(first)));
  assert.deepEqual(docProblems('# nothing'), ['docs/app-contract.md has no "Public imports" section.']);
});

test('the repository passes check:imports, the demo, the starter and the theme with no exception', async () => {
  const { execFileSync } = await import('node:child_process');
  execFileSync('node', [join(root, 'scripts/check-imports.mjs')], { cwd: root, stdio: 'pipe' });
});
