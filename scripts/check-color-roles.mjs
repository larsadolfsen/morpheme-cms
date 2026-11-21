// Only Material 3's colour roles are used (spec `docs/superpowers/specs/2026-11-20-section-colours-design.md`, *The check*).
// In theme/styles/**/*.css, src/*.css and the CSS in src/*.tsx it fails on
//   mix            a color-mix() that is not a state layer (its percentage is one of the --mo-sys-state-*-opacity tokens, any second
//                  colour), not a shadow (a *shadow property, or a file of the elevation shadows: tokens/ui/ref.css and
//                  tokens/material/ref.css, which M3 leaves to the platform) and not the scrim token's own declaration;
//   role-redeclare a colour role (--mo-sys-color-<role>) declared as anything but another variable (one var() reference, or one with another as its fallback).
//   section-roles inside a section's scope (a rule whose selector names .mo-text-section or data-section-…) a role may be declared only as the
//                  role of M3's pair for that kind of section (SECTION_ROLES: Primary, Secondary and Tertiary are their container and its on-colour,
//                  an image the inverse set); spec docs/superpowers/specs/2026-11-21-section-colours-m3-roles-design.md.
// The third rule of the spec, a fixed colour value outside the token reference files, is `check:colors` (kind `fixed-colour`, same
// scope, its own allowlist), so it is not counted twice here.
// The allowlist (scripts/color-roles.allow.mjs) has one entry per file and rule: { file, rule, max, why }. A finding above `max`, or a
// file with fewer findings than `max`, fails, so the list only shrinks. Run by npm run check (check:source).
// `node scripts/check-color-roles.mjs --list` prints the current counts as allowlist lines. Tested in check-color-roles.test.mjs.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

/** The colour roles' names, from the package's own list (defaults/colors.ts). */
export function roleNames(colorsTs) {
  return new Set(
    [...colorsTs.slice(colorsTs.indexOf('export const colorRoles')).matchAll(/^\s*'?([a-z-]+)'?:\s*'[a-zA-Z]+',?$/gm)].map((m) => m[1]),
  );
}

/** Files the check reads. @param {string[]} paths */
export function inScope(paths) {
  return paths.filter((f) => (/^theme\/styles\/.*\.css$/.test(f) || /^src\/[^/]*\.(css|tsx)$/.test(f)) && !/\.test\./.test(f));
}

// The elevation shadows are the platform's (the elevation spec): their files may mix the shadow colour freely.
const SHADOW_FILES = /^theme\/styles\/tokens\/(ui|material)\/ref\.css$/;

/** The text with its comments blanked (same length, so offsets stay). */
function blank(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}

/** Every color-mix( call: { start, text } (balanced parentheses). */
function mixes(text) {
  const out = [];
  for (let i = text.indexOf('color-mix('); i !== -1; i = text.indexOf('color-mix(', i + 1)) {
    let depth = 0;
    let j = i + 'color-mix'.length;
    for (; j < text.length; j++) {
      if (text[j] === '(') depth++;
      else if (text[j] === ')' && --depth === 0) break;
    }
    out.push({ start: i, text: text.slice(i, j + 1) });
  }
  return out;
}

/** The property a position in the text belongs to ('' if none): the words after the last `;`, `{`, `}` or backtick. */
function propertyAt(text, pos) {
  const before = text.slice(0, pos);
  const cut = Math.max(before.lastIndexOf(';'), before.lastIndexOf('{'), before.lastIndexOf('}'), before.lastIndexOf('`'));
  return (/^\s*([\w-]+)\s*:/.exec(before.slice(cut + 1)) ?? [])[1] ?? '';
}

