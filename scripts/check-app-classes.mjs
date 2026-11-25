// A contract-8 app uses only `mo-` classes the CMS has (docs/app-contract.md, "Contract 8: scoped CSS"): the app's own elements get plain class names,
// which the build scopes to the app, so a `mo-` class an app made up (`mo-mailchimp`) is refused with its class and file. An app written to an older contract is not checked.
// The classes the CMS has are every `mo-` name written in the CMS's own CSS and code (theme/, src/, defaults/, lib/); a name that ends in `-` is a prefix its code builds on.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCOPED_CSS_FROM_API } from '../lib/appCss.mjs';

const here = fileURLToPath(new URL('..', import.meta.url));
const TOKEN = /(?<![\w-])mo-[a-z0-9][\w-]*/g;
const SOURCE = /\.(css|astro|tsx?|jsx?|mjs|json)$/;

const walk = (dir, test) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? (e.name === 'node_modules' ? [] : walk(join(dir, e.name), test)) : test(e.name) ? [join(dir, e.name)] : [],
      )
    : [];

let cached;
/** The `mo-` names the CMS has: `{ names: Set, prefixes: string[] }`. @param {string[]} [folders] */
export function cmsClasses(folders = ['theme', 'src', 'defaults', 'lib'].map((f) => join(here, f))) {
  if (!folders.length) return { names: new Set(), prefixes: [] };
  if (cached && folders.join() === cached.key) return cached.value;
  const names = new Set();
  for (const dir of folders)
    for (const f of walk(dir, (n) => SOURCE.test(n) && !/\.test\./.test(n)))
      for (const [m] of readFileSync(f, 'utf8').matchAll(TOKEN)) names.add(m);
  const value = { names, prefixes: [...names].filter((n) => n.endsWith('-')) };
  cached = { key: folders.join(), value };
  return value;
}

const has = ({ names, prefixes }, name) => names.has(name) || prefixes.some((p) => name.startsWith(p));

/** The `mo-` classes in one app folder that the CMS does not have: `[{ name, file, line }]`. */
export function unknownClasses(folder, cms = cmsClasses()) {
  const found = [];
  for (const file of walk(folder, (n) => /\.(css|astro|tsx?|jsx?|mjs)$/.test(n) && !/\.test\./.test(n))) {
    const css = file.endsWith('.css');
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((text, i) => {
        // In CSS only class selectors count (a keyframe or a font may be called anything); in code, any `mo-` word is a class name.
        const words = css ? [...text.matchAll(/\.(mo-[a-z0-9][\w-]*)/g)].map((m) => m[1]) : (text.match(TOKEN) ?? []);
        for (const name of words) if (!has(cms, name)) found.push({ name, file: relative(folder, file), line: i + 1 });
      });
  }
  return found;
}

/** What `check:content` refuses: one line per class and file, for each app written to contract 8 or later. @param {string} [root] @param {ReturnType<typeof cmsClasses>} [cms] */
export function siteProblems(root = process.cwd(), cms = cmsClasses()) {
  const dir = join(root, 'src/apps');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .flatMap((e) => {
      try {
        if (!(JSON.parse(readFileSync(join(dir, e.name, 'app.json'), 'utf8')).api >= SCOPED_CSS_FROM_API)) return [];
      } catch {
        return [];
      }
      const seen = new Set();
      return unknownClasses(join(dir, e.name), cms).flatMap(({ name, file, line }) => {
        const key = `${name} ${file}`;
        if (seen.has(key)) return [];
        seen.add(key);
        return [
          `src/apps/${e.name}/${file}:${line}: the class ${name} is not one the CMS has. An app's own elements take plain class names (the build scopes them to the app); only the CMS's classes keep mo- (docs/app-contract.md, "Contract 8").`,
        ];
      });
    });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = siteProblems(process.argv[2] ?? process.cwd());
  problems.forEach((p) => console.log(p));
  console.log(`check:app-classes: ${problems.length} problem(s).`);
  process.exit(problems.length ? 1 : 0);
}
