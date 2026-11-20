import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KINDS,
  newFieldId,
  nameOf,
  labelOfEntry,
  parseDefinition,
  idOf,
  fieldsOf,
  asRowsOf,
  entryProblems,
  dropField,
  isEntryPath,
  entryOfRow,
  rowOfEntry,
  entrySlug,
  ownListProblems,
  moveOrders,
  nextOrder,
} from './ownList.mjs';
import { rowsFromItems, itemOfEntry } from '../src/standard/rows/rows.mjs';

const kindsOf = (ids) => ids.map((id) => ({ id, kind: id.replace(/-\d+$/, '') }));
const all = { version: 2, label: 'Services', fields: kindsOf(['icon', 'title', 'text', 'image', 'href', 'tags']), dropped: [] };
const def = (extra = {}) => JSON.stringify({ ...all, ...extra });
const v1 = (extra = {}) =>
  JSON.stringify({ version: 1, label: 'Services', fields: ['icon', 'title', 'text', 'image', 'href', 'tags'], ...extra });

test('KINDS are the six kinds in order', () => {
  assert.deepEqual(
    KINDS.map((f) => f.id),
    ['icon', 'title', 'text', 'image', 'href', 'tags'],
  );
});

test('parseDefinition: valid', () => {
  const { definition, problems } = parseDefinition(def({ fields: kindsOf(['tags', 'title', 'icon', 'text-2']), dropped: ['tags'] }));
  assert.equal(problems, undefined);
  assert.deepEqual(definition, {
    version: 2,
    label: 'Services',
    fields: kindsOf(['tags', 'title', 'icon', 'text-2']),
    dropped: ['tags'],
  });
  assert.deepEqual(parseDefinition(def()).definition.dropped, []);
  assert.deepEqual(parseDefinition(def({ fields: [] })).definition.fields, []);
  assert.equal(parseDefinition(def({ fields: [{ id: 'a', kind: 'text', label: ' Intro ' }] })).definition.fields[0].label, 'Intro');
});

test('parseDefinition reads version 1 as version 2 with each id equal to its kind', () => {
  const { definition } = parseDefinition(v1({ fields: ['tags', 'title', 'icon'], dropped: ['tags'] }));
  assert.deepEqual(definition, { version: 2, label: 'Services', fields: kindsOf(['icon', 'title', 'tags']), dropped: ['tags'] });
  // the entries of a version 1 list are valid and read as before, with no rewrite
  const entry = { title: 'Web', icon: 'globe', tags: ['a'], order: 1 };
  assert.deepEqual(entryProblems(definition, { ...entry, tags: [] }), []);
  assert.deepEqual(asRowsOf(definition), { icon: 'icon', title: 'title' });
  assert.deepEqual(asRowsOf(parseDefinition(v1()).definition), { title: 'title', text: 'text', icon: 'icon', href: 'href', tags: 'tags' });
  assert.deepEqual(rowOfEntry(entry, ['icon', 'title']), { title: 'Web', icon: 'globe' });
  assert.match(parseDefinition(v1({ fields: ['title', 'colour'] })).problems.join(), /Unknown field "colour"/);
});

test('parseDefinition: problems', () => {
  const p = (text) => parseDefinition(text).problems?.join(' ');
  assert.match(p('{nope'), /not valid JSON/);
  assert.match(p('[]'), /object/);
  assert.match(p(def({ fields: [{ id: 'a', kind: 'colour' }] })), /unknown kind "colour"/);
  assert.match(p(def({ fields: [{ id: 'A b', kind: 'text' }] })), /needs an id/);
  assert.match(p(def({ fields: ['title'] })), /needs an id/);
  assert.match(p(def({ fields: [{ id: 'order', kind: 'text' }] })), /"order"/);
  assert.match(p(def({ fields: kindsOf(['title', 'title']) })), /used twice/);
  assert.match(p(def({ dropped: ['nothing'] })), /not one of the fields/);
  assert.match(p(def({ version: 3 })), /version 3/);
  assert.match(p(def({ label: ' ' })), /label/);
});

