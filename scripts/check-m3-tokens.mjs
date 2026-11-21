// Owner goal (20 Nov 2026): "I want us to match md both in appearance and in naming". This check compares the Material theme's own tokens with
// Material 3's own (docs/m3-tokens/, the tokens-only copy made by scripts/m3-tokens.mjs), so a difference cannot come in unseen
// (plans/2026-11-20-0-19-5-material-3-tokens.md, The check).
//
// What it compares: every `--mo-sys-*` and `--mo-comp-*` token that the token files of the theme (theme/styles/tokens/) declare on `:root` (a rule whose
// selector list holds `:root` itself; the section swap and every other scoped rule is not read, `@media` and `@supports` blocks neither) and whose
// name maps to an M3 token: `--mo-comp-search-bar-container-color` <-> `md.comp.search-bar.container.color`. Both sides are resolved:
//  - a colour is the role it ends in (`var(--mo-sys-color-secondary-container)` <-> `md.sys.color.secondary-container`); a colour that is not a role
//    (`transparent`, a `color-mix`) differs from M3's role;
//  - a shape is the corner step it names (`--mo-sys-shape-corner-large` <-> `md.sys.shape.corner.large`), or the same size in px;
//  - a measure, an elevation, a font size, a line height, a tracking and an opacity is the same number (dp and points are px, rem is 16 px, `var()` and
//    `calc()` are resolved, density's base is the value `:root` declares); a weight is the same number.
// Where M3's data holds an Expressive value for a token (`expressive`), that one counts (skill `material-3`). The tokens M3 marks `[Deprecated]` are left out.
// Roles and numbers are the same in light and dark in M3's data, so one resolved value is compared.
//
// What fails: a difference that is not in scripts/m3-tokens.allow.mjs, and an entry of it that no longer differs exactly as written, so the list only
// shrinks. `--report` (never failing) lists the M3 tokens no `--mo-` token of the theme carries the name of, and `--list` prints today's differences as
// allowlist entries.
// Run: npm run check:m3-tokens. Depends on: postcss. Tested in scripts/check-m3-tokens.test.mjs.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';

const root = fileURLToPath(new URL('..', import.meta.url));
const TOKENS = join(root, 'theme/styles/tokens');
const COPY = join(root, 'docs/m3-tokens');

// The folders in the order the theme imports them: Material's own (global.css) last, so its value wins where two files declare the same name.
const FOLDER_ORDER = ['base', 'ui', 'lists', 'cards', 'layout', 'blocks', 'type', 'material'];

const walk = (dir) =>
  readdirSync(dir)
    .sort()
    .flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });

/** The theme's token files, in the order of the cascade. @returns {string[]} */
export function tokenFiles(dir = TOKENS) {
  const rank = (p) => {
    const i = FOLDER_ORDER.indexOf(relative(dir, p).split('/')[0]);
    return i < 0 ? FOLDER_ORDER.length : i;
  };
  return walk(dir)
    .filter((p) => p.endsWith('.css') && !p.endsWith('registry.css'))
    .sort((a, b) => rank(a) - rank(b));
}

/** The selector list holds `:root` itself (`:where(:root)` is the same element, with no specificity). */
const hasRoot = (selector) => selector.split(',').some((s) => s.trim() === ':root' || s.trim() === ':where(:root)');

/** The `--mo-sys-*` and `--mo-comp-*` tokens declared on `:root` in the given CSS texts: name -> value text. @param {string[]} texts */
export function declaredOnRoot(texts) {
  /** @type {Map<string,string>} */
  const map = new Map();
  for (const css of texts) {
    let tree;
    try {
      tree = postcss.parse(css);
    } catch {
      continue;
    }
    tree.walkDecls(/^--/, (decl) => {
      const rule = decl.parent;
      if (rule?.type !== 'rule' || !hasRoot(rule.selector)) return;
      for (let p = rule.parent; p && p.type !== 'root'; p = p.parent) {
        if (p.type === 'atrule' && p.name !== 'layer') return; // @media, @supports, @container: scoped, not compared
        if (p.type !== 'atrule') return;
      }
      map.set(decl.prop, decl.value.replace(/\s+/g, ' ').trim());
    });
  }
  return map;
}

