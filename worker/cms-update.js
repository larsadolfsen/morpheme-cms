// The Worker takes the CMS's new versions by itself: once a day, at night in the site's own time zone (dailyCheck, run by the hourly
// cron: NIGHT_HOUR and checkDue in lib/cms-version.mjs), it asks npm for the newest @morphemecms/cms and tries it on a branch first
// (docs/superpowers/specs/2026-11-25-safe-cms-update-design.md): the new exact version in package.json and package-lock.json (and, for the
// version that reads only the new class names, 0.19.0, the `class` attributes of every content collection and data file) is committed to the
// branch `cms-update-<version>`, cut from the site's branch, which Cloudflare builds as a preview. Each minute watchUpdate reads the build's
// result (the preview's /editor/version.json, and the check run where the token may read it). A green branch is moved onto the site's branch
// (a fast-forward, never a force; the update is written again on top of the new head when the site's branch moved meanwhile) and deleted; a
// red branch, or none that answers, is deleted and the version is tried again 24 hours later (cms:retry:<version>), and the site's branch is never touched, so
// saves keep going live. An update that still fails once it is on the site's branch is undone to the version this Worker runs (RUNNING), never
// to the version package.json had; repair() does the same for a version the Worker committed itself when builds of the branch keep failing.
// Exposes RUNNING, NoPreview, previewAddress, rememberHost, dailyCheck, checkForUpdate, startUpdate, watchUpdate, cmsStatus and handleCms (/api/cms, and GET /api/cms/note-image/<version>/<locale>/<id>,
// behind the same login check). Needs GITHUB_PUBLISH_TOKEN and the KV binding PUSH. Keeps each new version's changelog text and release
// notes (en-US, da-DK) as cms:notes:<version> and each paragraph's screenshot as cms:note-image:<version>:<locale>:<id>; cmsStatus returns
// the notes to come, with the screenshot address on each paragraph. Depends on github.js, session.js, push.js and lib/{lockfile,cms-version,changelog,releaseNotes}.mjs;
// I/O is injected (`deps`).
import { config } from '@site/config';
import { cms as cmsEn } from '../src/i18n/en-US/cms';
import { cms as cmsDa } from '../src/i18n/da-DK/cms';
import { withCiBuild } from '../lib/build-command.mjs';
import { addToLock, NeedsNpm } from '../lib/lockfile.mjs';
import { crossesClassNames, holdsMarkdown, migrateClassNamesPath, revertClassNamesPath } from '../lib/content-class-names.mjs';
import { CodeMigrationStop, MIGRATIONS_FILE, crossesCode, migrateCode, unsafeLines } from '../lib/migrate-code.mjs';
import { migrateIconNamesPath } from '../lib/migrate-icons.mjs';
import { contractHold, parseContracts } from '../lib/contractHold.mjs';
import {
  checkDue,
  compareVersions,
  managedVersion,
  nextVersion,
  PACKAGE,
  RETRY_AFTER,
  retryAt,
  siteZone,
  watchStep,
} from '../lib/cms-version.mjs';
import { withInstallDefaults } from '../lib/npmrc.mjs';
import { fileFromTar, gunzip, sectionsBetween } from '../lib/changelog.mjs';
import { imageKey, notesFromTar, parseImagePath, withImageUrls } from '../lib/releaseNotes.mjs';
import pkg from '../package.json';
import { GitHubError } from './files.js';
import { commitFiles, createBranch, deleteBranch, fastForward, readFiles, readFolder, readStoreItems } from './github.js';
import { json } from './not-found.js';
import { notifyAll } from './push.js';
import { releaseFor } from './store.js';
import { mayEdit } from './session.js';

/** The version this Worker itself runs. */
export const RUNNING = pkg.version;

const PACKAGE_JSON = 'package.json';
const LOCK = 'package-lock.json';
const WRANGLER = 'wrangler.jsonc';
const NPMRC = '.npmrc';
const NPM = 'https://registry.npmjs.org';
const NPM_NAME = '@morphemecms%2fcms';
const BUILD_APP = 'cloudflare-workers-and-pages';

