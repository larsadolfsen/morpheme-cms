// One release note paragraph as a section of the release notes: its title and its text.
// Exposes ReleaseNoteSection. Depends on the release note type of lib/releaseNotes.mjs.
import type { ReleaseNote } from '../lib/releaseNotes.mjs';

export function ReleaseNoteSection({ note }: { note: Extract<ReleaseNote, { kind: 'paragraph' }> }) {
  return (
    <div className="space-y-1">
      <h4 className="text-lg font-medium">{note.title}</h4>
      <p className="text-base">{note.text}</p>
    </div>
  );
}
