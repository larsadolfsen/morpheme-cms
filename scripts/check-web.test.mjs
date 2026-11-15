import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { countsOf, compare } from './check-web.mjs';

const json = {
  guides: [
    {
      rules: [
        {
          ruleId: 'dialog',
          findings: [
            { file: 'a.ts', line: 1 },
            { file: 'a.ts', line: 9 },
            { file: 'b.ts', line: 2 },
          ],
        },
      ],
    },
  ],
};

test('findings are counted per folder, file and rule, without line numbers', () =>
  assert.deepEqual(countsOf('theme', json), { 'theme/a.ts|dialog': 2, 'theme/b.ts|dialog': 1 }));

test('everything on the list passes', () => {
  const list = { 'theme/a.ts|dialog': { max: 2, why: 'x' }, 'theme/b.ts|dialog': { max: 1, why: 'x' } };
  assert.deepEqual(compare(countsOf('theme', json), list).problems, []);
});

test('a new finding fails, and so does one more in a listed file', () => {
  const list = { 'theme/a.ts|dialog': { max: 1, why: 'x' } };
  const out = compare(countsOf('theme', json), list).problems.join('\n');
  assert.match(out, /theme\/a\.ts: 2 findings of "dialog", 1 allowed/);
  assert.match(out, /theme\/b\.ts: new legacy pattern "dialog"/);
});

test('an entry that no longer matches fails, so the list shrinks', () => {
  const list = {
    'theme/a.ts|dialog': { max: 3, why: 'x' },
    'theme/b.ts|dialog': { max: 1, why: 'x' },
    'theme/gone.ts|dialog': { max: 1, why: 'x' },
  };
  const out = compare(countsOf('theme', json), list).problems.join('\n');
  assert.match(out, /theme\/a\.ts\|dialog: 2 found, 3 allowed/);
  assert.match(out, /theme\/gone\.ts\|dialog: on the allowlist but no longer found/);
});

test('an entry without a reason fails', () => {
  const list = { 'theme/a.ts|dialog': { max: 2, why: ' ' }, 'theme/b.ts|dialog': { max: 1 } };
  assert.equal(compare(countsOf('theme', json), list).problems.length, 2);
});

test('every real allowlist entry has a reason', () => {
  const list = JSON.parse(readFileSync(new URL('web-allowlist.json', import.meta.url), 'utf8'));
  for (const [key, e] of Object.entries(list)) assert.ok(e.why.trim() && e.max >= 1, key);
});
