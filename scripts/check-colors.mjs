// Colour discipline for everything the package ships: colours come from Material 3's roles (the theme's --mo-* tokens), never from
// a fixed value. Static and fast (no browser); run by npm run check. `node scripts/check-colors.mjs --report` prints every finding
// grouped by cause (also the ones the allow-list lets through, with its reason) and exits 0.
//
// Fails on:
//   fixed-colour   a hex, rgb()/hsl()/oklch()/hwb()/lab() literal or a named colour (not transparent, currentColor)
//   palette-class  a Tailwind palette class (bg-white, text-gray-600, ring-blue-500, bg-black/50) or bg-[#…]
//   undefined-role a var(--mo-…) that nothing defines and that has no fallback
//   role-pair      a text role on a background role that is not its M3 pair (on-surface on primary, outline as text …)
//   state-layer    a state layer (color-mix … N%, transparent) that is not one of M3's: 8, 10, 12, 16, 38
// An allow-list entry (scripts/check-colors.allow.mjs) needs a reason; keep it small.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { allow } from './check-colors.allow.mjs';

const root = new URL('../', import.meta.url).pathname;
const report = process.argv.includes('--report');

const files = execSync('git ls-files', { cwd: root, encoding: 'utf8' })
  .split('\n')
  .filter((f) => /\.(css|tsx?|mjs|js|astro|svg)$/.test(f))
  .filter((f) => !/^(release-notes|docs|scripts|node_modules|\.github|\.claude|\.agents)\//.test(f))
  .filter((f) => !/(\.test\.|\.d\.ts$|\/fixtures?\/|package-lock)/.test(f));

const named = '(?:white|black|red|green|blue|yellow|orange|purple|pink|gray|grey|brown|cyan|magenta|silver|navy|gold)';
const palette = '(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)';
const utilities = '(?:bg|text|border|border-[xytblrse]|ring|ring-offset|fill|stroke|from|to|via|outline|divide|shadow|decoration|accent|caret|placeholder)';
const re = {
  hex: /#[0-9a-fA-F]{3,8}(?![\w-])/g,
  fn: /(?<![\w-])(?:rgba?|hsla?|oklch|oklab|hwb|lab|lch)\(/g,
  named: new RegExp(`(?<![\\w\\-.#@$/'"\`])${named}(?![\\w-])`, 'g'),
  palette: new RegExp(`(?<![\\w-])${utilities}-(?:white|black|${palette}-\\d{2,3})(?:/\\d+)?(?![\\w-])|(?<![\\w-])${utilities}-\\[(?:#|rgb|hsl|oklch)`, 'g'),
};

// Roles: M3's, from the package's own list, plus the ones the CSS defines itself.
const roleFile = readFileSync(root + 'defaults/colors.ts', 'utf8');
const textOf = new Map(files.map((f) => [f, readFileSync(root + f, 'utf8')]));
const defined = new Set();
for (const t of textOf.values()) for (const m of t.matchAll(/(--mo-[\w-]+)\s*:/g)) defined.add(m[1]);
// The roles' own list (defaults/colors.ts colorRoles): the theme writes each one as --mo-<name> from the site's colours.
const generated = new Set(
  [...roleFile.slice(roleFile.indexOf('export const colorRoles')).matchAll(/^\s*'?([a-z-]+)'?:\s*'[a-zA-Z]+',?$/gm)].map((m) => '--mo-' + m[1]),
);
const roleNames = [...defined, ...generated];

// M3's pairs: the text role that belongs on each background role.
const pairs = {};
for (const c of ['primary', 'secondary', 'tertiary', 'error']) {
  pairs[c] = [`on-${c}`];
  pairs[`${c}-container`] = [`on-${c}-container`];
}
for (const c of ['primary', 'secondary', 'tertiary']) {
  for (const f of [`${c}-fixed`, `${c}-fixed-dim`]) pairs[f] = [`on-${c}-fixed`, `on-${c}-fixed-variant`];
}
for (const s of ['surface', 'surface-dim', 'surface-bright', 'surface-variant', 'surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high', 'surface-container-highest', 'background']) {
  pairs[s] = ['on-surface', 'on-surface-variant', 'on-background', 'primary', 'secondary', 'tertiary', 'error', 'inverse-surface'];
}
pairs['inverse-surface'] = ['inverse-on-surface', 'inverse-primary'];
const isOn = (r) => /^(on-|inverse-on-)/.test(r);
// A role that is never text (a surface, an outline).
const notText = (r) => /^(surface|background|outline|scrim|shadow|inverse-surface)/.test(r) || /-container(-(lowest|low|high|highest))?$/.test(r) || /-fixed(-dim)?$/.test(r);

// The block variables are aliases of the roles (theme/styles/base.css).
const alias = { 'block-text': 'on-surface', 'block-muted': 'on-surface-variant', 'block-accent': 'primary', 'block-on-accent': 'on-primary', 'block-primary': 'primary', 'block-on-primary': 'on-primary', 'block-secondary': 'secondary', 'block-on-secondary': 'on-secondary', 'block-tertiary': 'tertiary', 'block-on-tertiary': 'on-tertiary', 'block-surface': 'surface-container-lowest', 'block-tint': 'surface-container-high', 'block-line': 'outline-variant' };

const problems = [];
const add = (kind, file, line, text, fix) => {
  const entry = allow.find((a) => a.kind === kind && a.file.test(file) && a.line.test(text));
  problems.push({ kind, file, line, text: text.trim().slice(0, 150), fix, allowed: entry?.reason });
};

// Comments are not colours; neither are the data: URLs of icons (their fill is a mask) nor the words of a text.
function strip(file, source) {
  let s = source.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  if (/\.(tsx?|mjs|js|astro)$/.test(file)) s = s.replace(/(^|[\s;,{(])\/\/.*$/gm, '$1');
  return s.replace(/url\(\s*["']?data:[^)]*\)/g, 'url()');
}

for (const file of files) {
  const lines = strip(file, textOf.get(file)).split('\n');
  const css = /\.css$/.test(file);
  lines.forEach((line, i) => {
    const n = i + 1;
    if (!line.trim()) return;
    if (css || /(?:color|fill|stroke|background|shadow|style|border|gradient|outline|filter|var\()/.test(line)) {
      for (const m of line.matchAll(re.hex)) add('fixed-colour', file, n, line, `${m[0]}: a role (--mo-…)`);
      for (const m of line.matchAll(re.fn)) add('fixed-colour', file, n, line, `${m[0]}…): a role, or color-mix of roles`);
      if (css || /(?:style|color|background|fill|stroke)/.test(line)) for (const m of line.matchAll(re.named)) add('fixed-colour', file, n, line, `${m[0]}: a role`);
    }
    for (const m of line.matchAll(re.palette)) add('palette-class', file, n, line, `${m[0]}: the role's class (bg-surface, text-on-surface …)`);
    if (!/^src\/i18n\//.test(file))
      for (const m of line.matchAll(/var\((--mo-[\w-]+)\s*([,)])/g)) {
        if (m[2] === ')' && !roleNames.includes(m[1]) && !/^--mo-(elevation|space|shape)-$/.test(m[1])) add('undefined-role', file, n, line, `${m[1]} is defined nowhere`);
      }
    if (/hover|pressed|focus|drag|disabled/.test(line))
      for (const m of line.matchAll(/color-mix\(in srgb,\s*[^,]+?\s(\d+(?:\.\d+)?)%\s*,\s*transparent\)/g)) {
      if (![8, 10, 12, 16, 38].includes(Number(m[1]))) add('state-layer', file, n, line, `${m[1]}%: M3's layers are 8 (hover), 10 (focus, pressed), 16 (dragged), 12 and 38 (disabled)`);
    }
  });

  // Role pairs: a text colour and a background in one CSS rule, or in one class string.
  if (css) {
    const flat = lines.join('\n');
    for (const m of flat.matchAll(/\{([^{}]*)\}/g)) {
      const body = m[1];
      const bg = body.match(/(?:^|[;\s])background(?:-color)?\s*:\s*([^;]+)/);
      const fg = body.match(/(?:^|[;\s])color\s*:\s*([^;]+)/);
      if (!bg || !fg) continue;
      const b = roleOf(bg[1]);
      const f = roleOf(fg[1]);
      if (!b || !f) continue;
      checkPair(file, flat.slice(0, m.index).split('\n').length, f, b, body.replace(/\s+/g, ' '));
    }
  } else if (/\.(tsx|astro)$/.test(file)) {
    const t = lines.join('\n');
    for (const m of t.matchAll(/(["'`])((?:(?!\1)[^\n]){0,400}?)\1/g)) {
      const s = m[2];
      const b = s.match(/(?:^|\s)(?:[\w-]+:)*bg-((?:on-|inverse-)?[a-z-]+)(?=\s|$)/g);
      const f = s.match(/(?:^|\s)(?:[\w-]+:)*text-((?:on-|inverse-)?[a-z-]+)(?=\s|$)/g);
      if (!b || !f || b.length !== 1 || f.length !== 1) continue;
      const strip2 = (x) => x.trim().replace(/^(?:[\w-]+:)*(?:bg|text)-/, '');
      if (/^[\w-]+:/.test(b[0].trim()) || /^[\w-]+:/.test(f[0].trim())) continue;
      const bgRole = strip2(b[0]);
      const fgRole = strip2(f[0]);
      if (!(bgRole in pairs) && !isOn(bgRole)) continue;
      if (/^(xs|sm|base|lg|xl|\dxl|center|left|right|start|end|title|body|label|headline|display|section|wrap|nowrap|balance|pretty|ellipsis|clip)/.test(fgRole)) continue;
      checkPair(file, t.slice(0, m.index).split('\n').length, fgRole, bgRole, s);
    }
  }
}

// The role a colour value names: var(--mo-x), an alias, or either as the fallback of a component variable.
function roleOf(value) {
  const v = value.trim();
  let m = /^var\((--[\w-]+)\)$/.exec(v) || /^var\(--[\w-]+,\s*var\((--[\w-]+)\)\)$/.exec(v);
  if (!m) return null;
  const name = m[1].replace(/^--/, '');
  return name.startsWith('mo-') ? name.slice(3) : alias[name] ?? null;
}

function checkPair(file, line, fg, bg, text) {
  if (!(bg in pairs)) return;
  if (pairs[bg].includes(fg)) return;
  const why = notText(fg) ? `${fg} is not a text role` : isOn(fg) ? `${fg} does not belong on ${bg}; use ${pairs[bg][0]}` : `${fg} on ${bg}`;
  add('role-pair', file, line, text, why);
}

const open = problems.filter((p) => !p.allowed);
if (report) {
  const by = {};
  for (const p of problems) (by[`${p.kind}${p.allowed ? ' (allowed)' : ''}`] ??= []).push(p);
  for (const [k, v] of Object.entries(by)) {
    console.log(`\n## ${k}: ${v.length}`);
    for (const p of v) console.log(`${p.file}:${p.line}: ${p.text}  ->  ${p.fix}${p.allowed ? `  [allowed: ${p.allowed}]` : ''}`);
  }
  process.exit(0);
}
if (open.length) {
  console.error(`${open.length} colour problems (the theme's roles only; an exception goes in scripts/check-colors.allow.mjs with its reason):`);
  for (const p of open) console.error(`${p.file}:${p.line}: ${p.kind}: ${p.fix} (${p.text})`);
  process.exit(1);
}
console.log('Every colour comes from a Material 3 role.');
