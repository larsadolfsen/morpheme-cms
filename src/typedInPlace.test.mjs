// Tests for src/typedInPlace.mjs. Run: node --test src/typedInPlace.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { typedInPlace } from './typedInPlace.mjs';

const view = () => null;

test('a block with inline and a view is typed in place', () => {
  assert.equal(typedInPlace({ inline: { item: 'items', fields: ['title'] }, inlineView: view }), true);
});

test('a block with inline and no view keeps its sheet', () => {
  assert.equal(typedInPlace({ inline: { item: 'items', fields: ['title'] } }), false);
});

test('an app block without inline is unaffected, with or without a view', () => {
  assert.equal(typedInPlace({ app: 'shop' }), false);
  assert.equal(typedInPlace({ app: 'shop', inlineView: view }), false);
  assert.equal(typedInPlace(undefined), false);
});
