/**
 * Tests that a form section with no visible field is not offered.
 * Depends on `node:test`, `node:assert/strict` and `./formSectionList.mjs`.
 */
import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { sectionsWithFields } from './formSectionList.mjs';

const sectionOf = (name) => (['status', 'publishAt'].includes(name) ? 'settings' : name === 'title' ? 'content' : 'other');
const shown = (f) => !['status', 'publishAt'].includes(f.name);
const names = (...n) => n.map((name) => ({ name }));

test('a post whose only settings fields are hidden has no settings section', () => {
  const ids = sectionsWithFields(names('status', 'publishAt', 'title', 'date'), sectionOf, shown);
  assert.equal(ids.has('settings'), false);
  assert.equal(ids.has('other'), true);
  assert.equal(ids.has('content'), true);
});

test('a section with a shown field stays', () => {
  const inSettings = (name) => (name === 'template' || name === 'status' ? 'settings' : 'other');
  const ids = sectionsWithFields(names('status', 'template'), inSettings, shown);
  assert.equal(ids.has('settings'), true);
});

test('no fields give no sections', () => {
  assert.equal(sectionsWithFields([], sectionOf, shown).size, 0);
});
