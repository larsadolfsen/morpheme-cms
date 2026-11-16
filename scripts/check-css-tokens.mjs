// Owner rule (16 Nov 2026): every shared CSS custom property of the CMS is a `--mo-…` token. The CMS owns the name, the theme sets its value once
// on :root, and a block, an app block or a section may override the same name on its own root element. Nobody makes a second name for a value
// that has a `--mo-` name, and nothing unprefixed is declared on :root, html or body: Tailwind shares the page's namespace, and an app or theme
// that declares the same name as ours would silently override it (docs/css-tokens.md).
//
// This check fails on:
//  1. a custom property declared on :root, html or body (any selector whose subject is one of them) in theme/, src/*.css and starter/ that does not
//     start with `--mo-` (or `--tw-`, or a Tailwind theme namespace inside `@theme`, listed with reasons in scripts/css-tokens-allowlist.json);
//     until the rename has landed it counts mode: a file may have as many unprefixed names as in the list (never more), a new file none;
//  2. a custom property declared by an app or a theme (folders `apps/*` and `themes/*` under `src/` of the demo and the starter, or of the site
//     given with `--site <folder>`) with a name the CMS declares (a collision), or declared on :root, html or body without the prefix.
// Run: npm run check:css-tokens; `--list` prints the current counts as the allowlist's `files`.
// Depends on: git (lists the files), postcss.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';

const root = fileURLToPath(new URL('..', import.meta.url));

/** The subject of a selector is :root, html or body (with a class, an attribute or a pseudo-class on it), not something inside them. */
const ON_ROOT = /^(?::root|html|body)(?:\[[^\]]*\]|:[a-z-]+(?:\([^)]*\))?|\.[\w-]+)*$/i;
export const isRootSelector = (selector) => selector.split(',').some((s) => ON_ROOT.test(s.trim()));

