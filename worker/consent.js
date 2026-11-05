// The visitors' answers in the cookie banner, so the site can show that a visitor said yes (GDPR article 7(1)): the
// consent log, "Samtykker" under "Privatliv" in the editor (packages/editor/src/consentData.ts, Consents.tsx).
// Kept in Cloudflare D1 (the binding CONSENT in wrangler.jsonc), never in the repository: one row per answer, with the
// random consent id the visitor's browser keeps (consentId in src/scripts/tracking.ts, shown in the banner under
// "Cookieindstillinger"), when, the yes or no to each category the banner asked about, and the banner it was given in
// (the commit the site was built from, /editor/version.json). No IP address, no user agent: nothing more about the
// visitor than the answer. An answer older than two years is deleted (forgetOldConsents, each hour); the banner asks
// again after one. Without the binding (a preview of a branch) nothing is kept and the editor says so.
//   POST   /api/consent                     a visitor's answer, from the site's own pages: { id, choices }
//   GET    /api/consent?q=<id>              the answers, newest first (at most LIMIT), those of a consent id starting with q
//   GET    /api/consent?format=csv          all of them, as a file to save
//   DELETE /api/consent                     { id } deletes the answers of a consent id (a visitor asked for it)
// Only someone who can save the site (write access to the repository on GitHub) can read or delete them.
import { isConsentCategory } from '../lib/cookieCategories.mjs';
import { json } from './not-found.js';
import { mayEdit } from './session.js';

/** How long an answer is kept: two years, the banner asks again after one. */
export const KEEP_DAYS = 730;
const LIMIT = 500;
// A consent id: crypto.randomUUID() in the visitor's browser.
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// The table (D1 has no migrations on deploy). Each request makes it until one create has finished; only then does the
// isolate remember it. A pending create is never shared: its I/O belongs to the request that started it, and if that
// request is cancelled the promise never settles and every later request would wait for it.
let ready = false;
async function table(db) {
  if (ready) return;
  await db.batch([
    db.prepare(
      'CREATE TABLE IF NOT EXISTS consents (row INTEGER PRIMARY KEY, id TEXT NOT NULL, at TEXT NOT NULL, choices TEXT NOT NULL, version TEXT NOT NULL)',
    ),
    db.prepare('CREATE INDEX IF NOT EXISTS consents_id ON consents (id)'),
    db.prepare('CREATE INDEX IF NOT EXISTS consents_at ON consents (at)'),
  ]);
  ready = true;
}

// The commit the site was built from (the banner the visitor answered), as the deployed build says it.
let version;
async function versionOf(env, url) {
  if (version) return version;
  try {
    const res = await env.ASSETS.fetch(new URL('/editor/version.json', url.origin));
    version = String((await res.json()).commit ?? '');
  } catch {
    return '';
  }
  return version;
}

/** The answer as the banner sends it, or null: a consent id and a yes or no to each category asked about. */
function answerOf(body) {
  if (!body || typeof body !== 'object' || typeof body.id !== 'string' || !ID.test(body.id)) return null;
  const entries = Object.entries(body.choices ?? {});
  if (!entries.length || !entries.every(([category, yes]) => isConsentCategory(category) && typeof yes === 'boolean')) return null;
  return { id: body.id, choices: Object.fromEntries(entries) };
}

// Only the site's own pages send an answer (not another site, not a robot posting from nowhere).
const fromSite = (request, url) => request.headers.get('origin') === url.origin;

export async function handleConsent(request, env) {
  const url = new URL(request.url);
  if (request.method === 'POST') {
    if (!fromSite(request, url)) return json({ error: 'forbidden' }, 403);
    const text = await request.text();
    const answer = text.length <= 2000 ? answerOf(safeJson(text)) : null;
    if (!answer) return json({ error: 'invalid' }, 400);
    if (!env.CONSENT) return new Response(null, { status: 204 });
    await table(env.CONSENT);
    await env.CONSENT.prepare('INSERT INTO consents (id, at, choices, version) VALUES (?, ?, ?, ?)')
      .bind(answer.id, new Date().toISOString(), JSON.stringify(answer.choices), await versionOf(env, url))
      .run();
    return new Response(null, { status: 204 });
  }
  if (!(await mayEdit(request))) return json({ error: 'forbidden' }, 403);
  if (!env.CONSENT) return json({ error: 'unavailable' }, 503);
  await table(env.CONSENT);
  if (request.method === 'GET' && url.searchParams.get('format') === 'csv') return csv(await rows(env.CONSENT, '', 0));
  if (request.method === 'GET') {
    const q = (url.searchParams.get('q') ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^0-9a-f-]/g, '');
    const total = await env.CONSENT.prepare('SELECT COUNT(*) AS n FROM consents').first('n');
    return json({ entries: await rows(env.CONSENT, q, LIMIT), total });
  }
  if (request.method === 'DELETE') {
    const id = safeJson(await request.text())?.id;
    if (typeof id !== 'string' || !ID.test(id)) return json({ error: 'invalid' }, 400);
    const { meta } = await env.CONSENT.prepare('DELETE FROM consents WHERE id = ?').bind(id).run();
    return json({ deleted: meta.changes });
  }
  return json({ error: 'method' }, 405);
}

/** Deletes the answers older than KEEP_DAYS (scheduled in packages/editor/worker/index.js). Never fails the cron. */
export async function forgetOldConsents(env) {
  if (!env.CONSENT) return;
  try {
    await table(env.CONSENT);
    const before = new Date(Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await env.CONSENT.prepare('DELETE FROM consents WHERE at < ?').bind(before).run();
  } catch {}
}

// The answers, newest first: those of a consent id starting with `q`, at most `limit` (0: all).
async function rows(db, q, limit) {
  const where = q ? 'WHERE id LIKE ?' : '';
  const sql = `SELECT id, at, choices, version FROM consents ${where} ORDER BY at DESC${limit ? ` LIMIT ${limit}` : ''}`;
  const statement = q ? db.prepare(sql).bind(`${q}%`) : db.prepare(sql);
  const { results } = await statement.all();
  return results.map((r) => ({ id: r.id, at: r.at, choices: safeJson(r.choices) ?? {}, version: r.version }));
}

// All the answers as CSV: one column per category any answer has, true or false, empty when it was not asked.
function csv(entries) {
  const categories = [...new Set(entries.flatMap((e) => Object.keys(e.choices)))];
  const cell = (value) => `"${String(value).replace(/"/g, '""')}"`;
  const lines = [
    ['id', 'at', ...categories, 'version'].map(cell).join(','),
    ...entries.map((e) => [e.id, e.at, ...categories.map((c) => (c in e.choices ? e.choices[c] : '')), e.version].map(cell).join(',')),
  ];
  return new Response(`${lines.join('\r\n')}\r\n`, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="samtykker-${new Date().toISOString().slice(0, 10)}.csv"`,
      'cache-control': 'no-store',
    },
  });
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
