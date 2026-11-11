// What the assistants' sign-in keeps (worker/mcp-oauth.js, worker/mcp.js, worker/mcp-connections.js), in D1 (the binding CONSENT):
//   mcp_clients      the assistants that registered: a name and the redirect addresses they gave
//   mcp_pending      a sign-in under way: the assistant's request, and after GitHub the person and their GitHub token (sealed), until Allow or Cancel (ten minutes)
//   mcp_codes        an authorization code, once (five minutes); only its hash
//   mcp_connections  one assistant connected by one person: who, which assistant, since when, last used
//   mcp_tokens       the access (one hour) and refresh (thirty days) tokens of a connection; only their hashes
//   mcp_rate         the calls of a connection in the current minute, for the rate limit
//   mcp_vault        the GitHub token the Worker reads the site with for a person, sealed with MCP_VAULT_KEY (lib/vault.mjs)
// No token is kept as it is given out, and the GitHub token is no use without the Worker's secret. Exposes `ready`, `store` (one
// object with a function for each thing the other files do) and the lifetimes. Depends on lib/mcpOAuth.mjs and lib/vault.mjs.
import { randomToken, sha256Hex } from '../lib/mcpOAuth.mjs';
import { open, seal } from '../lib/vault.mjs';

export const PENDING_MS = 10 * 60_000;
export const CODE_MS = 5 * 60_000;
export const ACCESS_MS = 60 * 60_000;
export const REFRESH_MS = 30 * 24 * 60 * 60_000;
// A connection's "last used" is written at most this often.
const TOUCH_MS = 60_000;

// The tables (D1 has no migrations on deploy), as in store-connection.js: each request makes them until one create has
// finished, and only then does the isolate remember it for that database. A pending create is never shared.
const made = new WeakSet();
async function tables(db) {
  if (made.has(db)) return;
  await db.batch([
    db.prepare(
      'CREATE TABLE IF NOT EXISTS mcp_clients (id TEXT PRIMARY KEY, name TEXT NOT NULL, redirect_uris TEXT NOT NULL, created TEXT NOT NULL)',
    ),
    db.prepare(
      'CREATE TABLE IF NOT EXISTS mcp_pending (id TEXT PRIMARY KEY, client_id TEXT NOT NULL, redirect_uri TEXT NOT NULL, state TEXT, challenge TEXT NOT NULL, user_id TEXT, login TEXT, token TEXT, expires INTEGER NOT NULL)',
    ),
    db.prepare(
      'CREATE TABLE IF NOT EXISTS mcp_codes (hash TEXT PRIMARY KEY, connection_id TEXT NOT NULL, client_id TEXT NOT NULL, redirect_uri TEXT NOT NULL, challenge TEXT NOT NULL, expires INTEGER NOT NULL)',
    ),
    db.prepare(
      'CREATE TABLE IF NOT EXISTS mcp_connections (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, login TEXT NOT NULL, client_id TEXT NOT NULL, client_name TEXT NOT NULL, created TEXT NOT NULL, last_used TEXT)',
    ),
    db.prepare(
      'CREATE TABLE IF NOT EXISTS mcp_tokens (hash TEXT PRIMARY KEY, kind TEXT NOT NULL, connection_id TEXT NOT NULL, expires INTEGER NOT NULL)',
    ),
    db.prepare('CREATE INDEX IF NOT EXISTS mcp_tokens_connection ON mcp_tokens (connection_id)'),
    db.prepare(
      'CREATE TABLE IF NOT EXISTS mcp_rate (connection_id TEXT NOT NULL, minute INTEGER NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (connection_id, minute))',
    ),
    db.prepare('CREATE TABLE IF NOT EXISTS mcp_vault (user_id TEXT PRIMARY KEY, sealed TEXT NOT NULL, updated TEXT NOT NULL)'),
  ]);
  made.add(db);
}

/** Whether assistants can connect: the database and the Worker secret that seals the GitHub token are there. */
export const ready = (env) => Boolean(env.CONSENT && env.MCP_VAULT_KEY);

