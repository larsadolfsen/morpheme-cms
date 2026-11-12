// `morpheme migrate`: rewrites the site's pages and posts (src/content/pages, src/content/blog) that still use a block that
// has become another (see lib/migrate-content.mjs) to the form the editor writes, and prints each file it changed. Safe to
// run twice: a migrated site is left alone. Only the blocks change, never the front matter, so a draft stays a draft. With
// --check it changes nothing and stops with 1 when a file would change (the list is printed). Commit the result.
// Run from the site's root: npx morpheme migrate [--check]
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { migrateFile } from '../lib/migrate-content.mjs';

const walk = (dir) =>
  (existsSync(dir) ? readdirSync(dir, { withFileTypes: true }) : []).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.md') ? [join(dir, e.name)] : [],
  );
const check = process.argv.includes('--check');
const changed = [];
for (const file of [...walk('src/content/blog'), ...walk('src/content/pages')]) {
  const before = readFileSync(file, 'utf8');
  const after = migrateFile(before);
  if (after === before) continue;
  changed.push(file);
  if (!check) writeFileSync(file, after);
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
