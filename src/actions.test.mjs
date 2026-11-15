// Tests src/actions.ts: register and dispose, the places, the palette's search with the context filter, and the menu, blocks and pages as actions.
import test from 'node:test';
import assert from 'node:assert/strict';

// actions.ts is TypeScript: node strips its types.
const { createRegistry, goActions, insertActions, changeToActions, pagesProvider, ctxGroups } = await import('./actions.ts');

const act = (id, group = 'go', more = {}) => ({ id, label: id, group, where: {}, run() {}, ...more });
const ids = (groups) => groups.flatMap((g) => g.items.map((i) => i.action.id));

const tree = [
  { id: 'home', label: 'Home', href: '#', items: [] },
  {
    id: 'content',
    label: 'Content',
    items: [
      { id: 'pages', label: 'Pages', href: '#pages', children: [{ id: 'deleted-pages', label: 'Deleted pages', href: '#deleted/pages' }] },
    ],
  },
  { id: 'apps', label: 'Apps', items: [{ id: 'forms', label: 'Forms', href: '#apps/forms' }] },
];

test('register adds actions and the dispose function removes them', () => {
  const r = createRegistry();
  const dispose = r.register([act('a'), act('b')]);
  assert.deepEqual(
    r.all().map((a) => a.id),
    ['a', 'b'],
  );
  dispose();
  assert.deepEqual(r.all(), []);
});

test('an entry in two of bar, more and row fails, and so does an id that is in already', () => {
  const r = createRegistry();
  assert.throws(
    () => r.register(act('x', 'block', { where: { bar: { context: 'block', order: 1 }, row: { order: 1 } } })),
    /one place only/,
  );
  r.register(act('y'));
  assert.throws(() => r.register(act('y')), /registered already/);
  assert.deepEqual(
    r.all().map((a) => a.id),
    ['y'],
    'a failed register adds nothing',
  );
});

test('a dispose after a re-register leaves the new entry', () => {
  const r = createRegistry();
  const first = r.register(act('a'));
  first();
  r.register(act('a', 'go', { label: 'new' }));
  first();
  assert.equal(r.get('a')?.label, 'new');
});

test('subscribers hear each change', () => {
  const r = createRegistry();
  let heard = 0;
  const stop = r.subscribe(() => heard++);
  const dispose = r.register(act('a'));
  dispose();
  stop();
  r.register(act('b'));
  assert.equal(heard, 2);
});

test('inPlace lists a place in its order without the hidden ones', () => {
  const r = createRegistry();
  r.register([
    act('down', 'block', { where: { row: { order: 2 } } }),
    act('up', 'block', { where: { row: { order: 1 } } }),
    act('vis', 'block', { where: { row: { order: 3 } }, state: () => 'hidden' }),
    act('bold', 'text', { where: { bar: { context: 'text', order: 1 } } }),
  ]);
  assert.deepEqual(
    r.inPlace('row', { route: '' }).map((a) => a.id),
    ['up', 'down'],
  );
  assert.deepEqual(
    r.inPlace('bar', { route: '' }, 'text').map((a) => a.id),
    ['bold'],
  );
});

test('a route in the menu is an action, and an app’s page appears', () => {
  const went = [];
  const list = goActions(
    tree,
    (href) => went.push(href),
    [{ id: 'caching', label: 'Caching and builds', href: '#developer/caching' }],
    'Settings',
  );
  const byId = Object.fromEntries(list.map((a) => [a.id, a]));
  assert.ok(byId['go.home']);
  assert.equal(byId['go.pages'].path, 'Content');
  assert.equal(byId['go.deleted-pages'].path, 'Content › Pages');
  assert.equal(byId['go.forms'].group, 'app');
  assert.equal(byId['go.caching'].group, 'setting');
  assert.equal(byId['go.caching'].path, 'Settings');
  byId['go.forms'].run({ route: '' });
  assert.deepEqual(went, ['#apps/forms']);
});

test('one Insert action per block that can be put in', () => {
  const blocks = [
    { type: 'table', label: 'Table', group: 'content' },
    { type: 'page-text', label: 'Text', written: true },
    { type: 'banner', label: 'Banner', former: true },
  ];
  const put = [];
  const list = insertActions(
    blocks,
    (type) => put.push(type),
    (b) => `Insert ${b.label.toLowerCase()}`,
  );
  assert.deepEqual(
    list.map((a) => [a.id, a.label, a.group]),
    [['insert.table', 'Insert table', 'insert']],
  );
  list[0].run({ route: '' });
  assert.deepEqual(put, ['table']);
});

