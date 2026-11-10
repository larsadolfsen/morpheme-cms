// The "Enabled" switch of an installed app, shown on its page's Settings tab directly below the app's description.
// Exposes AppEnabledSwitch (default). Depends on ./ui (SwitchRow) and ./i18n (t).
import { SwitchRow } from './ui';
import { t } from './i18n';

/** `enabled`: the app is not turned off; `busy`: something is saving; `onEnabled`: called with the new state. */
export default function AppEnabledSwitch({
  enabled,
  busy,
  onEnabled,
}: {
  enabled: boolean;
  busy: boolean;
  onEnabled: (on: boolean) => void;
}) {
  return (
    <div className="mb-8 px-4">
      <SwitchRow label={t.apps.enabled} texts={[t.library.on, t.library.off]} selected={enabled} disabled={busy} onChange={onEnabled} />
    </div>
  );
}