// ---------- reading the value ----------

const ROLE = /^--mo-sys-color-([a-z0-9-]+)$/;
const STEP = /^--mo-sys-shape-corner-([a-z0-9-]+)$/;
/** An elevation level's shadow token (`--mo-sys-elevation-level2-shadow`, or its `-rest-shadow`) is that level (M3's `md.sys.elevation.levelN`, in dp). */
const LEVEL = /^--mo-sys-elevation-level([0-5])-(?:rest-)?shadow$/;
const ELEVATION_DP = [0, 1, 3, 6, 8, 12];

/**
 * Replaces each var() of a value by the value it holds. A colour role and a shape step stay as a marker (`@role:x`, `@shape:x`), because the site chooses
 * a role's colour and the step is what M3 names. Returns null when a var() has no value and no fallback.
 * @param {string} value @param {Map<string,string>} map @param {Set<string>} roles @param {Set<string>} steps @param {string[]} [seen]
 */
export function resolveVars(value, map, roles, steps, seen = []) {
  let out = '';
  let i = 0;
  while (i < value.length) {
    const at = value.indexOf('var(', i);
    if (at < 0) {
      out += value.slice(i);
      break;
    }
    out += value.slice(i, at);
    let depth = 1;
    let j = at + 4;
    for (; j < value.length && depth; j++) depth += value[j] === '(' ? 1 : value[j] === ')' ? -1 : 0;
    const inner = value.slice(at + 4, j - 1);
    const comma = inner.indexOf(',');
    const name = (comma < 0 ? inner : inner.slice(0, comma)).trim();
    const fallback = comma < 0 ? null : inner.slice(comma + 1).trim();
    let piece = null;
    const role = ROLE.exec(name)?.[1];
    const step = STEP.exec(name)?.[1];
    const level = LEVEL.exec(name)?.[1];
    if (role && roles.has(role)) piece = `@role:${role}`;
    else if (level) piece = `${ELEVATION_DP[Number(level)]}px`;
    else if (step && steps.has(step)) piece = `@shape:${step}`;
    else if (map.has(name) && !seen.includes(name)) piece = resolveVars(map.get(name), map, roles, steps, [...seen, name]);
    if (piece === null && fallback !== null) piece = resolveVars(fallback, map, roles, steps, seen);
    if (piece === null) return null;
    out += piece;
    i = j;
  }
  return out.trim();
}

/** A number with a unit (rem, px, em, %, or none), from a CSS length or calc(). Returns {n, unit} or null when it cannot be read. @param {string} text */
export function evaluate(text) {
  let s = text.trim();
  let pos = 0;
  const ws = () => {
    while (s[pos] === ' ') pos++;
  };
  const num = () => {
    ws();
    const m = /^(-?(?:\d+\.?\d*|\.\d+))(rem|px|em|%|dp|pt)?/.exec(s.slice(pos));
    if (!m) return null;
    pos += m[0].length;
    const n = Number(m[1]);
    const u = m[2] ?? '';
    if (u === 'rem') return { n: n * 16, u: 'px' };
    if (u === 'dp' || u === 'pt') return { n, u: 'px' };
    return { n, u };
  };
  let expr;
  const atom = () => {
    ws();
    if (s.startsWith('calc(', pos)) {
      pos += 5;
      const v = expr();
      ws();
      if (!v || s[pos] !== ')') return null;
      pos++;
      return v;
    }
    if (s[pos] === '(') {
      pos++;
      const v = expr();
      ws();
      if (!v || s[pos] !== ')') return null;
      pos++;
      return v;
    }
    return num();
  };
  const term = () => {
    let a = atom();
    while (a) {
      ws();
      const op = s[pos];
      if (op !== '*' && op !== '/') break;
      pos++;
      const b = atom();
      if (!b) return null;
      if (op === '*') {
        if (a.u && b.u) return null;
        a = { n: a.n * b.n, u: a.u || b.u };
      } else {
        if (b.u || b.n === 0) return null;
        a = { n: a.n / b.n, u: a.u };
      }
    }
    return a;
  };
  expr = () => {
    let a = term();
    while (a) {
      ws();
      const op = s[pos];
      if (op !== '+' && op !== '-') break;
      pos++;
      const b = term();
      if (!b) return null;
      if (a.u !== b.u && a.n !== 0 && b.n !== 0) return null;
      a = { n: op === '+' ? a.n + b.n : a.n - b.n, u: a.u || b.u };
    }
    return a;
  };
  const v = expr();
  ws();
  return v && pos === s.length ? v : null;
}

