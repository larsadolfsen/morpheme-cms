// Tests for lib/danish.mjs. Run: node --test lib/danish.test.mjs
// Depends on: node:test, node:assert/strict.

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  findDanish,
  danishValuesOf,
  isLanguagePath,
  findDanishIds,
  findDanishPathIds,
  findDanishTexts,
  isIdCheckSkipped,
  matchPending,
} from './danish.mjs';
import { DANISH_IDS, DANISH_ROUTE_SEGMENTS, DANISH_STOP_WORDS } from './danishIds.mjs';
import { MOVED, RENAMED } from '../src/movedRoutes.mjs';

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

// The Danish words below are test data for the id check. This file is skipped by the id and text rules (isIdCheckSkipped).
describe('findDanishIds', () => {
  it('finds a Danish id in a quoted string, split at / - _ : { }', () => {
    assert.deepEqual(findDanishIds("const key = 'editor-sort-valg-posts';"), [{ line: 1, match: 'valg', kind: 'id' }]);
    assert.deepEqual(findDanishIds("route('apps/udvikler')"), [{ line: 1, match: 'udvikler', kind: 'id' }]);
    assert.deepEqual(findDanishIds('x = "blok:button"'), [{ line: 1, match: 'blok', kind: 'id' }]); // language-ok: test data
    assert.deepEqual(findDanishIds("id: 'ikoner/mdi'"), [{ line: 1, match: 'ikoner', kind: 'id' }]);
    assert.deepEqual(findDanishIds("a_b = 'x_navn_y'"), [{ line: 1, match: 'navn', kind: 'id' }]);
  });

  it('finds nothing in an English string', () => {
    assert.deepEqual(findDanishIds("const key = 'editor-sort-pick-posts'; route('apps/developer')"), []);
    assert.deepEqual(findDanishIds("label: 'Appearance'"), []);
  });

  it('finds a {placeholder} name, quoted or not', () => {
    assert.deepEqual(findDanishIds("text: 'Hello {navn}'"), [{ line: 1, match: 'navn', kind: 'id' }]);
    assert.deepEqual(findDanishIds('Hello {navn}, welcome'), [{ line: 1, match: 'navn', kind: 'id' }]);
    assert.deepEqual(findDanishIds("text: 'Hello {name}'"), []);
  });

  it('finds a Danish route segment in a quoted URL path', () => {
    assert.deepEqual(findDanishIds("redirect('/ny/about/')"), [{ line: 1, match: 'ny', kind: 'id' }]);
    assert.deepEqual(findDanishIds("label: 'ny'"), []);
  });

  it('does not match a word inside a longer English word', () => {
    assert.deepEqual(findDanishIds("'navnigation' 'blokade' 'filers' 'valgrind' 'udseendes'"), []);
  });

  it('reports each token once per line and keeps the line number', () => {
    const found = findDanishIds("a\nx = 'valg-a' + 'valg-b' + '{navn}'");
    assert.deepEqual(found, [
      { line: 2, match: 'valg', kind: 'id' },
      { line: 2, match: 'navn', kind: 'id' },
    ]);
  });

  it('skips a line with the marker language-ok', () => {
    assert.deepEqual(findDanishIds("const a = 'valg-x'; // language-ok: a stored key"), []);
  });

  it('is case blind', () => {
    assert.deepEqual(findDanishIds("'Udseende'"), [{ line: 1, match: 'udseende', kind: 'id' }]);
  });
});

describe('findDanishPathIds', () => {
  it('finds a Danish folder name in a path', () => {
    assert.deepEqual(findDanishPathIds('src/content/pages/ny/about.md'), ['ny']);
    assert.deepEqual(findDanishPathIds('pages/blog/kategori/[category].astro'), ['kategori']);
  });

  it('finds a Danish file name without its extension, and the words of a hyphenated name', () => {
    assert.deepEqual(findDanishPathIds('starter/src/content/pages/forside.md'), ['forside']);
    assert.deepEqual(findDanishPathIds('docs/udseende-temaer.md'), ['udseende', 'temaer']);
    assert.deepEqual(findDanishPathIds('pages/ny.astro'), ['ny']);
  });

  it('finds nothing in an English path, or a word inside a longer name', () => {
    assert.deepEqual(findDanishPathIds('src/content/pages/new/about.md'), []);
    assert.deepEqual(findDanishPathIds('src/Library.tsx'), []);
    assert.deepEqual(findDanishPathIds('src/nyhedsbrev/a.md'), []);
  });
});

