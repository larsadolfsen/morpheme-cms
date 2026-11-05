// Tests for scripts/pending-shared.mjs: pendingShared() finds module state that holds an unfinished I/O promise.
// The last test scans every worker/*.js file. Run: node --test scripts/pending-shared.test.mjs
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { pendingShared } from './pending-shared.mjs';

const src = (...lines) => lines.join('\n');

const cases = [
  [
    'pending ??=',
    src(
      'let ready;',
      "const table = (db) => (ready ??= db\n  .batch([db.prepare('X')])\n  .catch((e) => { ready = undefined; throw e; }));",
    ),
    [{ line: 2, name: 'ready' }],
  ],
  [
    'pending local in a Map',
    src(
      'const ready = new WeakMap();',
      'async function f(db) {',
      "  const made = db\n    .prepare('X')\n    .run();",
      '  ready.set(db, made);',
      '}',
    ),
    [{ line: 6, name: 'ready' }],
  ],
  ['finished result', src('const ready = new WeakSet();', "await db.prepare('X').run();", 'ready.add(db);'), []],
  ['flag after await', src('let ready = false;', 'await db.batch([]);', 'ready = true;'), []],
  ['value with await', src('let version;', "version = String((await res.json()).commit ?? '');"), []],
  ['plain value with a call', src('const known = new Map();', 'known.set(id, { ...may, until: Date.now() + 1 });'), []],
  ['reset', src('let ready;', 'ready = undefined;'), []],
  ['marker', src('let cache;', 'cache = fetch(url); // pending-ok'), []],
  ['not module state', 'function f() { let x; x = fetch(url); }', []],
  ['pending fetch', src('let cache;', 'function f(url) { cache ??= fetch(url); }'), [{ line: 2, name: 'cache' }]],
];

for (const [name, source, expected] of cases) {
  test(`pendingShared: ${name}`, () => {
    assert.deepEqual(pendingShared(source), expected);
  });
}

test('worker/*.js has no pending promise in module state', () => {
  const dir = new URL('../worker/', import.meta.url);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const places = pendingShared(readFileSync(new URL(file, dir), 'utf8'));
    assert.deepEqual(places, [], `${file} keeps a pending promise in module state: ${JSON.stringify(places)}`);
  }
});
