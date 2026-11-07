// The build settings in src/data/build.json (Settings › Developer › Caching and builds): readBuildSettings fills in the defaults, and
// giveUpAfter is how long the editor waits for a save's build. Exposes BUILD_SETTINGS_PATH, readBuildSettings,
// giveUpAfter. No dependencies.

/** The settings file, from the repo root. */
export const BUILD_SETTINGS_PATH = 'src/data/build.json';

/**
 * @param {unknown} json the parsed contents of the file, or undefined when it is missing
 * @returns {{ contentLane: boolean, paidBuilds: boolean }} the settings with the defaults filled in; a key that is not a boolean counts as missing.
 */
export function readBuildSettings(json) {
  const defaults = { contentLane: true, paidBuilds: false };

  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    return { ...defaults };
  }

  const result = { ...defaults };

  for (const key of Object.keys(defaults)) {
    const value = json[key];

    if (typeof value === 'boolean') {
      result[key] = value;
    }
  }

  return result;
}

/**
 * @param {boolean} paidBuilds
 * @returns {number} milliseconds
 * how long the editor waits for a save's build before it says the build failed: 20 minutes on the free plan, where a build can queue behind others, 10 minutes on Workers Paid.
 */
export function giveUpAfter(paidBuilds) {
  return (paidBuilds ? 10 : 20) * 60_000;
}
