// `morpheme migrate`: rewrites the site's pages and posts (src/content/pages, src/content/blog) that still use a block that
// has become another (see lib/migrate-content.mjs) to the form the editor writes, and prints each file it changed. The class names the editor
// saved in text (lib/content-class-names.mjs) are rewritten in every content collection (src/content/**) and every data file (src/data/**/*.json). Safe to
// run twice: a migrated site is left alone. With --from <version> (the version the site came from) and below 0.19.6 it also rewrites the site's own themes and apps (src/themes and
// src/apps, the folders with no store.json) to Material 3's names (lib/migrate-code.mjs) and every stored icon name to its Material Symbols name (lib/migrate-icons.mjs), once:
// it stops with the list of what it cannot rewrite safely, and refuses a second run. Without --from it leaves them. Only the blocks change, never the front matter, so a draft stays a draft. With
// --check it changes nothing and stops with 1 when a file would change (the list is printed). Commit the result.
// Run from the site's root: npx morpheme migrate [--check]
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { compareVersions } from '../lib/cms-version.mjs';
import { CodeMigrationStop, CODE_NAMES_SINCE, MIGRATIONS_FILE, migrateCode, unsafeLines } from '../lib/migrate-code.mjs';
import { migrateIconNamesPath } from '../lib/migrate-icons.mjs';
import { utilityProblems } from '../site/tailwind.mjs';
import { migrateClassNamesPath } from '../lib/content-class-names.mjs';
import { migrateFile } from '../lib/migrate-content.mjs';

const walk = (dir) =>
  (existsSync(dir) ? readdirSync(dir, { withFileTypes: true }) : []).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : /\.(md|mdx|markdown|json)$/i.test(e.name) ? [join(dir, e.name)] : [],
  );
const walkAll = (dir) =>
  (existsSync(dir) ? readdirSync(dir, { withFileTypes: true }) : []).flatMap((e) =>
    e.isDirectory() ? (e.name === 'node_modules' ? [] : walkAll(join(dir, e.name))) : [join(dir, e.name)],
  );
const check = process.argv.includes('--check');
const fromAt = process.argv.indexOf('--from');
const from = fromAt > 0 ? process.argv[fromAt + 1] : undefined;
if (fromAt > 0 && !/^\d+\.\d+\.\d+/.test(from ?? '')) {
  console.error('Give the version the site came from: npx morpheme migrate --from 0.19.5');
  process.exit(1);
}
// The names of 0.19.6 are rewritten once, and only for a site that comes from below it.
const names = from !== undefined && compareVersions(from, CODE_NAMES_SINCE) < 0;
if (from !== undefined && !names)
  console.log(`The site comes from ${from}, which has Material 3's names: its own themes and apps and its icon names are left.`);
const changed = [];
const pages = (file) => /^src[\\/]content[\\/](pages|blog)[\\/]/.test(file) && /\.md$/.test(file);
for (const file of [...walk('src/content'), ...walk('src/data')]) {
  const before = readFileSync(file, 'utf8');
  let after = pages(file) ? migrateFile(before) : migrateClassNamesPath(file, before);
  if (names) after = migrateIconNamesPath(file, after);
  if (after === before) continue;
  changed.push(file);
  if (!check) writeFileSync(file, after);
}
if (names) {
  const files = ['src/themes', 'src/apps'].flatMap((dir) =>
    walkAll(dir).map((path) => ({ path: relative('.', path).split('\\').join('/'), text: readFileSync(path, 'utf8') })),
  );
  try {
    const marker = existsSync(MIGRATIONS_FILE) ? readFileSync(MIGRATIONS_FILE, 'utf8') : null;
    for (const { path, text } of migrateCode({ files, marker, from, utilityProblems })) {
      if (path !== MIGRATIONS_FILE && text === files.find((f) => f.path === path)?.text) continue;
      changed.push(path);
      if (!check) {
        if (text === null) rmSync(path);
        else writeFileSync(path, text);
      }
    }
  } catch (e) {
    if (!(e instanceof CodeMigrationStop)) throw e;
    console.error(
      e.reason === 'already'
        ? `${MIGRATIONS_FILE} says the own themes and apps were already rewritten. It runs once (a reused name would be rewritten twice), so it is refused.`
        : `The own themes and apps have ${e.list.length} place(s) that cannot be rewritten safely. Fix them by hand, then run again (nothing was changed in them):\n${unsafeLines(e.list).join('\n')}`,
    );
    process.exit(1);
  }
}
for (const file of changed) console.log(`${check ? 'needs migrating' : 'migrated'}: ${file}`);
console.log(
  changed.length
    ? check
      ? `${changed.length} file(s) use blocks from before. Run: npx morpheme migrate`
      : `Migrated ${changed.length} file(s). Review and commit them.`
    : 'Nothing to migrate.',
);
process.exit(check && changed.length ? 1 : 0);
