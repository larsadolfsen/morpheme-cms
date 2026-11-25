import { test } from 'node:test';
import assert from 'node:assert/strict';
import { declaredNames, envNames, missingNames } from './appWorkerBindings.mjs';

const wrangler = `{ "name": "site", "kv_namespaces": [{ "binding": "PUSH" }], "d1_databases": [{ "binding": "CONSENT" }], "vars": { "SITE": "x" } }`;

test('envNames reads the upper-case names after env.', () => {
  assert.deepEqual(envNames('env.CONSENT.prepare(); env.PUSH.get(); env.CONSENT; const env2 = env.lower;'), ['CONSENT', 'PUSH']);
});

test('declaredNames reads bindings and vars from wrangler.jsonc', () => {
  assert.deepEqual(declaredNames(wrangler).sort(), ['CONSENT', 'PUSH', 'SITE', 'site']);
});

test('missingNames names what an app reads that the site does not declare, and nothing else', () => {
  const apps = [
    { id: 'app_0123456789abcdef', code: 'env.CONSENT; env.SCAN_QUEUE; env.SITE' },
    { id: 'app_fedcba9876543210', code: 'env.PUSH' },
  ];
  assert.deepEqual(missingNames(apps, wrangler), [{ id: 'app_0123456789abcdef', names: ['SCAN_QUEUE'] }]);
});
