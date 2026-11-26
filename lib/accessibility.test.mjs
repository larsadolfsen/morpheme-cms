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

const check = { criterion: '2.5.8', part: 'button-small', ok: false, why: 'Small button 16 px, under 24 px' };
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
  assert.equal(readStatement(dir).checks[0].part, 'button-small');
  writeFileSync(join(dir, 'accessibility.json'), JSON.stringify(file([{ ...check, part: 'nothing' }])));
  assert.throws(() => readStatement(dir), /not one of/);
});

test('a check needs a known part, its criterion, a reason, no repeat, and the score is the checks’', () => {
  const bad = (checks, over) => statementProblems(file(checks, over));
  assert.match(bad([{ ...check, criterion: '1.4.11' }]).join(), /judged by criterion 2.5.8/);
  assert.match(bad([{ ...check, why: ' ' }]).join(), /"why"/);
  assert.match(bad([check, check]).join(), /named twice/);
  assert.match(bad([{ ...check, extra: 1 }]).join(), /not a field/);
  assert.match(bad([check], { score: 99 }).join(), /"score"/);
  assert.match(statementProblems({ ...file([check]), standard: 'WCAG 2.1' }).join(), /"standard"/);
  assert.match(statementProblems([]).join(), /object/);
  assert.deepEqual(bad([check]), []);
});

test('a low score is a measurement, never a failure', () => {
  const low = file([{ ...check, ok: false }]);
  assert.equal(low.score, 0);
  assert.deepEqual(statementProblems(low), []);
});

test('every part names a criterion and a label', () => {
  for (const [part, p] of Object.entries(PARTS)) assert.ok(/^\d\.\d\.\d+$/.test(p.criterion) && p.label && p.checks.length, part);
});

test('a theme value is measured, a colour is the colour editor’s, neither fails; our code fails on every theme', () => {
  for (const theme of ['saturn', 'venus', 'a-store-theme']) {
    assert.equal(kindOf({ criterion: '1.4.3' }, theme), 'colour');
    assert.equal(kindOf({ criterion: '1.4.11' }, theme), 'colour');
    assert.equal(kindOf({ rule: 'color-contrast' }, theme), 'colour');
    assert.equal(kindOf({ criterion: '2.5.8' }, theme), 'theme');
    assert.equal(kindOf({ criterion: '1.4.12' }, theme), 'theme');
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

test('the Venus case gives no failure: a 44 px small button and a 24 px leading space are theme values, a weak colour is the colour editor’s', () => {
  const findings = [
    { criterion: '2.5.8', detail: 'small button 44 px' },
    { criterion: '2.5.8', detail: 'leading space 24 px' },
    { criterion: '1.4.3', detail: 'text 3:1' },
  ];
  assert.deepEqual(splitByKind(findings, 'venus').code, []);
  assert.equal(splitByKind(findings, 'venus').theme.length, 2);
  assert.equal(splitByKind(findings, 'venus').colour.length, 1);
});

const record = (kind, ratio, min, extra = {}) => ({ kind, ratio, min, bg: '#ffffff', ...extra });

test('target size is one check for each part: contrast records are the site’s colours and are left out, the worst record of a part sets its sentence, the score is the share of parts passed', () => {
  const checks = checksOf([
    record('text', 4.62, 4.5),
    record('border', 1.6, 3, { card: true }),
    record('focus ring', 2, 3),
    record('target', 30, 24, { part: 'button-small' }),
    record('target', 16, 24, { part: 'button-small' }),
    record('target', 48, 24, { part: 'icon-button' }),
    record('target', 12, 24, { part: 'chip', manual: true }),
    record('target', 12, 24),
    record('target', 12, 24, { part: 'not-a-part' }),
  ]);
  assert.deepEqual(
    checks.map((c) => `${c.part} ${c.ok}`),
    ['button-small false', 'icon-button true'],
  );
  assert.equal(checks[0].why, 'Small button 16 px, under 24 px');
  assert.equal(checks[1].why, 'Icon button 48 px, needs 24 px');
  assert.equal(statementOfChecks(checks, null, '0.19.8').score, 50);
  assert.deepEqual(checksOf([record('text', 3, 4.5)]), []);
});

test('the command keeps a reason a person added while the check is unchanged, and drops it when the check changes', () => {
  const measured = [{ ...check }];
  const before = file([{ ...measured[0], why: `${measured[0].why}; Material 3: the small button as printed` }]);
  assert.match(statementOfChecks(measured, before, '0.19.9').checks[0].why, /; Material 3: the small button/);
  assert.equal(statementOfChecks([{ ...measured[0], ok: true }], before, '0.19.9').checks[0].why, measured[0].why);
  assert.equal(statementOfChecks(measured, before, '0.19.9').measured, '0.19.9');
});

test('the summary prints the score, the failed checks, and says when the file is not what was measured', () => {
  const now = statementOfChecks([check], null, '0.19.8');
  const lines = summaryLines(now, now);
  assert.match(lines[0], /Accessibility score 0/);
  assert.match(lines.join('\n'), /2\.5\.8 .*Small button 16 px/);
  assert.ok(!lines.join('\n').includes('not what was measured'));
  assert.match(summaryLines(now, null).join('\n'), /not what was measured/);
});

test('Material’s committed file is a valid statement with the score of its checks', () => {
  const statement = readStatement(fileURLToPath(new URL('../theme', import.meta.url)));
  if (statement === null) return; // written by `morpheme accessibility`; CI's `static` fails if it differs from what the checks measure
  assert.equal(statement.score, scoreOf(statement.checks));
});
