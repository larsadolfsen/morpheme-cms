// One more new thing on the update card, as a list item: a sparkle and its title (a card) or its text (a line).
// Exposes UpdateHighlight. Depends on accentContainerClass and the release note type of lib/releaseNotes.mjs.
import { Sparkle } from '@phosphor-icons/react';
import type { ReleaseNote } from '../lib/releaseNotes.mjs';
import { accentContainerClass } from './accentContainerClass';

export function UpdateHighlight({ note }: { note: ReleaseNote }) {
  return (
    <li className={`flex items-center gap-3 p-3 ${accentContainerClass}`}>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-on-accent">
        <Sparkle size={20} weight="fill" aria-hidden />
      </span>
      <span className={note.kind === 'card' ? 'font-medium' : 'text-sm'}>{note.kind === 'card' ? note.title : note.text}</span>
    </li>
  );
}