// Every place the editor stores markdown: each content collection (entry bodies and front matter) and the data files (globals, block templates, rich-text props).
const CONTENT = ['src/content', 'src/data'];
// What the update of 0.19.6 rewrote, as the files were before (path → text), kept so the undo writes exactly them back (KV).
const BACKUP = 'cms:names-backup';

/** The own themes and apps could not be rewritten safely: `list` is every file and line (the update stops, nothing is committed). */
export class UnsafeCode extends Error {
  constructor(list) {
    super('unsafe-code');
    this.list = list;
  }
}

/** The update has nowhere to be tried: the Worker cannot tell the address of the branch's preview (previewAddress), so the site is left as it is. */
export class NoPreview extends Error {
  constructor() {
    super('no-preview');
  }
}

const HOST = 'cms:host';

/** Keeps the Worker's own *.workers.dev hostname (seen on a request to the editor; a branch's preview has no KV, so it never writes here), for the cron, which has no request. */
export async function rememberHost(request, env) {
  const host = new URL(request.url).hostname.toLowerCase();
  if (!env?.PUSH || !host.endsWith('.workers.dev')) return;
  if ((await env.PUSH.get(HOST)) !== host) await env.PUSH.put(HOST, host);
}

/**
 * The address of a branch's preview, where its /editor/version.json says what it was built from; null when the Worker cannot tell. The ONE place that
 * knows how the address is made (Architect, 26 Nov 2026): Cloudflare serves a branch at `<branch>-<worker name>.<account>.workers.dev`, so it is the Worker's
 * own *.workers.dev hostname (rememberHost) with the branch's name in front of its first label. The branch's name is lower-case letters, digits and hyphens
 * only (branchOf), so Cloudflare's alias rule for `/` and `.` never applies. The Worker variable PREVIEW_URL, the address with `{branch}` where the name goes,
 * overrides it (a site on its own preview address). Neither: null, and nothing is tried on a branch (NoPreview).
 * @returns {Promise<string | null>}
 */
export async function previewAddress(env, branch) {
  const template = env?.PREVIEW_URL;
  if (typeof template === 'string' && template.includes('{branch}')) return template.replace('{branch}', branch).replace(/\/$/, '');
  const host = await env?.PUSH?.get(HOST).catch(() => null);
  return typeof host === 'string' && host.endsWith('.workers.dev') ? `https://${branch}-${host}` : null;
}

const defaultDeps = {
  createBranch,
  deleteBranch,
  fastForward,
  previewAddress,
  readFiles,
  readFolder,
  readStoreItems,
  storeRelease: releaseFor,
  commitFiles,
  fetch: (...args) => fetch(...args),
  notify: notifyAll,
  mayEdit,
};

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
  const names = [PACKAGE_JSON, LOCK, WRANGLER, NPMRC];
  const { head, texts } = await deps.readFiles(env, names);
  const text = (name) => texts[names.indexOf(name)];
  return {
    head,
    texts,
    packageJson: texts[0] ? JSON.parse(texts[0]) : null,
    lock: typeof texts[1] === 'string' ? JSON.parse(texts[1]) : null,
    wrangler: text(WRANGLER),
    npmrc: text(NPMRC),
  };
}

/** The files with `version` of the package in them, as changes for one commit; for an update (`withExtras`) also the build command moved to `morpheme ci-build` and the .npmrc's install lines, when they are not there. */
async function filesFor(env, deps, site, version, withExtras = true) {
  const manifest = await getJson(deps, `${NPM}/${NPM_NAME}/${version}`);
  if (!site.lock) throw new NeedsNpm('package-lock.json is missing.');
  const out = addToLock(site.packageJson, site.lock, manifest);
  const changes = [
    { path: PACKAGE_JSON, text: written(out.packageJson, site.texts[0]) },
    { path: LOCK, text: written(out.lock, site.texts[1]) },
  ];
  if (!withExtras) return changes;
  // A site whose build command is not `npx morpheme ci-build` is moved to it with the update (once: it then needs no change).
  const wrangler = withCiBuild(site.wrangler);
  if (wrangler !== null) changes.push({ path: WRANGLER, text: wrangler });
  // A site's .npmrc gets the install lines it lacks (once; its own lines stay).
  const npmrc = withInstallDefaults(site.npmrc);
  if (npmrc !== (site.npmrc ?? null)) changes.push({ path: NPMRC, text: npmrc });
  return changes;
}

