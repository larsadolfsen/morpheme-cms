// The Table block typed in place (finding 18): the cells are drawn as the site draws them (the theme's table, the markup of its
// blocks/table/View.tsx) and each cell is typed where it stands. The table shows only its real cells: rows and columns are added and deleted
// from the contextual menu (MarkdownEditor.tsx gridActions), never in the table. The active cell has the dotted outline. The cells,
// rows and columns are the plain functions of src/inlineGrid.mjs; the header row is the block's own setting (its sheet). Enter goes to the
// cell below (a new row after the last); Tab and Shift+Tab are the browser's. Depends on the parts of InlineItems.tsx.
import { useEffect, useLayoutEffect, useRef, type KeyboardEvent } from 'react';
import { t } from './i18n';
import { InlineField } from './InlineItems';
import type { InlineViewProps } from './inlineViews';
import { addRowAt, setCell } from './inlineGrid.mjs';
import { alignOf, rectangle } from './standard/table/rows.mjs';
import { oneLine } from '../lib/one-line.mjs';

const fits = typeof CSS !== 'undefined' && CSS.supports?.('field-sizing', 'content');

export default function InlineTable({ items, props, active, col, focus, onChange }: InlineViewProps) {
  const root = useRef<HTMLDivElement>(null);
  const rows = rectangle(items);
  const width = rows[0].length;
  const header = props.header !== false;
  // Each column as the site draws it: the owner's choice, else numbers right and text left.
  const align = alignOf(rows, header, props.align);
  // The grid as it is saved: the rows the block has (a new block has no rows, which is one empty cell).
  const saved = items as unknown as string[][];
  useEffect(() => {
    if (!focus) return;
    const field = root.current?.querySelector<HTMLTextAreaElement>(`[data-row="${focus.row}"] [data-field="${focus.field}"]`);
    field?.focus();
    field?.setSelectionRange(field.value.length, field.value.length);
  }, [focus]);
  useLayoutEffect(() => {
    if (fits) return;
    for (const f of root.current?.querySelectorAll<HTMLTextAreaElement>('textarea') ?? []) {
      f.style.height = '0';
      f.style.height = `${f.scrollHeight}px`;
    }
  });
  const grid = (): string[][] => (saved.length ? saved : [['']]);
  const type = (r: number, c: number, v: string) => onChange({ items: setCell(grid(), r, c, oneLine(v)) as never, active: r, col: c });
  const keys = (r: number, c: number, e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return;
    e.preventDefault();
    const last = r === rows.length - 1;
    // Past the last row: a row after it, but not from an empty one.
    if (last && !rows[r][c].trim() && rows[r].every((v) => !v.trim())) return;
    onChange({
      items: (last ? addRowAt(grid(), r + 1) : grid()) as never,
      active: r + 1,
      col: c,
      focus: { row: r + 1, field: String(c) },
    });
  };
  const cell = (r: number, c: number) => {
    const here = r === active && c === col;
    const Tag = header && r === 0 ? 'th' : 'td';
    const text = rows[r]?.[c] ?? '';
    return (
      <Tag
        key={c}
        scope={Tag === 'th' ? 'col' : undefined}
        className={[`block-table-${align[c] ?? 'left'}`, 'inline-table-cell', here && 'inline-table-cell-active'].filter(Boolean).join(' ')}
      >
        <InlineField
          name={String(c)}
          value={text}
          label={t.blocks.table.cellOf(r + 1, c + 1)}
          placeholder=""
          onType={(v) => type(r, c, v)}
          onFocus={() => (active !== r || col !== c) && onChange({ active: r, col: c })}
          onKeys={(e) => keys(r, c, e)}
        />
      </Tag>
    );
  };
  const line = (r: number) => (
    <tr key={r} data-row={r} className={r === active ? 'inline-table-row-active' : undefined}>
      {Array.from({ length: width }, (_, c) => cell(r, c))}
    </tr>
  );
  const all = Array.from({ length: rows.length }, (_, r) => r);
  return (
    <div ref={root} className="inline-list-host inline-table-host">
      <div className="block-table block-table-grid inline-table" role="region" aria-label={t.blocks.table.label}>
        <table>
          {header && <thead>{line(0)}</thead>}
          <tbody>{all.slice(header ? 1 : 0).map(line)}</tbody>
        </table>
      </div>
    </div>
  );
}
