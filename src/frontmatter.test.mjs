// Tests booleanRead and booleanWrite (frontmatter.mjs): the page switch "Sidekolonne" is `side: false` when off and the
// key is missing when on. Run: node --test src/frontmatter.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { booleanRead, booleanWrite, writeFields } from './frontmatter.mjs';

const yaml = 'title: "Om os"\nwide: false';

test('a missing key reads as on, side: false as off', () => {
  assert.equal(booleanRead(undefined, true), true);
  assert.equal(booleanRead(false, true), false);
  assert.equal(booleanRead(true, true), true);
  assert.equal(booleanRead(undefined, undefined), false);
  assert.equal(booleanRead(true, undefined), true);
});

test('off writes side: false, on removes the key and leaves the rest as it was', () => {
  const off = writeFields(yaml, { side: booleanWrite(false, true) });
  assert.equal(off, `${yaml}\nside: false`);
  assert.equal(writeFields(off, { side: booleanWrite(true, true) }), yaml);
  assert.equal(writeFields(yaml, { side: booleanWrite(true, true) }), yaml);
});

test('a switch without a missing value is written as it is', () => {
  assert.equal(booleanWrite(true, undefined), true);
  assert.equal(booleanWrite(false, undefined), false);
});

test('front matter with CRLF line breaks is written back unchanged, and added fields use CRLF too', () => {
  const crlf = 'title: "Om os"\r\nwide: false';
  assert.equal(writeFields(crlf, {}), crlf);
  assert.equal(writeFields(crlf, { side: false }), `${crlf}\r\nside: false`);
});