const lineOf = (text, pos) => text.slice(0, pos).split('\n').length;
/** The pairs of a section's roles (design 2021-11-21): the role a part reads → the M3 role it takes, per kind of section. Tested against docs/m3-tokens. */
export const SECTION_ROLES = {
  ...Object.fromEntries(
    ['primary', 'secondary', 'tertiary'].map((c) => [
      c,
      { surface: `${c}-container`, 'on-surface': `on-${c}-container`, 'on-surface-variant': `on-${c}-container` },
    ]),
  ),
  image: {
    ...Object.fromEntries(
      [
        'on-surface',
        'on-surface-variant',
        'outline',
        'outline-variant',
        'on-primary-container',
        'on-secondary-container',
        'on-tertiary-container',
      ].map((r) => [r, 'inverse-on-surface']),
    ),
    ...Object.fromEntries(['primary', 'secondary', 'tertiary'].map((r) => [r, 'inverse-primary'])),
    ...Object.fromEntries(['on-primary', 'on-secondary', 'on-tertiary'].map((r) => [r, 'inverse-surface'])),
    ...Object.fromEntries(
      [
        'surface',
        'surface-bright',
        'surface-dim',
        'surface-container-lowest',
        'surface-container-low',
        'surface-container',
        'surface-container-high',
        'surface-container-highest',
        'primary-container',
        'secondary-container',
        'tertiary-container',
      ].map((r) => [r, 'inverse-surface']),
    ),
  },
};

/** The selector split at its top-level commas. */
const parts = (selector) => {
  const out = [];
  let depth = 0;
  let from = 0;
  for (let i = 0; i < selector.length; i++) {
    if (selector[i] === '(' || selector[i] === '[') depth++;
    else if (selector[i] === ')' || selector[i] === ']') depth--;
    else if (selector[i] === ',' && depth === 0) {
      out.push(selector.slice(from, i));
      from = i + 1;
    }
  }
  return [...out, selector.slice(from)];
};

/** The kind of section one selector is the scope of: 'primary' | 'secondary' | 'tertiary' | 'image', 'mixed' when it names more than one, '' when it is no section's scope. */
export function sectionKind(selector) {
  if (!/mo-text-section|data-section-(color|picture)/.test(selector)) return '';
  const kinds = new Set();
  for (const m of selector.matchAll(/mo-is-(primary|secondary|tertiary)\b|data-section-color='(primary|secondary|tertiary)'/g))
    kinds.add(m[1] ?? m[2]);
  if (/mo-has-image|data-section-picture/.test(selector)) kinds.add('image');
  return kinds.size === 0 ? '' : kinds.size === 1 ? [...kinds][0] : 'mixed';
}

const SIMPLE_VAR = /^var\(\s*--[\w-]+\s*(,\s*var\(\s*--[\w-]+\s*\)\s*)?\)$/;

/**
 * The findings of one file: [{ rule, line, text }].
 * @param {string} file repo-relative path @param {string} source @param {Set<string>} roles
 */
export function findings(file, source, roles) {
  const text = blank(source);
  const out = [];
  const roleDecl = new RegExp(`(--mo-sys-color-(${[...roles].join('|')}))\\s*:\\s*([^;}]*)`, 'g');
  const inRole = [];
  for (const m of text.matchAll(roleDecl)) {
    const value = m[3].replace(/\s+/g, ' ').trim();
    if (!SIMPLE_VAR.test(value)) {
      out.push({ rule: 'role-redeclare', line: lineOf(text, m.index), text: `${m[1]}: ${value}` });
      inRole.push([m.index, m.index + m[0].length]);
    }
  }
  // A role in a section's scope is the role of M3's pair for that kind of section.
  for (const block of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const kinds = parts(block[1]).map((p) => sectionKind(p.trim()));
    if (!kinds.some(Boolean)) continue;
    for (const d of block[2].matchAll(new RegExp(`--mo-sys-color-(${[...roles].join('|')})\\s*:\\s*([^;]*)`, 'g'))) {
      const value = d[2].replace(/\s+/g, ' ').trim();
      const ok = kinds.every(
        (k) => k && k !== 'mixed' && SECTION_ROLES[k]?.[d[1]] && value === `var(--mo-sys-color-${SECTION_ROLES[k][d[1]]})`,
      );
      if (!ok)
        out.push({
          rule: 'section-roles',
          line: lineOf(text, block.index),
          text: `--mo-sys-color-${d[1]}: ${value} in ${block[1].trim().replace(/\s+/g, ' ').slice(0, 80)}`,
        });
    }
  }
  for (const mix of mixes(text)) {
    if (inRole.some(([a, b]) => mix.start >= a && mix.start < b)) continue; // counted once, with its role
    const flat = mix.text.replace(/\s+/g, ' ');
    const property = propertyAt(text, mix.start);
    if (/-opacity\b/.test(flat) && /--mo-sys-state-[\w-]*opacity/.test(flat)) continue; // a state layer
    if (/shadow/.test(property) || SHADOW_FILES.test(file)) continue; // the platform's
    if (property === '--mo-sys-color-scrim-overlay') continue; // the scrim token names M3's 32 %
    out.push({ rule: 'mix', line: lineOf(text, mix.start), text: flat });
  }
  return out;
}

