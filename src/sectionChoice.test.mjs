import test from 'node:test';
import assert from 'node:assert/strict';
import { filterByRole, readSection, saveSection, serviceOf, SECTIONS } from './sectionChoice.mjs';

const catalog = [
  { id: 'a', role: 'connector' },
  { id: 'b', role: 'plugin' },
  { id: 'c' },
  { id: 'd', role: 'nonsense' },
  { id: 'e', category: 'connectors' },
];

test('each section lists only its role; apps with no role are plugins', () => {
  assert.deepEqual(
    filterByRole(catalog, 'connector').map((a) => a.id),
    ['a', 'e'],
  );
  assert.deepEqual(
    filterByRole(catalog, 'plugin').map((a) => a.id),
    ['b', 'c', 'd'],
  );
});

test('the default section is the stored one, else Plugins', () => {
  assert.equal(readSection({ getItem: () => null }), 'plugins');
  assert.equal(readSection({ getItem: () => 'themes' }), 'themes');
  assert.equal(readSection({ getItem: () => 'junk' }), 'plugins');
  assert.deepEqual(SECTIONS, ['themes', 'connectors', 'plugins']);
});

test('unavailable storage does not throw', () => {
  const broken = {
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  };
  assert.equal(readSection(broken), 'plugins');
  assert.doesNotThrow(() => saveSection(broken, 'themes'));
  assert.equal(readSection(undefined), 'plugins');
});

test('saved section is read back', () => {
  const m = new Map();
  const storage = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
  saveSection(storage, 'connectors');
  assert.equal(readSection(storage), 'connectors');
});

test("serviceOf: the entry's service, else its hosts", () => {
  assert.equal(serviceOf({ service: ' Calendly ' }), 'Calendly');
  assert.equal(serviceOf({ needs: { loads: ['assets.calendly.com'], sends: [] } }), 'assets.calendly.com');
  assert.equal(serviceOf({}), '');
});
