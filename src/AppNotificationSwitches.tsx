// The kinds of notifications an installed app sends, each with its switch (notificationData.ts). Exposes
// AppNotificationSwitches (default). Depends on ./ui, ./i18n and ./notificationData.
import { GroupTitle, SwitchRow } from './ui';
import { t } from './i18n';
import { setOn, useNotificationChoices } from './notificationData';

/** The app's kinds of notifications under "Notifications", each with its switch, the same as under "Account" ›
 * "Notifications". */
export default function AppNotificationSwitches({ notifies }: { notifies: { label: string; type?: string }[] }) {
  const { off } = useNotificationChoices();
  return (
    <section className="mb-8">
      <GroupTitle>{t.apps.notifications}</GroupTitle>
      <div className="space-y-5 px-4">
        {notifies.map((n) => (
          <SwitchRow key={n.type} label={n.label} selected={!off.includes(n.type!)} onChange={(yes) => setOn(n.type!, yes)} />
        ))}
      </div>
    </section>
  );
}
