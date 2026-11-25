// Contract 8's public import list (docs/superpowers/specs/2026-11-25-public-imports-contract-8-design.md): a theme or an app imports from `@morphemecms/cms` only the
// specifiers of `lib/public-imports.mjs`, which 0.21.1's import map is made from. This check reads `theme/**`, `src/themes/*/**` and `src/apps/*/**` of each site folder
// with esbuild's parser (TypeScript 7 has no JavaScript API; `import` and `export … from`, `import()`, `require()`, `import.meta.glob`; an `.astro` file's frontmatter and `<script>`), and says
//   outside   a `@morphemecms/cms` specifier the list does not allow, with its file, line and the nearest allowed one,
//   virtual   a `virtual:*` import,
//   sandbox   a hook or after-build step that imports anything but its own folder, `@app/self` and the three modules of docs/app-contract.md, "Imports",
//   docs      the "Public imports" section of docs/app-contract.md differing from the lib file.
// `--report` prints it and never fails; without it the run fails on any of them (contract 8).
// Run: npm run check:imports [-- --report] [--site <folder>]… (default: the working directory, then the demo and the starter). Tested in scripts/check-imports.test.mjs.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSync } from 'esbuild';
import { PUBLIC_IMPORTS, SANDBOX_IMPORTS, publicImportOf, stripQuery } from '../lib/public-imports.mjs';

const here = fileURLToPath(new URL('..', import.meta.url));
const CMS = '@morphemecms/cms';
const CODE = /\.(tsx?|jsx?|mjs|astro)$/;

const walk = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? (e.name === 'node_modules' || e.name.startsWith('.') ? [] : walk(join(dir, e.name))) : [join(dir, e.name)],
      )
    : [];

/** The folders of a site whose code the check reads, each with the kind of file below it: the theme, a site's themes, a site's apps. @param {string} site */
export function folders(site) {
  const out = [{ dir: join(site, 'theme'), kind: 'theme' }];
  for (const [base, kind] of [
    ['src/themes', 'theme'],
    ['src/apps', 'app'],
  ]) {
    const dir = join(site, base);
    if (existsSync(dir))
      for (const e of readdirSync(dir, { withFileTypes: true })) if (e.isDirectory()) out.push({ dir: join(dir, e.name), kind });
  }
  return out;
}

/** The text of the code of an `.astro` file: its frontmatter and its `<script>` blocks, each kept on its own lines. @param {string} text */
function astroCode(text) {
  const parts = [];
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (fm) parts.push([2, fm[1]]);
  for (const m of text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\b[^>]*>/gi))
    parts.push([text.slice(0, m.index + m[0].indexOf('>') + 1).split('\n').length, m[1]]);
  return parts;
}

/** The specifiers esbuild finds in code (its metafile lists every import record, with every path left external): `import`, `export … from`, `import()` and `require()`. */
function esbuildSpecifiers(code, loader) {
  try {
    const r = buildSync({
      stdin: { contents: code, loader, sourcefile: 'x' },
      bundle: true,
      external: ['*'],
      write: false,
      metafile: true,
      format: 'esm',
      logLevel: 'silent',
      outdir: 'out',
    });
    return Object.values(r.metafile.inputs)[0]?.imports.map((i) => i.path) ?? [];
  } catch {
    return null;
  }
}