test('idOf', () => {
  assert.deepEqual(idOf('Ydelser og \u00c5', []), { id: 'ydelser-og-aa' });
  assert.deepEqual(idOf('Caf\u00e9 \u00d8rn', []), { id: 'cafe-oern' });
  assert.equal(idOf('Services', ['services']).problem.length > 0, true);
  assert.equal(idOf('Services', ['services']).suggestion, 'services-2');
  assert.equal(idOf('Services', ['services', 'services-2']).suggestion, 'services-3');
  assert.equal(idOf('Categories', new Set(['categories'])).id, undefined);
  assert.ok(idOf('!!!', []).problem);
  assert.ok(idOf('_hidden', []).id === 'hidden');
  const long = idOf('a'.repeat(30) + ' ' + 'b'.repeat(30), []).id;
  assert.ok(long.length <= 40 && !long.endsWith('-'));
  assert.ok(idOf('a'.repeat(60), ['a'.repeat(40)]).suggestion.length <= 40);
});

test('fieldsOf leaves out dropped fields', () => {
  assert.deepEqual(
    fieldsOf({ ...all, dropped: ['image', 'tags'] }).map((f) => f.id),
    ['icon', 'title', 'text', 'href'],
  );
  assert.equal(fieldsOf(all).length, 6);
  assert.equal(fieldsOf(all)[0].type, 'icon');
});

test('asRowsOf: the first visible field of each kind', () => {
  assert.deepEqual(asRowsOf({ ...all, fields: kindsOf(['title']) }), { title: 'title' });
  assert.deepEqual(asRowsOf({ ...all, fields: [] }), { title: '' });
  assert.deepEqual(asRowsOf(all), { title: 'title', text: 'text', icon: 'icon', href: 'href', tags: 'tags' });
  assert.equal('image' in asRowsOf(all), false);
  assert.equal('icon' in asRowsOf({ ...all, dropped: ['icon'] }), false);
  const two = { ...all, fields: kindsOf(['text-2', 'text', 'title']) };
  assert.equal(asRowsOf(two).text, 'text-2');
  assert.equal(asRowsOf({ ...two, dropped: ['text-2'] }).text, 'text');
});

test('asRowsOf: no title field, the first body text names the row', () => {
  const d = (ids) => ({ ...all, fields: kindsOf(ids) });
  assert.deepEqual(asRowsOf(d(['text', 'icon'])), { title: 'text', icon: 'icon' });
  assert.deepEqual(asRowsOf(d(['text', 'text-2'])), { title: 'text', text: 'text-2' });
  assert.deepEqual(asRowsOf(d(['image'])), { title: '' });
});

test('newFieldId and nameOf', () => {
  assert.equal(newFieldId({ fields: [] }, 'text'), 'text');
  assert.equal(newFieldId({ fields: kindsOf(['text', 'text-3']) }, 'text'), 'text-2');
  const d = {
    fields: [
      { id: 'text', kind: 'text' },
      { id: 'text-2', kind: 'text' },
      { id: 'text-3', kind: 'text', label: 'Intro' },
      { id: 'image', kind: 'image' },
    ],
  };
  const names = { text: 'Body text', image: 'Image' };
  assert.deepEqual(
    d.fields.map((f) => nameOf(d, f, names)),
    ['Body text', 'Body text 2', 'Intro', 'Image'],
  );
});

test('labelOfEntry: the first title, else the first body text, else nothing', () => {
  const d = { ...all, fields: kindsOf(['text', 'title-2', 'title']) };
  assert.equal(labelOfEntry(d, { text: 'b', 'title-2': 'second', title: 'first' }), 'second');
  assert.equal(labelOfEntry(d, { text: ' body ' }), 'body');
  assert.equal(labelOfEntry(d, { image: 'x' }), '');
});

