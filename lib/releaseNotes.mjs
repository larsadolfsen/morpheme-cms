// Pure helpers for release notes: checks pending notes, groups them per version and locale, picks a locale's notes and
// lists the versions an update brought, reads a version's notes from its tar. Exposes NOTE_FIELDS, problemsOf, released,
// notesFor, installedVersions and notesFromTar. Depends on ./cms-version.mjs and ./changelog.mjs; no node: imports.
import { compareVersions } from './cms-version.mjs';
import { fileFromTar } from './changelog.mjs';

/** @typedef {{ id: string, title: string, why: string, how: string, what: string }} ReleaseNote */
/** @typedef {{ version: string, notes: ReleaseNote[] }} ReleasedNotes */
/** @typedef {Record<string, Record<string, ReleaseNote>>} Pending  locale -> file name without .json -> note */

/** The fields every note fills in. */
export const NOTE_FIELDS = ['title', 'why', 'how', 'what'];

/** The locales every pending note must exist in. */
const LOCALES = ['en-US', 'da-DK'];

/**
 * The problems in the pending notes: a note missing in a locale, an id that differs from its file name, an empty field.
 * @param {Pending} pending
 * @returns {string[]} empty when all good
 */
export function problemsOf(pending) {
  const problems = [];
  const locales = [...new Set([...LOCALES, ...Object.keys(pending)])];
  const files = [...new Set(locales.flatMap((locale) => Object.keys(pending[locale] ?? {})))];
  for (const locale of locales) {
    for (const file of files) {
      const note = pending[locale]?.[file];
      if (!note) {
        problems.push(`${file} is missing in ${locale}`);
        continue;
      }
      if (note.id !== file) problems.push(`${locale}/${file}: id "${note.id}" does not match the file name`);
      for (const field of NOTE_FIELDS) {
        if (typeof note[field] !== 'string' || note[field].trim() === '') problems.push(`${locale}/${file}: ${field} is empty`);
      }
    }
  }
  return problems;
}

/**
 * The pending notes of each locale as one release of `version`, notes sorted by id. A locale without notes is left out.
 * @param {Pending} pending
 * @param {string} version
 * @returns {Record<string, ReleasedNotes>}
 */
export function released(pending, version) {
  const result = {};
  for (const [locale, files] of Object.entries(pending)) {
    const notes = Object.values(files).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    if (notes.length > 0) result[locale] = { version, notes };
  }
  return result;
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
 * The release notes of `version` from an unzipped npm tar: package/release-notes/i18n/<locale>/<version>.json per locale.
 * A missing or unreadable file leaves its locale out. Returns undefined when no locale has notes.
 * @param {Uint8Array} tar
 * @param {string} version
 * @returns {Record<string, ReleaseNote[]> | undefined}
 */
export function notesFromTar(tar, version) {
  const notes = {};
  for (const locale of LOCALES) {
    const text = fileFromTar(tar, `package/release-notes/i18n/${locale}/${version}.json`);
    if (text === null) continue;
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed?.notes)) notes[locale] = parsed.notes;
    } catch {
      // Bad JSON: this locale has no notes.
    }
  }
  return Object.keys(notes).length > 0 ? notes : undefined;
}