/** The CSS inside the `<style>` elements of an .astro or .html file (the whole text of a .css file). @param {string} file @param {string} text */
export function cssOf(file, text) {
  if (/\.css$/.test(file)) return text;
  return [...text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
}

/** The custom properties a stylesheet declares: `root` (on :root, html or body), `theme` (in a Tailwind `@theme`), `all` (anywhere). @param {string} css */
export function declared(css) {
  const out = { root: new Set(), theme: new Set(), all: new Set() };
  let tree;
  try {
    tree = postcss.parse(css);
  } catch {
    return out;
  }
  tree.walkDecls(/^--/, (decl) => {
    const name = decl.prop;
    out.all.add(name);
    const parent = decl.parent;
    if (parent?.type === 'atrule' && parent.name === 'theme') out.theme.add(name);
    else if (parent?.type === 'rule' && isRootSelector(parent.selector)) out.root.add(name);
  });
  return out;
}

/** @param {string} name @param {{ patterns: {pattern: string, why: string}[] }} allow */
export const allowedName = (name, allow) =>
  name.startsWith('--mo-') ||
  allow.names.some(({ pattern }) => (pattern.endsWith('*') ? name.startsWith(pattern.slice(0, -1)) : name === pattern));

/**
 * @param {{ cms: Record<string, string>, extensions: Record<string, string>, allow: any }} input `cms` and `extensions` map a file's path to its CSS
 * (an extension is a file of an app or a theme). `allow`: { names: [{ pattern, why }] (only for names in `@theme`, and `--tw-*`), files: { path: { max } }, why }.
 * @returns {string[]} the problems
 */
export function findProblems({ cms, extensions, allow }) {
  const problems = [];
  const cmsNames = new Set();
  for (const css of Object.values(cms)) for (const n of declared(css).all) cmsNames.add(n);
  for (const [file, css] of Object.entries(cms)) {
    const d = declared(css);
    const unprefixed = new Set();
    for (const n of d.root) if (!allowedName(n, { names: allow.names.filter((a) => a.pattern.startsWith('--tw-')) })) unprefixed.add(n);
    for (const n of d.theme) if (!allowedName(n, allow)) unprefixed.add(n);
    const max = allow.files?.[file]?.max ?? 0;
    if (unprefixed.size > max)
      problems.push(
        `${file}: ${unprefixed.size} unprefixed custom propert${unprefixed.size === 1 ? 'y' : 'ies'} on :root, html or body, ${max} allowed. A shared value is a --mo-… token (docs/css-tokens.md); a value only one block uses is declared on that block, not on :root. New: ${[...unprefixed].slice(0, 8).join(', ')}.`,
      );
  }
  for (const [file, css] of Object.entries(extensions)) {
    const d = declared(css);
    for (const n of d.all)
      if (cmsNames.has(n))
        problems.push(
          `${file}: declares ${n}, a name the CMS declares. Use the CMS's value (override ${n.startsWith('--mo-') ? n : 'its --mo-… name'} on your block's root element) or pick a name of your own.`,
        );
    for (const n of d.root)
      if (!cmsNames.has(n) && !allowedName(n, { names: allow.names.filter((a) => a.pattern.startsWith('--tw-')) }))
        problems.push(`${file}: declares ${n} on :root, html or body. Nothing unprefixed on :root (docs/css-tokens.md).`);
  }
  return problems;
}

/** The counts per file (distinct unprefixed names on the root or in @theme), for the allowlist. */
export function counts(cms, allow) {
  const out = {};
  for (const [file, css] of Object.entries(cms)) {
    const d = declared(css);
    const tw = { names: allow.names.filter((a) => a.pattern.startsWith('--tw-')) };
    const n = new Set([...d.root].filter((x) => !allowedName(x, tw)));
    for (const x of d.theme) if (!allowedName(x, allow)) n.add(x);
    if (n.size) out[file] = { max: n.size };
  }
  return out;
}

const read = (path) => readFileSync(path, 'utf8');

/** CMS files: theme/**, src/*.css, starter/** (stylesheets and `<style>` of .astro). */
function cmsFiles() {
  const listed = execFileSync('git', ['ls-files', 'theme', 'src', 'starter'], { cwd: root, encoding: 'utf8' })
    .split('\n')
    .filter((f) => (/^src\/[^/]+\.css$/.test(f) || /^(theme|starter)\//.test(f)) && /\.(css|astro)$/.test(f));
  return Object.fromEntries(listed.map((f) => [f, cssOf(f, read(root + f))]).filter(([, css]) => css));
}

/** Apps' and themes' files under `<site>/src/apps/*` and `<site>/src/themes/*`. */
function extensionFiles(sites) {
  const out = {};
  const walk = (dir, base) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path, base);
      else if (/\.(css|astro)$/.test(name)) {
        const css = cssOf(name, read(path));
        if (css) out[path.replace(root, '')] = css;
      }
    }
  };
  for (const site of sites)
    for (const kind of ['apps', 'themes']) {
      const dir = join(site, 'src', kind);
      if (existsSync(dir)) for (const id of readdirSync(dir)) if (statSync(join(dir, id)).isDirectory()) walk(join(dir, id), dir);
    }
  return out;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const allow = JSON.parse(read(new URL('css-tokens-allowlist.json', import.meta.url)));
  const cms = cmsFiles();
  if (process.argv.includes('--list')) {
    console.log(JSON.stringify(counts(cms, allow), null, 2));
    process.exit(0);
  }
  const at = process.argv.indexOf('--site');
  const sites = at > 0 ? [process.argv[at + 1]] : [join(root, 'demo'), join(root, 'starter')];
  const problems = findProblems({ cms, extensions: extensionFiles(sites), allow });
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  const files = counts(cms, allow);
  const total = Object.values(files).reduce((n, f) => n + f.max, 0);
  for (const [file, { max }] of Object.entries(allow.files ?? {}))
    if ((files[file]?.max ?? 0) < max)
      console.log(
        `check:css-tokens: ${file} has ${files[file]?.max ?? 0} of ${max} allowed: lower it in scripts/css-tokens-allowlist.json.`,
      );
  console.log(
    `check:css-tokens: ${total} unprefixed custom properties left in ${Object.keys(files).length} files (count mode); none new, no collision.`,
  );
}
