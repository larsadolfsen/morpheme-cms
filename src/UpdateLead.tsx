// The first new thing with a screenshot on the update card, large: the screenshot over its title.
// Exposes UpdateLead. Depends on accentContainerClass and the release note type of lib/releaseNotes.mjs.
import type { ReleaseNote } from '../lib/releaseNotes.mjs';
import { accentContainerClass } from './accentContainerClass';

/** The screenshot fills the top (its top part), the title is under it. */
export function UpdateLead({ note }: { note: Extract<ReleaseNote, { kind: 'card' }> }) {
  return (
    <div className={`overflow-hidden ${accentContainerClass}`}>
      <img src={note.image} alt="" className="block h-44 w-full object-cover object-top" />
      <p className="px-4 py-3 font-medium">{note.title}</p>
    </div>
  );
}
