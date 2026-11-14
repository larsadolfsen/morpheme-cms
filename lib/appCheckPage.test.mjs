import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { appBlockTypes, appCheckPage } from './appCheckPage.mjs';

const app = (blocks, page) => {
  const dir = mkdtempSync(join(tmpdir(), 'app-check-page-'));
  for (const b of blocks) {
    mkdirSync(join(dir, 'blocks', b), { recursive: true });
    writeFileSync(join(dir, 'blocks', b, 'index.tsx'), '');
  }
  mkdirSync(join(dir, 'blocks', 'not-a-block'), { recursive: true });
  if (page !== undefined) writeFileSync(join(dir, 'check-page.md'), page);
  return dir;
};
const page = (...blocks) => `---\ntitle: "T"\n---\n\n${blocks.join('\n\n')}\n`;
const block = (t, p = '{"items":[]}') => `<div data-block="${t}" data-props="${p.replaceAll('"', '&quot;')}"></div>`;

test('An app has the blocks whose folder has an index.tsx', () => {
  const dir = app(['tickets', 'faq']);
  try {
    assert.deepEqual(appBlockTypes(dir), ['faq', 'tickets']);
    assert.deepEqual(appBlockTypes(join(dir, 'none')), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('An app with no test page gets its blocks with default values and a warning that names it', () => {
  const dir = app(['tickets']);
  try {
    const r = appCheckPage(dir, 'sara');
    assert.equal(r.source, 'default values');
    assert.match(r.text, /data-block="tickets"/);
    assert.deepEqual(r.problems, []);
    assert.match(r.warnings.join('\n'), /^app sara: no check-page\.md/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('An app with a valid test page is checked with it, with no warning', () => {
  const dir = app(['tickets'], page(block('tickets')));
  try {
    const r = appCheckPage(dir, 'inline-example');
    assert.equal(r.source, 'check-page.md');
    assert.deepEqual([r.problems, r.warnings], [[], []]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('A test page that is not valid fails under the name of the app; a block it leaves out is a warning', () => {
  const dir = app(['tickets', 'faqs'], '# no front matter\n\n' + block('tickets') + block('list'));
  try {
    const r = appCheckPage(dir, 'sara');
    const problems = r.problems.join('\n');
    assert.match(problems, /app sara: check-page\.md has no front matter/);
    assert.match(problems, /app sara: check-page\.md has the block "list", which the app does not have/);
    assert.match(r.warnings.join('\n'), /app sara: check-page\.md leaves out the block "faqs"/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  const empty = app(['tickets'], page());
  try {
    assert.match(appCheckPage(empty, 'sara').problems.join('\n'), /has no block/);
  } finally {
    rmSync(empty, { recursive: true, force: true });
  }
});

test('An app without blocks has no test page', () => {
  const dir = app([]);
  try {
    assert.equal(appCheckPage(dir, 'sara'), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
