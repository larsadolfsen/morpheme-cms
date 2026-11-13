import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cardDesignProblems, cssIn } from './card-designs.mjs';

const css = ['ui.css', 'blocks.css', 'global.css']
  .map((f) => readFileSync(new URL(`../theme/styles/${f}`, import.meta.url), 'utf8'))
  .join('\n');

test('The Material theme styles every card design and every filled color', () => {
  assert.deepEqual(cardDesignProblems(css), []);
});

test('A theme that leaves a card design or a filled color unstyled is told so', () => {
  const sample = `.card-outlined{background:#fff}.card-filled{background:#eee}.block-cards-primary .block-card{--card-filled-surface:red}`;
  const problems = cardDesignProblems(sample);
  assert.equal(problems.length, 4);
  assert.match(problems.join('\n'), /carousel/);
  assert.match(problems.join('\n'), /"elevated"/);
  assert.match(problems.join('\n'), /"secondary"/);
  assert.match(problems.join('\n'), /"tertiary"/);
  assert.deepEqual(cardDesignProblems(''), cardDesignProblems('.card-filled{color:red}'));
});

test('The CSS of a built site is read from its inlined <style> blocks as well as its .css files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'css-in-'));
  try {
    mkdirSync(join(dir, 'a'));
    writeFileSync(
      join(dir, 'a/index.html'),
      '<html><style data-x>.card-filled{background:red}</style><p>x</p><style>.card-outlined{background:blue}</style></html>',
    );
    writeFileSync(join(dir, 'b.css'), '.card-elevated{background:green}');
    const found = cssIn(dir);
    assert.match(found, /card-filled/);
    assert.match(found, /card-outlined/);
    assert.match(found, /card-elevated/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
