// Rows that fold out (.block-accordion in ../blocks.css): the standard block "Spørgsmål og svar" (a question, and its
// answer as it was written: `html`), and "Foldeliste" and a site's own rows of pages (`page`: PageRow.tsx in
// ../accordion/; this site's topics). Native <details>/<summary>, no JavaScript: the same `name` (`group`; in the
// editor, without one, its own) keeps one open at a time in each list (browsers without support just allow several).
// Closed text is still in the HTML for search engines, and the browser's find-in-page opens the row it finds. Opening
// and closing glide: in CSS where the browser can animate ::details-content, else by script.ts; the text fades in as
// it opens. Reduced motion: no animation.
import { useId } from 'react';
import PageRow from '@theme/blocks/accordion/PageRow';
import { Svg } from '@morphemecms/cms/src/icon';
import type { AccordionRow } from '@morphemecms/cms/src/standard/faq/view';

export default function Accordion({ rows, group }: { rows: AccordionRow[]; group?: string }) {
  const own = useId();
  return (
    <div className="block-accordion">
      {rows.map((row, i) => (
        <details key={i} name={group ?? own} className="block-accordion-row">
          <summary className="block-accordion-label">
            {row.label}
            <Svg name="caret-down" size={20} className="block-accordion-icon" />
          </summary>
          <div className="block-accordion-body">
            {'html' in row ? (
              <div className="block-accordion-answer" dangerouslySetInnerHTML={{ __html: row.html }} />
            ) : (
              <PageRow {...row.page} />
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
