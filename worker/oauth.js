// GitHub sign-in for the editor at /editor/ (packages/editor/src/github.ts). See docs/editor.md.
//   /oauth/auth      the editor goes here; we send the browser on to GitHub
//   /oauth/callback  GitHub sends the browser back here; we swap the code for a token, keep it in a
//                    cookie only the Worker can read (packages/editor/worker/session.js) and go back to /editor/
// A redirect rather than a popup, so it also works in the editor installed as an app on a phone.
// Needs the Worker secrets GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET from a GitHub App whose
// callback URL is https://<hostname>/oauth/callback (installed on this repo only; see docs/editor.md).
// Who may edit is decided by GitHub: only people with write access to the repository can save.
import { sessionCookie } from './session.js';

const STATE_COOKIE = 'cms_oauth_state';
// The editor asks for "repo"; anything outside this list is dropped.
const SCOPES = new Set(['repo', 'public_repo', 'user', 'read:user', 'user:email']);

export async function handleOAuth(request, env) {
  const url = new URL(request.url);
  if (url.pathname === '/oauth/auth') return authorize(url, env);
  if (url.pathname === '/oauth/callback') return callback(request, url, env);
  return null;
}

function authorize(url, env) {
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return finish({ error: 'GitHub-login er ikke sat op endnu (mangler GITHUB_CLIENT_ID/SECRET).' });
  }
  if ((url.searchParams.get('provider') ?? 'github') !== 'github') return finish({ error: 'Ukendt login.' });
  const scope =
    (url.searchParams.get('scope') ?? '')
      .split(/[\s,]+/)
      .filter((s) => SCOPES.has(s))
      .join(',') || 'repo';
  const state = crypto.randomUUID();
  const github = new URL('https://github.com/login/oauth/authorize');
  github.search = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${url.origin}/oauth/callback`,
    scope,
    state,
  });
  return new Response(null, {
    status: 302,
    headers: {
      location: github.href,
      'set-cookie': `${STATE_COOKIE}=${state}; Path=/oauth/; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
      'cache-control': 'no-store',
    },
  });
}

async function callback(request, url, env) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookie = request.headers.get('cookie') ?? '';
  const expected = cookie.match(new RegExp(`(?:^|;\\s*)${STATE_COOKIE}=([^;]+)`))?.[1];
  if (!code || !state || state !== expected) {
    return finish({ error: 'Login mislykkedes (ugyldig eller udløbet forespørgsel). Prøv igen.' });
  }

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', 'user-agent': 'interstellar-cms' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/oauth/callback`,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    return finish({ error: `Login mislykkedes: ${data.error_description ?? data.error ?? res.status}` });
  }
  return finish({ token: data.access_token });
}

// The page GitHub's sign-in ends on: with a token, it keeps it for the Worker (the cookie) and opens the
// editor (from this page, so the cookie, SameSite=Strict, goes with what the editor asks); with an error, it
// shows it with a way back.
function finish({ token, error }) {
  const body = error
    ? `<p>${escapeHtml(error)}</p><p><a href="/editor/">Tilbage til editoren</a></p>`
    : `<p>Logger ind…</p><script>location.replace('/editor/');</script>`;
  const html = `<!doctype html><html lang="da"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Login</title></head>
<body style="font-family: system-ui, sans-serif; padding: 2rem">${body}</body></html>`;
  const headers = new Headers({
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store',
    'set-cookie': `${STATE_COOKIE}=; Path=/oauth/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`,
  });
  if (token) headers.append('set-cookie', sessionCookie(token));
  return new Response(html, { status: error ? 400 : 200, headers });
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
