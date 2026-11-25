// Owner goal (20 Nov 2026): "I want us to match md both in appearance and in naming" (specs/2026-11-20-material-3-names-design.md, contract 8).
// This check reads every `--mo-sys-*`, `--mo-comp-*` and `--mo-ref-*` custom property the theme and the editor declare and every `mo-` class their stylesheets
// write, and says which of them are Material 3's name (docs/m3-tokens/), which the map renames (scripts/m3-names.json: tokens, classes, props, reused), which are
// ours (scripts/m3-names.ours.mjs, each with the reason M3 has none) and which are none of these yet (the names the CTO reviews).
//
// Contract 8 (batch 8c of 0.19.6): the run without `--report` fails on any name that is not M3's, the editor's or on the ours list, on a name the map renames that is
// still declared or written (unless M3 also uses that name: a reused one), and on an ours entry M3 has since got a token for. `--report` prints the same and never fails.
// Run: npm run check:m3-names [-- --report]. Tested in scripts/check-m3-names.test.mjs.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const COPY = join(root, 'docs/m3-tokens');

/** Folders read for declarations and selectors. */
export const FOLDERS = ['theme', 'src', 'pages', 'starter', 'demo', 'site', 'lib', 'defaults'];

const walk = (dir) =>
  readdirSync(dir)
    .sort()
    .flatMap((f) => {
      if (f === 'node_modules' || f.startsWith('.')) return [];
      const p = join(dir, f);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });

/** The sources of the theme and the editor: stylesheets and the code that writes tokens or classes. @returns {string[]} */
export function sourceFiles(base = root) {
  return FOLDERS.flatMap((d) => (existsSync(join(base, d)) ? walk(join(base, d)) : [])).filter(
    (p) => /\.(css|tsx?|mjs|astro)$/.test(p) && !/\.test\.[a-z]+$/.test(p) && !p.includes('/fixtures/'),
  );
}

/** The name M3's token has in the CMS: `md.comp.search-bar.container.color` → `--mo-comp-search-bar-container-color`. @param {string} m3Name */
export const plainName = (m3Name) => '--mo-' + m3Name.slice(3).replaceAll('.', '-');

/** Every M3 token name (`md.sys.*`, `md.comp.*`, `md.ref.*`) of the token copy, as the CMS spells it, and the component sets (`md.comp.<set>`). @param {string} [dir] */
export function loadM3Names(dir = COPY) {
  const tokens = new Set();
  const sets = new Set();
  for (const f of readdirSync(dir).filter((f) => /^md\..*\.json$/.test(f))) {
    const set = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    for (const t of set.tokens ?? []) if (/^md\.(sys|comp|ref)\./.test(t.token)) tokens.add(plainName(t.token));
    const m = /^md\.comp\.([a-z0-9-]+)/.exec(set.set ?? f);
    if (m) sets.add(m[1]);
  }
  return { tokens, sets };
}

/** The `--mo-sys|comp|ref-*` custom properties written as a declaration in the given texts: name → the files. @param {Record<string,string>} texts file → text */
export function declaredTokens(texts) {
  const map = new Map();
  for (const [file, text] of Object.entries(texts))
    for (const m of text.matchAll(/(?<![\w-])(--mo-(?:sys|comp|ref)-[a-z0-9-]+)\s*:/g))
      map.set(m[1], [...new Set([...(map.get(m[1]) ?? []), file])]);
  return map;
}

/** The `mo-` classes a stylesheet's selectors write: name → the files. @param {Record<string,string>} texts file → text (only `.css` files are read) */
export function selectorClasses(texts) {
  const map = new Map();
  for (const [file, text] of Object.entries(texts)) {
    if (!file.endsWith('.css')) continue;
    const css = text.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/\.(mo-[a-z0-9]+(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?)(?![\w-])/g))
      map.set(m[1], [...new Set([...(map.get(m[1]) ?? []), file])]);
  }
  return map;
}

/** The component word of a class: the word between mo- and the part, as in mo-search-bar__label. @param {string} cls */
export function componentOf(cls) {
  const word = cls.slice(3).split('__')[0];
  return word;
}

