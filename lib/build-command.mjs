// The Cloudflare build command of a site's wrangler.jsonc: `npx morpheme ci-build` (the content lane or the full one). Exposes
// BUILD_COMMAND, usesCiBuild and withCiBuild. Pure text, no I/O: runs in the Worker (the CMS update) and in Node (check:content).

export const BUILD_COMMAND = 'npx morpheme ci-build';

/** The `"command": "…"` inside the `"build": { … }` block, as a match with the value in group 2; null when there is none. @param {string} text */
const commandIn = (text) => /("build"\s*:\s*\{[^}]*?"command"\s*:\s*")([^"]*)(")/.exec(text);

/**
 * Whether the site builds with `morpheme ci-build`. A site with no file, no build block or no command has nothing to change, so it counts.
 * @param {string | null | undefined} text wrangler.jsonc
 */
export function usesCiBuild(text) {
  const match = typeof text === 'string' ? commandIn(text) : null;
  return !match || /\bmorpheme ci-build\b/.test(match[2]);
}

/**
 * The file with the build command moved to `npx morpheme ci-build`; null when it needs no change.
 * @param {string | null | undefined} text wrangler.jsonc
 * @returns {string | null}
 */
export function withCiBuild(text) {
  if (typeof text !== 'string' || usesCiBuild(text)) return null;
  const match = commandIn(text);
  return text.slice(0, match.index) + match[1] + BUILD_COMMAND + match[3] + text.slice(match.index + match[0].length);
}
