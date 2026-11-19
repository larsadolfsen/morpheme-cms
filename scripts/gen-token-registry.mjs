// Writes theme/styles/tokens/<origin>/registry.css: an `@property` rule for each sys and ref token that has a plain default (docs/theme-token-files.md,
// "Registered tokens"). A token registered with a syntax (`<color>`, `<length>`, `<number>`, `<time>`) drops a value that does not fit it, so a theme that sets
// `--mo-sys-color-primary: banana` or `--mo-sys-shape-corner-large: 3 apples` gets today's default instead of a property that is invalid at computed time
// (a plain `var()` with a fallback cannot do it: the faulty value is a valid custom property, so its fallback never applies).
//
// The initial value is the token's own default: the literal in its `:root` rule in the first token folder that declares it (base, then ui, blocks, lists,
// cards, type, material, so a theme that imports only base.css never gets Material's value), and for the colour roles the standard colours (`defaultColors`,
// light mode). A length is written in px because `initial-value` cannot hold a font-relative unit (rem included): the rule would be dropped whole.
//
// A token is registered only when that is safe: one literal `:root` declaration of a single type, no declaration anywhere in the repository that the syntax
// would reject (`none`, `auto`, a list), and no font-relative unit (a registered length is resolved where it is declared, not where it is read).
// Run: node scripts/gen-token-registry.mjs (writes the files); `--check` fails if they are out of date (npm run check:token-registry).
// Depends on: postcss, esbuild (to read defaults/colors.ts), git.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import postcss from 'postcss';

const root = fileURLToPath(new URL('..', import.meta.url));
export const ORIGINS = ['base', 'ui', 'blocks', 'lists', 'cards', 'type', 'material'];
const TOKENS = 'theme/styles/tokens';
/** Plain tokens that stay unregistered on purpose: the breakpoint table (lib/breakpoints.mjs) is read in rem by the Preview, and a registered length computes to px. */
const PLAIN = /^--mo-ref-breakpoint-/;

/** The CSS type a literal default has, with the value to write as `initial-value`: `{ syntax, value }`, or null when the token is not registered. @param {string} v */
export function typeOf(v) {
  const s = v.trim();
  if (
    /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%/]+\)|hsla?\([\d\s.,%/deg]+\)|color-mix\(in srgb, (#[0-9a-f]{3,8}|[a-z]+)( [\d.]+%)?, (#[0-9a-f]{3,8}|[a-z]+)( [\d.]+%)?\))$/i.test(
      s,
    )
  )
    return { syntax: '<color>', value: s };
  let m = /^(-?[\d.]+)(px|rem)$/.exec(s);
  if (m) return { syntax: '<length>', value: `${trim(m[2] === 'rem' ? Number(m[1]) * 16 : Number(m[1]))}px` };
  if (s === '0') return null; // a bare 0 is a number or a length, and the token's readers decide which: not registered
  m = /^(-?[\d.]+)(ms|s)$/.exec(s);
  if (m) return { syntax: '<time>', value: s };
  if (/^-?[\d.]+$/.test(s)) return { syntax: '<number>', value: s };
  return null;
}
const trim = (n) => String(Math.round(n * 1e4) / 1e4);

