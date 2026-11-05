// "Notifikationer" (#notifikationer), which the bell in the top bar opens (Screen.tsx NotificationsLink): the
// notifications of the editor and the apps (notificationData.ts), newest first, each with when it came and, when it had
// one, a link to what it is about; an app's with the app's icon. Opening it marks them seen; at the top the bin clears
// them and the sliders open "Konto", where each type is turned on or off.
import { useEffect } from 'react';
import { Info, SlidersHorizontal, Trash, WarningCircle } from '@phosphor-icons/react';
import { siteName } from '@site/editor';
import Screen from './Screen';
import { EmptyNote, Group, IconButton, IconLink, ListItem } from './ui';
import { apps } from './registry';
import { clearNotifications, markSeen, useNotifications, type Notification } from './notificationData';
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
  const { items } = useNotifications();
  useEffect(markSeen, [items]);
  return (
    <Screen
      title={t.library.notifications}
      back={{ href: '#', label: siteName }}
      actions={
        <>
          <IconButton
            icon={Trash}
            label={t.library.clearNotifications}

            disabled={!items.length}
            onClick={clearNotifications}
          />
          <IconLink href="#account" icon={SlidersHorizontal} label={t.library.notificationChoices} />
        </>
      }
    >
      {items.length ? (
        <Group>
          {items.map((n) => (
            <Row key={`${n.at}-${n.text}`} {...n} />
          ))}
        </Group>
      ) : (
        <EmptyNote>{t.library.noNotifications}</EmptyNote>
      )}
    </Screen>
  );
}
