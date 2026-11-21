import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { PARTS, STANDARD, judgeShortfalls, readStatement, statementProblems } from './accessibility.mjs';

const entry = { criterion: '1.4.3', part: 'placeholder', why: 'Material 3: a placeholder is 60% of its on-colour' };

test('a statement with no entries, or no file, meets the standard', () => {
  assert.deepEqual(statementProblems({ standard: STANDARD, fallsShort: [] }), []);
  assert.deepEqual(readStatement(mkdtempSync(join(tmpdir(), 'mo-a11y-'))), { standard: STANDARD, fallsShort: [] });
});

test('a statement is read from its file and checked', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mo-a11y-'));
  writeFileSync(join(dir, 'accessibility.json'), JSON.stringify({ standard: STANDARD, fallsShort: [entry] }));
  assert.equal(readStatement(dir).fallsShort[0].part, 'placeholder');
  writeFileSync(join(dir, 'accessibility.json'), JSON.stringify({ standard: STANDARD, fallsShort: [{ ...entry, part: 'nothing' }] }));
  assert.throws(() => readStatement(dir), /not one of/);
});

test('an entry needs a known part, its criterion, a reason and no repeat', () => {
  const bad = (e) => statementProblems({ standard: STANDARD, fallsShort: e });
  assert.match(bad([{ ...entry, criterion: '1.4.11' }]).join(), /judged by criterion 1.4.3/);
  assert.match(bad([{ ...entry, why: ' ' }]).join(), /"why"/);
  assert.match(bad([entry, entry]).join(), /named twice/);
  assert.match(bad([{ ...entry, extra: 1 }]).join(), /not a field/);
  assert.match(statementProblems({ standard: 'WCAG 2.1', fallsShort: [] }).join(), /"standard"/);
  assert.match(statementProblems([]).join(), /object/);
});

test('every part names a criterion and a label', () => {
  for (const [part, p] of Object.entries(PARTS)) assert.ok(/^\d\.\d\.\d+$/.test(p.criterion) && p.label && p.checks.length, part);
});

const finding = { criterion: '1.4.3', part: 'placeholder', detail: 'a placeholder is 2.1:1' };
const meets = { fallsShort: [] };
const names = { fallsShort: [entry] };

test('a named shortfall passes, an unnamed one fails', () => {
  assert.deepEqual(judgeShortfalls([finding], names, { check: 'contrast' }), { problems: [], named: ['1.4.3 placeholder'] });
  const unnamed = judgeShortfalls([finding], meets, { check: 'contrast', where: 'theme/accessibility.json' });
  assert.match(unnamed.problems[0], /falls short of 1\.4\.3 \(placeholder\) and theme\/accessibility\.json does not name it/);
  assert.match(
    judgeShortfalls([{ ...finding, part: 'section-edges', criterion: '1.4.11' }], names, { check: 'contrast' }).problems[0],
    /does not name it/,
  );
});

test('a failure no part names always fails, with its own text', () => {
  assert.deepEqual(
    judgeShortfalls([{ criterion: '1.4.3', part: null, detail: 'the text is 2:1' }], names, { check: 'contrast', stale: false }).problems,
    ['the text is 2:1'],
  );
});

test('an entry its check no longer finds is stale; another check does not judge it', () => {
  assert.match(judgeShortfalls([], names, { check: 'contrast' }).problems[0], /no longer fails/);
  assert.deepEqual(judgeShortfalls([], names, { check: 'contrast', stale: false }).problems, []);
  assert.deepEqual(judgeShortfalls([], names, { check: 'announce' }).problems, []);
});
