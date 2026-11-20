// The layout classes (layout.css) set exactly the declarations of docs/theme-layout-classes.md: layout only, logical properties, tokens, names that start with mo-.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';

const root = postcss.parse(readFileSync(new URL('./layout.css', import.meta.url), 'utf8'));

/** The declarations of each class, `{ 'mo-row': ['display: flex', …] }`, media rules included under the class they set. */
const classes = {};
root.walkRules((rule) => {
  for (const sel of rule.selectors) {
    assert.match(sel, /^\.mo-[a-z0-9-]+$/, `${sel}: every selector is one mo- class`);
    const list = (classes[sel.slice(1)] ??= []);
    rule.each((d) => d.type === 'decl' && list.push(`${d.prop}: ${d.value}`));
  }
});

const EXPECTED = {
  'mo-row': ['display: flex', 'align-items: center', 'gap: var(--mo-comp-row-gap)'],
  'mo-row-wrap': ['flex-wrap: wrap'],
  'mo-row-start': ['align-items: flex-start'],
  'mo-row-end': ['justify-content: flex-end'],
  'mo-row-between': ['justify-content: space-between'],
  'mo-stack': ['display: flex', 'flex-direction: column', 'gap: var(--mo-comp-stack-gap)'],
  'mo-grid': [
    'display: grid',
    'gap: var(--mo-comp-grid-gap)',
    'grid-template-columns: repeat(var(--mo-comp-grid-columns, 1), minmax(0, 1fr))',
  ],
  'mo-grid-2': ['--mo-comp-grid-columns: 1', '--mo-comp-grid-columns: 2'],
  'mo-grid-3': ['--mo-comp-grid-columns: 1', '--mo-comp-grid-columns: 2', '--mo-comp-grid-columns: 3'],
  'mo-grid-4': ['--mo-comp-grid-columns: 1', '--mo-comp-grid-columns: 2', '--mo-comp-grid-columns: 3', '--mo-comp-grid-columns: 4'],
  'mo-fill': ['flex: 1 1 0%', 'min-inline-size: 0'],
  'mo-keep': ['flex-shrink: 0'],
  'mo-truncate': ['overflow: hidden', 'text-overflow: ellipsis', 'white-space: nowrap'],
  'mo-clamp-2': ['overflow: hidden', 'display: -webkit-box', '-webkit-box-orient: vertical', '-webkit-line-clamp: 2'],
  'mo-center': ['margin-inline: auto', 'max-inline-size: var(--mo-comp-center-measure)'],
  'mo-cover': ['object-fit: cover', 'inline-size: 100%', 'block-size: 100%'],
  'mo-visually-hidden': [
    'position: absolute',
    'inline-size: 1px',
    'block-size: 1px',
    'padding: 0',
    'margin: -1px',
    'overflow: hidden',
    'clip-path: inset(50%)',
    'white-space: nowrap',
    'border-width: 0',
  ],
  'mo-hidden': ['display: none'],
  'mo-contents': ['display: contents'],
};

test('every class sets exactly its declarations', () => {
  assert.deepEqual(Object.keys(classes).sort(), Object.keys(EXPECTED).sort());
  for (const [name, decls] of Object.entries(EXPECTED)) assert.deepEqual([...classes[name]].sort(), [...decls].sort(), name);
});

test('only logical properties, no colour, font or physical size, and tokens named --mo-', () => {
  const physical =
    /^(width|height|min-width|min-height|max-width|max-height|top|right|bottom|left|margin-(top|right|bottom|left)|padding-(top|right|bottom|left)|border-(top|right|bottom|left)(-|$))/;
  const forbidden =
    /^(color|background|border-color|outline|box-shadow|opacity|font|line-height|letter-spacing|text-align|text-transform|border-radius|transition|animation)/;
  root.walkDecls((d) => {
    assert.ok(!physical.test(d.prop), `${d.prop} is physical`);
    assert.ok(!forbidden.test(d.prop), `${d.prop} is colour, shape, type or state`);
    for (const m of d.value.matchAll(/var\((--[a-z0-9-]+)/g)) assert.match(m[1], /^--mo-/, `${d.prop}: ${m[1]}`);
    if (d.prop.startsWith('--')) assert.equal(d.prop, '--mo-comp-grid-columns');
  });
});

test('layout.css imports its own token files, which declare the gaps and the measure on :root', () => {
  const text = readFileSync(new URL('./layout.css', import.meta.url), 'utf8');
  for (const t of ['row', 'stack', 'grid', 'center']) {
    assert.ok(text.includes(`./tokens/layout/comp/${t}.css`), `${t}.css is imported`);
    const tokens = readFileSync(new URL(`./tokens/layout/comp/${t}.css`, import.meta.url), 'utf8');
    assert.match(tokens, new RegExp(`--mo-comp-${t}-(gap|measure):`), `${t}.css declares its token`);
    assert.match(tokens, /:root\s*\{/);
  }
});
