// The demo editor's manifest names the build (scripts/demo-editor.mjs buildId), and the service worker's commit carries it, so a browser
// that kept the files of an earlier build (src/cache.ts keeps them until the commit differs) loads the new ones.
// Run: node --test scripts/demo-editor.test.mjs
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { addDemoEditor } from './demo-editor.mjs';

function site(colors) {
  const dir = mkdtempSync(join(tmpdir(), 'demo-editor-'));
  mkdirSync(join(dir, 'src/data'), { recursive: true });
  mkdirSync(join(dir, 'dist/editor'), { recursive: true });
  writeFileSync(join(dir, 'package.json'), '{}');
  writeFileSync(join(dir, 'src/data/colors.json'), colors);
  writeFileSync(join(dir, 'dist/editor/sw.js'), '// the editor');
  writeFileSync(join(dir, 'dist/editor/index.html'), '<head></head>');
  return dir;
}
const manifest = (dir) => JSON.parse(readFileSync(join(dir, 'dist/editor/demo-repo/manifest.json'), 'utf8'));

test('a build with other colours has another build id; the same files have the same id', () => {
  const [a, b, c] = [site('{"light":1}'), site('{"light":2}'), site('{"light":1}')];
  try {
    for (const dir of [a, b, c]) addDemoEditor(dir);
    assert.match(manifest(a).build, /^[0-9a-f]{12}$/);
    assert.notEqual(manifest(a).build, manifest(b).build);
    assert.equal(manifest(a).build, manifest(c).build);
  } finally {
    for (const dir of [a, b, c]) rmSync(dir, { recursive: true });
  }
});

test("the service worker's commit, tree and file ids carry the build id", () => {
  const sw = readFileSync(new URL('./demo-editor-sw.js', import.meta.url), 'utf8');
  assert.match(sw, /commit: `commit-\$\{build\}-\$\{n\}`, tree: `root-\$\{build\}-\$\{n\}`/);
  assert.doesNotMatch(sw, /`commit-\$\{n\}`/);
  assert.doesNotMatch(sw, /blob:\$\{(f\.)?path\}:(0|\$\{(s\.)?version\})`/);
});
