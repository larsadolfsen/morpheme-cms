// A list (m3.material.io/components/lists, .list in ../styles/ui.css): items under each other (List, a <ul>), each
// (ListItem, an <li>) with what leads it, its headline, evt. an overline over it (`overline`) and a supporting text
// under it (`supporting`), and what trails it. Its kind (`kind`: standard, the default, the items on what the list
// stands on, or segmented, M3 Expressive's, each item on its own surface with a small gap between them) and its dividers
// (`dividers`: full-width, the default for a standard list, inset, from where the items' text starts, middle-inset or
// none) are Material's. An item has one, two or three lines (`lines`): with a supporting text two (also when the text
// is empty, so the items of a list are alike), with an overline too three; a supporting text of two lines needs
// `lines={3}`. What leads it: `leading` (anything: an icon, an image, a block's own), or Material's leading
// kinds, an icon (`leadingIcon`), an avatar (`leadingAvatar`: a letter or an image), an image (`leadingImage`) or a
// video's thumbnail (`leadingVideo`). What trails it: a trailing supporting text (`trailingSupporting`: a number, a
// date), anything (`trailing`: swatches, what is chosen) and an icon (`trailingIcon`: an arrow). With `control` the item is a choice, the theme's
// Checkbox, RadioButton or Switch before or after its text (`at`; a switch after it, the others before it by default),
// and a tap anywhere on the item changes it; its name is the headline. `selected`: the chosen one; `disabled`: it
// cannot be followed or changed. With `href` the item is a link (Link: on the site; in the editor only drawn), with
// `onClick` a button (what a tap does: the editor's rows), else a <div>; the rest (data-…, aria-…) on it, and
// `presentation` takes the <li>'s own role away (an item that is an option of a listbox: Search.tsx). `leadingIconSelected`:
// its icon in the selected colour (the open one, where the item itself is not drawn selected). `truncate`: its texts each
// on one line, cut off (a name, an address); else they wrap. `columns`: on a wide screen its headline and supporting text
// side by side, as columns of the list (an address and where it sends to), under each other on a phone. `actions`: secondary actions beside it (icon buttons, a
// switch), a multi-action item (Material's) with the item its primary action; `children`: what is in its <li> after it
// (a sheet it opens, a text it folds out). `selectable`: on a phone (a touch or a pen) a long press selects it, or unselects
// it, through `onSelectedChange` (useLongPress, longPress.ts), the browser's own menu for a long press kept away; with
// `selecting` (while some item of its list is selected) a tap does the same instead of following or pressing it. Its
// `selected` is then that selection, told to screen readers by aria-pressed (a button) or as a checkbox (a link, a div). How it looks is the theme's. `className` after the list's own classes (its
// place in a block), and after an item's own on the item (its place on a screen). An Astro component without React gives its elements the same classes with listClasses and listItemClass.
// What leads an item, its leading icon, trailing supporting text and trailing icon are parts of their own (ListItemLeading,
// ListItemLeadingIcon, ListItemTrailingSupporting, ListItemTrailingIcon), so the editor's rows have the same; an icon is its name, as the site
// gives it, or an icon made, as the editor gives it (IconRef).
import { useId, type HTMLAttributes, type ReactNode } from 'react';
import { Glyph, type IconRef } from '@morphemecms/cms/src/icon';
import { Link } from '@morphemecms/cms/src/standard/view';
import Checkbox from '@theme/ui/Checkbox';
import RadioButton from '@theme/ui/RadioButton';
import Switch, { type SwitchIcons } from '@theme/ui/Switch';
import { useLongPress } from '@theme/ui/longPress';

/** A list's kinds and dividers, and its items' lines, as Material 3 names them. */
export type ListKind = 'standard' | 'segmented';
export type ListDividers = 'full-width' | 'inset' | 'middle-inset' | 'none';
export type ListItemLines = 1 | 2 | 3;

/** A list's class. */
export const listClass = 'list';

/** A list is never in the text's style (prose, which gives a <ul> its bullets, its indent and its space): its rows are
 * Material's, wherever it is drawn (the site, the editor, the Preview). */
const listOutOfProse = 'not-prose';

/** A list's classes: its kind's (none for standard) and its dividers' (none for full-width; a segmented list has none). */
export const listClasses = (kind: ListKind = 'standard', dividers: ListDividers = kind === 'segmented' ? 'none' : 'full-width') =>
  [listClass, listOutOfProse, kind === 'segmented' && 'list-segmented', dividers !== 'full-width' && `list-dividers-${dividers}`]
    .filter(Boolean)
    .join(' ');

