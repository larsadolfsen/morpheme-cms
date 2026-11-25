// The permanent check for the `mo-` names (plan docs/superpowers/plans/2026-11-18-mo-names-contract-7.md, PR M7; the pattern: docs/class-names.md).
// Every class and custom property of ours starts with `mo-` (owner, 18 Nov 2026) and nothing is let by: there is no allowlist and no count that may stay.
// What stays unprefixed is only what is not ours, each with its reason in NOT_RENAMED of scripts/mo-names.mjs (other libraries' classes, `mo-prose`, `dark`).
// It fails on:
//   classDefs     an unprefixed class defined in a stylesheet,
//   markup        an unprefixed class written in markup or code (a class attribute, classList, querySelector, matches, closest, a `.name` selector in a string)
//                 that a stylesheet defines or that is an old name of the rename (scripts/renamed-classes.json, M1's map), so a rename that missed a string fails,
//   propsDeclared / propsRead   an unprefixed custom property declared or read, in a stylesheet or in code,
//   and the rules the counts cannot see (scanStrict): an attribute selector on `class` or `style` that spells a non-mo name (`[class*="card-"]`, `[class^=block-]`,
//   `[style*="--card"]`), a `mo-` class that does not have the shape of docs/class-names.md, and an unprefixed class in a plain `class="…"` attribute.
// Run: npm run check:mo-names; `--list` prints the counts per file (all of them are zero when the check passes).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCOPED_CSS_FROM_API } from '../lib/appCss.mjs';
import { readTree, scan, scanStrict } from './mo-names.mjs';

export const METRICS = ['classDefs', 'markup', 'propsDeclared', 'propsRead'];
const LABEL = {
  classDefs: 'unprefixed class definitions',
  markup: 'unprefixed class names in markup or code',
  propsDeclared: 'unprefixed custom properties declared',
  propsRead: 'unprefixed custom properties read',
};

/**
 * @param {Record<string, Record<string, number>>} counts the current counts per file
 * @returns {string[]} the problems: every count above zero, one line each
 */
export function problemsOf(counts) {
  const out = [];
  for (const [file, row] of Object.entries(counts))
    for (const metric of METRICS)
      if (row[metric])
        out.push(
          `${file}: ${row[metric]} ${LABEL[metric]}. A name of ours starts with mo- (docs/class-names.md); write the new one, or find the old one in docs/superpowers/plans/mo-names/map.json. Nothing is allowed to stay: not ours means a reason in NOT_RENAMED (scripts/mo-names.mjs).`,
        );
  return out;
}

/** Every problem of a set of files (path → text): the counts above zero and the strict rules. */
export function problems(files) {
  return [...problemsOf(scan(files).perFile), ...scanStrict(files)];
}

/** A site's themes and apps (`src/themes`, `src/apps`): the same rules, so a theme or an app built on the CMS starts its names with mo- too (`check:content`, so `check:themes`).
 * An app written to contract 8 is not read here: its own classes are plain names the build scopes to the app, and `check:app-classes` refuses a made-up `mo-` class. */
export function siteProblems(root = process.cwd()) {
  const files = {};
  const scoped = (path) => {
    const m = /^src[\\/]apps[\\/]([^\\/]+)[\\/]/.exec(path);
    try {
      return !!m && JSON.parse(readFileSync(join(root, 'src/apps', m[1], 'app.json'), 'utf8')).api >= SCOPED_CSS_FROM_API;
    } catch {
      return false;
    }
  };
  for (const dir of ['src/themes', 'src/apps'])
    if (existsSync(join(root, dir)))
      for (const e of readdirSync(join(root, dir), { recursive: true, withFileTypes: true }))
        if (
          e.isFile() &&
          /\.(css|astro|tsx|ts|jsx|js|mjs|html|md)$/.test(e.name) &&
          !/(^|[\\/])node_modules[\\/]|\.test\.mjs$/.test(join(e.parentPath, e.name))
        )
          !scoped(relative(root, join(e.parentPath, e.name))) &&
            (files[relative(root, join(e.parentPath, e.name))] = readFileSync(join(e.parentPath, e.name), 'utf8'));
  return problems(files);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = readTree();
  if (process.argv.includes('--list')) {
    console.log(JSON.stringify(scan(files).perFile, null, 2));
    process.exit(0);
  }
  const found = problems(files);
  if (found.length) {
    console.error(`check:mo-names (${found.length}):\n${found.join('\n')}`);
    process.exit(1);
  }
  console.log(`check:mo-names: every class and custom property in ${Object.keys(files).length} files starts with mo-.`);
}
