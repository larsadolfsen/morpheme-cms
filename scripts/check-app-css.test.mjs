import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { reportApp } from './check-app-css.mjs';

test('the report lists what would be renamed, refused or left unscoped, per app', () => {
  const dir = mkdtempSync(join(tmpdir(), 'app-css-report-'));
  mkdirSync(join(dir, 'blocks'), { recursive: true });
  writeFileSync(
    join(dir, 'a.css'),
    '@import "x.css";\n:root { --mo-gap: 1px }\n@keyframes fade { to { opacity: 1 } }\n.a { padding: var(--mo-gap) }\nbody { margin: 0 }',
  );
  writeFileSync(join(dir, 'blocks/View.tsx'), 'export default () => <i style={{ "--mo-gap": 1 }} />;');
  const r = reportApp(dir, 'shop', new Set());
  assert.deepEqual(r.renamed.vars, ['--mo-gap']);
  assert.deepEqual(r.renamed.keyframes, ['fade']);
  assert.ok(r.refused.some((l) => /a\.css:2: a rule on :root/.test(l)));
  assert.ok(r.refused.some((l) => /a\.css:5: a rule on body/.test(l)));
  assert.ok(r.refused.some((l) => /View\.tsx:1: a custom property in code/.test(l)));
  assert.ok(r.limits.some((l) => /@import/.test(l)));
});
