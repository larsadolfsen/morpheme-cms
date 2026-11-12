// The List block typed in place (batch 5, owner decisions 6 and 14, finding 14): the rows are drawn as the site draws them (the theme's
// list, the same markup as the theme's blocks/list/Rows.tsx) and each row's heading and text are typed where they stand. Only the active
// row shows its empty fields (a slot for the icon, the heading, the text, a slot for the link); the others show their live look. While the
// list has no row there is one, empty and faded: typing in it starts the first row; while it is active and has rows, a text button
// below the last row (`Add list row`) adds one. The parts, the keys and what is kept are the shared ones of InlineItems.tsx and
// src/inlineRows.mjs; this is the List's markup on them. Depends on the theme's List (themeUi.ts).
import { LinkSimple, Plus } from '@phosphor-icons/react';
import { Glyph } from './icon';
import { t } from './i18n';
import { SiteButton, SiteList, SiteListItem } from './themeUi';
import InlineItems, { InlineSlot, type Change, type Focus, type Item } from './InlineItems';

export type { Change, Focus };
export type Row = { icon?: string; title?: string; text?: string; href?: string; heading?: boolean };

export default function InlineList({
  items,
  active,
  focus,
  onChange,
  onSettings,
  onIcon,
}: {
  items: Row[];
  /** The row being edited; null while the list is not. */
  active: number | null;
  /** The field to put the cursor in, once (a new object asks again). */
  focus: Focus | null;
  onChange: (change: Change) => void;
  /** The link of a row is asked for (its slot is tapped). */
  onSettings: (row: number) => void;
  /** The icon slot of a row is tapped: its icon picker. */
  onIcon: (row: number) => void;
}) {
  // While one row is active every row has its two lines, so the list does not change height when another is made active; else, as the site.
  const twoLines = active !== null || items.some((r) => r.text);
  return (
    <InlineItems
      items={items as Item[]}
      active={active}
      focus={focus}
      fields={['title', 'text']}
      add={t.blocks.list.addRow}
      onChange={onChange}
      wrap={(rows) => <SiteList className="block-list inline-list">{rows}</SiteList>}
      renderItem={({ item, index: i, here, next, field }) => {
        const r = item as Row;
        return (
          <SiteListItem
            key={i}
            data-row={i}
            aria-current={here ? 'true' : undefined}
            aria-label={next ? t.blocks.list.newRow : t.blocks.list.rowOf(i + 1, items.length)}
            className={['inline-list-row', here && 'inline-list-row-active', next && 'inline-list-row-next'].filter(Boolean).join(' ')}
            // The active row has its icon slot, empty or not; the others their icon, as the site draws them.
            leading={
              here ? (
                <InlineSlot label={t.blocks.list.icon} onClick={() => onIcon(i)}>
                  {r.icon ? <Glyph icon={r.icon} size={24} /> : <Plus size={24} />}
                </InlineSlot>
              ) : undefined
            }
            leadingIcon={here ? undefined : r.icon || undefined}
            headline={field('title', t.blocks.list.title, next ? t.blocks.list.newRow : t.blocks.list.title)}
            supporting={twoLines ? field('text', t.blocks.list.text, t.blocks.list.text) : undefined}
            trailing={
              here ? (
                <InlineSlot label={t.blocks.list.href} onClick={() => onSettings(i)}>
                  <LinkSimple size={24} />
                </InlineSlot>
              ) : undefined
            }
            trailingIcon={here || !r.href ? undefined : 'caret-right'}
          />
        );
      }}
    />
  );
}

/** A List that reads a list ("Rows from"): its rows as the site draws them, not typed here (they come from the list; Edit has the list, tags and
 * How many). `rows` are the rows the list gives with the filter applied; `line` says which list; `empty` that nothing matches. */
export function RowsFromList({ rows, line, empty, editList }: { rows: Row[]; line: string; empty: boolean; editList?: () => void }) {
  return (
    <div className="inline-list-host">
      <p className="inline-list-from">{empty ? `${line}. ${t.blocks.rows.empty}` : line}</p>
      {editList && (
        <SiteButton kind="text" className="inline-list-edit" onClick={editList}>
          {t.blocks.rows.editList}
        </SiteButton>
      )}
      <SiteList className="block-list inline-list">
        {rows.map((r, i) => (
          <SiteListItem
            key={i}
            headline={r.title}
            supporting={r.text || undefined}
            leadingIcon={r.icon || undefined}
            trailingIcon={r.href ? 'caret-right' : undefined}
          />
        ))}
      </SiteList>
    </div>
  );
}