/** Every module specifier a source text names: `[{ spec, line }]`. A specifier is placed on the first code line (not a comment) that writes it quoted, after the ones already placed. @param {string} text @param {string} file */
export function specifiers(text, file) {
  const parts = file.endsWith('.astro') ? astroCode(text) : [[1, text]];
  const loader = /\.(tsx|jsx)$/.test(file) ? 'tsx' : 'ts';
  const out = [];
  for (const [first, code] of parts) {
    const found = esbuildSpecifiers(code, loader) ?? [];
    // `import.meta.glob('…')` and its array form are not import records: read their string literals.
    for (const m of code.matchAll(/import\.meta\.glob(?:Eager)?\(\s*(\[[^\]]*\]|(['"`])[^'"`]*\2)/g))
      for (const q of m[1].matchAll(/(['"`])([^'"`]*)\1/g)) found.push(q[2]);
    const lines = code.split('\n');
    const used = new Map();
    for (const spec of found) {
      const from = used.get(spec) ?? 0;
      let at = lines.findIndex((l, i) => i >= from && !/^\s*(\/\/|\/?\*)/.test(l) && /['"`]/.test(l) && l.includes(spec));
      if (at < 0) at = Math.max(from - 1, 0);
      used.set(spec, at + 1);
      out.push({ spec, line: first + at });
    }
  }
  return out;
}

/** The allowed specifier nearest to one that is outside the list: the longest shared prefix, then the last segment. @param {string} spec */
export function nearest(spec) {
  const s = stripQuery(spec);
  let best = '';
  let score = -1;
  for (const e of PUBLIC_IMPORTS) {
    let n = 0;
    while (n < e.length && n < s.length && e[n] === s[n]) n++;
    const folder = e.slice(0, e.lastIndexOf('/') + 1);
    const bonus = s.startsWith(folder) ? 1000 : 0;
    if (n + bonus > score) {
      score = n + bonus;
      best = e;
    }
  }
  return best;
}

/**
 * What the check finds in one folder: `[{ kind: 'outside' | 'virtual' | 'sandbox', file, line, spec, near? }]`.
 * @param {string} dir @param {'theme'|'app'} kind @param {string} [rel] the folder's name in messages
 */
export function problemsOf(dir, kind, rel = dir) {
  const found = [];
  for (const file of walk(dir).filter((f) => CODE.test(f) && !/\.test\.[a-z]+$/.test(f) && !f.includes('/fixtures/'))) {
    const name = relative(dir, file);
    const sandboxed = kind === 'app' && (/^hooks\//.test(name) || /^after-build\.[a-z]+$/.test(name));
    for (const { spec, line } of specifiers(readFileSync(file, 'utf8'), file)) {
      const at = { file: `${rel}/${name}`.replace(/^\.\//, ''), line, spec };
      if (spec.startsWith('virtual:')) found.push({ kind: 'virtual', ...at });
      else if (sandboxed) {
        // A hook or after-build step: its own folder, `@app/self` and the three modules, nothing else.
        if (!(spec.startsWith('.') || spec === '@app/self' || SANDBOX_IMPORTS.includes(stripQuery(spec))))
          found.push({ kind: 'sandbox', ...at });
      } else if ((spec === CMS || spec.startsWith(CMS + '/')) && !publicImportOf(spec))
        found.push({ kind: 'outside', ...at, near: nearest(spec) });
    }
  }
  return found;
}

/** The imports of every folder of the given sites: the problems and the number of files read. @param {string[]} sites */
export function siteProblems(sites) {
  const found = [];
  for (const site of new Set(sites))
    for (const { dir, kind } of folders(site)) found.push(...problemsOf(dir, kind, relative(process.cwd(), dir) || '.'));
  return found;
}

/** The lines of the "Public imports" section of docs/app-contract.md: each a bullet with one specifier in backticks. @param {string} md */
export function docList(md) {
  const m = /^#{2,3} Public imports\s*$([\s\S]*?)(?=^#{1,3} |(?![\s\S]))/m.exec(md);
  if (!m) return null;
  return [...m[1].matchAll(/^- `(@morphemecms\/cms[^`]*)`/gm)].map((x) => x[1]);
}

/** The docs problems: the section is missing, or lists other specifiers than the lib file. @param {string} md */
export function docProblems(md) {
  const listed = docList(md);
  if (!listed) return ['docs/app-contract.md has no "Public imports" section.'];
  const out = [];
  for (const e of PUBLIC_IMPORTS)
    if (!listed.includes(e)) out.push(`docs/app-contract.md, "Public imports": ${e} is in lib/public-imports.mjs but not in the section.`);
  for (const e of listed)
    if (!PUBLIC_IMPORTS.includes(e))
      out.push(`docs/app-contract.md, "Public imports": ${e} is in the section but not in lib/public-imports.mjs.`);
  return out;
}

const describe = (p) => {
  const at = `${p.file}:${p.line}`;
  if (p.kind === 'virtual') return `${at}: ${p.spec} (a virtual module is not in the import map)`;
  if (p.kind === 'sandbox')
    return `${at}: ${p.spec} (a hook or after-build step imports only its own folder, @app/self and ${SANDBOX_IMPORTS.join(', ')}; docs/app-contract.md, "Imports")`;
  return `${at}: ${p.spec} is not a public import${p.near ? `; nearest allowed: ${p.near}` : ''} (lib/public-imports.mjs, docs/app-contract.md, "Public imports")`;
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const sites = args.flatMap((a, i) => (args[i - 1] === '--site' ? [a] : []));
  const roots = sites.length ? sites : [process.cwd(), join(here, 'demo'), join(here, 'starter')];
  const found = siteProblems(roots);
  const docs = docProblems(readFileSync(join(here, 'docs/app-contract.md'), 'utf8'));
  for (const p of found) console.log(describe(p));
  for (const d of docs) console.log(d);
  const total = found.length + docs.length;
  if (process.argv.includes('--report')) console.log(`check:imports (report): ${total} problem(s).`);
  else if (total) {
    console.error(`check:imports failed: ${total} problem(s).`);
    process.exit(1);
  } else console.log(`check:imports: every import of a theme and an app is on the public list (${PUBLIC_IMPORTS.length} entries).`);
}
