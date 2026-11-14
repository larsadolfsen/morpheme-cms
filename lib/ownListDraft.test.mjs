// Tests for lib/ownListDraft.mjs, the draft path rule (lib/autosave.mjs) and `without` in lib/ownListSave.mjs. Run: node --test lib/ownListDraft.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { autosaveKey, isAutosavePath, isListDraftPath, isPagePath, parseKey } from './autosave.mjs';
import { definitionChange, draftText, parseDraft } from './ownListDraft.mjs';
import { savePlan } from './ownListSave.mjs';

test('a draft keeps the definition text, the rows with their files and what is to be removed, and reads back', () => {
  const text = draftText({
    definition: '{"version":2}\n',
    rows: [{ slug: 'a', row: { text: 'One' } }, { row: { text: 'Two' } }],
    without: ['image'],
  });
  assert.deepEqual(parseDraft(text), {
    definition: '{"version":2}\n',
    rows: [{ slug: 'a', row: { text: 'One' } }, { row: { text: 'Two' } }],
    without: ['image'],
  });
  assert.deepEqual(parseDraft(draftText({ definition: 'x', rows: [] })).without, []);
});

test('text that is not a draft is not one', () => {
  for (const text of ['', 'nope', '{}', '{"version":2,"definition":"x","rows":[]}', '{"version":1,"definition":1,"rows":[]}'])
    assert.equal(parseDraft(text), null, text);
});

test('the definition is written when it differs from the saved one, and a new list has no oid', () => {
  const path = 'src/data/x/_list.json';
  assert.deepEqual(definitionChange({ path, text: 'a', committed: { oid: 'o', text: 'a' } }), []);
  assert.deepEqual(definitionChange({ path, text: 'b', committed: { oid: 'o', text: 'a' } }), [{ path, content: 'b', oid: 'o' }]);
  assert.deepEqual(definitionChange({ path, text: 'b', committed: undefined }), [{ path, content: 'b', oid: null }]);
});

test('the Worker keeps a list draft under its definition and never takes it for a page', () => {
  const path = 'src/data/services/_list.json';
  assert.equal(isListDraftPath(path), true);
  assert.equal(isPagePath(path), false);
  assert.equal(isAutosavePath(path), true);
  assert.equal(isAutosavePath('src/content/pages/a.md'), true);
  for (const bad of [
    'src/data/services/a.json',
    'src/data/_list.json',
    'src/data/../x/_list.json',
    '/src/data/x/_list.json',
    'x\\y/_list.json',
    7,
  ])
    assert.equal(isListDraftPath(bad), false, String(bad));
  const key = autosaveKey('me/site', path);
  assert.equal(key, 'me/site/autosave/src/data/services/_list.json/waiting');
  assert.deepEqual(parseKey('me/site', key), { path, id: 'waiting' });
});

test('a field removed while the list waits leaves every entry the plan writes', () => {
  const known = new Map([
    ['src/data/x/a.json', { oid: 'o', text: `${JSON.stringify({ order: 1, text: 'One', image: 'a.png' }, null, 2)}\n` }],
  ]);
  const plan = savePlan({
    folder: 'src/data/x',
    rows: [{ key: 1, text: 'One' }],
    known,
    slugs: new Map([[1, 'a']]),
    visible: [{ id: 'text', kind: 'text' }],
    without: ['image'],
  });
  assert.equal(plan.writes.length, 1);
  assert.deepEqual(JSON.parse(plan.writes[0].content), { order: 1, text: 'One' });
  // Without it the data of a field that is not visible stays, as before.
  const kept = savePlan({
    folder: 'src/data/x',
    rows: [{ key: 1, text: 'One' }],
    known,
    slugs: new Map([[1, 'a']]),
    visible: [{ id: 'text', kind: 'text' }],
  });
  assert.equal(kept.writes.length, 0);
});
