// The List block typed in place (batch 5, owner decisions 6 and 14, finding 14): the rows are drawn as the site draws them (the theme's
// list, the same markup as the theme's blocks/list/Rows.tsx) and each row's heading and text are typed where they stand. Only the active
// row shows its empty fields (a slot for the icon, the heading, the text, a slot for the link); the others show their live look. While the
// list has no row there is one, empty and faded: typing in it starts the first row; while it is active and has rows, a text button
// below the last row (`Add list row`) adds one. The parts, the keys and what is kept are the shared ones of InlineItems.tsx and
// src/inlineRows.mjs; this is the List's markup on them. Expandable list is typed the same way (InlineExpand.tsx hands over to this): `fold` is its rows that
// fold out (the active one open, its text typed in it), `design` of the block (or `kind`) its rows on their own surfaces (`segmented`); the link slot, the
// toolbar's Link, the add button and the texts are the same in every design. Depends on the theme's List (themeUi.ts).
import type { MouseEvent } from 'react';
import { buttonClass } from '@theme/ui/Button';
import { iconColorOf } from './iconColor';
import { shownAt } from './images';
import { leadingProps } from './standard/list/leading';
import { leadingOf, type ListRowProps } from './standard/list/view';
import { t } from './i18n';
import { SiteButton, SiteList, SiteListItem } from './themeUi';
import { columnsAttr } from './standard/columns';
import { listRowFields } from './standard/rows/listParts';
import type { Field } from './schema';
import InlineItems, { foldOf, InlineField, InlineIcon, InlineSlot, type Change, type Focus, type Item } from './InlineItems';
import { Icon } from './icon';

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
  /** The text button at the bottom of an open row that folds out (Expandable list): at most one. */
  buttons?: { label?: string; href?: string }[];
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
  onPick,
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
  /** The rows fold out (an Expandable list): the active row is open, its text typed in it. */
  fold?: boolean;
  /** The rows of a block that folds out the owner opened or closed with the chevron (a view state), and what a tap on a chevron says. */
  folds?: Record<number, boolean>;
  onFold?: (row: number, open: boolean | null) => void;
  /** Opens the page sheet for a relation field; the value picked, or null when it was closed (the page of a row's button). */
  onPick?: (field: Field, value: string, title: string) => Promise<string | null>;
}) {
  // The design (`design` of the block, or the one the caller says): each row on its own surface (`segmented`), else the rows on the page.
  const look = kind ?? (props?.design === 'segmented' ? 'segmented' : 'standard');
  const segmented = look === 'segmented';
  const [withIcon, withText, withHref] = [show.icon !== false, show.text !== false, show.href !== false && !fold];
  // While one row is active every row has its two lines, so the list does not change height when another is made active; else, as the site.
  // The button of a row that folds out is typed on the open row (no sheet): its label where it stands, its page from the slot, and Remove. A row that is not
  // open draws it as the site does.
  const buttonHref = listRowFields({ buttons: true })
    .find((f) => f.name === 'buttons')
    ?.fields?.find((f) => f.name === 'href');
  const setButtons = (i: number, buttons: Row['buttons'], focus = false) =>
    onChange({
      items: items.map((r, j) => (j === i ? (buttons ? { ...r, buttons } : (({ buttons: _, ...rest }) => rest)(r)) : r)) as Item[],
      active: i,
      focus: focus ? { row: i, field: 'row-button' } : null,
    });
  const rowButton = (i: number, r: Row, here: boolean) => {
    const b = r.buttons?.[0];
    if (!here)
      return b?.label ? (
        <div className="mo-block-accordion__row-links">
          <SiteButton kind="outlined">{b.label}</SiteButton>
        </div>
      ) : null;
    if (!onPick || !buttonHref) return null;
    return (
      <div className="mo-block-accordion__row-links">
        {b ? (
          // Drawn in the theme's text button; the editor's Card button rules size its field and slots the same way.
          <span className={[buttonClass('text'), 'mo-editor-inline-button', 'mo-editor-inline-card-button'].join(' ')}>
            <InlineField
              name="row-button"
              value={b.label ?? ''}
              label={t.blocks.expand.rowButtonText}
              placeholder={t.blocks.expand.rowButtonText}
              onType={(v) => setButtons(i, [{ ...b, label: v }])}
              onFocus={() => {}}
              onKeys={(e) => {
                if (e.key === 'Enter') e.preventDefault();
                if (e.key === 'Backspace' && !b.label) {
                  e.preventDefault();
                  setButtons(i, undefined);
                }
              }}
            />
            <InlineSlot
              label={t.blocks.expand.rowButtonPage}
              pressed={Boolean(b.href)}
              onClick={async () => {
                const picked = await onPick(buttonHref, b.href ?? '', t.blocks.list.href);
                if (picked !== null) setButtons(i, [{ ...b, href: picked }]);
              }}
            >
              <Icon name={b.href ? 'link' : 'add_link'} size={18} />
            </InlineSlot>
            <InlineSlot label={t.blocks.expand.removeRowButton} onClick={() => setButtons(i, undefined)}>
              <Icon name="delete" size={18} />
            </InlineSlot>
          </span>
        ) : (
          <SiteButton
            kind="text"
            data-add-button=""
            className="mo-editor-inline-card-next-button"
            onClick={() => setButtons(i, [{ label: '', href: '' }], true)}
          >
            {t.blocks.expand.addRowButton}
          </SiteButton>
        )}
      </div>
    );
  };
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
                      {lead.image || lead.letter ? <Icon name="image" size={24} weight="fill" /> : <Icon name="image" size={24} />}
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
              <Icon name={r.href ? 'link' : 'add_link'} size={24} />
            </InlineSlot>
          ) : undefined;
        // Rows that fold out: open while it is the active row, or as the chevron left it (a tap on the heading does not fold it: the heading is typed there).
        if (fold) {
          const open = foldOf(i, here, folds, onFold);
          // A click on the row's header opens or closes the row and selects the block (the row becomes the active one, so the block's bar and settings show), as a click on any
          // other inline block does. The heading and the slots keep their own click (typing, the icon and link pickers); the chevron button folds the row itself.
          const row = items.length ? i : 0;
          const select = () => active !== row && onChange({ active: row, focus: null });
          const headerClick = (e: MouseEvent<HTMLElement>) => {
            const target = e.target instanceof Element ? e.target : null;
            if (!target?.closest('.mo-list__item-expand-summary') || target.closest('textarea, input, a, .mo-editor-inline-list-slot'))
              return;
            if (!target.closest('.mo-list__item-expand-button')) open.toggle.onToggle();
            select();
          };
          return (
            <SiteListItem
              key={i}
              expand
              expandOpen={open.open}
              expandToggle={open.toggle}
              expandProps={{
                role: 'group',
                onFocus: open.onFocus,
                onClick: headerClick,
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
              {rowButton(i, r, here)}
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
                          {r.image ? <Icon name="image" size={24} weight="fill" /> : <Icon name="image" size={24} />}
                        </InlineSlot>
                      )}
                      {show.tags && (
                        <InlineSlot label={t.ownList.tags} onClick={() => onTags?.(i)}>
                          {(r.tags as string[] | undefined)?.length ? (
                            <Icon name="sell" size={24} weight="fill" />
                          ) : (
                            <Icon name="sell" size={24} />
                          )}
                        </InlineSlot>
                      )}
                    </span>
                  )}
                </>
              ) : undefined
            }
            trailing={linkSlot}
            trailingIcon={here || !withHref || !r.href ? undefined : 'keyboard_arrow_right'}
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
          <SiteButton kind="outlined" className="mo-editor-inline-list-edit" onClick={undo.run}>
            {undo.label}
          </SiteButton>
        </p>
      )}
      {editList && (
        <SiteButton kind="outlined" className="mo-editor-inline-list-edit" onClick={editList}>
          {t.blocks.rows.editList}
        </SiteButton>
      )}
      {parts && onPart && (
        <div className="mo-editor-inline-list-parts" role="group" aria-label={t.blocks.rows.fieldShown}>
          {parts.map((p) => (
            <SiteButton key={p.part} kind="outlined" className="mo-editor-inline-list-edit" onClick={() => onPart(p.part)}>
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
            trailingIcon={r.href ? 'keyboard_arrow_right' : undefined}
          />
        ))}
      </SiteList>
    </div>
  );
}
