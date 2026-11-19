// Tailwind is gone and stays gone (contract 7; batches T16 and T17): `npm run check:tailwind`. No allowlist, no count that may stay: any utility class in
// markup or a string constant, any Tailwind at-rule, `theme(--`, `--tw-` in a stylesheet, and any tailwind package in package.json or Prettier's settings
// fails. The rules and the frozen list of utility names are site/tailwind.mjs, which `check:content` runs too on a site's themes, apps and content (so
// `check:themes` does). Scanned here: the tracked files of the CMS's own folders (the tests and the rules themselves are not: they hold the fixtures).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXTENSIONS, configFiles, configProblems, utilityProblems } from '../site/tailwind.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const FOLDERS = ['theme', 'src', 'pages', 'starter', 'demo', 'site', 'lib', 'defaults', 'worker', 'bin'];
const SELF = new Set(['site/tailwind.mjs']);

/** The tracked files of the scanned folders (what is in the repository, not a build or `node_modules`). */
export function trackedFiles(root = ROOT) {
  const patterns = FOLDERS.flatMap((f) => EXTENSIONS.map((e) => `${f}/*.${e}`));
  const out = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', ...patterns], {
    cwd: root,
    maxBuffer: 1 << 28,
  }).toString();
  return out.split('\0').filter((f) => f && existsSync(join(root, f)) && !SELF.has(f) && !/\.test\.[mc]?[jt]sx?$/.test(f));
}

/** Every problem of the tree: one line each, with the file, the line and the rule. */
export function treeProblems(root = ROOT, files = trackedFiles(root)) {
  const problems = files.flatMap((f) => utilityProblems(f, readFileSync(join(root, f), 'utf8')));
  for (const f of [...configFiles(root), ...['starter', 'demo'].flatMap((d) => configFiles(join(root, d)).map((c) => `${d}/${c}`))])
    problems.push(...configProblems(f, readFileSync(join(root, f), 'utf8')));
  return problems;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = trackedFiles();
  const problems = treeProblems(ROOT, files);
  if (problems.length) {
    console.error(`check:tailwind: Tailwind came back (${problems.length}):\n${problems.join('\n')}`);
    process.exit(1);
  }
  console.log(`check:tailwind: no Tailwind in ${files.length} files.`);
}
