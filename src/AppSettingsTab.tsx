// The Settings tab of an installed app's page, below its head and its settings form: the "Aktiveret" switch, what the app
// shows itself (`page`, not while it is off), what it adds with its switches, its kinds of notifications with their switches,
// and "Afinstaller" with its text (it shows the loading indicator while it uninstalls).
// Exposes AppSettingsTab (default). Depends on AppAdds.tsx, AppNotificationSwitches.tsx, ./ui and notificationData.ts.
import { Button, SupportingText, SwitchRow } from './ui';
import AppAdds from './AppAdds';
import AppNotificationSwitches from './AppNotificationSwitches';
import type { RepoFile } from './github';
import type { Env } from './App';
import type { SiteApp } from './apps';
import { appType } from './notificationData';
import { siteText, t } from './i18n';

/** `busy`: something is saving; `enabled`: the app is not turned off, `onEnabled`: the switch "Aktiveret"; `uninstalling`: this app is
 * uninstalled now; `stuck`: the app is in use, so it cannot be uninstalled; `onUninstall`: "Afinstaller". */
export default function AppSettingsTab({
  app,
  env,
  files,
  busy,
  enabled,
  onEnabled,
  uninstalling,
  stuck,
  onUninstall,
}: {
  app: SiteApp;
  env: Env;
  files: RepoFile[];
  busy: boolean;
  enabled: boolean;
  onEnabled: (on: boolean) => void;
  uninstalling: boolean;
  stuck: boolean;
  onUninstall: () => void;
}) {
  const notifies = Object.entries(app.notifications?.types ?? {}).map(([id, label]) => ({
    label: siteText(label),
    type: appType(app.id, id),
  }));
  return (
    <>
      <div className="mb-8 px-4">
        <SwitchRow label={t.apps.enabled} texts={[t.library.on, t.library.off]} selected={enabled} disabled={busy} onChange={onEnabled} />
      </div>
      {/* What the app shows itself (its `page`), while it is installed and not off. */}
      {app.page && enabled && (
        <div data-app-page={app.id}>
          <app.page api={(path, init) => env.appApi(app.id, path, init)} />
        </div>
      )}
      <AppAdds app={app} env={env} files={files} on />
      {notifies.length > 0 && <AppNotificationSwitches notifies={notifies} />}
      {/* As wide as the fields and the rows above. */}
      <div>
        <Button kind="outlined" disabled={busy || stuck} busy={uninstalling} onClick={onUninstall}>
          {t.apps.uninstall}
        </Button>
        <SupportingText className="mt-2">{stuck ? t.apps.stuck : t.apps.uninstallHint}</SupportingText>
      </div>
    </>
  );
}
