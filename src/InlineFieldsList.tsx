// The page of a list the owner made (OwnListPage.tsx) typed in place: the rows of the theme's list (as InlineList.tsx draws them) with the fields the owner
// added, any number of each kind. Every field of a row has its own place, in the order the owner added them, named as the owner named it: a text field
// (title or body text) is the page's inline text field with its name inside it, and an icon, image, link or tags field is a slot with its name above. The
// active row shows every field; the other rows show the fields that have a value. The keys, the active row and what is kept are the shared ones of
// InlineItems.tsx and src/inlineRows.mjs. Depends on the theme's List (themeUi.ts).
import { ImageSquare, LinkSimple, Plus, Tag } from '@phosphor-icons/react';
import { Glyph } from './icon';
import { t } from './i18n';
import { SiteList, SiteListItem } from './themeUi';
import InlineItems, { InlineIcon, InlineSlot, type Change, type Focus, type Item } from './InlineItems';

export type { Change, Focus };
/** A field of the list as the page draws it: its id (the key of a row's value), its kind and the name it shows. */
export type ListField = { id: string; kind: string; name: string };

/** Whether a kind is typed in the row (title and body text) or picked in a slot. */
export const isTyped = (kind: string) => kind === 'title' || kind === 'text';

export default function InlineFieldsList({
  items,
  active,
  focus,
  fields,
  onChange,
  onSlot,
}: {
  items: Item[];
  /** The row being edited; null while the list is not. */
  active: number | null;
  focus: Focus | null;
  fields: ListField[];
  onChange: (change: Change) => void;
  /** A slot of a row is tapped: the row and the field (its icon picker, its link, its image or its tags). */
  onSlot: (row: number, field: ListField) => void;
}) {
  const typed = fields.filter((f) => isTyped(f.kind));
  // A list with nothing to type in still has rows (made with a slot): the key is never shown or saved.
  const order = typed.length ? typed.map((f) => f.id) : ['_'];
  return (
    <InlineItems
      items={items}
      active={active}
      focus={focus}
      fields={order}
      add={t.blocks.list.addRow}
      onChange={onChange}
      wrap={(rows) => <SiteList className="block-list inline-list">{rows}</SiteList>}
      renderItem={({ item, index: i, here, next, field }) => {
        const filled = (f: ListField) => (Array.isArray(item[f.id]) ? item[f.id].length > 0 : Boolean(item[f.id]));
        // The faded empty row of an empty list shows its first field, so there is something to tap.
        const shown = fields.filter((f, n) => here || filled(f) || (next && n === 0));
        const slot = (f: ListField) => (
          <span key={f.id} className="inline-field-slot" data-field-id={f.id}>
            <span className="inline-field-name">{f.name}</span>
            <InlineSlot label={f.name} onClick={() => onSlot(i, f)}>
              {f.kind === 'image' ? (
                <ImageSquare size={24} weight={filled(f) ? 'fill' : 'regular'} />
              ) : f.kind === 'tags' ? (
                <Tag size={24} weight={filled(f) ? 'fill' : 'regular'} />
              ) : f.kind === 'href' ? (
                <LinkSimple size={24} weight={filled(f) ? 'bold' : 'regular'} />
              ) : item[f.id] ? (
                <Glyph icon={String(item[f.id])} size={24} />
              ) : (
                <Plus size={24} />
              )}
            </InlineSlot>
          </span>
        );
        return (
          <SiteListItem
            key={i}
            data-row={i}
            aria-current={here ? 'true' : undefined}
            aria-label={next ? t.blocks.list.newRow : t.blocks.list.rowOf(i + 1, items.length)}
            className={['inline-list-row', here && 'inline-list-row-active', next && 'inline-list-row-next'].filter(Boolean).join(' ')}
            headline={
              <span className="inline-fields">
                {shown.map((f) => (isTyped(f.kind) ? <span key={f.id}>{field(f.id, f.name, f.name)}</span> : slot(f)))}
              </span>
            }
          />
        );
      }}
    />
  );
}