// ---------- M3's side ----------

/** M3's tokens from the copy: name -> {type, ref, value (Expressive where it differs), shape}. Only `md.sys` and `md.comp`, no `[Deprecated]` group. */
export function loadM3(dir = COPY) {
  const tokens = new Map();
  for (const f of readdirSync(dir).filter((f) => /^md\.(sys|comp)\..*\.json$/.test(f))) {
    const set = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    for (const t of set.tokens) {
      if (!/^md\.(sys|comp)\./.test(t.token) || /\[Deprecated\]/.test(t.group ?? '')) continue;
      const r = t.expressive?.light ?? t.resolved?.light;
      if (!r) continue;
      tokens.set(t.token, {
        token: t.token,
        type: t.type,
        chain: t.chain,
        ref: t.value && typeof t.value === 'object' && 'ref' in t.value ? t.value.ref : null,
        value: r.value,
        unit: r.unit,
        shape: r.shape,
        expressive: Boolean(t.expressive),
      });
    }
  }
  return tokens;
}

/**
 * Where the theme's part is M3 Expressive's, not the baseline's, its name is not M3's yet (the names follow in 0.20.0, plans/2026-11-20-0-19-5-material-3-tokens.md,
 * Names): the theme's `navigation-bar` is Expressive's flexible `nav-bar` (64 dp, the baseline `navigation-bar` says 80), its `navigation-rail` the collapsed
 * `nav-rail` (96 dp), and its *medium* button M3 Expressive's *small* (40 dp). Each pair is [M3's prefix, the theme's prefix]; the baseline set of the same
 * theme name is then not compared.
 */
export const EXPRESSIVE = [
  ['md.comp.nav-bar.', '--mo-comp-navigation-bar-'],
  ['md.comp.nav-rail.collapsed.', '--mo-comp-navigation-rail-'],
  ['md.comp.button.small.', '--mo-comp-button-medium-'],
  // One token each, where the theme's part is the Expressive set's, not the baseline's (batch 7): the menu is Expressive's `menus` (large corners, 44 dp rows; the
  // baseline `menu` says extra-small and 48), the docked search view is the contained style (results in medium corners; the baseline token is the divided style's
  // one container, extra-large), and the side sheet's token is drawn by the modal sheet (16 dp towards the page; the docked token says none).
  ['md.comp.menus.container.shape', '--mo-comp-menu-container-shape'],
  ['md.comp.menus.menu-item.height', '--mo-comp-menu-list-item-container-height'],
  // The standard colours of the same set: `surface-container-low` (the baseline says `surface-container`) and the chosen item on the tertiary container (the baseline: secondary).
  ['md.comp.menus.standard.container.color', '--mo-comp-menu-container-color'],
  ['md.comp.menus.standard.menu-item.selected.container.color', '--mo-comp-menu-list-item-selected-container-color'],
  ['md.comp.menus.standard.menu-item.selected.label-text.color', '--mo-comp-menu-list-item-selected-label-text-color'],
  ['md.comp.search-view.contained.docked.results.shape', '--mo-comp-search-view-docked-container-shape'],
  ['md.comp.sheet.side.docked.modal.container.shape', '--mo-comp-sheet-side-docked-container-shape'],
];
const EXPRESSIVE_THEME_PREFIXES = EXPRESSIVE.map(([, theme]) => theme);

/** The theme's name of an M3 token, or null for a baseline token whose theme name an Expressive set has. */
export const themeName = (m3Name) => {
  const alias = EXPRESSIVE.find(([m3]) => m3Name.startsWith(m3));
  if (alias) return alias[1] + m3Name.slice(alias[0].length).replaceAll('.', '-');
  const plain = '--mo-' + m3Name.slice(3).replaceAll('.', '-');
  return EXPRESSIVE_THEME_PREFIXES.some((p) => plain.startsWith(p)) ? null : plain;
};

