// The buttons at the bottom of the notifications' side sheet (Notifications.tsx): while some are selected, one deletes
// them and one unselects them; else one clears all and one opens "Account" to choose the types. Exposes NotificationActions.
// Uses SelectionBar, Button (ui.tsx) and the texts in t.library.
import { Button } from './ui';
import SelectionBar from './SelectionBar';
import { t } from './i18n';
import { materialIcon } from './icon';

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
    <SelectionBar kind="buttons" count={selected} onClose={onUnselect}>
      <Button kind="outlined" tone="error" icon={materialIcon('delete')} onClick={onDelete}>
        {t.library.deleteSelected(selected)}
      </Button>
    </SelectionBar>
  ) : (
    <>
      <Button kind="text" icon={materialIcon('delete')} disabled={!hasItems} onClick={onClear}>
        {t.library.clearNotifications}
      </Button>
      <a className="mo-link" href="#account">
        {t.library.notificationChoices}
      </a>
    </>
  );
}
