// The text toolbar's icons: one colour rule from the theme's icon button tokens and one icon provider (Phosphor).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(new URL(file, import.meta.url), 'utf8');
const editor = read('./MarkdownEditor.tsx');
const css = read('./editor.css');
const ui = read('./ui.tsx');

// The rules of the toolbar and the row over the selection, up to the next block of rules that is not theirs.
const toolbarCss = css
  .split('\n\n')
  .filter((block) => /editor-selection-(menu|sheet)|toolbar-menu-button/.test(block.replace(/\/\*[\s\S]*?\*\//g, '')))
  .join('\n\n');

test('the toolbar and its sheet use no hard-coded colour', () => {
  const code = toolbarCss.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(code, /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
});

test('a resting tool is the standard icon button colour, a tool that is on its selected colour', () => {
  assert.match(toolbarCss, /\.editor-selection-menu button \{[^}]*color: var\(--icon-button-standard-text,/);
  assert.match(toolbarCss, /aria-pressed='true'\] \{[^}]*color: var\(--icon-button-standard-selected-text,/);
  assert.doesNotMatch(toolbarCss, /var\(--mo-primary\)/);
});

test('a tool with a menu rests in the same colour as the other tools, not the text button accent', () => {
  assert.match(ui, /className="toolbar-menu-button"/);
  assert.match(css, /\.toolbar-menu-button[^{]*\{[^}]*color: var\(--icon-button-standard-text,/);
});

test('every icon of the text toolbar is Phosphor, or one of the text sizes drawn on its grid', () => {
  const imports = [...editor.matchAll(/^import \w+ from '([^']+\.svg\?raw)';/gm)].map((m) => m[1]);
  assert.ok(imports.length > 10);
  for (const file of imports) {
    assert.match(file, /^@phosphor-icons\/core\/assets\/(regular|bold)\/|^\.\/icons\/text-t-(small|medium|large)\.svg\?raw$/, file);
  }
  for (const size of ['small', 'medium', 'large']) {
    const svg = read(`./icons/text-t-${size}.svg`);
    assert.match(svg, /viewBox="0 0 256 256"/);
    assert.doesNotMatch(svg, /#[0-9a-f]{3,8}\b|fill="(?!currentColor|none)/i);
  }
  assert.doesNotMatch(editor, /from 'lucide-react'|from '@mui\/|material-symbols/);
});
