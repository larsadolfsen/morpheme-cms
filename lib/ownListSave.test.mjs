import test from 'node:test';
import assert from 'node:assert/strict';
import { savePlan } from './ownListSave.mjs';

const folder = 'src/data/services';
const kinds = (ids) => ids.map((id) => ({ id, kind: id.replace(/-\d+$/, '') }));
const visible = kinds(['icon', 'title', 'text', 'href']);
const file = (data, oid = 'o1') => ({ oid, text: `${JSON.stringify(data, null, 2)}\n` });

test('a new row with a value is a new file; an empty one is not saved', () => {
  const rows = [{ key: 'n1', title: 'Web design', text: 'Sites' }, { key: 'n2', title: '' }, { key: 'n3' }];
  const { writes, deletes, slugs } = savePlan({ folder, rows, known: new Map(), slugs: new Map(), visible });
  assert.equal(writes.length, 1);
  assert.equal(writes[0].path, `${folder}/web-design.json`);
  assert.equal(writes[0].oid, null);
  assert.deepEqual(JSON.parse(writes[0].content), { order: 1, title: 'Web design', text: 'Sites' });
  assert.ok(writes[0].content.startsWith('{\n  "order": 1,'));
  assert.deepEqual(deletes, []);
  assert.equal(slugs.get('n1'), 'web-design');
  assert.equal(slugs.has('n2'), false);
  assert.equal(writes.length, 1);
});

test('the file name never changes when the title does, and collisions get -2', () => {
  const known = new Map([[`${folder}/web.json`, file({ order: 1, title: 'Web' })]]);
  const slugs = new Map([['a', 'web']]);
  const rows = [
    { key: 'a', title: 'Websites' },
    { key: 'b', title: 'Web' },
  ];
  const plan = savePlan({ folder, rows, known, slugs, visible });
  assert.deepEqual(
    plan.writes.map((w) => w.path),
    [`${folder}/web.json`, `${folder}/web-2.json`],
  );
  assert.equal(plan.writes[0].oid, 'o1');
  assert.equal(JSON.parse(plan.writes[0].content).title, 'Websites');
});

test('unchanged rows write nothing; a move rewrites only the two orders', () => {
  const known = new Map([
    [`${folder}/a.json`, file({ order: 1, title: 'A' }, 'oa')],
    [`${folder}/b.json`, file({ order: 2, title: 'B' }, 'ob')],
    [`${folder}/c.json`, file({ order: 3, title: 'C' }, 'oc')],
  ]);
  const slugs = new Map([
    ['a', 'a'],
    ['b', 'b'],
    ['c', 'c'],
  ]);
  const same = savePlan({
    folder,
    rows: [
      { key: 'a', title: 'A' },
      { key: 'b', title: 'B' },
      { key: 'c', title: 'C' },
    ],
    known,
    slugs,
    visible,
  });
  assert.deepEqual(same.writes, []);
  const moved = savePlan({
    folder,
    rows: [
      { key: 'b', title: 'B' },
      { key: 'a', title: 'A' },
      { key: 'c', title: 'C' },
    ],
    known,
    slugs,
    visible,
  });
  assert.deepEqual(
    moved.writes.map((w) => [w.path.split('/').pop(), JSON.parse(w.content).order]),
    [
      ['b.json', 1],
      ['a.json', 2],
    ],
  );
});

test('empty fields leave their key out, other keys stay, and a row without a title is still saved', () => {
  const known = new Map([[`${folder}/a.json`, file({ order: 1, title: 'A', text: 'old', image: 'p.jpg' })]]);
  const slugs = new Map([['a', 'a']]);
  const cleared = savePlan({ folder, rows: [{ key: 'a', title: 'A', text: '' }], known, slugs, visible });
  assert.deepEqual(JSON.parse(cleared.writes[0].content), { order: 1, title: 'A', image: 'p.jpg' });
  const noTitle = savePlan({ folder, rows: [{ key: 'a', title: '', text: 'x' }], known, slugs, visible });
  assert.deepEqual(JSON.parse(noTitle.writes[0].content), { order: 1, text: 'x', image: 'p.jpg' });
  assert.deepEqual(noTitle.deletes, []);
  // a new row typed only in the body text or an image is a file, named from its first title, else its first body text, else `item`
  const fresh = savePlan({
    folder,
    rows: [
      { key: 1, text: 'Only text' },
      { key: 2, image: 'a.jpg' },
      { key: 3, title: 'Titled', text: 'x' },
    ],
    known: new Map(),
    slugs: new Map(),
    visible: kinds(['title', 'text', 'image']),
  });
  assert.deepEqual(
    fresh.writes.map((w) => w.path),
    [`${folder}/only-text.json`, `${folder}/item.json`, `${folder}/titled.json`],
  );
});

