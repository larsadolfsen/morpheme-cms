import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contractHold, parseContracts } from './contractHold.mjs';

const NEXT6 = { theme: 6, apps: [6] };
const store = (kind, id, version = '1.4.0') => ({ kind, id, record: JSON.stringify({ version, ref: version, files: [] }), manifest: null });
const catalog = { apps: [{ id: 'mailchimp', version: '2.0.0' }], themes: [{ id: 'venus', version: '1.4.0' }] };

test('parseContracts reads the contracts of a current and of an older contracts.mjs', () => {
  assert.deepEqual(
    parseContracts('export const APP_API = 6;\nexport const APP_APIS = Object.freeze([6]);\nexport const THEME_API = 6;\n'),
    { theme: 6, apps: [6] },
  );
  assert.deepEqual(parseContracts('export const APP_API = 5;\nexport const THEME_API = 5;\n'), { theme: 5, apps: [5] });
  assert.deepEqual(parseContracts('export const APP_APIS = Object.freeze([5, 6]);\nexport const THEME_API = 6;'), {
    theme: 6,
    apps: [5, 6],
  });
  assert.equal(parseContracts('nothing here'), null);
  assert.equal(parseContracts(null), null);
});

test('an installed release the store lists for the next contracts is not held', () => {
  assert.equal(contractHold([store('theme', 'venus'), store('app', 'mailchimp', '2.0.0')], catalog, NEXT6), null);
});

test('a release the store does not list for the next contracts is held, and names the item', () => {
  assert.deepEqual(contractHold([store('theme', 'venus', '1.3.0')], catalog, NEXT6), {
    kind: 'theme',
    id: 'venus',
    why: 'not-in-catalog',
    needs: [6],
  });
  assert.deepEqual(contractHold([store('app', 'other', '1.0.0')], catalog, NEXT6), {
    kind: 'app',
    id: 'other',
    why: 'not-in-catalog',
    needs: [6],
  });
  assert.equal(contractHold([store('theme', 'venus')], { apps: [], themes: [{ id: 'venus', version: '1.4.0' }] }, NEXT6), null);
});

test('when the store could not be asked, an installed item is held and never assumed compatible', () => {
  assert.deepEqual(contractHold([store('theme', 'venus')], null, NEXT6), {
    kind: 'theme',
    id: 'venus',
    why: 'could-not-confirm',
    needs: [6],
  });
});

test('a site’s own app or theme (no usable store.json) is not held, with or without the store', () => {
  const own = [
    { kind: 'app', id: 'sara', record: null, manifest: '{"api":5}' },
    { kind: 'theme', id: 'mine', record: 'not json', manifest: null },
  ];
  assert.equal(contractHold(own, null, NEXT6), null);
  assert.equal(contractHold(own, catalog, NEXT6), null);
});
