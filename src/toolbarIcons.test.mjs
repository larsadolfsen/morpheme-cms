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
  .filter((block) => /mo-editor-tools|mo-toolbar__menu-button/.test(block.replace(/\/\*[\s\S]*?\*\//g, '')))
  .join('\n\n');

test('the bar uses no hard-coded colour', () => {
  const code = toolbarCss.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(code, /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i);
  assert.doesNotMatch(code, /var\(--mo-sys-color-primary\)/);
});

test('a resting tool is the theme icon button, its colours come from the theme (no rule of the bar sets them), and the bar sets no size or token of its own (M3 small icon button, docked toolbar)', () => {
  assert.doesNotMatch(toolbarCss, /\.mo-editor-tools button/);
  assert.doesNotMatch(ui, /--mo-comp-icon-button-small-container-height/);
  assert.doesNotMatch(ui, /closeToolbar|toolbarSize\b/);
});

test('a tool with a menu rests in the same colour as the other tools, not the text button accent', () => {
  assert.match(ui, /className="mo-toolbar__menu-button"/);
  assert.match(css, /\.mo-toolbar__menu-button[^{]*\{[^}]*color: var\(--mo-comp-icon-button-standard-icon-color,/);
});

test('every icon of the text toolbar is a Material Symbols file, or one of the text sizes drawn on its grid', () => {
  const imports = [...editor.matchAll(/^import \w+ from '([^']+\.svg\?raw)';/gm)].map((m) => m[1]);
  // Settings and edit icons are Material Symbols from meaningIcons.ts (one icon per meaning), not raw imports here.
  assert.ok(imports.length >= 5);
  for (const file of imports) {
    assert.match(
      file,
      /^@material-symbols\/svg-400\/outlined\/[a-z0-9_]+\.svg\?raw$|^\.\/icons\/text-(t-(small|medium|large)|h-plain)\.svg\?raw$/,
      file,
    );
  }
  for (const name of ['t-small', 't-medium', 't-large', 'h-plain']) {
    const svg = read(`./icons/text-${name}.svg`);
    assert.match(svg, /viewBox="0 0 256 256"/);
    assert.doesNotMatch(svg, /#[0-9a-f]{3,8}\b|fill="(?!currentColor|none)/i);
  }
  assert.doesNotMatch(editor, new RegExp(['from .luc', 'ide-react.|from .@mui/|@phosphor-icons'].join('')));
});
