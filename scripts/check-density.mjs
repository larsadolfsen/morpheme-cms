// Density (docs/superpowers/specs/2026-11-13-density-design.md, PR 5): a part that ignores the density step fails. The theme's parts are
// listed here; each must write its height or its vertical padding with --mo-sys-density, as calc(<default> + var(--mo-sys-density) *
// var(--mo-sys-density-step)); the one variable goes 0 to -3 (Large went in 0.19.5). Three more
// rules: a part that alerts a person (snackbar, dialog) never reads it (never denser than Medium); a horizontal padding never reads density (owner rule: only height and vertical padding move); and a text size never does
// (M3: "Text size shouldn't change as the container size scales"). Only base.css, global.css and editor.css set the person's or the
// theme's step. The browser side (the sizes at each step, a target kept, the page editing area unchanged) is in check:screens.
// Run by npm run check. A deliberate exception is an entry of EXEMPT with its reason.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { UI_PART_FILES, MATERIAL_FILES } from '../theme/styles/files.mjs';

/** The parts that must read density: where their rule is, and which variable of the three groups they read. */
export const PARTS = [
  { name: 'button', file: 'theme/styles/ui/buttons.css', selector: '.mo-button', reads: '--mo-sys-density' },
  { name: 'chip', file: 'theme/styles/ui/chips.css', selector: '.mo-chip', reads: '--mo-sys-density' },
  {
    name: 'segmented button',
    file: 'theme/styles/ui/button-groups.css',
    selector: '.mo-segmented-button__segment',
    reads: '--mo-sys-density',
  },
  { name: 'text field', file: 'theme/styles/ui/text-field.css', selector: '.mo-text-field', reads: '--mo-sys-density' },
  {
    name: 'choice group row',
    file: 'theme/styles/ui.css',
    selector: '.mo-choice-group__list .mo-list__item-container',
    reads: '--mo-sys-density',
  },
  { name: 'menu item', file: 'theme/styles/ui/menus.css', selector: '.mo-menu__item', reads: '--mo-sys-density' },
  {
    name: 'dropdown option',
    file: 'theme/styles/ui/menus.css',
    selector: '.mo-exposed-dropdown-menu__option',
    reads: '--mo-sys-density',
  },
  { name: 'list item', file: 'theme/styles/ui/list.css', selector: '.mo-list__item-container', reads: '--mo-sys-density' },
  {
    name: 'setting row',
    file: 'theme/styles/ui/switch.css',
    selector: '.mo-setting-list > .mo-setting-row',
    reads: '--mo-sys-density',
  },
  {
    name: 'table cell',
    file: 'theme/styles/blocks/person-facts.css',
    selector: '.mo-block-table__grid :is(th, td)',
    reads: '--mo-sys-density',
  },
  {
    name: 'table header',
    file: 'theme/styles/blocks/person-facts.css',
    selector: '.mo-block-table__grid thead th',
    reads: '--mo-sys-density',
  },
];

/** Parts that alert a person: never denser than Medium, so they do not read --mo-sys-density (M3: not "in components that alert a person of changes, such as snackbars or dialogs"). */
export const FOCUSED = [{ name: 'snackbar', file: 'theme/styles/ui/snackbar.css', selector: '.mo-snackbar' }];

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
    else if (!blocks.some((b) => b.includes(`var(${p.reads})`) && b.includes('var(--mo-sys-density-step)')))
      problems.push(
        `${p.file}: ${p.name} (${p.selector}) ignores density: write its height or vertical padding with var(${p.reads}) * var(--mo-sys-density-step)`,
      );
  }
  for (const p of FOCUSED) {
    for (const b of blocksOf(files[p.file] ?? '', p.selector))
      if (/var\(--mo-sys-density\)/.test(b))
        problems.push(`${p.file}: ${p.name} (${p.selector}) alerts a person: it never reads --mo-sys-density`);
  }
  for (const [file, css] of Object.entries(files)) {
    const src = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
    src.split('\n').forEach((line, i) => {
      const m = line.match(/^\s*([a-z-]+)\s*:\s*(.*)$/);
      if (!m) return;
      const [, prop, value] = m;
      if (/^--mo-sys-density-user$/.test(prop) && !SETS_STEP.test(file))
        problems.push(`${file}:${i + 1}: only base.css, global.css and editor.css set the person's step (${prop})`);
      if (
        /^(padding-inline|padding-left|padding-right|padding-inline-start|padding-inline-end)$/.test(prop) &&
        /--mo-sys-density/.test(value)
      )
        problems.push(`${file}:${i + 1}: horizontal padding never follows density (${prop}: ${value.trim()})`);
      if (/^(font-size|line-height|letter-spacing)$/.test(prop) && /--mo-sys-density/.test(value))
        problems.push(`${file}:${i + 1}: text size never follows density (${prop}: ${value.trim()})`);
    });
  }
  return problems;
}

/** The stylesheets the check reads, each with its token files (theme/styles/tokens/<origin>/, docs/theme-token-files.md): a part's height or
 * padding is often a token (--mo-comp-filled-text-field-container-height) that the rule reads. @param {URL} root */
export function readStyles(root) {
  const files = {};
  // The text field's height token (--mo-comp-filled-text-field-container-height) is in the ui tokens, so text-field.css reads them too.
  const tokenFolder = {
    'ui.css': 'ui',
    'text-field.css': 'ui',
    'list.css': 'ui',
    'person-facts.css': 'blocks',
    'base.css': 'base',
    'global.css': 'material',
  };
  const tokenFiles = (dir) =>
    readdirSync(new URL(dir, root), { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? tokenFiles(`${dir}${e.name}/`) : e.name.endsWith('.css') ? [`${dir}${e.name}`] : [],
    );
  for (const f of [
    'theme/styles/ui.css',
    ...UI_PART_FILES.map((f) => `theme/styles/${f}`),
    'theme/styles/blocks/person-facts.css',
    'theme/styles/base.css',
    'theme/styles/global.css',
    ...MATERIAL_FILES.map((f) => `theme/styles/${f}`),
    'src/editor.css',
  ]) {
    const folder = tokenFolder[f.split('/').pop()];
    const extra = folder ? tokenFiles(`theme/styles/tokens/${folder}/`).map((t) => readFileSync(new URL(t, root), 'utf8')) : [];
    files[f] = [readFileSync(new URL(f, root), 'utf8'), ...extra].join('\n');
  }
  return files;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = new URL('../', import.meta.url);
  const files = readStyles(root);
  const problems = findProblems(files);
  if (problems.length) {
    console.error(problems.join('\n'));
    console.error(
      `\n${problems.length} problem(s): a part must follow the density step (docs/superpowers/specs/2026-11-13-density-design.md).`,
    );
    process.exit(1);
  }
  console.log('Every listed part follows the density step; alert parts, horizontal padding and text size ignore it.');
}