test('a row that is gone deletes its file; a file no row stood for is left', () => {
  const known = new Map([
    [`${folder}/a.json`, file({ order: 1, title: 'A' }, 'oa')],
    [`${folder}/b.json`, file({ order: 2, title: 'B' }, 'ob')],
    [`${folder}/broken.json`, { oid: 'ox', text: '{nope' }],
  ]);
  const slugs = new Map([
    ['a', 'a'],
    ['b', 'b'],
  ]);
  const plan = savePlan({ folder, rows: [{ key: 'a', title: 'A' }], known, slugs, visible });
  assert.deepEqual(plan.deletes, [{ path: `${folder}/b.json`, oid: 'ob' }]);
  assert.equal(plan.slugs.has('b'), false);
});

test('image and tags are written when typed and left out when emptied', () => {
  const all = kinds(['icon', 'title', 'text', 'image', 'href', 'tags']);
  const first = savePlan({
    folder,
    rows: [{ key: 1, title: 'A', image: 'a.jpg', tags: ['x', 'y'] }],
    known: new Map(),
    slugs: new Map(),
    visible: all,
  });
  assert.deepEqual(JSON.parse(first.writes[0].content), { order: 1, title: 'A', image: 'a.jpg', tags: ['x', 'y'] });
  const known = new Map([[`${folder}/a.json`, { oid: 'o', text: first.writes[0].content }]]);
  const emptied = savePlan({ folder, rows: [{ key: 1, title: 'A' }], known, slugs: new Map([[1, 'a']]), visible: all });
  assert.deepEqual(JSON.parse(emptied.writes[0].content), { order: 1, title: 'A' });
});

test('a field switched off is not written from the row; the entry keeps its own value', () => {
  const known = new Map([[`${folder}/a.json`, file({ order: 1, title: 'A', image: 'kept.jpg' })]]);
  const plan = savePlan({
    folder,
    rows: [{ key: 1, title: 'A2', image: 'in-memory.jpg' }],
    known,
    slugs: new Map([[1, 'a']]),
    visible: kinds(['title']),
  });
  assert.deepEqual(JSON.parse(plan.writes[0].content), { order: 1, title: 'A2', image: 'kept.jpg' });
});

test('two fields of one kind are saved under their own ids', () => {
  const two = kinds(['title', 'text', 'text-2', 'image', 'image-2']);
  const plan = savePlan({
    folder,
    rows: [{ key: 1, title: 'A', text: 'one', 'text-2': 'two', image: 'a.jpg', 'image-2': 'b.jpg' }],
    known: new Map(),
    slugs: new Map(),
    visible: two,
  });
  assert.deepEqual(JSON.parse(plan.writes[0].content), {
    order: 1,
    title: 'A',
    text: 'one',
    'text-2': 'two',
    image: 'a.jpg',
    'image-2': 'b.jpg',
  });
});

test('a list with no title field saves a row with any value, named after its first text', () => {
  const none = kinds(['text', 'image']);
  const plan = savePlan({
    folder,
    rows: [{ key: 1, text: 'Hello there' }, { key: 2 }, { key: 3, image: 'x.jpg' }],
    known: new Map(),
    slugs: new Map(),
    visible: none,
  });
  assert.deepEqual(
    plan.writes.map((w) => w.path),
    [`${folder}/hello-there.json`, `${folder}/item.json`],
  );
});
