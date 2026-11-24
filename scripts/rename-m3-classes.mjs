// Batch 3 of docs/superpowers/specs/2026-11-20-material-3-names-design.md: renames the classes and the literal props of `scripts/m3-names.json`
// (`classes`, `props`) in the repository's own sources, in one pass, so `medium` → `small` and `small` → `xsmall` never chain.
// Run: node scripts/rename-m3-classes.mjs [--dry] [--list] [paths…]   (no path: every tracked source file). Tested in scripts/rename-m3-classes.test.mjs.
//
// How a name is written after the rename depends on where it stands, so the look does not change:
// - a stylesheet's selector `.mo-button__text` is `:where(.mo-button).mo-is-text`: a kind sits on the root and keeps the one class of specificity it had;
// - the bottom and side sheet merge into `mo-sheet`; the six parts both had (`container`, `standard`, `header`, `headline`, `content`, `actions`) would pick up both
//   sheets' rules, so the container carries the kind (`mo-is-bottom`, `mo-is-side`) and the other parts are scoped by it (`:where(.mo-is-bottom) .mo-sheet__header`);
// - a class list (`className`, `classList`, a string) gets the new classes (`mo-is-text`; `mo-sheet mo-is-bottom`); a comment gets the compound form;
// - a `.name` inside a script's string (a selector for `querySelector`) is the compound form (`.mo-button.mo-is-text`).
// Only whole names are matched (`mo-bottom-sheet` never inside `mo-bottom-sheet__fit`). What a script cannot do safely it prints as `manual:` with file and line:
// a name the map drops (`mo-button__small`), a selector it cannot scope, a name built from parts (`mo-button__${size}`). Props are renamed only as a literal
// attribute on the component (`<Button size="medium">`).
import { execFileSync } from 'node:child_process';
import { classList, renameClassText } from '../lib/rename-classes.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
export { classList };
const MAP = JSON.parse(readFileSync(new URL('./m3-names.json', import.meta.url), 'utf8'));

/** Files that keep the old names on purpose: the map, the record of old names and the migration tables. */
const SKIP = [
  /^docs\//,
  /^release-notes\//,
  /^\.changeset\//,
  /^CHANGELOG\.md$/,
  /^scripts\/m3-names(\.ours)?\.(json|mjs)$/,
  /^scripts\/renamed-(classes|tokens)\.json$/,
  /^scripts\/rename-m3-classes(\.test)?\.mjs$/,
  /^lib\/content-class-names/,
  /^lib\/(rename-classes|migrate-code(-maps)?|migrate-icons)(\.test)?\.mjs$/,
  /^scripts\/(migrate-code-maps(\.test)?|check-cms-update)\.mjs$/,
  /^package-lock\.json$/,
];
const EXT = /\.(css|tsx?|mjs|astro|md|mdx)$/;

const PROP_TAGS = {
  Button: 'Button',
  SiteButton: 'Button',
  LinkButton: 'Button',
  SplitButton: 'SplitButton',
  SiteSplitButton: 'SplitButton',
  Menu: 'Menu',
  SiteMenu: 'Menu',
  Fab: 'Fab',
  SiteFab: 'Fab',
};

/** Literal props on a component (`<Button size="medium">`): old value → new, null = the attribute goes (the default). */
function renameProps(text, props, manual, file) {
  return text.replace(/<([A-Z][A-Za-z]*)\b((?:[^<>{}]|\{[^{}]*\})*?)>/g, (tag, name, attrs, at) => {
    const comp = PROP_TAGS[name];
    if (!comp || !props[comp]) return tag;
    let changed = attrs;
    for (const [prop, values] of Object.entries(props[comp])) {
      const re = new RegExp(`(\\s)${prop}=(?:(["'])([\\w-]+)\\2|\\{(["'])([\\w-]+)\\4\\})`, 'g');
      changed = changed.replace(re, (all, space, q1, v1, q2, v2) => {
        const v = v1 ?? v2;
        if (!Object.hasOwn(values, v)) return all;
        const to = values[v];
        return to === null ? '' : `${space}${prop}=${q1 ? q1 + to + q1 : `{${q2}${to}${q2}}`}`;
      });
      if (new RegExp(`\\s${prop}=\\{(?!["'])`).test(attrs))
        manual.push(`${file}:${text.slice(0, at).split('\n').length}: ${name} ${prop} is computed`);
    }
    return changed === attrs ? tag : `<${name}${changed}>`;
  });
}

/** One file's text renamed. @returns {{ text: string, manual: string[] }} */
export function renameText(file, text, { classes = MAP.classes, props = MAP.props } = {}) {
  const manual = [];
  const done = renameClassText(file, text, classes);
  manual.push(...done.manual);
  let next = done.text;
  if (/\.(tsx|astro|mdx?)$/.test(file)) next = renameProps(next, props, manual, file);
  return { text: next, manual };
}

export function trackedSources() {
  return execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\n')
    .filter((f) => f && EXT.test(f) && !SKIP.some((re) => re.test(f)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const files = args.filter((a) => !a.startsWith('--'));
  const changed = [];
  const manual = [];
  for (const f of files.length ? files : trackedSources()) {
    let before;
    try {
      before = readFileSync(`${root}/${f}`, 'utf8');
    } catch {
      continue;
    }
    const r = renameText(f, before);
    manual.push(...r.manual);
    if (r.text !== before) {
      changed.push(f);
      if (!dry) writeFileSync(`${root}/${f}`, r.text);
    }
  }
  console.log(`${dry ? 'would change' : 'changed'} ${changed.length} files`);
  if (args.includes('--list')) console.log(changed.join('\n'));
  for (const m of manual) console.log(`manual: ${m}`);
}
