// The check of the build settings file (src/data/build.json, Indstillinger › Avanceret): an object with only the
// boolean keys contentLane and paidBuilds. Exposes buildSettingsProblems; used by check-content.mjs. No dependencies.

const KEYS = ['contentLane', 'paidBuilds'];

/**
 * @param {string} path the file's path, for the messages
 * @param {string | undefined} text the file's text, or undefined when it is missing (which passes)
 * @returns {string[]} what is wrong with the file, one line each
 */
export function buildSettingsProblems(path, text) {
  if (text === undefined) return [];
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    return [`${path}: er ikke gyldig JSON (${e.message})`];
  }
  if (typeof json !== 'object' || json === null || Array.isArray(json)) return [`${path}: skal være et objekt med ${KEYS.join(' og ')}`];
  return Object.entries(json).flatMap(([key, value]) =>
    !KEYS.includes(key)
      ? [`${path}: kender ikke nøglen "${key}" (kun ${KEYS.join(' og ')})`]
      : typeof value !== 'boolean'
        ? [`${path}: "${key}" skal være true eller false`]
        : [],
  );
}
