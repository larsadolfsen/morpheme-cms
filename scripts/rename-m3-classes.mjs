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
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
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
  /^package-lock\.json$/,
];
const EXT = /\.(css|tsx?|mjs|astro|md|mdx)$/;

const NAME = /(?<![\w-])(mo-[a-z0-9]+(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?)(?![\w-])/g;
const SHEET = /^mo-(bottom|side)-sheet(?:__(.+))?$/;
const SCOPED_PARTS = new Set(['container', 'standard', 'header', 'headline', 'content', 'actions']);
const CONTAINER_PARTS = new Set(['container', 'standard']);

const asList = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

/** How an old name is written in a class list: the new classes, space separated; null when the map drops it. @param {string} old @param {Record<string, any>} classes */
export function classList(old, classes = MAP.classes) {
  if (!Object.hasOwn(classes, old)) return undefined;
  const sheet = SHEET.exec(old);
  const list = asList(classes[old]);
  if (sheet && sheet[2] === 'container') return [...list, `mo-is-${sheet[1]}`].join(' ');
  return list.join(' ');
}

/** The compound selector for an old name (comments and strings): `.mo-button.mo-is-text`. */
function compound(old, classes) {
  if (!Object.hasOwn(classes, old)) return undefined;
  const sheet = SHEET.exec(old);
  const list = asList(classes[old]);
  const kind = list.length === 1 && list[0].startsWith('mo-is-') ? `.mo-${/^mo-([a-z0-9-]+)__/.exec(old)?.[1]}` : '';
  if (sheet && sheet[2] && SCOPED_PARTS.has(sheet[2])) {
    return CONTAINER_PARTS.has(sheet[2]) ? `.${list[0]}.mo-is-${sheet[1]}` : `.mo-is-${sheet[1]} .${list[0]}`;
  }
  return kind + list.map((c) => `.${c}`).join('');
}

/** A stylesheet's complex selector, an old name at a time. Returns the text and what it could not do. */
function selectorOf(selector, classes, manual) {
  const seen = new Set();
  const out = selector.replace(/\.(mo-[a-z0-9]+(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?)(?![\w-])/g, (all, old, at) => {
    if (!Object.hasOwn(classes, old)) return all;
    const list = asList(classes[old]);
    if (list.length === 0) {
      manual.push(`${all} is dropped by the map`);
      return all;
    }
    const sheet = SHEET.exec(old);
    if (sheet) {
      const kind = `mo-is-${sheet[1]}`;
      const part = sheet[2];
      const first = !seen.has(sheet[1]);
      seen.add(sheet[1]);
      if (!part) return `:where(.mo-sheet).${kind}`;
      if (CONTAINER_PARTS.has(part)) return `:where(.${list[0]}).${kind}`;
      if (SCOPED_PARTS.has(part)) {
        if (!first) return `.${list[0]}`;
        const before = selector.slice(0, at).trimEnd();
        const spaced = selector.slice(0, at).length > before.length;
        if (before === '' || (spaced && !/[>+~]$/.test(before))) return `:where(.${kind}) .${list[0]}`;
        manual.push(`${all} follows a combinator or a compound, so it cannot be scoped by the kind`);
        return all;
      }
      return `.${list[0]}`;
    }
    const kindClass = list.length === 1 && list[0].startsWith('mo-is-');
    if (kindClass) {
      const rootName = /^(mo-[a-z0-9-]+?)__/.exec(old)?.[1];
      // Already on its root in the same compound: `.mo-button.mo-button__text` → `.mo-button.mo-is-text`.
      if (selector.slice(0, at).endsWith(`.${rootName}`)) return `.${list[0]}`;
      return `:where(.${rootName}).${list[0]}`;
    }
    return list.map((c) => `.${c}`).join('');
  });
  return out;
}

/** The top-level commas of a selector list. */
function splitTop(text) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (c === ',' && depth === 0) {
      parts.push(text.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(text.slice(start));
  return parts;
}

function renameCss(text, classes, manual, file) {
  const note = (line, what) => manual.push(`${file}:${line}: ${what}`);
  let out = '';
  let pos = 0;
  // Comments: the compound form. Code: the rule preludes.
  const comment = /\/\*[\s\S]*?\*\//g;
  const code = (chunk, offset) =>
    chunk.replace(/([^{}};]+)(?=\{)/g, (prelude, _p, at) => {
      if (prelude.trim().startsWith('@')) return prelude;
      const line = text.slice(0, offset + at).split('\n').length;
      const problems = [];
      const next = splitTop(prelude)
        .map((sel) => selectorOf(sel, classes, problems))
        .join(',');
      for (const p of problems) note(line, p);
      return next;
    });
  for (const m of text.matchAll(comment)) {
    out += code(text.slice(pos, m.index), pos);
    out += m[0].replace(
      /\.(mo-[a-z0-9]+(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?)(?![\w-])/g,
      (all, old) => compound(old, classes) ?? all,
    );
    pos = m.index + m[0].length;
  }
  out += code(text.slice(pos), pos);
  return out;
}

function renameScript(text, classes, manual, file) {
  const lineOf = (i) => text.slice(0, i).split('\n').length;
  let result = text.replace(NAME, (all, old, at) => {
    if (!Object.hasOwn(classes, old)) return all;
    if (asList(classes[old]).length === 0) {
      manual.push(`${file}:${lineOf(at)}: ${old} is dropped by the map`);
      return all;
    }
    if (text[at - 1] === '.') return compound(old, classes).slice(1); // the dot before it stays
    return classList(old, classes);
  });
  // A class list that names a kind twice (a root and a container both carry it) keeps it once.
  for (let n = 0; n < 4; n++) result = result.replace(/(mo-is-[a-z0-9-]+)((?: [a-z0-9_-]+)*?) \1(?![\w-])/g, '$1$2');
  // A name built from parts cannot be read here.
  const stems = new Set(
    Object.keys(classes)
      .map((c) => c.split('__')[0])
      .concat(Object.keys(classes).filter((c) => !c.includes('__'))),
  );
  for (const m of text.matchAll(/(mo-[a-z0-9-]+?)(?:__)?\$\{/g))
    if (stems.has(m[1])) manual.push(`${file}:${lineOf(m.index)}: ${m[0]}…} is built from parts`);
  return result;
}

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
  let next = /\.css$/.test(file) ? renameCss(text, classes, manual, file) : renameScript(text, classes, manual, file);
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
