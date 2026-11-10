// Tests for lib/danish.mjs. Run: node --test lib/danish.test.mjs
// Depends on: node:test, node:assert/strict.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { findDanish, danishValuesOf, isLanguagePath } from './danish.mjs';

describe('findDanish', () => {
  it('finds Danish letter in word', () => {
    const result = findDanish('a\nb \u00f8g c', new Set());
    assert.deepEqual(result, [{ line: 2, match: '\u00f8g', kind: 'letter' }]);
  });

  it('finds first word with Danish letter', () => {
    const result = findDanish('\u00f8rer f\u00f8r', new Set());
    assert.deepEqual(result, [{ line: 1, match: '\u00f8rer', kind: 'letter' }]);
  });

  it('finds value in single quotes', () => {
    const result = findDanish("label: 'Alpha'", new Set(['Alpha']));
    assert.deepEqual(result, [{ line: 1, match: 'Alpha', kind: 'value' }]);
  });

  it('finds value in double quotes', () => {
    const result = findDanish('x = "Beta"', new Set(['Beta']));
    assert.deepEqual(result, [{ line: 1, match: 'Beta', kind: 'value' }]);
  });

  it('does not find value in comment', () => {
    const result = findDanish('// Alpha', new Set(['Alpha']));
    assert.deepEqual(result, []);
  });

  it('skips backtick with template literal', () => {
    const result = findDanish('`Alpha ${x}`', new Set(['Alpha']));
    assert.deepEqual(result, []);
  });

  it('finds value in backticks without template', () => {
    const result = findDanish('`Alpha`', new Set(['Alpha']));
    assert.deepEqual(result, [{ line: 1, match: 'Alpha', kind: 'value' }]);
  });

  it('does not match non-Danish value', () => {
    const result = findDanish("'Content'", new Set(['Alpha']));
    assert.deepEqual(result, []);
  });

  it('does not match substring', () => {
    const result = findDanish("'Alphas'", new Set(['Alpha']));
    assert.deepEqual(result, []);
  });

  it('skips a line with the marker language-ok', () => {
    const line = "if (what === 'Alpha') return 1; // language-ok: a route id";
    assert.deepEqual(findDanish(line, new Set(['Alpha'])), []);
    assert.deepEqual(findDanish("if (what === 'Alpha') return 1;", new Set(['Alpha'])).length, 1);
  });

  it('handles empty string', () => {
    const result = findDanish('', new Set());
    assert.deepEqual(result, []);
  });
});

describe('danishValuesOf', () => {
  it('collects Danish values skipping key equals value', () => {
    const result = danishValuesOf([{ Tags: 'Tags', Content: 'Alpha' }]);
    assert.deepEqual([...result].sort(), ['Alpha']);
  });

  it('handles nested objects and skips functions/numbers', () => {
    const result = danishValuesOf([{ a: { b: 'Beta' }, f: () => 'x', n: 3 }]);
    assert.deepEqual([...result].sort(), ['Beta']);
  });

  it('skips values with no letters', () => {
    const result = danishValuesOf([{ a: '', b: '\u00b7', c: 'Gamma' }]);
    assert.deepEqual([...result].sort(), ['Gamma']);
  });

  it('skips values also in English', () => {
    const result = danishValuesOf([{ tags: 'Tags', save: 'Beta' }], [{ tags: 'Tags', save: 'Save' }]);
    assert.deepEqual([...result].sort(), ['Beta']);
  });
});

describe('isLanguagePath', () => {
  it('matches path with /i18n/da-DK/', () => {
    assert.equal(isLanguagePath('src/i18n/da-DK/common.ts'), true);
  });

  it('matches path starting with i18n/da-DK/', () => {
    assert.equal(isLanguagePath('i18n/da-DK/home.md'), true);
  });

  it('matches path ending with i18n/da-DK.js', () => {
    assert.equal(isLanguagePath('worker/i18n/da-DK.js'), true);
  });

  it('does not match other i18n paths', () => {
    assert.equal(isLanguagePath('src/i18n/index.ts'), false);
  });

  it('does not match en-US path', () => {
    assert.equal(isLanguagePath('src/i18n/en-US/common.ts'), false);
  });
});
