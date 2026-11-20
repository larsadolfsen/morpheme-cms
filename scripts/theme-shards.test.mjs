import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { forwarded, shardOf } from './theme-shards.mjs';

test('check:themes forwards --shard, --only and --list to the screens check, and nothing else', () => {
  assert.deepEqual(forwarded([]), []);
  assert.deepEqual(forwarded(['--shard', '2/4']), ['--shard', '2/4']);
  assert.deepEqual(forwarded(['--only', 'a unit', '--list', '--other']), ['--only', 'a unit', '--list']);
});

test('The checks that run once belong to shard 1, and to a run with no shard', () => {
  assert.equal(shardOf([]), 1);
  assert.equal(shardOf(['--shard', '1/3']), 1);
  assert.equal(shardOf(['--shard', '3/3']), 3);
});

// The shards K/N of the screens check together hold every unit exactly once (needs the built demo, `npm run build`; listing launches no browser).
const site = new URL('../.morpheme/demo/site/', import.meta.url);
const bin = new URL('../bin/morpheme.mjs', import.meta.url).pathname;
const listed = (...args) => {
  const { stdout, stderr, status } = spawnSync(process.execPath, [bin, 'check:screens', '--list', ...args], {
    cwd: site.pathname,
    encoding: 'utf8',
  });
  assert.equal(status, 0, `the list is printed (status ${status})\nstdout:\n${stdout}\nstderr:\n${stderr}`);
  return stdout.split('\n').filter((l) => l.startsWith('UNIT '));
};
test(
  '--list with the shards K/N together covers every unit exactly once',
  { skip: !existsSync(new URL('dist/editor/index.html', site)) && 'the demo is not built' },
  () => {
    const all = listed();
    assert.ok(all.length > 50);
    for (const shards of [2, 3, 8]) {
      const parts = Array.from({ length: shards }, (_, k) => listed('--shard', `${k + 1}/${shards}`)).flat();
      assert.equal(new Set(parts).size, parts.length, `${shards} shards: no unit twice`);
      assert.deepEqual([...parts].sort(), [...all].sort(), `${shards} shards: every unit`);
    }
  },
);
