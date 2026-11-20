// The version is set when a feature starts (owner, 19 Nov 2026; plan docs/superpowers/plans/2026-11-19-version-at-feature-start.md).
// A feature's first pull request sets `version` in package.json to the number the feature is released as; Changesets only collects the notes.
// This file holds the rule and what the release steps need of it. Cheap: no browser, no build. Tested by version-rule.test.mjs.
//
//   node scripts/version-rule.mjs check <base branch> <head branch>   CI, job `static` (replaces the old series check, release-line.mjs)
//   node scripts/version-rule.mjs next                                 publish.yml, job `next`: prints the test version to stage, or nothing
//
// The check, on a pull request into `main` and on a feature's first pull request (into `feature/*`, package.json's version differs from the base's):
//  - on a pull request into `main` (the merge gate), `version` above npm's `latest` is exactly one step above it (next patch, or next minor `.0`)
//    and not published yet;
//  - on a feature's first pull request, `version` above `latest` is not published and at most in the next minor's line (latest 0.18.1: 0.18.x or
//    0.19.y, never 0.20.0): features are built side by side, so the version may be above the next one (owner, 20 Nov 2026);
//  - `version` below `latest` fails;
//  - `version` equal to `latest` with a non-empty changeset fails ("set the feature's version"), but only once the new flow is running
//    (latest at STRICT_FROM or later). Until then (latest 0.18.x) Changesets still computes the number from the changesets, so a fix with a patch
//    changeset keeps working until feature/tailwind sets 0.19.0. A merge into main is a pull request, so this is the merge gate.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PACKAGE = '@morphemecms/cms';
/** From this `latest` on, a version equal to `latest` with a non-empty changeset fails (0.19.0 is the first version set when its feature started). */
export const STRICT_FROM = '0.19.0';
const ORDER = ['none', 'patch', 'minor', 'major'];

/** The level a changeset's front matter gives @morphemecms/cms: none (an empty changeset), patch, minor or major. */
export function levelOf(text) {
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? '';
  let level = 'none';
  for (const line of front.split(/\r?\n/)) {
    const m = /^\s*['"]?([^'":]+)['"]?\s*:\s*(patch|minor|major)\s*$/.exec(line);
    if (m && m[1] === PACKAGE && ORDER.indexOf(m[2]) > ORDER.indexOf(level)) level = m[2];
  }
  return level;
}

/** The highest level among changesets (texts). */
export function topLevel(texts) {
  return texts.map(levelOf).reduce((a, b) => (ORDER.indexOf(b) > ORDER.indexOf(a) ? b : a), 'none');
}

const parts = (v) => v.split('-')[0].split('.').map(Number);

/** The version after applying `level` to `version` (changesets' bump); no change for `none`. */
export function bump(version, level) {
  const [major, minor, patch] = parts(version);
  if (level === 'major') return `${major + 1}.0.0`;
  if (level === 'minor') return `${major}.${minor + 1}.0`;
  if (level === 'patch') return `${major}.${minor}.${patch + 1}`;
  return `${major}.${minor}.${patch}`;
}

/** -1, 0 or 1. */
export function compare(a, b) {
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  return 0;
}

/**
 * @param {{base: string, version: string, baseVersion: string, latest: string, published: boolean, nonEmpty: boolean}} s
 *   `baseVersion` is package.json's version on the base branch; `published` says npm has `version`; `nonEmpty` says a changeset releases something.
 * @returns {string[]} problems
 */
