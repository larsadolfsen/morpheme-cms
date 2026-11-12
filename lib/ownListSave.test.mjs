import test from 'node:test';
import assert from 'node:assert/strict';
import { savePlan } from './ownListSave.mjs';

const folder = 'src/data/services';
const visible = ['icon', 'title', 'text', 'href'];
const file = (data, oid = 'o1') => ({ oid, text: `${JSON.stringify(data, null, 2)}\n` });

test('a new row with a title is a new file; one without is not saved', () => {
  const rows = [{ key: 'n1', title: 'Web design', text: 'Sites' }, { key: 'n2', title: '', text: 'no title yet' }, { key: 'n3' }];
  const { writes, deletes, slugs } = savePlan({ folder, rows, known: new Map(), slugs: new Map(), visible });
  assert.equal(writes.length, 1);
  assert.equal(writes[0].path, `${folder}/web-design.json`);
  assert.equal(writes[0].oid, null);
  assert.deepEqual(JSON.parse(writes[0].content), { order: 1, title: 'Web design', text: 'Sites' });
  assert.ok(writes[0].content.startsWith('{\n  "order": 1,'));
  assert.deepEqual(deletes, []);
  assert.equal(slugs.get('n1'), 'web-design');
  assert.equal(slugs.has('n2'), false);
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

test('empty fields leave their key out, other keys stay, and a cleared title is not written', () => {
  const known = new Map([[`${folder}/a.json`, file({ order: 1, title: 'A', text: 'old', image: 'p.jpg' })]]);
  const slugs = new Map([['a', 'a']]);
  const cleared = savePlan({ folder, rows: [{ key: 'a', title: 'A', text: '' }], known, slugs, visible });
  assert.deepEqual(JSON.parse(cleared.writes[0].content), { order: 1, title: 'A', image: 'p.jpg' });
  const noTitle = savePlan({ folder, rows: [{ key: 'a', title: '', text: 'x' }], known, slugs, visible });
  assert.deepEqual(noTitle.writes, []);
  assert.deepEqual(noTitle.deletes, []);
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
