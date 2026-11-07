// Pure helpers for release notes: checks pending notes (cards with a screenshot, lines), groups them per version and locale,
// picks a locale's notes, lists the versions an update brought and reads a version's notes and screenshots from its tar.
// Also builds the Worker's screenshot address and KV key, parses the address and adds the address to a version's cards.
// Exposes MAX_IMAGE_BYTES, problemsOf, released, imagePath, notesFor, installedVersions, notesFromTar, imageUrl, imageKey,
// parseImagePath and withImageUrls. Depends on ./cms-version.mjs and ./changelog.mjs; no node: imports.
import { compareVersions } from './cms-version.mjs';
import { bytesFromTar, fileFromTar } from './changelog.mjs';

/** @typedef {{ id: string, kind: 'card', title: string, text: string, image?: string } | { id: string, kind: 'line', text: string }} ReleaseNote */
/** @typedef {{ version: string, notes: ReleaseNote[] }} ReleasedNotes */
/** @typedef {{ note: object, imageBytes: number | null }} PendingEntry  imageBytes: size of <id>.webp, null when there is none */
/** @typedef {Record<string, Record<string, PendingEntry>>} Pending  locale -> id -> entry */

/** The largest screenshot a card may have, in bytes. */
export const MAX_IMAGE_BYTES = 200 * 1024;

/** The locales every pending note must exist in. */
const LOCALES = ['en-US', 'da-DK'];

/** The kinds of note. */
const KINDS = ['card', 'line'];

const pathOf = (locale, id) => `release-notes/i18n/${locale}/pending/${id}.json`;
const isFilled = (value) => typeof value === 'string' && value.trim() !== '';

/**
 * The problems of one pending note: its id, its kind, its text and, for a card, its title and screenshot.
 * @param {string} locale
 * @param {string} id
 * @param {PendingEntry} entry
 * @returns {string[]}
 */
function entryProblems(locale, id, { note, imageBytes }) {
  const path = pathOf(locale, id);
  const fields = note ?? {};
  const problems = [];
  if (fields.id !== id) problems.push(`${path}: id "${fields.id}" does not match the file name`);
  if (!KINDS.includes(fields.kind)) return [...problems, `${path}: kind must be "card" or "line"`];
  if (!isFilled(fields.text)) problems.push(`${path}: text is empty`);
  if (fields.kind === 'card') {
    if (!isFilled(fields.title)) problems.push(`${path}: title is empty`);
    if (imageBytes === null) problems.push(`${path}: a card needs the screenshot ${id}.webp`);
    else if (imageBytes > MAX_IMAGE_BYTES) problems.push(`${path}: screenshot is ${Math.ceil(imageBytes / 1024)} KB, the limit is 200 KB`);
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

/**
 * The kept versions an update brought, newest first. After a finished update to the running version: the versions after
 * `from` up to the running one. Else: the running version alone, when it is kept.
 * @param {{ from?: string, to: string, state: string } | null} update
 * @param {string} running
 * @param {string[]} kept versions that have notes in KV
 * @returns {string[]}
 */
export function installedVersions(update, running, kept) {
  const finished = update?.state === 'done' && update.to === running && typeof update.from === 'string';
  const versions = finished
    ? kept.filter((version) => compareVersions(version, update.from) === 1 && compareVersions(version, running) <= 0)
    : kept.filter((version) => version === running);
  return versions.sort((a, b) => compareVersions(b, a));
}

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
