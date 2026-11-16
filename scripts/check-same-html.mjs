// The same HTML (docs/superpowers/specs/2026-11-14-dynamic-lists-framework-design.md, 6.3): the demo site with the fixture "0.17 site"
// (site-017-fixture.mjs) is built twice, with the base of this change (the merge base with the pull request's base branch) and with this tree, and
// every page's HTML is compared byte for byte. A change that must show no difference on any site (the dynamic lists framework's migration) fails
// here when one character of a page differs. Run by `npm run check:demo` (check-demo.mjs) after `npm run build`, which makes the package copy
// this tree is built with: `npm run check:same-html`. The base is `SAME_HTML_BASE` (a git ref), else `origin/<the pull request's base branch>`
// (GITHUB_BASE_REF), else `origin/0.19`; without one the check is skipped on a computer and fails in CI. It runs only in the CMS's own checkout (see below).
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { binOf } from './bin.mjs';
import { SITE_017 } from './site-017-fixture.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const npm = process.env.npm_execpath ? [process.execPath, process.env.npm_execpath] : ['npm'];

/** The commit this change started from, or undefined when the base cannot be found. */
function baseCommit() {
  const ref = process.env.SAME_HTML_BASE || `origin/${process.env.GITHUB_BASE_REF || '0.19'}`;
  try {
    return git('merge-base', 'HEAD', ref);
  } catch {
    return undefined;
  }
}

/** The files of a built site that are compared: every page and what is written beside them (feeds, sitemaps, text files), not the editor's own
 * build (`editor/`: its version and build time change with every change). */
const compared = (dir) =>
  readdirSync(dir, { recursive: true })
    .map(String)
    .filter((f) => !f.startsWith('editor/') && /\.(html|xml|txt|json|rss)$/.test(f) && statSync(join(dir, f)).isFile())
    .sort();

/** The package copy of a tree in a node_modules/ of its own, as `npm run build` (demo-build.mjs) makes it, next to links to every other package. */
function modulesOf(tree) {
  const modules = join(tree, 'node_modules');
  mkdirSync(join(modules, '@morphemecms'), { recursive: true });
  for (const name of readdirSync(join(root, 'node_modules'))) {
    if (name === '@morphemecms') {
      for (const scoped of readdirSync(join(root, 'node_modules', name)))
        if (scoped !== 'cms') symlinkSync(join(root, 'node_modules', name, scoped), join(modules, name, scoped), 'junction');
    } else if (!name.startsWith('.')) symlinkSync(join(root, 'node_modules', name), join(modules, name), 'junction');
  }
  const [{ files }] = JSON.parse(
    execFileSync(npm[0], [...npm.slice(1), 'pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: tree, encoding: 'utf8' }),
  );
  const self = join(modules, '@morphemecms/cms');
  for (const { path } of files) {
    mkdirSync(dirname(join(self, path)), { recursive: true });
    cpSync(join(tree, path), join(self, path));
  }
}

/** The demo site of a tree with the fixture laid over it, built to its own dist/. Returns the dist folder. */
async function build(tree, label) {
  console.log(`\nBuilding the demo with the fixture: ${label}`);
  const { demoSite } = await import(pathToFileURL(join(tree, 'scripts/demo-site.mjs')).href);
  const site = demoSite(undefined, tree);
  for (const [path, text] of Object.entries(SITE_017)) {
    mkdirSync(dirname(join(site, path)), { recursive: true });
    writeFileSync(join(site, path), text);
  }
  const dist = join(site, 'dist');
  execFileSync(process.execPath, [binOf('astro', 'astro', site), 'build', '--outDir', dist], { cwd: site, stdio: 'inherit' });
  return dist;
}

// Only in this repository's own checkout: a site that installs the package runs `check:demo` too (npx morpheme check:demo), and there the package has no
// git history and nothing to compare with. It skips with one line and never fails, whatever CI variable is set.
const REPOSITORY = 'larsadolfsen/morpheme-cms';
if (!existsSync(join(root, '.git')) || (process.env.GITHUB_REPOSITORY && process.env.GITHUB_REPOSITORY !== REPOSITORY)) {
  console.log('check:same-html skipped: it runs only in the CMS repository (morpheme-cms).');
  process.exit(0);
}

const base = baseCommit();
if (!base) {
  const why = 'No base to compare with: set SAME_HTML_BASE to a git ref (for example origin/0.19).';
  if (process.env.CI) {
    console.error(why);
    process.exit(1);
  }
  console.log(`check:same-html skipped. ${why}`);
  process.exit(0);
}
if (!existsSync(join(root, 'node_modules/@morphemecms/cms'))) {
  console.error('Run `npm run build` first: it makes the package copy the demo is built with.');
  process.exit(1);
}

const cache = join(root, '.morpheme/same-html');
const worktree = join(cache, 'base');
rmSync(cache, { recursive: true, force: true });
mkdirSync(cache, { recursive: true });
let problems = [];
try {
  git('worktree', 'add', '--detach', worktree, base);
  modulesOf(worktree);
  const after = await build(root, 'this change');
  const before = await build(worktree, `the base, ${base.slice(0, 9)}`);
  const was = compared(before);
  const now = compared(after);
  for (const file of was) if (!now.includes(file)) problems.push(`${file}: in the base, not in this change.`);
  for (const file of now) {
    if (!was.includes(file)) problems.push(`${file}: in this change, not in the base.`);
    else {
      const a = readFileSync(join(before, file));
      const b = readFileSync(join(after, file));
      if (!a.equals(b)) {
        let i = 0;
        while (a[i] === b[i]) i++;
        const at = (buffer) => JSON.stringify(buffer.toString('utf8', Math.max(0, i - 40), i + 60));
        problems.push(`${file}: differs at byte ${i}\n    base:   ${at(a)}\n    change: ${at(b)}`);
      }
    }
  }
  console.log(`\nCompared ${now.length} files of the demo and the 0.17 fixture.`);
} finally {
  try {
    git('worktree', 'remove', '--force', worktree);
  } catch {
    // The folder goes with .morpheme/same-html below.
  }
  rmSync(cache, { recursive: true, force: true });
}
if (problems.length) {
  console.error(`\n${problems.join('\n')}\n\nThe HTML of the site is not the same as the base's (scripts/check-same-html.mjs).`);
  process.exit(1);
}
console.log('The HTML is the same as the base, byte for byte.');
