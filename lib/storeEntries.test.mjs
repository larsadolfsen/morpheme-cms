/**
 * Tests for store entry validation logic (validApp, validTheme, isPath, strayStoreId).
 * Run with `node --test packages/editor/lib/*.test.mjs` (part of npm run check).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validApp, validTheme, isPath, strayStoreId } from './storeEntries.mjs';

const theme = () => ({
  id: 'theme_fa395ad84690acbd',
  handle: 'morpheme/venus',
  version: '1.0.0',
  api: 4,
  name: 'Venus',
  author: 'Morpheme',
  icon: 'palette',
  files: [{ path: 'theme.json', oid: 'a'.repeat(40) }],
});
const app = () => ({
  id: 'app_a030dfba69793996',
  handle: 'morpheme/calendly',
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

test('valid theme old-style id', () => {
  assert.equal(validTheme({ ...theme(), id: 'venus' }, 4), false);
});

test('valid theme app id (wrong kind)', () => {
  assert.equal(validTheme({ ...theme(), id: 'app_a030dfba69793996' }, 4), false);
});

test('valid theme without handle', () => {
  const { handle, ...rest } = theme();
  assert.equal(validTheme(rest, 4), false);
});

test('valid theme bad handle', () => {
  assert.equal(validTheme({ ...theme(), handle: 'venus' }, 4), false);
  assert.equal(validTheme({ ...theme(), handle: 'Morpheme/venus' }, 4), false);
});

test('valid theme with a permanent id and a handle', () => {
  assert.equal(validTheme(theme(), 4), true);
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

test('valid app old-style id', () => {
  assert.equal(validApp({ ...app(), id: 'calendly' }, 2), false);
  assert.equal(validApp({ ...app(), id: 'store' }, 2), false);
  assert.equal(validApp({ ...app(), id: 'developer' }, 2), false);
});

test('valid app theme id (wrong kind)', () => {
  assert.equal(validApp({ ...app(), id: 'theme_fa395ad84690acbd' }, 2), false);
});

test('valid app without handle', () => {
  const { handle, ...rest } = app();
  assert.equal(validApp(rest, 2), false);
});

test('valid app bad id length', () => {
  assert.equal(validApp({ ...app(), id: 'app_a030dfba6979399' }, 2), false);
  assert.equal(validApp({ ...app(), id: 'app_A030DFBA69793996' }, 2), false);
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

test('strayStoreId: a store-looking name that is not a store id of the kind', () => {
  assert.equal(strayStoreId('app_a030dfba69793996', 'app'), false);
  assert.equal(strayStoreId('app_xyz', 'app'), true);
  assert.equal(strayStoreId('theme_fa395ad84690acbd', 'app'), true);
  assert.equal(strayStoreId('theme_xyz', 'theme'), true);
  assert.equal(strayStoreId('calendly', 'app'), false);
  assert.equal(strayStoreId('my_theme', 'theme'), false);
});
