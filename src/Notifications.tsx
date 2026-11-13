// "Notifications": a modal side sheet at the end of the screen, over the screen that is open, which the bell in the top bar
// opens (Screen.tsx NotificationsButton, notificationsOpen.ts): the notifications of the editor and the apps
// (notificationData.ts), newest first, each with when it came and, when it had one, a link to what it is about; an app's
// with the app's icon. Opening it marks them seen; at the bottom one button clears them and another opens "Account", where
// each type is turned on or off (NotificationActions.tsx). A long press selects one (useSelection.ts, ListItem `selectable`), and then a tap selects or
// unselects the others; while some are selected the buttons delete them or unselect them. Closing unselects them (when it has slid out, which keeps the list until then). Its
// cross, Escape, a tap on the scrim, the phone's back gesture (only the sheet) and going to another address (a
// notification's link) close it; Escape while some are selected only unselects them. Its open, close and
// slide are the theme's (sideSheet(), sideSheetControl.ts). The old address #notifications opens it over the start screen
// (App.tsx).
import { useEffect, useId, useRef, useState } from 'react';
import { Info, WarningCircle } from '@phosphor-icons/react';
import { EmptyNote, Group, ListItem } from './ui';
import { useSelection } from './useSelection';
import NotificationActions from './NotificationActions';
import { SiteSideSheet, siteSideSheet, siteSideSheetDialogClass } from './themeUi';
import { apps } from './registry';
import {
  clearNotifications,
  markSeen,
  notificationKey,
  removeNotifications,
  useNotifications,
  type Notification,
} from './notificationData';
import { closeNotifications, useNotificationsOpen } from './notificationsOpen';
import { useSheetBack } from './useSheetBack';
import { when } from './when';
import { t } from './i18n';

type RowProps = Notification & { selection: Record<string, unknown> };

function Row({ text, type, error, at, link, selection }: RowProps) {
  const app = apps.find((a) => type?.startsWith(`${a.id}/`));
  return (
    <ListItem
      {...selection}
      // Without a link the row is a plain item: the keys (Space) need it in the tab order.
      tabIndex={link ? undefined : 0}
      href={link?.href}
      icon={app?.icon ?? (error ? WarningCircle : Info)}
      headline={text}
      supporting={link ? `${when(new Date(at))} · ${link.text}` : when(new Date(at))}
      arrow={!!link}
    />
  );
}

export default function Notifications() {
  const open = useNotificationsOpen();
  const { items } = useNotifications();
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const controls = useRef<ReturnType<typeof siteSideSheet> | null>(null);
  const [kept, setKept] = useState(false);
  // The notifications selected (notificationKey), kept to those still there; its keys count only in the sheet.
  const selection = useSelection({ order: items.map(notificationKey), root: dialog });
  const selected = selection.keys;
  const { clear: unselect } = selection;

  // The theme's control, once. Its cross, Escape and the scrim close the sheet through the open state, so the bell knows.
  useEffect(() => {
    controls.current = siteSideSheet(dialog.current!, {
      beforeClose: () => {
        closeNotifications();
        return false;
      },
    });
    return () => {
      controls.current = null;
      document.documentElement.style.overflow = '';
    };
  }, []);

  // The list stays until the slide out has ended (`kept`), so the sheet does not slide out empty.
  useEffect(() => {
    if (open) {
      setKept(true);
      controls.current?.open();
      return;
    }
    let reopened = false;
    void controls.current?.close().then(() => {
      if (reopened) return;
      setKept(false);
      unselect();
    });
    return () => {
      reopened = true;
    };
  }, [open]);

  // The phone's back gesture closes the sheet only (useSheetBack).
  useSheetBack(open, closeNotifications, 'notifications');

  // Another address (a notification's link, "Settings") closes it.
  useEffect(() => {
    if (!open) return;
    window.addEventListener('hashchange', closeNotifications);
    return () => window.removeEventListener('hashchange', closeNotifications);
  }, [open]);

  useEffect(() => {
    if (open) markSeen();
  }, [open, items]);

  return (
    <dialog
      ref={dialog}
      className={siteSideSheetDialogClass}
      aria-labelledby={id}
      // Escape while some are selected only unselects them (useSelection); the dialog's own close (cancel) does not follow.
      onKeyDown={(e) => {
        if (e.key === 'Escape' && selected.length) e.preventDefault();
      }}
    >
      <SiteSideSheet
        kind="modal"
        headline={t.library.notifications}
        headlineId={id}
        closeLabel={t.common.close}
        actions={
          <NotificationActions
            selected={selected.length}
            hasItems={items.length > 0}
            onDelete={() => {
              removeNotifications(selected);
              selection.removed();
            }}
            onUnselect={selection.clear}
            onClear={clearNotifications}
          />
        }
      >
        {(open || kept) &&
          (items.length ? (
            <Group>
              {items.map((n) => {
                const key = notificationKey(n);
                return <Row key={key} {...n} selection={selection.row(key)} />;
              })}
            </Group>
          ) : (
            <EmptyNote>{t.library.noNotifications}</EmptyNote>
          ))}
      </SiteSideSheet>
    </dialog>
  );
}
