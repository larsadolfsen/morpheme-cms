// Tests for lib/front-banner.mjs: the Banner at the top of a page, under its H1, becomes the H1's section. Run: node --test lib/front-banner.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { blockHtml } from './blocks.mjs';
import { migrateFrontBanner, remarkFrontBanner } from './front-banner.mjs';
import { remarkBannerSections } from './remark-banner-section.mjs';
import { partsOfMarkdown, sectionsFromParts } from '../src/sections.mjs';

const buttons = { items: [{ label: 'Book', to: 'booking', kind: 'filled' }] };
const hero = (props) => blockHtml('hero', { text: `${blockHtml('buttons', buttons)}\n\nFree for everyone.`, ...props });
const page = (...parts) => `${parts.join('\n\n')}\n`;

test('a banner with its image behind the text stays a banner: a page’s H1 has no image', () => {
  const unchanged = (md) => assert.equal(migrateFrontBanner(md), md);
  unchanged(
    page(
      '# Welcome',
      'A short line.',
      '![A field](/images/field.jpg)',
      hero({ placement: 'behind', width: 'full' }),
      blockHtml('steps', {}),
    ),
  );
  unchanged(
    page(
      '# Welcome',
      blockHtml('hero', { text: `![A field](/images/field.jpg)\n\n${blockHtml('buttons', buttons)}`, placement: 'behind' }),
    ),
  );
  unchanged(page('# Welcome', '![x](/a.jpg#decorative)', hero({ placement: 'behind' })));
  unchanged(page('# Welcome', 'Some ![A field](/images/field.jpg) words', hero({ placement: 'behind' })));
  const out = migrateFrontBanner(page('# Welcome', '![A field](/images/field.jpg)', hero({ placement: 'behind' })));
  assert.doesNotMatch(out, /data-picture/);
});

test('a banner set to behind without an image migrates as one without settings', () => {
  assert.equal(
    migrateFrontBanner(page('# Welcome', hero({ placement: 'behind', width: 'full' }))),
    page('<div data-section="surface" data-width="full"></div>', '# Welcome', blockHtml('buttons', buttons), 'Free for everyone.'),
  );
});

test('a banner whose image is beside the text has no marker, and the image goes below the text and the buttons', () => {
  const md = page('# Welcome', 'A short line.', '![A field](/images/field.jpg)', hero({}));
  assert.equal(
    migrateFrontBanner(md),
    page('# Welcome', 'A short line.', blockHtml('buttons', buttons), 'Free for everyone.', '![A field](/images/field.jpg)'),
  );
  const inText = page('# Welcome', 'Some ![A field](/images/field.jpg) words', hero({}));
  assert.equal(
    migrateFrontBanner(inText),
    page('# Welcome', 'Some ![A field](/images/field.jpg) words', blockHtml('buttons', buttons), 'Free for everyone.'),
  );
});

test('a banner across the whole width without an image behind it is Surface and wide', () => {
  const md = page('# Welcome', hero({ width: 'full' }));
  assert.match(migrateFrontBanner(md), /^<div data-section="surface" data-width="full"><\/div>\n\n# Welcome\n\n/);
});

test('what cannot migrate stays a banner: hidden, a heading of its own, after a heading or a block, under an H1 with settings, an image inside a text', () => {
  const unchanged = (md) => assert.equal(migrateFrontBanner(md), md);
  unchanged(page('# Welcome', hero({ hidden: true })));
  unchanged(page('# Welcome', blockHtml('hero', { text: '## Own\n\nText' })));
  unchanged(page('# Welcome', '## Section', hero({})));
  unchanged(page('# Welcome', blockHtml('steps', {}), hero({})));
  unchanged(page(hero({})));
  unchanged(page('<div data-section="surface"></div>', '# Welcome', hero({})));
});

test('the plugin does the same on a tree', () => {
  const md = page('# Welcome', '![A field](/images/field.jpg)', hero({ width: 'full' }));
  const out = String(
    unified().use(remarkParse).use(remarkGfm).use(remarkBannerSections).use(remarkStringify, { bullet: '-' }).processSync(md),
  );
  assert.match(out, /^<div data-section="surface" data-width="full"><\/div>\n\n# Welcome/);
  assert.doesNotMatch(out, /data-picture/);
  assert.doesNotMatch(out, /data-block="hero"/);
  assert.match(out, /data-block="buttons"/);
  const tree = unified().use(remarkParse).parse('# Hi\n\nText\n');
  remarkFrontBanner(tree);
  assert.equal(tree.children.length, 2);
});

test('the front page reads the migrated text as the H1’s section: heading, text and buttons up to the next block', () => {
  const md = page('# Welcome', 'A short line.', '![A field](/images/field.jpg)', hero({ width: 'full' }), blockHtml('steps', {}));
  const sections = sectionsFromParts(partsOfMarkdown(migrateFrontBanner(md)), {}, { colors: true });
  assert.deepEqual(
    sections.map((s) => s.type),
    ['top', 'steps'],
  );
  assert.deepEqual(sections[0].settings, { color: 'surface', width: 'full' });
  assert.deepEqual(
    sections[0].items.map((i) => (i.block ? i.block.type : i.markdown)),
    ['A short line.', 'buttons', 'Free for everyone.\n\n![A field](/images/field.jpg)'],
  );
});

test('the demo’s front page: its banner has no settings, so there is no marker, and the text, the buttons and the image stay together under the heading', () => {
  const home = readFileSync(new URL('../demo/src/content/pages/home.md', import.meta.url), 'utf8').replace(/^---[\s\S]*?\n---\n/, '');
  const out = migrateFrontBanner(home);
  assert.doesNotMatch(out, /data-block="hero"/);
  assert.doesNotMatch(out, /data-section/);
  const [top, head, next] = sectionsFromParts(partsOfMarkdown(out), {}, { colors: true });
  assert.equal(top.type, 'top');
  assert.deepEqual(top.settings, { color: '' });
  assert.deepEqual(
    top.items.map((i) => (i.block ? i.block.type : i.markdown.slice(0, 20))),
    ['Edit pages, posts an', 'buttons', 'Free and open source'],
  );
  assert.match(top.items[2].markdown, /editor-start\.webp/);
  // The List after it had a heading of its own; it is the text's own heading now (lib/remark-list-head.mjs), a section before the List.
  assert.equal(head.type, 'text');
  assert.equal(next.type, 'list');
});

test('text and buttons at the top group only at the top of the sections, not after a banner that stays', () => {
  const md = page('# Hi', blockHtml('hero', { hidden: true, text: '' }), 'Text.', blockHtml('buttons', buttons));
  const types = sectionsFromParts(partsOfMarkdown(md), { hero: { upTo: 'buttons', body: 'text' } }, { colors: true }).map((s) => s.type);
  assert.deepEqual(types, ['hero', 'text', 'buttons']);
});

test('an image description with backslashes is escaped when the image moves, and a long run of them does not hang', () => {
  const alt = 'A \\ field [x]';
  const image = `![${alt.replace(/[\\[\]]/g, '\\$&')}](/images/field.jpg)`;
  const out = migrateFrontBanner(page('# Welcome', image, hero({})));
  assert.ok(out.trimEnd().endsWith(image));
  const start = Date.now();
  migrateFrontBanner(page('# Welcome', hero({ text: `![${'\\\\'.repeat(5000)}` })));
  assert.ok(Date.now() - start < 2000);
});