/** The storage, for one request. @param {Record<string, any>} env @param {() => number} [now] */
export async function store(env, now = Date.now) {
  const db = env.CONSENT;
  await tables(db);
  const one = async (sql, ...args) =>
    (
      await db
        .prepare(sql)
        .bind(...args)
        .all()
    ).results[0] ?? null;
  const run = (sql, ...args) =>
    db
      .prepare(sql)
      .bind(...args)
      .run();
  const iso = () => new Date(now()).toISOString();

  return {
    async addClient(name, redirectUris) {
      const id = randomToken().slice(0, 32);
      // Registration is open to anyone, so a client that nobody connected through is forgotten after a day.
      await run(
        'DELETE FROM mcp_clients WHERE created < ? AND id NOT IN (SELECT client_id FROM mcp_connections)',
        new Date(now() - 24 * 60 * 60_000).toISOString(),
      );
      await run(
        'INSERT INTO mcp_clients (id, name, redirect_uris, created) VALUES (?, ?, ?, ?)',
        id,
        name,
        JSON.stringify(redirectUris),
        iso(),
      );
      return id;
    },
    async client(id) {
      const row = typeof id === 'string' ? await one('SELECT id, name, redirect_uris FROM mcp_clients WHERE id = ?', id) : null;
      return row && { id: row.id, name: row.name, redirectUris: JSON.parse(row.redirect_uris) };
    },

    async addPending({ clientId, redirectUri, state, challenge }) {
      const id = randomToken();
      await run('DELETE FROM mcp_pending WHERE expires < ?', now());
      await run(
        'INSERT INTO mcp_pending (id, client_id, redirect_uri, state, challenge, expires) VALUES (?, ?, ?, ?, ?, ?)',
        id,
        clientId,
        redirectUri,
        state ?? null,
        challenge,
        now() + PENDING_MS,
      );
      return id;
    },
    async pending(id) {
      const row = typeof id === 'string' ? await one('SELECT * FROM mcp_pending WHERE id = ? AND expires >= ?', id, now()) : null;
      return (
        row && {
          id: row.id,
          clientId: row.client_id,
          redirectUri: row.redirect_uri,
          state: row.state,
          challenge: row.challenge,
          userId: row.user_id,
          login: row.login,
          token: row.token ? await open(env.MCP_VAULT_KEY, row.token) : null,
        }
      );
    },
    /** The person who signed in with GitHub, on a pending sign-in; false when it is gone or already has one. */
    async signPending(id, userId, login, token) {
      const done = await run(
        'UPDATE mcp_pending SET user_id = ?, login = ?, token = ? WHERE id = ? AND user_id IS NULL AND expires >= ?',
        String(userId),
        login,
        await seal(env.MCP_VAULT_KEY, token),
        id,
        now(),
      );
      return done.meta.changes === 1;
    },
    async dropPending(id) {
      await run('DELETE FROM mcp_pending WHERE id = ?', id);
    },

    /** Keeps the person's GitHub token, sealed (one for each person: the newest). */
    async keepGitHubToken(userId, token) {
      await run(
        'INSERT OR REPLACE INTO mcp_vault (user_id, sealed, updated) VALUES (?, ?, ?)',
        String(userId),
        await seal(env.MCP_VAULT_KEY, token),
        iso(),
      );
    },
    /** The person's GitHub token, or null (none kept, or the secret is another one). */
    async gitHubToken(userId) {
      const row = await one('SELECT sealed FROM mcp_vault WHERE user_id = ?', String(userId));
      return row ? open(env.MCP_VAULT_KEY, row.sealed) : null;
    },

    /** A new connection of an assistant by a person, replacing their earlier one of the same assistant; and its code. */
    async connect({ userId, login, client, redirectUri, challenge }) {
      const stale = await db
        .prepare('SELECT id FROM mcp_connections WHERE user_id = ? AND client_id = ?')
        .bind(String(userId), client.id)
        .all();
      for (const { id } of stale.results) await this.dropConnection(id);
      const id = randomToken().slice(0, 32);
      await run(
        'INSERT INTO mcp_connections (id, user_id, login, client_id, client_name, created) VALUES (?, ?, ?, ?, ?, ?)',
        id,
        String(userId),
        login,
        client.id,
        client.name,
        iso(),
      );
      const code = randomToken();
      await run('DELETE FROM mcp_codes WHERE expires < ?', now());
      await run(
        'INSERT INTO mcp_codes (hash, connection_id, client_id, redirect_uri, challenge, expires) VALUES (?, ?, ?, ?, ?, ?)',
        await sha256Hex(code),
        id,
        client.id,
        redirectUri,
        challenge,
        now() + CODE_MS,
      );
      return { id, code };
    },
    /** The code's connection, once: the code is gone after this, whatever it was. */
    async takeCode(code) {
      if (typeof code !== 'string' || !code) return null;
      const hash = await sha256Hex(code);
      const row = await one('SELECT * FROM mcp_codes WHERE hash = ?', hash);
      if (!row) return null;
      const taken = await run('DELETE FROM mcp_codes WHERE hash = ?', hash);
      if (taken.meta.changes !== 1 || row.expires < now()) return null;
      return { connectionId: row.connection_id, clientId: row.client_id, redirectUri: row.redirect_uri, challenge: row.challenge };
    },

    /** A new pair of tokens for a connection; the old refresh token (given) is gone. */
    async issue(connectionId, replacing) {
      if (replacing) await run('DELETE FROM mcp_tokens WHERE hash = ?', await sha256Hex(replacing));
      await run('DELETE FROM mcp_tokens WHERE expires < ?', now());
      const access = randomToken();
      const refresh = randomToken();
      await run(
        'INSERT INTO mcp_tokens (hash, kind, connection_id, expires) VALUES (?, ?, ?, ?)',
        await sha256Hex(access),
        'access',
        connectionId,
        now() + ACCESS_MS,
      );
      await run(
        'INSERT INTO mcp_tokens (hash, kind, connection_id, expires) VALUES (?, ?, ?, ?)',
        await sha256Hex(refresh),
        'refresh',
        connectionId,
        now() + REFRESH_MS,
      );
      return { access, refresh, expiresIn: ACCESS_MS / 1000 };
    },
    /** The connection a token of that kind belongs to, or null. */
    async byToken(kind, token) {
      if (typeof token !== 'string' || !token) return null;
      const row = await one(
        `SELECT c.id, c.user_id, c.login, c.client_id, c.client_name, c.last_used
           FROM mcp_tokens t JOIN mcp_connections c ON c.id = t.connection_id
          WHERE t.hash = ? AND t.kind = ? AND t.expires >= ?`,
        await sha256Hex(token),
        kind,
        now(),
      );
      return (
        row && {
          id: row.id,
          userId: row.user_id,
          login: row.login,
          clientId: row.client_id,
          clientName: row.client_name,
          lastUsed: row.last_used,
        }
      );
    },
    /** Counts a call of a connection in this minute: `{ ok, retryAfter }`, `retryAfter` in seconds when it is over `limit`. */
    async hit(connectionId, limit) {
      const minute = Math.floor(now() / 60_000);
      await run('DELETE FROM mcp_rate WHERE minute < ?', minute - 5);
      await run(
        'INSERT INTO mcp_rate (connection_id, minute, n) VALUES (?, ?, 1) ON CONFLICT (connection_id, minute) DO UPDATE SET n = n + 1',
        connectionId,
        minute,
      );
      const { n } = await one('SELECT n FROM mcp_rate WHERE connection_id = ? AND minute = ?', connectionId, minute);
      return n <= limit ? { ok: true } : { ok: false, retryAfter: Math.max(1, (minute + 1) * 60 - Math.floor(now() / 1000)) };
    },
    /** Notes that a connection was used, at most once a minute. */
    async touch(connection) {
      if (connection.lastUsed && now() - Date.parse(connection.lastUsed) < TOUCH_MS) return;
      await run('UPDATE mcp_connections SET last_used = ? WHERE id = ?', iso(), connection.id);
    },

    async connections() {
      const { results } = await db
        .prepare('SELECT id, login, client_name, created, last_used FROM mcp_connections ORDER BY created DESC')
        .all();
      return results.map((r) => ({ id: r.id, login: r.login, name: r.client_name, created: r.created, lastUsed: r.last_used ?? null }));
    },
    /** Deletes a connection and its tokens; the person's GitHub token too when it was their last connection (then it is
     * returned, so the caller can have GitHub forget it); else null. */
    async dropConnection(id) {
      const row = await one('SELECT user_id FROM mcp_connections WHERE id = ?', id);
      if (!row) return null;
      await run('DELETE FROM mcp_tokens WHERE connection_id = ?', id);
      await run('DELETE FROM mcp_codes WHERE connection_id = ?', id);
      await run('DELETE FROM mcp_rate WHERE connection_id = ?', id);
      await run('DELETE FROM mcp_connections WHERE id = ?', id);
      const others = await one('SELECT COUNT(*) AS n FROM mcp_connections WHERE user_id = ?', row.user_id);
      if (others.n > 0) return null;
      const token = await this.gitHubToken(row.user_id);
      await run('DELETE FROM mcp_vault WHERE user_id = ?', row.user_id);
      return token;
    },
  };
}
