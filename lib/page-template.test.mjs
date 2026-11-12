// Tests for page-template helpers.
// Uses node:test and node:assert/strict.
// No other dependencies.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PAGE_TEMPLATES,
  STANDARD_TEMPLATES,
  templatesOf,
  templateOf,
  hasSidebar,
  templateChoices,
  templatesShown,
  templateProblems,
  templateWritten,
} from './page-template.mjs';

test('templatesOf undefined returns standard', () => {
  assert.deepEqual(templatesOf(undefined), ['single', 'sidebar-right', 'sidebar-left']);
});

test('templatesOf empty object returns standard', () => {
  assert.deepEqual(templatesOf({}), ['single', 'sidebar-right', 'sidebar-left']);
});

test('templatesOf valid custom list returns that list', () => {
  assert.deepEqual(templatesOf({ templates: ['sidebar-right', 'single'] }), ['sidebar-right', 'single']);
});

test('templatesOf empty array returns standard', () => {
  assert.deepEqual(templatesOf({ templates: [] }), ['single', 'sidebar-right', 'sidebar-left']);
});

test('templatesOf invalid item returns standard', () => {
  assert.deepEqual(templatesOf({ templates: ['nope'] }), ['single', 'sidebar-right', 'sidebar-left']);
});

test('templateOf no template returns first offered', () => {
  assert.equal(templateOf({}, ['sidebar-right', 'single']), 'sidebar-right');
});

test('templateOf valid template in offered returns it', () => {
  assert.equal(templateOf({ template: 'single' }, ['sidebar-right', 'single']), 'single');
});

test('templateOf valid template not in offered returns first offered', () => {
  assert.equal(templateOf({ template: 'full' }, ['sidebar-right', 'single']), 'sidebar-right');
});

test('templateOf non-string template returns first offered', () => {
  assert.equal(templateOf({ template: 3 }, ['single']), 'single');
});

test('templateOf null page returns first offered', () => {
  assert.equal(templateOf(null, ['single']), 'single');
});

test('hasSidebar sidebar-left', () => {
  assert.equal(hasSidebar('sidebar-left'), true);
});

test('hasSidebar sidebar-right', () => {
  assert.equal(hasSidebar('sidebar-right'), true);
});

test('hasSidebar single', () => {
  assert.equal(hasSidebar('single'), false);
});

test('hasSidebar full', () => {
  assert.equal(hasSidebar('full'), false);
});

test('hasSidebar undefined', () => {
  assert.equal(hasSidebar(undefined), false);
});

test('templateChoices false removes sidebar', () => {
  assert.deepEqual(templateChoices(['single', 'sidebar-right'], false), ['single']);
});

test('templateChoices true keeps all', () => {
  assert.deepEqual(templateChoices(['single', 'sidebar-right'], true), ['single', 'sidebar-right']);
});

test('templateChoices false removes sidebar-left', () => {
  assert.deepEqual(templateChoices(['sidebar-left', 'full'], false), ['full']);
});

test('templateProblems undefined returns empty', () => {
  assert.deepEqual(templateProblems(undefined), []);
});

test('templateProblems valid list returns empty', () => {
  assert.deepEqual(templateProblems(['single', 'sidebar-right']), []);
});

test('templateProblems non-array', () => {
  assert.deepEqual(templateProblems('single'), ['"templates" must be a list of template ids.']);
});

test('templateProblems empty array', () => {
  assert.deepEqual(templateProblems([]), ['"templates" must name at least one template.']);
});

test('templateProblems unknown template', () => {
  assert.deepEqual(templateProblems(['single', 'nope']), ['"templates" has an unknown template: nope.']);
});

test('templateProblems duplicate template', () => {
  assert.deepEqual(templateProblems(['single', 'single']), ['"templates" names single twice.']);
});

test('templatesOf returns new array', () => {
  const result = templatesOf(undefined);
  assert.deepEqual(result, STANDARD_TEMPLATES);
  result.push('extra');
  assert.equal(STANDARD_TEMPLATES.length, 3);
  assert.deepEqual(STANDARD_TEMPLATES, ['single', 'sidebar-right', 'sidebar-left']);
});

test('templateWritten leaves out the default and an empty value', () => {
  const offered = ['sidebar-right', 'single'];
  assert.equal(templateWritten('sidebar-right', offered), '');
  assert.equal(templateWritten('', offered), '');
  assert.equal(templateWritten(undefined, offered), '');
  assert.equal(templateWritten('single', offered), 'single');
  assert.equal(templateWritten('full', offered), 'full');
});

test('templatesShown leaves out sidebar templates while no side column is chosen', () => {
  const r = templatesShown(STANDARD_TEMPLATES, false, undefined);
  assert.deepEqual(r, { shown: ['single'], hidden: true });
});

test('templatesShown shows all when a side column is chosen', () => {
  assert.deepEqual(templatesShown(STANDARD_TEMPLATES, true, 'single'), { shown: STANDARD_TEMPLATES, hidden: false });
});

test('templatesShown keeps the page own unavailable template', () => {
  assert.deepEqual(templatesShown(STANDARD_TEMPLATES, false, 'sidebar-left'), { shown: ['single', 'sidebar-left'], hidden: true });
});

test('templatesShown: a theme of sidebar templates alone shows its default, no hint', () => {
  assert.deepEqual(templatesShown(['sidebar-right', 'sidebar-left'], false, undefined), { shown: ['sidebar-right'], hidden: false });
});

test('templatesShown: a theme without sidebar templates has nothing hidden', () => {
  assert.deepEqual(templatesShown(['single', 'full'], false, 'full'), { shown: ['single', 'full'], hidden: false });
});
