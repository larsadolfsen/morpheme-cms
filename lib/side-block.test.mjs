// Tests for sideBlockOf (the site) and besideInSource, sideChoices and sideSwitchShown (the editor's Sidekolonne).
// Validates side block selection logic.
// Depends on lib/side-block.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { besideInSource, sideBlockOf, sideChoices, sideSwitchShown } from './side-block.mjs';

const yes = () => true;
const no = () => false;

test('returns null when setting is null', () => {
  assert.equal(sideBlockOf({}, null, yes), null);
});

test('returns null when setting.block is null', () => {
  assert.equal(sideBlockOf({}, { block: null }, yes), null);
});

test('returns block type when valid', () => {
  assert.equal(sideBlockOf({}, { block: 'side-card' }, yes), 'side-card');
});

test('returns null when page.wide is true', () => {
  assert.equal(sideBlockOf({ wide: true }, { block: 'side-card' }, yes), null);
});

test('returns null when page.side is false', () => {
  assert.equal(sideBlockOf({ side: false }, { block: 'side-card' }, yes), null);
});

test('returns block type when page.side is true', () => {
  assert.equal(sideBlockOf({ side: true }, { block: 'side-card' }, yes), 'side-card');
});

test('returns null when beside returns false', () => {
  assert.equal(sideBlockOf({}, { block: 'side-card' }, no), null);
});

test('beside is called with the chosen type', () => {
  const seen = [];
  sideBlockOf({}, { block: 'side-card' }, (t) => {
    seen.push(t);
    return true;
  });
  assert.deepEqual(seen, ['side-card']);
});

test('treats undefined page as empty object', () => {
  assert.equal(sideBlockOf(undefined, { block: 'side-card' }, yes), 'side-card');
});

test('besideInSource reads export const beside = true', () => {
  assert.equal(besideInSource('import x from "y";\nexport const beside = true;\nexport const load = 1;'), true);
  assert.equal(besideInSource('export const beside = false;'), false);
  assert.equal(besideInSource('// export const beside = true;'), false);
  assert.equal(besideInSource('export const load = 1;'), false);
});

test('sideChoices lists installed blocks with beside, by label', () => {
  const blocks = [
    { type: 'hero', label: 'Hero' },
    { type: 'toc', label: 'Contents' },
    { type: 'chat', label: 'Chat', app: 'chat' },
    { type: 'gone', label: 'Gone', app: 'gone' },
  ];
  const beside = 'export const beside = true;';
  const sources = { toc: beside, chat: beside, gone: beside, hero: 'export const load = 1;' };
  assert.deepEqual(sideChoices(blocks, sources, ['chat']), [
    { type: 'toc', label: 'Contents' },
    { type: 'chat', label: 'Chat' },
  ]);
});

test('sideSwitchShown needs a chosen block and a page that is not wide', () => {
  assert.equal(sideSwitchShown({ block: 'toc' }, {}), true);
  assert.equal(sideSwitchShown({ block: 'toc' }, { wide: true }), false);
  assert.equal(sideSwitchShown({ block: null }, {}), false);
  assert.equal(sideSwitchShown(null, {}), false);
});
