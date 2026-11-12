// Checks the pending release notes: each note has its twin in every locale with the same kind, an id that matches its file name,
// and the fields its kind needs (a paragraph: title and text; a line: text only). Notes have no screenshots; a leftover <id>.webp is a problem.
// Run by npm run check:release-notes; usage: node scripts/check-release-notes.mjs [root]. Exits 1 and prints each problem.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compareVersions } from '../lib/cms-version.mjs';
import { orderProblems, problemsOf } from '../lib/releaseNotes.mjs';
import { readPending, repoRoot } from './release-notes-pending.mjs';

const root = repoRoot(process.argv[2]);
const problems = problemsOf(readPending(root));

// The order of a version's notes (alphabetical, see the skill release-notes) is checked in the files built by release:version
// from ORDERED_FROM on; earlier versions were built before the rule and stay as they are. The pending notes have no order
// of their own (one file each); release:version and the Morpheme page sort them.
const ORDERED_FROM = '0.17.0';
const i18n = join(root, 'release-notes', 'i18n');
if (existsSync(i18n)) {
  for (const locale of readdirSync(i18n, { withFileTypes: true }).filter((e) => e.isDirectory())) {
    for (const name of readdirSync(join(i18n, locale.name))) {
      const version = name.replace(/\.json$/, '');
      if (!/^\d+\.\d+\.\d+\.json$/.test(name) || compareVersions(version, ORDERED_FROM) < 0) continue;
      const path = `release-notes/i18n/${locale.name}/${name}`;
      const file = JSON.parse(readFileSync(join(i18n, locale.name, name), 'utf8'));
      problems.push(...orderProblems(path, file.notes ?? []));
    }
  }
}
if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}
console.log('Release notes: no problems.');
