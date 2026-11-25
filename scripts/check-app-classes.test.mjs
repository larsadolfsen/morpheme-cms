import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { cmsClasses, siteProblems } from './check-app-classes.mjs';

const cms = { names: new Set(['mo-button', 'mo-card']), prefixes: ['mo-btn-'] };

function site(apps) {
  const root = mkdtempSync(join(tmpdir(), 'app-classes-'));
  for (const [id, { api, css, code }] of Object.entries(apps)) {
    const dir = join(root, 'src/apps', id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'app.json'), JSON.stringify({ api }));
    writeFileSync(join(dir, 'style.css'), css ?? '');
    writeFileSync(join(dir, 'View.tsx'), code ?? '');
  }
  return root;
}

test('a contract-8 app that uses a mo- class the CMS lacks is refused, with the class and the file', () => {
  const root = site({
    mailchimp: {
      api: 8,
      css: '.mo-mailchimp { color: red } .mo-card { gap: 1px }',
      code: 'export default () => <i className="mo-button mo-btn-tonal mo-signup" />;',
    },
  });
  const p = siteProblems(root, cms);
  assert.equal(p.length, 2);
  assert.ok(p.some((l) => /mailchimp\/style\.css:1: the class mo-mailchimp/.test(l)));
  assert.ok(p.some((l) => /mailchimp\/View\.tsx:1: the class mo-signup/.test(l)));
});

test('plain class names, custom properties and data attributes are not mo- classes', () => {
  const root = site({
    shop: {
      api: 8,
      css: '.signup { color: var(--mo-sys-color-primary) } [data-mo-app] a { x: y }',
      code: '<i className="signup" data-mo-app="x" />',
    },
  });
  assert.deepEqual(siteProblems(root, cms), []);
});

test('an app written to an older contract is not checked', () => {
  assert.deepEqual(siteProblems(site({ old: { api: 7, css: '.mo-own { color: red }' } }), cms), []);
});

test('the CMS has the classes its own theme writes', () => {
  const { names } = cmsClasses();
  assert.ok(names.has('mo-button') || [...names].some((n) => n.startsWith('mo-button')));
});
