// The editor's GitHub sign-in, kept by the Worker: the token is in a cookie only the Worker can read (HttpOnly, on the
// editor's own address, sent only with what the editor asks the Worker, /api/), never in the browser's storage, so no
// script can take it away. Set by the sign-in (packages/editor/worker/oauth.js), cleared by "Log ud" (/api/github/logout,
// packages/editor/worker/editor-github.js) and on the old address (packages/editor/worker/editor-host.js). See docs/editor.md.
import { config } from '@site/config';

const COOKIE = 'editor_session';
// Until "Log ud": as long as a browser keeps a cookie (400 days).
const KEEP = 400 * 24 * 60 * 60;

/** The header that keeps the token in the browser. */
export const sessionCookie = (token) => `${COOKIE}=${token}; Path=/api/; Max-Age=${KEEP}; HttpOnly; Secure; SameSite=Strict`;

/** The header that removes it. */
export const noSession = () => `${COOKIE}=; Path=/api/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;

/** The token of the request's sign-in, or null. Only a request from the editor's own page counts: SameSite=Strict
 * still sends the cookie from a page on another address of the same domain (example.dk to editor.…). */
export function sessionToken(request) {
  const url = new URL(request.url);
  const site = request.headers.get('sec-fetch-site');
  const origin = request.headers.get('origin');
  if (site ? site !== 'same-origin' : origin && origin !== url.origin) return null;
  return request.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))?.[1] ?? null;
}

// What GitHub said each token may do in the repository (by a hash of the token), for ten minutes, so not every request
// asks.
const known = new Map();
const keyOf = async (token) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))].join('.');

/** What the request's sign-in may do in the site's repository: read it and save to it (`push`), as GitHub says; null
 * without a sign-in or when GitHub no longer knows it. `ask`: fetch for GitHub (packages/editor/worker/files.js counts its requests). */
export async function access(request, ask = fetch) {
  const token = sessionToken(request);
  if (!token) return null;
  const id = await keyOf(token);
  const was = known.get(id);
  if (was && was.until > Date.now()) return { token, read: was.read, push: was.push };
  const res = await ask(`https://api.github.com/repos/${config.repo.owner}/${config.repo.name}`, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'user-agent': `${config.repo.name}-worker` },
  });
  // 401: the token is no good (signed out); otherwise GitHub does not show the repository to it (404), or failed.
  if (res.status === 401) return null;
  if (!res.ok) return { token, read: false, push: false };
  const { permissions = {} } = await res.json().catch(() => ({}));
  const may = { read: permissions.pull === true, push: permissions.push === true };
  known.set(id, { ...may, until: Date.now() + 10 * 60_000 });
  return { token, ...may };
}

/** Whether the request comes from someone who can save the site (also an app's own addresses, /api/<app>/, given to it by packages/editor/worker/index.js). */
export const mayEdit = async (request) => (await access(request))?.push === true;

/** Forgets what GitHub said about a token (it was revoked at "Log ud"). */
export async function forget(token) {
  known.delete(await keyOf(token));
}
