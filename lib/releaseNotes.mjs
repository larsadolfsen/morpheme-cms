// Pure helpers for release notes: checks pending notes (cards with a screenshot of the right type and size, lines), groups them per version and locale,
// picks a locale's notes, builds the notes of the running minor line from the package files and reads a version's notes and screenshots from its tar.
// Also builds the Worker's screenshot address and KV key, parses the address and adds the address to a version's cards.
// Exposes MAX_IMAGE_BYTES, IMAGE_WIDTH, MAX_IMAGE_HEIGHT, webpSize, problemsOf, released, imagePath, notesFor, bundledNotes, staleImageDirs, notesFromTar, imageUrl, imageKey,
// parseImagePath and withImageUrls. Depends on ./cms-version.mjs and ./changelog.mjs; no node: imports.
import { compareVersions } from './cms-version.mjs';
import { bytesFromTar, fileFromTar } from './changelog.mjs';

/** @typedef {{ id: string, kind: 'card', title: string, text: string, image?: string } | { id: string, kind: 'line', text: string }} ReleaseNote */
/** @typedef {{ version: string, notes: ReleaseNote[] }} ReleasedNotes */
/** @typedef {{ width: number, height: number }} ImageSize */
/** @typedef {{ note: object, imageBytes: number | null, imageSize: ImageSize | null }} PendingEntry  imageBytes: size of <id>.webp in bytes, null when there is none; imageSize: its pixels, null when it is not a WebP */
/** @typedef {Record<string, Record<string, PendingEntry>>} Pending  locale -> id -> entry */

/** The largest screenshot a card may have, in bytes. */
export const MAX_IMAGE_BYTES = 200 * 1024;

/** The width of a card's screenshot in pixels (375 CSS pixels at scale 2) and its greatest height (400 CSS pixels at scale 2). */
export const IMAGE_WIDTH = 750;
export const MAX_IMAGE_HEIGHT = 800;

/** The locales every pending note must exist in. */
const LOCALES = ['en-US', 'da-DK'];

/** The kinds of note. */
const KINDS = ['card', 'line'];

const pathOf = (locale, id) => `release-notes/i18n/${locale}/pending/${id}.json`;
const isFilled = (value) => typeof value === 'string' && value.trim() !== '';

/**
 * The size in pixels of a WebP image, read from its header (a lossy VP8, a lossless VP8L or an extended VP8X chunk).
 * @param {Uint8Array} bytes
 * @returns {ImageSize | null} null when `bytes` is not a WebP of one of these kinds
 */
export function webpSize(bytes) {
  const text = (from, to) => String.fromCharCode(...bytes.subarray(from, to));
  if (bytes.length < 30 || text(0, 4) !== 'RIFF' || text(8, 12) !== 'WEBP') return null;
  const u16 = (at) => bytes[at] | (bytes[at + 1] << 8);
  const u24 = (at) => u16(at) | (bytes[at + 2] << 16);
  switch (text(12, 16)) {
    case 'VP8 ':
      if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) return null;
      return { width: u16(26) & 0x3fff, height: u16(28) & 0x3fff };
    case 'VP8L':
      if (bytes[20] !== 0x2f) return null;
      return {
        width: 1 + (bytes[21] | ((bytes[22] & 0x3f) << 8)),
        height: 1 + ((bytes[22] >> 6) | (bytes[23] << 2) | ((bytes[24] & 0x0f) << 10)),
      };
    case 'VP8X':
      return { width: 1 + u24(24), height: 1 + u24(27) };
    default:
      return null;
  }
}

/**
 * The problems of one pending note: its id, its kind, its text and, for a card, its title and screenshot.
 * @param {string} locale
 * @param {string} id
 * @param {PendingEntry} entry
 * @returns {string[]}
 */
