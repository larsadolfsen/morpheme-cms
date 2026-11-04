/**
 * Provides a short form of the CMS version for the editor's start screen.
 * Exposes the `shortVersion` function.
 * Depends on nothing.
 */

/** The CMS version as the start screen shows it: a pre-release without its build stamp, else the version as it is. */
export function shortVersion(version) {
  const match = /^(\d+\.\d+\.\d+-[a-z]+)-\d+$/.exec(version);
  return match ? match[1] : version;
}
