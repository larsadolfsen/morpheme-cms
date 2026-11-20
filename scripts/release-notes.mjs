// Release step: moves the pending release notes into release-notes/i18n/<locale>/<version>.json, their screenshots into
// <version>/<id>.webp, the version from package.json,
// and deletes the screenshot folders of older minor lines (the package carries the running minor line's). Run by release:version after changeset version.
// Usage: node scripts/release-notes.mjs [root]; exits 1 on a problem or an existing file.
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { imagePath, problemsOf, released, staleImageDirs } from '../lib/releaseNotes.mjs';
import { readPending, repoRoot } from './release-notes-pending.mjs';

const root = repoRoot(process.argv[2]);
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const pending = readPending(root);

const problems = problemsOf(pending);
if (problems.length > 0) {
  for (const problem of problems) console.error(problem);
  process.exit(1);
}

// The day it is released, for the Morpheme page ("New in …" with its date).
const result = released(pending, version, new Date().toISOString().slice(0, 10));
const targets = Object.keys(result).map((locale) => join(root, 'release-notes', 'i18n', locale, `${version}.json`));
const existing = targets.filter((target) => existsSync(target));
if (existing.length > 0) {
  for (const target of existing) console.error(`${target} exists; a released version is never changed`);
  process.exit(1);
}

for (const [locale, { file, images }] of Object.entries(result)) {
  const localeDir = join(root, 'release-notes', 'i18n', locale);
  writeFileSync(join(localeDir, `${version}.json`), `${JSON.stringify(file, null, 2)}\n`);
  for (const id of images) {
    const target = join(root, imagePath(version, locale, id));
    mkdirSync(dirname(target), { recursive: true });
    renameSync(join(localeDir, 'pending', `${id}.webp`), target);
  }
  for (const id of Object.keys(pending[locale])) {
    rmSync(join(localeDir, 'pending', `${id}.json`));
  }
}
// The package carries the screenshots of the running minor line only; the notes files stay.
const i18n = join(root, 'release-notes', 'i18n');
for (const locale of readdirSync(i18n, { withFileTypes: true }).filter((e) => e.isDirectory())) {
  const dirs = readdirSync(join(i18n, locale.name), { withFileTypes: true }).filter((e) => e.isDirectory());
  for (const name of staleImageDirs(
    dirs.map((e) => e.name),
    version,
  ))
    rmSync(join(i18n, locale.name, name), { recursive: true });
}
console.log(`Release notes for ${version}: ${Object.keys(result).join(', ') || 'none'}.`);
