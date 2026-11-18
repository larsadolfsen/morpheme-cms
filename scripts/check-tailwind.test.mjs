import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { ALLOWLIST, counted, loose, problems } from './check-tailwind.mjs';
import { ROOT, scanTree } from './tailwind-inventory.mjs';

const allowed = { 'src/A.tsx': { utilities: 3, theme: 1 } };

test('counted keeps only the counted keys of the files that have any', () => {
  assert.deepEqual(counted({ 'a.tsx': { utilities: 2, prose: 1, constants: 0 }, 'b.css': { prose: 4 } }), { 'a.tsx': { utilities: 2 } });
});

test('the same or lower counts pass', () => {
  assert.deepEqual(problems({ 'src/A.tsx': { utilities: 3, theme: 1 } }, allowed), []);
  assert.deepEqual(problems({ 'src/A.tsx': { utilities: 1 } }, allowed), []);
});

test('one more utility fails, names the file and says how to lower', () => {
  const [message, ...rest] = problems({ 'src/A.tsx': { utilities: 4, theme: 1 } }, allowed);
  assert.equal(rest.length, 0);
  assert.match(message, /^src\/A\.tsx: 4 Tailwind utilities, the list allows 3\./);
  assert.match(message, /check-tailwind\.mjs --write/);
});

test('a file that is not listed fails with any count', () => {
  const [message] = problems({ 'src/New.tsx': { apply: 1 } }, allowed);
  assert.match(message, /^src\/New\.tsx: 1 @apply, and the file is not in scripts\/tailwind-allowlist\.json/);
});

test('loose lists what the list allows more than the tree has', () => {
  assert.deepEqual(loose({ 'src/A.tsx': { utilities: 2, theme: 1 } }, allowed), ['src/A.tsx: Tailwind utilities 2, the list still says 3']);
  assert.deepEqual(loose({}, { 'gone.tsx': { utilities: 1 } }), ['gone.tsx: Tailwind utilities 0, the list still says 1']);
});

test('the tree has no more Tailwind than the list', async () => {
  const list = JSON.parse(readFileSync(ALLOWLIST, 'utf8'));
  assert.deepEqual(problems(counted((await scanTree()).files), list), []);
});

test('the script is part of npm run check and passes on the tree', () => {
  const scripts = JSON.parse(readFileSync(`${ROOT}/package.json`, 'utf8')).scripts;
  assert.match(scripts['check:source'], /check:tailwind/);
  assert.equal(scripts['check:tailwind'], 'node scripts/check-tailwind.mjs');
  assert.doesNotThrow(() => execFileSync('node', ['scripts/check-tailwind.mjs'], { cwd: ROOT, stdio: 'pipe' }));
});