/** Compares counts ({ 'file|rule': n }) with the allowlist. Returns the problems (fail). */
export function compare(counts, allow) {
  const problems = [];
  const entries = new Map();
  for (const e of allow) {
    const key = `${e.file}|${e.rule}`;
    if (!e.why || !String(e.why).trim() || !Number.isInteger(e.max) || e.max < 1) {
      problems.push(`${key}: an allowlist entry needs "max" (a whole number, 1 or more) and a "why".`);
      continue;
    }
    if (entries.has(key)) problems.push(`${key}: two allowlist entries for one file and rule.`);
    entries.set(key, e);
  }
  for (const [key, n] of Object.entries(counts)) {
    const [file, rule] = key.split('|');
    const max = entries.get(key)?.max;
    if (max === undefined)
      problems.push(
        rule === 'mix'
          ? `${file}: ${n} color-mix() that is not a state layer or a shadow. Use a colour role of Material 3 (or a state-layer opacity token), or add an allowlist entry with its reason.`
          : rule === 'section-roles'
            ? `${file}: ${n} role in a section's scope that is not M3's pair for that section (SECTION_ROLES in scripts/check-color-roles.mjs).`
            : `${file}: ${n} colour role declared as something other than another variable. A role is another role (a var() reference to a --mo-sys role), never a mix or a value.`,
      );
    else if (n > max) problems.push(`${key}: ${n} findings, the allowlist says at most ${max}. Fix the new one.`);
    else if (n < max) problems.push(`${key}: ${n} findings, the allowlist says ${max}. Lower "max" to ${n} (the list only shrinks).`);
  }
  for (const key of entries.keys()) if (!(key in counts)) problems.push(`${key}: an allowlist entry that no longer matches. Remove it.`);
  return problems;
}

export function run() {
  const paths = inScope(execSync('git ls-files', { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean));
  const roles = roleNames(readFileSync(root + 'defaults/colors.ts', 'utf8'));
  const counts = {};
  const where = {};
  for (const file of paths) {
    for (const f of findings(file, readFileSync(root + file, 'utf8'), roles)) {
      const key = `${file}|${f.rule}`;
      counts[key] = (counts[key] ?? 0) + 1;
      (where[key] ??= []).push(`${file}:${f.line}: ${f.text}`);
    }
  }
  return { counts, where };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { counts, where } = run();
  if (process.argv.includes('--list')) {
    for (const [key, n] of Object.entries(counts)) {
      const [file, rule] = key.split('|');
      console.log(`  { file: '${file}', rule: '${rule}', max: ${n}, why: '' },`);
    }
    process.exit(0);
  }
  const { allow } = await import('./color-roles.allow.mjs');
  const problems = compare(counts, allow);
  if (problems.length) {
    console.error(`check:color-roles: ${problems.length} problem(s)\n${problems.join('\n')}`);
    for (const p of problems) {
      const key = /^([^:]+)\|(mix|role-redeclare|section-roles):/.exec(p)?.[0].slice(0, -1);
      for (const w of where[key] ?? []) console.error(`  ${w}`);
    }
    process.exit(1);
  }
  console.log(`Colour roles: only Material 3's roles are used (${allow.length} allowlisted files, each with its reason).`);
}
