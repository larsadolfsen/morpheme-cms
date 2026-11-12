// The release notes on the Morpheme page (#morpheme), as an article: its title, then per version a heading ("New in
// Morpheme Braies 0.14.3"), the day it was released and, under a line's newest version, its edition's photo; its paragraphs
// in the editor's language (else English) as sections with a title and a text, and its other changes as a list under
// "Also in this version"; for a version without notes, its text. No screenshots: the start screen's update card
// (UpdatesNotice.tsx) shows them. Exposes ReleaseNotes and VersionNotes; it only composes ReleaseNoteSection.tsx and
// ReleaseNoteLines.tsx. Depends on lib/releaseNotes.mjs (notesFor) and i18n.
import { locale, t } from './i18n';
import { isParagraph, notesFor } from '../lib/releaseNotes.mjs';
import type { Edition, ReleaseNote } from '../lib/releaseNotes.mjs';
import { ReleaseNoteSection } from './ReleaseNoteSection';
import { ReleaseNoteLines } from './ReleaseNoteLines';

/** A version's notes; `date` (YYYY-MM-DD) and `edition` for the versions the package carries (bundledNotes.ts). */
export type VersionNotes = {
  version: string;
  text: string;
  date?: string;
  edition?: Edition;
  notes?: Record<string, ReleaseNote[]>;
};

/** A day (YYYY-MM-DD) as the editor's language writes it ("November 7, 2026"). */
const dayOf = (date: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));

type Paragraph = Extract<ReleaseNote, { kind: 'paragraph' }>;

function VersionEntry({ entry, photo }: { entry: VersionNotes; photo: boolean }) {
  const notes = notesFor(entry.notes, locale) ?? [];
  const paragraphs = notes.filter((note): note is Paragraph => isParagraph(note));
  const lines = notes.filter((note) => note.kind === 'line');
  // A test version (0.14.3-next-…) is named as the version it leads to.
  const version = entry.version.split('-')[0];
  const name = entry.edition?.name ? t.library.cmsEdition(entry.edition.name, version) : t.library.cmsVersion(version);
  return (
    <section className="space-y-5 border-t border-outline-variant pt-5 first-of-type:border-t-0 first-of-type:pt-0">
      <div className="space-y-3">
        <div>
          <h3 className="text-xl">{t.cms.newIn(name)}</h3>
          {entry.date && (
            <p className="text-sm text-on-surface-variant">
              <time dateTime={entry.date}>{dayOf(entry.date)}</time>
            </p>
          )}
        </div>
        {photo && entry.edition && (
          <img
            src={entry.edition.image}
            alt={entry.edition.place[locale] ?? entry.edition.place['en-US'] ?? entry.edition.name}
            className="block aspect-[3/2] w-full rounded-xl object-cover"
          />
        )}
      </div>
      {!notes.length && entry.text && <p className="text-base">{entry.text}</p>}
      {paragraphs.map((note) => (
        <ReleaseNoteSection key={note.id} note={note} />
      ))}
      {lines.length > 0 && <ReleaseNoteLines lines={lines} />}
    </section>
  );
}

export function ReleaseNotes({ title, entries }: { title?: string; entries: VersionNotes[] }) {
  return (
    <article className="mb-8 max-w-prose space-y-5 px-4 not-first:mt-8">
      {title && <h2 className="text-2xl">{title}</h2>}
      {entries.map((entry, i) => (
        // One photo per line: under its newest version's heading.
        <VersionEntry key={entry.version} entry={entry} photo={entry.edition?.line !== entries[i - 1]?.edition?.line} />
      ))}
    </article>
  );
}
