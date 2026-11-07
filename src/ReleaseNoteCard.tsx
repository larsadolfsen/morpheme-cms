// One release note on the Morpheme page (#morpheme): the theme's outlined card with the note's title as its headline and
// three labelled parts in order Why, How, What. Exposes ReleaseNoteCard. Depends on the theme's card (themeUi.ts), ui.tsx's
// SupportingText for the labels and the ReleaseNote type of lib/releaseNotes.mjs.
import { t } from './i18n';
import { SiteCard } from './themeUi';
import { SupportingText } from './ui';
import type { ReleaseNote } from '../lib/releaseNotes.mjs';

const parts = ['why', 'how', 'what'] as const;

export function ReleaseNoteCard({ note }: { note: ReleaseNote }) {
  return (
    <SiteCard kind="outlined" as="article" className="space-y-3">
      <h3 className="text-lg font-medium">{note.title}</h3>
      {parts.map((part) => (
        <div key={part}>
          <SupportingText>{t.cms[part]}</SupportingText>
          <p className="text-base">{note[part]}</p>
        </div>
      ))}
    </SiteCard>
  );
}
