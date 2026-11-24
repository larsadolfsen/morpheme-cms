// A search (m3.material.io/components/search, .search in ../styles/ui/search.css): the search bar (its leading icon,
// `leadingIcon`, the theme's magnifying glass if it has none, the placeholder, `label`, and what stands after it,
// `trailing`: icon buttons, an avatar) and the search view it opens (a <dialog>: over the whole screen on a phone, docked
// where the bar is from the medium breakpoint), with the button back (`backLabel`), the field (a role="combobox"), the button that
// empties it (`clearLabel`), and the results (`results`, the theme's list, List and ListItem, as a role="listbox" of
// links, each its headline, evt. its supporting text and its icon) or, when none fits, `emptyText`. On the site
// search.script.ts opens and closes it (the back button, Escape, a tap outside), narrows the results to what is
// written, and moves through them with the arrow keys (Enter follows the one it is on). In the editor only drawn:
// `open` draws the view (as docked) with `query` in the field instead of the bar. How it looks is the theme's.
// SearchView is the same view driven by React (the editor's command palette): `open`, `query` and `onQueryChange`, results in groups (a
// label each: M3's "category labels") with an item's trailing shortcut, `activeId` (the option the arrow keys are on, aria-activedescendant),
// `onActivate`, and `liveText` (what a screen reader hears when the results change). Its look is M3's contained style: a filled pill (the search
// bar container, 56dp, surface container high) with the back arrow, the field and the clear button, in a container of its own (surface container
// low full screen, high docked); under the bar optional filter chips (`filters`: M3 "Filter chips to narrow down results"), then the lists with their
// category labels. An item can lead with an image (`thumb`) and have a button that removes it (`onRemove`: a recent search; Delete does it from the
// field). Exposes Search, SearchBar, SearchBarButton, SearchGroupLabel, SearchView, searchClass.
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Svg, type IconRef } from '@morphemecms/cms/src/icon';
import { useOnSite } from '@morphemecms/cms/src/standard/view';
import IconButton from '@theme/ui/IconButton';
import List, { ListItem } from '@theme/ui/List';
import Chip from '@theme/ui/Chip';
import ChipSet from '@theme/ui/ChipSet';
import { atLeast } from '@morphemecms/cms/lib/breakpoints.mjs';
import trackInputModality from '@theme/ui/inputModality';

export type SearchResult = { href: string; headline: ReactNode; supporting?: ReactNode; icon?: string };

/** The class of a search (the bar and its view). */
export const searchClass = 'mo-search';

export default function Search({
  label,
  backLabel,
  clearLabel,
  emptyText,
  results,
  leadingIcon = 'search',
  trailing,
  open,
  query,
  className,
  ...rest
}: {
  label: string;
  backLabel: string;
  clearLabel: string;
  emptyText: string;
  results: SearchResult[];
  leadingIcon?: string;
  trailing?: ReactNode;
  open?: boolean;
  query?: string;
  className?: string;
} & Record<string, unknown>) {
  const id = useId();
  const view = `${id}-view`;
  const list = `${id}-results`;
  // A listbox holds options: in the editor a result is drawn without its role (Link), and an empty list has none.
  const onSite = useOnSite();
  const listbox = results.length > 0 && onSite;
  return (
    <div className={[searchClass, className].filter(Boolean).join(' ')} data-search="" {...rest}>
      {!open && (
        <div className="mo-search-bar">
          <button
            type="button"
            className="mo-search-bar__field"
            aria-haspopup="dialog"
            aria-expanded="false"
            aria-controls={view}
            data-search-open=""
          >
            <span className="mo-search-bar__leading">
              <Svg name={leadingIcon} size={24} />
            </span>
            <span className="mo-search-bar__placeholder">{label}</span>
          </button>
          {trailing && <span className="mo-search-bar__trailing">{trailing}</span>}
        </div>
      )}
      <dialog id={view} className="mo-search-view" aria-label={label} open={open} data-search-view="">
        <div className="mo-search-view__header">
          <IconButton icon="arrow_back" label={backLabel} data-search-close="" />
          <input
            type="search"
            className="mo-search-view__input"
            role="combobox"
            aria-label={label}
            aria-expanded="true"
            aria-controls={list}
            aria-autocomplete="list"
            autoComplete="off"
            enterKeyHint="search"
            placeholder={label}
            defaultValue={query}
            data-search-input=""
          />
          <IconButton icon="close" label={clearLabel} className="mo-search-view__clear" data-search-clear="" />
        </div>
        <List id={list} role={listbox ? 'listbox' : undefined} aria-label={label} className="mo-search-view__results">
          {results.map((r, i) => (
            <ListItem
              key={i}
              href={r.href}
              leading={r.icon ? <Svg name={r.icon} size={24} /> : undefined}
              headline={r.headline}
              supporting={r.supporting}
              presentation={listbox}
              role={listbox ? 'option' : undefined}
              id={`${list}-${i}`}
              aria-selected={listbox ? 'false' : undefined}
              data-search-option=""
            />
          ))}
        </List>
        <p className="mo-search-view__empty" hidden data-search-empty="">
          {emptyText}
        </p>
      </dialog>
    </div>
  );
}

