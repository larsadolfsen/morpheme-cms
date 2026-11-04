// The site's connection to the Morpheme store, from the editor: connection() reads it, connect() and disconnect() change it.
// Exposes connection, connect, disconnect and StoreConnection; used by StoreConnectNotice.tsx, StoreConnectedRow.tsx and AppList.tsx.
// Depends on storeConnectionCall.ts (the request), store.ts (forgetCatalog) and i18n (the texts of a failure).
import { callConnection, type ConnectionDeps, type StoreConnection } from './storeConnectionCall';
import { forgetCatalog } from './store';
import { t } from './i18n';

export type { StoreConnection };

const deps = (): ConnectionDeps => ({
  fetch: (url, init) => fetch(url, init),
  forgetCatalog,
  busy: t.apps.connectBusy,
  failed: t.apps.storeFailed,
});

/** Whether the site has a key to the store, and who may change that. */
export const connection = () => callConnection('GET', deps());

/** Asks the store for a key for this site. */
export const connect = () => callConnection('POST', deps());

/** Tells the store to drop the site's key. */
export const disconnect = () => callConnection('DELETE', deps());
