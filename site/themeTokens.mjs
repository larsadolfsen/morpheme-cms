// A theme's private custom property is `--mo-theme-*` (docs/css-tokens.md, spec 2026-11-20-scoped-app-css-design.md, "Themes are not rewritten"). The CMS never declares
// the prefix, so it cannot collide with a CMS token added later; only files in the theme's own folder (`src/themes/<theme>/`) may declare or read one: an app, the site's
// own files or another theme may not. Exposes themeTokenProblems (check:content, so check:themes). Depends on nothing but node.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const NAME = /--mo-theme-[\w-]+/g;
const SOURCE = /\.(css|astro|tsx?|jsx?|mjs|md)$/;

const filesIn = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { recursive: true, withFileTypes: true })
        .filter((e) => e.isFile() && SOURCE.test(e.name) && !/(^|[\\/])node_modules[\\/]|\.test\.mjs$/.test(join(e.parentPath, e.name)))
        .map((e) => join(e.parentPath, e.name))
    : [];

/** One line for each place that declares or reads a `--mo-theme-*` name it may not. @param {string} [root] the site */
export function themeTokenProblems(root = process.cwd()) {
  const problems = [];
  const themes = join(root, 'src/themes');
  const inThemes = new Set();
  for (const e of existsSync(themes) ? readdirSync(themes, { withFileTypes: true }) : []) {
    if (!e.isDirectory()) continue;
    const files = filesIn(join(themes, e.name));
    files.forEach((f) => inThemes.add(f));
    const declared = new Set();
    for (const f of files)
      if (f.endsWith('.css'))
        for (const m of readFileSync(f, 'utf8').matchAll(new RegExp(`(${NAME.source})\\s*:`, 'g'))) declared.add(m[1]);
    for (const f of files)
      readFileSync(f, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          for (const name of line.match(NAME) ?? [])
            if (!declared.has(name))
              problems.push(
                `${relative(root, f)}:${i + 1}: ${name} is read but this theme does not declare it. A theme reads only its own --mo-theme-* names (docs/css-tokens.md).`,
              );
        });
  }
  for (const f of filesIn(join(root, 'src')))
    if (!inThemes.has(f))
      readFileSync(f, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          for (const name of line.match(NAME) ?? [])
            problems.push(
              `${relative(root, f)}:${i + 1}: ${name} belongs to a theme. Only files in the theme's own folder (src/themes/<theme>/) declare or read a --mo-theme-* name; use the CMS's --mo-… token instead (docs/css-tokens.md).`,
            );
        });
  return problems;
}
