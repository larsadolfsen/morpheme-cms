// Density (docs/superpowers/specs/2026-11-13-density-design.md, PR 5): a part that ignores the density step fails. The theme's parts are
// listed here with the variable of their group (--mo-density for data-heavy parts, --mo-density-layout for layout and controls); each
// must write its height or its vertical padding with it, as calc(<default> + var(--mo-density…) * var(--mo-density-step)). Three more
// rules: a focused single-task part (menu, dialog, snackbar) never reads --mo-density or --mo-density-layout (never denser than
// Medium); a horizontal padding never reads density (owner rule: only height and vertical padding move); and a text size never does
// (M3: "Text size shouldn't change as the container size scales"). Only base.css, global.css and editor.css set the person's or the
// theme's step. The browser side (the sizes at each step, a target kept, the page editing area unchanged) is in check:screens.
// Run by npm run check. A deliberate exception is an entry of EXEMPT with its reason.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** The parts that must read density: where their rule is, and which variable of the three groups they read. */
export const PARTS = [
  { name: 'button', file: 'theme/styles/ui.css', selector: '.button', reads: '--mo-density-layout' },
  { name: 'chip', file: 'theme/styles/ui.css', selector: '.chip', reads: '--mo-density-layout' },
  { name: 'segmented button', file: 'theme/styles/ui.css', selector: '.segmented-button-segment', reads: '--mo-density-layout' },
  { name: 'text field', file: 'theme/styles/ui.css', selector: '.text-field', reads: '--mo-density-layout' },
  { name: 'list item', file: 'theme/styles/ui.css', selector: '.list-item-container', reads: '--mo-density' },
  { name: 'setting row', file: 'theme/styles/ui.css', selector: '.setting-list > .setting-row', reads: '--mo-density-layout' },
  { name: 'table cell', file: 'theme/styles/blocks.css', selector: '.block-table-grid :is(th, td)', reads: '--mo-density' },
  { name: 'table header', file: 'theme/styles/blocks.css', selector: '.block-table-grid thead th', reads: '--mo-density' },
];

/** Focused single-task parts: never denser than Medium, so they read neither --mo-density nor --mo-density-layout. */
export const FOCUSED = [
  { name: 'menu item', file: 'theme/styles/ui.css', selector: '.menu-item' },
  { name: 'snackbar', file: 'theme/styles/ui.css', selector: '.snackbar' },
];

/** Files that may set the steps themselves. */
const SETS_STEP = /^(theme\/styles\/(base|global)\.css|src\/editor\.css)$/;

/** A deliberate exception: `${file}|${name}` with its reason. */
export const EXEMPT = new Map();

/** The text of every rule block whose selector list contains `selector` exactly. */
export function blocksOf(css, selector) {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (let m; (m = re.exec(src));)
    if (
      m[1]
        .split(/,(?![^(]*\))/)
        .map((s) => s.trim())
        .includes(selector)
    )
      out.push(m[2]);
  return out;
}

/** The problems in `files` (path to text). */
export function findProblems(files) {
  const problems = [];
  for (const p of PARTS) {
    if (EXEMPT.has(`${p.file}|${p.name}`)) continue;
    const blocks = blocksOf(files[p.file] ?? '', p.selector);
    if (!blocks.length) problems.push(`${p.file}: no rule for ${p.name} (${p.selector}): update scripts/check-density.mjs`);
    else if (!blocks.some((b) => b.includes(`var(${p.reads})`) && b.includes('var(--mo-density-step)')))
      problems.push(
        `${p.file}: ${p.name} (${p.selector}) ignores density: write its height or vertical padding with var(${p.reads}) * var(--mo-density-step)`,
      );
  }
  for (const p of FOCUSED) {
    for (const b of blocksOf(files[p.file] ?? '', p.selector))
      if (/var\(--mo-density(-layout)?\)/.test(b))
        problems.push(
          `${p.file}: ${p.name} (${p.selector}) is a focused part: it may read --mo-density-focus, never --mo-density or --mo-density-layout`,
        );
  }
  for (const [file, css] of Object.entries(files)) {
    const src = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
    src.split('\n').forEach((line, i) => {
      const m = line.match(/^\s*([a-z-]+)\s*:\s*(.*)$/);
      if (!m) return;
      const [, prop, value] = m;
      if (/^--mo-density-user$/.test(prop) && !SETS_STEP.test(file))
        problems.push(`${file}:${i + 1}: only base.css, global.css and editor.css set the person's step (${prop})`);
      if (/^(padding-inline|padding-left|padding-right|padding-inline-start|padding-inline-end)$/.test(prop) && /--mo-density/.test(value))
        problems.push(`${file}:${i + 1}: horizontal padding never follows density (${prop}: ${value.trim()})`);
      if (/^(font-size|line-height|letter-spacing)$/.test(prop) && /--mo-density/.test(value))
        problems.push(`${file}:${i + 1}: text size never follows density (${prop}: ${value.trim()})`);
    });
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = new URL('../', import.meta.url);
  const files = {};
  for (const f of ['theme/styles/ui.css', 'theme/styles/blocks.css', 'theme/styles/base.css', 'theme/styles/global.css', 'src/editor.css'])
    files[f] = readFileSync(new URL(f, root), 'utf8');
  const problems = findProblems(files);
  if (problems.length) {
    console.error(problems.join('\n'));
    console.error(
      `\n${problems.length} problem(s): a part must follow the density step (docs/superpowers/specs/2026-11-13-density-design.md).`,
    );
    process.exit(1);
  }
  console.log('Every listed part follows the density step; focused parts, horizontal padding and text size ignore it.');
}
