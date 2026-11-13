// A Segmented row's page link says the plain `Read more`, never with the row's heading in it. Run: node --test src/standard/segmented/link.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

test('the row link is the plain text, with no {topic} or heading in it', () => {
  const view = read('./view.ts');
  assert.match(view, /link: r\.href \? siteT\.blocks\.segmented\.readMore/);
  assert.doesNotMatch(view, /filledLink|\{topic\}/);
  for (const l of ['en-US', 'da-DK']) {
    const m = read(`../../i18n/${l}/blocks.ts`).match(/readMore: '([^']*)'/);
    assert.ok(m && m[1] && !m[1].includes('{'), l);
  }
});
