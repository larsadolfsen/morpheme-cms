// Rows that fold out: the theme's List with `expand` (Material's "List - Expand", ui/List.tsx; .block-accordion in ../blocks.css only places it): the standard block "Questions and answers" (a question and
// its answer as written: `html`), the "Expandable list" block, and a site's own rows of pages (`page`: PageRow.tsx in
// ../accordion/; this site's topics). The part draws native <details>/<summary>, no JavaScript: the same `name` (`group`; in the
// editor, without one, its own) keeps only one row open at a time in each list (browsers without support allow
// several). Closed text is still in the HTML for search engines, and the browser's find-in-page opens the row it
// finds. Opening and closing glide: in CSS where the browser can animate ::details-content, otherwise by script.ts;
// the text fades in as it opens. Reduced motion: no animation. `several`: any number of rows can be open at once. A row of
// "Segmented list" can have an icon before its heading and a page after its text.
import { useId } from 'react';
import PageRow from '@theme/blocks/accordion/PageRow';
import { Svg } from '@morphemecms/cms/src/icon';
import Button from '@theme/ui/Button';
import List, { ListItem } from '@theme/ui/List';
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
    <List expand className="block-accordion">
      {rows.map((row, i) => (
        <ListItem
          key={i}
          expand
          expandName={several ? undefined : (group ?? own)}
          expandProps={{
            ...(cut !== undefined && i >= cut ? { 'data-extra': '' } : {}),
            ...(cut !== undefined && i === cut - 1 ? { 'data-edge': '' } : {}),
          }}
          leading={
            'icon' in row && row.icon ? (
              <Svg
                name={row.icon}
                size={24}
                className="block-accordion-lead"
                iconColor={'iconColor' in row ? String(row.iconColor ?? '') || undefined : undefined}
              />
            ) : undefined
          }
          headline={row.label}
        >
          {'html' in row ? (
            <>
              {row.html && <div className="block-accordion-answer" dangerouslySetInnerHTML={{ __html: row.html }} />}
              {(row.href && row.link) || ('buttons' in row && row.buttons) ? (
                <div className="block-row-links">
                  {row.href && row.link && (
                    <Button kind="text" href={row.href}>
                      {row.link}
                    </Button>
                  )}
                  {'buttons' in row &&
                    row.buttons?.map((b, n) => (
                      <Button key={n} kind="text" href={b.href}>
                        {b.label}
                      </Button>
                    ))}
                </div>
              ) : null}
            </>
          ) : (
            <PageRow {...row.page} />
          )}
        </ListItem>
      ))}
    </List>
  );
}
