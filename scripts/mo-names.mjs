// The `mo-` names map (plan docs/superpowers/plans/2026-11-18-mo-names-contract-7.md, PR M1). Every class and every custom property of ours gets
// the `mo-` prefix inside contract 7 (owner, 18 Nov 2026; the pattern is in docs/class-names.md). This module scans the tree for what is still
// unprefixed and maps each name to its new name by that pattern. A name the pattern does not settle is `status: "question"`: it goes to the PM,
// and nobody guesses its new name.
//
//   node scripts/mo-names.mjs          writes docs/superpowers/plans/mo-names/map.json
//   node scripts/mo-names.mjs --counts prints the per-file counts the ratchet (scripts/check-mo-names.mjs) uses
//
// What counts, per file:
//  - classDefs:   unprefixed class names defined in a stylesheet (a `.name` in a selector; in .css and the <style> of .astro);
//  - markup:      unprefixed class names written in markup or code strings: `class`/`className` values, `classList.*`, `querySelector*`,
//                 `closest`, `matches`, `cn(`/`clsx(` arguments, and a `.name` selector inside any string; only names the stylesheets define,
//                 so another library's class and a Tailwind utility are never counted here;
//  - propsDeclared / propsRead: unprefixed custom properties declared (`--x:`, `setProperty('--x')`, `'--x':`) and read (`var(--x`, `getPropertyValue`).
// Not counted: names in `NOT_RENAMED` (other libraries' classes, `prose` until T13), Tailwind's own properties (`--tw-*` and its @theme namespaces,
// listed in scripts/css-tokens-allowlist.json; T16 removes them) and `data-*` attributes.
// Depends on: git (lists the files), postcss.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';

const root = fileURLToPath(new URL('..', import.meta.url));
export const MAP_PATH = 'docs/superpowers/plans/mo-names/map.json';

/** Folders and files scanned. The plan's five folders hold the stylesheets; the rest read the names (scripts, lib, the demo, the starter). */
export const FOLDERS = ['theme', 'src', 'pages', 'defaults', 'site', 'lib', 'starter', 'demo', 'worker', 'bin', 'scripts'];
const SCANNED = /\.(css|astro|tsx|ts|jsx|js|mjs|html|md)$/;
/** Not scanned: this tool and its check (they quote names as fixtures), every test file, and generated or copied content. */
const SKIPPED = /(^|\/)(mo-names|check-mo-names)[^/]*$|\.test\.mjs$|^demo\/src\/data\/|(^|\/)node_modules\//;

/** Classes of other libraries and the ones kept on purpose, with the reason (also in docs/class-names.md). */
export const NOT_RENAMED = [
  { pattern: 'ProseMirror*', why: "ProseMirror's own classes" },
  { pattern: 'cm-*', why: "CodeMirror's own classes" },
  { pattern: 'calendly-*', why: "A store app's embed (Calendly's widget)" },
  { pattern: 'prose', why: 'Tailwind Typography until T13 has its own prose rules (then `mo-prose`)' },
  { pattern: 'not-prose', why: 'Tailwind Typography until T13 has its own prose rules (then `mo-prose`)' },
  { pattern: 'dark', why: 'The theme-mode class on <html>, a stored switch (docs/css-tokens.md), not a name of ours to prefix here' },
];
const matchPattern = (name, pattern) => (pattern.endsWith('*') ? name.startsWith(pattern.slice(0, -1)) : name === pattern);
export const isKept = (name) => NOT_RENAMED.some(({ pattern }) => matchPattern(name, pattern));

const TAILWIND_PROPS = JSON.parse(readFileSync(new URL('css-tokens-allowlist.json', import.meta.url), 'utf8')).names.map((n) => n.pattern);
export const isTailwindProp = (name) => TAILWIND_PROPS.some((p) => matchPattern(name, p));
export const isOwnProp = (name) => /^--[a-z]/i.test(name) && !name.startsWith('--mo-') && !isTailwindProp(name);
export const isOwnClass = (name) => /^-?[_a-zA-Z][\w-]*$/.test(name) && !name.startsWith('mo-') && !isKept(name);

/** The CSS of a file: the whole text of a stylesheet, the <style> elements of an .astro or .html file. */
export const cssOf = (file, text) =>
  /\.css$/.test(file) ? text : [...text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
/** The code of a file without its <style> elements, so a selector in a stylesheet is never counted as one in a string. */
const codeOf = (file, text) => (/\.css$/.test(file) ? '' : text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ''));