/** Whether a declaration written anywhere fits a syntax; a `var()`, a function or a keyword that every property accepts is left to the browser. @param {string} syntax @param {string} v */
export function fits(syntax, v) {
  const s = v.trim();
  if (/^(inherit|initial|unset|revert|revert-layer)$/.test(s) || /var\(|calc\(|min\(|max\(|clamp\(|env\(/.test(s)) return true;
  const t = typeOf(s);
  return t !== null && t.syntax === syntax;
}

/** Whether a value uses a unit that depends on the element it is read on (em, ex, ch, lh, %, vw, vh …). @param {string} v */
export const relative = (v) =>
  /\d(em|ex|ch|cap|ic|lh|rlh|vw|vh|vmin|vmax|vi|vb|cq\w+)\b/.test(v) || /\d%/.test(v) || /currentcolor/i.test(v);

function cssFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) out.push(...cssFiles(p));
    else if (p.endsWith('.css') && f.name !== 'registry.css') out.push(p);
  }
  return out;
}

/** Every token's declarations in the token folders: `{ name: { origin: [{ value, rootRule }] } }`. */
function declarations() {
  const found = {};
  for (const o of ORIGINS) {
    for (const file of cssFiles(join(root, TOKENS, o))) {
      postcss.parse(readFileSync(file, 'utf8')).walkDecls(/^--mo-(sys|ref)-/, (d) => {
        const p = d.parent;
        const rootRule =
          p.type === 'rule' && p.parent.type === 'root' && p.selectors.some((s) => /^(:where\(:root\)|:root)$/.test(s.trim()));
        ((found[d.prop] ??= {})[o] ??= []).push({ value: d.value.trim(), rootRule });
      });
    }
  }
  return found;
}

/** Every value any tracked file writes for a name (`--name: value`), to be sure the syntax does not reject one. */
function written(names) {
  const files = execFileSync('git', ['ls-files', 'theme', 'src', 'lib', 'site', 'pages', 'defaults', 'demo', 'starter'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  })
    .split('\n')
    .filter((f) => /\.(css|tsx?|mjs|astro)$/.test(f) && !/\.test\./.test(f));
  const all = {};
  for (const f of files) {
    const text = readFileSync(join(root, f), 'utf8');
    for (const m of text.matchAll(/(--mo-(?:sys|ref)-[a-z0-9-]+)\s*:\s*([^;}\n]+)/g))
      if (names.has(m[1])) (all[m[1]] ??= []).push(m[2].trim());
  }
  return all;
}

/** The standard colours' light values by role name. */
async function standardColors() {
  const out = join(tmpdir(), `morpheme-colors-${process.pid}.mjs`);
  const { build } = await import('esbuild');
  await build({
    entryPoints: [join(root, 'defaults/colors.ts')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: out,
    logLevel: 'error',
  });
  return (await import(pathToFileURL(out).href)).defaultColors.light;
}

/** The registry of every origin: `{ origin: [{ name, syntax, value }] }`. */
export async function registry() {
  const found = declarations();
  const written_ = written(new Set(Object.keys(found)));
  const colors = await standardColors();
  const byOrigin = Object.fromEntries(ORIGINS.map((o) => [o, []]));
  for (const [name, byO] of Object.entries(found)) {
    if (PLAIN.test(name)) continue;
    const origin = ORIGINS.find((o) => byO[o]);
    const roots = byO[origin].filter((d) => d.rootRule);
    if (roots.length !== 1 || relative(roots[0].value)) continue;
    const t = typeOf(roots[0].value);
    if (!t) continue;
    if (!(written_[name] ?? []).every((v) => relative(v) || fits(t.syntax, v))) continue;
    byOrigin[origin].push({ name, ...t });
  }
  // The colour roles are written into the page's <head> by colorsCss (lib/colors.ts), declared in no stylesheet; base.css reads them.
  for (const [role, value] of Object.entries(colors)) {
    const name = `--mo-sys-color-${role}`;
    if (!byOrigin.base.some((x) => x.name === name)) byOrigin.base.push({ name, syntax: '<color>', value });
  }
  for (const o of ORIGINS) byOrigin[o].sort((a, b) => a.name.localeCompare(b.name));
  return byOrigin;
}

const HEAD = `/* Generated by scripts/gen-token-registry.mjs, do not edit (docs/theme-token-files.md, "Registered tokens"). Each token is registered with its type and its default, so a
   value that does not fit the type (a theme's \`banana\` for a colour) is dropped and the default stays. */\n`;

/** The text of one origin's registry.css. @param {{ name: string, syntax: string, value: string }[]} rows */
export function registryCss(rows) {
  return (
    HEAD + rows.map((r) => `@property ${r.name} {\n  syntax: '${r.syntax}';\n  inherits: true;\n  initial-value: ${r.value};\n}\n`).join('')
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const byOrigin = await registry();
  const stale = [];
  let total = 0;
  for (const o of ORIGINS) {
    const rows = byOrigin[o];
    const file = join(root, TOKENS, o, 'registry.css');
    if (rows.length === 0) {
      if (existsSync(file)) stale.push(`${TOKENS}/${o}/registry.css has no token any more: delete it`);
      continue;
    }
    total += rows.length;
    const text = registryCss(rows);
    if (check) {
      if (!existsSync(file) || readFileSync(file, 'utf8') !== text) stale.push(`${TOKENS}/${o}/registry.css is out of date`);
    } else {
      mkdirSync(join(root, TOKENS, o), { recursive: true });
      writeFileSync(file, text);
    }
  }
  if (stale.length > 0) {
    console.error(stale.join('\n') + '\nRun: node scripts/gen-token-registry.mjs, then prettier.');
    process.exit(1);
  }
  console.log(
    `${check ? 'check:token-registry' : 'gen-token-registry'}: ${total} tokens registered in ${ORIGINS.filter((o) => byOrigin[o].length).join(', ')}.`,
  );
}
