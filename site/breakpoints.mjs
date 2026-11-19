// The site keeps to Material 3's breakpoints (lib/breakpoints.mjs, --mo-ref-breakpoint-* in theme/styles/tokens/base/ref.css): a width in a
// media or container query (@media, @container, matchMedia, useMedia, sizes) that is not one of the table's four, a variant with a width of its own or the old Tailwind breakpoint names (sm:, md: …, no longer built) is a problem
// (lineProblems for one line, breakpointProblems for the tree, in check:content), in the CMS's code (also its defaults)
// and in the site's themes, apps and own files.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const own = fileURLToPath(new URL('..', import.meta.url));
const CODE = /\.(css|astro|tsx|ts|js|mjs)$/;
/** The four widths of the table (lib/breakpoints.mjs, --mo-ref-breakpoint-* in theme/styles/tokens/base/ref.css), in rem and in px. */
const TABLE_WIDTHS = new Set(['37.5rem', '52.5rem', '75rem', '100rem', '600px', '840px', '1200px', '1600px']);
const WIDTH_PROBLEM = 'use one of the table’s four widths (docs/tailwind-migration.md)';
// A width in a media or container condition, in the forms min-width, max-width, `width >= x` and `x <= width`.
const WIDTHS = [
  /\(\s*(?:min|max)-width\s*:\s*([\d.]+(?:rem|px|em)?)/g,
  /\(\s*width\s*(?:>=|<=|>|<)\s*([\d.]+(?:rem|px|em)?)/g,
  /([\d.]+(?:rem|px|em)?)\s*(?:<=|<)\s*width\b/g,
];
// The range forms (`width >= x`) are also code (`width > 0`), so they count only on a line that is a query.
const QUERY = /@media|@container|matchMedia|useMedia|sizes/;
// A named container query (`@container name (...)`) is about a component's size and stays free.
const NAMED_CONTAINER = /@container\s+[a-zA-Z_-][\w-]*\s*\(/;
const RULES = [
  [
    /(^|[\s"'`{:])(min|max)-\[/,
    'a breakpoint written as an arbitrary variant (min or max with a width in brackets); use medium:, expanded:, large: or extra-large:',
  ],
  [/(^|[\s"'`{])(max-)?(sm|md|lg|xl|2xl):[\w[-]/, "Tailwind's old breakpoints; use medium:, expanded:, large: or extra-large:"],
];

/** Widths that stay, each with its reason: a problem line of that file that holds `text` is let be. */
export const ALLOWED = [
  { file: 'src/editor.css', text: '73.5rem', why: 'the editor workspace’s own width, not a window breakpoint of the site' },
  ...[
    ['theme/styles/cards.css', '34rem'],
    ['theme/styles/cards.css', '40rem'],
    ['theme/styles/cards.css', '56rem'],
    ['theme/styles/lists.css', '44.5rem'],
    ['theme/styles/lists.css', '67.5rem'],
    ['theme/styles/blocks/panel.css', '18.5rem'],
  ].map(([file, text]) => ({
    file,
    text: `@container (width`,
    width: text,
    why: 'an unnamed container query of a card or list, a component size; the cards and lists work names these containers (docs/superpowers/plans/2026-11-17-cards-and-lists-0-19.md)',
  })),
];

function files(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && CODE.test(e.name) && !e.parentPath.includes('node_modules') && !/\.test\.mjs$/.test(e.name))
    .map((e) => join(e.parentPath, e.name));
}

/** The problems on one line: a width that is not one of the table's four, or an old breakpoint name (empty when the line is fine).
 * @param {string} line
 * @returns {string[]} */
export function lineProblems(line) {
  const found = [];
  if (!NAMED_CONTAINER.test(line))
    for (const re of WIDTHS.slice(0, 1).concat(QUERY.test(line) ? WIDTHS.slice(1) : []))
      for (const [, width] of line.matchAll(re)) if (!TABLE_WIDTHS.has(width)) found.push(WIDTH_PROBLEM);
  for (const [re, what] of RULES) if (re.test(line)) found.push(what);
  return [...new Set(found)];
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
        for (const what of lineProblems(line)) {
          const rel = relative(root, file);
          if (ALLOWED.some((a) => a.file === rel && line.includes(a.text) && (!a.width || line.includes(a.width)))) continue;
          problems.push(`${relative(root, file)}:${i + 1}: ${what} (Material 3's breakpoints).`);
        }
      });
  return problems;
}
