import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contractHold, parseContracts } from './contractHold.mjs';

const RUN5 = { theme: 5, apps: [5] };
const NEXT6 = { theme: 6, apps: [6] };
const store = (kind, id, api) => ({
  kind,
  id,
  record: '{"version":"1.3.0","ref":"1.3.0","files":[]}',
  manifest: api ? JSON.stringify({ api }) : null,
});

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

test('a store theme written to the running contract is held by a version with another', () => {
  assert.deepEqual(contractHold([store('theme', 'venus')], NEXT6, RUN5), { kind: 'theme', id: 'venus', has: 5, needs: [6] });
});

test('a store app is held by its own api and by the running one when it has none', () => {
  assert.deepEqual(contractHold([store('app', 'mailchimp', 5)], NEXT6, RUN5), { kind: 'app', id: 'mailchimp', has: 5, needs: [6] });
  assert.deepEqual(contractHold([store('app', 'old')], NEXT6, RUN5), { kind: 'app', id: 'old', has: 5, needs: [6] });
  assert.equal(contractHold([store('app', 'ok', 6)], NEXT6, RUN5), null);
});

test('a site’s own app or theme (no store.json) is not held', () => {
  assert.equal(contractHold([{ kind: 'app', id: 'sara', record: null, manifest: '{"api":5}' }], NEXT6, RUN5), null);
  assert.equal(contractHold([{ kind: 'theme', id: 'mine', record: 'not json', manifest: null }], NEXT6, RUN5), null);
});

test('the same contract is not held', () => {
  assert.equal(contractHold([store('theme', 'venus'), store('app', 'a', 6)], { theme: 5, apps: [5, 6] }, RUN5), null);
});
