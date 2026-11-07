// One release note card on the Morpheme page (#morpheme): the theme's outlined card with the note's screenshot on top (when it
// has one), its title and its text. Exposes ReleaseNoteCard. Depends on the theme's card (themeUi.ts) and the ReleaseNote
// type of lib/releaseNotes.mjs.
import { SiteCard } from './themeUi';
import type { ReleaseNote } from '../lib/releaseNotes.mjs';

/** The screenshot's size (375×812 at scale 2, MAX_IMAGE_BYTES in lib/releaseNotes.mjs): it keeps its room while it loads. */
const IMAGE_WIDTH = 750;
const IMAGE_HEIGHT = 1624;

export function ReleaseNoteCard({ note }: { note: Extract<ReleaseNote, { kind: 'card' }> }) {
  return (
    <SiteCard kind="outlined" as="article" className="space-y-3 overflow-hidden [--card-padding:0_0_1rem]">
      {note.image && (
        <img src={note.image} alt={note.title} width={IMAGE_WIDTH} height={IMAGE_HEIGHT} loading="lazy" className="block h-auto w-full" />
      )}
      <div className="space-y-2 px-4">
        <h3 className="text-lg font-medium">{note.title}</h3>
        <p className="text-base">{note.text}</p>
      </div>
    </SiteCard>
  );
}
