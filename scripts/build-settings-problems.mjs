// The check of the build settings file (src/data/build.json, Settings › Developer › Caching and builds): an object with only the
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
    return [`${path}: is not valid JSON (${e.message})`];
  }
  if (typeof json !== 'object' || json === null || Array.isArray(json)) return [`${path}: must be an object with ${KEYS.join(' and ')}`];
  return Object.entries(json).flatMap(([key, value]) =>
    !KEYS.includes(key)
      ? [`${path}: does not know the key "${key}" (only ${KEYS.join(' and ')})`]
      : typeof value !== 'boolean'
        ? [`${path}: "${key}" must be true or false`]
        : [],
  );
}
