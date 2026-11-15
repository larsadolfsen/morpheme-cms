// Tests src/textActions.ts: the text's actions as registry entries, their states where the cursor is, their keys, and that the registry accepts them.
import test from 'node:test';
import assert from 'node:assert/strict';

// textActions.ts and actions.ts are TypeScript: node strips their types.
const { textActions } = await import('./textActions.ts');
const { createRegistry } = await import('./actions.ts');

const calls = [];
const api = {
  bold: () => calls.push('bold'),
  italic: () => calls.push('italic'),
  link: () => calls.push('link'),
  undo: () => calls.push('undo'),
  redo: () => calls.push('redo'),
  setKind: (k) => calls.push(`kind:${k}`),
  align: (a) => calls.push(`align:${a}`),
  sectionSettings: () => calls.push('section'),
  insertBlock: () => calls.push('insert-block'),
  insertImage: () => calls.push('insert-image'),
  preview: () => calls.push('preview'),
  viewOnSite: () => calls.push('view-on-site'),
};
const labels = {
  bold: 'Bold',
  italic: 'Italic',
  link: 'Link',
  undo: 'Undo',
  redo: 'Redo',
  styles: {
    h1: 'Main heading',
    h2: 'Heading',
    h3: 'Subheading',
    large: 'Body large',
    medium: 'Body medium',
    small: 'Body small',
    label: 'Label',
    quote: 'Quote',
  },
  lists: { bullet: 'Bulleted list', check: 'Check list', ordered: 'Numbered list' },
  align: { left: 'Align left', center: 'Align center', right: 'Align right' },
  sectionSettings: 'Section settings',
  insertBlock: 'Insert block',
  insertImage: 'Image',
  preview: 'Preview',
  viewOnSite: 'View on site',
};
const list = () => textActions(api, labels);
const byId = (id) => list().find((a) => a.id === id);
const stateOf = (id, ctx) => byId(id).state?.(ctx) ?? 'enabled';

test('every action has a unique id, a label and a group, and the registry takes them all', () => {
  const all = list();
  assert.equal(new Set(all.map((a) => a.id)).size, all.length);
  assert.ok(all.every((a) => a.label && a.group));
  const registry = createRegistry();
  registry.register(all);
  assert.deepEqual(registry.problems(), [], 'no shared key, no browser key, one icon per meaning');
});

test('the keys are the text engine’s and are only shown by the registry', () => {
  for (const [id, key] of [
    ['text.bold', 'Mod+B'],
    ['text.italic', 'Mod+I'],
    ['text.undo', 'Mod+Z'],
    ['text.redo', 'Mod+Shift+Z'],
  ]) {
    assert.equal(byId(id).shortcut?.key, key);
    assert.equal(byId(id).handledBy, 'text');
  }
  assert.equal(byId('text.link').shortcut, undefined, 'Link has no key (owner, 13 Nov)');
});

test('text actions are hidden outside a text and shown in it; Bold is marked while bold applies', () => {
  assert.equal(stateOf('text.bold', { route: '' }), 'hidden');
  assert.equal(stateOf('text.bold', { route: '', text: true }), 'enabled');
  assert.equal(byId('text.bold').pressed({ route: '', active: ['strong'] }), true);
  assert.equal(byId('text.bold').pressed({ route: '', active: [] }), false);
});

test('a style or a list that does not apply where the cursor is is hidden, as the bar’s menus hide it', () => {
  const text = { route: '', text: true, levels: [2, 3] };
  assert.equal(stateOf('text.style-h2', { ...text, active: [] }), 'enabled');
  assert.equal(stateOf('text.style-h1', { ...text, active: [] }), 'hidden', 'no main heading while the page may not have one');
  assert.equal(stateOf('text.style-h1', { ...text, levels: [1], active: [] }), 'enabled');
  assert.equal(stateOf('text.style-h2', { ...text, active: ['bullet'] }), 'hidden', 'no heading in a list item');
  assert.equal(stateOf('text.style-quote', { ...text, active: ['bullet'] }), 'hidden');
  assert.equal(stateOf('text.list-bullet', { ...text, active: ['h2'] }), 'hidden', 'no list in a heading');
  assert.equal(stateOf('text.style-label', { ...text, active: [] }), 'hidden', 'Label only where the line can be one');
  assert.equal(stateOf('text.style-label', { ...text, active: ['labelable'] }), 'enabled');
});

test('alignment is disabled where the text cannot be aligned, not hidden', () => {
  assert.equal(stateOf('text.align-center', { route: '', text: true, active: [] }), 'disabled');
  assert.equal(stateOf('text.align-center', { route: '', text: true, active: ['alignable'] }), 'enabled');
});

test('Section settings appears with the cursor in a section, and its icon is the settings icon', () => {
  assert.equal(stateOf('section.settings', { route: '', text: true }), 'hidden');
  assert.equal(stateOf('section.settings', { route: '', text: true, section: true }), 'enabled');
  assert.equal(byId('section.settings').icon, 'tune');
  assert.equal(byId('section.settings').meaning, 'settings-here');
});

test('Insert block and Insert image are there only when the text has them', () => {
  const without = textActions({ ...api, insertBlock: undefined, insertImage: undefined }, labels).map((a) => a.id);
  assert.ok(!without.includes('insert.block') && !without.includes('insert.image'));
  assert.ok(list().some((a) => a.id === 'insert.block' && a.group === 'insert'));
});

test('running an action calls the editor’s function', () => {
  byId('text.bold').run({ route: '' });
  byId('text.style-h3').run({ route: '' });
  byId('text.list-check').run({ route: '' });
  byId('text.align-right').run({ route: '' });
  byId('section.settings').run({ route: '' });
  assert.deepEqual(calls, ['bold', 'kind:h3', 'kind:check', 'align:right', 'section']);
});

test('Preview and View on site are the page actions of the one bar: Preview before the fixed tools, View on site in the ⋮, only when the text has them', () => {
  const preview = byId('page.preview');
  const view = byId('page.view-on-site');
  assert.deepEqual(preview.where, { bar: { context: 'fixed', order: -1 } });
  assert.equal(view.where.more.context, 'fixed');
  assert.equal(stateOf('page.preview', { route: '' }), 'enabled');
  preview.run({ route: '' });
  view.run({ route: '' });
  assert.deepEqual(calls.slice(-2), ['preview', 'view-on-site']);
  const without = textActions({ ...api, preview: undefined, viewOnSite: undefined }, labels);
  assert.ok(!without.some((a) => a.id.startsWith('page.')));
});
