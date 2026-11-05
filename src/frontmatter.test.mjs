// Tests booleanRead and booleanWrite (frontmatter.mjs): a switch that is on when its key is missing (Field.missing) is
// `key: false` when off and the key is missing when on. Run: node --test src/frontmatter.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { booleanRead, booleanWrite, writeFields } from './frontmatter.mjs';

const yaml = 'title: "Om os"\ndraft: false';

test('a missing key reads as on, key: false as off', () => {
  assert.equal(booleanRead(undefined, true), true);
  assert.equal(booleanRead(false, true), false);
  assert.equal(booleanRead(true, true), true);
  assert.equal(booleanRead(undefined, undefined), false);
  assert.equal(booleanRead(true, undefined), true);
});

test('off writes key: false, on removes the key and leaves the rest as it was', () => {
  const off = writeFields(yaml, { pinned: booleanWrite(false, true) });
  assert.equal(off, `${yaml}\npinned: false`);
  assert.equal(writeFields(off, { pinned: booleanWrite(true, true) }), yaml);
  assert.equal(writeFields(yaml, { pinned: booleanWrite(true, true) }), yaml);
});

test('a switch without a missing value is written as it is', () => {
  assert.equal(booleanWrite(true, undefined), true);
  assert.equal(booleanWrite(false, undefined), false);
});

test('front matter with CRLF line breaks is written back unchanged, and added fields use CRLF too', () => {
  const crlf = 'title: "Om os"\r\ndraft: false';
  assert.equal(writeFields(crlf, {}), crlf);
  assert.equal(writeFields(crlf, { pinned: false }), `${crlf}\r\npinned: false`);
});
