import assert from 'node:assert/strict';
import test from 'node:test';
import { oneLine } from './one-line.mjs';

test('a line break and the white space around it become one space', () => {
  assert.equal(oneLine('a\nb'), 'a b');
  assert.equal(oneLine('a  \n \t b'), 'a b');
  assert.equal(oneLine('a\r\n\r\nb'), 'a b');
  assert.equal(oneLine('a b  c'), 'a b  c');
  assert.equal(oneLine('\nb'), ' b');
  assert.equal(oneLine('a \n'), 'a ');
  assert.equal(oneLine(' a '), ' a ');
});

test('it gives what the regex gave, on any text', () => {
  const chars = ['a', ' ', '\n', '\r', '\t', 'b'];
  let seed = 7;
  const next = () => (seed = (seed * 1103515245 + 12345) % 2147483648);
  for (let n = 0; n < 2000; n++) {
    const text = Array.from({ length: next() % 12 }, () => chars[next() % chars.length]).join('');
    assert.equal(oneLine(text), text.replace(/\s*[\r\n]+\s*/g, ' '), JSON.stringify(text));
  }
});

test('a long run of white space is fast', () => {
  const start = Date.now();
  oneLine(' '.repeat(200000) + 'x');
  assert.ok(Date.now() - start < 1000);
});