test('the pages provider gives pages by title or address, and nothing before typing', () => {
  const provider = pagesProvider(
    () => [
      { path: 'src/content/pages/about.md', title: 'About us', href: '#pages/about' },
      { path: 'src/content/posts/hello.md', title: 'Hello world', href: '#posts/hello', list: 'Blog posts' },
    ],
    () => {},
  );
  assert.deepEqual(provider('', { route: '' }), []);
  assert.deepEqual(
    provider('about', { route: '' }).map((a) => a.id),
    ['go.page:src/content/pages/about.md'],
  );
  assert.deepEqual(
    provider('hello.md', { route: '' }).map((a) => a.kind),
    ['page'],
  );
});

test('search: the context first, disabled only in the context, other contexts left out, pages under actions', () => {
  const r = createRegistry();
  r.register([
    act('go.files', 'go', { label: 'Files' }),
    act('text.redo', 'text', { label: 'Redo', state: (c) => (c.canRedo ? 'enabled' : 'disabled'), reason: () => 'Nothing to redo' }),
    act('table.row-below', 'table', { label: 'Row below' }),
    act('page.save', 'page', { label: 'Save changes', state: () => 'disabled' }),
    act('hidden', 'go', { label: 'Secret', where: { palette: false } }),
  ]);
  r.provide(
    pagesProvider(
      () => [{ path: 'files.md', title: 'Files we keep', href: '#x' }],
      () => {},
    ),
  );
  const inText = r.search('', { route: 'pages/about', text: true });
  assert.equal(inText[0].group, 'text');
  const redo = inText[0].items[0];
  assert.equal(redo.action.id, 'text.redo');
  assert.equal(redo.disabled, true);
  assert.equal(redo.reason, 'Nothing to redo');
  const shown = ids(inText);
  assert.ok(!shown.includes('table.row-below'), 'table actions with the cursor in a paragraph are noise');
  assert.ok(!shown.includes('page.save'), 'a disabled action outside the context is left out');
  assert.ok(!shown.includes('hidden'));
  const files = r.search('files', { route: '' });
  assert.deepEqual(ids(files), ['go.files', 'go.page:files.md']);
});

test('ctxGroups names what is active', () => {
  assert.deepEqual(ctxGroups({ route: '', text: true, block: 'table', table: true }), ['text', 'block', 'table']);
});

test('problems reports a shared key and a wrong settings icon', () => {
  const r = createRegistry();
  r.register([
    act('palette.open', 'go', { shortcut: { key: 'Mod+K' } }),
    act('text.link', 'text', { shortcut: { key: 'Mod+K' } }),
    act('block.settings', 'block', { icon: 'edit', meaning: 'settings-here' }),
  ]);
  const problems = r.problems();
  assert.ok(problems.some((p) => /share Mod\+K/.test(p)));
  assert.ok(problems.some((p) => /must draw tune/.test(p)));
});

test('Change to is one action per block the active block can become, found by "change" or the block\'s name', () => {
  const chosen = [];
  const list = changeToActions(
    [
      { type: 'steps', label: 'Steps' },
      { type: 'table', label: 'Table' },
    ],
    (type, label) => chosen.push([type, label]),
    (name) => `Change to ${name}`,
    ['Change to'],
  );
  assert.deepEqual(
    list.map((a) => [a.id, a.label, a.group]),
    [
      ['block.change-to-steps', 'Change to Steps', 'block'],
      ['block.change-to-table', 'Change to Table', 'block'],
    ],
  );
  const r = createRegistry();
  const dispose = r.register(list);
  assert.deepEqual(r.problems(), [], 'six of them share one icon and one meaning: no problem');
  const ctx = { route: '#pages', block: 'list' };
  const found = (query) => ids(r.search(query, ctx));
  assert.deepEqual(found('table'), ['block.change-to-table']);
  assert.deepEqual(found('change').sort(), ['block.change-to-steps', 'block.change-to-table']);
  list[1].run(ctx);
  assert.deepEqual(chosen, [['table', 'Table']]);
  dispose();
  assert.deepEqual(r.all(), []);
});
