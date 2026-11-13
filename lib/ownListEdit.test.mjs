import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmDrop, definitionText, entriesIn, filesOfList, heldBy, listUses, renamed, toggleField } from './ownListEdit.mjs';
import { parseDefinition } from './ownList.mjs';

const def = { version: 1, label: 'Services', fields: ['icon', 'title', 'text'], dropped: [] };

test('toggleField: off keeps the field in `dropped`, on takes it out, a new field is added in order, title stays', () => {
  const off = toggleField(def, 'text', false);
  assert.deepEqual(off, { ...def, dropped: ['text'] });
  assert.deepEqual(toggleField(off, 'text', true), def);
  const added = toggleField(def, 'href', true);
  assert.deepEqual(added.fields, ['icon', 'title', 'text', 'href']);
  assert.deepEqual(toggleField(def, 'title', false), def);
  assert.deepEqual(toggleField(def, 'image', false), def);
  assert.deepEqual(toggleField(toggleField(def, 'text', false), 'icon', false).dropped, ['icon', 'text']);
});

test('definitionText parses back and leaves `dropped` out while empty', () => {
  const text = definitionText(def);
  assert.ok(!text.includes('dropped'));
  assert.deepEqual(parseDefinition(text).definition, def);
  const waiting = definitionText({ ...def, dropped: ['text'] });
  assert.deepEqual(parseDefinition(waiting).definition.dropped, ['text']);
  assert.ok(text.endsWith('\n'));
  assert.equal(renamed(def, '  Team ').label, 'Team');
  assert.equal(renamed(def, '   ').label, 'Services');
});

test('heldBy and confirmDrop: the key leaves every entry that has it, only those change, the definition forgets the field', () => {
  const files = [
    { path: 'src/data/s/a.json', text: '{"title":"A","text":"x"}' },
    { path: 'src/data/s/b.json', text: '{"title":"B"}' },
    { path: 'src/data/s/_list.json', text: '{}' },
    { path: 'src/data/s/broken.json', text: '{nope' },
  ];
  const entries = entriesIn(files, 'src/data/s');
  assert.deepEqual(
    entries.map((e) => e.path),
    ['src/data/s/a.json', 'src/data/s/b.json'],
  );
  assert.equal(heldBy(entries, 'text'), 1);
  const done = confirmDrop({ ...def, dropped: ['text'] }, 'text', entries);
  assert.deepEqual(done.definition, { ...def, fields: ['icon', 'title'], dropped: [] });
  assert.deepEqual(done.entries, [{ path: 'src/data/s/a.json', data: { title: 'A' } }]);
});

test('listUses finds pages and data files that read the list, hidden blocks too, and not its own folder', () => {
  const block = (props) => `<div data-block="list" data-props="${JSON.stringify(props).replace(/"/g, '&quot;')}"></div>`;
  const files = [
    { path: 'src/content/pages/a.md', text: `# A\n\n${block({ from: 'services' })}\n` },
    { path: 'src/content/pages/b.md', text: `# B\n\n${block({ from: 'other' })}\n` },
    { path: 'src/content/pages/c.md', text: `# C\n\n${block({ from: ' services ', hidden: true })}\n` },
    { path: 'src/content/pages/d.md', text: '# D\n\nno blocks\n' },
    { path: 'src/data/header.json', text: JSON.stringify({ sections: [{ type: 'list', from: 'services' }] }) },
    { path: 'src/data/footer.json', text: JSON.stringify({ from: 'services' }) },
    { path: 'src/data/services/web.json', text: JSON.stringify({ title: 'Web', from: 'services', type: 'x' }) },
  ];
  assert.deepEqual(listUses(files, 'services', 'src/data/services'), [
    'src/content/pages/a.md',
    'src/content/pages/c.md',
    'src/data/header.json',
  ]);
  assert.deepEqual(listUses(files, 'none', 'src/data/none'), []);
});

test('filesOfList is the entries and the definition', () => {
  const files = [
    { path: 'src/data/s/a.json', text: '' },
    { path: 'src/data/s/_list.json', text: '' },
    { path: 'src/data/t/a.json', text: '' },
  ];
  assert.deepEqual(
    filesOfList(files, 'src/data/s').map((f) => f.path),
    ['src/data/s/a.json', 'src/data/s/_list.json'],
  );
});
