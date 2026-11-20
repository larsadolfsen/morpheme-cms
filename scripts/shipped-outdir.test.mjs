// A shipped script that builds a site never gives Astro an out dir in os.tmpdir(): Astro renames files from
// .astro/.prerender/ into it, and rename fails with EXDEV when the temp folder is on another device than the project
// (a CI runner's /tmp). Scripts build into scripts/build-out.mjs's folder, inside the project.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const ROOT = new URL('../', import.meta.url);
const shipped = () => {
  const [{ files }] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: ROOT, encoding: 'utf8' }));
  return files.map((f) => f.path).filter((p) => /\.m?js$/.test(p) && !/\.test\.m?js$/.test(p));
};
/** The names a file binds to a temp path: `const out = mkdtempSync(join(tmpdir(), …))`, or any tmpdir-based value. */
const tmpNames = (src) => [...src.matchAll(/(?:const|let|var)\s+(\w+)\s*=[^;\n]*(?:tmpdir|mkdtemp)/g)].map((m) => m[1]);
/** Lines that pass `--outDir` a value that is, or comes from, a temp path. */
export const badOutDirs = (src) => {
  const names = tmpNames(src);
  return src
    .split('\n')
    .filter(
      (line) =>
        /--outDir/.test(line) &&
        (/tmpdir|mkdtemp/.test(line) || names.some((n) => new RegExp(`--outDir['"\`]?\\s*,\\s*${n}\\b`).test(line))),
    );
};

test('no shipped script gives an Astro build an out dir in os.tmpdir()', () => {
  const scripts = shipped();
  assert.ok(scripts.includes('scripts/check-themes.mjs') && scripts.includes('scripts/build-out.mjs'), 'the shipped file list is read');
  const found = scripts.flatMap((path) => badOutDirs(readFileSync(new URL(path, ROOT), 'utf8')).map((l) => `${path}: ${l.trim()}`));
  assert.deepEqual(found, [], 'use buildOutDir (scripts/build-out.mjs) so the out dir is on the project’s device');
});

test('the check matches what it is meant to find', () => {
  assert.equal(badOutDirs("const out = mkdtempSync(join(tmpdir(), 'x-'));\nrun(['build', '--outDir', out]);").length, 1);
  assert.equal(badOutDirs("run(['build', '--outDir', join(tmpdir(), 'x')]);").length, 1);
  assert.equal(badOutDirs("const out = buildOutDir(root, 'x');\nrun(['build', '--outDir', out]);").length, 0);
});