/** A name matches an entry of the ours list: exact, or a prefix when the entry ends with `*`. @param {string} name @param {{ token?: string, class?: string }[]} list @param {'token'|'class'} key */
export function inList(name, list, key) {
  return list.some((e) => (e[key].endsWith('*') ? name.startsWith(e[key].slice(0, -1)) : e[key] === name));
}

/** Words that are classes of M3's components though no `md.comp.<set>` bears the word: M3 names its tokens by kind (`filled-card`) and its page by component (Cards). */
export const FAMILIES = {
  button: ['button', 'filled-button', 'elevated-button', 'outlined-button', 'text-button', 'filled-tonal-button'],
  'icon-button': ['icon-button', 'filled-icon-button', 'filled-tonal-icon-button', 'outlined-icon-button'],
  card: ['elevated-card', 'filled-card', 'outlined-card'],
  chip: ['assist-chip', 'filter-chip', 'input-chip', 'suggestion-chip'],
  'chip-set': ['assist-chip', 'filter-chip', 'input-chip', 'suggestion-chip'],
  'text-field': ['filled-text-field', 'outlined-text-field'],
  tooltip: ['plain-tooltip', 'rich-tooltip'],
  tabs: ['primary-navigation-tab', 'secondary-navigation-tab'],
  carousel: ['carousel-item'],
  'progress-indicator': ['circular-progress-indicator', 'linear-progress-indicator'],
  'search-bar': ['search-bar'],
  menu: ['menu', 'menus'],
  select: ['filled-select', 'outlined-select'],
  sheet: ['sheet'],
};

/**
 * Sorts every declared token into: `m3` (an M3 token's name), `renamed` (the map names its new one), `ours` (listed with its reason), `editor` (`--mo-comp-editor-*`: the page
 * and post editor is outside Material 3) or `unknown` (none of these: the CTO reviews it).
 * @param {Iterable<string>} names @param {{ tokens: Set<string> }} m3 @param {{ tokens: Record<string, unknown> }} map @param {{ tokens: { token: string }[] }} ours
 */
export function classifyTokens(names, m3, map, ours) {
  const out = { m3: [], renamed: [], ours: [], editor: [], unknown: [] };
  for (const n of [...names].sort()) {
    if (Object.hasOwn(map.tokens, n)) out.renamed.push(n);
    else if (m3.tokens.has(n)) out.m3.push(n);
    else if (n.startsWith('--mo-comp-editor-')) out.editor.push(n);
    else if (inList(n, ours.tokens, 'token')) out.ours.push(n);
    else out.unknown.push(n);
  }
  return out;
}

/**
 * Sorts every class into: `m3` (the component is M3's), `renamed` (the map names its new one), `ours` (its component is on the ours list), `block` (`mo-block-*`), `editor`
 * (`mo-editor-*`), `state` (`mo-is-*`, `mo-has-*`, `mo-type-*`: not a component) or `unknown`.
 * @param {Iterable<string>} names @param {{ sets: Set<string> }} m3 @param {{ classes: Record<string, unknown> }} map @param {{ classes: { class: string }[] }} ours
 */
export function classifyClasses(names, m3, map, ours) {
  const words = new Set([...m3.sets, ...Object.keys(FAMILIES)]);
  const out = { m3: [], renamed: [], ours: [], block: [], editor: [], state: [], unknown: [] };
  for (const n of [...names].sort()) {
    const word = componentOf(n);
    if (Object.hasOwn(map.classes, n)) out.renamed.push(n);
    else if (/^(is|has|type)(-|$)/.test(word)) out.state.push(n);
    else if (/^block(-|$)/.test(word)) out.block.push(n);
    else if (/^editor(-|$)/.test(word)) out.editor.push(n);
    else if (words.has(word)) out.m3.push(n);
    else if (inList(`mo-${word}`, ours.classes, 'class')) out.ours.push(n);
    else out.unknown.push(n);
  }
  return out;
}

