// A data table (.data-table in ../styles/ui.css): rows of cells in an outlined card (Card) that scrolls sideways on a narrow screen,
// with a header row (`head`, `th` in the column) when there is one. Material 3 has no table component, so the part is Material 2's data
// table (m2.material.io/components/data-tables) drawn with Material 3's tokens; its rows follow the theme's density (--mo-density).
// The "Table" and "Cookie list" blocks draw through it (theme/blocks/table/View.tsx, theme/blocks/cookies/View.tsx), and so will a
// table filled from a list: it takes the rows as they are and only draws them. The root keeps the old classes .block-table and
// .block-table-grid, and each cell its .block-table-<align>, so a theme that styles those (and the editor's typed table,
// src/InlineTable.tsx) looks the same. `className` after its own classes; the rest (aria-…, data-…) on it.
import type { HTMLAttributes, ReactNode } from 'react';
import Card from './Card';

/** A column's alignment as it is drawn (src/standard/table/rows.mjs, alignOf): numbers at the end, text at the start, or the owner's. */
export type DataAlign = 'left' | 'center' | 'right';

/** The classes of a cell in a column with an alignment (none: the table's own, start). */
export const dataCellClass = (align: DataAlign | undefined) => (align ? `data-table-${align} block-table-${align}` : undefined);

export default function DataTable({
  label,
  head,
  rows,
  align,
  rowHeader,
  striped,
  className,
  ...rest
}: Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> & {
  /** The scroll region's name for a screen reader. */
  label: string;
  /** The header row's cells; none: no header row. */
  head?: ReactNode[] | null;
  /** The body rows, as wide as `head`: a block's one-line texts, or what a part draws in a cell of its own (the Cookie list's name). */
  rows: ReactNode[][];
  /** The alignment of each column; none: every column at the start. */
  align?: DataAlign[];
  /** The column whose cells name their row (`th scope="row"`); none: every body cell is a `td`. */
  rowHeader?: number;
  /** Every second body row in a quieter background. */
  striped?: boolean;
  className?: string;
  [data: `data-${string}`]: string | undefined;
}) {
  return (
    // A scroll box the keyboard can reach, named for a screen reader.
    <Card
      kind="outlined"
      className={['data-table block-table block-table-grid', className].filter(Boolean).join(' ')}
      role="region"
      aria-label={label}
      tabIndex={0}
      data-striped={striped ? 'true' : undefined}
      {...rest}
    >
      <table>
        {head && (
          <thead>
            <tr>
              {head.map((c, i) => (
                <th key={i} scope="col" className={dataCellClass(align?.[i])}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) =>
                j === rowHeader ? (
                  <th key={j} scope="row" className={dataCellClass(align?.[j])}>
                    {c}
                  </th>
                ) : (
                  <td key={j} className={dataCellClass(align?.[j])}>
                    {c}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