describe('findDanishTexts', () => {
  it('finds a quoted string with stop words', () => {
    const found = findDanishTexts("fail('Filen findes ikke');");
    assert.deepEqual(found, [{ line: 1, match: 'Filen findes ikke', kind: 'text' }]);
  });

  it('finds a quoted string with one stop word, as a whole word only', () => {
    assert.deepEqual(findDanishTexts("fail('Value is ikke set');"), [{ line: 1, match: 'Value is ikke set', kind: 'text' }]);
    assert.deepEqual(findDanishTexts("fail('Value is not set, ikkeet, manglerne');"), []);
    assert.deepEqual(findDanishTexts("fail('Value is not set');"), []);
  });

  it('skips a line with the marker language-ok', () => {
    assert.deepEqual(findDanishTexts("fail('Filen findes ikke'); // language-ok: test data"), []);
  });
});

describe('isIdCheckSkipped', () => {
  it('allow-lists the legacy route table, its test, the word list and this check test', () => {
    for (const path of [
      'src/movedRoutes.mjs',
      'src/movedRoutes.test.mjs',
      'lib/danishIds.mjs',
      'lib/danish.test.mjs',
      'scripts/pending-ids.mjs',
    ]) {
      assert.equal(isIdCheckSkipped(path), true, path);
    }
    assert.equal(isIdCheckSkipped('src/App.tsx'), false);
  });

  it('a Danish word in the allow-listed file is not a finding of the check', () => {
    assert.ok(findDanishIds("const MOVED = { 'udseende/logo': 'company/logo' };").length > 0);
    assert.equal(isIdCheckSkipped('src/movedRoutes.mjs'), true);
  });
});

describe('matchPending', () => {
  it('splits findings into new ones and listed ones, and lists entries that no longer match', () => {
    const findings = [
      { path: 'a.ts', token: 'valg' },
      { path: 'a.ts', token: 'navn' },
      { path: 'b.ts', token: 'valg' },
    ];
    const pending = ['a.ts:valg', 'b.ts:valg', 'c.ts:blok'];
    const { fresh, stale } = matchPending(findings, pending);
    assert.deepEqual(fresh, [{ path: 'a.ts', token: 'navn' }]);
    assert.deepEqual(stale, ['c.ts:blok']);
  });

  it('matches a token that holds a colon', () => {
    const { fresh, stale } = matchPending([{ path: 'a.ts', token: 'text:Not found: x' }], ['a.ts:text:Not found: x']);
    assert.deepEqual([fresh, stale], [[], []]);
  });
});

describe('DANISH_IDS', () => {
  it('holds only lower-case whole words of three letters or more, none of the words left out on purpose', () => {
    for (const word of DANISH_IDS) {
      assert.match(word, /^[a-z]{3,}$/, word);
    }
    for (const left of ['side', 'ny', 'om', 'dele']) assert.equal(DANISH_IDS.has(left), false, left); // language-ok: test data
  });

  it('covers every word of the old editor addresses, except the English ones and a short list', () => {
    const english = new Set([
      'apps',
      'appstore',
      'settings',
      'appearance',
      'advanced',
      'header',
      'footer',
      'logo',
      'bank',
      'seo',
      'src',
      'data',
      'json',
      'editor',
      'themes',
      'licenses',
      'ikke',
      'calendly',
      'mailchimp',
      'cookiebanner',
      'links',
      'parts',
      'developer',
      'colors',
      'column',
      'alle',
      'dele',
      'ny',
      'om',
      'side', // language-ok: test data
    ]); // English words, brands and the words left out on purpose
    const words = new Set();
    for (const key of [...Object.keys(MOVED), ...Object.keys(RENAMED)]) {
      for (const word of key.split(/[^a-z]+/)) if (word && word !== 'appstore') words.add(word);
    }
    const missing = [...words].filter((word) => !DANISH_IDS.has(word) && !english.has(word));
    assert.deepEqual(missing, []);
  });

  it('holds the route segments and stop words as separate lists', () => {
    assert.ok(DANISH_ROUTE_SEGMENTS.has('ny'));
    assert.ok(DANISH_STOP_WORDS.includes('ikke'));
  });
});
