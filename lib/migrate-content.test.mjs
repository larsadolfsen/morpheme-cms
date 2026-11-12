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

test('an Expandable list with links to more pages becomes a Segmented list with row buttons', () => {
  const html = blockHtml('accordion', { items: [{ label: 'P', more: [{ label: 'H', href: '/h/' }] }] });
  assert.equal(migrateMarkdown(html), blockHtml('segmented', { items: [{ title: 'P', buttons: [{ label: 'H', href: '/h/' }] }] }));
});

test('a Checklist becomes a check list; a hidden one stays', () => {
  const html = blockHtml('checklist', { heading: 'On every site', items: ['One', 'Two'] });
  assert.equal(migrateMarkdown(`Text.\n\n${html}\n`), 'Text.\n\n**On every site**\n\n- [x] One\n- [x] Two\n');
  const hidden = blockHtml('checklist', { hidden: true, items: ['One'] });
  assert.equal(migrateMarkdown(hidden), hidden);
});

test('a Banner alone in its section becomes the section', () => {
  const hero = blockHtml('hero', { text: '## Hello\n\nWorld' });
  const migrated = migrateMarkdown(`# Page\n\n## Before\n\n${hero}\n\n## After\n`);
  assert.ok(!migrated.includes('data-block="hero"'));
  assert.ok(migrated.includes('## Hello'));
  assert.equal(migrateMarkdown(migrated), migrated);
});

test('the Banner under the H1 becomes the H1’s section, with its image behind', () => {
  const hero = blockHtml('hero', { placement: 'behind', width: 'full', text: '![A field](/images/a.jpg)\n\nWelcome' });
  const migrated = migrateMarkdown(`# Home\n\nLead.\n\n${hero}\n\n## Next\n`);
  assert.ok(!migrated.includes('data-block="hero"'));
  assert.ok(migrated.includes('data-section='));
  assert.ok(migrated.startsWith('<div data-section'));
  assert.equal(migrateMarkdown(migrated), migrated);
});

test('a Banner that cannot migrate stays a Banner', () => {
  const hero = blockHtml('hero', { text: 'No heading' });
  const text = `## One\n\ntext\n\n${hero}\n\n## Two\n`;
  assert.equal(migrateMarkdown(text), text);
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
