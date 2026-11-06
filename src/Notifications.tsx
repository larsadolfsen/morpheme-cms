// "Notifikationer": a modal side sheet at the end of the screen, over the screen that is open, which the bell in the top bar
// opens (Screen.tsx NotificationsButton, notificationsOpen.ts): the notifications of the editor and the apps
// (notificationData.ts), newest first, each with when it came and, when it had one, a link to what it is about; an app's
// with the app's icon. Opening it marks them seen; at the bottom one button clears them and another opens "Konto", where
// each type is turned on or off (NotificationActions.tsx). On a phone a long press selects one (ListItem `selectable`), and then a tap selects or
// unselects the others; while some are selected the buttons delete them or unselect them. Closing unselects them (when it has slid out, which keeps the list until then). Its
// cross, Escape, a tap on the scrim, the phone's back gesture (only the sheet) and going to another address (a
// notification's link) close it; Escape while some are selected only unselects them. Its open, close and
// slide are the theme's (sideSheet(), sideSheetControl.ts). The old address #notifications opens it over the start screen
// (App.tsx).
import { useEffect, useId, useRef, useState } from 'react';
import { Info, WarningCircle } from '@phosphor-icons/react';
import { EmptyNote, Group, ListItem } from './ui';
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

type RowProps = Notification & { selected: boolean; selecting: boolean; onSelectedChange: (selected: boolean) => void };

function Row({ text, type, error, at, link, selected, selecting, onSelectedChange }: RowProps) {
  const app = apps.find((a) => type?.startsWith(`${a.id}/`));
  return (
    <ListItem
      selectable
      selected={selected}
      selecting={selecting}
      onSelectedChange={onSelectedChange}
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
  // The keys of those selected (notificationKey), kept to those still there.
  const [picked, setPicked] = useState<string[]>([]);
  const [kept, setKept] = useState(false);
  const selected = picked.filter((k) => items.some((n) => notificationKey(n) === k));
  const pick = (key: string) => (on: boolean) => setPicked((p) => (on ? [...p, key] : p.filter((k) => k !== key)));

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
      setPicked([]);
    });
    return () => {
      reopened = true;
    };
  }, [open]);

  // The phone's back gesture closes the sheet only (useSheetBack).
  useSheetBack(open, closeNotifications, 'notifications');

  // Another address (a notification's link, "Vælg notifikationer") closes it.
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
      // Escape while some are selected only unselects them; the dialog's own close (cancel) does not follow.
      onKeyDown={(e) => {
        if (e.key !== 'Escape' || !selected.length) return;
        e.preventDefault();
        setPicked([]);
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
              setPicked([]);
            }}
            onUnselect={() => setPicked([])}
            onClear={clearNotifications}
          />
        }
      >
        {(open || kept) &&
          (items.length ? (
            <Group>
              {items.map((n) => {
                const key = notificationKey(n);
                return (
                  <Row key={key} {...n} selected={selected.includes(key)} selecting={selected.length > 0} onSelectedChange={pick(key)} />
                );
              })}
            </Group>
          ) : (
            <EmptyNote>{t.library.noNotifications}</EmptyNote>
          ))}
      </SiteSideSheet>
    </dialog>
  );
}
