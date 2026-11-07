// One release note card on the Morpheme page (#morpheme): the theme's outlined card with the note's screenshot on a tinted
// stage at its top (when it has one: framed and lifted, so it reads as a picture of the editor, not as the editor itself),
// its title and its text. Exposes ReleaseNoteCard. Depends on the theme's card (themeUi.ts) and the ReleaseNote type of
// lib/releaseNotes.mjs.
import { SiteCard } from './themeUi';
import type { ReleaseNote } from '../lib/releaseNotes.mjs';

export function ReleaseNoteCard({ note }: { note: Extract<ReleaseNote, { kind: 'card' }> }) {
  return (
    <SiteCard kind="outlined" as="article" className="overflow-hidden [--card-padding:0]">
      {note.image && (
        // The card's edge is a line drawn inside it (ui.css), so the stage keeps 1px from it and follows its corners.
        <div className="m-px mb-0 rounded-t-[calc(var(--card-radius,var(--block-radius))-1px)] bg-tint px-6 pt-6">
          <img
            src={note.image}
            alt=""
            loading="lazy"
            className="block h-auto w-full rounded-t-xl border border-b-0 border-line shadow-[0_-2px_12px_-4px_rgb(0_0_0/0.18)]"
          />
        </div>
      )}
      <div className="space-y-2 p-4">
        <h3 className="text-lg font-medium">{note.title}</h3>
        <p className="text-base">{note.text}</p>
      </div>
    </SiteCard>
  );
}
