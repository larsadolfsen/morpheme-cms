// The smaller changes of a version as a list under "Also in this version", one line each.
// Exposes ReleaseNoteLines. Depends on i18n and the release note type of lib/releaseNotes.mjs.
import { t } from './i18n';
import type { ReleaseNote } from '../lib/releaseNotes.mjs';

export function ReleaseNoteLines({ lines }: { lines: ReleaseNote[] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-base font-medium">{t.cms.alsoInThisVersion}</h4>
      <ul className="list-disc space-y-1 ps-5 text-base marker:text-accent">
        {lines.map((note) => (
          <li key={note.id}>{note.text}</li>
        ))}
      </ul>
    </div>
  );
}
