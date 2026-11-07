// A version's release notes, read from its npm tarball: unzips the tarball, finds CHANGELOG.md in the tar and cuts out the
// sections between two versions. Exposes gunzip, bytesFromTar, fileFromTar and sectionsBetween. Depends on ./cms-version.mjs; no node: imports
// (runs in a Cloudflare Worker and in Node 18+).
import { compareVersions } from './cms-version.mjs';

/**
 * Unzips gzip bytes.
 * @param {Uint8Array} bytes
 * @returns {Promise<Uint8Array>}
 */
export async function gunzip(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** The text of a NUL-terminated field of a tar header. */
function field(header, start, end) {
  const bytes = header.subarray(start, end);
  const nul = bytes.indexOf(0);
  return new TextDecoder().decode(nul === -1 ? bytes : bytes.subarray(0, nul));
}

/**
 * The bytes of the entry named exactly `path` in a tar, or null when there is none.
 * @param {Uint8Array} tar
 * @param {string} path
 * @returns {Uint8Array | null}
 */
export function bytesFromTar(tar, path) {
  let offset = 0;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) return null;
    const name = field(header, 0, 100);
    const prefix = field(header, 345, 500);
    const size = parseInt(field(header, 124, 136).trim(), 8) || 0;
    const data = tar.subarray(offset + 512, offset + 512 + size);
    if ((prefix ? prefix + '/' + name : name) === path) return data;
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return null;
}

/**
 * The UTF-8 text of the entry named exactly `path` in a tar, or null when there is none.
 * @param {Uint8Array} tar
 * @param {string} path
 * @returns {string | null}
 */
export function fileFromTar(tar, path) {
  const bytes = bytesFromTar(tar, path);
  return bytes === null ? null : new TextDecoder().decode(bytes);
}

/**
 * The changelog's sections for versions after `from` up to and including `to`, newest first, without empty ones.
 * @param {string} changelog
 * @param {string} from
 * @param {string} to
 * @returns {{ version: string, text: string }[]}
 */
export function sectionsBetween(changelog, from, to) {
  const sections = [];
  let current = null;
  for (const line of changelog.split(/\r?\n/)) {
    if (line.startsWith('## ')) {
      current = { version: line.slice(3).trim(), lines: [] };
      sections.push(current);
    } else if (current) current.lines.push(line);
  }
  return sections
    .filter(({ version }) => /^\d+\.\d+\.\d+$/.test(version) && compareVersions(version, from) === 1 && compareVersions(version, to) <= 0)
    .map(({ version, lines }) => ({ version, text: lines.join('\n').trim() }))
    .filter(({ text }) => text !== '')
    .sort((a, b) => compareVersions(b.version, a.version));
}
