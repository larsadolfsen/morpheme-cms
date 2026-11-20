// The setting "Columns" (columns.ts): every block that draws its rows as a list has it, on by default, with its texts in both languages, and its
// view and the theme's drawings carry it to the CSS as data-columns="one".
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const blocks = ['list', 'expand', 'accordion', 'posts', 'testimonials'];

test('List, List - Expand, Accordion, Blog posts and Testimonials have the setting Columns, and their views carry it', () => {
  for (const name of blocks) {
    assert.match(read(`./${name}/index.tsx`), /columnsField\(/, `${name} has no Columns field`);
    const views = [`./${name}/view.ts`, `./${name}/load.ts`].map((f) => {
      try {
        return read(f);
      } catch {
        return '';
      }
    });
    assert.ok(
      views.some((v) => /columnsOf\(/.test(v)),
      `${name}'s view does not carry Columns`,
    );
  }
});

test('the setting is on when a block has none, and its texts are in both languages', () => {
  const field = read('./columns.ts');
  assert.match(field, /default: true/);
  assert.match(field, /missing: true/);
  assert.match(field, /props\.columns === false \? \{ oneColumn: true \}/);
  for (const lang of ['en-US', 'da-DK']) {
    const text = read(`../i18n/${lang}/blocks.ts`);
    assert.match(text, /columns: \{\s*label: '[^']+',\s*toggle: \[[^\]]*\][^\n]*\n\s*about: '[^']+',/, `${lang}: the texts of Columns`);
  }
});

test('the theme draws the setting as data-columns="one" on the list, and the CSS keys on it', () => {
  const theme = '../../theme';
  for (const f of ['blocks/list/Rows.tsx', 'blocks/accordion/Accordion.tsx', 'blocks/testimonials/List.tsx', 'blocks/posts/View.tsx'])
    assert.match(read(`${theme}/${f}`), /data-columns=\{/, `${f} does not draw data-columns`);
  const css = read(`${theme}/styles/blocks/text-section.css`);
  assert.match(css, /\[data-columns='one'\]/);
  assert.match(css, /:not\(\[data-columns='one'\]\)/);
});
