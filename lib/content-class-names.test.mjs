import assert from 'node:assert/strict';
import { test } from 'node:test';
import { migrateClassNamesFile, migrateClassNamesJson, migrateClassNamesPath, revertClassNamesJson } from './content-class-names.mjs';

const OLD = ['body-small', 'body-medium', 'body-large', 'label-medium', 'color-accent', 'color-muted'];
const NEW = [
  'mo-type-body-small',
  'mo-type-body-medium',
  'mo-type-body-large',
  'mo-type-label-medium',
  'mo-has-accent-color',
  'mo-has-muted-color',
];
const html = (names) => names.map((n, i) => `<p class="${n}">${OLD[i]}</p>`).join('\n') + '\n';

test('a JSON file is parsed and written again with two spaces and a line ending; only class attributes change', () => {
  const value = (names) => ({ title: 'body-small', text: html(names), list: [{ t: html(names) }], n: 1 });
  const before = JSON.stringify(value(OLD), null, 2) + '\n';
  const after = migrateClassNamesJson(before);
  const expected = JSON.stringify({ ...value(NEW), title: 'body-small', list: [{ t: html(NEW) }] }, null, 2) + '\n';
  assert.equal(after, expected);
  assert.equal(migrateClassNamesJson(after), after);
  assert.equal(revertClassNamesJson(after), before);
});

test('a JSON file with nothing to rewrite, or that is not JSON, is returned as it is', () => {
  const compact = '{"a":"body-small"}';
  assert.equal(migrateClassNamesJson(compact), compact);
  const broken = '{ "a": "<p class=\\"body-small\\">" ';
  assert.equal(migrateClassNamesJson(broken), broken);
});

test('a markdown file is rewritten in its body, in front matter markdown and in a block props attribute', () => {
  const props = (names) =>
    `<div data-block="text" data-props="${JSON.stringify({ text: html(names) })
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')}"></div>`;
  const file = (names) =>
    `---\ntitle: body-small\nbio: "<span class=\\"${names[4]}\\">x</span>"\n---\n\n${html(names)}\n${props(names)}\n\`<p class="${names[0]}">\`\n`;
  const after = migrateClassNamesFile(file(OLD));
  assert.equal(after, file(NEW).replace(`\`<p class="${NEW[0]}">\``, `\`<p class="${OLD[0]}">\``));
  assert.equal(migrateClassNamesFile(after), after);
});

test('files are chosen by their extension', () => {
  assert.equal(migrateClassNamesPath('a.css', '<p class="body-small">'), '<p class="body-small">');
  assert.equal(migrateClassNamesPath('a.md', '<p class="body-small">'), '<p class="mo-type-body-small">');
});
