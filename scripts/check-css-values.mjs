// Shape and type values come from the Material 3 tokens, not from a literal: a corner is a step of the corner scale (--mo-shape-*, or a
// part's variable that maps to one), a text's size, line height and tracking are a step of the type scale (--type-*-size, -line-height,
// -tracking). Fails on a literal radius, font size, line height or letter spacing in the theme's and the editor's CSS, on a Tailwind
// text, corner or tracking class that is no step of the scale (text-lg, rounded-md, text-[20px] …), and on a custom property that is used
// without a fallback and set nowhere. Run by npm run check. Colours are checked by check-editor-colors.mjs; motion is not checked.
// A deliberate exception is a line of `allowed` below with its reason.
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const root = new URL('../', import.meta.url).pathname;
const tracked = execSync('git ls-files', { cwd: root, encoding: 'utf8' }).trim().split('\n');
const inScope = (f) => /^(theme|src|pages|defaults|starter|demo|site)\//.test(f);
const cssFiles = tracked.filter((f) => f.endsWith('.css') && inScope(f));
const classFiles = tracked.filter((f) => /\.(tsx|astro|ts)$/.test(f) && inScope(f) && !/\.test\./.test(f));

// [file pattern, text pattern, reason]
const allowed = [
  [
    /base\.css$|blocks\.css$/,
    /^--(radius|radius-small|block-radius|block-radius-small|block-control-radius): /,
    'the fallback corners for a theme that sets no steps (global.css sets the ten steps and maps these to them)',
  ],
  [/global\.css$/, /^--slider-track-inner-radius: 0\.125rem/, "the slider's inner track corner: M3 draws it 2dp"],
  [/base\.css$/, /^border-radius: 6px/, 'the focus ring of every part: M3 draws it to the part, here one round-off for any element'],
  [/base\.css$/, /^border-radius: 0\.3em/, 'inline code: its corners follow the text size, not a step'],
  [
    /global\.css$|ui\.css$/,
    /^border-radius: (2px|0\.1875rem)/,
    "the checkbox's own 2px square corner (M3: 2dp), and the error ring's 3px over it",
  ],
  [/blocks\.css$|ui\.css$/, /^border-radius: calc\(/, 'optical roundness: the container corner minus its padding or border'],
  [
    /ui\.css$/,
    /^--menu-item-radius, calc|^border-radius: var\(--menu-item-radius, calc/,
    'a menu item inside the container: the container corner minus its padding',
  ],
  [
    /editor\.css$/,
    /font-size|line-height|letter-spacing/,
    "the editor's page preview draws the site's own headings and texts at the sizes of the components' classes (docs/editor.md); they move together with the site's blocks",
  ],
  [
    /^src\/.*\.tsx$/,
    /^(text-(lg|xl|4xl)|rounded-md|rounded-\[[0-9.]+(px|rem)\]|text-\[20px\]|leading-\[2[26]px\]|tracking-\[0\.00625rem\]|border-\[[0-9.]+px\])$/,
    "the editor's own chrome: off-scale sizes (18, 20, 36 px text; 6 px, 3 px and 22 px corners; 1.5 and 3 px lines) that move to a step in a pull request that changes how the editor looks (the owner decides)",
  ],
  [
    /blocks\.css$|ui\.css$|global\.css$|base\.css$|components\.css$/,
    /^(font-size|line-height|letter-spacing)\b/,
    'not yet moved to the type scale: tracked for the next pull request of the shape and type sweep',
  ],
];

const problems = [];
const add = (file, n, what, text) => {
  if (allowed.some(([f, t]) => f.test(file) && t.test(text))) return;
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
      add(file, i + 1, 'a literal type value: use --type-<role>-size, -line-height, -tracking', text);
  });
}

// Tailwind classes that are no step of the M3 scales. text-xs/sm/base, rounded/-lg/-xl/-2xl/-full/-none are the scale's own values.
const offScale =
  /(?<![\w-])(?:text-(?:lg|xl|[3-9]xl)|rounded(?:-[tblr]{1,2})?-(?:md|3xl|[4-9]xl|\[(?!inherit\])[^\]]+\])|(?:text|leading|tracking)-\[(?!length:var\(--type|var\(--type)[^\]]+\]|border-\[[0-9.]+(?:px|rem)\])(?![\w-])/g;
for (const file of classFiles) {
  readFileSync(root + file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (/^\s*(\/\/|\*)/.test(line)) return;
      for (const [hit] of line.matchAll(offScale)) add(file, i + 1, 'a Tailwind class that is no step of the M3 scales', hit);
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
  [/^--(tw|color-|font-|breakpoint)/, 'Tailwind'],
  [/pressed-radius$/, 'optional: no pressed corner change when unset (ui.css, header)'],
];
for (const [file, n, name] of used)
  if (!defined.has(name) && !optional.some(([re]) => re.test(name)) && /\.(css|tsx|astro)$/.test(file))
    problems.push(`${file}:${n}: ${name} is used and set nowhere`);

if (problems.length) {
  console.error(`${problems.length} shape and type values outside the M3 tokens:\n${problems.join('\n')}`);
  process.exit(1);
}
console.log("The theme's and the editor's corners and type come from the M3 tokens.");
