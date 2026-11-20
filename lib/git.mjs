// Git's ids for a file's content (a blob) and a folder (a tree), as git computes them, for the editor
// (packages/editor/src/github.ts) and the site's Worker (packages/editor/worker/files.js): what either gets from GitHub, R2 or the site
// is checked against them, so a file is never kept or saved broken. No Node, no DOM: both run it.

const encoder = new TextEncoder();

/** Git's id for a file's content: sha1 of "blob <size>\0<content>". @param {Uint8Array} bytes */
export async function blobId(bytes) {
  return sha1(join([encoder.encode(`blob ${bytes.length}\0`), bytes]));
}

/** The mode git gives a folder in a tree (040000), as GitHub's GraphQL API gives modes: a number. */
export const TREE_MODE = 0o40000;

/**
 * A folder's entries in git's order: by the names' bytes, a folder's as if it ended with "/".
 * @template {{ name: string, mode: number }} E
 * @param {E[]} entries
 * @returns {E[]}
 */
export function sortTree(entries) {
  const keyed = entries.map((e) => ({ e, key: encoder.encode(e.mode === TREE_MODE ? `${e.name}/` : e.name) }));
  return keyed.sort((a, b) => compare(a.key, b.key)).map(({ e }) => e);
}

/**
 * Git's id for a folder: sha1 of "tree <size>\0" and its entries in git's order, each "<mode in octal> <name>\0" and
 * the 20 bytes of its id.
 * @param {{ name: string, oid: string, mode: number }[]} entries
 */
export async function treeId(entries) {
  const body = join(sortTree(entries).flatMap((e) => [encoder.encode(`${e.mode.toString(8)} ${e.name}\0`), hexBytes(e.oid)]));
  return sha1(join([encoder.encode(`tree ${body.length}\0`), body]));
}

/** @param {Uint8Array} a @param {Uint8Array} b */
function compare(a, b) {
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] !== b[i]) return a[i] - b[i];
  return a.length - b.length;
}

/** @param {Uint8Array[]} parts */
function join(parts) {
  const all = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    all.set(p, at);
    at += p.length;
  }
  return all;
}

/** @param {string} hex */
function hexBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(2 * i, 2 * i + 2), 16);
  return bytes;
}

/** @param {Uint8Array} bytes */
async function sha1(bytes) {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-1', bytes));
  return Array.from(hash, (b) => b.toString(16).padStart(2, '0')).join('');
}
