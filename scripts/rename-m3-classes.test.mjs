import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { classList, renameText } from './rename-m3-classes.mjs';

const classes = {
  'mo-button__text': 'mo-is-text',
  'mo-chip__set': 'mo-chip-set',
  'mo-bottom-sheet': ['mo-sheet', 'mo-is-bottom'],
  'mo-bottom-sheet__container': 'mo-sheet__container',
  'mo-bottom-sheet__header': 'mo-sheet__header',
  'mo-bottom-sheet__fit': 'mo-sheet__fit',
  'mo-side-sheet': ['mo-sheet', 'mo-is-side'],
  'mo-side-sheet__header': 'mo-sheet__header',
  'mo-button__small': null,
};
const props = { Button: { size: { medium: 'small', small: null } } };
const run = (file, text) => renameText(file, text, { classes, props });

test('a stylesheet keeps one class of specificity', () => {
  assert.equal(run('a.css', '.mo-button__text { color: red; }').text, ':where(.mo-button).mo-is-text { color: red; }');
  assert.equal(run('a.css', '.mo-button.mo-button__text:hover {}').text, '.mo-button.mo-is-text:hover {}');
  assert.equal(run('a.css', '.mo-chip__set > .x {}').text, '.mo-chip-set > .x {}');
});

test('the bottom and the side sheet merge, scoped by their kind', () => {
  assert.equal(run('a.css', '.mo-bottom-sheet {}').text, ':where(.mo-sheet).mo-is-bottom {}');
  assert.equal(run('a.css', '.mo-bottom-sheet__container {}').text, ':where(.mo-sheet__container).mo-is-bottom {}');
  assert.equal(run('a.css', '.mo-bottom-sheet__header {}').text, ':where(.mo-is-bottom) .mo-sheet__header {}');
  assert.equal(run('a.css', '.mo-side-sheet__header {}').text, ':where(.mo-is-side) .mo-sheet__header {}');
  assert.equal(run('a.css', '.mo-bottom-sheet__fit {}').text, '.mo-sheet__fit {}');
});

test('a class list gets the new classes, once each', () => {
  assert.equal(run('a.tsx', `const c = 'mo-bottom-sheet';`).text, `const c = 'mo-sheet mo-is-bottom';`);
  assert.equal(run('a.tsx', `const c = 'mo-bottom-sheet__container mo-is-bottom';`).text, `const c = 'mo-sheet__container mo-is-bottom';`);
  assert.equal(classList('mo-bottom-sheet__container', classes), 'mo-sheet__container mo-is-bottom');
  assert.equal(run('a.tsx', `el.querySelector('.mo-button__text')`).text, `el.querySelector('.mo-button.mo-is-text')`);
});

test('only whole names are matched', () => {
  assert.equal(run('a.tsx', `'mo-bottom-sheet__fit-x mo-bottom-sheets'`).text, `'mo-bottom-sheet__fit-x mo-bottom-sheets'`);
});

test('a name the map drops, and a name built from parts, are listed, not changed', () => {
  const dropped = run('a.tsx', `'mo-button__small'`);
  assert.equal(dropped.text, `'mo-button__small'`);
  assert.match(dropped.manual[0], /dropped/);
  assert.match(run('a.tsx', 'const c = `mo-button__${kind}`;').manual[0], /built from parts/);
});

test('props change in one pass and only as a literal on the component', () => {
  assert.equal(run('a.tsx', '<Button size="medium">a</Button>').text, '<Button size="small">a</Button>');
  assert.equal(run('a.tsx', '<Button size="small">a</Button>').text, '<Button>a</Button>');
  assert.equal(run('a.tsx', `<Button kind="text" size={'medium'}>a</Button>`).text, `<Button kind="text" size={'small'}>a</Button>`);
  assert.equal(run('a.tsx', '<Other size="medium" />').text, '<Other size="medium" />');
  assert.match(run('a.tsx', '<Button size={big ? "a" : "b"}>a</Button>').manual[0], /computed/);
});

test("the repository's map renames every class it lists to names that exist in the sources", () => {
  const map = JSON.parse(readFileSync(new URL('./m3-names.json', import.meta.url), 'utf8'));
  for (const [old, now] of Object.entries(map.classes)) {
    const list = classList(old, map.classes);
    assert.equal(list === undefined, false, old);
    if (now !== null) assert.notEqual(list, '', old);
  }
});