/** The site's content files (.md, .json) whose class names `change(path, text)` rewrites, as changes for the same
 * commit as the version: only the files that change. `only`: the paths to look at (the undo), else every file. Nothing for a site without the folders. */
async function contentChanges(env, deps, change, only, originals) {
  const changes = [];
  for (const folder of CONTENT) {
    const { files } = await deps.readFolder(env, folder, 5);
    for (const { path, text } of files) {
      if (!holdsMarkdown(path) || (only && !only.includes(path))) continue;
      const next = change(path, text);
      if (next !== text) {
        changes.push({ path, text: next });
        originals?.set(path, text);
      }
    }
  }
  return changes;
}

/**
 * The rewrite of 0.19.6 for a site's own themes and apps (lib/migrate-code.mjs), as changes for the update's commit: none when the marker file says it ran or the site has none of its own.
 * Throws UnsafeCode with the list when a form cannot be rewritten safely. `originals` gets each file's text from before.
 */
async function codeChanges(env, deps, from, originals) {
  const folders = [config.themes, config.apps.folder];
  const files = [];
  for (const folder of folders) files.push(...(await deps.readFolder(env, folder, 5)).files);
  const { texts } = await deps.readFiles(env, [MIGRATIONS_FILE]);
  const marker = typeof texts[0] === 'string' ? texts[0] : null;
  try {
    const changes = migrateCode({ files, marker, from, folders });
    for (const c of changes)
      originals.set(c.path, c.path === MIGRATIONS_FILE ? marker : (files.find((f) => f.path === c.path)?.text ?? null));
    return changes;
  } catch (e) {
    if (e instanceof CodeMigrationStop) {
      if (e.reason === 'already') return [];
      throw new UnsafeCode(e.list);
    }
    throw e;
  }
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

/**
 * The theme or app installed from the store that the version cannot be shown to run (see contractHold), or null. The version's contracts are
 * read from the lib/contracts.mjs in its npm tarball and the store says which contract each installed release is written to; throws when the tarball, the
 * contracts or the site's folders cannot be read, and the store being silent holds: a version is never taken on a guess.
 */
async function heldByContract(env, deps, version) {
  const manifest = await getJson(deps, `${NPM}/${NPM_NAME}/${version}`);
  const res = await deps.fetch(manifest.dist.tarball);
  if (!res.ok) throw new Error(`${res.status} tarball`);
  const next = parseContracts(fileFromTar(await gunzip(new Uint8Array(await res.arrayBuffer())), 'package/lib/contracts.mjs'));
  if (!next) throw new Error('contracts');
  const items = await deps.readStoreItems(env, { apps: config.apps.folder, themes: config.themes });
  // The store says which contract each installed release is written to; it is asked only for what came from the store.
  const answers = new Map();
  for (const { kind, id, record } of items) {
    let version;
    try {
      version = JSON.parse(record ?? '').version;
    } catch {
      continue; // not from the store (a site's own folder)
    }
    answers.set(`${kind}:${id}`, typeof version === 'string' ? await deps.storeRelease(env, id, version) : null);
  }
  return contractHold(items, answers, next);
}

const putJson = (kv, key, value) => kv.put(key, JSON.stringify(value));

/** The update's files for `version` on top of the site `site` (package.json and the lock, the content and the own code it takes with it): the changes, and what each rewritten file was. */
async function planUpdate(env, deps, site, managed, version) {
  const changes = await filesFor(env, deps, site, version);
  // The version that reads only the new class names takes the site's content with it, in the same commit (only the `class`
  // attributes; never a word of text), so the site never has a version and content that do not match.
  // The version that reads only Material 3's names (0.19.6) takes the site's own themes and apps and its stored icon names with it, in the same commit.
  const code = crossesCode(managed.version, version, compareVersions);
  const originals = new Map();
  const classes = crossesClassNames(managed.version, version, compareVersions);
  const migrated =
    classes || code
      ? await contentChanges(
          env,
          deps,
          (path, text) => {
            const next = classes ? migrateClassNamesPath(path, text) : text;
            return code ? migrateIconNamesPath(path, next) : next;
          },
          undefined,
          originals,
        )
      : [];
  const own = code ? await codeChanges(env, deps, managed.version, originals) : [];
  return { all: [...changes, ...migrated, ...own], migrated, own, originals };
}

/** What the update rewrote, as the files were before: kept for the undo (KV). */
const keepBackup = (env, originals) =>
  originals.size ? putJson(env.PUSH, BACKUP, Object.fromEntries(originals)) : env.PUSH.delete(BACKUP); // none left over from an older update

/** The branch an update to `version` is tried on. */
const branchOf = (version) =>
  `cms-update-${String(version)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}`;

/**
 * Tries `version` on a branch: writes package.json and the lock there, commits it (the site's branch is not touched) and keeps `cms:update` as 'trying'.
 * Throws NoPreview, NeedsNpm, UnsafeCode or a GitHubError.
 */
export async function startUpdate(env, version, deps = defaultDeps, now = Date.now(), restarted = false) {
  const branch = branchOf(version);
  if (!(await deps.previewAddress(env, branch))) throw new NoPreview();
  const site = await readSite(env, deps);
  const managed = managedVersion(site.packageJson, site.lock);
  if (!('version' in managed)) throw new Error('not-managed');
  const plan = await planUpdate(env, deps, site, managed, version);
  await deps.deleteBranch(env, branch).catch(() => {}); // one kept from an update that could not be merged
  await deps.createBranch(env, branch, site.head);
  let commit;
  try {
    commit = await deps.commitFiles(env, site.head, siteTexts().commitUpdate(version), plan.all, undefined, undefined, branch);
  } catch (e) {
    await deps.deleteBranch(env, branch).catch(() => {});
    throw e;
  }
  const update = {
    state: 'trying',
    branch,
    commit,
    base: site.head,
    from: managed.version,
    to: version,
    at: iso(now),
    ...(restarted ? { restarted: true } : {}),
    ...(plan.migrated.length ? { migrated: plan.migrated.map((c) => c.path) } : {}),
    ...(plan.own.length ? { code: plan.own.map((c) => c.path) } : {}),
  };
  await keepBackup(env, plan.originals);
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

/** The versions that failed on their branch, each with the time of its last try and why (cms:retry:<version>; they are tried again after RETRY_AFTER). */
async function failedVersions(kv) {
  const rows = await Promise.all((await versionsUnder(kv, 'cms:retry:')).map((v) => kv.get(`cms:retry:${v}`, 'json')));
  return rows.filter(Boolean).map((r) => ({ ...r, retryAt: retryAt(r) }));
}

/**
 * Each hour (the hourly cron, also on a site whose wrangler.jsonc is older than this): checks npm only when the day's check is
 * due (checkDue: once a day, from 03:00 in the site's time zone), else one KV read and nothing more. Staging is not slowed
 * down: its package.json asks for the tag `next`, which this never updates; it follows `next` by its own Worker, which
 * checks npm every hour and calls its deploy hook.
 */
export async function dailyCheck(env, deps = defaultDeps, now = Date.now(), zone = siteZone(config)) {
  if (!env.PUSH) return; // nothing can be kept without it; the page says so (cmsStatus: kv)
  await repair(env, deps, now).catch(() => {});
  const checked = await env.PUSH.get('cms:checked', 'json');
  // A version that failed is tried again 24 hours after its try, which is not always at the night's hour.
  const retryDue = checked?.problem?.kind === 'failed' && now >= (checked.problem.retryAt ?? 0);
  if (!retryDue && !checkDue(now, checked, zone)) return;
  return checkForUpdate(env, deps, now);
}

/** Asks npm for the newest version and takes it when it may (dailyCheck decides when). */
export async function checkForUpdate(env, deps = defaultDeps, now = Date.now()) {
  if (!env.PUSH) return;
  const kv = env.PUSH;
  const update = await kv.get('cms:update', 'json');
  if (update?.state === 'trying' || update?.state === 'waiting' || update?.state === 'undoing') return;
  const before = await kv.get('cms:checked', 'json');
  let latest = before?.latest ?? null;
  const record = (problem) =>
    putJson(kv, 'cms:checked', { at: iso(now), latest, ...(problem ? { problem } : {}), ...(before?.noChecks ? { noChecks: true } : {}) });

  if (!env.GITHUB_PUBLISH_TOKEN) return record({ kind: 'no-token' });
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
  const next = nextVersion(managed.version, latest, await failedVersions(kv), now);
  if (!next) return record();
  if (!(await kv.get(`cms:notes:${latest}`, 'json'))) await keepNotes(env, deps, managed.version, latest).catch(() => {});
  if (!next.auto) return record({ kind: next.why, retryAt: next.retryAt });
  // A version whose contracts a theme or an app from the store is not written to is not taken by itself: the site would keep
  // building, but lose that theme's or app's look. The owner presses Update (or the store has a newer version) when ready.
  try {
    const held = await heldByContract(env, deps, next.version);
    if (held)
      return record({
        kind: 'contract',
        detail: `${held.kind} ${held.id}${{ 'could-not-confirm': ': could not confirm', 'not-in-store': ': not in the store' }[held.why] ?? ''}`,
        item: held.kind,
        id: held.id,
        why: held.why,
        ...(held.has ? { has: held.has } : {}),
        needs: held.needs,
      });
  } catch {
    return record({ kind: 'unreachable' });
  }
  try {
    await startUpdate(env, next.version, deps, now);
  } catch (e) {
    if (e instanceof NoPreview) return record({ kind: 'no-preview' });
    if (e instanceof NeedsNpm) return record({ kind: 'needs-npm', detail: e.message });
    if (e instanceof UnsafeCode) return record({ kind: 'unsafe-code', detail: unsafeLines(e.list).join('\n') });
    return record(forbidden(e) ? { kind: 'cannot-write' } : { kind: 'unreachable' });
  }
  return record();
}

/** The page of a commit's checks on GitHub: where the build's own link is when the check run cannot be read. */
const checksPage = (sha) => `https://github.com/${config.repo.owner}/${config.repo.name}/commit/${sha}/checks`;

/** The newest check run of Cloudflare's build on a commit: its conclusion ('success' | 'failure') and link; null when none, or when GitHub will not say. */
async function buildOf(env, deps, sha, now) {
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
  if (run?.conclusion !== 'success' && run?.conclusion !== 'failure') return null;
  return { conclusion: run.conclusion, url: run.html_url ?? run.details_url ?? checksPage(sha) };
}

/** The result of a branch's build: 'success' when its preview says it was built from the update's commit, else the check run's. */
async function branchBuild(env, deps, update, now) {
  const address = await deps.previewAddress(env, update.branch);
  if (address) {
    const built = await getJson(deps, `${address}/editor/version.json`).catch(() => null);
    if (built?.commit === update.commit) return { conclusion: 'success', url: checksPage(update.commit) };
  }
  return (await buildOf(env, deps, update.commit, now).catch(() => null)) ?? { conclusion: null, url: checksPage(update.commit) };
}

/** `RUNNING` written into package.json and the lock, with the files the update rewrote put back, committed on the site's branch. Returns the commit's id. */
async function undoCommit(env, deps, update) {
  const site = await readSite(env, deps);
  // The version the Worker runs, which was built and deployed; never the version package.json had before (it may not build itself).
  const changes = await filesFor(env, deps, site, RUNNING, false);
  // The files the update rewrote go back with the version, as the commit's one change: the saved texts where there are some, else the class names reverted.
  const backup = (await env.PUSH.get(BACKUP, 'json')) ?? {};
  const rest = update.migrated?.filter((p) => !(p in backup));
  const content = rest?.length ? await contentChanges(env, deps, revertClassNamesPath, rest) : [];
  const restored = Object.entries(backup).map(([path, text]) => ({ path, text }));
  const done = await deps.commitFiles(env, site.head, siteTexts().commitUndo(update.to), [...changes, ...content, ...restored]);
  await env.PUSH.delete(BACKUP);
  return done;
}

/** A version that did not build: its branch deleted, the reason and the time kept (cms:retry:<version>) for the next try in 24 hours, and the page told. The site's branch is as it was. */
async function failed(env, deps, update, reason, url, now, state = 'failed', keepBranch = false) {
  const kv = env.PUSH;
  if (update.branch && !keepBranch) await deps.deleteBranch(env, update.branch).catch(() => {});
  await putJson(kv, `cms:retry:${update.to}`, { version: update.to, at: iso(now), reason, ...(url ? { buildUrl: url } : {}) });
  await kv.delete(BACKUP);
  await putJson(kv, 'cms:update', {
    ...update,
    state,
    reason,
    ...(url ? { buildUrl: url } : {}),
    at: iso(now),
    retryAt: now + RETRY_AFTER,
  });
}

/**
 * A branch that built: its commit becomes the site's head by a fast-forward, never a commit on the site's branch (the green build comes first).
 * Refused because the site's branch moved meanwhile (something was saved): the update starts over from the new head, once in a run (a new branch, a new
 * preview); a second move leaves the next scheduled check to try again. Refused for any other reason (a rule, a protection, a permission): the update ends as
 * failed with the reason 'cannot-merge' at once, the site's branch as it was and the update's branch kept.
 */
async function promote(env, deps, update, now) {
  const commit = update.commit;
  try {
    await deps.fastForward(env, update.commit);
  } catch {
    const site = await readSite(env, deps).catch(() => null);
    if (!site || site.head === update.base) return failed(env, deps, update, 'cannot-merge', null, now, 'failed', true);
    await deps.deleteBranch(env, update.branch).catch(() => {});
    if (!update.restarted) {
      try {
        await startUpdate(env, update.to, deps, now, true);
        return;
      } catch {
        // falls through: nothing is tried now
      }
    }
    await env.PUSH.delete('cms:update');
    return;
  }
  await deps.deleteBranch(env, update.branch).catch(() => {});
  await env.PUSH.delete(`cms:retry:${update.to}`);
  // The version is on the site's branch now; its own build is watched as before. `own` is what repair() may take back.
  await putJson(env.PUSH, 'cms:own', { version: update.to, commit, at: iso(now), migrated: update.migrated, code: update.code });
  await putJson(env.PUSH, 'cms:update', { ...update, state: 'waiting', commit, at: iso(now) });
}

/**
 * Builds of the site's branch keep failing and its package.json names a version this Worker committed itself (cms:own): the version this
 * Worker runs is committed back, with the content backup, so every save since then goes live. A version a person set (a pull request, a pin by hand) is
 * never touched: then package.json no longer names what the Worker wrote, and only the failed build shows.
 */
async function repair(env, deps, now) {
  const kv = env.PUSH;
  const own = await kv.get('cms:own', 'json');
  if (!own || !env.GITHUB_PUBLISH_TOKEN) return;
  if (own.version === RUNNING) return void (await kv.delete('cms:own'));
  const update = await kv.get('cms:update', 'json');
  if (update?.state === 'trying' || update?.state === 'waiting' || update?.state === 'undoing') return;
  const site = await readSite(env, deps);
  const managed = managedVersion(site.packageJson, site.lock);
  if (!('version' in managed) || managed.version !== own.version) return void (await kv.delete('cms:own'));
  const build = await buildOf(env, deps, site.head, now);
  if (build?.conclusion !== 'failure') return;
  const undo = { to: own.version, from: RUNNING, migrated: own.migrated, code: own.code };
  const commit = await undoCommit(env, deps, undo);
  await kv.delete('cms:own');
  await putJson(kv, 'cms:update', {
    ...undo,
    commit: own.commit,
    at: iso(now),
    state: 'undoing',
    undoCommit: commit,
    undoAt: iso(now),
    repaired: true,
  });
}

/** Each minute: watches the update's branch, then its build on the site's branch (or its undo's). One KV read when nothing is waiting. */
export async function watchUpdate(env, deps = defaultDeps, now = Date.now()) {
  if (!env.PUSH) return;
  const kv = env.PUSH;
  const update = await kv.get('cms:update', 'json');
  if (update?.state !== 'trying' && update?.state !== 'waiting' && update?.state !== 'undoing') return;
  if (!env.GITHUB_PUBLISH_TOKEN) return;
  let build = { conclusion: null, url: null };
  if (update.state === 'trying') build = await branchBuild(env, deps, update, now);
  else if (!(update.state === 'waiting' && update.to === RUNNING))
    build = (await buildOf(env, deps, update.state === 'waiting' ? update.commit : update.undoCommit, now).catch(() => null)) ?? build;
  const step = watchStep(update, RUNNING, build.conclusion, now);
  if (step === 'wait') return;
  if (step === 'promote') return promote(env, deps, update, now);
  if (step === 'fail') return failed(env, deps, update, build.conclusion === 'failure' ? 'build-failed' : 'no-answer', build.url, now);
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
      await kv.delete('cms:own');
      await putJson(kv, `cms:retry:${update.to}`, {
        version: update.to,
        at: iso(now),
        reason: build.conclusion === 'failure' ? 'build-failed' : 'no-answer',
        ...(build.url ? { buildUrl: build.url } : {}),
      });
      return await putJson(kv, 'cms:update', { ...update, state: 'undoing', undoCommit: commit, undoAt: iso(now) });
    } catch {
      // The undo could not be committed either.
    }
  }
  await putJson(kv, 'cms:update', { ...update, state: 'stuck', buildUrl: build.url ?? checksPage(update.undoCommit ?? update.commit) });
  return tell(env, deps, 'notifyStuck', update.to, true);
}

