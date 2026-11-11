// The List block typed in place (batch 5, owner decisions 6 and 14, finding 14): the rows are drawn as the site draws them (the theme's
// list, the same markup as the theme's blocks/list/Rows.tsx) and each row's heading and text are typed where they stand. Only the active
// row shows its empty fields (a slot for the icon, the heading, the text, a slot for the link); the others show their live look. After the
// last row there is always one more, empty and faded: typing in it starts a new row. Enter in the heading goes to the text, Enter in the
// text adds a row below, Backspace in an empty heading drops the row. The rows' changes are told to `onChange` (the rows, which row is
// active, which field to focus), which the node view in MarkdownEditor.tsx (blockCard) keeps as the block's props. What is changed and
// kept: src/inlineRows.mjs. Depends on the theme's List (themeUi.ts).
import { useEffect, useLayoutEffect, useRef } from 'react';
import { LinkSimple, Plus } from '@phosphor-icons/react';
import { Glyph } from './icon';
import { t } from './i18n';
import { SiteList, SiteListItem } from './themeUi';
import { addAt, removeAt, setField } from './inlineRows.mjs';

export type Row = { icon?: string; title?: string; text?: string; href?: string; heading?: boolean };

export type Focus = { row: number; field: 'title' | 'text' };
export type Change = { items?: Row[]; active?: number | null; focus?: Focus | null };

// A textarea that has the height of its text: the browser's own where it can (CSS field-sizing), else set here.
const fits = typeof CSS !== 'undefined' && CSS.supports?.('field-sizing', 'content');

export default function InlineList({
  items,
  active,
  focus,
  onChange,
  onSettings,
}: {
  items: Row[];
  /** The row being edited; null while the list is not. */
  active: number | null;
  /** The field to put the cursor in, once (a new object asks again). */
  focus: Focus | null;
  onChange: (change: Change) => void;
  /** The icon or the link of a row is asked for (its slot is tapped). */
  onSettings: (row: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!focus) return;
    const field = root.current?.querySelector<HTMLTextAreaElement>(`[data-row="${focus.row}"] [data-field="${focus.field}"]`);
    field?.focus({ preventScroll: false });
    field?.setSelectionRange(field.value.length, field.value.length);
  }, [focus]);
  useLayoutEffect(() => {
    if (fits) return;
    for (const f of root.current?.querySelectorAll<HTMLTextAreaElement>('textarea') ?? []) {
      f.style.height = '0';
      f.style.height = `${f.scrollHeight}px`;
    }
  });

  const editing = active !== null;
  // While one row is active every row has its two lines, so the list does not change height when another is made active; else, as the site.
  const twoLines = editing || items.some((r) => r.text);
  const rows: Row[] = [...items, {}];

  const type = (i: number, field: 'title' | 'text', value: string) => onChange({ items: setField(items, i, field, value), active: i });
  const keys = (i: number, field: 'title' | 'text', e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const row = items[i];
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (field === 'title') return onChange({ active: i, focus: { row: i, field: 'text' } });
      // The text: a row below (not from the next empty row, which has nothing yet).
      if (row && (row.title || row.text || row.icon || row.href))
        onChange({ items: addAt(items, i + 1), active: i + 1, focus: { row: i + 1, field: 'title' } });
    }
    if (e.key === 'Backspace' && field === 'title' && row && !row.title && !row.text && !row.icon && !row.href) {
      e.preventDefault();
      const before = items.length > 1 ? Math.max(0, i - 1) : 0;
      onChange({ items: removeAt(items, i), active: before, focus: { row: before, field: i > 0 ? 'text' : 'title' } });
    }
  };

  const field = (i: number, name: 'title' | 'text', value: string, label: string, placeholder: string) => (
    <textarea
      rows={1}
      data-field={name}
      className="inline-list-field"
      value={value}
      aria-label={label}
      placeholder={placeholder}
      onChange={(e) => type(i, name, e.target.value)}
      onFocus={() => active !== i && onChange({ active: i })}
      onKeyDown={(e) => keys(i, name, e)}
    />
  );

  return (
    <div ref={root} className="inline-list-host">
      <SiteList className="block-list inline-list">
        {rows.map((r, i) => {
          const next = i === items.length;
          const here = i === active;
          // A row that is a small heading of the rows after it (the site draws its title only): its title is typed, nothing else.
          if (r.heading)
            return (
              <li
                key={i}
                data-row={i}
                aria-current={here ? 'true' : undefined}
                className={['block-list-heading inline-list-row', here && 'inline-list-row-active'].filter(Boolean).join(' ')}
              >
                {field(i, 'title', r.title ?? '', t.blocks.list.title, t.blocks.list.title)}
              </li>
            );
          return (
            <SiteListItem
              key={i}
              data-row={i}
              aria-current={here ? 'true' : undefined}
              aria-label={next ? t.blocks.list.newRow : t.blocks.list.rowOf(i + 1, items.length)}
              className={['inline-list-row', here && 'inline-list-row-active', next && 'inline-list-row-next'].filter(Boolean).join(' ')}
              // The active row has its icon slot, empty or not; the others their icon, as the site draws it.
              leading={
                here ? (
                  <button
                    type="button"
                    className="inline-list-slot"
                    aria-label={t.blocks.list.icon}
                    title={t.blocks.list.icon}
                    onClick={() => onSettings(i)}
                  >
                    {r.icon ? <Glyph icon={r.icon} size={24} /> : <Plus size={24} />}
                  </button>
                ) : undefined
              }
              leadingIcon={here ? undefined : r.icon || undefined}
              headline={field(i, 'title', r.title ?? '', t.blocks.list.title, next ? t.blocks.list.newRow : t.blocks.list.title)}
              supporting={twoLines ? field(i, 'text', r.text ?? '', t.blocks.list.text, t.blocks.list.text) : undefined}
              trailing={
                here ? (
                  <button
                    type="button"
                    className="inline-list-slot"
                    aria-label={t.blocks.list.href}
                    title={t.blocks.list.href}
                    onClick={() => onSettings(i)}
                  >
                    <LinkSimple size={24} />
                  </button>
                ) : undefined
              }
              trailingIcon={here || !r.href ? undefined : 'caret-right'}
            />
          );
        })}
      </SiteList>
    </div>
  );
}
