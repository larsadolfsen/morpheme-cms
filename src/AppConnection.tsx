// A connector's connection to its service's MCP server (`mcp` in app.json, contract 5), on its Settings tab: "Connects to <host>"
// with the tools it uses, and Connect, Connected with Disconnect, or Needs sign-in. The Worker keeps the credentials
// (worker/mcp-client.js); this only learns whether a connection exists. Exposes AppConnection({ app }). Uses ui.tsx and ask.tsx.
import { useCallback, useEffect, useState } from 'react';
import { snackbar } from '../lib/snackbar';
import { ask } from './ask';
import { Button, GroupTitle, ListItem, plainListClass, SupportingText, TextField } from './ui';
import type { SiteApp } from './apps';
import { t } from './i18n';

type State = { host: string; tools: string[]; auth: 'oauth' | 'token' | 'none'; connected: boolean; needsSignIn: boolean };

export default function AppConnection({ app }: { app: SiteApp }) {
  const [state, setState] = useState<State | null>(null);
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const address = `/api/mcp-client/${app.id}`;
  const load = useCallback(async () => {
    try {
      const res = await fetch(address, { cache: 'no-store' });
      setState(res.ok ? ((await res.json()) as State) : null);
    } catch {
      setState(null);
    }
  }, [address]);
  useEffect(() => void load(), [load]);
  if (!app.mcp || !state) return null;

  async function call(init: RequestInit) {
    setBusy(true);
    try {
      const res = await fetch(address, { cache: 'no-store', ...init });
      if (!res.ok) throw new Error(t.apps.mcpFailed);
      const answer = (await res.json()) as State & { url?: string };
      // The service's own sign-in: the owner leaves for it and comes back to this page (worker/mcp-client.js, callback).
      if (answer.url) return void (window.location.href = answer.url);
      setToken('');
      await load();
    } catch (e) {
      snackbar({ text: (e as Error).message, error: true });
    }
    setBusy(false);
  }
  async function disconnect() {
    if (await ask(t.apps.mcpDisconnectAsk(state!.host), t.apps.mcpDisconnect)) await call({ method: 'DELETE' });
  }

  const ready = state.connected && !state.needsSignIn;
  return (
    <section className="mb-8">
      <GroupTitle>{t.apps.mcpConnectsTo(state.host)}</GroupTitle>
      <ul className={plainListClass}>
        <ListItem
          headline={ready ? t.apps.mcpConnected : state.needsSignIn ? t.apps.mcpNeedsSignIn : t.apps.mcpConnectsTo(state.host)}
          supporting={t.apps.mcpUses(state.tools.join(', '))}
        />
      </ul>
      <div className="px-4">
        {state.auth === 'token' && !ready && (
          <TextField
            label={t.apps.mcpToken}
            hint={t.apps.mcpTokenHint}
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        )}
        {state.auth === 'none' ? (
          <SupportingText>{t.apps.mcpConnected}</SupportingText>
        ) : ready ? (
          <Button kind="text" size="small" disabled={busy} onClick={disconnect}>
            {t.apps.mcpDisconnect}
          </Button>
        ) : (
          <Button
            kind="text"
            size="small"
            disabled={busy || (state.auth === 'token' && !token.trim())}
            onClick={() =>
              call({
                method: 'POST',
                ...(state.auth === 'token' ? { body: JSON.stringify({ token }), headers: { 'content-type': 'application/json' } } : {}),
              })
            }
          >
            {t.apps.mcpConnect}
          </Button>
        )}
      </div>
    </section>
  );
}
