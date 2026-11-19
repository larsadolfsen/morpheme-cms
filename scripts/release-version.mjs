// `npm run release:version`, run by the Release PR (changesets/action). The version is set when a feature starts
// (docs/superpowers/plans/2026-11-19-version-at-feature-start.md): `changeset version` writes the notes and CHANGELOG.md, then this puts package.json's
// version back to the number the feature set and renames the new CHANGELOG.md section to it. While no version is set (package.json equals the newest
// CHANGELOG.md section, the last release), Changesets' own number stands. Then the release notes and the starter, as before.
// `--root <dir>` runs it in another copy of the repository (a test); never committed or released from here.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { changelogTop, renameTop, versionUnset } from './version-rule.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const i = process.argv.indexOf('--root');
const root = i > 0 ? resolve(process.argv[i + 1]) : resolve(here, '..');
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, stdio: 'inherit' });

const pkgFile = join(root, 'package.json');
const logFile = join(root, 'CHANGELOG.md');
const set = JSON.parse(readFileSync(pkgFile, 'utf8')).version;
const logBefore = readFileSync(logFile, 'utf8');
const unset = versionUnset(set, logBefore);

run('npx', ['changeset', 'version']);

if (!unset) {
  const pkgText = readFileSync(pkgFile, 'utf8');
  const pkg = JSON.parse(pkgText);
  if (pkg.version !== set) writeFileSync(pkgFile, pkgText.replace(`"version": "${pkg.version}"`, `"version": "${set}"`));
  const log = readFileSync(logFile, 'utf8');
  if (changelogTop(log) !== changelogTop(logBefore)) writeFileSync(logFile, renameTop(log, set));
}

run('node', [join(here, 'release-notes.mjs'), root]);
run('node', [join(here, 'starter.mjs')]);
