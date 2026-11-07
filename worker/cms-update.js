// The Worker takes the CMS's new versions by itself: each hour it asks npm for the newest @morphemecms/cms, commits the new exact
// version in package.json and package-lock.json, and each minute watches the commit's check run, undoing a version that did not build.
// Exposes RUNNING, checkForUpdate, startUpdate, watchUpdate, cmsStatus and handleCms (/api/cms, and GET /api/cms/note-image/<version>/<locale>/<id>,
// behind the same login check). Needs GITHUB_PUBLISH_TOKEN and the KV binding PUSH. Keeps each new version's changelog text and release
// notes (en-US, da-DK) as cms:notes:<version> and each card screenshot as cms:note-image:<version>:<locale>:<id>; cmsStatus returns
// the notes to come and the installed ones, with the screenshot address on each card. Depends on github.js, session.js, push.js and lib/{lockfile,cms-version,changelog,releaseNotes}.mjs;
// I/O is injected (`deps`).
import { config } from '@site/config';
import { cms as cmsEn } from '../src/i18n/en-US/cms';
import { cms as cmsDa } from '../src/i18n/da-DK/cms';
import { addToLock, NeedsNpm } from '../lib/lockfile.mjs';
import { compareVersions, managedVersion, nextVersion, PACKAGE, watchStep } from '../lib/cms-version.mjs';
import { fileFromTar, gunzip, sectionsBetween } from '../lib/changelog.mjs';
import { imageKey, installedVersions, notesFromTar, parseImagePath, withImageUrls } from '../lib/releaseNotes.mjs';
import pkg from '../package.json';
import { GitHubError } from './files.js';
import { commitFiles, readFiles } from './github.js';
import { json } from './not-found.js';
import { notifyAll } from './push.js';
import { mayEdit } from './session.js';

/** The version this Worker itself runs. */
export const RUNNING = pkg.version;

const PACKAGE_JSON = 'package.json';
const LOCK = 'package-lock.json';
const NPM = 'https://registry.npmjs.org';
const NPM_NAME = '@morphemecms%2fcms';
const BUILD_APP = 'cloudflare-workers-and-pages';

const defaultDeps = { readFiles, commitFiles, fetch: (...args) => fetch(...args), notify: notifyAll, mayEdit };

/** The site's language for the commits: its own, else the same language, else Danish. */
const siteTexts = () => {
  const code = String(config.locale ?? '');
  return code === 'en-US' || (code !== 'da-DK' && code.startsWith('en')) ? cmsEn : cmsDa;
};

const iso = (now) => new Date(now).toISOString();

/** Whether GitHub says the token may not write (GraphQL answers a read-only token with HTTP 200 and an error). */
const forbidden = (e) => e instanceof GitHubError && (e.status === 403 || /not accessible|forbidden/i.test(e.message));

