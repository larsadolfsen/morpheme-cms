// What shows while rows are selected: the way out (a close icon button or a "Cancel" text button, `kind`), the actions
// of the screen (`children`) and a polite live count, so a screen reader hears each change ("3 selected"). One component
// for the lists that select (Library.tsx puts it in the top bar's actions, NotificationActions.tsx at the foot of the
// notifications' sheet); it moves to the docked contextual row in one change, later. Exposes SelectionBar.
// With `total` and `onSelectAll` the bar also has the select-all checkbox (M3 Selection: a checkbox in the header, "a parent
// checkbox allows for easy selection or deselection of all items"; indeterminate while some are selected, ticked when all are).
// Uses Button and IconButton (ui.tsx), the theme's Checkbox and the texts in t.library.
import type { ReactNode } from 'react';
import { X } from '@phosphor-icons/react';
import { Button, Checkbox, IconButton } from './ui';
import { t } from './i18n';

export default function SelectionBar({
  count,
  onClose,
  total,
  onSelectAll,
  kind = 'icons',
  children,
}: {
  /** How many are selected. */
  count: number;
  /** Unselects all and ends selecting. */
  onClose: () => void;
  /** How many rows can be selected (for the select-all box). */
  total?: number;
  /** Ticks (true) or unticks (false) the select-all box: selects all rows or none. Without it there is no box. */
  onSelectAll?: (all: boolean) => void;
  /** `icons`: the close button first, as icon buttons (a top bar); `buttons`: the actions first, "Cancel" last (a sheet);
   * `actions`: only the actions, the way out is elsewhere (the count control above the files' grid, Media.tsx). */
  kind?: 'icons' | 'buttons' | 'actions';
  children?: ReactNode;
}) {
  return (
    <>
      <span className="sr-only" role="status" aria-live="polite">
        {t.library.selectedCount(count)}
      </span>
      {kind === 'actions' ? (
        children
      ) : kind === 'icons' ? (
        <>
          <IconButton icon={X} label={t.library.closeSelection} onClick={onClose} />
          {onSelectAll && total ? (
            <Checkbox
              label={t.library.selectAll}
              className="selection-bar-all"
              checked={count >= total}
              indeterminate={count > 0 && count < total}
              onChange={onSelectAll}
            />
          ) : null}
          {children}
        </>
      ) : (
        <>
          {children}
          <Button kind="text" icon={X} onClick={onClose}>
            {t.library.cancelSelection}
          </Button>
        </>
      )}
    </>
  );
}
