// The release notes of the minor line this package is in (x.y.0 up to its version): read at build time from the package's own release-notes/ files.
// Exposes runningNotes (the entries the Morpheme page shows, newest first; empty when the line has none).
// Depends on lib/releaseNotes.mjs (bundledNotes) and package.json's version. The globs are relative, so they work here and in a site's node_modules.
import { bundledNotes } from '../lib/releaseNotes.mjs';
import { version } from '../package.json';
import type { ReleasedNotes } from '../lib/releaseNotes.mjs';

const files = import.meta.glob<ReleasedNotes>('../release-notes/i18n/*/*.json', { eager: true, import: 'default' });
const images = import.meta.glob<string>('../release-notes/i18n/*/*/*.webp', { eager: true, query: '?url', import: 'default' });

export const runningNotes = bundledNotes(files, images, version);