const NUMERIC = new Set(['LENGTH', 'ELEVATION', 'OPACITY', 'FONT_SIZE', 'LINE_HEIGHT', 'FONT_TRACKING', 'FONT_WEIGHT']);
const kindOf = (type) =>
  type === 'COLOR'
    ? 'colour'
    : type === 'SHAPE'
      ? 'shape'
      : type === 'OPACITY'
        ? 'opacity'
        : type.startsWith('FONT') || type === 'LINE_HEIGHT'
          ? 'type'
          : 'size';

const fmt = (n) => String(Math.round(n * 1000) / 1000);

/** M3's value as text: `@role:x`, `@shape:x`, a px number, an opacity or a weight, or null when the token is not compared (no role, an axis, a composite …). */
function m3Text(t) {
  if (t.type === 'COLOR') {
    const role = (t.chain ?? []).slice(1).find((c) => /^md\.sys\.color\./.test(c));
    if (role) return `@role:${role.slice('md.sys.color.'.length)}`;
    return null;
  }
  if (t.type === 'SHAPE') {
    // `extra-large.top` is the extra-large step on the top corners only: the same step.
    if (t.ref && /^md\.sys\.shape\.corner\./.test(t.ref)) return `@shape:${t.ref.slice('md.sys.shape.corner.'.length).split('.')[0]}`;
    if (typeof t.value === 'number') return fmt(t.value);
    return null;
  }
  if (NUMERIC.has(t.type) && typeof t.value === 'number') return fmt(t.value);
  return null;
}

/** The theme's value as the same kind of text; `?` + the written value when it cannot be read. */
function themeText(t, value, map, roles, steps, cornerPx) {
  let resolved = resolveVars(value, map, roles, steps);
  if (resolved === null) return '?' + value;
  // A width that is capped to the screen (`min(22.5rem, calc(100vw - 3.5rem))`) is its cap on any screen wide enough to reach it.
  resolved = resolved.replace(/min\(([^,()]+),\s*calc\([^()]*(?:vw|vh|%)[^()]*\)\)/g, '$1');
  // A role at an opacity over nothing is the role; M3 holds the opacity in its own token (the drag handle's 0.4).
  if (t.type === 'COLOR') resolved = resolved.replace(/^color-mix\(in srgb, (@role:[a-z0-9-]+) [\d.]+%, transparent\)$/, '$1');
  if (t.type === 'COLOR')
    return /^@role:[a-z0-9-]+$/.test(resolved) ? resolved : resolved === 'transparent' ? 'transparent' : '?' + resolved;
  if (t.type === 'SHAPE') {
    if (/^@shape:[a-z0-9-]+$/.test(resolved)) return resolved;
    const e = evaluate(resolved);
    if (!e) return '?' + resolved;
    if (e.u === '%' && e.n >= 50) return '@shape:full';
    if (e.u === 'px' || e.n === 0) return e.u === 'px' && e.n >= 999 ? '@shape:full' : fmt(e.n);
    return '?' + resolved;
  }
  const e = evaluate(resolved.replace(/@shape:[a-z0-9-]+/g, (m) => String(cornerPx.get(m.slice(7)) ?? m)));
  if (!e) return '?' + resolved;
  if (t.type === 'OPACITY') return fmt(e.u === '%' ? e.n / 100 : e.n);
  if (t.type === 'FONT_WEIGHT') return e.u ? '?' + resolved : fmt(e.n);
  return e.u === 'px' || e.n === 0 ? fmt(e.n) : '?' + resolved;
}

