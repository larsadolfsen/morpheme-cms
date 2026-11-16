// Tests the content migration of an update (lib/migrate-content.mjs): old-form blocks are written as the editor writes them, the rest
// of the text is untouched, and a migrated text stays as it is. Run: node --test lib/migrate-content.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blockHtml, parseBlock } from './blocks.mjs';
import { migrateFile, migrateMarkdown } from './migrate-content.mjs';

const rows = [{ icon: 'train', title: 'Fast', text: 'Quick', href: '/a/', more: 'Read more' }, { title: 'Slow' }];
const old = {
  points: blockHtml('points', { heading: 'Why', items: rows }),
  links: blockHtml('links', { groups: [{ title: 'Learn', href: '/learn/', paths: ['/a/'] }] }),
  accordion: blockHtml('accordion', { items: [{ label: 'Prices', text: 'Ours', href: '/prices/' }] }),
  segmentedList: blockHtml('list', { design: 'segmented', items: [{ title: 'One' }] }),
  plainList: blockHtml('list', { design: '', items: [{ title: 'One' }] }),
  segmentedFolds: blockHtml('segmented', { only: true, items: [{ title: 'One', text: 'First' }] }),
  segmentedOpen: blockHtml('segmented', { show: 'all', items: [{ title: 'One', text: 'First' }] }),
  blog: blockHtml('blog', { heading: 'News' }),
};

for (const [name, html] of Object.entries(old)) {
  test(`${name} is written as the block it is read as, and only that line changes`, () => {
    const text = `Intro.\n\n${html}\n\nOutro.\n`;
    const migrated = migrateMarkdown(text);
    const block = parseBlock(html);
    assert.equal(migrated, `Intro.\n\n${blockHtml(block.type, block.props)}\n\nOutro.\n`);
    assert.notEqual(migrated, text);
    assert.equal(migrateMarkdown(migrated), migrated);
  });
}

test('Points with icon lose the link text, Links become heading rows', () => {
  assert.ok(!migrateMarkdown(old.points).includes('Read more'));
  assert.ok(migrateMarkdown(old.links).includes('data-block="list"'));
});

test('an Accordion with links to more pages becomes a List - Expand with row buttons', () => {
  const html = blockHtml('accordion', { items: [{ label: 'P', more: [{ label: 'H', href: '/h/' }] }] });
  assert.equal(
    migrateMarkdown(html),
    blockHtml('expand', { design: 'card', items: [{ title: 'P', buttons: [{ label: 'H', href: '/h/' }] }] }),
  );
});

test('a Checklist becomes a check list; a hidden one stays', () => {
  const html = blockHtml('checklist', { heading: 'On every site', items: ['One', 'Two'] });
  assert.equal(migrateMarkdown(`Text.\n\n${html}\n`), 'Text.\n\n**On every site**\n\n- [x] One\n- [x] Two\n');
  const hidden = blockHtml('checklist', { hidden: true, items: ['One'] });
  assert.equal(migrateMarkdown(hidden), hidden);
});

test('a text without old blocks is returned as it is, byte for byte', () => {
  const text = `# T\r\n\r\n*x*  \r\n\r\n${blockHtml('steps', {})}\r\n`;
  assert.equal(migrateMarkdown(text), text);
});

test('a file keeps its front matter, a draft stays a draft', () => {
  const file = `---\ntitle: 'A'\nstatus: draft\n---\n${old.points}\n`;
  const out = migrateFile(file);
  assert.ok(out.startsWith("---\ntitle: 'A'\nstatus: draft\n---\n"));
  assert.ok(out.includes('data-block="list"'));
  assert.equal(migrateFile(out), out);
});

test('a label in its former class is written as label-medium, and code stays', async () => {
  const { migrateMarkdown } = await import('./migrate-content.mjs');
  const text = '<p class="block-eyebrow">Eyebrow</p>\n## Title\n\n```\n<p class="block-eyebrow">Code</p>\n```\n';
  const done = migrateMarkdown(text);
  assert.equal(done, text.replace('"block-eyebrow">Eyebrow', '"label-medium">Eyebrow'));
  assert.equal(migrateMarkdown(done), done);
});

// 0.18: a page's H1 has no background image; an image left in the marker before it is dropped by `morpheme migrate`.
const pic = 'data-picture="/images/uploads/2026/10/moon.webp"';
const h1Page = (marker, rest = '# Title\n\nText.\n') => `${marker}\n\n${rest}`;
test('an H1 marker with only an image goes with its line', () => {
  assert.equal(migrateMarkdown(h1Page(`<div data-section="" ${pic}></div>`)), '# Title\n\nText.\n');
  assert.equal(migrateMarkdown(h1Page(`<div data-section="" ${pic} data-alt="Moon"></div>`)), '# Title\n\nText.\n');
});
test('an H1 marker keeps its colour and its width, and drops the image and the alt', () => {
  assert.equal(
    migrateMarkdown(h1Page(`<div data-section="primary" ${pic} data-alt="Moon"></div>`)),
    h1Page('<div data-section="primary"></div>'),
  );
  // A width without a colour is no marker for the editor (parseMarker, markerHtml), so nothing is left of it.
  assert.equal(migrateMarkdown(h1Page(`<div data-section="" ${pic} data-width="full"></div>`)), '# Title\n\nText.\n');
  assert.equal(
    migrateMarkdown(h1Page(`<div data-section="secondary" ${pic} data-width="full"></div>`)),
    h1Page('<div data-section="secondary" data-width="full"></div>'),
  );
  const both = migrateMarkdown(h1Page(`<div data-section="tertiary" ${pic} data-width="full"></div>`));
  assert.equal(both, h1Page('<div data-section="tertiary" data-width="full"></div>'));
  assert.equal(migrateMarkdown(both), both);
});
test('an H1 marker above a label line is migrated too', () => {
  const label = '<p class="label-medium">Eyebrow</p>';
  assert.equal(migrateMarkdown(`<div data-section="" ${pic}></div>\n\n${label}\n\n# Title\n`), `${label}\n\n# Title\n`);
});
test('a marker on an H2, or on an H1 without an image, stays as it is', () => {
  const h2 = `# Title\n\n<div data-section="" ${pic}></div>\n\n## Part\n\nText.\n`;
  assert.equal(migrateMarkdown(h2), h2);
  const plain = h1Page('<div data-section="primary" data-width="full"></div>');
  assert.equal(migrateMarkdown(plain), plain);
});

test('an elevated button is written as tonal, in Buttons, Cards and Price cards, and nothing else changes', () => {
  const html = blockHtml('buttons', { items: [{ label: 'Book', to: 'page', kind: 'elevated', icon: 'calendar-blank' }, { label: 'Go' }] });
  const card = blockHtml('cards', { design: 'elevated', items: [{ title: 'A', buttons: [{ label: 'Go', kind: 'elevated' }] }] });
  const text = `Intro.\n\n${html}\n\n${card}\n\nOutro.\n`;
  const migrated = migrateMarkdown(text);
  assert.ok(!migrated.includes('&quot;kind&quot;:&quot;elevated&quot;'));
  assert.ok(migrated.includes('&quot;kind&quot;:&quot;tonal&quot;'));
  assert.ok(migrated.includes('&quot;design&quot;:&quot;elevated&quot;'), 'the card design stays elevated');
  assert.ok(migrated.startsWith('Intro.\n\n') && migrated.endsWith('\n\nOutro.\n'));
  assert.equal(migrateMarkdown(migrated), migrated);
});
