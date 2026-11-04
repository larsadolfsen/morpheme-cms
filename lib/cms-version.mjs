// Which version of the CMS a site takes, and when an update that did not build is undone: reads the site's package.json,
// compares versions and steps the update's watch. Exposes PACKAGE, WATCH_LIMIT, compareVersions, managedVersion,
// nextVersion and watchStep. No dependencies, no I/O (runs in a Worker and in Node).

/** The npm package of the CMS. */
export const PACKAGE = '@morphemecms/cms';

/** How long an update or its undo is watched before it counts as over, in milliseconds (20 minutes). */
export const WATCH_LIMIT = 20 * 60 * 1000;

const PLAIN = /^\d+\.\d+\.\d+$/;

/** True when a version has anything after X.Y.Z. */
const isPreRelease = (version) => !PLAIN.test(version);

/**
 * Compares two plain X.Y.Z versions number by number; throws Error('pre-release') for a version with a pre-release part.
 * @param {string} a
 * @param {string} b
 * @returns {-1 | 0 | 1}
 */
export function compareVersions(a, b) {
  if (isPreRelease(a) || isPreRelease(b)) throw new Error('pre-release');
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  }
  return 0;
}

/**
 * The version of the CMS a site's package.json pins exactly, or why the site does not let the CMS manage it.
 * @param {{ dependencies?: Record<string, string>, devDependencies?: Record<string, string> }} packageJson
 * @param {{ packages?: Record<string, { link?: boolean }> } | null | undefined} lock
 * @returns {{ version: string } | { reason: 'missing' | 'workspace' | 'tag' | 'range' | 'link' }}
 */
export function managedVersion(packageJson, lock) {
  const value = packageJson?.dependencies?.[PACKAGE] ?? packageJson?.devDependencies?.[PACKAGE];
  if (value === undefined) return { reason: 'missing' };
  if (value === '*' || value.startsWith('workspace:') || value.startsWith('file:')) return { reason: 'workspace' };
  if (lock?.packages?.['node_modules/@morphemecms/cms']?.link === true) return { reason: 'link' };
  if (!/\d+\.\d+/.test(value)) return { reason: 'tag' };
  if (!PLAIN.test(value)) return { reason: 'range' };
  return { version: value };
}

/**
 * The version to move to, and whether it is taken by itself; null when there is nothing newer to take.
 * @param {string} current
 * @param {string} latest
 * @param {string[]} skipped
 * @returns {null | { version: string, auto: boolean, why?: 'major' | 'skipped' }}
 */
export function nextVersion(current, latest, skipped) {
  if (isPreRelease(latest)) return null;
  if (compareVersions(latest, current) !== 1) return null;
  if (latest.split('.')[0] !== current.split('.')[0]) return { version: latest, auto: false, why: 'major' };
  if (skipped.includes(latest)) return { version: latest, auto: false, why: 'skipped' };
  return { version: latest, auto: true };
}

/**
 * What to do next with an update being watched (state 'waiting') or an undo being watched (state 'undoing').
 * @param {{ state: string, to: string, from: string, at: string, undoAt?: string }} update times are ISO strings
 * @param {string} running the version the site runs now
 * @param {'success' | 'failure' | null} check the result of the commit's check run
 * @param {number} now milliseconds
 * @returns {'wait' | 'done' | 'undo' | 'undone' | 'stuck'}
 */
export function watchStep(update, running, check, now) {
  if (update.state === 'waiting') {
    if (running === update.to) return 'done';
    if (check === 'failure') return 'undo';
    if (now - Date.parse(update.at) > WATCH_LIMIT) return 'undo';
    return 'wait';
  }
  if (update.state === 'undoing') {
    if (check === 'success') return 'undone';
    if (check === 'failure') return 'stuck';
    if (now - Date.parse(update.undoAt) > WATCH_LIMIT) return 'undone';
    return 'wait';
  }
  return 'wait';
}
