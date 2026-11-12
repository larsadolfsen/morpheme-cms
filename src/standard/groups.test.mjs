// Every block offered under Insert has a category (its `group`), and every category has its name in both languages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const groups = [
  ...read('../blocks.ts')
    .match(/export const blockGroups: BlockGroup\[\] = \[([^\]]*)\]/)[1]
    .matchAll(/'(\w+)'/g),
].map((m) => m[1]);
const folders = readdirSync(new URL('.', import.meta.url), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(new URL(`./${d.name}/index.tsx`, import.meta.url)))
  .map((d) => d.name);
const groupOf = (src) => /^\s*group: '(\w+)',/m.exec(src)?.[1];

test('there are a few categories', () => {
  assert.ok(groups.length >= 2 && groups.length <= 7, groups.join());
});

test('every standard block has a category', () => {
  assert.ok(folders.length > 0);
  for (const f of folders) assert.ok(groups.includes(groupOf(read(`./${f}/index.tsx`))), `src/standard/${f}/index.tsx has no valid group`);
});

test('the picture and HTML blocks have a category', () => {
  assert.ok(groups.includes(groupOf(read('../BlockDialog.tsx').split('const picture: SiteBlock')[1])), 'picture');
  assert.ok(groups.includes(groupOf(read('../blocks.ts').split('export const htmlBlock')[1])), 'HTML');
});

test('every category is named in each language, and each block has a short description', () => {
  for (const lang of ['en-US', 'da-DK']) {
    const names = read(`../i18n/${lang}/blockSettings.ts`).match(/groups: \{([^}]*)\}/)[1];
    for (const g of groups) assert.match(names, new RegExp(`\\b${g}: '[^']+'`), `${lang}: ${g}`);
    const hints = [...read(`../i18n/${lang}/blocks.ts`).matchAll(/^ {4}hint: '([^']*)',$/gm)].map((m) => m[1]);
    for (const h of hints.slice(0, folders.length + 2)) assert.ok(h.split(/\s+/).length <= 7, `${lang}: "${h}" is too long`);
  }
});
