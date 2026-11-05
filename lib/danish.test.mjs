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
    const result = findDanish("label: 'Indhold'", new Set(['Indhold']));
    assert.deepEqual(result, [{ line: 1, match: 'Indhold', kind: 'value' }]);
  });

  it('finds value in double quotes', () => {
    const result = findDanish('x = "Gem"', new Set(['Gem']));
    assert.deepEqual(result, [{ line: 1, match: 'Gem', kind: 'value' }]);
  });

  it('does not find value in comment', () => {
    const result = findDanish('// Indhold', new Set(['Indhold']));
    assert.deepEqual(result, []);
  });

  it('skips backtick with template literal', () => {
    const result = findDanish('`Indhold ${x}`', new Set(['Indhold']));
    assert.deepEqual(result, []);
  });

  it('finds value in backticks without template', () => {
    const result = findDanish('`Indhold`', new Set(['Indhold']));
    assert.deepEqual(result, [{ line: 1, match: 'Indhold', kind: 'value' }]);
  });

  it('does not match non-Danish value', () => {
    const result = findDanish("'Content'", new Set(['Indhold']));
    assert.deepEqual(result, []);
  });

  it('does not match substring', () => {
    const result = findDanish("'Indholdet'", new Set(['Indhold']));
    assert.deepEqual(result, []);
  });

  it('handles empty string', () => {
    const result = findDanish('', new Set());
    assert.deepEqual(result, []);
  });
});

describe('danishValuesOf', () => {
  it('collects Danish values skipping key equals value', () => {
    const result = danishValuesOf([{ Tags: 'Tags', Content: 'Indhold' }]);
    assert.deepEqual([...result].sort(), ['Indhold']);
  });

  it('handles nested objects and skips functions/numbers', () => {
    const result = danishValuesOf([{ a: { b: 'Gem' }, f: () => 'x', n: 3 }]);
    assert.deepEqual([...result].sort(), ['Gem']);
  });

  it('skips values with no letters', () => {
    const result = danishValuesOf([{ a: '', b: '\u00b7', c: 'Ja' }]);
    assert.deepEqual([...result].sort(), ['Ja']);
  });

  it('skips values also in English', () => {
    const result = danishValuesOf([{ tags: 'Tags', save: 'Gem' }], [{ tags: 'Tags', save: 'Save' }]);
    assert.deepEqual([...result].sort(), ['Gem']);
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