/** The classes a stylesheet defines and the custom properties it declares and reads. @param {string} css */
export function scanCss(css) {
  const out = { classDefs: new Map(), declared: new Map(), read: new Map() };
  const bump = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
  let tree;
  try {
    tree = postcss.parse(css);
  } catch {
    return out;
  }
  tree.walkRules((rule) => {
    for (let p = rule.parent; p; p = p.parent) if (p.type === 'atrule' && /keyframes$/.test(p.name)) return;
    const selector = rule.selector.replace(/\[[^\]]*\]/g, '').replace(/"[^"]*"|'[^']*'/g, '');
    for (const [, name, next] of selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)(\\)?/g)) if (!next && isOwnClass(name)) bump(out.classDefs, name);
  });
  tree.walkDecls((decl) => {
    if (decl.prop.startsWith('--') && isOwnProp(decl.prop)) bump(out.declared, decl.prop);
    for (const [, name] of decl.value.matchAll(/var\(\s*(--[\w-]+)/g)) if (isOwnProp(name)) bump(out.read, name);
  });
  tree.walkAtRules((rule) => {
    for (const [, name] of rule.params.matchAll(/var\(\s*(--[\w-]+)/g)) if (isOwnProp(name)) bump(out.read, name);
  });
  return out;
}

const OPENERS =
  /\b(?:classList\s*\.\s*(?:add|remove|toggle|contains|replace)|querySelector(?:All)?|closest|matches|getElementsByClassName|cn|clsx|classNames|cx|class|className|class:list)\b\s*([=(:])/g;

/** The text of the argument or attribute value after an opener: a quoted string, a {…} or a (…) region, balanced. */
function region(text, from, open) {
  let i = from;
  while (/\s/.test(text[i] ?? '')) i++;
  const ch = text[i];
  if (open === '=' && (ch === '"' || ch === "'")) {
    const end = text.indexOf(ch, i + 1);
    return end < 0 ? '' : text.slice(i + 1, end);
  }
  const pairs = { '{': '}', '(': ')', '[': ']' };
  if (open === '(') i = from - 1;
  else if (!pairs[ch]) return open === ':' ? '' : '';
  const start = open === '(' ? from : i;
  let depth = 0;
  for (let j = start; j < Math.min(text.length, start + 4000); j++) {
    const c = text[j];
    if (c === '(' || c === '{' || c === '[') depth++;
    else if (c === ')' || c === '}' || c === ']') {
      depth--;
      if (depth <= 0) return text.slice(start, j);
    }
  }
  return text.slice(start, start + 400);
}

/** The string literals inside a region of code (the static parts of a template literal too). */
const stringsOf = (src) =>
  [...src.matchAll(/"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g)].map((m) => (m[1] ?? m[2] ?? m[3]).replace(/\$\{[^}]*\}/g, ' '));

/**
 * The class names a code file writes that a stylesheet defines. @param {string} file @param {string} text @param {Set<string>} known
 * @returns {Map<string, number>} name → how many times
 */
export function scanMarkup(file, text, known) {
  const found = new Map();
  const code = codeOf(file, text);
  if (!code) return found;
  const bump = (name) => known.has(name) && found.set(name, (found.get(name) ?? 0) + 1);
  const covered = [];
  OPENERS.lastIndex = 0;
  for (const m of code.matchAll(OPENERS)) {
    if (covered.some(([a, b]) => m.index > a && m.index < b)) continue; // nested in a region already read (`className={cn(…)}`)
    const body = region(code, m.index + m[0].length, m[1]);
    covered.push([m.index, m.index + m[0].length + body.length + 2]);
    const strings =
      m[1] === '=' && /^[^{(\[`]/.test(body) && !/^\s*[{`]/.test(code.slice(m.index + m[0].length - 1)) ? [body] : stringsOf(body);
    for (const s of m[1] === '=' && strings.length === 0 ? [body] : strings)
      for (const token of s.split(/[\s.#>+~,:[\]()=!&|?;{}'"`$]+/)) if (token) bump(token);
  }
  // A `.name` selector in any other string (one inside an opener's region is counted above).
  for (const m of code.matchAll(/"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g)) {
    if (covered.some(([a, b]) => m.index >= a && m.index < b)) continue;
    const str = (m[1] ?? m[2] ?? m[3]).replace(/\$\{[^}]*\}/g, ' ');
    for (const [, name] of str.matchAll(/(?:^|[\s,>+~(\[])\.(-?[_a-zA-Z][\w-]*)/g)) bump(name);
  }
  return found;
}

/** The custom properties a code file declares and reads. */
export function scanCodeProps(file, text) {
  const out = { declared: new Map(), read: new Map() };
  const code = codeOf(file, text);
  const bump = (map, key) => map.set(key, (map.get(key) ?? 0) + 1);
  for (const [, name] of code.matchAll(/var\(\s*(--[\w-]+)/g)) if (isOwnProp(name)) bump(out.read, name);
  if (/^(scripts|bin)\//.test(file)) return out; // a command-line flag (`--no-sandbox`) looks like a declaration there
  for (const [, name] of code.matchAll(/setProperty\(\s*['"`](--[\w-]+)/g)) if (isOwnProp(name)) bump(out.declared, name);
  for (const [, name] of code.matchAll(/getPropertyValue\(\s*['"`](--[\w-]+)/g)) if (isOwnProp(name)) bump(out.read, name);
  for (const [, name] of code.matchAll(/(?:^|[\s{,'"`;])(--[a-zA-Z][\w-]*)['"`]?\s*:/gm)) if (isOwnProp(name)) bump(out.declared, name);
  for (const [, name] of code.matchAll(/\[\s*['"`](--[a-zA-Z][\w-]*)['"`]\s*\]/g)) if (isOwnProp(name)) bump(out.declared, name);
  return out;
}

/** The files to scan, from git. */
export function listFiles() {
  return execFileSync('git', ['ls-files', ...FOLDERS], { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\n')
    .filter((f) => f && SCANNED.test(f) && !SKIPPED.test(f) && existsSync(root + f));
}

const sum = (map) => [...map.values()].reduce((a, b) => a + b, 0);

/**
 * Scan files. @param {Record<string, string>} files path → text
 * @returns {{ perFile: Record<string, {classDefs:number, markup:number, propsDeclared:number, propsRead:number}>, names: {classes: Map<string, any>, props: Map<string, any>} }}
 */
export function scan(files) {
  const css = {};
  const known = new Set();
  const classes = new Map();
  const props = new Map();
  const entry = (map, name) => map.get(name) ?? map.set(name, { files: new Set(), defs: 0, markup: 0, declared: 0, read: 0 }).get(name);
  for (const [file, text] of Object.entries(files)) {
    const c = cssOf(file, text);
    css[file] = c ? scanCss(c) : null;
    if (css[file]) for (const name of css[file].classDefs.keys()) known.add(name);
  }
  const perFile = {};
  for (const [file, text] of Object.entries(files)) {
    const s = css[file];
    const markup = scanMarkup(file, text, known);
    const code = scanCodeProps(file, text);
    const declared = new Map([...(s?.declared ?? [])]);
    const read = new Map([...(s?.read ?? [])]);
    for (const [k, v] of code.declared) declared.set(k, (declared.get(k) ?? 0) + v);
    for (const [k, v] of code.read) read.set(k, (read.get(k) ?? 0) + v);
    const row = { classDefs: sum(s?.classDefs ?? new Map()), markup: sum(markup), propsDeclared: sum(declared), propsRead: sum(read) };
    if (row.classDefs || row.markup || row.propsDeclared || row.propsRead) perFile[file] = row;
    for (const [name, n] of s?.classDefs ?? [])
      Object.assign(entry(classes, name), { defs: entry(classes, name).defs + n }).files.add(file);
    for (const [name, n] of markup) Object.assign(entry(classes, name), { markup: entry(classes, name).markup + n }).files.add(file);
    for (const [name, n] of declared) Object.assign(entry(props, name), { declared: entry(props, name).declared + n }).files.add(file);
    for (const [name, n] of read) Object.assign(entry(props, name), { read: entry(props, name).read + n }).files.add(file);
  }
  return { perFile, names: { classes, props } };
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// The map

/** Material 3's component names, the same words as the `--mo-comp-<component>-*` tokens (the folder of token files names them). */
export const COMPONENTS = [
  'avatar', 'badge', 'bottom-sheet', 'button', 'button-group', 'card', 'carousel', 'center', 'checkbox', 'chip', 'date-picker', 'dialog',
  'divider', 'extended-fab', 'fab', 'fab-menu', 'grid', 'icon', 'icon-button', 'lightbox', 'list', 'loading-indicator', 'menu', 'navigation',
  'progress-indicator', 'radio', 'row', 'search', 'segmented-button', 'setting', 'side-sheet', 'slider', 'snackbar', 'split-button', 'stack',
  'switch', 'tabs', 'text-field', 'time-picker', 'toolbar', 'tooltip', 'top-app-bar',
]; // prettier-ignore

/** Block types (folders of theme/blocks and src/standard). */
export const BLOCK_TYPES = [
  'accordion', 'buttons', 'cards', 'checklist', 'cookies', 'expand', 'imagegrid', 'links', 'list', 'notice', 'points', 'posts', 'pricecards',
  'steps', 'table', 'testimonials', 'video',
]; // prettier-ignore

/** Words that are a kind (Material 3's variant) or a state of a component: `mo-is-<word>` on its root. */
export const STATE_WORDS = [
  'active', 'checked', 'current', 'disabled', 'dragging', 'elevated', 'error', 'expanded', 'filled', 'focused', 'hovered', 'invalid', 'loading',
  'open', 'outlined', 'pressed', 'selected', 'tonal',
]; // prettier-ignore

const longest = (name, list) => list.filter((c) => name === c || name.startsWith(`${c}-`)).sort((a, b) => b.length - a.length)[0];

/**
 * The new name of a class by the pattern, or why the pattern does not settle it.
 * @returns {{ new?: string, on?: string, rule: string, status: 'settled' | 'question', question?: string }}
 */
export function mapClass(name, existing = new Set()) {
  const q = (rule, question) => ({ rule, status: 'question', question });
  const ok = (rule, to, on) => ({ rule, status: 'settled', new: to, ...(on ? { on } : {}) });
  const typeScale = /^(display|headline|title|body|label)-(large|medium|small)$/.exec(name);
  if (typeScale || name === 'lead') return ok('type class (already exists)', `mo-type-${name}`);
  let m;
  if ((m = /^(?:is)-([a-z][\w-]*)$/.exec(name))) return ok('state', `mo-is-${m[1]}`);
  if ((m = /^has-([a-z][\w-]*)$/.exec(name))) return ok('what it holds', `mo-has-${m[1]}`);
  if (STATE_WORDS.includes(name)) return ok('state', `mo-is-${name}`);
  if ((m = /^color-(accent|muted)$/.exec(name))) return ok('what it holds (saved in content, M6)', `mo-has-${m[1]}-color`);
  if (name === 'block-eyebrow')
    return q(
      'saved in content',
      'The former block-eyebrow is rewritten in content by lib/migrate-content.mjs; M6 decides (names saved in content).',
    );
  if (name.startsWith('editor-')) return ok("the editor's own part", `mo-${name}`);
  if (name.startsWith('block-')) {
    const rest = name.slice('block-'.length);
    const type = longest(rest, BLOCK_TYPES);
    if (!type) return q('block', `block-${rest} is no block type; is it a part of one block, a shared block part, or something else?`);
    const part = rest.slice(type.length + 1);
    return ok('block', part ? `mo-block-${type}__${part}` : `mo-block-${type}`);
  }
  if (COMPONENTS.includes(name)) return ok('component root', `mo-${name}`);
  const comp = longest(name, COMPONENTS);
  if (comp) {
    const rest = name.slice(comp.length + 1);
    const first = rest.split('-')[0];
    if (STATE_WORDS.includes(rest)) return ok('kind or state', `mo-is-${rest}`, `mo-${comp}`);
    if (rest.startsWith('with-')) return ok('what it holds', `mo-has-${rest.slice(5)}`, `mo-${comp}`);
    if (STATE_WORDS.includes(first))
      return q('kind or state with more words', `${name}: is "${rest}" a state ("mo-is-${first}" plus a part) or a part name?`);
    return ok('component part', `mo-${comp}__${rest}`);
  }
  return q('no component or block', `${name} starts with no component or block name; which component, block or editor part is it?`);
}

/** The new name of a custom property by the pattern, or why the pattern does not settle it. */
export function mapProp(name, { declaredOnly = false } = {}) {
  const q = (rule, question) => ({ rule, status: 'question', question });
  const ok = (rule, to) => ({ rule, status: 'settled', new: to });
  const bare = name.slice(2);
  const comp = longest(bare, COMPONENTS);
  if (comp && bare !== comp) return ok(declaredOnly ? 'runtime value' : 'hook', `--mo-comp-${comp}-${bare.slice(comp.length + 1)}`);
  if (bare.startsWith('editor-')) return ok("the editor's own value", `--mo-comp-editor-${bare.slice(7)}`);
  const block = bare.startsWith('block-') ? longest(bare.slice(6), BLOCK_TYPES) : null;
  if (block) return ok('block hook', `--mo-comp-block-${block}-${bare.slice(6 + block.length + 1)}`.replace(/-$/, ''));
  return q(
    'no component',
    `${name} starts with no component name; which --mo-comp-<component>-* does it belong to, or is it a shared --mo-sys-* or --mo-ref-* value?`,
  );
}

/** The map: every name with its new name, its status and where it is used. @param {ReturnType<typeof scan>['names']} names @param {Set<string>} [mo] */
export function buildMap(names) {
  const classes = {};
  const props = {};
  const taken = new Set();
  for (const k of [...names.classes.keys()].sort()) {
    const info = names.classes.get(k);
    const m = mapClass(k);
    if (m.new) taken.add(m.new);
    classes[k] = { ...m, defined: info.defs, written: info.markup, files: info.files.size };
  }
  const targets = new Map();
  for (const [k, v] of Object.entries(classes)) if (v.new) targets.set(v.new, [...(targets.get(v.new) ?? []), k]);
  for (const [to, from] of targets)
    if (from.length > 1)
      for (const k of from)
        classes[k] = {
          ...classes[k],
          status: 'question',
          question: `${from.join(', ')} all map to ${to}: which one keeps it, and what are the others called?`,
        };
  for (const k of [...names.props.keys()].sort()) {
    const info = names.props.get(k);
    const m = mapProp(k, { declaredOnly: info.declared > 0 && !info.files.size });
    props[k] = { ...m, declared: info.declared, read: info.read, files: info.files.size };
  }
  const propTargets = new Map();
  for (const [k, v] of Object.entries(props)) if (v.new) propTargets.set(v.new, [...(propTargets.get(v.new) ?? []), k]);
  for (const [to, from] of propTargets)
    if (from.length > 1)
      for (const k of from)
        props[k] = { ...props[k], status: 'question', question: `${from.join(', ')} all map to ${to}: which one keeps it?` };
  // The questions, one per family (the first word, two after `block-` and `site-`), so the PM answers a family once.
  const family = (k) =>
    k
      .replace(/^--/, '')
      .split('-')
      .slice(0, /^(?:--)?(?:block|site|inline)-/.test(k) ? 2 : 1)
      .join('-');
  const open = (obj) => {
    const groups = new Map();
    for (const [k, v] of Object.entries(obj))
      if (v.status === 'question') {
        const g = groups.get(family(k)) ?? { family: family(k), rule: v.rule, question: v.question, names: [] };
        g.names.push(k);
        groups.set(family(k), g);
      }
    return [...groups.values()].sort((a, b) => b.names.length - a.names.length || a.family.localeCompare(b.family));
  };
  const summary = {
    classes: Object.keys(classes).length,
    classesSettled: Object.values(classes).filter((v) => v.status === 'settled').length,
    properties: Object.keys(props).length,
    propertiesSettled: Object.values(props).filter((v) => v.status === 'settled').length,
  };
  return { summary, classes, properties: props, questions: { classes: open(classes), properties: open(props) } };
}

export const readTree = (files = listFiles()) => Object.fromEntries(files.map((f) => [f, readFileSync(root + f, 'utf8')]));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { perFile, names } = scan(readTree());
  if (process.argv.includes('--counts')) {
    console.log(JSON.stringify(perFile, null, 2));
    process.exit(0);
  }
  const map = buildMap(names);
  mkdirSync(dirname(root + MAP_PATH), { recursive: true });
  writeFileSync(root + MAP_PATH, `${JSON.stringify(map, null, 2)}\n`);
  console.log(
    `mo-names: wrote ${MAP_PATH}`,
    map.summary,
    `questions: ${map.questions.classes.length} classes, ${map.questions.properties.length} properties`,
  );
}
