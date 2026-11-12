// The smaller changes of a version as a list under "Also in this version", one line each; a long word (a file path
// from the changelog) wraps.
// Exposes ReleaseNoteLines. Depends on i18n and the release note type of lib/releaseNotes.mjs.
import { t } from './i18n';
import type { ReleaseNote } from '../lib/releaseNotes.mjs';

export function ReleaseNoteLines({ lines }: { lines: ReleaseNote[] }) {
  return (
    <div className="space-y-2">
      <h4 className="text-base font-medium">{t.cms.alsoInThisVersion}</h4>
      <ul className="list-disc space-y-1 ps-5 text-base marker:text-primary">
        {lines.map((note) => (
          <li key={note.id} className="[overflow-wrap:anywhere]">
            {note.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
