// The release notes on the Morpheme page (#morpheme), as an article: its title, then per version a heading ("New in
// Morpheme Braies 0.14.3"), the day it was released and its edition's photo, its cards in the editor's language (else
// English) as sections with a title and a text, and its other changes as a list under "Also in this version"; for a
// version without notes, its text. The newest three, then "Show older versions" for the rest. No screenshots: the start
// screen's update card (UpdatesNotice.tsx) shows them. Exposes ReleaseNotes and VersionNotes; it only composes
// ReleaseNoteSection.tsx and ReleaseNoteLines.tsx. Depends on lib/releaseNotes.mjs (notesFor) and i18n.
import { useState } from 'react';
import { locale, t } from './i18n';
import { Button } from './ui';
import { notesFor } from '../lib/releaseNotes.mjs';
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

type Card = Extract<ReleaseNote, { kind: 'card' }>;

function VersionEntry({ entry }: { entry: VersionNotes }) {
  const notes = notesFor(entry.notes, locale) ?? [];
  const cards = notes.filter((note): note is Card => note.kind === 'card');
  const lines = notes.filter((note) => note.kind === 'line');
  // A test version (0.14.3-next-…) is named as the version it leads to.
  const version = entry.version.split('-')[0];
  const name = entry.edition ? t.library.cmsEdition(entry.edition.name, version) : t.library.cmsVersion(version);
  return (
    <section className="space-y-5 border-t border-line pt-5 first-of-type:border-t-0 first-of-type:pt-0">
      <div className="space-y-3">
        <div>
          <h3 className="text-xl">{t.cms.newIn(name)}</h3>
          {entry.date && (
            <p className="text-sm text-muted">
              <time dateTime={entry.date}>{dayOf(entry.date)}</time>
            </p>
          )}
        </div>
        {entry.edition && (
          <img
            src={entry.edition.image}
            alt={entry.edition.place[locale] ?? entry.edition.place['en-US'] ?? entry.edition.name}
            className="block aspect-[3/2] w-full rounded-xl object-cover"
          />
        )}
      </div>
      {!notes.length && entry.text && <p className="text-base">{entry.text}</p>}
      {cards.map((note) => (
        <ReleaseNoteSection key={note.id} note={note} />
      ))}
      {lines.length > 0 && <ReleaseNoteLines lines={lines} />}
    </section>
  );
}

/** How many versions show before "Show older versions". */
const SHOWN = 3;

export function ReleaseNotes({ title, entries }: { title: string; entries: VersionNotes[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? entries : entries.slice(0, SHOWN);
  return (
    <article className="mb-8 max-w-prose space-y-5 px-4 not-first:mt-8">
      <h2 className="text-2xl">{title}</h2>
      {shown.map((entry) => (
        <VersionEntry key={entry.version} entry={entry} />
      ))}
      {!all && entries.length > SHOWN && (
        <Button kind="text" onClick={() => setAll(true)}>
          {t.cms.showOlder}
        </Button>
      )}
    </article>
  );
}
