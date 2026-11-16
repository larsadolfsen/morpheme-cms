// The text of a list the owner made, above its rows (docs/superpowers/specs/2026-11-15-list-edit-editor-window-design.md, 7.1): every line in the order it
// is written, wherever it stands among the fields in the edit window. A heading is an `h2` (the page's title is the one `h1`) drawn in the title-large
// role, which is the h3 look of `.prose :where(h3)`; a body line is Body medium and a label is Label medium, the roles the page editor writes for the same
// styles. Colours are the theme's roles. It is no component of its own: only the theme's type roles on plain text. Nothing is drawn without text.
import { textsOf } from '../lib/fieldFlow.mjs';

type Line = { style: 'heading' | 'body' | 'label'; text: string };

export default function ListText({ notes }: { notes?: { style: 'heading' | 'body' | 'label'; text: string; after: string | null }[] }) {
  const lines: Line[] = textsOf({ notes });
  if (!lines.length) return null;
  return (
    <div className="mb-8 flex flex-col gap-4">
      {lines.map((line, i) => {
        // A label above a heading pairs with it, as a page's text does (`.label-medium + h3`): the row gap is 16, the pair's is 8.
        const pair = line.style === 'label' && lines[i + 1]?.style === 'heading';
        if (line.style === 'heading')
          return (
            <h2 key={i} className="type-title-large text-balance text-on-surface">
              {line.text}
            </h2>
          );
        return (
          <p
            key={i}
            className={`${line.style === 'label' ? 'type-label-medium text-on-surface-variant' : 'type-body-medium text-on-surface'} text-pretty ${pair ? '-mb-2' : ''}`}
          >
            {line.text}
          </p>
        );
      })}
    </div>
  );
}
