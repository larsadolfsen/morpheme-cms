// Tests for lib/appLists.mjs and the date kind.
import test from 'node:test';
import assert from 'node:assert/strict';
import { listFolder } from './appLists.mjs';
import { KINDS, parseDefinition } from './ownList.mjs';

test('an app list lives in src/data/<app id>.<id>', () => {
  assert.equal(listFolder('app_123', 'faq'), 'app_123.faq');
});

test('the date kind is a date field with no place in a row', () => {
  assert.deepEqual(
    KINDS.find((k) => k.id === 'date'),
    { id: 'date', type: 'date', asRows: null },
  );
  const text = JSON.stringify({ version: 2, label: 'Events', fields: [{ id: 'when', kind: 'date' }] });
  assert.equal(parseDefinition(text).problems, undefined);
});