function entryProblems(locale, id, { note, imageBytes, imageSize }) {
  const path = pathOf(locale, id);
  const fields = note ?? {};
  const problems = [];
  if (fields.id !== id) problems.push(`${path}: id "${fields.id}" does not match the file name`);
  if (!KINDS.includes(fields.kind)) return [...problems, `${path}: kind must be "card" or "line"`];
  if (!isFilled(fields.text)) problems.push(`${path}: text is empty`);
  if (fields.kind === 'card') {
    if (!isFilled(fields.title)) problems.push(`${path}: title is empty`);
    if (imageBytes === null) problems.push(`${path}: a card needs the screenshot ${id}.webp`);
    else {
      const image = pathOf(locale, id).replace(/\.json$/, '.webp');
      if (imageBytes > MAX_IMAGE_BYTES) problems.push(`${image}: screenshot is ${Math.ceil(imageBytes / 1024)} KB, the limit is 200 KB`);
      if (!imageSize) problems.push(`${image}: screenshot is not a WebP file`);
      else if (imageSize.width !== IMAGE_WIDTH || imageSize.height > MAX_IMAGE_HEIGHT)
        problems.push(
          `${image}: screenshot is ${imageSize.width}×${imageSize.height} px, it must be ${IMAGE_WIDTH} px wide and at most ${MAX_IMAGE_HEIGHT} px high`,
        );
    }
  } else if (imageBytes !== null) {
    problems.push(`${path}: a line has no screenshot (${id}.webp)`);
  }
  return problems;
}

/**
 * The problems in the pending notes: a note missing in a locale, a kind that differs between locales, and each problem of
 * entryProblems. Names the file and the locale of each problem.
 * @param {Pending} pending
 * @returns {string[]} empty when all good
 */
export function problemsOf(pending) {
  const problems = [];
  const locales = [...new Set([...LOCALES, ...Object.keys(pending)])];
  const ids = [...new Set(locales.flatMap((locale) => Object.keys(pending[locale] ?? {})))];
  for (const id of ids) {
    const kinds = new Set();
    for (const locale of locales) {
      const entry = pending[locale]?.[id];
      if (!entry) {
        problems.push(`${pathOf(locale, id)} is missing`);
        continue;
      }
      problems.push(...entryProblems(locale, id, entry));
      kinds.add(entry.note?.kind);
    }
    if (kinds.size > 1) problems.push(`${id}: kind differs between locales`);
  }
  return problems;
}

/**
 * The pending notes of each locale as one release of `version`: the notes as they are in their files, sorted by id, and the
 * ids of the cards that have a screenshot. A locale without notes is left out.
 * @param {Pending} pending
 * @param {string} version
 * @returns {Record<string, { file: ReleasedNotes, images: string[] }>}
 */
export function released(pending, version) {
  const result = {};
  for (const [locale, entries] of Object.entries(pending)) {
    const ids = Object.keys(entries).sort();
    if (ids.length === 0) continue;
    result[locale] = {
      file: { version, notes: ids.map((id) => entries[id].note) },
      images: ids.filter((id) => entries[id].note.kind === 'card'),
    };
  }
  return result;
}

/**
 * The repository path of a released screenshot.
 * @param {string} version
 * @param {string} locale
 * @param {string} id
 * @returns {string}
 */
export function imagePath(version, locale, id) {
  return `release-notes/i18n/${locale}/${version}/${id}.webp`;
}

/**
 * The notes for a locale, else the en-US notes, else undefined.
 * @param {Record<string, ReleaseNote[]> | undefined} notes
 * @param {string} locale
 * @returns {ReleaseNote[] | undefined}
 */
export function notesFor(notes, locale) {
  return notes?.[locale] ?? notes?.['en-US'];
}

const PLAIN = /^\d+\.\d+\.\d+$/;
const sameMinor = (a, b) => a.split('.').slice(0, 2).join('.') === b.split('.').slice(0, 2).join('.');

/**
 * The notes of every released version in the running minor line (x.y.0 up to `version`), from the files the package carries
 * (release-notes/i18n/<locale>/<version>.json), newest first. A card gets the address of its screenshot
 * (<locale>/<version>/<id>.webp) when that file exists. Versions of another minor, newer versions and versions without notes are left out.
 * @param {Record<string, ReleasedNotes>} files path -> parsed notes file, e.g. '../release-notes/i18n/en-US/0.14.0.json'
 * @param {Record<string, string>} images path -> address, e.g. '../release-notes/i18n/en-US/0.14.0/<id>.webp'
 * @param {string} version the running version
 * @returns {{ version: string, text: string, notes: Record<string, ReleaseNote[]> }[]}
 */
