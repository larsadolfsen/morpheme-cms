// What a store screen (apps or themes) shows around its list: StoreRound (draws it again after connecting), StoreNotice (connect, loading or failed note).
// Exposes StoreRound, useStoreKey, useStoreConnected, StoreNotice; uses StoreConnectNotice, storeConnection.ts and env.store.connected.
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { EmptyNote } from './ui';
import type { Env } from './App';
import { StoreConnectNotice } from './StoreConnectNotice';
import { connection, type StoreConnection } from './storeConnection';
import { t } from './i18n';

/** Connecting or disconnecting draws the screen again from the start, so the catalogs and the key are asked again. */
export function StoreRound({ children }: { children: (again: () => void) => ReactNode }) {
  const [round, setRound] = useState(0);
  return <Fragment key={round}>{children(() => setRound((r) => r + 1))}</Fragment>;
}

/** The store key's state (storeConnection.ts); null while it is read. */
export function useStoreKey(): StoreConnection | null {
  const [key, setKey] = useState<StoreConnection | null>(null);
  useEffect(() => {
    connection().then(setKey, () => {});
  }, []);
  return key;
}

/** Whether the site's Worker has a store key (store.ts storeConnected): null while it is not known; a catalog that could
 * not be read counts as connected (the list says it failed). */
export function useStoreConnected(env: Env): boolean | null {
  const [connected, setConnected] = useState<boolean | null>(null);
  useEffect(() => {
    let on = true;
    env.store.connected().then(
      (yes) => on && setConnected(yes),
      () => on && setConnected(true),
    );
    return () => {
      on = false;
    };
  }, []);
  return connected;
}

/** The note above a store list: connect to the store, loading, or failed; nothing when the list is read. `read`: the
 * catalog of the list. */
export function StoreNotice({
  connected,
  read,
  mayChange,
  again,
}: {
  connected: boolean | null;
  read: unknown;
  mayChange: boolean;
  again: () => void;
}) {
  if (connected === false) return <StoreConnectNotice mayChange={mayChange} onConnected={again} />;
  if (read === null || connected === null) return <EmptyNote busy>{t.apps.loadingStore}</EmptyNote>;
  if (read === 'failed') return <EmptyNote>{t.apps.storeFailed}</EmptyNote>;
  return null;
}
