// Autosaved drafts in R2, for the editor's `Faster editor` (the binding FILES, packages/editor/worker/files.js): the editor sends the text
// of the version it is editing a little after each change, the Worker keeps it here, and it goes to git as the waiting version
// (src/drafts/, lib/versions.mjs `saveDraft`) when the person leaves the page or after a long idle. Without the binding (`Faster editor` off,
// or a preview of a branch) nothing is kept: every answer is 409 `off`, and the editor says `Not saved` until `Save`. Only someone who can save
// the site (write access to the repository on GitHub) can use it. The key: `<owner>/<repo>/autosave/<page file>/<version id>` (lib/autosave.mjs),
// the value `{ text, savedAt }` as JSON, at most 1 MiB. The id is a version id as in lib/versions.mjs (default `waiting`).
//   GET    /api/autosave?path=<page file>[&id=<id>]   { text, savedAt }, or 404
//   GET    /api/autosave                              { drafts: [{ path, id, savedAt, size }] }, all of the site's autosaves
//   PUT    /api/autosave  { path, id?, text, create?, to? }  keeps the text (413 above the limit); { savedAt }
//   DELETE /api/autosave?path=<page file>[&id=<id>]   throws it away
//   POST   /api/autosave/flush  { path, id?, text? }  saves the autosave (or `text`, when the page is being left and the last text has not
//                                                     been sent) to git as the waiting version, in the person's own name, and deletes the autosave:
//                                                     { committed: true|false } (false: git had the same text); 409 `moved` when the branch
//                                                     moved meanwhile (ask again), 404 `page` when the page file is gone (the autosave goes too).
//                                                     { path } is the page file that was written (it can differ from `to`, see below).
// A page that is a draft (`status: draft`, no waiting version) has no live version to protect: its flush writes the page file itself, always
// with `status: draft` (only `Publish` makes a page live). A NEW page or post is autosaved before it has a file: `create: true` and `to`, the
// page file it is to be made as, with `path` a placeholder that never exists; the flush makes the draft page file at `to` (the first free of
// `to`, `to-2` … when taken). A draft that was made that way can be renamed after the H1: `to` on its own flush moves the file (a draft that
// was never published needs no redirect), when `to` is free and nothing waits for it.
// Each hour (publish's cron) `sweepAutosaves` moves what has been idle for a day to git with the Worker's own token, and deletes what is
// 30 days old and could not be moved. R2 only holds finished values here: no I/O promise is kept in module memory (scripts/pending-shared.test.mjs).
import { config } from '@site/config';
import { autosaveKey, byteLength, isPagePath, MAX_BYTES, parseKey, PREFIX, sweepAction } from '../lib/autosave.mjs';
import { candidatePaths } from '../lib/entryNames.mjs';
import { draftPage, draftPath, isDraftPage, isVersionId, published, saveDraft, WAITING } from '../lib/versions.mjs';
import { commitFiles, readFiles } from './github.js';
import { json } from './not-found.js';
import { say } from './say.js';
import { access } from './session.js';

const SITE = `${config.repo.owner}/${config.repo.name}`;
const decoder = new TextDecoder();

export async function handleAutosave(request, env, ctx) {
  const may = await access(request);
  if (!may) return json({ error: 'signed out' }, 401);
  if (!may.push) return json({ error: 'forbidden' }, 403);
  if (!env.FILES) return json({ error: 'off' }, 409);
  const url = new URL(request.url);
  const flush = url.pathname.replace(/\/$/, '') === '/api/autosave/flush';
  try {
    if (flush) return request.method === 'POST' ? await flushAnswer(request, env, ctx, may.token) : json({ error: 'method' }, 405);
    if (request.method === 'GET') return url.searchParams.has('path') ? await getAnswer(url, env) : await listAnswer(env);
    if (request.method === 'PUT') return await putAnswer(request, env);
    if (request.method === 'DELETE') return await deleteAnswer(url, env);
    return json({ error: 'method' }, 405);
  } catch (e) {
    console.error(`Autosave failed: ${e.message}`);
    return json({ error: 'failed' }, 502);
  }
}

