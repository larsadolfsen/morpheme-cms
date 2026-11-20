// The List block typed in place (batch 5, owner decisions 6 and 14, finding 14): the rows are drawn as the site draws them (the theme's
// list, the same markup as the theme's blocks/list/Rows.tsx) and each row's heading and text are typed where they stand. Only the active
// row shows its empty fields (a slot for the icon, the heading, the text, a slot for the link); the others show their live look. While the
// list has no row there is one, empty and faded: typing in it starts the first row; while it is active and has rows, a text button
// below the last row (`Add list row`) adds one. The parts, the keys and what is kept are the shared ones of InlineItems.tsx and
// src/inlineRows.mjs; this is the List's markup on them. List - Expand is typed the same way (InlineExpand.tsx hands over to this): `fold` is its rows that
// fold out (the active one open, its text typed in it), `design` of the block (or `kind`) its rows on their own surfaces (`segmented`); the link slot, the
// toolbar's Link, the add button and the texts are the same in every design. Depends on the theme's List (themeUi.ts).
import { ImageSquare, LinkSimple, Tag } from '@phosphor-icons/react';
import type { MouseEvent } from 'react';
import { iconColorOf } from './iconColor';
import { shownAt } from './images';
import { leadingProps } from './standard/list/leading';
import { leadingOf, type ListRowProps } from './standard/list/view';
import { t } from './i18n';
import { SiteButton, SiteList, SiteListItem } from './themeUi';
import { columnsAttr } from './standard/columns';
import InlineItems, { foldOf, InlineIcon, InlineSlot, type Change, type Focus, type Item } from './InlineItems';

export type { Change, Focus };
export type Row = {
  icon?: string;
  iconColor?: string;
  title?: string;
  text?: string;
  href?: string;
  heading?: boolean;
  /** What leads the row: an icon (no value), an avatar, a square image or a landscape image (the image is `image`). */
  leading?: string;
  image?: string;
  alt?: string;
  tags?: string[];
};

