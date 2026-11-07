// The box on the Morpheme page (#morpheme) and above the store lists for a site without a key to the store: the button "Connect to Morpheme", or a note for editors who may only read.
// Exposes StoreConnectNotice({ mayChange, onConnected }); uses Notice, Button, EmptyNote (ui.tsx), snackbar (lib/snackbar.ts) and connect (storeConnection.ts).
import { useState } from 'react';
import { snackbar } from '../lib/snackbar';
import { connect } from './storeConnection';
import { Button, EmptyNote, Notice } from './ui';
import { t } from './i18n';

export function StoreConnectNotice({ mayChange, onConnected }: { mayChange: boolean; onConnected: () => void }) {
  const [busy, setBusy] = useState(false);
  if (!mayChange) return <EmptyNote>{t.apps.noStore}</EmptyNote>;
  async function connectNow() {
    setBusy(true);
    try {
      await connect();
      onConnected();
    } catch (e) {
      snackbar({ text: (e as Error).message, error: true });
      setBusy(false);
    }
  }
  return (
    <Notice
      title={t.apps.connectTitle}
      action={
        <Button disabled={busy} onClick={connectNow}>
          {t.apps.connect}
        </Button>
      }
    >
      {t.apps.connectText}
    </Notice>
  );
}
