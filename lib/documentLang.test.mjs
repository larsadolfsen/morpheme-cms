import test from 'node:test';
import assert from 'node:assert/strict';
import { isEditorPath, setEditorDocumentLang } from './documentLang.mjs';

const doc = (lang) => ({ documentElement: { lang } });

test('a site page keeps the site language in <html lang>, whatever the browser locale', () => {
  for (const path of ['/', '/da/', '/blocks/cards/', '/editorial/', '/blog/editor/']) {
    const d = doc('da');
    assert.equal(setEditorDocumentLang(d, path, 'en-US'), false, path);
    assert.equal(d.documentElement.lang, 'da', path);
  }
});

test("the editor's own pages follow the editor's language", () => {
  for (const path of ['/editor', '/editor/', '/editor/index.html']) {
    const d = doc('da');
    assert.equal(setEditorDocumentLang(d, path, 'en-US'), true, path);
    assert.equal(d.documentElement.lang, 'en-US', path);
  }
});

test('no document, no write', () => {
  assert.equal(setEditorDocumentLang(undefined, '/editor/', 'en-US'), false);
  assert.equal(isEditorPath('/editor/'), true);
});
