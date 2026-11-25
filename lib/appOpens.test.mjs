// appOpens (lib/appOpens.mjs): what a button opens of a promotion, found in the list's own kinds, an app's index.ts or, for a
// contract 4 app, its app.json. Run: node --test lib/appOpens.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { appOpens } from './appOpens.mjs';

const ownOpens = { standard: { label: 'Pop-up', as: 'popup' } };
const indexes = { '/src/apps/mailchimp/index.ts': { default: { kinds: { popups: { opens: { label: 'Signup', as: 'signup' } } } } } };
const manifests = {
  '/src/apps/calendly/app.json': { kinds: { popups: { opens: { label: 'Bookingarket', as: 'booking' } } } },
  '/src/apps/mailchimp/app.json': { kinds: { popups: { opens: { label: 'From json', as: 'json' } } } },
  '/src/apps/plain/app.json': {},
};

test('an app with an index.ts is found there', () => {
  assert.deepEqual(appOpens(ownOpens, indexes, manifests, 'mailchimp'), { label: 'Signup', as: 'signup' });
});

test('an app with only an app.json is found there', () => {
  assert.deepEqual(appOpens(ownOpens, indexes, manifests, 'calendly'), { label: 'Bookingarket', as: 'booking' });
});

test('an unknown kind, and an app that opens nothing, give undefined', () => {
  assert.equal(appOpens(ownOpens, indexes, manifests, 'nothing'), undefined);
  assert.equal(appOpens(ownOpens, indexes, manifests, 'plain'), undefined);
});

test("the list's own kind wins, and no kind means the pop-up", () => {
  assert.deepEqual(appOpens(ownOpens, indexes, manifests, undefined), ownOpens.standard);
  assert.deepEqual(appOpens({ ...ownOpens, calendly: { label: 'Own', as: 'own' } }, indexes, manifests, 'calendly'), {
    label: 'Own',
    as: 'own',
  });
});