/** The ours entries M3 has since got a token for. @param {{ tokens: Set<string> }} m3 @param {{ tokens: { token: string }[] }} ours */
export function staleOurs(m3, ours) {
  return ours.tokens.filter((e) => !e.token.endsWith('*') && m3.tokens.has(e.token)).map((e) => e.token);
}

/**
 * What fails the check: every unknown name, every old name of the map still in use (a token M3 also names is a reused name, not an old one), every stale ours entry.
 * @returns {string[]}
 */
export function problems({ tokens, classes, stale }, m3) {
  const out = [];
  for (const n of tokens.unknown) out.push(`token ${n}: neither M3's, renamed nor on the ours list (scripts/m3-names.ours.mjs)`);
  for (const n of classes.unknown) out.push(`class ${n}: neither M3's, renamed nor on the ours list (scripts/m3-names.ours.mjs)`);
  for (const n of tokens.renamed)
    if (!m3.tokens.has(n)) out.push(`token ${n}: the map renames it (scripts/m3-names.json) but it is still declared`);
  for (const n of classes.renamed) out.push(`class ${n}: the map renames it (scripts/m3-names.json) but it is still written`);
  for (const n of stale) out.push(`ours entry ${n}: M3 has a token for it now, so it leaves scripts/m3-names.ours.mjs`);
  return out;
}

/** The text of the report. */
export function formatReport({ tokens, classes, map, ours, stale }) {
  const lines = [];
  const count = (o) =>
    Object.entries(o)
      .map(([k, v]) => `${v.length} ${k}`)
      .join(', ');
  lines.push(`Tokens (${[].concat(...Object.values(tokens)).length}): ${count(tokens)}.`);
  lines.push(`Classes (${[].concat(...Object.values(classes)).length}): ${count(classes)}.`);
  lines.push(
    `The map (scripts/m3-names.json): ${Object.keys(map.tokens).length} tokens, ${Object.keys(map.classes).length} classes, ${Object.keys(map.props).length} components with props, ${map.reused.length} reused names.`,
  );
  lines.push(`Ours (scripts/m3-names.ours.mjs): ${ours.tokens.length} token entries, ${ours.classes.length} class entries.`);
  if (stale.length) lines.push(`\n${stale.length} ours entries M3 has a token for now:\n${stale.join('\n')}`);
  if (tokens.unknown.length)
    lines.push(`\n${tokens.unknown.length} tokens that are neither M3's, renamed nor ours:\n${tokens.unknown.join('\n')}`);
  if (classes.unknown.length)
    lines.push(`\n${classes.unknown.length} classes that are neither M3's, renamed nor ours:\n${classes.unknown.join('\n')}`);
  if (map.open?.length)
    lines.push(
      `\n${map.open.length} open questions of the map (scripts/m3-names.json, open):\n${map.open.map((o, i) => `${i + 1}. ${o.question}`).join('\n')}`,
    );
  return lines.join('\n');
}

async function main() {
  if (!existsSync(COPY)) {
    console.error('check:m3-names: docs/m3-tokens/ is missing (node scripts/m3-tokens.mjs docs/m3-tokens makes it).');
    process.exit(1);
  }
  const texts = Object.fromEntries(sourceFiles().map((f) => [relative(root, f), readFileSync(f, 'utf8')]));
  const m3 = loadM3Names();
  const map = JSON.parse(readFileSync(join(root, 'scripts/m3-names.json'), 'utf8'));
  const { ours } = await import('./m3-names.ours.mjs');
  const tokens = classifyTokens(declaredTokens(texts).keys(), m3, map, ours);
  const classes = classifyClasses(selectorClasses(texts).keys(), m3, map, ours);
  const stale = staleOurs(m3, ours);
  console.log(formatReport({ tokens, classes, map, ours, stale }));
  if (process.argv.includes('--report')) return;
  const found = problems({ tokens, classes, stale }, m3);
  if (found.length) {
    console.error(`\ncheck:m3-names failed (${found.length}):\n${found.join('\n')}`);
    process.exit(1);
  }
  console.log("\ncheck:m3-names: every name is M3's, the editor's or ours.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
