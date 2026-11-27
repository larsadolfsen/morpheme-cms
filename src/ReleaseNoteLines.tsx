// The smaller changes of a version as a list under "Also in this version", one line each; a long word (a file path
// from the changelog) wraps.
// Exposes ReleaseNoteLines. Depends on i18n and the release note type of lib/releaseNotes.mjs.
import { t } from './i18n';
import type { ReleaseNote } from '../lib/releaseNotes.mjs';

export function ReleaseNoteLines({ lines }: { lines: ReleaseNote[] }) {
  return (
    <div className="mo-editor-stack-100">
      <h4 className="mo-type-title-medium">{t.cms.alsoInThisVersion}</h4>
      <ul className="mo-editor-release-list mo-type-body-large mo-editor-stack-50">
        {lines.map((note) => (
          <li key={note.id} className="mo-editor-wrap-anywhere">
            {note.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
