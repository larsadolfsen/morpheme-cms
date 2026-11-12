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
const MARKER = '<div data-section="" data-picture="/images/field.jpg" data-alt="A field" data-width="full"></div>';

test('a banner with its picture behind the text and the whole width: the picture goes to the H1’s marker, the rest stays', () => {
  const md = page(
    '# Welcome',
    'A short line.',
    '![A field](/images/field.jpg)',
    hero({ placement: 'behind', width: 'full' }),
    blockHtml('steps', {}),
  );
  assert.equal(
    migrateFrontBanner(md),
    page(MARKER, '# Welcome', 'A short line.', blockHtml('buttons', buttons), 'Free for everyone.', blockHtml('steps', {})),
  );
});

test('a banner whose picture is beside the text has no marker, and the picture goes below the text and the buttons', () => {
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

test('a banner across the whole width without a picture behind it is Surface and wide', () => {
  const md = page('# Welcome', hero({ width: 'full' }));
  assert.match(migrateFrontBanner(md), /^<div data-section="surface" data-width="full"><\/div>\n\n# Welcome\n\n/);
});

test('a picture in the banner’s own text goes behind the text from there', () => {
  const text = `![A field](/images/field.jpg)\n\n${blockHtml('buttons', buttons)}`;
  const out = migrateFrontBanner(page('# Welcome', blockHtml('hero', { text, placement: 'behind' })));
  assert.equal(
    out,
    page('<div data-section="" data-picture="/images/field.jpg" data-alt="A field"></div>', '# Welcome', blockHtml('buttons', buttons)),
  );
});

test('a decorative picture has no description', () => {
  const out = migrateFrontBanner(page('# Welcome', '![x](/a.jpg#decorative)', hero({ placement: 'behind' })));
  assert.match(out, /data-picture="\/a.jpg"/);
  assert.doesNotMatch(out, /data-alt/);
});

test('what cannot migrate stays a banner: hidden, a heading of its own, after a heading or a block, under an H1 with settings, a picture inside a text', () => {
  const unchanged = (md) => assert.equal(migrateFrontBanner(md), md);
  unchanged(page('# Welcome', hero({ hidden: true })));
  unchanged(page('# Welcome', blockHtml('hero', { text: '## Own\n\nText' })));
  unchanged(page('# Welcome', '## Section', hero({})));
  unchanged(page('# Welcome', blockHtml('steps', {}), hero({})));
  unchanged(page(hero({})));
  unchanged(page('<div data-section="surface"></div>', '# Welcome', hero({})));
  unchanged(page('# Welcome', 'Some ![A field](/images/field.jpg) words', hero({ placement: 'behind' })));
});

test('the plugin does the same on a tree', () => {
  const md = page('# Welcome', '![A field](/images/field.jpg)', hero({ placement: 'behind', width: 'full' }));
  const out = String(
    unified().use(remarkParse).use(remarkGfm).use(remarkBannerSections).use(remarkStringify, { bullet: '-' }).processSync(md),
  );
  assert.match(out, /^<div data-section="" data-picture="\/images\/field.jpg" data-alt="A field" data-width="full"><\/div>\n\n# Welcome/);
  assert.doesNotMatch(out, /data-block="hero"/);
  assert.match(out, /data-block="buttons"/);
  const tree = unified().use(remarkParse).parse('# Hi\n\nText\n');
  remarkFrontBanner(tree);
  assert.equal(tree.children.length, 2);
});

test('the front page reads the migrated text as the H1’s section: heading, text and buttons up to the next block', () => {
  const md = page(
    '# Welcome',
    'A short line.',
    '![A field](/images/field.jpg)',
    hero({ placement: 'behind', width: 'full' }),
    blockHtml('steps', {}),
  );
  const sections = sectionsFromParts(partsOfMarkdown(migrateFrontBanner(md)), {}, { colors: true });
  assert.deepEqual(
    sections.map((s) => s.type),
    ['top', 'steps'],
  );
  assert.deepEqual(sections[0].settings, { color: '', picture: '/images/field.jpg', alt: 'A field', width: 'full' });
  assert.deepEqual(
    sections[0].items.map((i) => (i.block ? i.block.type : i.markdown)),
    ['A short line.', 'buttons', 'Free for everyone.'],
  );
});

test('the demo’s front page: its banner has no settings, so there is no marker, and the text, the buttons and the picture stay together under the heading', () => {
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

test('a picture description with backslashes is escaped when the picture moves, and a long run of them does not hang', () => {
  const alt = 'A \\ field [x]';
  const md = page('# Welcome', `![${alt.replace(/[\\[\]]/g, '\\$&')}](/images/field.jpg)`, hero({ placement: 'behind' }));
  assert.match(migrateFrontBanner(md), /data-alt="A \\ field \[x\]"/);
  const start = Date.now();
  migrateFrontBanner(page('# Welcome', hero({ text: `![${'\\\\'.repeat(5000)}` })));
  assert.ok(Date.now() - start < 2000);
});
