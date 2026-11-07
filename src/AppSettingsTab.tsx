// The Settings tab of an installed app's page, below its head and its settings form: what the app shows itself (`page`,
// not while it is off), what it adds with its switches, its kinds of notifications with their switches, and "Afinstaller"
// with its text (it shows the loading indicator while it uninstalls). The "Aktiveret" switch is AppEnabledSwitch.tsx, in AppList.tsx.
// Exposes AppSettingsTab (default). Depends on AppAdds.tsx, AppNotificationSwitches.tsx, ./ui and notificationData.ts.
import { Button, SupportingText } from './ui';
import AppAdds from './AppAdds';
import AppNotificationSwitches from './AppNotificationSwitches';
import type { RepoFile } from './github';
import type { Env } from './App';
import type { SiteApp } from './apps';
import { appType } from './notificationData';
import { siteText, t } from './i18n';

/** `busy`: something is saving; `enabled`: the app is not turned off (hides `app.page` while it is off); `uninstalling`: this app is
 * uninstalled now; `stuck`: the app is in use, so it cannot be uninstalled; `onUninstall`: "Afinstaller". */
export default function AppSettingsTab({
  app,
  env,
  files,
  busy,
  enabled,
  uninstalling,
  stuck,
  onUninstall,
}: {
  app: SiteApp;
  env: Env;
  files: RepoFile[];
  busy: boolean;
  enabled: boolean;
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
