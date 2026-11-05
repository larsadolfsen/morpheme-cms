/**
 * Tests for store entry validation logic (validApp, validTheme, isPath).
 * Run with `node --test packages/editor/lib/*.test.mjs` (part of npm run check).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validApp, validTheme, isPath } from './storeEntries.mjs';

const theme = () => ({
  id: 'venus',
  version: '1.0.0',
  api: 4,
  name: 'Venus',
  author: 'Morpheme',
  icon: 'palette',
  files: [{ path: 'theme.json', oid: 'a'.repeat(40) }],
});
const app = () => ({
  id: 'calendly',
  version: '1.0.0',
  api: 2,
  label: 'Calendly',
  publisher: 'Morpheme',
  icon: 'event',
  hint: 'Bookings',
  files: [{ path: 'index.ts', oid: 'b'.repeat(40) }],
  adds: { blocks: [{ label: 'Booking', icon: 'event' }], lists: [], kinds: [] },
});

test('valid theme', () => {
  assert.equal(validTheme(theme(), 4), true);
});

test('valid theme wrong api', () => {
  assert.equal(validTheme({ ...theme(), api: 3 }, 4), false);
});

test('valid theme standard id', () => {
  assert.equal(validTheme({ ...theme(), id: 'saturn' }, 4), false);
});

test('valid theme bad path', () => {
  assert.equal(validTheme({ ...theme(), files: [{ path: '../x', oid: 'a'.repeat(40) }] }, 4), false);
});

test('valid theme record path', () => {
  assert.equal(validTheme({ ...theme(), files: [{ path: 'store.json', oid: 'a'.repeat(40) }] }, 4), false);
});

test('valid theme empty files', () => {
  assert.equal(validTheme({ ...theme(), files: [] }, 4), false);
});

test('valid app', () => {
  assert.equal(validApp(app(), 2), true);
});

test('valid app refused id', () => {
  assert.equal(validApp({ ...app(), id: 'butik' }, 2), false);
  assert.equal(validApp({ ...app(), id: 'store' }, 2), false);
  assert.equal(validApp({ ...app(), id: 'udvikler' }, 2), false);
  assert.equal(validApp({ ...app(), id: 'developer' }, 2), false);
});

test('valid app missing adds kinds', () => {
  assert.equal(validApp({ ...app(), adds: { blocks: [], lists: [] } }, 2), false);
});

test('isPath cases', () => {
  assert.equal(isPath('styles/global.css'), true);
  assert.equal(isPath('a//b'), false);
  assert.equal(isPath('./a'), false);
  assert.equal(isPath(''), false);
});
