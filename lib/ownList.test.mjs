import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FIELDS,
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

const all = { version: 1, label: 'Services', fields: ['icon', 'title', 'text', 'image', 'href', 'tags'] };
const def = (extra = {}) => JSON.stringify({ ...all, ...extra });

test('FIELDS is the fixed set in order', () => {
  assert.deepEqual(
    FIELDS.map((f) => f.id),
    ['icon', 'title', 'text', 'image', 'href', 'tags'],
  );
});

test('parseDefinition: valid', () => {
  const { definition, problems } = parseDefinition(def({ fields: ['tags', 'title', 'icon'], dropped: ['tags'] }));
  assert.equal(problems, undefined);
  assert.deepEqual(definition, { version: 1, label: 'Services', fields: ['icon', 'title', 'tags'], dropped: ['tags'] });
  assert.deepEqual(parseDefinition(def()).definition.dropped, []);
});

test('parseDefinition: problems', () => {
  const p = (text) => parseDefinition(text).problems?.join(' ');
  assert.match(p('{nope'), /not valid JSON/);
  assert.match(p('[]'), /object/);
  assert.match(p(def({ fields: ['title', 'colour'] })), /Unknown field "colour"/);
  assert.match(p(def({ fields: ['icon'] })), /needs the field "title"/);
  assert.match(p(def({ dropped: ['nothing'] })), /not one of the fields/);
  assert.match(p(def({ fields: ['title'], dropped: ['icon'] })), /not one of the fields/);
  assert.match(p(def({ dropped: ['title'] })), /cannot be dropped/);
  assert.match(p(def({ version: 2 })), /version 2/);
  assert.match(p(def({ label: ' ' })), /label/);
  assert.match(p(def({ fields: ['title', 'title'] })), /twice/);
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
});

test('asRowsOf', () => {
  assert.deepEqual(asRowsOf({ ...all, fields: ['title'] }), { title: 'title' });
  assert.deepEqual(asRowsOf(all), { title: 'title', text: 'text', icon: 'icon', href: 'href', tags: 'tags' });
  assert.equal('image' in asRowsOf(all), false);
  assert.equal('icon' in asRowsOf({ ...all, dropped: ['icon'] }), false);
});

test('entryProblems', () => {
  const d = { ...all, fields: ['title', 'text', 'tags'], dropped: ['text'] };
  const known = { tags: ['a', 'b'] };
  assert.deepEqual(entryProblems(d, { title: 'x', tags: ['a'], order: 1 }, known), []);
  assert.match(entryProblems(d, { title: 'x', colour: 'red' }).join(), /no field "colour"/);
  assert.match(entryProblems(d, { title: 'x', image: 'p' }).join(), /no field "image"/);
  assert.deepEqual(entryProblems(d, { title: 'x', text: 'kept' }), []);
  assert.match(entryProblems(d, { title: 'x', tags: ['zzz'] }, known).join(), /"zzz" does not exist/);
  assert.deepEqual(entryProblems(d, { title: 'x', tags: ['zzz'] }), []);
  assert.match(entryProblems(d, { tags: [] }).join(), /needs a title/);
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
  const row = { title: 'Web', text: 'Sites', icon: 'globe', href: '/web', tags: ['a'], image: 'p.jpg' };
  const entry = entryOfRow(row, 3);
  assert.deepEqual(entry, { ...row, order: 3 });
  assert.deepEqual(rowOfEntry(entry), row);
  assert.deepEqual(entryOfRow({ title: 'T', text: '', icon: ' ', tags: [] }, 0), { title: 'T', order: 0 });
  assert.deepEqual(entryOfRow({ title: '' }, 1), { title: '', order: 1 });
  assert.deepEqual(rowOfEntry({ title: 'T', text: '', order: 2 }), { title: 'T' });
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
    { title: '', text: 'no title', order: 2 },
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
    text: JSON.stringify({ version: 1, label: 'S', fields: ['title', 'tags'], ...x }),
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
  const broken = ownListProblems([d({ fields: ['icon'] })], opts);
  assert.match(broken.problems[0], /^src\/data\/services\/_list\.json: .*title/);
  assert.deepEqual(broken.ids, []);
});
