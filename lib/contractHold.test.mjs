import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contractHold, parseContracts } from './contractHold.mjs';

const NEXT6 = { theme: 6, apps: [6] };
const store = (kind, id, version = '1.4.0') => ({ kind, id, record: JSON.stringify({ version, ref: version, files: [] }), manifest: null });
const answers = (o) => new Map(Object.entries(o));

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

test('a release written to a contract the next version reads is not held (also one version behind the newest)', () => {
  const a = answers({ 'theme:venus': { api: 6 }, 'app:mailchimp': { api: 6 } });
  assert.equal(contractHold([store('theme', 'venus', '1.3.0'), store('app', 'mailchimp', '2.0.0')], a, NEXT6), null);
  assert.equal(contractHold([store('app', 'x')], answers({ 'app:x': { api: 5 } }), { theme: 6, apps: [5, 6] }), null);
});

test('a release written to another contract is held and names the item', () => {
  assert.deepEqual(contractHold([store('theme', 'venus')], answers({ 'theme:venus': { api: 5 } }), NEXT6), {
    kind: 'theme',
    id: 'venus',
    why: 'incompatible',
    has: 5,
    needs: [6],
  });
  assert.deepEqual(contractHold([store('app', 'm')], answers({ 'app:m': { api: 7 } }), NEXT6), {
    kind: 'app',
    id: 'm',
    why: 'incompatible',
    has: 7,
    needs: [6],
  });
});

test('a release the store does not know is held', () => {
  assert.deepEqual(contractHold([store('theme', 'venus')], answers({ 'theme:venus': { missing: true } }), NEXT6), {
    kind: 'theme',
    id: 'venus',
    why: 'not-in-store',
    needs: [6],
  });
});

test('when the store gave no answer, an installed item is held and never assumed compatible', () => {
  assert.deepEqual(contractHold([store('theme', 'venus')], answers({ 'theme:venus': null }), NEXT6), {
    kind: 'theme',
    id: 'venus',
    why: 'could-not-confirm',
    needs: [6],
  });
  assert.deepEqual(contractHold([store('app', 'm')], answers({}), NEXT6), { kind: 'app', id: 'm', why: 'could-not-confirm', needs: [6] });
});

test('a site’s own app or theme (no usable store.json) is not held', () => {
  const own = [
    { kind: 'app', id: 'sara', record: null, manifest: '{"api":5}' },
    { kind: 'theme', id: 'mine', record: 'not json', manifest: null },
  ];
  assert.equal(contractHold(own, answers({}), NEXT6), null);
});
