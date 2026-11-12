import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { cardDesignProblems } from './card-designs.mjs';

const css = ['ui.css', 'blocks.css', 'global.css']
  .map((f) => readFileSync(new URL(`../theme/styles/${f}`, import.meta.url), 'utf8'))
  .join('\n');

test('The Material theme styles every card design and every filled color', () => {
  assert.deepEqual(cardDesignProblems(css), []);
});

test('A theme that leaves a card design or a filled color unstyled is told so', () => {
  const sample = `.card-outlined{background:#fff}.card-filled{background:#eee}.block-cards-primary .block-card{--card-filled-surface:red}`;
  const problems = cardDesignProblems(sample);
  assert.equal(problems.length, 3);
  assert.match(problems.join('\n'), /"elevated"/);
  assert.match(problems.join('\n'), /"secondary"/);
  assert.match(problems.join('\n'), /"tertiary"/);
  assert.deepEqual(cardDesignProblems(''), cardDesignProblems('.card-filled{color:red}'));
});
