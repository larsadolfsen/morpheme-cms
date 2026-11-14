// A page has no image at the top: its images are in its text, and its one image setting is the share image (`shareImage`). Blog
// posts keep their image at the top (`image`, `imageAlt`, `imageDecorative`). Owner, 14 Nov 2026
// (docs/superpowers/specs/2026-11-14-no-page-top-image-design.md). collections.ts imports `@site/*`, so it is read as text: the
// fields of a collection are its own `name:` entries and those of the shared field lists it names (`...seo`, `canonical`).
// Run: node --test defaults/collections.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./collections.ts', import.meta.url), 'utf8');

/** The source of `const <name>` up to the next top-level `const`, `export` or comment line. */
const definition = (name) => {
  const start = source.search(new RegExp(`^const ${name}\\b`, 'm'));
  if (start < 0) return '';
  const rest = source.slice(start + 1);
  const end = rest.search(/^(const|export|\/\/)/m);
  return end < 0 ? rest : rest.slice(0, end);
};

/** The field names of a collection: its own and those of the shared lists and fields it names. */
const fieldsOf = (id) => {
  const start = source.indexOf(`id: '${id}',`);
  assert.ok(start > 0, `collection ${id} not found`);
  const end = source.indexOf('kind:', start);
  const block = source.slice(start, end < 0 ? undefined : end);
  const fields = block.slice(block.indexOf('fields: ['));
  const shared = [...fields.matchAll(/^\s*(?:\.\.\.)?([A-Za-z]+)(?:\(\))?,\s*$/gm)].map((m) => definition(m[1]));
  return [fields, ...shared].flatMap((text) => [...text.matchAll(/name: '([^']+)'/g)].map((m) => m[1]));
};

test('a page has no image at the top', () => {
  const names = fieldsOf('pages');
  assert.ok(names.includes('shareImage'), 'the share image stays');
  for (const name of ['image', 'imageAlt', 'imageDecorative']) assert.ok(!names.includes(name), `pages has the field ${name}`);
});

test('a blog post keeps its image at the top', () => {
  const names = fieldsOf('blog');
  for (const name of ['image', 'imageAlt', 'imageDecorative']) assert.ok(names.includes(name), `posts lacks the field ${name}`);
});
