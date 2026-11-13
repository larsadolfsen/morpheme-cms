// What shows while rows are selected: the way out (a close icon button or a "Cancel" text button, `kind`), the actions
// of the screen (`children`) and a polite live count, so a screen reader hears each change ("3 selected"). One component
// for the lists that select (Library.tsx puts it in the top bar's actions, NotificationActions.tsx at the foot of the
// notifications' sheet); it moves to the docked contextual row in one change, later. Exposes SelectionBar.
// Uses Button and IconButton (ui.tsx) and the texts in t.library.
import type { ReactNode } from 'react';
import { X } from '@phosphor-icons/react';
import { Button, IconButton } from './ui';
import { t } from './i18n';

export default function SelectionBar({
  count,
  onClose,
  kind = 'icons',
  children,
}: {
  /** How many are selected. */
  count: number;
  /** Unselects all and ends selecting. */
  onClose: () => void;
  /** `icons`: the close button first, as icon buttons (a top bar); `buttons`: the actions first, "Cancel" last (a sheet). */
  kind?: 'icons' | 'buttons';
  children?: ReactNode;
}) {
  return (
    <>
      <span className="sr-only" role="status" aria-live="polite">
        {t.library.selectedCount(count)}
      </span>
      {kind === 'icons' ? (
        <>
          <IconButton icon={X} label={t.library.closeSelection} onClick={onClose} />
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
