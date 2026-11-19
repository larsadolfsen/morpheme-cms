// Keeps a version line's next release what the owner ruled (18 Nov 2026: a `minor` changeset in 0.18 made the next release 0.19.0 when it had to
// be 0.18.1). Cheap: no browser, no build. Run by .github/workflows/check.yml, job `static`; tested by scripts/release-line.test.mjs; the lines
// and their levels are in scripts/release-lines.json (skill changesets, "The level the base branch allows").
//
//   node scripts/release-line.mjs <base branch> <head branch>
//
//  - A pull request INTO a line's branch (base `0.18`): every changeset the pull request adds or changes (git diff against the base, so a file the
//    pull request does not touch is never checked) must be at or below the line's `allow` level. `minor` and `major` fail, naming the file.
//  - A carry into `main` (head `merge-<line>-into-main-<N>`, or the line's own branch): the version the changesets compute (the highest level of
//    every changeset applied to package.json's version) must stay in the line's series, `0.18.x`, never `0.19.0`.
//  - Any other pull request passes.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const PACKAGE = '@morphemecms/cms';
const ORDER = ['none', 'patch', 'minor', 'major'];

/** @returns {Record<string, {allow: string, series: string}>} */
export function readLines(path = new URL('./release-lines.json', import.meta.url)) {
  return JSON.parse(readFileSync(path, 'utf8')).lines;
}

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

/** The version after applying `level` to `version` (changesets' bump); no change for `none`. */
export function bump(version, level) {
  const [major, minor, patch] = version.split('-')[0].split('.').map(Number);
  if (level === 'major') return `${major + 1}.0.0`;
  if (level === 'minor') return `${major}.${minor + 1}.0`;
  if (level === 'patch') return `${major}.${minor}.${patch + 1}`;
  return `${major}.${minor}.${patch}`;
}

/**
 * A pull request into a line's branch.
 * @param {string} base
 * @param {{file: string, text: string}[]} changesets the changesets the pull request adds or changes
 * @param {ReturnType<typeof readLines>} lines
 * @returns {string[]} problems
 */
export function checkIntoLine(base, changesets, lines) {
  const line = lines[base];
  if (!line) return [];
  const problems = [];
  for (const { file, text } of changesets) {
    const level = levelOf(text);
    if (ORDER.indexOf(level) > ORDER.indexOf(line.allow)) {
      problems.push(
        `${file}: \`${level}\` is above what the ${base} line allows (${line.allow} or empty only). Change it to \`${line.allow}\`, or keep it for a later line.`,
      );
    }
  }
  return problems;
}

/** The line a carry into main belongs to: `merge-0.18-into-main-3` or the branch `0.18`; '' when the head is not a carry. */
export function carryLine(head, lines) {
  const m = /^merge-(.+)-into-main(?:-.*)?$/.exec(head);
  const name = m ? m[1] : head;
  return lines[name] ? name : '';
}

/**
 * A carry of a line into main: the computed version stays in the line's series.
 * @param {string} head
 * @param {{file: string, text: string}[]} changesets every changeset in the head
 * @param {string} version package.json's version
 * @param {ReturnType<typeof readLines>} lines
 * @returns {string[]} problems
 */
export function checkCarry(head, changesets, version, lines) {
  const name = carryLine(head, lines);
  if (!name) return [];
  let top = 'none';
  let from = '';
  for (const { file, text } of changesets) {
    const level = levelOf(text);
    if (ORDER.indexOf(level) > ORDER.indexOf(top)) {
      top = level;
      from = file;
    }
  }
  const next = bump(version, top);
  const series = lines[name].series;
  if (top === 'none' || next === version.split('-')[0]) return []; // no release comes of it
  if (next.startsWith(`${series}.`)) return [];
  return [
    `The changesets compute ${next} from ${version} (the highest, \`${top}\`, is in ${from}), but the ${name} line's next release must stay ${series}.x. Change that changeset to \`${lines[name].allow}\`.`,
  ];
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' });
}

function readChangesets(files) {
  return files.map((file) => ({ file, text: readFileSync(file, 'utf8') }));
}

function main(base, head) {
  const lines = readLines();
  let problems = [];
  if (lines[base]) {
    const changed = git('diff', '--name-only', '--diff-filter=AM', `origin/${base}...HEAD`, '--', '.changeset')
      .split('\n')
      .filter((f) => /^\.changeset\/[^/]+\.md$/.test(f) && f !== '.changeset/README.md');
    problems = checkIntoLine(base, readChangesets(changed), lines);
  } else if (base === 'main' && carryLine(head, lines)) {
    const all = readdirSync('.changeset')
      .filter((f) => f.endsWith('.md') && f !== 'README.md')
      .map((f) => `.changeset/${f}`);
    const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
    problems = checkCarry(head, readChangesets(all), version, lines);
  }
  if (problems.length) {
    for (const p of problems) console.error(`::error::${p}`);
    process.exit(1);
  }
  console.log(`release-line: ok (${base} <- ${head})`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main(process.argv[2] ?? '', process.argv[3] ?? '');