test('entryProblems', () => {
  const d = { ...all, fields: kindsOf(['title', 'text', 'tags', 'tags-2']), dropped: ['text'] };
  const known = { tags: ['a', 'b'] };
  assert.deepEqual(entryProblems(d, { title: 'x', tags: ['a'], order: 1 }, known), []);
  assert.match(entryProblems(d, { title: 'x', colour: 'red' }).join(), /no field "colour"/);
  assert.match(entryProblems(d, { title: 'x', image: 'p' }).join(), /no field "image"/);
  assert.deepEqual(entryProblems(d, { title: 'x', text: 'kept' }), []);
  assert.match(entryProblems(d, { title: 'x', tags: ['zzz'] }, known).join(), /"zzz" does not exist/);
  assert.deepEqual(entryProblems(d, { title: 'x', tags: ['zzz'] }), []);
  assert.deepEqual(entryProblems(d, { tags: [] }), []);
  assert.deepEqual(entryProblems(d, { 'tags-2': ['a'] }, known), []);
  assert.match(entryProblems(d, { 'tags-2': 'a' }).join(), /list of tags/);
  assert.match(entryProblems(d, { title: 'x', order: 'a' }).join(), /order/);
});

test('dropField', () => {
  const a = { title: 'a', image: 'p' };
  const b = { title: 'b' };
  const out = dropField([a, b], 'image');
  assert.deepEqual(out, [{ title: 'a' }, { title: 'b' }]);
  assert.equal(out[1], b);
  assert.deepEqual(a, { title: 'a', image: 'p' });
});

test('isEntryPath', () => {
  assert.equal(isEntryPath('src/data/services/_list.json'), false);
  assert.equal(isEntryPath('src/data/services/_x.json'), false);
  assert.equal(isEntryPath('src/data/services/x.json'), true);
  assert.equal(isEntryPath('x.json'), true);
  assert.equal(isEntryPath('src/data/services/x.md'), false);
  assert.equal(isEntryPath('src/data/services/.json'), false);
});

test('entryOfRow and rowOfEntry round trip', () => {
  const ids = ['icon', 'title', 'text', 'text-2', 'href', 'tags', 'image'];
  const row = { title: 'Web', text: 'Sites', 'text-2': 'More', icon: 'globe', href: '/web', tags: ['a'], image: 'p.jpg' };
  const entry = entryOfRow(row, 3, ids);
  assert.deepEqual(entry, { ...row, order: 3 });
  assert.deepEqual(rowOfEntry(entry, ids), row);
  assert.deepEqual(entryOfRow({ title: 'T', text: '', icon: ' ', tags: [] }, 0, ids), { title: 'T', order: 0 });
  assert.deepEqual(entryOfRow({ title: '' }, 1, ids), { order: 1 });
  assert.deepEqual(rowOfEntry({ title: 'T', text: '', order: 2 }, ids), { title: 'T' });
  // a key with no field is not part of the row
  assert.deepEqual(entryOfRow({ title: 'T', gone: 'x' }, 1, ['title']), { title: 'T', order: 1 });
});

test('slug collisions', () => {
  const taken = new Set(['web', 'web-2']);
  assert.equal(
    entrySlug('Web', (n) => taken.has(n)),
    'web-3',
  );
  assert.equal(
    entrySlug('Fresh', (n) => taken.has(n)),
    'fresh',
  );
  assert.equal(
    entrySlug('', () => false),
    'item',
  );
});

