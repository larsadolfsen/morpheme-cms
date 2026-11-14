import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addField,
  renameField,
  confirmDrop,
  definitionText,
  entriesIn,
  filesOfList,
  heldBy,
  listUses,
  moveField,
  renamed,
  toggleField,
} from './ownListEdit.mjs';
import { fieldsOf, parseDefinition } from './ownList.mjs';

const f = (id, kind = id.replace(/-\d+$/, '')) => ({ id, kind });
const def = { version: 2, label: 'Services', fields: [f('icon'), f('title'), f('text')], dropped: [] };

test('toggleField: off keeps the field in `dropped`, on takes it out', () => {
  const off = toggleField(def, 'text', false);
  assert.deepEqual(off, { ...def, dropped: ['text'] });
  assert.deepEqual(toggleField(off, 'text', true), def);
  assert.deepEqual(toggleField(def, 'nothing', false), def);
  assert.deepEqual(toggleField(toggleField(def, 'text', false), 'icon', false).dropped, ['icon', 'text']);
  // any field can go, the title too
  assert.deepEqual(toggleField(def, 'title', false).dropped, ['title']);
});

test('addField: a list starts empty, a kind can be added again, ids are never reused', () => {
  const empty = { version: 2, label: 'L', fields: [], dropped: [] };
  const one = addField(empty, 'text');
  assert.equal(one.id, 'text');
  const two = addField(one.definition, 'text');
  assert.equal(two.id, 'text-2');
  const three = addField(two.definition, 'text');
  assert.deepEqual(
    three.definition.fields.map((x) => x.id),
    ['text', 'text-2', 'text-3'],
  );
  // a dropped field still holds its id
  assert.equal(addField(toggleField(two.definition, 'text-2', false), 'text').id, 'text-3');
  assert.equal(addField(three.definition, 'image').id, 'image');
});

test('renameField sets and clears a field name', () => {
  const named = renameField(def, 'text', ' Intro ');
  assert.equal(named.fields[2].label, 'Intro');
  assert.equal('label' in renameField(named, 'text', ' ').fields[2], false);
  assert.deepEqual(renameField(def, 'nothing', 'x'), def);
});

test('definitionText parses back and leaves `dropped` out while empty', () => {
  const text = definitionText(def);
  assert.ok(!text.includes('dropped'));
  assert.deepEqual(parseDefinition(text).definition, def);
  assert.equal(JSON.parse(text).version, 2);
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
  assert.deepEqual(done.definition, { ...def, fields: [f('icon'), f('title')], dropped: [] });
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

test('moveField: a field moves one place, nothing moves past an end, the other parts of the definition stay', () => {
  const d = { ...def, dropped: ['text'], fields: [f('icon'), f('title'), f('text')] };
  assert.deepEqual(
    moveField(d, 'text', -1).fields.map((x) => x.id),
    ['icon', 'text', 'title'],
  );
  assert.deepEqual(
    moveField(d, 'icon', 1).fields.map((x) => x.id),
    ['title', 'icon', 'text'],
  );
  assert.equal(moveField(d, 'icon', -1), d);
  assert.equal(moveField(d, 'text', 1), d);
  assert.equal(moveField(d, 'nothing', 1), d);
  const moved = moveField(d, 'text', -1);
  assert.deepEqual(moved.dropped, ['text']);
  assert.equal(moved.label, 'Services');
  // The order is the order of an item's form (fieldsOf) and of the list's mapping.
  assert.deepEqual(
    fieldsOf(moveField(d, 'title', -1)).map((x) => x.id),
    ['title', 'icon'],
  );
});
