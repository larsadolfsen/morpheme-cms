// A titled list of versions with their release notes on the Morpheme page (#morpheme): per version a small heading and its
// notes as cards in the editor's language (else English), or, for a version without notes, one row with its text.
// Exposes ReleaseNotes and VersionNotes. Depends on ReleaseNoteCard, ui.tsx, lib/releaseNotes.mjs (notesFor) and i18n.
import { ReleaseNoteCard } from './ReleaseNoteCard';
import { GroupTitle, Group, ListItem } from './ui';
import { locale, t } from './i18n';
import { notesFor } from '../lib/releaseNotes.mjs';
import type { ReleaseNote } from '../lib/releaseNotes.mjs';

export type VersionNotes = { version: string; text: string; notes?: Record<string, ReleaseNote[]> };

function VersionEntry({ entry }: { entry: VersionNotes }) {
  const notes = notesFor(entry.notes, locale);
  if (!notes?.length) {
    return (
      <Group>
        <ListItem headline={t.cms.running(entry.version)} supporting={entry.text} />
      </Group>
    );
  }
  return (
    <div className="mb-6 space-y-3">
      <h3 className="px-4 text-sm font-medium text-muted">{t.cms.running(entry.version)}</h3>
      {notes.map((note) => (
        <ReleaseNoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}

export function ReleaseNotes({ title, entries }: { title: string; entries: VersionNotes[] }) {
  return (
    <section className="mb-8">
      <GroupTitle>{title}</GroupTitle>
      {entries.map((entry) => (
        <VersionEntry key={entry.version} entry={entry} />
      ))}
    </section>
  );
}