export default function InlineList({
  items,
  props,
  active,
  focus,
  onChange,
  onSettings,
  onIcon,
  show = {},
  onImage,
  onTags,
  kind,
  fold,
  folds,
  onFold,
}: {
  items: Row[];
  /** The block's own props: its setting Columns. */
  props?: Record<string, any>;
  /** The row being edited; null while the list is not. */
  active: number | null;
  /** The field to put the cursor in, once (a new object asks again). */
  focus: Focus | null;
  onChange: (change: Change) => void;
  /** The link of a row is asked for (its slot is tapped). */
  onSettings: (row: number) => void;
  /** The icon slot of a row is tapped: its icon picker. */
  onIcon: (row: number) => void;
  /** A list the owner made has the fields it chose: `false` leaves a row's icon, text or link out (a List block has all three). */
  show?: { icon?: boolean; text?: boolean; href?: boolean; image?: boolean; tags?: boolean };
  /** A list the owner made can have an image and tags: their slots on the active row, which open them (not part of a List block). */
  onImage?: (row: number) => void;
  onTags?: (row: number) => void;
  /** `segmented`: each row on its own surface (the design `segmented`); the standard rows are on the page. Without it, the block's own `design` says. */
  kind?: 'standard' | 'segmented';
  /** The rows fold out (a List - Expand): the active row is open, its text typed in it. */
  fold?: boolean;
  /** The rows of a block that folds out the owner opened or closed with the chevron (a view state), and what a tap on a chevron says. */
  folds?: Record<number, boolean>;
  onFold?: (row: number, open: boolean | null) => void;
}) {
  // The design (`design` of the block, or the one the caller says): each row on its own surface (`segmented`), else the rows on the page.
  const look = kind ?? (props?.design === 'segmented' ? 'segmented' : 'standard');
  const segmented = look === 'segmented';
  const [withIcon, withText, withHref] = [show.icon !== false, show.text !== false, show.href !== false];
  // While one row is active every row has its two lines, so the list does not change height when another is made active; else, as the site.
  const twoLines = withText && (active !== null || items.some((r) => r.text));
  return (
    <InlineItems
      items={items as Item[]}
      active={active}
      focus={focus}
      fields={['title', 'text']}
      add={t.blocks.list.addRow}
      onChange={onChange}
      paste
      wrap={(rows) =>
        fold ? (
          <SiteList
            expand
            className={
              segmented
                ? 'mo-block-accordion mo-block-accordion__segmented mo-editor-inline-segmented'
                : 'mo-block-accordion mo-editor-inline-segmented'
            }
            data-columns={columnsAttr(props)}
          >
            {rows}
          </SiteList>
        ) : (
          <SiteList kind={look} className="mo-block-list mo-editor-inline-list" data-columns={columnsAttr(props)}>
            {rows}
          </SiteList>
        )
      }
      renderItem={({ item, index: i, here, next, field }) => {
        const r = item as Row;
        // What leads the row: its icon (the shared control: empty, a plus, while the row is active), or an avatar or an image (the real one while the row is not
        // active, the slot that opens the row's media sheet while it is). A tap on the slot opens the sheet of the row's media, where its kind is chosen.
        const leadFor = (row: Row, active: boolean, at: number) => {
          if (!withIcon) return {};
          const lead = leadingOf({ ...row, leading: props?.leading } as ListRowProps, row.title ?? '', (src) => ({ src: shownAt(src) }));
          if (lead.leading)
            return active
              ? {
                  leading: (
                    <InlineSlot label={t.blocks.list.leading} onClick={() => onIcon(at)}>
                      {lead.image || lead.letter ? <ImageSquare size={24} weight="fill" /> : <ImageSquare size={24} />}
                    </InlineSlot>
                  ),
                }
              : leadingProps(lead);
          return {
            leading: (
              <InlineIcon
                label={t.blocks.list.icon}
                icon={row.icon}
                here={active}
                iconColor={row.icon ? iconColorOf(row.iconColor) : undefined}
                onClick={() => onIcon(at)}
              />
            ),
          };
        };
        // The link slot at the end of the active row: the same control in every look, it opens the row's sheet.
        const linkSlot =
          here && withHref ? (
            <InlineSlot label={t.blocks.list.href} onClick={() => onSettings(i)}>
              <LinkSimple size={24} />
            </InlineSlot>
          ) : undefined;
        // Rows that fold out: open while it is the active row, or as the chevron left it (a tap on the heading does not fold it: the heading is typed there).
        if (fold) {
          const open = foldOf(i, here, folds, onFold);
          return (
            <SiteListItem
              key={i}
              expand
              expandOpen={open.open}
              expandToggle={open.toggle}
              expandProps={{
                role: 'group',
                onFocus: open.onFocus,
                'data-row': i,
                'aria-current': here ? 'true' : undefined,
                'aria-label': next ? t.blocks.list.newRow : t.blocks.list.rowOf(i + 1, items.length),
                className: [
                  'mo-editor-inline-list-row',
                  here && 'mo-editor-inline-list-row-active',
                  next && 'mo-editor-inline-list-row-next',
                ]
                  .filter(Boolean)
                  .join(' '),
              }}
              {...leadFor(r, here, i)}
              headline={field('title', t.blocks.list.title, next ? t.blocks.list.newRow : t.blocks.list.title)}
              trailing={linkSlot}
            >
              <div className="mo-block-accordion__answer">{withText && field('text', t.blocks.list.text, t.blocks.list.text)}</div>
            </SiteListItem>
          );
        }
        return (
          <SiteListItem
            key={i}
            data-row={i}
            role="group"
            aria-current={here ? 'true' : undefined}
            aria-label={next ? t.blocks.list.newRow : t.blocks.list.rowOf(i + 1, items.length)}
            className={['mo-editor-inline-list-row', here && 'mo-editor-inline-list-row-active', next && 'mo-editor-inline-list-row-next']
              .filter(Boolean)
              .join(' ')}
            {...leadFor(r, here, i)}
            data-icon-color={r.icon ? iconColorOf(r.iconColor) : undefined}
            headline={field('title', t.blocks.list.title, next ? t.blocks.list.newRow : t.blocks.list.title)}
            supporting={
              twoLines || (here && (show.image || show.tags)) ? (
                <>
                  {twoLines && field('text', t.blocks.list.text, t.blocks.list.text)}
                  {here && (show.image || show.tags) && (
                    <span className="mo-editor-inline-card-slots">
                      {show.image && (
                        <InlineSlot label={t.ownList.image} onClick={() => onImage?.(i)}>
                          {r.image ? <ImageSquare size={24} weight="fill" /> : <ImageSquare size={24} />}
                        </InlineSlot>
                      )}
                      {show.tags && (
                        <InlineSlot label={t.ownList.tags} onClick={() => onTags?.(i)}>
                          {(r.tags as string[] | undefined)?.length ? <Tag size={24} weight="fill" /> : <Tag size={24} />}
                        </InlineSlot>
                      )}
                    </span>
                  )}
                </>
              ) : undefined
            }
            trailing={linkSlot}
            trailingIcon={here || !withHref || !r.href ? undefined : 'caret-right'}
          />
        );
      }}
    />
  );
}

