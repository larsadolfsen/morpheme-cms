// The release notes on the Morpheme page (#morpheme), as an article: its title, then per version a small heading, its
// cards in the editor's language (else English) as sections with a title and a text, and its other changes as a list
// under "Also in this version"; for a version without notes, its text. No cards and no screenshots: the start screen's
// update card (UpdatesNotice.tsx) shows the pictures. Exposes ReleaseNotes and VersionNotes. Depends on
// lib/releaseNotes.mjs (notesFor) and i18n.
import { locale, t } from './i18n';
import { notesFor } from '../lib/releaseNotes.mjs';
import type { ReleaseNote } from '../lib/releaseNotes.mjs';

export type VersionNotes = { version: string; text: string; notes?: Record<string, ReleaseNote[]> };

type Card = Extract<ReleaseNote, { kind: 'card' }>;

function VersionEntry({ entry }: { entry: VersionNotes }) {
  const notes = notesFor(entry.notes, locale) ?? [];
  const cards = notes.filter((note): note is Card => note.kind === 'card');
  const lines = notes.filter((note) => note.kind === 'line');
  return (
    <section className="space-y-5 border-t border-line pt-5 first-of-type:border-t-0 first-of-type:pt-0">
      <h3 className="text-sm font-medium text-muted">{t.cms.running(entry.version)}</h3>
      {!notes.length && entry.text && <p className="text-base">{entry.text}</p>}
      {cards.map((note) => (
        <div key={note.id} className="space-y-1">
          <h4 className="text-lg font-medium">{note.title}</h4>
          <p className="text-base">{note.text}</p>
        </div>
      ))}
      {lines.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-base font-medium">{t.cms.alsoInThisVersion}</h4>
          <ul className="list-disc space-y-1 ps-5 text-base marker:text-accent">
            {lines.map((note) => (
              <li key={note.id}>{note.text}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function ReleaseNotes({ title, entries }: { title: string; entries: VersionNotes[] }) {
  return (
    <article className="mb-8 max-w-prose space-y-5 px-4 not-first:mt-8">
      <h2 className="text-2xl">{title}</h2>
      {entries.map((entry) => (
        <VersionEntry key={entry.version} entry={entry} />
      ))}
    </article>
  );
}
