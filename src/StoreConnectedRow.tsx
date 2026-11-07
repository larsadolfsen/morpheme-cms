// The row in "Avanceret" that says the site is connected to Morpheme, with the Morpheme logo and the button "Disconnect from Morpheme" (asks first).
// Exposes StoreConnectedRow({ site, onDisconnected }); uses Group, ListItem, LeadingIcon, Button (ui.tsx), MorphemeLogo, ask (ask.tsx), snackbar (lib/snackbar.ts) and disconnect (storeConnection.ts).
import { useState } from 'react';
import { snackbar } from '../lib/snackbar';
import { ask } from './ask';
import { disconnect } from './storeConnection';
import { Button, Group, LeadingIcon, ListItem } from './ui';
import { MorphemeLogo } from './MorphemeLogo';
import { t } from './i18n';

export function StoreConnectedRow({ site, onDisconnected }: { site: string; onDisconnected: () => void }) {
  const [busy, setBusy] = useState(false);
  async function disconnectNow() {
    if (!(await ask(t.apps.disconnectAsk, t.apps.disconnect))) return;
    setBusy(true);
    try {
      await disconnect();
      onDisconnected();
    } catch (e) {
      snackbar({ text: (e as Error).message, error: true });
      setBusy(false);
    }
  }
  return (
    <Group>
      <ListItem
        leading={
          <LeadingIcon>
            <MorphemeLogo />
          </LeadingIcon>
        }
        headline={t.apps.connected}
        supporting={site}
        actions={
          <Button disabled={busy} onClick={disconnectNow}>
            {t.apps.disconnect}
          </Button>
        }
      />
    </Group>
  );
}