export function bundledNotes(files, images, version) {
  const byVersion = {};
  for (const [path, file] of Object.entries(files)) {
    const match = /\/i18n\/([^/]+)\/([^/]+)\.json$/.exec(path);
    if (!match || !Array.isArray(file?.notes)) continue;
    const [, locale, v] = match;
    if (!PLAIN.test(v) || !sameMinor(v, version) || compareVersions(v, version) === 1) continue;
    byVersion[v] ??= {};
    byVersion[v][locale] = file.notes.map((note) => {
      if (note?.kind !== 'card') return note;
      const image = Object.entries(images).find(([imagePath]) => imagePath.endsWith(`/i18n/${locale}/${v}/${note.id}.webp`));
      return image ? { ...note, image: image[1] } : note;
    });
  }
  return Object.keys(byVersion)
    .sort((a, b) => compareVersions(b, a))
    .map((v) => ({ version: v, text: '', notes: byVersion[v] }));
}

/**
 * The screenshot folders of older minor lines: each x.y.z name whose major and minor differ from `version`'s. Never
 * `pending` or any other name.
 * @param {string[]} dirs names of the folders under release-notes/i18n/<locale>/
 * @param {string} version the running version
 * @returns {string[]}
 */
export const staleImageDirs = (dirs, version) => dirs.filter((name) => PLAIN.test(name) && !sameMinor(name, version));

/**
 * The release notes and screenshots of `version` from an unzipped npm tar. Notes: package/release-notes/i18n/<locale>/<version>.json
 * per locale. Screenshots: one per card, at imagePath(). A missing or unreadable notes file leaves its locale out; a missing
 * screenshot is left out. Returns undefined when no locale has notes.
 * @param {Uint8Array} tar
 * @param {string} version
 * @returns {{ notes: Record<string, ReleaseNote[]>, images: { locale: string, id: string, bytes: Uint8Array }[] } | undefined}
 */
export function notesFromTar(tar, version) {
  const notes = {};
  const images = [];
  for (const locale of LOCALES) {
    const text = fileFromTar(tar, `package/release-notes/i18n/${locale}/${version}.json`);
    if (text === null) continue;
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      continue; // Bad JSON: this locale has no notes.
    }
    if (!Array.isArray(parsed?.notes)) continue;
    notes[locale] = parsed.notes;
    for (const note of parsed.notes) {
      if (note?.kind !== 'card') continue;
      const bytes = bytesFromTar(tar, `package/${imagePath(version, locale, note.id)}`);
      if (bytes !== null) images.push({ locale, id: note.id, bytes });
    }
  }
  return Object.keys(notes).length > 0 ? { notes, images } : undefined;
}

/**
 * The address the editor loads a card's screenshot from (served by the Worker).
 * @param {string} version
 * @param {string} locale
 * @param {string} id
 * @returns {string}
 */
export function imageUrl(version, locale, id) {
  return `/api/cms/note-image/${version}/${locale}/${id}`;
}

/**
 * The KV key of a card's screenshot.
 * @param {string} version
 * @param {string} locale
 * @param {string} id
 * @returns {string}
 */
export const imageKey = (version, locale, id) => `cms:note-image:${version}:${locale}:${id}`;

/**
 * The parts of a screenshot address, or null when the path is not one or a part is not valid: version x.y.z, locale en-US or
 * da-DK, id of a-z, 0-9 and "-". Keeps any other text out of the KV key.
 * @param {string} pathname
 * @returns {{ version: string, locale: string, id: string } | null}
 */
export function parseImagePath(pathname) {
  const match = /^\/api\/cms\/note-image\/(\d+\.\d+\.\d+)\/(en-US|da-DK)\/([a-z0-9-]+)$/.exec(pathname);
  return match ? { version: match[1], locale: match[2], id: match[3] } : null;
}

/**
 * The notes of a version with the screenshot address set on each card. Does not change `notes`; lines stay as they are.
 * @param {string} version
 * @param {Record<string, ReleaseNote[]> | undefined} notes locale -> notes
 * @returns {Record<string, ReleaseNote[]> | undefined}
 */
export function withImageUrls(version, notes) {
  if (!notes) return notes;
  return Object.fromEntries(
    Object.entries(notes).map(([locale, list]) => [
      locale,
      list.map((note) => (note?.kind === 'card' ? { ...note, image: imageUrl(version, locale, note.id) } : note)),
    ]),
  );
}
