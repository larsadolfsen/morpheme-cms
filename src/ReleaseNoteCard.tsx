// One release note card on the Morpheme page (#morpheme): the theme's outlined card with the note's screenshot on top (when it
// has one, whole at the card's width and its own height), its title and its text. Exposes ReleaseNoteCard. Depends on the theme's card (themeUi.ts) and the ReleaseNote
// type of lib/releaseNotes.mjs.
import { SiteCard } from './themeUi';
import type { ReleaseNote } from '../lib/releaseNotes.mjs';

export function ReleaseNoteCard({ note }: { note: Extract<ReleaseNote, { kind: 'card' }> }) {
  return (
    <SiteCard kind="outlined" as="article" className="space-y-3 overflow-hidden [--card-padding:0_0_1rem]">
      {note.image && <img src={note.image} alt={note.title} loading="lazy" className="block h-auto w-full" />}
      <div className="space-y-2 px-4">
        <h3 className="text-lg font-medium">{note.title}</h3>
        <p className="text-base">{note.text}</p>
      </div>
    </SiteCard>
  );
}
