// The "Morpheme" group of "Avanceret": the site's connection to the Morpheme store, as the connected row (with the Morpheme logo) or the connect notice.
// Exposes MorphemeConnection(); uses StoreRound and useStoreKey (StoreStatus.tsx), StoreConnectedRow, StoreConnectNotice and GroupTitle (ui.tsx).
import { GroupTitle } from './ui';
import { StoreConnectedRow } from './StoreConnectedRow';
import { StoreConnectNotice } from './StoreConnectNotice';
import { StoreRound, useStoreKey } from './StoreStatus';
import { t } from './i18n';

/** Connecting or disconnecting draws the group again. Shows nothing while the key is read, and nothing when the site is
 * connected another way than the button or the editor may not change it (there is nothing to do then). */
export function MorphemeConnection() {
  return <StoreRound>{(again) => <Connection again={again} />}</StoreRound>;
}

function Connection({ again }: { again: () => void }) {
  const key = useStoreKey();
  if (!key) return null;
  const body = !key.connected ? (
    <StoreConnectNotice mayChange={key.mayChange} onConnected={again} />
  ) : key.by === 'button' && key.mayChange ? (
    <StoreConnectedRow site={key.site} onDisconnected={again} />
  ) : null;
  if (!body) return null;
  return (
    <section className="mb-8">
      <GroupTitle>{t.advanced.morpheme}</GroupTitle>
      {body}
    </section>
  );
}
