// Which lane a Cloudflare build takes (morpheme ci-build): the content lane, with the editor's checks only, when every
// file changed since the live commit is content; else the full lane. Exposes CONTENT_PATHS, laneFor. No dependencies.

/** the folders an editor save writes to; a change anywhere else is code. */
export const CONTENT_PATHS = ['src/content/', 'src/drafts/', 'src/data/', 'public/images/uploads/'];

/**
 * @param {string[] | null} paths the files changed since the live commit, or `null` when they are not known
 * @param {{ contentLane: boolean }} settings (from readBuildSettings)
 * @param {string} [why] the caller's reason it has no list
 * @returns {{ lane: 'content' | 'full', reason: string }}
 * any doubt gives the full lane.
 */
export function laneFor(paths, settings, why) {
  if (settings.contentLane === false) return { lane: 'full', reason: 'turned off in the editor' };
  if (paths === null) return { lane: 'full', reason: why ?? 'changed files unknown' };
  if (paths.length === 0) return { lane: 'full', reason: 'nothing changed since the live commit' };
  const normalised = paths.map((p) => p.replace(/\\/g, '/'));
  for (const path of normalised) {
    if (!CONTENT_PATHS.some((prefix) => path.startsWith(prefix))) return { lane: 'full', reason: 'code changed: ' + path };
  }
  return { lane: 'content', reason: 'only content changed (' + paths.length + ' files)' };
}
