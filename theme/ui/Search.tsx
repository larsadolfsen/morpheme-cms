// A search (m3.material.io/components/search, .search in ../styles/ui.css): the search bar (its leading icon,
// `leadingIcon`, the theme's magnifying glass if it has none, the placeholder, `label`, and what stands after it,
// `trailing`: icon buttons, an avatar) and the search view it opens (a <dialog>: over the whole screen on a phone, docked
// where the bar is from the medium breakpoint), with the button back (`backLabel`), the field (a role="combobox"), the button that
// empties it (`clearLabel`), and the results (`results`, the theme's list, List and ListItem, as a role="listbox" of
// links, each its headline, evt. its supporting text and its icon) or, when none fits, `emptyText`. On the site
// search.script.ts opens and closes it (the back button, Escape, a tap outside), narrows the results to what is
// written, and moves through them with the arrow keys (Enter follows the one it is on). In the editor only drawn:
// `open` draws the view (as docked) with `query` in the field instead of the bar. How it looks is the theme's.
import { useId, type ReactNode } from 'react';
import { Svg } from '@morphemecms/cms/src/icon';
import IconButton from '@theme/ui/IconButton';
import List, { ListItem } from '@theme/ui/List';

export type SearchResult = { href: string; headline: ReactNode; supporting?: ReactNode; icon?: string };

/** The class of a search (the bar and its view). */
export const searchClass = 'search';

export default function Search({
  label,
  backLabel,
  clearLabel,
  emptyText,
  results,
  leadingIcon = 'magnifying-glass',
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
  return (
    <div className={[searchClass, className].filter(Boolean).join(' ')} data-search="" {...rest}>
      {!open && (
        <div className="search-bar">
          <button
            type="button"
            className="search-bar-field"
            aria-haspopup="dialog"
            aria-expanded="false"
            aria-controls={view}
            data-search-open=""
          >
            <span className="search-bar-leading">
              <Svg name={leadingIcon} size={24} />
            </span>
            <span className="search-bar-placeholder">{label}</span>
          </button>
          {trailing && <span className="search-bar-trailing">{trailing}</span>}
        </div>
      )}
      <dialog id={view} className="search-view" aria-label={label} open={open} data-search-view="">
        <div className="search-view-header">
          <IconButton icon="arrow-left" label={backLabel} data-search-close="" />
          <input
            type="search"
            className="search-view-input"
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
          <IconButton icon="x" label={clearLabel} className="search-view-clear" data-search-clear="" />
        </div>
        <List id={list} role="listbox" aria-label={label} className="search-view-results">
          {results.map((r, i) => (
            <ListItem
              key={i}
              href={r.href}
              leading={r.icon ? <Svg name={r.icon} size={24} /> : undefined}
              headline={r.headline}
              supporting={r.supporting}
              presentation
              role="option"
              id={`${list}-${i}`}
              aria-selected="false"
              data-search-option=""
            />
          ))}
        </List>
        <p className="search-view-empty" hidden data-search-empty="">
          {emptyText}
        </p>
      </dialog>
    </div>
  );
}

/** The search bar alone, searching in place (the editor's lists, narrowed as it is written in): the bar with its
 * leading icon and a field (an <input type="search">, `label` its name and placeholder) instead of the button that opens
 * the view. Other attributes (`value`, `onChange`, `ref`) go on the <input>, and `className` on the bar. */
export function SearchBar({
  label,
  leadingIcon = 'magnifying-glass',
  className,
  ...rest
}: { label: string; leadingIcon?: string; className?: string } & Record<string, unknown>) {
  return (
    <label className={['search-bar', className].filter(Boolean).join(' ')}>
      <span className="search-bar-field">
        <span className="search-bar-leading">
          <Svg name={leadingIcon} size={24} />
        </span>
        <input type="search" className="search-bar-input" aria-label={label} placeholder={label} {...rest} />
      </span>
    </label>
  );
}
