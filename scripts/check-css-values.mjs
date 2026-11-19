// Shape and type values come from the Material 3 tokens, not from a literal: a corner is a step of the corner scale (--mo-shape-*, or a
// part's variable that maps to one), a text's size, line height and tracking are a step of the type scale (--mo-sys-typescale-*-size, -line-height,
// -tracking). Fails on a literal radius, font size, line height or letter spacing in the theme's and the editor's CSS, and on a custom property that is used
// without a fallback and set nowhere. Run by npm run check. Colours are checked by check-editor-colors.mjs; motion is not checked.
// A deliberate exception is an entry of scripts/check-css-values.allow.mjs with its reason (the same mechanism as check-colors.mjs).
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { allow } from './check-css-values.allow.mjs';

const root = new URL('../', import.meta.url).pathname;
const tracked = execSync('git ls-files', { cwd: root, encoding: 'utf8' }).trim().split('\n');
const inScope = (f) => /^(theme|src|pages|defaults|starter|demo|site)\//.test(f);
const cssFiles = tracked.filter((f) => f.endsWith('.css') && inScope(f));
const classFiles = tracked.filter((f) => /\.(tsx|astro|ts)$/.test(f) && inScope(f) && !/\.test\./.test(f));

const problems = [];
const add = (file, n, what, text) => {
  if (allow.some((a) => a.file.test(file) && a.line.test(text))) return;
  problems.push(`${file}:${n}: ${what} (${text})`);
};

const length = /(?<![\w.-])-?\d*\.?\d+(?:px|rem|em)\b/;
for (const file of cssFiles) {
  const src = readFileSync(root + file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/url\("data:[^"]*"\)/g, 'url()');
  src.split('\n').forEach((raw, i) => {
    const m = raw.match(/^\s*([a-z-]+)\s*:\s*([^;{}]+);?\s*$/);
    if (!m) return;
    const [, prop, value] = m;
    const bare = value.replace(/var\((?:[^()]|\([^()]*\))*\)/g, 'V');
    const text = `${prop}: ${value.trim()}`;
    const isRadius =
      /^(border-(?:(?:top|bottom|start|end)-(?:left|right|start|end)-)?radius)$/.test(prop) || /^--[a-z0-9-]*radius$/.test(prop);
    if (/^--mo-shape-/.test(prop)) return; // the scale itself
    if (isRadius && length.test(bare)) add(file, i + 1, "a literal corner: use --mo-shape-* or the part's radius variable", text);
    else if (
      /^(font-size|line-height|letter-spacing)$/.test(prop) &&
      (length.test(bare) || (prop === 'line-height' && /^[\d.]+$/.test(bare.trim()) && !['0', '1'].includes(bare.trim())))
    )
      add(file, i + 1, 'a literal type value: use --mo-sys-typescale-<role>-size, -line-height, -tracking', text);
  });
}

// A custom property used without a fallback that nothing sets (the colour roles are written into <head> from src/data/colors.json).
const defined = new Set();
const used = [];
for (const file of [...cssFiles, ...classFiles]) {
  const src = readFileSync(root + file, 'utf8');
  for (const m of src.matchAll(/(--[a-zA-Z0-9-]+)\s*:/g)) defined.add(m[1]);
  for (const m of src.matchAll(/['"`](--[a-zA-Z0-9-]+)['"`]/g)) defined.add(m[1]);
  src.split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/var\(\s*(--[a-zA-Z0-9-]+)\s*\)/g)) used.push([file, i + 1, m[1]]);
  });
}
const optional = [
  [/^--mo-/, 'colour roles and state layers: written into <head> from the colours'],
  [/pressed-radius$/, 'optional: no pressed corner change when unset (buttons.css, header)'],
];
for (const [file, n, name] of used)
  if (!defined.has(name) && !optional.some(([re]) => re.test(name)) && /\.(css|tsx|astro)$/.test(file))
    problems.push(`${file}:${n}: ${name} is used and set nowhere`);

if (problems.length) {
  console.error(`${problems.length} shape and type values outside the M3 tokens:\n${problems.join('\n')}`);
  process.exit(1);
}
console.log("The theme's and the editor's corners and type come from the M3 tokens.");
