import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allowedKeys, compare, entriesOf, keysOf, problemsOf, readAllowlist, selectorOf } from './a11y.mjs';

const violation = (id, ...targets) => ({ id, nodes: targets.map((target) => ({ target: [target] })) });
const entry = (rule, selector, places, viewports = ['phone', 'computer']) => ({ rule, selector, places, viewports, reason: 'because' });

test('A violation that is not on the allowlist fails', () => {
  const found = keysOf([violation('label', 'input.a'), violation('link-name', 'a.b')], '/blocks/', 'computer');
  const allowed = allowedKeys([entry('label', 'input.a', ['/blocks/'])]);
  const result = compare(found, allowed);
  assert.equal(result.unexpected.length, 1);
  assert.match(result.unexpected[0], /link-name on \/blocks\/ \(computer\): a\.b/);
  assert.ok(problemsOf(result)[0].includes('new violation'));
});

test('An entry that no longer matches fails, so the list only shrinks', () => {
  const found = keysOf([violation('label', 'input.a')], '/blocks/', 'computer');
  const allowed = allowedKeys([entry('label', 'input.a', ['/blocks/', '/about/']), entry('list', 'ul', ['/blocks/'])]);
  const result = compare(found, allowed);
  assert.deepEqual(result.unexpected, []);
  // Of the 6 keys the entries stand for, only one was found: 5 are stale.
  assert.equal(result.stale.length, 5);
  assert.ok(problemsOf(result).every((line) => line.includes('no longer matches')));
});

test('What the allowlist holds exactly is clean', () => {
  const found = keysOf([violation('label', 'input.a', 'input.b')], '/x/', 'phone');
  const allowed = allowedKeys([entry('label', 'input.a', ['/x/'], ['phone']), entry('label', 'input.b', ['/x/'], ['phone'])]);
  assert.deepEqual(problemsOf(compare(found, allowed)), []);
});

test('A place and a viewport are matched on their own', () => {
  const found = keysOf([violation('label', 'input.a')], '#settings', 'phone');
  const allowed = allowedKeys([entry('label', 'input.a', ['#settings', '#other'])], (place) => place === '#settings');
  for (const key of [...allowed.keys()]) if (!key.endsWith('\tphone')) allowed.delete(key);
  assert.deepEqual(compare(found, allowed), { unexpected: [], stale: [] });
});

test('A selector loses the ids React makes, and keeps nested targets apart', () => {
  assert.equal(selectorOf(['#:r1a: > button']), '#r* > button');
  assert.equal(selectorOf(['#_r_3_']), '#r*');
  assert.equal(selectorOf(['iframe', ['a', 'b']]), 'iframe >> a b');
  // A text in a name is left out, so the same list holds in every language.
  assert.equal(
    selectorOf(['li > div[aria-label="Row \\"3\\" of 3"][data-row="2"] > textarea[placeholder="Text"]']),
    'li > div[data-row="2"] > textarea',
  );
});

test('A selector tells the attributes of an element in one order', () => {
  assert.equal(selectorOf(['textarea[data-row="2"][data-field="text"]']), selectorOf(['textarea[data-field="text"][data-row="2"]']));
  assert.equal(selectorOf(['a[href="#a]b"][role="x"] > b[z="1"]']), 'a[href="#a]b"][role="x"] > b[z="1"]');
});

test('Findings become entries that read back as the same findings', () => {
  const keys = new Set([
    ...keysOf([violation('label', 'input.a')], '/a/', 'phone'),
    ...keysOf([violation('label', 'input.a')], '/a/', 'computer'),
    ...keysOf([violation('label', 'input.a')], '/b/', 'phone'),
    ...keysOf([violation('label', 'input.a')], '/b/', 'computer'),
  ]);
  const entries = entriesOf(keys, () => 'why');
  assert.deepEqual(entries, [
    { rule: 'label', selector: 'input.a', places: ['/a/', '/b/'], viewports: ['phone', 'computer'], reason: 'why' },
  ]);
  assert.deepEqual(compare(keys, allowedKeys(entries)), { unexpected: [], stale: [] });
});

test('Every entry of the allowlist has a rule, a selector, places, viewports and a reason, and none is listed twice', () => {
  const seen = new Set();
  for (const e of readAllowlist()) {
    assert.ok(e.rule && e.selector && e.reason?.length > 10 && e.places?.length && e.viewports?.length, JSON.stringify(e).slice(0, 120));
    assert.ok(
      e.places.every((p) => p.startsWith('/') || p.startsWith('#')),
      `a place is a page (/…) or a screen (#…): ${e.places}`,
    );
    assert.ok(e.viewports.every((v) => ['phone', 'computer'].includes(v)));
    for (const place of e.places)
      for (const v of e.viewports) {
        const key = `${e.rule}\t${place}\t${e.selector}\t${v}`;
        assert.ok(!seen.has(key), `listed twice: ${key}`);
        seen.add(key);
      }
  }
});