/** The search bar as a button that opens the search view (the editor's start screen, in its top bar or in the page): the contained bar, 56dp, with its leading
 * search icon and its hint (`label`, also its name for screen readers). `className` goes on the bar; the rest (`onClick`, `aria-expanded`, `aria-keyshortcuts`)
 * on the button. Exposes SearchBarButton. */
export function SearchBarButton({ label, className, ...rest }: { label: string; className?: string } & Record<string, unknown>) {
  return (
    <div className={['mo-search-bar', className].filter(Boolean).join(' ')}>
      <button type="button" className="mo-search-bar__field" aria-haspopup="dialog" {...rest}>
        <span className="mo-search-bar__leading">
          <Svg name="search" size={24} />
        </span>
        <span className="mo-search-bar__placeholder">{label}</span>
      </button>
    </div>
  );
}

/** A category label over a group of suggestions or results (M3 search, guidelines: "Category labels, like Recent, Contacts, or Suggestions"): its text, 16dp in
 * like the list items' icons, `id` for the group it names (aria-labelledby). Exposes SearchGroupLabel. */
export function SearchGroupLabel({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <div id={id} className={['mo-search-view__group-label', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

/** The search bar alone, searching in place (the editor's lists, narrowed as it is written in): the bar with its
 * leading icon and a field (an <input type="search">, `label` its name and placeholder) instead of the button that opens
 * the view. Other attributes (`value`, `onChange`, `ref`) go on the <input>, and `className` on the bar. */
export function SearchBar({
  label,
  leadingIcon = 'search',
  className,
  ...rest
}: { label: string; leadingIcon?: string; className?: string } & Record<string, unknown>) {
  // The bar's ring is for the keyboard only (search.css reads data-mo-input).
  useEffect(trackInputModality, []);
  return (
    <label className={['mo-search-bar', className].filter(Boolean).join(' ')}>
      <span className="mo-search-bar__field">
        <span className="mo-search-bar__leading">
          <Svg name={leadingIcon} size={24} />
        </span>
        <input type="search" className="mo-search-bar__input" aria-label={label} placeholder={label} {...rest} />
      </span>
    </label>
  );
}

/** An option of the controlled search view. */
export type SearchViewItem = {
  /** Stable, given back by `onActive…` and `onActivate`. */
  id: string;
  headline: ReactNode;
  /** The group or the path under the name ("Settings › Caching and builds"). */
  supporting?: ReactNode;
  /** A leading icon: its name, or an icon made (IconRef). */
  icon?: IconRef;
  /** A leading image (a picture of the result, 56dp), instead of the icon. */
  thumb?: string;
  /** Takes the item out of the list (a recent search): a button after it, and the Delete key while it is the active one. */
  onRemove?: () => void;
  /** The button's name for screen readers ("Remove “files” from recent searches"). */
  removeLabel?: string;
  /** What trails it as text, as people read it ("Ctrl+B"). */
  shortcut?: string;
  /** The same key for `aria-keyshortcuts` ("Control+B"). */
  keyShortcuts?: string;
  /** Can be highlighted but not run (`aria-disabled`); `supporting` says why. */
  disabled?: boolean;
  /** A toggle or the current choice: shown with a check, and `aria-checked`. Left out for an item that is not one. */
  pressed?: boolean;
};

/** A filter chip under the bar (M3: "Filter chips to narrow down results"). */
export type SearchViewFilter = { id: string; label: string; icon?: IconRef; disabled?: boolean };

/** Results under a label: a group's name over its options (M3: "Category labels, like Recent, Contacts, or Suggestions"). */
export type SearchViewGroup = { id: string; label?: string; items: SearchViewItem[] };

/** Whether the window is at the medium breakpoint or wider (the search view then docks; below it is full screen). */
function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const media = matchMedia(atLeast('medium'));
    const set = () => setWide(media.matches);
    set();
    media.addEventListener('change', set);
    return () => media.removeEventListener('change', set);
  }, []);
  return wide;
}

/**
 * The search view driven by React: a modal <dialog> (the page behind it is inert, Escape closes it, the focus stays in it) that is full screen
 * on a phone and docked from the medium breakpoint (`dock` places it under a bar; without one it stands near the top, in the middle).
 * The focus stays in the field while the arrow keys, Home and End move `activeId` through the options (aria-activedescendant); Enter and a click
 * call `onActivate` (not for a disabled option). `onClose` is called by the back button, Escape (also with something written) and a tap outside; the caller sets `open` false.
 * Nothing is searched here: the caller gives the results for `query`.
 */
export function SearchView({
  open,
  onClose,
  label,
  backLabel,
  clearLabel,
  emptyText,
  liveText,
  query,
  onQueryChange,
  groups,
  activeId,
  onActiveChange,
  onActivate,
  dock,
  filters,
  filtersLabel,
  filter,
  onFilterChange,
  className,
  ...rest
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  backLabel: string;
  clearLabel: string;
  /** Shown when no group has an option ("Nothing found for “x”"). */
  emptyText: string;
  /** Said by a polite live region when it changes ("5 results", "Nothing found"). */
  liveText?: string;
  query: string;
  onQueryChange: (query: string) => void;
  groups: SearchViewGroup[];
  activeId?: string;
  onActiveChange: (id: string) => void;
  onActivate: (id: string) => void;
  /** Where a docked view stands, in px from the window's corner (under a search bar). */
  dock?: { top: number; left: number; width: number };
  /** Filter chips in a row under the bar, one chosen at a time (pressing the chosen one again clears it). */
  filters?: SearchViewFilter[];
  /** The chip row's name for screen readers. */
  filtersLabel?: string;
  /** The chosen filter's id, or none. */
  filter?: string | null;
  onFilterChange?: (id: string | null) => void;
  className?: string;
} & Record<string, unknown>) {
  const id = useId();
  const list = `${id}-results`;
  const dialog = useRef<HTMLDialogElement & HTMLDivElement>(null);
  const returnTo = useRef<Element | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const wide = useWide();
  const shown = groups.filter((g) => g.items.length > 0);
  const flat = shown.flatMap((g) => g.items);
  const at = activeId === undefined ? -1 : flat.findIndex((i) => i.id === activeId);
  const optionId = (index: number) => `${list}-${index}`;
  // The field's ring is for the keyboard only (search.css reads data-mo-input): a text field matches :focus-visible after a click too.
  useEffect(trackInputModality, []);

  // Full screen (below the medium breakpoint): a modal <dialog> while it is open: the page behind it is inert, Escape closes it, and the focus goes to the field.
  // From medium it is a dropdown (M3 docked): a panel under the bar, not modal, with M3's scrim over the page (a ::before of the panel, so a press on it closes the view): Escape, a press outside it and
  // the back button close it, and the focus goes back to where it was.
  useEffect(() => {
    const view = dialog.current;
    if (!view) return;
    if (wide) {
      if (open) {
        returnTo.current = document.activeElement;
        input.current?.focus();
      } else if (returnTo.current) {
        const back = returnTo.current as HTMLElement;
        returnTo.current = null;
        if (back.isConnected) back.focus({ preventScroll: true });
      }
      return;
    }
    if (open && !view.open) {
      view.showModal();
      input.current?.focus();
    } else if (!open && view.open) view.close();
  }, [open, wide]);
  // The dropdown closes with a press anywhere outside it (not on the button or bar that opens it: that keeps it open).
  useEffect(() => {
    if (!open || !wide) return;
    const press = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (
        !target ||
        (target !== dialog.current && dialog.current?.contains(target)) ||
        target.closest('[aria-haspopup="dialog"][data-keeps-block]')
      )
        return;
      onClose();
    };
    document.addEventListener('pointerdown', press, true);
    return () => document.removeEventListener('pointerdown', press, true);
  }, [open, wide, onClose]);
  // The page under a full-screen view does not scroll while it is open.
  useEffect(() => {
    if (!open || wide) return;
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => void (root.style.overflow = before);
  }, [open, wide]);
  // The option the arrow keys are on stays in view.
  useEffect(() => {
    if (open && at >= 0) document.getElementById(optionId(at))?.scrollIntoView({ block: 'nearest' });
  });

  const move = (to: number) => flat[to] && onActiveChange(flat[to].id);
  const style =
    wide && dock
      ? ({
          '--mo-comp-search-view-top': `${dock.top}px`,
          '--mo-comp-search-view-left': `${dock.left}px`,
          '--mo-comp-search-view-width': `${dock.width}px`,
        } as CSSProperties)
      : undefined;
  let index = -1;
  const Panel = (wide ? 'div' : 'dialog') as 'div';
  return (
    <div className={[searchClass, className].filter(Boolean).join(' ')} data-search-controlled="" {...rest}>
      <Panel
        ref={dialog}
        className={['mo-search-view', wide && 'mo-search-view__docked'].filter(Boolean).join(' ')}
        style={style}
        aria-label={label}
        // Open: the full-screen <dialog> is `open` once shown; the dropdown is drawn only while it is open.
        data-search-view-open={open ? '' : undefined}
        {...(wide
          ? { role: 'search', hidden: !open }
          : {
              onClose: () => open && onClose(),
              onClick: (e: { target: unknown; currentTarget: unknown }) => e.target === e.currentTarget && onClose(),
            })}
      >
        <div className="mo-search-view__header">
          <IconButton icon="arrow_back" label={backLabel} onClick={onClose} />
          <input
            ref={input}
            type="search"
            className="mo-search-view__input"
            role="combobox"
            aria-label={label}
            aria-expanded="true"
            aria-controls={list}
            aria-autocomplete="list"
            aria-activedescendant={at >= 0 ? optionId(at) : undefined}
            autoComplete="off"
            enterKeyHint="search"
            placeholder={label}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={(e) => {
              // Escape closes the view also with something written (a search field would only clear itself, and the second press would close it).
              if (e.key === 'Escape' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                onClose();
                return;
              }
              if (e.nativeEvent.isComposing || !flat.length) return;
              if (e.key === 'ArrowDown') move((at + 1) % flat.length);
              else if (e.key === 'ArrowUp') move(at <= 0 ? flat.length - 1 : at - 1);
              else if (e.key === 'Home') move(0);
              else if (e.key === 'End') move(flat.length - 1);
              else if (e.key === 'Delete' && at >= 0 && flat[at].onRemove && !query) flat[at].onRemove!();
              else if (e.key === 'Enter' && (at >= 0 || query.trim())) {
                // The highlighted option, or with something typed and nothing highlighted yet, the first result.
                const option = flat[at >= 0 ? at : 0];
                if (!option.disabled) onActivate(option.id);
              } else return;
              e.preventDefault();
            }}
          />
          <IconButton
            icon="close"
            label={clearLabel}
            className="mo-search-view__clear"
            onClick={() => {
              onQueryChange('');
              input.current?.focus();
            }}
          />
        </div>
        {/* The container of the filters, the lists and what is shown when nothing fits: in the docked view a container of its own under the bar (M3 specs: "Search view contained docked bar results gap 2dp"). */}
        <div className="mo-search-view__body">
          {filters && filters.length > 0 && (
            <ChipSet layout="scroll" label={filtersLabel ?? ''} className="mo-search-view__filters">
              {filters.map((f) => (
                <Chip
                  key={f.id}
                  kind="filter"
                  label={f.label}
                  icon={f.icon}
                  selected={filter === f.id}
                  disabled={f.disabled}
                  // A press keeps the focus in the field.
                  onMouseDown={(e: { preventDefault: () => void }) => e.preventDefault()}
                  onClick={() => onFilterChange?.(filter === f.id ? null : f.id)}
                />
              ))}
            </ChipSet>
          )}
          <div
            id={list}
            // An empty list is no listbox (a listbox needs options; axe: aria-required-children).
            role={flat.length ? 'listbox' : undefined}
            aria-label={flat.length ? label : undefined}
            className="mo-search-view__results"
            hidden={!flat.length}
            // A tap on an option keeps the focus in the field.
            onMouseDown={(e) => e.preventDefault()}
          >
            {shown.map((group) => (
              <div
                key={group.id}
                role="group"
                className="mo-search-view__group"
                aria-labelledby={group.label ? `${list}-group-${group.id}` : undefined}
              >
                {group.label && <SearchGroupLabel id={`${list}-group-${group.id}`}>{group.label}</SearchGroupLabel>}
                <List role="none" kind="segmented">
                  {group.items.map((item) => {
                    index += 1;
                    return (
                      <ListItem
                        key={item.id}
                        id={optionId(index)}
                        role="option"
                        presentation
                        aria-selected={index === at}
                        aria-disabled={item.disabled ? true : undefined}
                        aria-checked={item.pressed === undefined ? undefined : item.pressed}
                        aria-keyshortcuts={item.keyShortcuts ?? (item.onRemove ? 'Delete' : undefined)}
                        leadingIcon={item.thumb ? undefined : item.icon}
                        leadingImage={item.thumb ? { src: item.thumb } : undefined}
                        headline={item.headline}
                        supporting={item.supporting}
                        trailingSupporting={item.shortcut}
                        trailingIcon={item.pressed ? 'check' : undefined}
                        disabled={item.disabled}
                        onClick={() => onActivate(item.id)}
                        actions={
                          item.onRemove && (
                            // The remove button is for a pointer: the field's Delete key does it for the keyboard, so it takes no focus and screen readers skip it.
                            <IconButton
                              icon="close"
                              label={item.removeLabel ?? ''}
                              tabIndex={-1}
                              aria-hidden="true"
                              onClick={() => {
                                item.onRemove!();
                                input.current?.focus();
                              }}
                            />
                          )
                        }
                      />
                    );
                  })}
                </List>
              </div>
            ))}
          </div>
          <p className="mo-search-view__empty" hidden={flat.length > 0}>
            {emptyText}
          </p>
        </div>
        <p className="mo-search-view__live" role="status" aria-live="polite">
          {liveText}
        </p>
      </Panel>
    </div>
  );
}
