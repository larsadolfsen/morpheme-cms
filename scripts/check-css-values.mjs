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
// The shadow rules read the theme and the editor only, never a site's content (owner, 21 Nov 2026: "You are not testing the site, you are testing the theme").
const themeScope = (f) => /^(theme|src|pages|defaults)\//.test(f);
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

// Shadows are the levels' (spec 2026-11-20-elevation-design.md): a box-shadow or drop-shadow that has an offset or a blur is a level token
// (--mo-sys-elevation-levelN-shadow or -rest-shadow) or a part's --mo-comp-* variable with a level token as its fallback. Insets, spread-only
// rings and outlines are lines, not elevation, and pass. The level definitions (tokens/ui/ref.css, tokens/material/ref.css) are exempt.
const levelDefinitions = /^theme\/styles\/tokens\/(ui|material)\/ref\.css$/;
const level = /var\(--mo-sys-elevation-level(\d)-(?:rest-)?shadow\)/;
/** A shadow list's problem, or null: the nearest level is named in the message. */
function shadowProblem(value) {
  const v = value.trim().replace(/;$/, '');
  if (/^(none|inherit|initial|unset|revert)$/.test(v)) return null;
  // A part's variable whose fallback is a level token, or a level token itself.
  if (level.test(v) || /^var\(--mo-comp-[a-z0-9-]+\s*,\s*var\(--mo-sys-elevation-level\d-(?:rest-)?shadow\)\)$/.test(v)) return null;
  // Split the list at top-level commas, check each shadow.
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < v.length; i++) {
    if (v[i] === '(') depth++;
    else if (v[i] === ')') depth--;
    else if (v[i] === ',' && depth === 0) {
      parts.push(v.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(v.slice(start));
  for (const raw of parts) {
    const part = raw.trim();
    if (!part || /^inset\b/.test(part) || level.test(part) || /^var\(--mo-comp-[a-z0-9-]+\s*,\s*var\(--mo-sys-elevation/.test(part))
      continue;
    // Colours are not lengths: take the lengths before the colour only.
    const lengths = part
      .replace(/(?:rgba?|hsla?|color-mix|oklch|oklab|lab|lch)\((?:[^()]|\([^()]*\))*\)/g, 'C')
      .replace(/var\((?:[^()]|\([^()]*\))*\)/g, 'C');
    const nums = (lengths.match(/-?\d*\.?\d+(?:px|rem|em)?(?![\w-])/g) ?? []).filter((n) => n !== 'C');
    const isZero = (n) => parseFloat(n) === 0;
    const [x, y, blur] = nums;
    if (x === undefined) continue; // no lengths (a variable alone): not a drawn shadow
    if (isZero(x) && isZero(y ?? '0') && (blur === undefined || isZero(blur))) continue; // a ring or an empty list
    const size = Math.max(Math.abs(parseFloat(y ?? '0')), parseFloat(blur ?? '0'));
    const dp = /rem|em/.test(y ?? blur ?? '') ? size * 16 : size;
    const near = dp <= 2 ? 1 : dp <= 6 ? 2 : 3;
    return `a hand-written shadow: use the class mo-elevated-${near} or var(--mo-sys-elevation-level${near}-shadow)`;
  }
  return null;
}
for (const file of [...cssFiles, ...classFiles].filter(themeScope)) {
  if (levelDefinitions.test(file)) continue;
  const raw = readFileSync(root + file, 'utf8');
  const src = raw.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  if (file.endsWith('.css')) {
    // box-shadow and filter: drop-shadow(), the value to the semicolon (a list can span lines).
    for (const m of src.matchAll(/(?<![\w-])(box-shadow|filter)\s*:\s*([^;{}]+)/g)) {
      const [, prop, value] = m;
      const line = src.slice(0, m.index).split('\n').length;
      let shadows = value;
      if (prop === 'filter') {
        const drops = [...value.matchAll(/drop-shadow\(((?:[^()]|\([^()]*\))*)\)/g)].map((d) => d[1]);
        if (!drops.length) continue;
        shadows = drops.join(',');
      }
      const why = shadowProblem(shadows);
      if (why) add(file, line, why, `${prop}: ${value.trim().replace(/\s+/g, ' ')}`);
    }
  } else {
    for (const m of src.matchAll(/boxShadow\s*:\s*(['"`])((?:(?!\1).)*)\1/g)) {
      const line = src.slice(0, m.index).split('\n').length;
      const why = shadowProblem(m[2]);
      if (why) add(file, line, why, `boxShadow: ${m[2]}`);
    }
  }
}

// An elevation class on an element that has a part class: the class would win the cascade and freeze the part's own level for every state.
const elevationClass = /\bmo-elevat(?:ion|ed)-[0-3]\b/;
const partClass =
  /\bmo-(?:button|icon-button|fab|extended-fab|fab-menu|chip|card|list|list-item|menu|menu-item|dialog|bottom-sheet|side-sheet|top-app-bar|toolbar|navigation-bar|navigation-rail|navigation-drawer|tabs?|search|search-bar|search-view|snackbar|tooltip|switch|slider|checkbox|radio|text-field|badge|date-picker|time-picker|segmented-button|button-group|split-button|carousel)(?:__[a-z0-9-]+|--[a-z0-9-]+)?\b/;
for (const file of [...cssFiles, ...classFiles].filter(themeScope)) {
  const lines = readFileSync(root + file, 'utf8').split('\n');
  lines.forEach((l, i) => {
    for (const m of l.matchAll(/(?:class(?:Name)?\s*=\s*|clsx\(|cx\()\s*(?:\{\s*)?(['"`])([^'"`]*)\1/g)) {
      const value = m[2];
      if (elevationClass.test(value) && partClass.test(value))
        add(
          file,
          i + 1,
          "an elevation class on an M3 part: a part has its own level for every state; set the part's --mo-comp-* token instead",
          value,
        );
    }
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
