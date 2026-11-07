// Release step: moves the pending release notes into release-notes/i18n/<locale>/<version>.json, the version from package.json.
// Run by release:version after changeset version. Usage: node scripts/release-notes.mjs [root]; exits 1 on a problem or an existing file.
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { problemsOf, released } from '../lib/releaseNotes.mjs';
import { readPending, repoRoot } from './release-notes-pending.mjs';

const root = repoRoot(process.argv[2]);
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const pending = readPending(root);

const problems = problemsOf(pending);
if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}

const result = released(pending, version);
const targets = Object.keys(result).map((locale) => join(root, 'release-notes', 'i18n', locale, `${version}.json`));
const existing = targets.filter((target) => existsSync(target));
if (existing.length > 0) {
  for (const target of existing) console.error(`${target} exists; a released version is never changed`);
  process.exit(1);
}

for (const [locale, data] of Object.entries(result)) {
  writeFileSync(join(root, 'release-notes', 'i18n', locale, `${version}.json`), `${JSON.stringify(data, null, 2)}\n`);
  for (const id of Object.keys(pending[locale])) {
    rmSync(join(root, 'release-notes', 'i18n', locale, 'pending', `${id}.json`));
  }
}
console.log(`Release notes for ${version}: ${Object.keys(result).join(', ') || 'none'}.`);
