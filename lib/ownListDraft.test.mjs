// Tests for lib/ownListDraft.mjs and the draft path rule (lib/autosave.mjs). Run: node --test lib/ownListDraft.test.mjs
import assert from 'node:assert/strict';
import test from 'node:test';
import { autosaveKey, isAutosavePath, isListDraftPath, isPagePath, parseKey } from './autosave.mjs';
import { draftText, parseDraft, pendingChanges } from './ownListDraft.mjs';

test('a draft keeps the definition text and what is to be removed, and reads back', () => {
  assert.deepEqual(parseDraft(draftText({ definition: '{"version":2}\n', without: ['image'] })), {
    definition: '{"version":2}\n',
    without: ['image'],
  });
  assert.deepEqual(parseDraft(draftText({ definition: 'x' })).without, []);
});

test('text that is not a draft is not one', () => {
  for (const text of ['', 'nope', '{}', '{"version":9,"definition":"x"}', '{"version":2,"definition":1}'])
    assert.equal(parseDraft(text), null, text);
});

test('a save writes the definition when it differs from the saved one, and a new list has no oid', () => {
  const path = 'src/data/x/_list.json';
  const draft = (definition) => ({ definition, without: [] });
  const files = [{ path, oid: 'o', text: 'a' }];
  assert.deepEqual(pendingChanges({ path, folder: 'src/data/x', draft: draft('a'), files }), []);
  assert.deepEqual(pendingChanges({ path, folder: 'src/data/x', draft: draft('b'), files }), [{ path, content: 'b', oid: 'o' }]);
  assert.deepEqual(pendingChanges({ path, folder: 'src/data/x', draft: draft('b'), files: [] }), [{ path, content: 'b', oid: null }]);
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

test('a field removed while the list waits leaves every item that holds it, and only those', () => {
  const path = 'src/data/x/_list.json';
  const files = [
    { path, oid: 'd', text: 'a' },
    { path: 'src/data/x/a.json', oid: 'o1', text: `${JSON.stringify({ order: 1, text: 'One', image: 'a.png' }, null, 2)}\n` },
    { path: 'src/data/x/b.json', oid: 'o2', text: `${JSON.stringify({ order: 2, text: 'Two' }, null, 2)}\n` },
  ];
  const changes = pendingChanges({ path, folder: 'src/data/x', draft: { definition: 'a', without: ['image'] }, files });
  assert.equal(changes.length, 1);
  assert.equal(changes[0].path, 'src/data/x/a.json');
  assert.equal(changes[0].oid, 'o1');
  assert.deepEqual(JSON.parse(changes[0].content), { order: 1, text: 'One' });
});
