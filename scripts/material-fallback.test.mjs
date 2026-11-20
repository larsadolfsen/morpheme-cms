// Checks that Material's CSS chain (theme/styles/: base, ui and its parts, the blocks, the site shell's three files, global and its parts) sits in the fallback layer, so a theme wins.
// Reads the files with postcss; no browser, no build. Exposes nothing; run by node --test.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { UI_PART_FILES, OTHER_BASE_FILES, MATERIAL_FILES } from '../theme/styles/files.mjs';

// The files come from theme/styles/files.mjs, so a part moved into a file of its own is read too.
const names = [
  ...new Set(
    ['base', 'ui', ...UI_PART_FILES, ...OTHER_BASE_FILES, ...(MATERIAL_FILES.length ? ['global', ...MATERIAL_FILES] : ['global'])].map(
      (f) => f.replace(/\.css$/, ''),
    ),
  ),
];
const roots = Object.fromEntries(
  names.map((name) => [name, postcss.parse(readFileSync(new URL(`../theme/styles/${name}.css`, import.meta.url), 'utf8'))]),
);

const customOnly = (rule) => rule.nodes.every((node) => node.type === 'comment' || (node.type === 'decl' && node.prop.startsWith('--')));

// Top-level rules, also inside top-level @media and @supports, outside every layer.
function unlayeredRules(root) {
  const found = [];
  root.each((node) => {
    if (node.type === 'rule') found.push(node);
    else if (node.type === 'atrule' && ['media', 'supports'].includes(node.name)) {
      node.each((child) => child.type === 'rule' && found.push(child));
    }
  });
  return found;
}

test('no unlayered rule sets more than custom properties', () => {
  for (const name of names) {
    for (const rule of unlayeredRules(roots[name]).filter((rule) => !customOnly(rule))) {
      assert.fail(`${name}.css line ${rule.source.start.line}: "${rule.selector}" sets more than custom properties outside a layer`);
    }
  }
});

test('base.css orders the layers with fallback last', () => {
  const orders = [];
  roots.base.walkAtRules('layer', (atRule) => atRule.nodes === undefined && orders.push(atRule.params));
  assert.ok(orders.length > 0, 'base.css has no layer order statement');
  const names = orders[0].split(',').map((name) => name.trim());
  assert.equal(names.at(-1), 'fallback');
});

test('the CSS chain has no !important', () => {
  for (const name of names) {
    roots[name].walkDecls((decl) => {
      // The one exception, with its reason: the reset's [hidden] rule keeps an element with the hidden attribute hidden whatever display a rule in a later
      // layer gives it (Tailwind's preflight had it, and a site's own rules would otherwise show what the author hid).
      if (name === 'reset' && decl.parent.selector?.startsWith('[hidden]')) return;
      assert.ok(!decl.important, `${name}.css line ${decl.source.start.line}: "${decl.prop}" is !important`);
    });
  }
});
