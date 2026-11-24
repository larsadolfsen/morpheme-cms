// The rewrite of a site's own themes and apps for Material 3's names (contract 8; docs/superpowers/specs/2026-11-20-material-3-names-design.md, Migration 2). The folders of
// `src/themes/` and `src/apps/` that have no store.json are the site's own (a store item's copy must equal the store's, so it is never rewritten); their CSS, TS and TSX get the
// new names, as text to text, with no dependencies so the Worker's update (worker/cms-update.js) and `morpheme migrate` (scripts/migrate.mjs) run the same code:
//   - custom properties, whole names, all in one pass (so a reused name never chains); every map the site crossed (`from` is the version it came from): contract 6's
//     scripts/renamed-tokens.json, contract 7's custom properties (below 0.19.0), then Material 3's, composed before the pass (lib/migrate-code-maps.mjs);
//   - classes: contract 7's old class names (below 0.19.0, in a stylesheet's selectors and in class strings only, since they have no `mo-`), then Material 3's (lib/rename-classes.mjs);
//   - a prop's value only as a literal attribute on a component the same file imports from `@theme/ui/<Name>` (`<Button size="medium">`);
//   - the stored icon names of an app's app.json (lib/migrate-icons.mjs).
// What it cannot rewrite safely is listed by file and line and nothing is changed: a computed prop value, a name built from parts, a name the map drops or turns into
// several, a Tailwind utility. It runs once: a marker file (MIGRATIONS_FILE) records that it ran, and a second run is refused (a reused name would be rewritten twice).
import maps from './migrate-code-maps.mjs';
import { renameClassText } from './rename-classes.mjs';
import { migrateIconNamesJson } from './migrate-icons.mjs';

/** The first version that reads only Material 3's names. An update that crosses it (from any version below it) rewrites a site's own themes and apps. */
export const CODE_NAMES_SINCE = '0.19.6';
/** The first version that reads only contract 7's names (the old class names and custom properties of contract 6 are rewritten when the site comes from below it). */
const CONTRACT_7_SINCE = '0.19.0';

/** The file that records the rewrite, at the site's root (committed with it). */
export const MIGRATIONS_FILE = '.morpheme-migrations.json';

/** Whether an update from `from` to `to` crosses 0.19.6. @param {(a: string, b: string) => number} compare */
export const crossesCode = (from, to, compare) => compare(to, CODE_NAMES_SINCE) >= 0 && compare(from, CODE_NAMES_SINCE) < 0;

/** What stops the rewrite: `already` (it ran) or `unsafe` (`list`: one `{ path, line, why }` for each form it cannot rewrite). */
export class CodeMigrationStop extends Error {
  /** @param {'already' | 'unsafe'} reason @param {{ path: string, line: number, why: string }[]} [list] */
  constructor(reason, list = []) {
    super(
      reason === 'already'
        ? 'The own themes and apps were already rewritten (run once).'
        : `${list.length} place(s) of the site's own themes and apps cannot be rewritten safely.`,
    );
    this.reason = reason;
    this.list = list;
  }
}

/** The list as lines for the owner: `file:line: why`. @param {{ path: string, line: number, why: string }[]} list */
export const unsafeLines = (list) => list.map((u) => `${u.path}${u.line ? `:${u.line}` : ''}: ${u.why}`);

/** Whether the marker file's text says the rewrite ran. @param {string | null | undefined} text */
export function hasRun(text) {
  try {
    return !!JSON.parse(text ?? 'null')?.code;
  } catch {
    return false;
  }
}

/** The marker file's text with the rewrite recorded. @param {string | null | undefined} text @param {string} from */
export function marked(text, from) {
  let value = {};
  try {
    value = JSON.parse(text ?? '{}') ?? {};
  } catch {}
  return JSON.stringify({ ...value, code: { from, to: CODE_NAMES_SINCE } }, null, 2) + '\n';
}

