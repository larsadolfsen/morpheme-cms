// Tests templateRoundTripProblem (template-round-trip.mjs) with the real writeFields and templateWritten.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { writeFields } from '../src/frontmatter.mjs';
import { STANDARD_TEMPLATES, templateWritten } from '../lib/page-template.mjs';
import { templateRoundTripProblem } from './template-round-trip.mjs';

const deps = { writeFields, templateWritten, templates: STANDARD_TEMPLATES };

test('a page with no template round-trips', () => {
  assert.equal(templateRoundTripProblem('title: "X"', deps), null);
});

test('a page with a template round-trips', () => {
  assert.equal(templateRoundTripProblem('title: "X"\ntemplate: "sidebar-right"', deps), null);
});

test('the chosen front matter has the template line', () => {
  const chosen = writeFields('title: "X"', { template: templateWritten('sidebar-left', STANDARD_TEMPLATES) });
  assert.match(chosen, /^template: "?sidebar-left"?$/m);
});

test('a writer that drops other keys is reported', () => {
  const broken = (yaml, fields) => (fields.template ? `template: "${fields.template}"` : writeFields(yaml, fields));
  assert.notEqual(templateRoundTripProblem('title: "X"', { ...deps, writeFields: broken }), null);
});
