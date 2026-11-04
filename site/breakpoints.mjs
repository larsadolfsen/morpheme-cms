// The site keeps to Material 3's breakpoints (lib/breakpoints.mjs, --breakpoint-* in theme/styles/base.css): a width in a
// media query (@media, matchMedia, useMedia, sizes), a variant with a width of its own or Tailwind's old breakpoint names is a problem
// (lineProblems for one line, breakpointProblems for the tree, in check:content), in the CMS's code (also its defaults)
// and in the site's themes, apps and own files.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const own = fileURLToPath(new URL('..', import.meta.url));
const CODE = /\.(css|astro|tsx|ts|js|mjs)$/;
const RULES = [
  [
    /\(\s*(min|max)-width\s*:\s*\d|\(\s*width\s*(>=|<=|>|<)\s*\d|\d[\w.]*\s*(<=|<)\s*width\b/,
    'en bredde i en medieforespørgsel (@media, matchMedia, useMedia, sizes); brug theme(--breakpoint-medium), -expanded, -large eller -extra-large i CSS og atLeast() fra lib/breakpoints.mjs i scripts',
  ],
  [
    /(^|[\s"'`{:])(min|max)-\[/,
    'et brudpunkt skrevet som en vilkårlig variant (min eller max med en bredde i klammer); brug medium:, expanded:, large: eller extra-large:',
  ],
  [/(^|[\s"'`{])(max-)?(sm|md|lg|xl|2xl):[\w[-]/, 'Tailwinds gamle brudpunkt; brug medium:, expanded:, large: eller extra-large:'],
];

function files(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && CODE.test(e.name) && !e.parentPath.includes('node_modules') && !/\.test\.mjs$/.test(e.name))
    .map((e) => join(e.parentPath, e.name));
}

/** The problems on one line: each a hand-written width or an old breakpoint name (empty when the line is fine).
 * @param {string} line
 * @returns {string[]} */
export function lineProblems(line) {
  // A container query is about the box it sits in, not the window.
  if (line.includes('@container')) return [];
  return RULES.filter(([re]) => re.test(line)).map(([, what]) => what);
}

/** Every line, in the CMS's code (theme, editor, site, lib) and the site's themes and apps, that has a breakpoint of its own. */
export function breakpointProblems(root = process.cwd()) {
  const dirs = ['theme', 'src', 'site', 'lib', 'pages', 'defaults']
    .map((d) => join(own, d))
    .concat(['src/themes', 'src/apps', 'src/site'].map((d) => join(root, d)));
  const problems = [];
  for (const file of dirs.flatMap(files))
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        for (const what of lineProblems(line)) problems.push(`${relative(root, file)}:${i + 1}: ${what} (Material 3's brudpunkter).`);
      });
  return problems;
}