test('orders: add, move, remove', () => {
  const entries = [
    { slug: 'a', order: 0 },
    { slug: 'b', order: 1 },
    { slug: 'c', order: 2 },
  ];
  assert.equal(nextOrder(entries), 3);
  assert.equal(nextOrder([]), 0);
  assert.deepEqual(moveOrders(entries, 1, -1), [
    { slug: 'b', order: 0 },
    { slug: 'a', order: 1 },
  ]);
  assert.deepEqual(moveOrders(entries, 1, 1), [
    { slug: 'b', order: 2 },
    { slug: 'c', order: 1 },
  ]);
  assert.deepEqual(moveOrders(entries, 0, -1), []);
  assert.deepEqual(moveOrders(entries, 2, 1), []);
  assert.deepEqual(moveOrders([{ slug: 'a' }, { slug: 'b' }], 0, 1), [
    { slug: 'a', order: 1 },
    { slug: 'b', order: 0 },
  ]);
  assert.deepEqual(
    moveOrders(
      [
        { slug: 'a', order: 5 },
        { slug: 'b', order: 5 },
      ],
      0,
      1,
    ),
    [
      { slug: 'a', order: 1 },
      { slug: 'b', order: 0 },
    ],
  );
  // removing leaves the others' orders alone; the next add goes after the highest
  assert.equal(nextOrder([entries[0], entries[2]]), 3);
});

test('an own list gives the same rows as an app list with the same asRows', () => {
  const entries = [
    { title: 'Web', text: 'Sites', icon: 'globe', href: '/web', tags: ['a'], image: 'p.jpg', order: 0 },
    { title: 'Print', tags: ['b'], order: 1 },
    { text: 'no title', order: 2 },
  ];
  const appAsRows = { title: 'title', text: 'text', icon: 'icon', href: 'href', tags: 'tags' };
  const mine = rowsFromItems(
    entries.map((e) => itemOfEntry(e, asRowsOf(all))),
    { tags: ['a'] },
  );
  const app = rowsFromItems(
    entries.map((e) => itemOfEntry(e, appAsRows)),
    { tags: ['a'] },
  );
  assert.deepEqual(mine, app);
  assert.deepEqual(
    rowsFromItems(
      entries.map((e) => itemOfEntry(e, asRowsOf(all))),
      {},
    ).map((r) => r.title),
    ['Web', 'Print'],
  );
});

test('ownListProblems: no _list.json, nothing to say', () => {
  const files = [{ path: 'src/data/prices/a.json', text: '{"nope":1}' }];
  assert.deepEqual(ownListProblems(files, { dataFolder: 'src/data', blocks: [{ path: 'p.md', from: 'gone' }] }), {
    ids: [],
    problems: [],
    paths: [],
  });
});

test('ownListProblems: definitions, entries, tags and blocks', () => {
  const d = (x) => ({
    path: 'src/data/services/_list.json',
    text: JSON.stringify({ version: 2, label: 'S', fields: kindsOf(['title', 'tags']), ...x }),
  });
  const entry = (name, data) => ({ path: `src/data/services/${name}.json`, text: typeof data === 'string' ? data : JSON.stringify(data) });
  const opts = { dataFolder: 'src/data', tags: ['a'], known: ['posts'] };
  const ok = ownListProblems([d(), entry('web', { title: 'Web', tags: ['a'], order: 0 })], opts);
  assert.deepEqual(ok.problems, []);
  assert.deepEqual(ok.ids, ['services']);
  assert.equal(ok.paths.length, 2);
  const bad = ownListProblems(
    [
      d(),
      entry('x', { title: 'X', tags: ['zzz'], colour: 1 }),
      entry('y', '{nope'),
      { path: 'src/data/services/_other.json', text: 'junk' },
    ],
    {
      ...opts,
      blocks: [
        { path: 'a.md', from: 'services' },
        { path: 'b.md', from: 'posts' },
        { path: 'c.md', from: 'deleted' },
      ],
    },
  );
  assert.equal(bad.problems.length, 4);
  assert.ok(bad.problems.some((p) => p.startsWith('src/data/services/x.json') && p.includes('"zzz"')));
  assert.ok(bad.problems.some((p) => p.startsWith('src/data/services/y.json')));
  assert.ok(bad.problems.some((p) => p.startsWith('c.md') && p.includes('"deleted"')));
  const broken = ownListProblems([d({ fields: [{ id: 'a', kind: 'nope' }] })], opts);
  assert.match(broken.problems[0], /^src\/data\/services\/_list\.json: .*kind/);
  assert.deepEqual(broken.ids, []);
});
