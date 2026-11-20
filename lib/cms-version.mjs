// Which version of the CMS a site takes, and when an update that did not build is undone: reads the site's package.json,
// compares versions, steps the update's watch and says when the daily check of npm is due. Exposes PACKAGE, WATCH_LIMIT,
// NIGHT_HOUR, compareVersions, managedVersion, nextVersion, watchStep, siteZone, localDay and checkDue. No dependencies, no I/O (runs in a Worker and in Node).

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

/** The hour of the night, in the site's own time zone, from which the day's check of npm is due (03:00). */
export const NIGHT_HOUR = 3;

// The time zone of a country whose language a site can be written in, by the country of the site's locale ("da-DK": DK).
// A country with more than one zone gets its most populous one; a locale with none here is checked in UTC.
const ZONES = {
  DK: 'Europe/Copenhagen',
  SE: 'Europe/Stockholm',
  NO: 'Europe/Oslo',
  FI: 'Europe/Helsinki',
  IS: 'Atlantic/Reykjavik',
  DE: 'Europe/Berlin',
  AT: 'Europe/Vienna',
  CH: 'Europe/Zurich',
  NL: 'Europe/Amsterdam',
  BE: 'Europe/Brussels',
  FR: 'Europe/Paris',
  ES: 'Europe/Madrid',
  IT: 'Europe/Rome',
  PL: 'Europe/Warsaw',
  GB: 'Europe/London',
  IE: 'Europe/Dublin',
  US: 'America/New_York',
  CA: 'America/Toronto',
  AU: 'Australia/Sydney',
  NZ: 'Pacific/Auckland',
};

const validZone = (zone) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
};

/**
 * The site's own time zone: `timeZone` in its config when it is a valid IANA zone, else the zone of its locale's country,
 * else UTC.
 * @param {{ timeZone?: string, locale?: string }} config
 * @returns {string}
 */
export function siteZone(config) {
  if (typeof config?.timeZone === 'string' && config.timeZone && validZone(config.timeZone)) return config.timeZone;
  const country = /-([A-Z]{2})\b/i.exec(String(config?.locale ?? ''))?.[1]?.toUpperCase();
  return (country && ZONES[country]) || 'UTC';
}

const formats = new Map();

/**
 * The date ("2026-11-14") and the hour (0-23) a moment has in a time zone.
 * @param {number} at milliseconds
 * @param {string} zone
 * @returns {{ date: string, hour: number }}
 */
export function localDay(at, zone) {
  let format = formats.get(zone);
  if (!format) {
    format = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
    });
    formats.set(zone, format);
  }
  const p = Object.fromEntries(format.formatToParts(at).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24 };
}

/**
 * Whether the hourly run checks npm now: once a day, from NIGHT_HOUR in the site's time zone. Due when the site was never
 * checked; else only from NIGHT_HOUR, when the last check was before NIGHT_HOUR today there (on an earlier day, or in the
 * small hours of today), or when npm or GitHub could not be reached then (tried again the next hour). Counting days, not hours, a change to or from summer time neither skips nor
 * doubles a day's check; a run missed at NIGHT_HOUR is made up at the next hourly run of the same day.
 * @param {number} now milliseconds
 * @param {{ at?: string, problem?: { kind?: string } } | null} checked the last check (cms:checked)
 * @param {string} zone
 * @returns {boolean}
 */
export function checkDue(now, checked, zone) {
  const last = Date.parse(checked?.at ?? '');
  if (Number.isNaN(last)) return true;
  const today = localDay(now, zone);
  if (today.hour < NIGHT_HOUR) return false;
  if (checked?.problem?.kind === 'unreachable') return true;
  const before = localDay(last, zone);
  return before.date !== today.date || before.hour < NIGHT_HOUR;
}
