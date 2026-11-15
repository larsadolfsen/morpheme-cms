// Tests src/blockActionList.ts: the active block's bar, row and ⋮ as registry entries, in the order the palette lists them, with the groups and icons.
import test from 'node:test';
import assert from 'node:assert/strict';

const { blockActionsOf, blockCtx } = await import('./blockActionList.ts');
const { createRegistry } = await import('./actions.ts');

const ORDER = [
  'change-image',
  'crop',
  'alt-text',
  'remove',
  'below',
  'above',
  'column-after',
  'column-before',
  'gear',
  'link',
  'dynamic',
  'up',
  'down',
  'delete-row',
];
const ran = [];
const bar = (kind, label, over = {}) => ({ kind, label, action: () => ran.push(kind), ...over });
const row = (kind, label, over = {}) => ({ kind, icon: '<svg/>', label, action: () => ran.push(`row:${kind}`), ...over });
const menu = (label, over = {}) => ({ icon: '<svg/>', label, action: () => ran.push(`menu:${label}`), ...over });

const list = () => ({
  name: 'List',
  actions: [bar('link', 'Link'), bar('below', 'Add below'), bar('up', 'Move row up')],
  edit: { label: 'Item settings', action: () => ran.push('gear') },
  dynamic: { label: 'Rows from a list', on: true, action: () => ran.push('dynamic') },
  row: {
    host: {},
    items: [
      row('up', 'Move up', { disabled: { reason: 'First block' } }),
      row('down', 'Move down'),
      row('visibility', 'Hide'),
      row('settings', 'Block settings'),
    ],
  },
  menu: [
    menu('Select block'),
    menu('Remove', { danger: true }),
    menu('Change type', { submenu: [{ icon: 'x', label: 'Steps', action() {} }] }),
  ],
});

test('the row comes first, then the bar in the bar’s order, then the ⋮; a row with a submenu registers itself elsewhere', () => {
  const ids = blockActionsOf(list(), ORDER).map((a) => a.id);
  assert.deepEqual(ids, [
    'block.move-up',
    'block.move-down',
    'block.visibility',
    'block.settings',
    'block.below',
    'block.gear',
    'block.link',
    'block.rows-from',
    'block.row-up',
    'block.menu.select-block',
    'block.menu.remove',
  ]);
});

test('each entry is in one place only, with the order of that place', () => {
  const all = blockActionsOf(list(), ORDER);
  for (const a of all) assert.equal(Object.keys(a.where).filter((k) => ['bar', 'more', 'row'].includes(k)).length, 1, a.id);
  assert.equal(all.find((a) => a.id === 'block.move-down').where.row.order, 1);
  assert.equal(all.find((a) => a.id === 'block.below').where.bar.order, ORDER.indexOf('below'));
  assert.equal(all.find((a) => a.id === 'block.menu.remove').where.more.order, 1);
});

test('a disabled item is disabled with its reason, and a toggle is pressed while it is on', () => {
  const all = blockActionsOf(list(), ORDER);
  const up = all.find((a) => a.id === 'block.move-up');
  assert.equal(up.state({ route: '' }), 'disabled');
  assert.equal(up.reason({ route: '' }), 'First block');
  assert.equal(all.find((a) => a.id === 'block.move-down').state({ route: '' }), 'enabled');
  assert.equal(all.find((a) => a.id === 'block.rows-from').pressed({ route: '' }), true);
});

test('settings draw tune (one icon per meaning), and the registry accepts the whole list', () => {
  const all = blockActionsOf(list(), ORDER);
  assert.equal(all.find((a) => a.id === 'block.settings').icon, 'tune');
  assert.equal(all.find((a) => a.id === 'block.gear').icon, 'tune');
  const registry = createRegistry();
  registry.register(all);
  assert.deepEqual(registry.problems(), []);
});

test('running an entry runs the block’s own function', () => {
  const all = blockActionsOf(list(), ORDER);
  for (const id of ['block.move-down', 'block.below', 'block.gear', 'block.menu.remove']) all.find((a) => a.id === id).run({ route: '' });
  assert.deepEqual(ran, ['row:down', 'below', 'gear', 'menu:Remove']);
});

test('a Table’s and an image’s tools have groups of their own', () => {
  const table = blockActionsOf(
    { name: 'Table', actions: [bar('below', 'Row below'), bar('column-after', 'Column after'), bar('delete-row', 'Delete row')], menu: [] },
    ORDER,
  );
  assert.deepEqual(
    table.map((a) => [a.id, a.group]),
    [
      ['block.below', 'block'],
      ['block.column-after', 'table'],
      ['block.delete-row', 'table'],
    ],
  );
  const image = blockActionsOf(
    {
      name: 'Image',
      actions: [bar('change-image', 'Change image'), bar('crop', 'Crop'), bar('remove', 'Remove')],
      menu: [menu('Select block')],
    },
    ORDER,
  );
  assert.deepEqual(
    image.map((a) => a.group),
    ['image', 'image', 'image', 'image'],
  );
});

test('blockCtx names the block and says whether it is a Table or an image; several selected blocks have none', () => {
  assert.deepEqual(blockCtx(null), { block: null, table: false, image: false });
  assert.deepEqual(blockCtx(list()), { block: 'List', table: false, image: false });
  assert.equal(blockCtx({ name: 'Table', actions: [bar('column-after', 'x')], menu: [] }).table, true);
  assert.equal(blockCtx({ name: 'Image', actions: [bar('crop', 'x')], menu: [] }).image, true);
  assert.equal(blockCtx({ name: '2 blocks', actions: [], menu: [], count: { n: 2, label: 'x', action() {} } }).block, null);
});

test('ids stay unique when two items have the same name', () => {
  const ids = blockActionsOf({ name: 'X', actions: [], menu: [menu('Remove'), menu('Remove')] }, ORDER).map((a) => a.id);
  assert.deepEqual(ids, ['block.menu.remove', 'block.menu.remove-2']);
});
