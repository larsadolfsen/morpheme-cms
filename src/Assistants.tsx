// "Assistants" (#assistants), under "Settings": the address to give an assistant such as Claude, so it can read the site (the
// site's MCP server, worker/mcp.js), and the assistants that are connected, each with who connected it, when it was last used and
// Disconnect (asks first). Read-only: an assistant can't change anything. Exposes ASSISTANTS_ROUTE and the page. Depends on
// assistantList.ts (the Worker's /api/mcp/connections), ask.tsx, Screen and ui.tsx.
import { useCallback, useEffect, useState } from 'react';
import { Chats, Copy } from '@phosphor-icons/react';
import Screen from './Screen';
import { ask } from './ask';
import { assistants, disconnect, type Assistants as State, type Connection } from './assistantList';
import { lastUsedOf } from './assistantsCall';
import { backFrom } from './site';
import { Button, EmptyNote, Group, GroupTitle, ListItem, ProblemNote, SupportingText } from './ui';
import { locale, t } from './i18n';
import { snackbar } from '../lib/snackbar';

export const ASSISTANTS_ROUTE = 'assistants';

const when = (at: Date) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(at);

export default function Assistants() {
  const [state, setState] = useState<State | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setState(await assistants());
      setProblem(null);
    } catch (e) {
      setProblem((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function copy(address: string) {
    try {
      await navigator.clipboard.writeText(address);
      snackbar({ text: t.assistants.copied });
    } catch {
      // Nothing was copied: the address is on the screen to select.
    }
  }

  async function end(c: Connection) {
    if (!(await ask(t.assistants.disconnectAsk(c.name), t.assistants.disconnect))) return;
    setBusy(c.id);
    try {
      setState(await disconnect(c.id));
    } catch (e) {
      snackbar({ text: (e as Error).message, error: true });
    }
    setBusy(null);
  }

  return (
    <Screen title={t.common.parts.assistants} back={backFrom(ASSISTANTS_ROUTE)}>
      <SupportingText className="mb-6 px-4">{t.assistants.intro}</SupportingText>
      {problem && !state && (
        <div className="px-4">
          <ProblemNote alert>{problem}</ProblemNote>
        </div>
      )}
      {!state && !problem && <EmptyNote busy>{t.assistants.loading}</EmptyNote>}
      {state && !state.ready && (
        <div className="mb-6 px-4">
          <ProblemNote>{t.assistants.notReady}</ProblemNote>
        </div>
      )}
      {state?.ready && (
        <section className="mb-8">
          <GroupTitle>{t.assistants.connectTitle}</GroupTitle>
          <div className="px-4">
            <SupportingText>{t.assistants.connectText}</SupportingText>
            <p className="my-3 flex items-center gap-2">
              <code
                aria-label={t.assistants.address}
                className="min-w-0 flex-1 rounded-md bg-surface-container px-3 py-2 text-sm break-all select-all"
              >
                {state.address}
              </code>
              <Button kind="text" size="small" icon={Copy} onClick={() => copy(state.address)}>
                {t.assistants.copy}
              </Button>
            </p>
          </div>
        </section>
      )}
      {state && (
        <section className="mb-8">
          <GroupTitle>{t.assistants.connectedTitle}</GroupTitle>
          {state.connections.length === 0 ? (
            <EmptyNote>{t.assistants.none}</EmptyNote>
          ) : (
            <Group>
              {state.connections.map((c) => {
                const used = lastUsedOf(c);
                return (
                  <ListItem
                    key={c.id}
                    icon={Chats}
                    headline={c.name}
                    supporting={`${t.assistants.by(c.login)} · ${used ? t.assistants.lastUsed(when(used)) : t.assistants.neverUsed}`}
                    actions={
                      state.mayChange && (
                        <Button kind="text" size="small" disabled={busy === c.id} onClick={() => end(c)}>
                          {t.assistants.disconnect}
                        </Button>
                      )
                    }
                  />
                );
              })}
            </Group>
          )}
        </section>
      )}
    </Screen>
  );
}
