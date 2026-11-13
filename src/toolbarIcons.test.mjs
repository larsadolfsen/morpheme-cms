// The text toolbar's icons: one colour rule from the theme's icon button tokens and one icon provider (Phosphor).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(new URL(file, import.meta.url), 'utf8');
const editor = read('./MarkdownEditor.tsx');
const css = read('./editor.css');
const ui = read('./ui.tsx');

// The rules of the bar, up to the next block of rules that is not theirs.
const toolbarCss = css
  .split('\n\n')
  .filter((block) => /editor-tools|toolbar-menu-button/.test(block.replace(/\/\*[\s\S]*?\*\//g, '')))
  .join('\n\n');

test('the bar uses no hard-coded colour', () => {
  const code = toolbarCss.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(code, /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
  assert.doesNotMatch(code, /var\(--mo-primary\)/);
});

test('a resting tool is the theme icon button, its colours come from the theme (no rule of the bar sets them), and the bar buttons are 44 dp with a 20 dp icon', () => {
  assert.doesNotMatch(toolbarCss, /\.editor-tools button/);
  assert.match(ui, /'--icon-button-size': '2\.75rem', '--icon-button-icon-size': '1\.25rem'/);
});

test('a tool with a menu rests in the same colour as the other tools, not the text button accent', () => {
  assert.match(ui, /className="toolbar-menu-button"/);
  assert.match(css, /\.toolbar-menu-button[^{]*\{[^}]*color: var\(--icon-button-standard-text,/);
});

test('every icon of the text toolbar is Phosphor, or one of the text sizes drawn on its grid', () => {
  const imports = [...editor.matchAll(/^import \w+ from '([^']+\.svg\?raw)';/gm)].map((m) => m[1]);
  assert.ok(imports.length >= 6);
  for (const file of imports) {
    assert.match(
      file,
      /^@phosphor-icons\/core\/assets\/(regular|bold)\/|^\.\/icons\/text-(t-(small|medium|large)|h-plain)\.svg\?raw$/,
      file,
    );
  }
  for (const name of ['t-small', 't-medium', 't-large', 'h-plain']) {
    const svg = read(`./icons/text-${name}.svg`);
    assert.match(svg, /viewBox="0 0 256 256"/);
    assert.doesNotMatch(svg, /#[0-9a-f]{3,8}\b|fill="(?!currentColor|none)/i);
  }
  assert.doesNotMatch(editor, /from 'lucide-react'|from '@mui\/|material-symbols/);
});
