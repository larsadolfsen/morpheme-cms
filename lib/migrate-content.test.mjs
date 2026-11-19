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

test('a List with the design segmented is already as it is written: nothing changes', () => {
  const html = `Intro.\n\n${blockHtml('list', { design: 'segmented', items: [{ title: 'One' }] })}\n\nOutro.\n`;
  assert.equal(migrateMarkdown(html), html);
});

test('Points with icon lose the link text, Links become heading rows', () => {
  assert.ok(!migrateMarkdown(old.points).includes('Read more'));
  assert.ok(migrateMarkdown(old.links).includes('data-block="list"'));
});

test('an Accordion with links to more pages becomes a List - Expand with row buttons', () => {
  const html = blockHtml('accordion', { items: [{ label: 'P', more: [{ label: 'H', href: '/h/' }] }] });
  assert.equal(
    migrateMarkdown(html),
    blockHtml('expand', { design: 'segmented', items: [{ title: 'P', buttons: [{ label: 'H', href: '/h/' }] }] }),
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
  const label = '<p class="mo-type-label-medium">Eyebrow</p>';
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

// 0.19.0: the class names the editor writes (M1's map, docs/superpowers/plans/mo-names/map.json) are rewritten in the same run.
test('the six names saved in content are rewritten in a page, only their class attribute', async () => {
  const { migrateFile: file } = await import('./migrate-content.mjs');
  const page = [
    '---',
    'title: "body-small and color-accent"',
    '---',
    '',
    '<p class="label-medium">label-medium</p>',
    '',
    '# Early <span class="color-accent">color-accent</span> and <span class="color-muted">color-muted</span>',
    '',
    '<p class="body-large">body-large</p>',
    '',
    '<p class="body-small my-own-class">body-small</p>',
    '',
    '<p class="block-eyebrow">block-eyebrow</p>',
    '',
    '- <span class="body-small">small</span>',
    '',
    'Code `<p class="body-small">` stays.',
    '',
    '```html',
    '<p class="body-small">fence</p>',
    '```',
    '',
  ].join('\n');
  const done = file(page);
  assert.equal(
    done,
    page
      .replace('<p class="label-medium">label', '<p class="mo-type-label-medium">label')
      .replace('class="color-accent">color', 'class="mo-has-accent-color">color')
      .replace('class="color-muted">', 'class="mo-has-muted-color">')
      .replace('class="body-large"', 'class="mo-type-body-large"')
      .replace('class="body-small my-own-class"', 'class="mo-type-body-small my-own-class"')
      .replace('class="block-eyebrow"', 'class="mo-type-label-medium"')
      .replace('<span class="body-small">', '<span class="mo-type-body-small">'),
  );
  assert.equal(file(done), done);
});

test('prose and not-prose are rewritten in a class attribute only, and come back with the revert', async () => {
  const { migrateFile: file } = await import('./migrate-content.mjs');
  const { revertClassNames } = await import('./content-class-names.mjs');
  const page = [
    '---',
    'title: "prose and not-prose"',
    '---',
    '',
    '<div class="prose my-own"><p>prose</p></div>',
    '',
    '<div class="not-prose"><p>not-prose</p></div>',
    '',
    'Code `<div class="not-prose">` stays, and so does the word prose.',
    '',
  ].join('\n');
  const done = file(page);
  assert.equal(
    done,
    page
      .replace('class="prose my-own"', 'class="mo-prose my-own"')
      .replace('<div class="not-prose"><p>', '<div class="mo-is-not-prose"><p>'),
  );
  assert.equal(file(done), done);
  assert.equal(revertClassNames(done), page);
});

test('a page that already has the new names is left as it is', async () => {
  const { migrateFile: file } = await import('./migrate-content.mjs');
  const page =
    '---\ntitle: "A"\n---\n\n<p class="mo-type-label-medium">L</p>\n\n<span class="mo-has-accent-color">x</span> <p class="mo-type-body-small">s</p>\n';
  assert.equal(file(page), page);
});

test('revertClassNames brings the names of the version before back', async () => {
  const { migrateClassNames, revertClassNames } = await import('./content-class-names.mjs');
  const old = '<p class="body-large">a</p>\n<span class="color-muted">b</span>\n<p class="label-medium">c</p>\n';
  assert.equal(revertClassNames(migrateClassNames(old)), old);
});

// A label saved as `block-eyebrow` (0.17) or as `label-medium` (what 0.18's eyebrow migration wrote) ends in the final name, `mo-type-label-medium`,
// through the build-time path (`morpheme migrate`, no version gate) and through the Worker's update into 0.19.0.
test('a label in an older class ends in mo-type-label-medium on every migration path', async () => {
  const { migrateClassNamesPath } = await import('./content-class-names.mjs');
  const page = (cls) => `---\ntitle: Home\n---\n\n<p class="${cls}">How it works</p>\n\n## Steps\n\nText\n`;
  const final = page('mo-type-label-medium');
  for (const cls of ['block-eyebrow', 'label-medium', 'mo-type-label-medium']) {
    assert.equal(migrateFile(page(cls)), final, `migrateFile ${cls}`);
    assert.equal(migrateClassNamesPath('src/content/pages/home.md', page(cls)), final, `Worker ${cls}`);
  }
  assert.equal(migrateFile(final), final);
});
