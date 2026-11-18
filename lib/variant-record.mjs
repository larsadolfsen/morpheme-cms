// What each image size, share image and video still was made from, kept in public/images/_variants.json (served with the site, so the
// next build can take what did not change from the live site). Used by scripts/responsive-images.mjs and scripts/video-thumbnails.mjs.
// Exposes keyOf, readRecord, writeRecord, fetchLiveRecord, takeFromLive. Depends on node:crypto, node:fs and fetch.
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

/** the record's address under public/images/ and on the site */
export const RECORD_NAME = '_variants.json';

/** @param {...(string|number)} parts what an output was made from: the source's hash, its sizes and quality. @returns {string} */
export const keyOf = (...parts) => createHash('sha256').update(parts.join('\0')).digest('hex').slice(0, 32);

/** @param {Buffer|string} bytes @returns {string} the content hash of a source */
export const hashOf = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** @param {string} file @returns {Promise<Record<string,string>>} output (relative to public/images/) to key; {} when missing or broken */
export async function readRecord(file) {
  try {
    const record = JSON.parse(await fs.readFile(file, 'utf8'));
    return record && typeof record === 'object' && !Array.isArray(record) ? record : {};
  } catch {
    return {};
  }
}

/** Writes `record` with sorted keys, so the same outputs give the same bytes. */
export async function writeRecord(file, record) {
  const sorted = Object.fromEntries(Object.entries(record).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(sorted, null, 1) + '\n');
}

/** The live site's record, or {} when there is no live site, or it has none (a site built before this change). */
export async function fetchLiveRecord(siteUrl, fetch = globalThis.fetch) {
  if (!siteUrl) return {};
  try {
    const res = await fetch(`${siteUrl.replace(/\/$/, '')}/images/${RECORD_NAME}`, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return {};
    const record = await res.json();
    return record && typeof record === 'object' && !Array.isArray(record) ? record : {};
  } catch {
    return {};
  }
}

/** Whether `bytes` start like a webp or a JPEG, so an error page the live site answers with is never kept as an image. */
export function looksLikeImage(bytes) {
  const b = Buffer.from(bytes.subarray(0, 12));
  return (
    (b.length >= 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') || (b[0] === 0xff && b[1] === 0xd8)
  );
}

/**
 * Fetches `rel` (relative to public/images/) from the live site into `out`. False when it cannot be had, and the caller makes it.
 * @returns {Promise<boolean>}
 */
export async function takeFromLive(siteUrl, rel, out, fetch = globalThis.fetch) {
  try {
    const res = await fetch(`${siteUrl.replace(/\/$/, '')}/images/${rel.split('/').map(encodeURIComponent).join('/')}`, {
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return false;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (!looksLikeImage(bytes)) return false;
    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, bytes);
    return true;
  } catch {
    return false;
  }
}
