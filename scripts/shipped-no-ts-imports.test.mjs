// A script the package ships runs from node_modules in a site, and Node does not strip types from a .ts file there
// (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING). So no shipped .mjs file imports a .ts or .tsx file by path: a script
// that needs the editor's TypeScript loads it through Vite (ssrLoadModule) or esbuild, as the editor's own build does.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const ROOT = new URL('../', import.meta.url);
// A real import of a path ending in .ts/.tsx: a static import or export from, or an import() call. A line that only
// builds source text for a bundler (an import inside a template string or a comment) does not start so.
const IMPORT_TS = /^\s*(?:import\b[^'"`]*|export\b[^'"`]*\bfrom\s*|(?:const|let|var)\b[^=]*=\s*await\s+import\(\s*)['"][^'"]+\.tsx?['"]/;

/** The files `npm pack` ships (package.json's `files`) that Node can run: .mjs and .js, not the tests. */
const shippedScripts = () => {
  const [{ files }] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: ROOT, encoding: 'utf8' }));
  return files.map((f) => f.path).filter((path) => /\.m?js$/.test(path) && !/\.test\.m?js$/.test(path));
};

test('no shipped script imports a .ts or .tsx file by path', () => {
  const scripts = shippedScripts();
  assert.ok(scripts.includes('scripts/editor-screens.mjs') && scripts.includes('bin/morpheme.mjs'), 'the shipped file list is read');
  const found = [];
  for (const path of scripts)
    readFileSync(new URL(path, ROOT), 'utf8')
      .split('\n')
      .forEach((line, i) => IMPORT_TS.test(line) && found.push(`${path}:${i + 1}: ${line.trim()}`));
  assert.deepEqual(found, [], 'a shipped script imports TypeScript that Node cannot run from node_modules');
});

test('the check matches what it is meant to find', () => {
  for (const line of ["const { a } = await import('../src/x.ts');", "import { a } from './x.tsx';", "export { a } from '../x.ts';"])
    assert.ok(IMPORT_TS.test(line), line);
  for (const line of [
    "import { a } from './x.mjs';",
    "const f = () => import('./x.ts');",
    "  ...ids.map((id) => `import { t } from '../${id}/texts.ts';`),",
  ])
    assert.ok(!IMPORT_TS.test(line), line);
});
