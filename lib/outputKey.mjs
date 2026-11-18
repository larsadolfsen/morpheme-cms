// The key of an output that is kept between builds (the editor's built bundle, a check's build, image sizes): the hash of everything
// the output is made from, so it is reused when the key matches and made again when anything changed. Never made from file times: a
// fresh clone gives every file a new time. One function for both tracks of docs/superpowers/plans/2026-11-18-build-and-check-speed.md
// (building block 1). Exposes outputKey, KEY_VERSION. Only node:crypto.
import { createHash } from 'node:crypto';

/** Raise it when this function's way of hashing changes, so no key made before can match a key made after. */
export const KEY_VERSION = 1;

const hash = (data) => createHash('sha256').update(data).digest('hex');

/**
 * @param {{ files?: Array<{ path: string, content: string | Uint8Array }>, values?: Record<string, string | number | boolean | null> }} inputs
 * `files`: every file the output is made from, with its path in the repository and its bytes; `values`: everything else it depends on
 * (the Node version, a build option).
 * @returns {string} 64 hex characters. The same inputs in any order give the same key; any change to a path, to a byte, to a value, or a
 * file added or left out gives another.
 */
export function outputKey({ files = [], values = {} }) {
  const seen = new Set();
  const lines = files.map(({ path, content }) => {
    const name = path.replace(/\\/g, '/');
    if (seen.has(name)) throw new Error(`outputKey: the file ${name} is listed twice`);
    seen.add(name);
    // The content as its own hash and the name as JSON, so no name and content can be moved against each other to give the same text.
    return `file ${JSON.stringify(name)} ${hash(content)}`;
  });
  // Sorted by code unit, not by locale, so every machine orders the same.
  lines.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const names = Object.keys(values).sort();
  for (const name of names) lines.push(`value ${JSON.stringify(name)} ${JSON.stringify(values[name])}`);
  return hash(`morpheme-output-key ${KEY_VERSION}\n${lines.join('\n')}\n`);
}
