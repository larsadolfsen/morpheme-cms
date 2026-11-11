// Tests for lib/remark-banner-section.mjs: a Banner block becomes a section with its settings. Run: node --test lib/remark-banner-section.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { blockHtml } from './blocks.mjs';
import { bannerMarkdown, remarkBannerSections } from './remark-banner-section.mjs';

const buttons = blockHtml('buttons', { items: [{ label: 'Book', to: 'booking', kind: 'filled' }] });
const text = `## Welcome\n\nA short line.\n\n![A field](/images/field.jpg)\n\n${buttons}\n\nFree for everyone.`;
const through = (markdown) =>
  String(unified().use(remarkParse).use(remarkGfm).use(remarkBannerSections).use(remarkStringify, { bullet: '-' }).processSync(markdown));

test('a banner with its picture behind the text and the whole width is a section with a picture and a width', () => {
  assert.equal(
    bannerMarkdown({ text, placement: 'behind', width: 'full' }),
    [
      '<div data-section="" data-picture="/images/field.jpg" data-alt="A field" data-width="full"></div>',
      '## Welcome',
      'A short line.',
      buttons,
      'Free for everyone.',
    ].join('\n\n'),
  );
});

test('a banner as wide as the window without a picture behind it is a Surface section as wide', () => {
  const md = bannerMarkdown({ text: `## Hi\n\nText`, width: 'full' });
  assert.equal(md, '<div data-section="surface" data-width="full"></div>\n\n## Hi\n\nText');
});

test('a plain banner is a heading and its text, and a picture beside the text stays in the text', () => {
  assert.equal(bannerMarkdown({ text: '## Hi\n\nText' }), '## Hi\n\nText');
  assert.equal(bannerMarkdown({ text: '## Hi\n\nText\n\n![Me](/me.jpg)', placement: '' }), '## Hi\n\nText\n\n![Me](/me.jpg)');
});

test('a decorative picture has no description', () => {
  const md = bannerMarkdown({ text: '## Hi\n\n![x](/a.jpg#decorative)', placement: 'behind' });
  assert.match(md ?? '', /data-picture="\/a.jpg"/);
  assert.doesNotMatch(md ?? '', /data-alt/);
});

test('a hidden banner and one without a heading of its own are not migrated', () => {
  assert.equal(bannerMarkdown({ text, hidden: true }), null);
  assert.equal(bannerMarkdown({ text: `${buttons}\n\nText` }), null);
});

test('the plugin replaces a banner that is alone in its section, and leaves one with more after it', () => {
  const banner = blockHtml('hero', { text: '## Hi\n\nText', width: 'full' });
  const alone = through(`# Page\n\n${banner}\n\n## Next\n\nmore\n`);
  assert.match(alone, /<div data-section="surface" data-width="full"><\/div>\n\n## Hi\n\nText\n\n## Next/);
  assert.doesNotMatch(alone, /data-block="hero"/);
  const withMore = through(`${banner}\n\n${blockHtml('steps', {})}\n`);
  assert.match(withMore, /data-block="hero"/);
  assert.match(through(`${banner}\n`), /## Hi/);
});

test('the front page’s top, whose heading is above the block, is left as it is', () => {
  const md = `## Welcome\n\nIntro\n\n${blockHtml('hero', { text: `${buttons}\n\nText` })}\n`;
  assert.match(through(md), /data-block="hero"/);
});
