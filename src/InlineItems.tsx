// The parts every block typed in place is made of (the List's InlineList.tsx, and the blocks after it): `InlineItems` keeps the items of a
// block, which one is active, where the cursor goes and the keys (Enter in a field goes to the next, Enter in the last one adds an item
// below, Backspace in the empty first one drops the item); the block gives `renderItem`, its own markup from the theme, with
// `InlineField` where a text stands and `InlineSlot` where an icon, image or link is picked. `InlineAdd` is the text button under the last
// item. What is changed is told to `onChange`; the node view in MarkdownEditor.tsx (blockCard) keeps it as the block's props. Which item is
// empty, and the items added, moved or dropped: src/inlineRows.mjs.
import { useEffect, useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { SiteButton } from './themeUi';
import { addAt, isEmptyRow, removeAt, setField } from './inlineRows.mjs';

export type Item = Record<string, any>;
export type Focus = { row: number; field: string };
export type Change = { items?: Item[]; active?: number | null; focus?: Focus | null };

// A textarea that has the height of its text: the browser's own where it can (CSS field-sizing), else set here.
const fits = typeof CSS !== 'undefined' && CSS.supports?.('field-sizing', 'content');

/** A text typed where it stands: no frame, the height of its text. Its key rules and focus are InlineItems'. */
export function InlineField({
  name,
  value,
  label,
  placeholder,
  onType,
  onFocus,
  onKeys,
}: {
  name: string;
  value: string;
  label: string;
  placeholder: string;
  onType: (value: string) => void;
  onFocus: () => void;
  onKeys: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    <textarea
      rows={1}
      data-field={name}
      className="inline-list-field"
      value={value}
      aria-label={label}
      placeholder={placeholder}
      onChange={(e) => onType(e.target.value)}
      onFocus={onFocus}
      onKeyDown={onKeys}
    />
  );
}

/** A button in the active item that picks what is not typed: an icon or an image (its picker), or a link (the item's settings). */
export function InlineSlot({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="inline-list-slot" aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  );
}

/** The text button under the last item (`Add card`), shown while the block is active and has an item. */
export function InlineAdd({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <SiteButton kind="text" data-add-row="" className="inline-list-add" onClick={onClick}>
      {label}
    </SiteButton>
  );
}

/** What a block's `renderItem` is given for one item. `next` is the empty, faded item of a block with none; `field` is an InlineField
 * of this item. */
export type ItemContext = {
  item: Item;
  index: number;
  here: boolean;
  next: boolean;
  /** The block is being typed in (an item is active). */
  editing: boolean;
  field: (name: string, label: string, placeholder: string) => ReactNode;
};

export default function InlineItems({
  items,
  active,
  focus,
  fields,
  add,
  onChange,
  renderItem,
  wrap,
  start = 1,
}: {
  items: Item[];
  /** The item being edited; null while the block is not. */
  active: number | null;
  /** The field to put the cursor in, once (a new object asks again). */
  focus: Focus | null;
  /** The typed fields in the order the cursor goes through them. */
  fields: string[];
  /** The text of the add button. */
  add: string;
  onChange: (change: Change) => void;
  renderItem: (c: ItemContext) => ReactNode;
  /** The block's own element round its items (the theme's list). */
  wrap?: (items: ReactNode) => ReactNode;
  /** How many empty, faded items a block shows while it has none (Cards start with three, the first active; else one). Typing in any of
   * them makes the first item. */
  start?: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [first, last] = [fields[0], fields[fields.length - 1]];
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
  // The empty, faded item that a tap starts is only there while the block has no item; with items, `Add below` and Enter make the next.
  const shown: Item[] = items.length ? items : Array.from({ length: start }, () => ({}));
  // The item a shown one is: an empty, faded one past the last is the first (or next) item once it is typed in.
  const slot = (i: number) => Math.min(i, items.length);
  const addAfter = (i: number) => onChange({ items: addAt(items, i + 1, first), active: i + 1, focus: { row: i + 1, field: first } });

  const keys = (i: number, name: string, e: KeyboardEvent<HTMLTextAreaElement>) => {
    const item = items[i];
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (name !== last) return onChange({ active: slot(i), focus: { row: i, field: fields[fields.indexOf(name) + 1] } });
      // The last field: an item below (not from the next empty one, which has nothing yet).
      if (item && !isEmptyRow(item)) addAfter(i);
    }
    if (e.key === 'Backspace' && name === first && item && isEmptyRow(item)) {
      e.preventDefault();
      const before = items.length > 1 ? Math.max(0, i - 1) : 0;
      onChange({ items: removeAt(items, i), active: before, focus: { row: before, field: i > 0 ? last : first } });
    }
  };

  const body = shown.map((item, i) => {
    const next = i >= items.length;
    return renderItem({
      item,
      index: i,
      here: next ? i === 0 && active === 0 : i === active,
      next,
      editing,
      field: (name, label, placeholder) => (
        <InlineField
          name={name}
          value={String(item[name] ?? '')}
          label={label}
          placeholder={placeholder}
          // Typed in a faded one past the first: it is the item that is made, so the cursor goes there.
          onType={(v) =>
            onChange({
              items: setField(items, i, name, v, first),
              active: slot(i),
              ...(slot(i) !== i ? { focus: { row: slot(i), field: name } } : {}),
            })
          }
          onFocus={() => active !== slot(i) && onChange({ active: slot(i) })}
          onKeys={(e) => keys(i, name, e)}
        />
      ),
    });
  });

  return (
    <div ref={root} className="inline-list-host">
      {wrap ? wrap(body) : body}
      {editing && items.length > 0 && <InlineAdd label={add} onClick={() => addAfter(items.length - 1)} />}
    </div>
  );
}
