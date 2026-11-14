// Tests leadsOf (leads.mjs): the front-page leads of the blocks, keyed by block type, an app's over a standard one.
// Run: node --test src/standard/leads.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { leadsOf } from './leads.mjs';

test('keys a standard lead by its block type', () => {
  assert.deepEqual(leadsOf({ '/src/standard/faq/lead.ts': { lead: { body: 'text' } } }), { faq: { body: 'text' } });
});

test('keys an app lead by its block type', () => {
  const found = leadsOf({ '/src/apps/x/blocks/prices/lead.ts': { lead: { heading: 'heading' } } });
  assert.deepEqual(Object.keys(found), ['prices']);
});

test('an app lead wins over a standard one, in either order', () => {
  const standard = ['./faq/lead.ts', { lead: { heading: 'standard' } }];
  const app = ['/src/apps/x/blocks/faq/lead.ts', { lead: { heading: 'app' } }];
  assert.deepEqual(leadsOf(Object.fromEntries([standard, app])), { faq: { heading: 'app' } });
  assert.deepEqual(leadsOf(Object.fromEntries([app, standard])), { faq: { heading: 'app' } });
});

test('no modules, no leads', () => {
  assert.deepEqual(leadsOf({}), {});
});
