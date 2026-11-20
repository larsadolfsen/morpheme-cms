// Tests for lib/outputKey.mjs: the key depends on the bytes, the paths and the values, never on order or on file times.
// Run: node --test lib/outputKey.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { outputKey, KEY_VERSION } from './outputKey.mjs';

const a = { path: 'src/a.ts', content: 'one' };
const b = { path: 'src/b.ts', content: 'two' };

test('the key is 64 hex characters and the same for the same inputs', () => {
  assert.match(outputKey({ files: [a, b] }), /^[0-9a-f]{64}$/);
  assert.equal(outputKey({ files: [a, b] }), outputKey({ files: [a, b] }));
});

test('the order of the files and of the values does not matter', () => {
  assert.equal(outputKey({ files: [a, b], values: { x: 1, y: 2 } }), outputKey({ files: [b, a], values: { y: 2, x: 1 } }));
});

test('a changed byte, path or value gives another key', () => {
  const base = outputKey({ files: [a, b], values: { node: '24' } });
  assert.notEqual(base, outputKey({ files: [{ ...a, content: 'one!' }, b], values: { node: '24' } }));
  assert.notEqual(base, outputKey({ files: [{ ...a, path: 'src/c.ts' }, b], values: { node: '24' } }));
  assert.notEqual(base, outputKey({ files: [a, b], values: { node: '22' } }));
});

test('a file added or left out gives another key', () => {
  assert.notEqual(outputKey({ files: [a] }), outputKey({ files: [a, b] }));
  assert.notEqual(outputKey({ files: [] }), outputKey({ files: [a] }));
});

test('text and bytes of the same content give the same key; Windows and POSIX paths too', () => {
  assert.equal(outputKey({ files: [a] }), outputKey({ files: [{ path: 'src\\a.ts', content: new TextEncoder().encode('one') }] }));
});

test('content cannot be moved into a name or into the next file to give the same key', () => {
  assert.notEqual(outputKey({ files: [{ path: 'ab', content: 'c' }] }), outputKey({ files: [{ path: 'a', content: 'bc' }] }));
  assert.notEqual(
    outputKey({
      files: [
        { path: 'a', content: 'x\nfile "b" ' },
        { path: 'c', content: '' },
      ],
    }),
    outputKey({
      files: [
        { path: 'a', content: 'x' },
        { path: 'b', content: '' },
        { path: 'c', content: '' },
      ],
    }),
  );
  assert.notEqual(outputKey({ values: { a: '1' } }), outputKey({ values: { a: 1 } }));
});

test('the same file listed twice is an error, not a silent choice', () => {
  assert.throws(() => outputKey({ files: [a, { ...a, content: 'other' }] }), /listed twice/);
});

test('a file time never changes the key', () => {
  const dir = mkdtempSync(join(tmpdir(), 'output-key-'));
  const file = join(dir, 'f.txt');
  writeFileSync(file, 'same');
  const key = () => outputKey({ files: [{ path: 'f.txt', content: readFileSync(file) }] });
  const before = key();
  utimesSync(file, new Date('2001-01-01'), new Date('2002-02-02'));
  assert.equal(key(), before);
  writeFileSync(file, 'different');
  assert.notEqual(key(), before);
});

test('the key of nothing is fixed for a key version', () => {
  // Changing how the key is made must raise KEY_VERSION and this value together, so a key made before never matches one made after.
  assert.equal(KEY_VERSION, 1);
  assert.equal(outputKey({}), '5f7b60509bc3f456284987e1a7cd4aed8e484d6fde06e3c4123459b6d4091dcc');
});
