import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  PARTS,
  STANDARD,
  checksOf,
  kindOf,
  readStatement,
  splitByKind,
  statementOfChecks,
  statementProblems,
  summaryLines,
} from './accessibility.mjs';
import { scoreOf } from './score.mjs';

const check = { criterion: '1.4.3', part: 'placeholder', ok: false, why: 'Placeholder 3.10:1 against #ffffff, under 4.5:1' };
const file = (checks, over = {}) => ({ standard: STANDARD, measured: '0.19.8', score: scoreOf(checks), checks, ...over });

test('no file, or a file in the old form, means the theme is not measured', () => {
  assert.equal(readStatement(mkdtempSync(join(tmpdir(), 'mo-a11y-'))), null);
  const dir = mkdtempSync(join(tmpdir(), 'mo-a11y-'));
  writeFileSync(join(dir, 'accessibility.json'), JSON.stringify({ standard: STANDARD, fallsShort: [] }));
  assert.equal(readStatement(dir), null);
});

test('a statement is read from its file and checked', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mo-a11y-'));
  writeFileSync(join(dir, 'accessibility.json'), JSON.stringify(file([check])));
  assert.equal(readStatement(dir).checks[0].part, 'placeholder');
  writeFileSync(join(dir, 'accessibility.json'), JSON.stringify(file([{ ...check, part: 'nothing' }])));
  assert.throws(() => readStatement(dir), /not one of/);
});

test('a check needs a known part, its criterion, a reason, no repeat, and the score is the checks’', () => {
  const bad = (checks, over) => statementProblems(file(checks, over));
  assert.match(bad([{ ...check, criterion: '1.4.11' }]).join(), /judged by criterion 1.4.3/);
  assert.match(bad([{ ...check, why: ' ' }]).join(), /"why"/);
  assert.match(bad([check, check]).join(), /named twice/);
  assert.match(bad([{ ...check, extra: 1 }]).join(), /not a field/);
  assert.match(bad([check], { score: 99 }).join(), /"score"/);
  assert.match(statementProblems({ ...file([check]), standard: 'WCAG 2.1' }).join(), /"standard"/);
  assert.match(statementProblems([]).join(), /object/);
  assert.deepEqual(bad([check]), []);
});

test('a low score is a measurement, never a failure', () => {
  const checks = [0, 1, 2, 3, 4].map((i) => ({ ...check, part: Object.keys(PARTS)[i], criterion: Object.values(PARTS)[i].criterion }));
  const low = file(checks.map((c, i) => ({ ...c, ok: i === 0 })));
  assert.equal(low.score, 20);
  assert.deepEqual(statementProblems(low), []);
});

test('every part names a criterion and a label', () => {
  for (const [part, p] of Object.entries(PARTS)) assert.ok(/^\d\.\d\.\d+$/.test(p.criterion) && p.label && p.checks.length, part);
});

test('a theme value is measured, not failed; our code fails on every theme', () => {
  for (const theme of ['saturn', 'venus', 'a-store-theme']) {
    assert.equal(kindOf({ criterion: '1.4.3' }, theme), 'theme');
    assert.equal(kindOf({ criterion: '1.4.11' }, theme), 'theme');
    assert.equal(kindOf({ criterion: '2.5.8' }, theme), 'theme');
    assert.equal(kindOf({ rule: 'color-contrast' }, theme), 'theme');
    assert.equal(kindOf({ rule: 'target-size' }, theme), 'theme');
    assert.equal(kindOf({ criterion: '2.1.1' }, theme), 'code');
    assert.equal(kindOf({ rule: 'button-name' }, theme), 'code');
    assert.equal(kindOf({ criterion: '2.4.7' }, theme), 'code');
  }
});

test('a finding the table does not place is our code', () => {
  assert.equal(kindOf({}), 'code');
  assert.equal(kindOf({ criterion: '9.9.9', rule: 'made-up' }), 'code');
});

test('the Venus case gives no failure: a 44 px small button, a 24 px leading space and 24 px dialog corners are theme values', () => {
  const findings = [
    { criterion: '2.5.8', detail: 'small button 44 px' },
    { criterion: '2.5.8', detail: 'leading space 24 px' },
    { criterion: '1.4.11', detail: 'dialog corners 24 px' },
  ];
  assert.deepEqual(splitByKind(findings, 'venus').code, []);
  assert.equal(splitByKind(findings, 'venus').theme.length, 3);
});

const record = (kind, ratio, min, extra = {}) => ({ kind, ratio, min, bg: '#ffffff', ...extra });

test('the checks are one for each part, the worst record sets the sentence, and the score is the share that passed', () => {
  const checks = checksOf([
    record('text', 7, 4.5),
    record('text', 4.62, 4.5),
    record('placeholder', 3.1, 4.5),
    record('border', 1.6, 3, { card: true }),
    record('target', 16, 24),
    record('icon', 2, 3, { manual: true }),
  ]);
  assert.deepEqual(
    checks.map((c) => `${c.part} ${c.ok}`),
    ['text true', 'placeholder false', 'outlined-card-edge false', 'target-size false'],
  );
  assert.equal(checks[0].why, 'Text lowest 4.62:1, needs 4.5:1');
  assert.equal(checks[2].why, 'Outlined card edge 1.60:1 against #ffffff, under 3:1');
  assert.equal(checks[3].why, 'Smallest control 16 px, under 24 px');
  assert.equal(statementOfChecks(checks, null, '0.19.8').score, 25);
});

test('the command keeps a reason a person added while the check is unchanged, and drops it when the check changes', () => {
  const measured = [{ criterion: '1.4.3', part: 'placeholder', ok: false, why: 'Placeholder 3.10:1 against #ffffff, under 4.5:1' }];
  const before = file([{ ...measured[0], why: `${measured[0].why}; Material 3: 60% of its on-colour` }]);
  assert.match(statementOfChecks(measured, before, '0.19.9').checks[0].why, /; Material 3: 60%/);
  assert.equal(statementOfChecks([{ ...measured[0], ok: true }], before, '0.19.9').checks[0].why, measured[0].why);
  assert.equal(statementOfChecks(measured, before, '0.19.9').measured, '0.19.9');
});

test('the summary prints the score, the failed checks, and says when the file is not what was measured', () => {
  const now = statementOfChecks([check], null, '0.19.8');
  const lines = summaryLines(now, now);
  assert.match(lines[0], /Accessibility score 0/);
  assert.match(lines.join('\n'), /1\.4\.3 .*Placeholder 3\.10:1/);
  assert.ok(!lines.join('\n').includes('not what was measured'));
  assert.match(summaryLines(now, null).join('\n'), /not what was measured/);
});

test('Material’s committed file is a valid statement with the score of its checks', () => {
  const statement = readStatement(fileURLToPath(new URL('../theme', import.meta.url)));
  if (statement === null) return; // written by `morpheme accessibility`; CI's `static` fails if it differs from what the checks measure
  assert.equal(statement.score, scoreOf(statement.checks));
});
