// Tests the Video block's own thumbnail. Run: node --test src/standard/video/video.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { thumbnailAlt, thumbnailOf } from './thumbnail.mjs';

test('no thumbnail is none, so the video link gives the still', () => {
  assert.equal(thumbnailOf({}), '');
  assert.equal(thumbnailOf({ thumbnail: '  ' }), '');
  assert.equal(thumbnailOf({ thumbnail: undefined }), '');
});

test('the thumbnail is the image the field holds', () => {
  assert.equal(thumbnailOf({ thumbnail: ' /images/poster.jpg ' }), '/images/poster.jpg');
});

test('the block has a Thumbnail image field, in its sheet, with texts in both languages', () => {
  const block = readFileSync(new URL('./index.tsx', import.meta.url), 'utf8');
  assert.match(block, /name: 'thumbnail',[^}]*type: 'image'/);
  assert.match(block, /settings: \['url', 'thumbnail', 'alt'\]/);
  for (const lang of ['en-US', 'da-DK']) {
    const texts = readFileSync(new URL(`../../i18n/${lang}/blocks.ts`, import.meta.url), 'utf8');
    const video = texts.slice(texts.indexOf('  video: {'));
    assert.match(video.slice(0, video.indexOf('},')), /thumbnail: '/, `${lang} has the field's label`);
  }
  assert.match(readFileSync(new URL('../../i18n/en-US/blocks.ts', import.meta.url), 'utf8'), /thumbnail: 'Thumbnail'/);
});

test('the view draws the thumbnail with the same View.tsx, and the site loads it', () => {
  const view = readFileSync(new URL('./view.ts', import.meta.url), 'utf8');
  const load = readFileSync(new URL('./load.ts', import.meta.url), 'utf8');
  assert.match(view, /thumbnailOf\(props\)/);
  assert.match(load, /thumbnailOf\(props\)/);
  assert.match(load, /imageOf\(thumbnail\)/);
});

test('a described thumbnail is drawn with its own text', () => {
  assert.equal(thumbnailAlt({ thumbnail: '/images/a.jpg', alt: ' A red door ' }), 'A red door');
  assert.equal(thumbnailAlt({ thumbnail: '/images/a.jpg', alt: 'Own text' }, { alt: 'Library text' }), 'Own text');
});

test('with no text of its own the Library’s text is used', () => {
  assert.equal(thumbnailAlt({ thumbnail: '/images/a.jpg' }, { alt: 'Library text' }), 'Library text');
});

test('a decorative thumbnail has an empty alt, never made up, and the text is never required', () => {
  assert.equal(thumbnailAlt({ thumbnail: '/images/a.jpg' }), '');
  assert.equal(thumbnailAlt({ thumbnail: '/images/a.jpg', alt: '  ' }), '');
  assert.equal(thumbnailAlt({ thumbnail: '/images/a.jpg' }, { decorative: true }), '');
  const block = readFileSync(new URL('./index.tsx', import.meta.url), 'utf8');
  const alt = block.slice(block.indexOf("name: 'alt'"), block.indexOf('}', block.indexOf("name: 'alt'")));
  assert.match(alt, /libraryText: 'thumbnail'/);
  assert.doesNotMatch(alt, /required/);
});

test('View.tsx draws the thumbnail’s alt, empty when decorative', () => {
  const view = readFileSync(new URL('../../../theme/blocks/video/View.tsx', import.meta.url), 'utf8');
  assert.match(view, /alt=\{still\.alt \?\? ''\}/);
});
