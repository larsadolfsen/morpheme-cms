// The release notes of the minor line this package is in (x.y.0 up to its version): read at build time from the package's own release-notes/ files.
// Exposes runningNotes (the entries the Morpheme page shows, newest first; empty when the line has none) and runningEdition
// (the edition this version belongs to: the place its photo is from, and the photo; undefined when there is none).
// Depends on lib/releaseNotes.mjs (bundledNotes) and package.json's version. The globs are relative, so they work here and in a site's node_modules.
import { bundledNotes, editionOf } from '../lib/releaseNotes.mjs';
import { version } from '../package.json';
import type { ReleasedNotes } from '../lib/releaseNotes.mjs';

const files = import.meta.glob<ReleasedNotes>('../release-notes/i18n/*/*.json', { eager: true, import: 'default' });
const images = import.meta.glob<string>('../release-notes/i18n/*/*/*.webp', { eager: true, query: '?url', import: 'default' });

export const runningNotes = bundledNotes(files, images, version);

const editions = import.meta.glob<{ name?: string }>('../release-notes/editions/*.json', { eager: true, import: 'default' });
const editionImages = import.meta.glob<string>('../release-notes/editions/*.webp', { eager: true, query: '?url', import: 'default' });

export const runningEdition = editionOf(editions, editionImages, version);
