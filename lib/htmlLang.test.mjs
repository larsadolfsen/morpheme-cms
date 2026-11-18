import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isEditorPath, setEditorLang } from './htmlLang.mjs';

const page = (lang) => ({ documentElement: { lang } });

test('the editor takes the browser language', () => {
  for (const p of ['/editor', '/editor/', '/editor/index.html']) {
    const doc = page('da-DK');
    setEditorLang(doc, 'en-US', p);
    assert.equal(doc.documentElement.lang, 'en-US', p);
  }
});

test('a site page keeps the lang its server rendered', () => {
  for (const p of ['/', '/blocks/cards/', '/editorial/', '/da/editor-tips/', '/privacy']) {
    const doc = page('da-DK');
    setEditorLang(doc, 'en-US', p);
    assert.equal(doc.documentElement.lang, 'da-DK', p);
    assert.equal(isEditorPath(p), false);
  }
});

test('no document (build, checks) is fine', () => {
  assert.doesNotThrow(() => setEditorLang(undefined, 'en-US', '/'));
});

test('src/i18n/index.ts never writes <html lang> on its own', () => {
  const src = readFileSync(new URL('../src/i18n/index.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /documentElement\.lang\s*=/);
  assert.match(src, /setEditorLang\(/);
});
