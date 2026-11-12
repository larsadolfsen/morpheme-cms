// Rows that fold out (.block-accordion in ../blocks.css): the standard block "Questions and answers" (a question and
// its answer as written: `html`), the "Expandable list" block, and a site's own rows of pages (`page`: PageRow.tsx in
// ../accordion/; this site's topics). Native <details>/<summary>, no JavaScript: the same `name` (`group`; in the
// editor, without one, its own) keeps only one row open at a time in each list (browsers without support allow
// several). Closed text is still in the HTML for search engines, and the browser's find-in-page opens the row it
// finds. Opening and closing glide: in CSS where the browser can animate ::details-content, otherwise by script.ts;
// the text fades in as it opens. Reduced motion: no animation. `several`: any number of rows can be open at once. A row of
// "Segmented list" can have an icon before its heading and a page after its text.
import { useId } from 'react';
import PageRow from '@theme/blocks/accordion/PageRow';
import { Svg } from '@morphemecms/cms/src/icon';
import { Link } from '@morphemecms/cms/src/standard/view';
import Button from '@theme/ui/Button';
import type { AccordionRow } from '@morphemecms/cms/src/standard/faq/view';

export default function Accordion({
  rows,
  group,
  several,
  cut,
}: {
  rows: AccordionRow[];
  group?: string;
  several?: boolean;
  /** `Max rows` of "Segmented list": the rows from this one on are extra (MoreRows.tsx). */
  cut?: number;
}) {
  const own = useId();
  return (
    <div className="block-accordion">
      {rows.map((row, i) => (
        <details
          key={i}
          name={several ? undefined : (group ?? own)}
          className="block-accordion-row"
          {...(cut !== undefined && i >= cut ? { 'data-extra': '' } : {})}
          {...(cut !== undefined && i === cut - 1 ? { 'data-edge': '' } : {})}
        >
          <summary className="block-accordion-label">
            {'icon' in row && row.icon && <Svg name={row.icon} size={24} className="block-accordion-lead" />}
            <span className="block-accordion-title">{row.label}</span>
            <Svg name="caret-down" size={20} className="block-accordion-icon" />
          </summary>
          <div className="block-accordion-body">
            {'html' in row ? (
              <>
                {row.html && <div className="block-accordion-answer" dangerouslySetInnerHTML={{ __html: row.html }} />}
                {row.href && row.link && (
                  <div className="block-row-links">
                    <Link href={row.href} className="block-link block-row-link">
                      {row.link}
                      <Svg name="arrow-right" size={18} />
                    </Link>
                  </div>
                )}
                {'buttons' in row && row.buttons && (
                  <div className="block-row-links">
                    {row.buttons.map((b, n) => (
                      <Button key={n} kind="text" href={b.href}>
                        {b.label}
                      </Button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <PageRow {...row.page} />
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
