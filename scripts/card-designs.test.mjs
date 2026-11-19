import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MATERIAL_FILES, OTHER_BASE_FILES, UI_PART_FILES } from '../theme/styles/files.mjs';
import { cardDesignProblems, cssIn } from './card-designs.mjs';

// The stylesheets and their token files (theme/styles/tokens/, docs/theme-token-files.md).
const styles = new URL('../theme/styles/', import.meta.url);
const css = [
  // the blocks/ files come from the list the stylesheets are read by (theme/styles/files.mjs).
  ...['ui.css', 'cards.css', 'global.css', ...UI_PART_FILES, ...OTHER_BASE_FILES.filter((f) => f.startsWith('blocks')), ...MATERIAL_FILES],
  ...readdirSync(new URL('tokens/', styles), { recursive: true })
    .filter((f) => f.endsWith('.css'))
    .map((f) => `tokens/${f}`),
]
  .map((f) => readFileSync(new URL(f, styles), 'utf8'))
  .join('\n');

test('The Material theme styles every card design and every filled color', () => {
  assert.deepEqual(cardDesignProblems(css), []);
});

test('A theme that leaves a card design or a filled color unstyled is told so', () => {
  const sample = `.mo-card.mo-is-outlined{background:#fff}.mo-card.mo-is-filled{background:#eee}.mo-block-cards__primary .mo-block-cards__card{--mo-comp-filled-card-container-color:red}`;
  const problems = cardDesignProblems(sample);
  assert.equal(problems.length, 4);
  assert.match(problems.join('\n'), /carousel/);
  assert.match(problems.join('\n'), /"elevated"/);
  assert.match(problems.join('\n'), /"secondary"/);
  assert.match(problems.join('\n'), /"tertiary"/);
  assert.deepEqual(cardDesignProblems(''), cardDesignProblems('.mo-card.mo-is-filled{color:red}'));
});

test('The CSS of a built site is read from its inlined <style> blocks as well as its .css files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'css-in-'));
  try {
    mkdirSync(join(dir, 'a'));
    writeFileSync(
      join(dir, 'a/index.html'),
      '<html><style data-x>.mo-card.mo-is-filled{background:red}</style><p>x</p><style>.mo-card.mo-is-outlined{background:blue}</style></html>',
    );
    writeFileSync(join(dir, 'b.css'), '.mo-card.mo-is-elevated{background:green}');
    const found = cssIn(dir);
    assert.match(found, /mo-is-filled/);
    assert.match(found, /mo-is-outlined/);
    assert.match(found, /mo-is-elevated/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
