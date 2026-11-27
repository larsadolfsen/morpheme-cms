// One release note paragraph as a section of the release notes: its title and its text.
// Exposes ReleaseNoteSection. Depends on the release note type of lib/releaseNotes.mjs.
import type { ReleaseNote } from '../lib/releaseNotes.mjs';

export function ReleaseNoteSection({ note }: { note: Extract<ReleaseNote, { kind: 'paragraph' }> }) {
  return (
    <div className="mo-editor-stack-50">
      <h4 className="mo-type-title-medium">{note.title}</h4>
      <p className="mo-type-body-large">{note.text}</p>
    </div>
  );
}
