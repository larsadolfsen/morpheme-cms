// Tailwind is gone (contract 7, T16) and must not come back (batch T17): the permanent check. `utilityProblems` reads one file, `tailwindProblems` the
// themes, apps and own content of a site (check:content, so check:themes too), and scripts/check-tailwind.mjs the CMS itself.
// With no tailwindcss package to ask, the utilities are a frozen list (site/tailwind-utilities.json: the base names of the 578 classes the CMS used on
// 18 Nov 2026, docs/tailwind-migration-classes.md) and the families below. Nothing in this list grows; a name is added only when a new family is found.
//   markup, .md   a class, className or class:list attribute with a utility, a variant (`medium:`, `hover:`, `[&>p]:`) or an arbitrary value (`w-[3px]`),
//   code          the same in a string constant, when every word of the string is a utility (a lone `block` or `hidden` is only a word),
//   CSS           @import 'tailwindcss', @theme, @utility, @plugin, @apply, @source, @reference, @tailwind, @variant, @custom-variant, theme(--, --tw-,
//   config        a tailwind package in package.json, a tailwind plugin in Prettier's settings, an import of one in code.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  EXTENSIONS,
  UTILITIES,
  classAttributes,
  configProblems,
  splitVariants,
  stringsIn,
  utilityProblems,
  whyUtility,
} from '../lib/tailwind-rules.mjs';

export { EXTENSIONS, UTILITIES, classAttributes, configProblems, splitVariants, stringsIn, utilityProblems, whyUtility };

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(
      (e) =>
        e.isFile() &&
        EXTENSIONS.includes(e.name.split('.').pop()) &&
        !e.parentPath.includes('node_modules') &&
        !/\.test\.[mc]?[jt]sx?$/.test(e.name),
    )
    .map((e) => join(e.parentPath, e.name));
}

/** The config files of a root: package.json and Prettier's settings. */
export function configFiles(root) {
  return [
    'package.json',
    '.prettierrc',
    '.prettierrc.json',
    '.prettierrc.mjs',
    '.prettierrc.cjs',
    '.prettierrc.js',
    '.prettierrc.yaml',
    '.prettierrc.yml',
    'prettier.config.mjs',
    'prettier.config.js',
    'prettier.config.cjs',
  ].filter((f) => existsSync(join(root, f)));
}

/** A site's themes, apps and own content, and its config (check:content, so check:themes). `root` is the site's root. */
export function tailwindProblems(root = process.cwd()) {
  const problems = [];
  for (const dir of ['src/themes', 'src/apps', 'src/site', 'src/content', 'src/components', 'src/layouts', 'src/pages'])
    for (const file of walk(join(root, dir))) problems.push(...utilityProblems(relative(root, file), readFileSync(file, 'utf8')));
  for (const f of configFiles(root)) problems.push(...configProblems(f, readFileSync(join(root, f), 'utf8')));
  return problems;
}
