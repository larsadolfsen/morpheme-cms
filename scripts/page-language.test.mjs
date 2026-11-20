import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlLang } from './screens/support/page-language.mjs';

test('htmlLang reads the lang the server sent', () => {
  assert.equal(htmlLang('<!doctype html><html lang="da" data-motion-scheme="x"><head>'), 'da');
  assert.equal(htmlLang("<html data-a='1' lang='en-US'>"), 'en-US');
  assert.equal(htmlLang('<HTML LANG=da-DK>'), 'da-DK');
});
test('htmlLang is empty when there is none, and ignores lang on other tags', () => {
  assert.equal(htmlLang('<html><body><p lang="fr">'), '');
  assert.equal(htmlLang(''), '');
});
