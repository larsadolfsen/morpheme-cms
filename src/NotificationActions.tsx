// The buttons at the bottom of the notifications' side sheet (Notifications.tsx): while some are selected, one deletes
// them and one unselects them; else one clears all and one opens "Konto" to choose the types. Exposes NotificationActions.
// Uses Button and LinkButton (ui.tsx) and the texts in t.library.
import { SlidersHorizontal, Trash, X } from '@phosphor-icons/react';
import { Button, LinkButton } from './ui';
import { t } from './i18n';

export default function NotificationActions({
  selected,
  hasItems,
  onDelete,
  onUnselect,
  onClear,
}: {
  /** How many are selected. */
  selected: number;
  hasItems: boolean;
  onDelete: () => void;
  onUnselect: () => void;
  onClear: () => void;
}) {
  return selected ? (
    <>
      <Button kind="text" icon={Trash} onClick={onDelete}>
        {t.library.deleteSelected(selected)}
      </Button>
      <Button kind="text" icon={X} onClick={onUnselect}>
        {t.library.cancelSelection}
      </Button>
    </>
  ) : (
    <>
      <Button kind="text" icon={Trash} disabled={!hasItems} onClick={onClear}>
        {t.library.clearNotifications}
      </Button>
      <LinkButton kind="text" icon={SlidersHorizontal} href="#account">
        {t.library.notificationChoices}
      </LinkButton>
    </>
  );
}
