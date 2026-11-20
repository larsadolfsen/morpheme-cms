// The site's connected assistants, from the editor: assistants() reads them, disconnect() ends one. Exposes assistants, disconnect
// and the types. Used by Assistants.tsx. Depends on assistantsCall.ts (the request), storeFetch.ts (timedFetch) and i18n (the texts of a failure).
import { callAssistants, type Assistants, type AssistantsDeps, type Connection } from './assistantsCall';
import { timedFetch } from './storeFetch';
import { t } from './i18n';

export type { Assistants, Connection };

const deps = (): AssistantsDeps => ({
  fetch: (url, init) => timedFetch(fetch, url, init),
  forbidden: t.assistants.forbidden,
  failed: t.assistants.failed,
});

/** Who is connected, whether assistants are set up and the address to give an assistant. */
export const assistants = () => callAssistants('GET', undefined, deps());

/** Disconnects one assistant; gives who is left. */
export const disconnect = (id: string) => callAssistants('DELETE', id, deps());