/**
 * What the page shows: the running version, the token, what npm said, the update, the versions that failed (`failed`: version, time of the last try, reason, the build's link, `retryAt`; `skipped` is their versions), the notes of the
 * versions still to come (`notes`). Each entry is `{ version, text, notes? }`; `notes` maps a locale to its release notes. The list stays
 * empty when the running version is a pre-release. The running version's own notes are not here: the editor reads them from the package (src/bundledNotes.ts).
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
    failed: [],
    notes: [],
  };
  const plain = /^\d+\.\d+\.\d+$/;
  if (!kv) return status;
  status.checked = await kv.get('cms:checked', 'json');
  status.update = await kv.get('cms:update', 'json');
  status.failed = await failedVersions(kv);
  status.skipped = status.failed.map((f) => f.version);
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
  await rememberHost(request, env).catch(() => {});
  if (!posting) return json(await cmsStatus(env));
  if (!env.GITHUB_PUBLISH_TOKEN || !env.PUSH) return json({ error: 'not-set-up' }, 503);
  const { version } = await request.json().catch(() => ({}));
  const checked = await env.PUSH.get('cms:checked', 'json');
  if (typeof version !== 'string' || version !== checked?.latest) return json({ error: 'version' }, 400);
  const current = await env.PUSH.get('cms:update', 'json');
  if (current?.state === 'trying' || current?.state === 'waiting' || current?.state === 'undoing') return json({ error: 'waiting' }, 409);
  try {
    return json({ update: await startUpdate(env, version, deps) });
  } catch (e) {
    if (e instanceof NoPreview) return json({ error: 'no-preview' }, 422);
    if (e instanceof NeedsNpm) return json({ error: 'needs-npm', detail: e.message }, 422);
    if (e instanceof UnsafeCode) return json({ error: 'unsafe-code', detail: unsafeLines(e.list) }, 422);
    if (forbidden(e)) return json({ error: 'cannot-write' }, 502);
    if (e?.message === 'not-managed') return json({ error: 'not-managed' }, 409);
    return json({ error: 'unreachable' }, 502);
  }
}