/** The marker file's text with the rewrite removed (the undo); null when nothing else is left (the file goes). @param {string | null | undefined} text */
export function unmarked(text) {
  let value = {};
  try {
    value = JSON.parse(text ?? '{}') ?? {};
  } catch {}
  delete value.code;
  return Object.keys(value).length ? JSON.stringify(value, null, 2) + '\n' : null;
}

const asList = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
const lineOf = (text, at) => text.slice(0, at).split('\n').length;

const versionBelow = (from, to) => {
  const a = String(from).split('.').map(Number);
  const b = to.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((a[i] ?? 0) !== b[i]) return (a[i] ?? 0) < b[i];
  return false;
};

/** The custom properties of every map the site crossed, composed: old name → final name (an array when one name became several). @param {string} from */
export function tokenMap(from) {
  const m3 = maps.m3.tokens;
  const before = { ...(versionBelow(from, CONTRACT_7_SINCE) ? maps.tokens7 : {}), ...maps.tokens6 };
  const out = {};
  for (const old of new Set([...Object.keys(before), ...Object.keys(m3)])) {
    const mid = before[old];
    out[old] = Object.hasOwn(m3, old) ? m3[old] : (m3[mid] ?? mid);
  }
  return out;
}

const TOKEN = /(?<![\w-])(--[a-z0-9][a-z0-9_-]*)(?![\w-])/g;
const TOKEN_PART = /(?<![\w-])(--[a-z0-9][a-z0-9_-]*-)\$\{/g;

/** The custom properties renamed in one pass; what cannot be is added to `manual` as `line: why`. */
function renameTokens(text, map, manual) {
  const stems = Object.keys(map);
  const next = text.replace(TOKEN, (all, name, at) => {
    if (!Object.hasOwn(map, name)) return all;
    const to = map[name];
    if (typeof to !== 'string') {
      manual.push(`${lineOf(text, at)}: ${name} became several tokens (${asList(to).join(', ')}); choose by hand`);
      return all;
    }
    return to;
  });
  for (const m of text.matchAll(TOKEN_PART))
    if (stems.some((s) => s.startsWith(m[1])))
      manual.push(`${lineOf(text, m.index)}: ${m[1]}\${…} is a custom property name built from parts`);
  return next;
}

// Contract 7's old class names carry no `mo-`, so they are only read where a class name stands: a stylesheet's selector and a string of a class attribute or a class call.
const OLD_SELECTOR = /(?<![\w-])\.([a-z][a-z0-9-]*)(?![\w-])/g;
const CLASS_CONTEXT =
  /(?:className|class|classList|classNames|clsx|cx|querySelector(?:All)?|closest|matches|add|remove|toggle|contains)\b[^\n]{0,80}$/;

/** Contract 7's classes renamed (below 0.19.0 only). */
function renameOldClasses(file, text) {
  const map = maps.classes7;
  if (/\.css$/.test(file)) {
    return text.replace(/url\([^)]*\)|\/\*[\s\S]*?\*\/|[^{};]*\{/g, (chunk) =>
      chunk.startsWith('url(') || chunk.startsWith('/*')
        ? chunk
        : chunk.replace(OLD_SELECTOR, (all, name) => (Object.hasOwn(map, name) ? `.${map[name]}` : all)),
    );
  }
  return text.replace(/(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g, (all, quote, body, at) => {
    const before = text.slice(Math.max(0, at - 90), at);
    if (!CLASS_CONTEXT.test(before)) return all;
    const next = body.replace(/(?<![\w-])\.?([a-z][a-z0-9-]*)(?![\w-])/g, (word, name) =>
      Object.hasOwn(map, name) ? `${word.startsWith('.') ? '.' : ''}${map[name]}` : word,
    );
    return next === body ? all : `${quote}${next}${quote}`;
  });
}

/** The component each local name of `@theme/ui/<Name>` imports stands for: its key in the maps (a default import is the file's name, a named one its exported name). @param {string} text @returns {Map<string, string>} */
function uiImports(text) {
  const found = new Map();
  for (const m of text.matchAll(/import\s+([^;]*?)\s+from\s+['"]@theme\/ui\/([A-Za-z0-9]+)['"]/g)) {
    const [, clause, name] = m;
    const def = /^([A-Za-z_$][\w$]*)\s*(?:,|$)/.exec(clause);
    if (def) found.set(def[1], name);
    const named = /\{([^}]*)\}/.exec(clause)?.[1];
    for (const part of named?.split(',') ?? []) {
      const [orig, alias] = part.trim().split(/\s+as\s+/);
      if (orig) found.set(alias ?? orig, orig);
    }
  }
  return found;
}

/** The index after the `{…}` that opens at `from` (reading past strings), or -1. */
function braceEnd(text, from) {
  let depth = 0;
  let quote = null;
  for (let i = from; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'" || c === '`') quote = c;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i + 1;
  }
  return -1;
}

/** The attributes at the top level of an opening tag's text (after its name): `{ name, from, to, value }` (`value`: the text after `=`, null for a bare attribute) or `{ spread: true }`. */
function scanAttrs(attrs) {
  const out = [];
  let i = 0;
  while (i < attrs.length) {
    if (/\s/.test(attrs[i])) {
      i++;
      continue;
    }
    if (attrs[i] === '{') {
      const end = braceEnd(attrs, i);
      if (end < 0) break;
      out.push({ spread: true, from: i, to: end });
      i = end;
      continue;
    }
    const name = /^[A-Za-z_$][\w$:.-]*/.exec(attrs.slice(i))?.[0];
    if (!name) {
      i++;
      continue;
    }
    const from = i;
    i += name.length;
    let j = i;
    while (/\s/.test(attrs[j] ?? '')) j++;
    if (attrs[j] !== '=') {
      out.push({ name, from, nameEnd: i, to: i, value: null });
      continue;
    }
    j++;
    while (/\s/.test(attrs[j] ?? '')) j++;
    let end = j;
    if (attrs[j] === '{') end = braceEnd(attrs, j);
    else if (attrs[j] === '"' || attrs[j] === "'") end = attrs.indexOf(attrs[j], j + 1) + 1;
    if (end <= j) break;
    out.push({ name, from, nameEnd: i, to: end, value: attrs.slice(j, end) });
    i = end;
  }
  return out;
}

/** A prop's name changes (maps.m3.propNames) on one tag's attributes: returns the new text and the offset of a spread attribute (`{...props}`, which may carry an old name); what is not safe goes to `unsafe(why, offset)`. */
function renamePropNames(attrs, comp, names, unsafe) {
  const list = scanAttrs(attrs);
  const edits = [];
  for (const a of list) {
    if (a.spread || !Object.hasOwn(names, a.name)) continue;
    const to = names[a.name];
    if (to === null) {
      const literal = a.value === null || /^\{\s*(true|false)\s*\}$/.test(a.value);
      if (literal) edits.push({ from: a.from - (/\s/.test(attrs[a.from - 1] ?? '') ? 1 : 0), to: a.to, text: '' });
      else unsafe(`<${comp}> ${a.name} is removed and its value is computed here; remove it by hand`, a.from);
    } else if (typeof to === 'string') {
      edits.push({ from: a.from, to: a.nameEnd, text: to });
    } else {
      const inner = a.value?.startsWith('{') ? a.value.slice(1, -1).trim() : '';
      if (!/^\{[\s\S]*\}$/.test(inner)) {
        unsafe(
          `<${comp}> ${a.name} is not an object literal, so it cannot become ${to.to} with ${to.add}; write ${to.to}={{ …, ${to.add} }}`,
          a.from,
        );
        continue;
      }
      let at = attrs.lastIndexOf('}', a.to - 2);
      while (/\s/.test(attrs[at - 1])) at--;
      const comma = attrs[at - 1] === ',' ? ' ' : attrs[at - 1] === '{' ? ' ' : ', ';
      edits.push({ from: a.from, to: a.nameEnd, text: to.to });
      edits.push({ from: at, to: at, text: `${comma}${to.add}` });
    }
  }
  let text = attrs;
  for (const e of edits.sort((x, y) => y.from - x.from)) text = text.slice(0, e.from) + e.text + text.slice(e.to);
  return { text, spread: list.find((a) => a.spread)?.from ?? -1 };
}

/** The end of the opening tag that starts at `start` (`<Name …>`): the index of its `>`, reading past strings and `{…}`. */
function tagEnd(text, start) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'" || (c === '`' && depth > 0)) quote = c;
    else if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0) return i;
  }
  return -1;
}

/** Literal props on a component the file imports from `@theme/ui/<Name>`: old value → new, null drops the attribute (the default). */
function renameProps(text, manual) {
  const imported = uiImports(text);
  if (!imported.size) return text;
  const props = maps.m3.props;
  const propNames = maps.m3.propNames ?? {};
  let out = '';
  let pos = 0;
  const spreads = [];
  for (const m of text.matchAll(/<([A-Z][A-Za-z0-9]*)(?![\w.-])/g)) {
    const comp = imported.get(m[1]);
    if (!comp || !(props[comp] || propNames[comp]) || m.index < pos) continue;
    const end = tagEnd(text, m.index + m[0].length);
    if (end < 0) continue;
    const attrs = text.slice(m.index + m[0].length, end);
    let next = attrs;
    for (const [prop, values] of Object.entries(props[comp] ?? {})) {
      const literal = new RegExp(`(\\s)${prop}=(?:(["'])([\\w-]+)\\2|\\{\\s*(["'])([\\w-]+)\\4\\s*\\})`, 'g');
      next = next.replace(literal, (all, space, q1, v1, q2, v2) => {
        const v = v1 ?? v2;
        if (!Object.hasOwn(values, v)) return all;
        const to = values[v];
        return to === null ? '' : `${space}${prop}=${q1 ? q1 + to + q1 : `{${q2}${to}${q2}}`}`;
      });
      const computed = new RegExp(`\\s${prop}=\\{(?!\\s*["'][\\w-]+["']\\s*\\})`).exec(attrs);
      if (computed)
        manual.push(
          `${lineOf(text, m.index + m[0].length + computed.index)}: <${m[1]}> ${prop} is a computed value; write one literal of the new names`,
        );
    }
    if (propNames[comp]) {
      const base = m.index + m[0].length;
      const done = renamePropNames(next, m[1], propNames[comp], (why, at) =>
        manual.push(`${lineOf(text, base) + (next.slice(0, at).match(/\n/g)?.length ?? 0)}: ${why}`),
      );
      next = done.text;
      if (done.spread >= 0)
        spreads.push({ comp, tag: m[1], line: lineOf(text, base) + (attrs.slice(0, done.spread).match(/\n/g)?.length ?? 0) });
    }
    out += text.slice(pos, m.index + m[0].length) + next;
    pos = end;
  }
  const done = out + text.slice(pos);
  // A spread may carry an old name: only a file that still spells one (an object key, a type) is stopped; a spread in another file is not seen.
  for (const sp of spreads) {
    const old = Object.keys(propNames[sp.comp]);
    if (old.some((n) => new RegExp(`(?<![\\w$])${n}(?![\\w$])`).test(done)))
      manual.push(
        `${sp.line}: <${sp.tag}> has a spread ({...props}) in a file that writes an old prop name (${old.join(', ')}); check by hand that the spread has none`,
      );
  }
  return done;
}

// Tailwind (contract 7 removed it): the rules the Worker can read without files. `morpheme migrate` also passes the full rules of site/tailwind.mjs (`utilityProblems`).
const TAILWIND_RULES = [
  [/^\s*@apply\b/m, '@apply', true],
  [/^\s*@tailwind\b/m, '@tailwind', true],
  [/^\s*@theme\b/m, '@theme', true],
  [/\btheme\(\s*--/, 'theme(--…)', false],
  [/--tw-[\w-]+/, '--tw-…', false],
];

/** The Tailwind problems of one file as `{ line, why }`. @param {(file: string, text: string) => string[]} [utilityProblems] */
function tailwindIn(file, text, utilityProblems) {
  const found = [];
  const code = text.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '));
  for (const [re, name, cssOnly] of TAILWIND_RULES) {
    if (cssOnly && !/\.css$/.test(file)) continue;
    const m = re.exec(code);
    if (m) found.push({ line: lineOf(code, m.index), why: `Tailwind (${name}): write plain CSS and mo- classes` });
  }
  for (const problem of utilityProblems?.(file, text) ?? []) {
    const m = new RegExp(`^${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?::(\\d+))?: (.*)$`).exec(problem);
    found.push({ line: m?.[1] ? Number(m[1]) : 0, why: (m?.[2] ?? problem).replace(/\. Write plain CSS.*$/, '') });
  }
  return found;
}

const CODE_FILE = /\.(css|tsx?)$/;

/** One own file rewritten. @returns {{ text: string, unsafe: { line: number, why: string }[] }} */
export function migrateCodeFile(path, source, { from, utilityProblems } = {}) {
  if (/(^|\/)app\.json$/.test(path)) return { text: migrateIconNamesJson(source), unsafe: [] };
  if (!CODE_FILE.test(path)) return { text: source, unsafe: [] };
  const unsafe = tailwindIn(path, source, utilityProblems);
  const manual = [];
  let text = source;
  const map = tokenMap(from);
  text = renameTokens(text, map, manual);
  if (versionBelow(from, CONTRACT_7_SINCE)) text = renameOldClasses(path, text);
  const classes = renameClassText(path, text, maps.m3.classes);
  text = classes.text;
  for (const line of classes.manual) {
    const m = new RegExp(`^${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:(\\d+): (.*)$`).exec(line);
    manual.push(m ? `${m[1]}: ${m[2]}` : `0: ${line}`);
  }
  if (/\.tsx$/.test(path)) text = renameProps(text, manual);
  for (const entry of manual) {
    const [, line, why] = /^(\d+): (.*)$/.exec(entry);
    unsafe.push({ line: Number(line), why });
  }
  return { text, unsafe };
}

/** The own folders' files among `paths`: a folder of `themes` or `apps` (`src/themes`, `src/apps`) with no `store.json` is the site's own. @param {string[]} paths @param {string[]} folders */
export function ownFiles(paths, folders = ['src/themes', 'src/apps']) {
  const own = [];
  for (const folder of folders) {
    const prefix = folder.replace(/\/$/, '') + '/';
    const names = new Set(paths.filter((p) => p.startsWith(prefix)).map((p) => p.slice(prefix.length).split('/')[0]));
    for (const name of names) {
      const root = prefix + name + '/';
      if (paths.includes(root + 'store.json')) continue;
      own.push(...paths.filter((p) => p.startsWith(root) && p !== root + 'store.json'));
    }
  }
  return own;
}

/**
 * The rewrite of a site's own themes and apps. `files`: every `{ path, text }` of the theme and app folders (the store items among them are skipped); `marker`: the text of MIGRATIONS_FILE (or null);
 * `from`: the version the site comes from. Returns the changes (`{ path, text }`, the marker file included; none for a site without an own theme or app) for one commit. Throws CodeMigrationStop: `already` when it ran, `unsafe` with the list when
 * anything cannot be rewritten (nothing is changed then).
 * @param {{ files: { path: string, text: string }[], marker?: string | null, from: string, folders?: string[], utilityProblems?: (file: string, text: string) => string[] }} input
 */
export function migrateCode({ files, marker = null, from, folders, utilityProblems }) {
  if (hasRun(marker)) throw new CodeMigrationStop('already');
  const own = new Set(
    ownFiles(
      files.map((f) => f.path),
      folders,
    ),
  );
  if (!own.size) return []; // a site with no theme or app of its own has nothing to rewrite and no marker to keep
  const changes = [];
  const list = [];
  for (const { path, text } of files) {
    if (!own.has(path)) continue;
    const done = migrateCodeFile(path, text, { from, utilityProblems });
    for (const u of done.unsafe) list.push({ path, ...u });
    if (done.text !== text) changes.push({ path, text: done.text });
  }
  if (list.length) throw new CodeMigrationStop('unsafe', list);
  return [...changes, { path: MIGRATIONS_FILE, text: marked(marker, from) }];
}
