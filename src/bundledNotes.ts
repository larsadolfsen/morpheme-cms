// The release notes of the minor line this package is in (x.y.0 up to its version): read at build time from the package's own release-notes/ files.
// Exposes runningNotes (the entries the Morpheme page shows, newest first, each with its date and its edition; on a test
// version first the notes merged since the last release; empty when the line has none) and runningEdition
// (the edition this version belongs to: the place its photo is from, short and in full, and the photo; undefined when there is none)
// and editionPhotos (each edition's photo by its version).
// Depends on lib/releaseNotes.mjs (bundledNotes) and package.json's version. The globs are relative, so they work here and in a site's node_modules.
import { bundledNotes, editionOf } from '../lib/releaseNotes.mjs';
import { version } from '../package.json';
import type { ReleasedNotes, ReleaseNote } from '../lib/releaseNotes.mjs';

const files = import.meta.glob<ReleasedNotes>('../release-notes/i18n/*/*.json', { eager: true, import: 'default' });
// The notes merged since the last release: a test version (npm tag next) shows them as its own.
const pending = import.meta.glob<ReleaseNote>('../release-notes/i18n/*/pending/*.json', { eager: true, import: 'default' });
const images = import.meta.glob<string>('../release-notes/i18n/*/*/*.webp', { eager: true, query: '?url', import: 'default' });

const editions = import.meta.glob<{ name?: string; place?: Record<string, string>; photo?: { by?: string } }>(
  '../release-notes/editions/*.json',
  {
    eager: true,
    import: 'default',
  },
);
const editionImages = import.meta.glob<string>('../release-notes/editions/*.webp', { eager: true, query: '?url', import: 'default' });

export const runningEdition = editionOf(editions, editionImages, version);

export const runningNotes = bundledNotes(files, images, version, pending).map((entry) => ({
  ...entry,
  edition: editionOf(editions, editionImages, entry.version),
}));

/** Each edition's photo, whole, by its version: on its page under "Licenses" (LicensePage). */
export const editionPhotos: Record<string, string> = Object.fromEntries(
  Object.entries(editionImages).map(([path, url]) => [
    path
      .split('/')
      .pop()!
      .replace(/\.webp$/, ''),
    url,
  ]),
);
