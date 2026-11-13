// Tests for src/seoImages.ts (the images the SEO rating's alt check reads). Run: node --test src/seoImages.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blockHtml } from '../lib/blocks.mjs';
import { markerHtml } from '../lib/section-marker.mjs';
import { altUseOk, images } from './seoImages.ts';

const without = (body) => images(body).filter((i) => !altUseOk(i)).length;

test('the rule: decorative, an own alt or a base alt is fine; else missing', () => {
  assert.equal(altUseOk({ alt: '', decorative: false }), false);
  assert.equal(altUseOk({ alt: ' A dog ' }), true);
  assert.equal(altUseOk({ alt: '', decorative: true }), true);
  assert.equal(altUseOk({ alt: '', base: 'A dog' }), true);
});

test('text images still work', () => {
  assert.equal(without('![](/a.jpg)'), 1);
  assert.equal(without('![A dog](/a.jpg)'), 0);
  assert.equal(without('![](/a.jpg#decorative)'), 0);
  assert.equal(without('<img src="/a.jpg">'), 1);
  assert.equal(without('<img src="/a.jpg" alt="">'), 0);
});

test('a section image without a description is missing, with one it is fine', () => {
  assert.equal(without(`${markerHtml({ color: '', image: '/a.jpg' })}\n\n## Title`), 1);
  assert.equal(without(`${markerHtml({ color: '', image: '/a.jpg', alt: 'A field' })}\n\n## Title`), 0);
  assert.equal(images(markerHtml({ color: 'primary' })).length, 0);
});

test('an image in the text of a block counts, also in a block in a block', () => {
  const inner = blockHtml('buttons', { text: '![](/b.jpg)' });
  assert.equal(without(blockHtml('notice', { text: '![](/a.jpg)' })), 1);
  assert.equal(without(blockHtml('notice', { text: '![A dog](/a.jpg)' })), 0);
  assert.equal(without(blockHtml('notice', { text: '![](/a.jpg#decorative)' })), 0);
  assert.equal(without(blockHtml('hero', { text: `x\n${inner}` })), 1);
});

test('a Cards block has no description field for its images, so each counts as missing', () => {
  assert.equal(without(blockHtml('cards', { media: 'image', items: [{ title: 'A', image: '/a.jpg' }, { title: 'B' }] })), 1);
  assert.equal(without(blockHtml('cards', { media: 'icon', items: [{ title: 'A', image: '/a.jpg' }] })), 0);
});

test('an image is counted once, also when its block sits among the text', () => {
  assert.equal(images(`![](/a.jpg)\n\n${blockHtml('notice', { text: '![](/b.jpg)' })}\n\n![x](/c.jpg)`).length, 3);
});