const idOf = (value) => (value === undefined || value === null || value === '' ? WAITING : value);
const keyOf = (path, id) => (isPagePath(path) && isVersionId(id) ? autosaveKey(SITE, path, id) : null);

/** `create` and `to` of a request or a stored value: a boolean and a page file's path, or nothing. */
function makeOf(value) {
  const create = value?.create === true;
  const to = typeof value?.to === 'string' && isPagePath(value.to) ? value.to : '';
  return { ...(create ? { create } : {}), ...(to ? { to } : {}) };
}

async function readValue(env, key) {
  const object = await env.FILES.get(key);
  if (!object) return null;
  try {
    const value = JSON.parse(decoder.decode(await object.arrayBuffer()));
    return typeof value?.text === 'string' && typeof value.savedAt === 'number' ? { ...value, ...makeOf(value) } : null;
  } catch {
    return null;
  }
}

async function getAnswer(url, env) {
  const key = keyOf(url.searchParams.get('path'), idOf(url.searchParams.get('id')));
  if (!key) return json({ error: 'path' }, 400);
  const value = await readValue(env, key);
  return value ? json(value) : json({ error: 'not found' }, 404);
}

async function listAnswer(env) {
  const drafts = [];
  let cursor;
  do {
    const page = await env.FILES.list({ prefix: `${SITE}/${PREFIX}/`, cursor });
    for (const object of page.objects) {
      const at = parseKey(SITE, object.key);
      if (at) drafts.push({ ...at, savedAt: object.uploaded?.getTime?.() ?? 0, size: object.size ?? 0 });
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return json({ drafts });
}

async function putAnswer(request, env) {
  // The body is at most the text plus a little for the rest.
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BYTES * 2) return json({ error: 'too big' }, 413);
  const body = await request.json().catch(() => ({}));
  const id = idOf(body.id);
  const key = keyOf(body.path, id);
  if (!key || typeof body.text !== 'string') return json({ error: 'body' }, 400);
  if (byteLength(body.text) > MAX_BYTES) return json({ error: 'too big' }, 413);
  const savedAt = Date.now();
  await env.FILES.put(key, JSON.stringify({ text: body.text, savedAt, ...makeOf(body) }));
  return json({ savedAt });
}

async function deleteAnswer(url, env) {
  const key = keyOf(url.searchParams.get('path'), idOf(url.searchParams.get('id')));
  if (!key) return json({ error: 'path' }, 400);
  await env.FILES.delete(key);
  return json({ ok: true });
}

async function flushAnswer(request, env, ctx, token) {
  const body = await request.json().catch(() => ({}));
  const id = idOf(body.id);
  const key = keyOf(body.path, id);
  if (!key) return json({ error: 'path' }, 400);
  if (body.text !== undefined && typeof body.text !== 'string') return json({ error: 'body' }, 400);
  if (body.text !== undefined && byteLength(body.text) > MAX_BYTES) return json({ error: 'too big' }, 413);
  const stored = await readValue(env, key);
  const text = body.text ?? stored?.text;
  if (text === undefined) return json({ error: 'not found' }, 404);
  const result = await flushText(env, ctx, body.path, id, text, token, makeOf({ ...stored, ...body }));
  if (result.result === 'moved') return json({ error: 'moved' }, 409);
  // Moved to git, or the page file is gone (nothing to keep the autosave for).
  await env.FILES.delete(key);
  if (result.result === 'page') return json({ error: 'page' }, 404);
  return json({ committed: result.result === 'committed', path: result.path });
}

/** Saves a text to git with `token`'s name: as the waiting version `id` of a published page, or as the page file itself when the page is a
 * draft (with no waiting version), or as a new draft page file (`create`, made at the first free of `to`), or moved to `to` (a draft).
 * `{ result, path }`: 'committed', 'same' (git had it), 'moved' (the branch moved, or GitHub refused: ask again) or 'page' (the page
 * file is not there: nothing to keep it for); `path` is the file that has the text. */
async function flushText(env, ctx, path, id, text, token, { create = false, to = '' } = {}) {
  const wanted = create || (to && to !== path) ? to : '';
  if (create && !wanted) return { result: 'page', path };
  const names = wanted ? candidatePaths(wanted) : [];
  const read = await readFiles(env, [path, draftPath(path, id), ...names], ctx, token);
  const [page, draft, ...others] = read.texts;
  const name = (p) => p.replace(/^src\/content\//, '');
  const commit = async (changes, file) => {
    try {
      await commitFiles(env, read.head, say(config.locale, 'Draft: {name}', { name: name(file) }), changes, ctx, token);
    } catch (e) {
      console.error(`Autosave could not be saved to git: ${e.message}`);
      return { result: 'moved', path: file };
    }
    return { result: 'committed', path: file };
  };
  // A new page or post: its draft page file, where there is room (a file of that name that already has this text is this one, saved before).
  if (create) {
    if (page !== undefined) return { result: 'page', path };
    const body = draftPage(text);
    const same = names.findIndex((_, i) => others[i] === body);
    if (same >= 0) return { result: 'same', path: names[same] };
    const free = names.findIndex((_, i) => others[i] === undefined);
    return free < 0 ? { result: 'moved', path } : commit([{ path: names[free], text: body }], names[free]);
  }
  if (typeof page !== 'string') return { result: 'page', path };
  if (published(page) || typeof draft === 'string' || !isDraftPage(page)) {
    const changes = saveDraft({ path, text: page, drafts: typeof draft === 'string' ? { [id]: draft } : {} }, text, id);
    if (changes.every((c) => c.text === draft)) return { result: 'same', path };
    return commit(changes, path);
  }
  // A draft page: the page file is the version, and it stays a draft. After the H1 it may move, when that is free.
  const body = draftPage(text);
  const free = wanted ? names.findIndex((_, i) => others[i] === undefined) : -1;
  if (free >= 0 && names[free] !== path)
    return commit(
      [
        { path: names[free], text: body },
        { path, text: null },
      ],
      names[free],
    );
  if (body === page) return { result: 'same', path };
  return commit([{ path, text: body }], path);
}

/** The Worker's hourly job: autosaves idle for a day go to git (the Worker's GITHUB_PUBLISH_TOKEN, one commit each), and those 30 days old
 * that could not go are deleted. Gives how many were moved and deleted. */
export async function sweepAutosaves(env, now = Date.now(), ctx) {
  const done = { flushed: 0, deleted: 0 };
  if (!env.FILES) return done;
  const prefix = `${SITE}/${PREFIX}/`;
  let cursor;
  do {
    const page = await env.FILES.list({ prefix, cursor });
    for (const object of page.objects) {
      const at = parseKey(SITE, object.key);
      const value = at ? await readValue(env, object.key) : null;
      if (!at || !value) {
        // Not ours, or damaged: only what is ours and old is deleted.
        if (at && sweepAction(object.uploaded?.getTime?.() ?? now, now, false) === 'delete') {
          await env.FILES.delete(object.key);
          done.deleted++;
        }
        continue;
      }
      const action = sweepAction(value.savedAt, now, !!env.GITHUB_PUBLISH_TOKEN);
      if (action === 'keep') continue;
      const result =
        action === 'flush'
          ? (await flushText(env, ctx, at.path, at.id, value.text, env.GITHUB_PUBLISH_TOKEN, makeOf(value))).result
          : 'none';
      if (result === 'committed' || result === 'same' || result === 'page') {
        await env.FILES.delete(object.key);
        if (result !== 'page') done.flushed++;
        continue;
      }
      if (sweepAction(value.savedAt, now, false) === 'delete') {
        await env.FILES.delete(object.key);
        done.deleted++;
      }
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  if (done.flushed || done.deleted) console.log(`Autosaves: ${done.flushed} saved to git, ${done.deleted} deleted`);
  return done;
}