export function checkVersion({ base, version, baseVersion, latest, published, nonEmpty }) {
  const firstOfFeature = base.startsWith('feature/') && version !== baseVersion;
  if (base !== 'main' && !firstOfFeature) return [];
  const patch = bump(latest, 'patch');
  const minor = bump(latest, 'minor');
  const c = compare(version, latest);
  if (c < 0)
    return [
      `package.json says ${version}, below npm's latest ${latest}. Set the version the feature is released as: ${patch} or ${minor}.`,
    ];
  if (c === 0) {
    if (nonEmpty && compare(latest, STRICT_FROM) >= 0)
      return [
        `package.json says ${version}, which is already released (npm latest), and a changeset releases something. Set the feature's version: ${patch} (next patch) or ${minor} (next minor).`,
      ];
    return [];
  }
  if (firstOfFeature) {
    // Features are built side by side (owner, 20 Nov 2026), so a feature's version may be above the next one: any version above latest, not
    // published, in the line of latest or the next minor's line (0.18.1: 0.18.x or 0.19.y, never 0.20.0).
    const [major, line] = parts(minor);
    const [vMajor, vLine] = parts(version);
    if (vMajor > major || (vMajor === major && vLine > line))
      return [
        `package.json says ${version}, but a feature's version is above npm's latest ${latest}, not published, and at most ${major}.${line}.x.`,
      ];
  } else if (version !== patch && version !== minor)
    return [
      `package.json says ${version}, but a feature's version is exactly one step above npm's latest ${latest}: ${patch} (next patch) or ${minor} (next minor).`,
    ];
  if (published) return [`${version} is already published on npm. Set the next free version: ${patch} or ${minor}.`];
  return [];
}

/** The newest version heading of CHANGELOG.md (the last release), '' when there is none. */
export function changelogTop(text) {
  return /^## (\S+)/m.exec(text)?.[1] ?? '';
}

/** CHANGELOG.md with the newest version heading renamed to `version`. */
export function renameTop(text, version) {
  return text.replace(/^## \S+/m, `## ${version}`);
}

/** True when package.json's version is the one the last release wrote (nothing set a new one): Changesets still computes the number then. */
export function versionUnset(version, changelogText) {
  return changelogTop(changelogText) === version;
}

/**
 * The test version `next` stages: the version the feature set (or, while none is set, the one the changesets compute) plus `-next-<time>`;
 * '' when only empty changesets are pending.
 */
export function nextVersion({ version, changelog, changesets, time }) {
  const top = topLevel(changesets);
  if (top === 'none') return '';
  const base = versionUnset(version, changelog) ? bump(version, top) : version;
  return `${base}-next-${time}`;
}

function readChangesets() {
  return readdirSync('.changeset')
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((f) => readFileSync(`.changeset/${f}`, 'utf8'));
}

const npmView = (spec, field) => {
  try {
    return execFileSync('npm', ['view', spec, field], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};

function runCheck(base, head) {
  void head;
  const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
  let baseVersion = '';
  if (base.startsWith('feature/'))
    baseVersion = JSON.parse(execFileSync('git', ['show', `origin/${base}:package.json`], { encoding: 'utf8' })).version;
  let problems = [];
  if (base === 'main' || (base.startsWith('feature/') && version !== baseVersion)) {
    const latest = npmView(PACKAGE, 'dist-tags.latest');
    if (!latest) {
      console.error('::error::npm did not answer for the latest version; run the job again.');
      process.exit(1);
    }
    const published = npmView(`${PACKAGE}@${version}`, 'version') === version;
    problems = checkVersion({ base, version, baseVersion, latest, published, nonEmpty: topLevel(readChangesets()) !== 'none' });
  }
  if (problems.length) {
    for (const p of problems) console.error(`::error::${p}`);
    process.exit(1);
  }
  console.log(`version-rule: ok (${base}, ${version})`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, base = '', head = ''] = process.argv.slice(2);
  if (cmd === 'check') runCheck(base, head);
  else if (cmd === 'next') {
    const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
    const time = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
    process.stdout.write(nextVersion({ version, changelog: readFileSync('CHANGELOG.md', 'utf8'), changesets: readChangesets(), time }));
  } else {
    console.error('usage: version-rule.mjs check <base> <head> | next');
    process.exit(2);
  }
}