/** A List that reads a list ("Rows from"): its rows as the site draws them, not typed here (they come from the list; Edit has the list, tags and
 * How many). `rows` are the rows the list gives with the filter applied; `line` says which list; `empty` that nothing matches. */
export function RowsFromList({
  rows,
  line,
  empty,
  editList,
  undo,
  parts,
  onPart,
  oneColumn,
}: {
  rows: Row[];
  /** The setting Columns is off. */
  oneColumn?: boolean;
  line: string;
  empty: boolean;
  editList?: () => void;
  /** The typed rows were set aside by switching to a list: what it says, and Undo. */
  undo?: { note: string; label: string; run: () => void };
  /** A list with fields to pick from: each part of a row with the field shown there (a text button each), and what a tap on one does. The rows' own
   * lines, icon and arrow answer a tap too. */
  parts?: { part: string; text: string }[];
  onPart?: (part: string) => void;
}) {
  // A tap on a row's top line, bottom line, icon or arrow picks the field shown there.
  const tapped = (e: MouseEvent<HTMLElement>) => {
    if (!onPart || !(e.target instanceof Element)) return;
    const hit = e.target.closest('.mo-list__item-headline, .mo-list__item-supporting, .mo-list__item-leading, .mo-list__item-trailing');
    if (!hit) return;
    onPart(
      hit.classList.contains('mo-list__item-headline')
        ? 'title'
        : hit.classList.contains('mo-list__item-supporting')
          ? 'text'
          : hit.classList.contains('mo-list__item-leading')
            ? 'icon'
            : 'href',
    );
  };
  return (
    <div className="mo-editor-inline-list-host">
      <p className="mo-editor-inline-list-from">{empty ? `${line}. ${t.blocks.rows.empty}` : line}</p>
      {undo && (
        <p className="mo-editor-inline-list-from">
          {undo.note}{' '}
          <SiteButton kind="text" className="mo-editor-inline-list-edit" onClick={undo.run}>
            {undo.label}
          </SiteButton>
        </p>
      )}
      {editList && (
        <SiteButton kind="text" className="mo-editor-inline-list-edit" onClick={editList}>
          {t.blocks.rows.editList}
        </SiteButton>
      )}
      {parts && onPart && (
        <div className="mo-editor-inline-list-parts" role="group" aria-label={t.blocks.rows.fieldShown}>
          {parts.map((p) => (
            <SiteButton key={p.part} kind="text" className="mo-editor-inline-list-edit" onClick={() => onPart(p.part)}>
              {p.text}
            </SiteButton>
          ))}
        </div>
      )}
      <SiteList className="mo-block-list mo-editor-inline-list" data-columns={oneColumn ? 'one' : undefined} onClick={tapped}>
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