/** Every difference: {token, kind, theme, m3, m3Token}, sorted by token. @param {Map<string,string>} map @param {Map<string,any>} m3 */
export function compare(map, m3) {
  const roles = new Set([...m3.keys()].filter((n) => n.startsWith('md.sys.color.')).map((n) => n.slice('md.sys.color.'.length)));
  const steps = new Set(
    [...m3.keys()].filter((n) => /^md\.sys\.shape\.corner\.[a-z0-9-]+$/.test(n)).map((n) => n.slice('md.sys.shape.corner.'.length)),
  );
  const cornerPx = new Map([...steps].map((s) => [s, m3.get(`md.sys.shape.corner.${s}`).value]).filter(([, v]) => typeof v === 'number'));
  const out = [];
  for (const t of m3.values()) {
    const name = themeName(t.token);
    if (!name || !map.has(name)) continue;
    const want = m3Text(t);
    if (want === null) continue;
    const have = themeText(t, map.get(name), map, roles, steps, cornerPx);
    // A corner step and a size in px (M3 writes some corners as 8 dp) are the same when the step is that size.
    const px = (x) => (x.startsWith('@shape:') ? cornerPx.get(x.slice(7)) : Number(x));
    if (have !== want && /^@shape:|^[\d.]+$/.test(have) && /^@shape:|^[\d.]+$/.test(want) && px(have) === px(want)) continue;
    if (have !== want) out.push({ token: name, kind: kindOf(t.type), theme: have, m3: want, m3Token: t.token });
  }
  return out.sort((a, b) => (a.token < b.token ? -1 : 1));
}

/** The M3 tokens (of the kinds compared) whose `--mo-` name the theme does not declare on :root. */
export function missing(map, m3) {
  return [...m3.values()].filter((t) => m3Text(t) !== null && themeName(t.token) && !map.has(themeName(t.token))).map((t) => t.token);
}

// ---------- the allowlist ----------

export const CLASSES = ['deviation', 'editor', 'wcag', 'fix'];

/** The problems of a comparison against the allowlist: a difference that is not allowed, an entry that no longer differs as written, a bad entry. */
export function judge(found, allow) {
  const problems = [];
  const key = (e) => `${e.token}`;
  const allowed = new Map();
  for (const e of allow) {
    if (!e.token || !e.reason || !CLASSES.includes(e.class) || (e.class === 'fix' && !Number.isInteger(e.batch)))
      problems.push(
        `bad allowlist entry ${JSON.stringify(e.token)}: it needs token, class (${CLASSES.join(', ')}), reason and, for fix, the batch number`,
      );
    if (allowed.has(key(e))) problems.push(`allowlist entry twice: ${e.token}`);
    allowed.set(key(e), e);
  }
  const seen = new Set();
  for (const f of found) {
    const e = allowed.get(key(f));
    if (!e) problems.push(`${f.token} (${f.kind}): theme ${f.theme}, Material 3 ${f.m3} (${f.m3Token})`);
    else if (e.theme !== f.theme || e.m3 !== f.m3)
      problems.push(`${f.token}: now theme ${f.theme}, Material 3 ${f.m3}; the allowlist says theme ${e.theme}, Material 3 ${e.m3}`);
    seen.add(key(f));
  }
  for (const e of allow) if (!seen.has(key(e))) problems.push(`${e.token}: on the allowlist but no longer differs; remove the entry`);
  return problems;
}

// ---------- run ----------

async function main() {
  const args = process.argv.slice(2);
  if (!existsSync(COPY)) {
    console.error('check:m3-tokens: docs/m3-tokens/ is missing (node scripts/m3-tokens.mjs docs/m3-tokens makes it).');
    process.exit(1);
  }
  const map = declaredOnRoot(tokenFiles().map((f) => readFileSync(f, 'utf8')));
  const m3 = loadM3();
  const found = compare(map, m3);
  if (args.includes('--report')) {
    const names = missing(map, m3);
    console.log(`${names.length} Material 3 tokens have no --mo- token of that name on :root (they are not compared):`);
    console.log(names.join('\n'));
    return;
  }
  if (args.includes('--list')) {
    for (const f of found)
      console.log(
        `  { token: '${f.token}', theme: ${JSON.stringify(f.theme)}, m3: ${JSON.stringify(f.m3)}, class: 'fix', batch: 0, reason: '' },`,
      );
    return;
  }
  const { allow } = await import('./m3-tokens.allow.mjs');
  const problems = judge(found, allow);
  if (problems.length) {
    console.error(`check:m3-tokens: ${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`check:m3-tokens: ${map.size} theme tokens read, ${found.length} known differences, no new one.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
