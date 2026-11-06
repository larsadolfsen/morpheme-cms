// "Notifikationer": a modal side sheet at the end of the screen, over the screen that is open, which the bell in the top bar
// opens (Screen.tsx NotificationsButton, notificationsOpen.ts): the notifications of the editor and the apps
// (notificationData.ts), newest first, each with when it came and, when it had one, a link to what it is about; an app's
// with the app's icon. Opening it marks them seen; at the bottom one button clears them and another opens "Konto", where
// each type is turned on or off. Its cross, Escape, a tap on the scrim and going to another address (a notification's
// link) close it. Its open, close and slide are the theme's (sideSheet(), sideSheetControl.ts). The old address
// #notifications opens it over the start screen (App.tsx).
import { useEffect, useId, useRef } from 'react';
import { Info, SlidersHorizontal, Trash, WarningCircle } from '@phosphor-icons/react';
import { Button, EmptyNote, Group, LinkButton, ListItem } from './ui';
import { SiteSideSheet, siteSideSheet, siteSideSheetDialogClass } from './themeUi';
import { apps } from './registry';
import { clearNotifications, markSeen, useNotifications, type Notification } from './notificationData';
import { closeNotifications, useNotificationsOpen } from './notificationsOpen';
import { when } from './when';
import { t } from './i18n';

function Row({ text, type, error, at, link }: Notification) {
  const app = apps.find((a) => type?.startsWith(`${a.id}/`));
  return (
    <ListItem
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

  useEffect(() => {
    if (open) controls.current?.open();
    else void controls.current?.close();
  }, [open]);

  // Another address (a notification's link, "Vælg notifikationer", the phone's back gesture) closes it.
  useEffect(() => {
    if (!open) return;
    window.addEventListener('hashchange', closeNotifications);
    return () => window.removeEventListener('hashchange', closeNotifications);
  }, [open]);

  useEffect(() => {
    if (open) markSeen();
  }, [open, items]);

  return (
    <dialog ref={dialog} className={siteSideSheetDialogClass} aria-labelledby={id}>
      <SiteSideSheet
        kind="modal"
        headline={t.library.notifications}
        headlineId={id}
        closeLabel={t.common.close}
        actions={
          <>
            <Button kind="text" icon={Trash} disabled={!items.length} onClick={clearNotifications}>
              {t.library.clearNotifications}
            </Button>
            <LinkButton kind="text" icon={SlidersHorizontal} href="#account">
              {t.library.notificationChoices}
            </LinkButton>
          </>
        }
      >
        {open &&
          (items.length ? (
            <Group>
              {items.map((n) => (
                <Row key={`${n.at}-${n.text}`} {...n} />
              ))}
            </Group>
          ) : (
            <EmptyNote>{t.library.noNotifications}</EmptyNote>
          ))}
      </SiteSideSheet>
    </dialog>
  );
}