/** A multi-action item's class (Material's): on what holds an item's container, its primary action (a link or a button
 * with listItemClass), and its secondary actions (icon buttons, a switch) beside it, on one row, which has the primary
 * action's state (pointed at, pressed). Never an <li> of its own: the <li> holds it. */
export const listItemMultiActionClass = 'list-item-multi-action';

/** A list item's classes: its lines' (true is two lines), and selected or disabled. */
export const listItemClass = (lines: boolean | ListItemLines = 1, state: { selected?: boolean; disabled?: boolean } = {}) => {
  const n = lines === true ? 2 : lines === false ? 1 : lines;
  return [
    'list-item-container',
    n === 2 && 'list-item-two-line',
    n === 3 && 'list-item-three-line',
    state.selected && 'list-item-selected',
    state.disabled && 'list-item-disabled',
  ]
    .filter(Boolean)
    .join(' ');
};

export default function List({
  kind,
  dividers,
  className,
  children,
  ...rest
}: { kind?: ListKind; dividers?: ListDividers } & HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={[listClasses(kind, dividers), className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </ul>
  );
}

/** An image before an item: its address and what it shows (empty: the headline says it). */
export type ListItemImage = { src: string; alt?: string };

/** A choice in an item: the theme's checkbox, radio button or switch, before or after the text (`at`). */
export type ListItemControl = {
  type: 'checkbox' | 'radio-button' | 'switch';
  at?: 'leading' | 'trailing';
  checked?: boolean;
  name?: string;
  value?: string;
  icons?: SwitchIcons;
};

/** What leads an item: anything (an image, a block's own). */
export function ListItemLeading({ children }: { children: ReactNode }) {
  return <span className="list-item-leading">{children}</span>;
}

/** What leads an item, an icon (`icon`, or something drawn as one: `children`), in the muted colour; in the selected
 * colour in a selected item, or with `selected` (the open one, where the item itself is not drawn selected). */
export function ListItemLeadingIcon({ icon, selected, children }: { icon?: IconRef; selected?: boolean; children?: ReactNode }) {
  return (
    <span className={['list-item-leading list-item-leading-icon', selected && 'list-item-leading-icon-selected'].filter(Boolean).join(' ')}>
      {icon ? <Glyph icon={icon} size={24} /> : children}
    </span>
  );
}

/** What trails an item as text: a number, a date. */
export function ListItemTrailingSupporting({ children }: { children: ReactNode }) {
  return <span className="list-item-trailing-supporting">{children}</span>;
}

/** What trails an item as an icon (an arrow), or anything (`children`). */
export function ListItemTrailingIcon({ icon, children }: { icon?: IconRef; children?: ReactNode }) {
  return <span className="list-item-trailing">{icon ? <Glyph icon={icon} size={24} /> : children}</span>;
}

export function ListItem({
  href,
  onClick,
  leading,
  leadingIcon,
  leadingIconSelected,
  leadingAvatar,
  leadingImage,
  leadingVideo,
  overline,
  headline,
  supporting,
  trailingSupporting,
  trailingIcon,
  trailing,
  control,
  lines,
  selected,
  disabled,
  presentation,
  truncate,
  columns,
  actions,
  selectable,
  selecting,
  onSelectedChange,
  className,
  children,
  ...rest
}: {
  href?: string;
  onClick?: () => void;
  leading?: ReactNode;
  leadingIcon?: IconRef;
  leadingIconSelected?: boolean;
  leadingAvatar?: string | ListItemImage;
  leadingImage?: ListItemImage;
  leadingVideo?: ListItemImage;
  overline?: ReactNode;
  headline: ReactNode;
  supporting?: ReactNode;
  trailingSupporting?: ReactNode;
  trailingIcon?: IconRef;
  trailing?: ReactNode;
  control?: ListItemControl;
  lines?: ListItemLines;
  selected?: boolean;
  disabled?: boolean;
  presentation?: boolean;
  truncate?: boolean;
  columns?: boolean;
  actions?: ReactNode;
  /** A long press with a touch or a pen selects it (or unselects it): `onSelectedChange` with the opposite of `selected`. */
  selectable?: boolean;
  /** Some item of the list is selected: a tap selects or unselects it too, instead of what it does. */
  selecting?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  className?: string;
  children?: ReactNode;
} & Record<string, unknown>) {
  const id = useId();
  const press = useLongPress(selectable && onSelectedChange ? () => onSelectedChange(!selected) : undefined, !!selecting);
  const shown = (v: ReactNode) => v != null && v !== '';
  const n: ListItemLines =
    lines ?? (overline != null && supporting !== undefined ? 3 : supporting !== undefined || overline != null ? 2 : 1);
  const at = control?.at ?? (control?.type === 'switch' ? 'trailing' : 'leading');

  // The choice: the theme's part, named by the headline and described by the supporting text, without a name of its own.
  const choice = control && (
    <span className="list-item-control">
      {(() => {
        const { type, at: _, icons, ...input } = control;
        const own = {
          ...input,
          label: '',
          id: `${id}-control`,
          disabled,
          'aria-labelledby': `${id}-headline`,
          'aria-describedby': shown(supporting) ? `${id}-supporting` : undefined,
        };
        return type === 'checkbox' ? (
          <Checkbox {...own} />
        ) : type === 'radio-button' ? (
          <RadioButton {...own} />
        ) : (
          <Switch icons={icons} {...own} />
        );
      })()}
    </span>
  );

  const image = (p: ListItemImage, kind: string) => <img src={p.src} alt={p.alt ?? ''} className={`list-item-${kind}`} loading="lazy" />;
  const lead =
    control && at === 'leading' ? (
      choice
    ) : leading != null ? (
      <ListItemLeading>{leading}</ListItemLeading>
    ) : leadingIcon ? (
      <ListItemLeadingIcon icon={leadingIcon} selected={leadingIconSelected} />
    ) : typeof leadingAvatar === 'string' ? (
      <span className="list-item-leading list-item-leading-avatar" aria-hidden="true">
        <span className="list-item-avatar">{leadingAvatar}</span>
      </span>
    ) : leadingAvatar ? (
      <span className="list-item-leading list-item-leading-avatar">{image(leadingAvatar, 'avatar')}</span>
    ) : leadingImage ? (
      <span className="list-item-leading list-item-leading-image">{image(leadingImage, 'image')}</span>
    ) : leadingVideo ? (
      <span className="list-item-leading list-item-leading-video">{image(leadingVideo, 'video')}</span>
    ) : null;

  const cut = truncate ? ' truncate' : '';
  const text = (
    <>
      {shown(overline) && <span className="list-item-overline">{overline}</span>}
      {/* Ids only for a choice, which they name and describe. */}
      <span id={control && `${id}-headline`} className={`list-item-headline${cut}`}>
        {headline}
      </span>
      {shown(supporting) && (
        <span id={control && `${id}-supporting`} className={`list-item-supporting${cut}`}>
          {supporting}
        </span>
      )}
    </>
  );
  const tail = (shown(trailingSupporting) || trailingIcon || trailing != null || (control && at === 'trailing')) && (
    <>
      {shown(trailingSupporting) && <ListItemTrailingSupporting>{trailingSupporting}</ListItemTrailingSupporting>}
      {trailing != null && <ListItemTrailingIcon>{trailing}</ListItemTrailingIcon>}
      {trailingIcon && <ListItemTrailingIcon icon={trailingIcon} />}
      {control && at === 'trailing' && choice}
    </>
  );
  const content = (
    <>
      {lead}
      {control ? (
        // A second name for the choice's <input>, so a tap on the text (and, stretched, on the whole item) changes it.
        <label htmlFor={`${id}-control`} className="list-item-content">
          {text}
        </label>
      ) : (
        <span className="list-item-content">{text}</span>
      )}
      {tail}
    </>
  );
  const classes = [
    listItemClass(n, { selected, disabled }),
    control && 'list-item-with-control',
    columns && 'list-item-columns',
    press && 'list-item-selectable',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  // While items are being selected, a tap toggles the item instead of following its link or pressing it: a button says
  // so with aria-pressed, a link or a plain item is a checkbox (aria-selected is only for options and rows).
  const picking = !!press && (!!selecting || !!selected);
  const toggle = picking ? { role: 'checkbox', 'aria-checked': !!selected } : undefined;
  const item =
    href !== undefined && !control && !disabled ? (
      <Link href={href} className={classes} aria-current={selected && !press ? 'true' : undefined} {...toggle} {...rest} {...press}>
        {content}
      </Link>
    ) : onClick && !control ? (
      <button
        type="button"
        className={classes}
        disabled={disabled}
        onClick={onClick}
        aria-pressed={picking ? !!selected : undefined}
        {...rest}
        {...press}
      >
        {content}
      </button>
    ) : (
      <div className={classes} aria-disabled={disabled && href !== undefined ? true : undefined} {...toggle} {...rest} {...press}>
        {content}
      </div>
    );
  return (
    <li role={presentation ? 'presentation' : undefined}>
      {actions != null && actions !== false ? (
        <div className={listItemMultiActionClass}>
          {item}
          {actions}
        </div>
      ) : (
        item
      )}
      {children}
    </li>
  );
}
