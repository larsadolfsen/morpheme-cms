import test from 'node:test';
import assert from 'node:assert/strict';

// blockBar.ts is TypeScript: node strips its types.
const { blockBar, blockToolIds } = await import('./blockBar.ts');

const state = (over = {}) => ({ name: 'List', actions: [], menu: [], ...over });
const act = (kind) => ({ kind, label: kind, action() {} });

test('the active block is shown and hidden, and a block that is not the active one cannot hide it', () => {
  const [a, b] = [{}, {}];
  let told = 0;
  const stop = blockBar.subscribe(() => told++);
  assert.equal(blockBar.get(), null);
  const first = state();
  blockBar.show(a, first);
  assert.equal(blockBar.get(), first);
  blockBar.hide(b);
  assert.equal(blockBar.get(), first, 'another block cannot clear it');
  blockBar.show(b, state({ name: 'Cards' }));
  blockBar.hide(a);
  assert.equal(blockBar.get()?.name, 'Cards', 'the first block lost the bar to the second');
  blockBar.hide(b);
  assert.equal(blockBar.get(), null);
  assert.equal(told, 3);
  stop();
});

test("a List's tools: Add below, Add above, Settings, Link on the bar (four), then Fill from a list, Move up and Move down", () => {
  const ids = blockToolIds(
    state({
      actions: ['link', 'above', 'below', 'up', 'down'].map(act),
      edit: { label: 'Edit', action() {} },
      dynamic: { label: 'Rows from', on: false, action() {} },
    }),
  );
  assert.deepEqual(ids, ['below', 'above', 'gear', 'link', 'dynamic', 'up', 'down']);
});

test("a Table's tools: Row below, Row above, Column after, Column before, then the settings, the deletes and the alignments", () => {
  const ids = blockToolIds(
    state({
      actions: [
        'above',
        'below',
        'column-before',
        'column-after',
        'delete-row',
        'delete-column',
        'align-left',
        'align-center',
        'align-right',
        'align-auto',
      ].map(act),
      edit: { label: 'Edit', action() {} },
    }),
  );
  assert.deepEqual(ids.slice(0, 4), ['below', 'above', 'column-after', 'column-before']);
  assert.deepEqual(ids.slice(4, 7), ['gear', 'delete-row', 'delete-column']);
  assert.equal(ids.length, 11);
});

test('a block with nothing to do on a row has only the gear, or no tool at all', () => {
  assert.deepEqual(blockToolIds(state({ edit: { label: 'Edit', action() {} } })), ['gear']);
  assert.deepEqual(blockToolIds(state()), []);
});
