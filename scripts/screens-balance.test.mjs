// Tests for scripts/screens/support/balance.mjs: shards dealt by measured time.
// Run: node --test scripts/screens-balance.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assignShards, parseUnitLines, readTimes, shardLoads, suggestShards, weights } from './screens/support/balance.mjs';

const names = Array.from({ length: 40 }, (_, i) => `unit ${i}`);
const times = new Map(names.map((n, i) => [n, (i * 7) % 23]));

/** Every unit in exactly one shard, and together the shards hold all of them. */
function assertPartition(list, shards, t) {
  const shard = assignShards(list, shards, t);
  assert.equal(shard.length, list.length);
  for (const k of shard) assert.ok(Number.isInteger(k) && k >= 0 && k < shards);
  const seen = [];
  for (let k = 0; k < shards; k++) seen.push(...list.filter((_, i) => shard[i] === k));
  assert.deepEqual([...seen].sort(), [...list].sort());
}

test('every unit runs in exactly one shard, with times and without', () => {
  for (const shards of [1, 2, 3, 8, 13, 64]) {
    assertPartition(names, shards, times);
    assertPartition(names, shards, null);
    assertPartition(names.slice(0, 7), shards, times);
    assertPartition([], shards, times);
  }
});

test('a selection (a subset in any order) is dealt the same way: each unit once', () => {
  const selection = names.filter((_, i) => i % 3 !== 1).reverse();
  for (const shards of [2, 8]) assertPartition(selection, shards, times);
});

test('without times, or with unusable times, it deals by index % N as before', () => {
  assert.deepEqual(
    assignShards(names, 8, null),
    names.map((_, i) => i % 8),
  );
  assert.deepEqual(
    assignShards(names, 8, new Map()),
    names.map((_, i) => i % 8),
  );
});

test('the result is the same on every call', () => {
  assert.deepEqual(assignShards(names, 8, times), assignShards(names, 8, times));
});

test('the slowest shard is shorter than by index, and close to the best possible', () => {
  const heavy = new Map(names.map((n, i) => [n, i % 8 === 0 ? 60 : 2]));
  const byIndex = Math.max(
    ...shardLoads(
      names,
      8,
      heavy,
      names.map((_, i) => i % 8),
    ),
  );
  const balanced = Math.max(...shardLoads(names, 8, heavy));
  assert.ok(balanced < byIndex, `${balanced} < ${byIndex}`);
  assert.equal(balanced, 60); // five 60 s units cannot be split: one shard each, the 2 s units fill the others
});

test('a unit with no time gets the average of the known ones', () => {
  const t = new Map([
    ['a', 10],
    ['b', 20],
  ]);
  assert.deepEqual(weights(['a', 'b', 'new'], t), [10, 20, 15]);
});

test('a unit that took 0 s still costs a little', () => {
  assert.deepEqual(weights(['a'], new Map([['a', 0]])), [1]);
});

test('parseUnitLines reads the runner lines, with or without a CI timestamp', () => {
  const log = [
    '2026-11-18T06:48:52.0433653Z unit 352 checkListColumns 375: 2 s',
    'unit 3 screens 390: 41 s',
    'card icon contrast 375px light card-outlined: 16.39',
    '2026-11-18T06:47:04.7404143Z unit 152 checkCardIconText 375 light: 17 s',
  ].join('\n');
  assert.deepEqual(
    [...parseUnitLines(log)],
    [
      ['checkListColumns 375', 2],
      ['screens 390', 41],
      ['checkCardIconText 375 light', 17],
    ],
  );
});

test('readTimes returns null for a missing file, bad JSON or no usable time', () => {
  const dir = mkdtempSync(join(tmpdir(), 'times-'));
  assert.equal(readTimes(join(dir, 'none.json')), null);
  for (const [i, text] of ['not json', '{}', '{"seconds":{}}', '{"seconds":{"a":"x","b":-1}}', '[]'].entries()) {
    const f = join(dir, `bad${i}.json`);
    writeFileSync(f, text);
    assert.equal(readTimes(f), null, text);
  }
  const ok = join(dir, 'ok.json');
  writeFileSync(ok, '{"measured":"x","seconds":{"a":3,"b":"x"}}');
  assert.deepEqual([...readTimes(ok)], [['a', 3]]);
});

test('the committed times file is readable and holds real units', () => {
  const t = readTimes();
  assert.ok(t && t.size > 100, 'scripts/screens/unit-times.json has the times of a full run');
});

test('suggestShards gives the fewest shards that meet the target', () => {
  const n = suggestShards(names, times, 60);
  assert.ok(Math.max(...shardLoads(names, n, times)) <= 60);
  if (n > 1) assert.ok(Math.max(...shardLoads(names, n - 1, times)) > 60);
});