async function getJson(deps, url, init) {
  const res = await deps.fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

/** `JSON.stringify(x, null, 2)` with the file's own line ending at its end, as npm writes. */
const written = (value, original) => JSON.stringify(value, null, 2) + (original?.includes('\r\n') ? '\r\n' : '\n');

/** The files' texts parsed, and the branch's head. */
async function readSite(env, deps) {
  const { head, texts } = await deps.readFiles(env, [PACKAGE_JSON, LOCK]);
  return {
    head,
    texts,
    packageJson: texts[0] ? JSON.parse(texts[0]) : null,
    lock: typeof texts[1] === 'string' ? JSON.parse(texts[1]) : null,
  };
}

/** The files with `version` of the package in them, as changes for one commit. */
async function filesFor(env, deps, site, version) {
  const manifest = await getJson(deps, `${NPM}/${NPM_NAME}/${version}`);
  if (!site.lock) throw new NeedsNpm('package-lock.json mangler.');
  const out = addToLock(site.packageJson, site.lock, manifest);
  return [
    { path: PACKAGE_JSON, text: written(out.packageJson, site.texts[0]) },
    { path: LOCK, text: written(out.lock, site.texts[1]) },
  ];
}

/** Sends the notification in both languages; its text is the English sentence. */
async function tell(env, deps, key, version, error) {
  const text = cmsEn[key](version);
  await deps.notify(
    env,
    { type: 'updates', id: 'cms', text, error },
    { 'en-US': { [text]: text }, 'da-DK': { [text]: cmsDa[key](version) } },
  );
}

const putJson = (kv, key, value) => kv.put(key, JSON.stringify(value));

/** Writes package.json and the lock for `version`, commits it and keeps `cms:update`. Throws NeedsNpm or a GitHubError. */
export async function startUpdate(env, version, deps = defaultDeps, now = Date.now()) {
  const site = await readSite(env, deps);
  const managed = managedVersion(site.packageJson, site.lock);
  if (!('version' in managed)) throw new Error('not-managed');
  const changes = await filesFor(env, deps, site, version);
  const commit = await deps.commitFiles(env, site.head, siteTexts().commitUpdate(version), changes);
  const update = { commit, from: managed.version, to: version, at: iso(now), state: 'waiting' };
  await putJson(env.PUSH, 'cms:update', update);
  return update;
}

/** The sections of the changelog from `current` to `latest`, each kept as cms:notes:<version> with its release notes per locale, when the tar has them. */
async function keepNotes(env, deps, current, latest) {
  const manifest = await getJson(deps, `${NPM}/${NPM_NAME}/${latest}`);
  const res = await deps.fetch(manifest.dist.tarball);
  if (!res.ok) return;
  const tar = await gunzip(new Uint8Array(await res.arrayBuffer()));
  const changelog = fileFromTar(tar, 'package/CHANGELOG.md');
  if (!changelog) return;
  for (const { version, text } of sectionsBetween(changelog, current, latest)) {
    const kept = notesFromTar(tar, version);
    const notes = kept?.notes;
    for (const { locale, id, bytes } of kept?.images ?? []) await env.PUSH.put(imageKey(version, locale, id), bytes);
    await putJson(env.PUSH, `cms:notes:${version}`, { version, text, ...(notes ? { notes } : {}) });
  }
}

const versionsUnder = async (kv, prefix) => (await kv.list({ prefix })).keys.map((k) => k.name.slice(prefix.length));

/** Each hour: asks npm for the newest version and takes it when it may. */
export async function checkForUpdate(env, deps = defaultDeps, now = Date.now()) {
  if (!env.GITHUB_PUBLISH_TOKEN || !env.PUSH) return;
  const kv = env.PUSH;
  const update = await kv.get('cms:update', 'json');
  if (update?.state === 'waiting' || update?.state === 'undoing') return;
  const before = await kv.get('cms:checked', 'json');
  let latest = before?.latest ?? null;
  const record = (problem) =>
    putJson(kv, 'cms:checked', { at: iso(now), latest, ...(problem ? { problem } : {}), ...(before?.noChecks ? { noChecks: true } : {}) });

  let site;
  try {
    site = await readSite(env, deps);
  } catch {
    return record({ kind: 'unreachable' });
  }
  const managed = managedVersion(site.packageJson, site.lock);
  if (!('version' in managed)) return record({ kind: 'not-managed', detail: managed.reason });
  try {
    latest = (await getJson(deps, `${NPM}/-/package/${NPM_NAME}/dist-tags`)).latest;
  } catch {
    return record({ kind: 'unreachable' });
  }
  const next = nextVersion(managed.version, latest, await versionsUnder(kv, 'cms:skip:'));
  if (!next) return record();
  if (!(await kv.get(`cms:notes:${latest}`, 'json'))) await keepNotes(env, deps, managed.version, latest).catch(() => {});
  if (!next.auto) return record({ kind: next.why });
  try {
    await startUpdate(env, next.version, deps, now);
  } catch (e) {
    if (e instanceof NeedsNpm) return record({ kind: 'needs-npm', detail: e.message });
    return record(forbidden(e) ? { kind: 'cannot-write' } : { kind: 'unreachable' });
  }
  return record();
}

/** The conclusion of the newest check run of Cloudflare's build on a commit; null when none, or when GitHub will not say. */
async function checkOf(env, deps, sha, now) {
  const { owner, name } = config.repo;
  const res = await deps.fetch(`https://api.github.com/repos/${owner}/${name}/commits/${sha}/check-runs`, {
    headers: { authorization: `Bearer ${env.GITHUB_PUBLISH_TOKEN}`, accept: 'application/vnd.github+json', 'user-agent': `${name}-worker` },
  });
  if (res.status === 403) {
    const checked = await env.PUSH.get('cms:checked', 'json');
    if (!checked?.noChecks) await putJson(env.PUSH, 'cms:checked', { at: iso(now), latest: null, ...checked, noChecks: true });
    return null;
  }
  if (!res.ok) return null;
  const { check_runs: runs = [] } = await res.json().catch(() => ({}));
  const run = runs
    .filter((r) => r.app?.slug === BUILD_APP)
    .sort((a, b) => Date.parse(b.started_at ?? '') - Date.parse(a.started_at ?? ''))[0];
  return run?.conclusion === 'success' || run?.conclusion === 'failure' ? run.conclusion : null;
}

/** The update written back to the version it came from, committed. Returns the commit's id. */
async function undoCommit(env, deps, update) {
  const site = await readSite(env, deps);
  const changes = await filesFor(env, deps, site, update.from);
  return deps.commitFiles(env, site.head, siteTexts().commitUndo(update.to), changes);
}

/** Each minute: watches the update's (or its undo's) check run. One KV read when nothing is waiting. */
export async function watchUpdate(env, deps = defaultDeps, now = Date.now()) {
  if (!env.PUSH) return;
  const kv = env.PUSH;
  const update = await kv.get('cms:update', 'json');
  if (update?.state !== 'waiting' && update?.state !== 'undoing') return;
  if (!env.GITHUB_PUBLISH_TOKEN) return;
  const sha = update.state === 'waiting' ? update.commit : update.undoCommit;
  const check = update.state === 'waiting' && update.to === RUNNING ? null : await checkOf(env, deps, sha, now).catch(() => null);
  const step = watchStep(update, RUNNING, check, now);
  if (step === 'wait') return;
  if (step === 'done') {
    await putJson(kv, 'cms:update', { ...update, state: 'done' });
    return tell(env, deps, 'notifyDone', update.to);
  }
  if (step === 'undone') {
    await putJson(kv, 'cms:update', { ...update, state: 'undone' });
    return tell(env, deps, 'notifyUndone', update.to, true);
  }
  if (step === 'undo') {
    try {
      const commit = await undoCommit(env, deps, update);
      await putJson(kv, `cms:skip:${update.to}`, { version: update.to, commit: update.commit, at: iso(now) });
      return await putJson(kv, 'cms:update', { ...update, state: 'undoing', undoCommit: commit, undoAt: iso(now) });
    } catch {
      // The undo could not be committed either.
    }
  }
  await putJson(kv, 'cms:update', { ...update, state: 'stuck' });
  return tell(env, deps, 'notifyStuck', update.to, true);
}

/**
 * What the page shows: the running version, the token, what npm said, the update, the skipped versions, the notes of the
 * versions still to come (`notes`) and those of the versions installed (`installed`, see installedVersions). Each entry is
 * `{ version, text, notes? }`; `notes` maps a locale to its release notes. Both lists stay empty when the running version is a pre-release.
 */
export async function cmsStatus(env, running = RUNNING) {
  const kv = env.PUSH;
  const status = {
    running,
    token: !!env.GITHUB_PUBLISH_TOKEN,
    kv: !!kv,
    checked: null,
    update: null,
    skipped: [],
    notes: [],
    installed: [],
  };
  const plain = /^\d+\.\d+\.\d+$/;
  if (!kv) return status;
  status.checked = await kv.get('cms:checked', 'json');
  status.update = await kv.get('cms:update', 'json');
  status.skipped = await versionsUnder(kv, 'cms:skip:');
  if (!plain.test(running)) return status;
  const kept = await versionsUnder(kv, 'cms:notes:');
  const entries = (rows) =>
    rows.filter(Boolean).map(({ version, text, notes }) => ({ version, text, notes: withImageUrls(version, notes) }));
  const wanted = kept.filter(
    (v) =>
      plain.test(v) && compareVersions(v, running) === 1 && (!status.checked?.latest || compareVersions(v, status.checked.latest) <= 0),
  );
  wanted.sort((a, b) => compareVersions(b, a));
  status.notes = entries(await Promise.all(wanted.map((v) => kv.get(`cms:notes:${v}`, 'json'))));
  const installed = installedVersions(status.update, running, kept);
  status.installed = entries(await Promise.all(installed.map((v) => kv.get(`cms:notes:${v}`, 'json'))));
  return status;
}

/** `GET /api/cms/note-image/<version>/<locale>/<id>`: a kept screenshot, 404 for a bad address or a missing one. */
async function noteImage(request, env, deps) {
  if (request.method !== 'GET') return json({ error: 'method' }, 405);
  if (!(await deps.mayEdit(request))) return json({ error: 'forbidden' }, 403);
  const parts = parseImagePath(new URL(request.url).pathname);
  const bytes = parts && env.PUSH ? await env.PUSH.get(imageKey(parts.version, parts.locale, parts.id), 'arrayBuffer') : null;
  if (!bytes) return json({ error: 'not-found' }, 404);
  return new Response(bytes, { headers: { 'content-type': 'image/webp', 'cache-control': 'private, max-age=31536000, immutable' } });
}

/** `GET /api/cms` (the status), `POST /api/cms/update { version }` and `GET /api/cms/note-image/...`; null for other addresses. */
export async function handleCms(request, env, ctx, deps = defaultDeps) {
  if (new URL(request.url).pathname.startsWith('/api/cms/note-image/')) return noteImage(request, env, deps);
  const match = /^\/api\/cms(\/update)?\/?$/.exec(new URL(request.url).pathname);
  if (!match) return null;
  const posting = !!match[1];
  if (request.method !== (posting ? 'POST' : 'GET')) return json({ error: 'method' }, 405);
  if (!(await deps.mayEdit(request))) return json({ error: 'forbidden' }, 403);
  if (!posting) return json(await cmsStatus(env));
  if (!env.GITHUB_PUBLISH_TOKEN || !env.PUSH) return json({ error: 'not-set-up' }, 503);
  const { version } = await request.json().catch(() => ({}));
  const checked = await env.PUSH.get('cms:checked', 'json');
  if (typeof version !== 'string' || version !== checked?.latest) return json({ error: 'version' }, 400);
  const current = await env.PUSH.get('cms:update', 'json');
  if (current?.state === 'waiting' || current?.state === 'undoing') return json({ error: 'waiting' }, 409);
  await env.PUSH.delete(`cms:skip:${version}`);
  try {
    return json({ update: await startUpdate(env, version, deps) });
  } catch (e) {
    if (e instanceof NeedsNpm) return json({ error: 'needs-npm', detail: e.message }, 422);
    if (forbidden(e)) return json({ error: 'cannot-write' }, 502);
    if (e?.message === 'not-managed') return json({ error: 'not-managed' }, 409);
    return json({ error: 'unreachable' }, 502);
  }
}
