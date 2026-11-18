// Where a request's address points in a folder that a small static file server serves (check-text-measure.mjs).
import { resolve, sep } from 'node:path';

/** The file path of a request address inside `root`, or null when the address leaves `root` (an encoded or plain `..`,
 * a backslash, a NUL, a bad escape, or a path that is not under the root). The query and the fragment are dropped. */
export function pathInside(root, address) {
  const base = resolve(root);
  let path;
  try {
    path = decodeURIComponent(String(address).split(/[?#]/)[0]);
  } catch {
    return null;
  }
  if (path.includes('\0') || path.includes('\\')) return null;
  const file = resolve(base, `.${path.startsWith('/') ? path : `/${path}`}`);
  if (file !== base && !file.startsWith(base + sep)) return null;
  return file;
}
