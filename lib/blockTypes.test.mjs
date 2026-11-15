import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blockHtml, blocksIn, parseBlock } from './blocks.mjs';

// The block types before `<app id>.<type>` existed: letters only.
const OLD = /<div data-block="([a-z]+)"(?: data-props="([^"]*)")?\s*><\/div>/;
const TYPES = ['list', 'faq', 'segmented', 'cards', 'table', 'pricecards', 'imagegrid', 'testimonials', 'posts', 'tickets', 'html'];

test('every type written as before still parses exactly as before', () => {
  for (const type of TYPES) {
    for (const props of [{}, { heading: 'A', items: [{ title: 'x' }] }]) {
      const html = blockHtml(type, props);
      assert.ok(OLD.test(html), type);
      assert.deepEqual(parseBlock(html), { type, props }, type);
    }
  }
});

test('what the old pattern refused is still refused, except <app id>.<type>', () => {
  for (const bad of ['Faq', 'faq-list', 'faq.', '.faq', 'a.b.c', 'faq list', '1faq', 'app.Faq', 'app.1faq'])
    assert.equal(parseBlock(`<div data-block="${bad}"></div>`), null, bad);
  for (const good of ['app.faq', 'app_a030dfba69793996.faq', 'inline-example.my-list'])
    assert.equal(parseBlock(`<div data-block="${good}"></div>`)?.type, good, good);
});

test('a text with old and new blocks finds each', () => {
  const text = `${blockHtml('list')}\n\n${blockHtml('shop.faq', { from: 'shop.q' })}\n\n${blockHtml('faq')}`;
  assert.deepEqual(
    blocksIn(text).map((b) => b.type),
    ['list', 'shop.faq', 'faq'],
  );
});
