// Publishes the pages and blog posts that are scheduled once their time has come: each hour (the cron in wrangler.jsonc, minute 7) the
// Worker looks in src/drafts/ for waiting versions with a time that has come (packages/editor/lib/versions.mjs), and publishes them; it
// also reads, for a site that still has them, the list the build made of the pages with the status Scheduled (/_scheduled.json,
// packages/editor/scripts/scheduled-list.mjs), and if a time has come, it makes those files Published (their `status` and `publishAt`
// lines go) in one commit on main (*Publish scheduled: blog post "…"*, in the site's language), which builds the site. Each hour it asks
// GitHub for the branch's head and src/drafts/ (from the R2 cache when that is on), and for more only when a version is due. Needs the Worker secret GITHUB_PUBLISH_TOKEN: a GitHub token with
// Contents: Read and write on the repository (docs/editor.md, Setup; packages/editor/worker/github.js).
import { config } from '@site/config';
import { commitFiles, readFiles, readFolder } from './github.js';
import { say } from './say.js';
import { isDue, nameOf, published, scheduleOf } from '../lib/scheduled.mjs';
import { DRAFTS, due, isWaitingDue, pageOf, publish } from '../lib/versions.mjs';

/** The address of the build's list; on the site it gives nothing (packages/editor/worker/index.js). */
export const SCHEDULED_LIST = '/_scheduled.json';

/** Publishes what is due: a waiting version whose time has come (`publishAt` in its file in src/drafts/, lib/versions.mjs) replaces its
 * page, and a page with the stored status Scheduled (an older site) is made Published. One commit for both. Gives the names. */
export async function publishScheduled(env, now = Date.now(), ctx) {
  const list = (await listOf(env)).filter((e) => isDue(e.publishAt, now));
  // Asked of GitHub every hour: a draft saved with a time starts no build (src/drafts/ is not built), so the build's list cannot have it.
  const waiting = await dueVersions(env, now, ctx);
  if (!list.length && !waiting.changes.length) return [];
  if (!env.GITHUB_PUBLISH_TOKEN) {
    console.error('Scheduled pages and posts cannot be published: the Worker has no GITHUB_PUBLISH_TOKEN secret.');
    return [];
  }
  let head = waiting.head;
  const changes = [...waiting.changes];
  const names = [...waiting.names];
  if (list.length) {
    // The files as they are now (one may have been published or changed since the build).
    const read = await readFiles(
      env,
      list.map((e) => e.path),
      ctx,
    );
    head ??= read.head;
    for (const [i, e] of list.entries()) {
      const file = scheduleOf(read.texts[i] ?? '');
      if (file.status !== 'scheduled' || !isDue(file.publishAt, now) || changes.some((c) => c.path === e.path)) continue;
      changes.push({ path: e.path, text: published(read.texts[i]) });
      names.push(e.path);
    }
  }
  if (!changes.length) return [];
  const said = names.map((path) => nameOf(path, (text) => say(config.locale, text)));
  // The older head: if the branch has moved since, the commit is refused and the next hour tries again.
  await commitFiles(env, head, say(config.locale, 'Publish scheduled: {names}', { names: said.join(', ') }), changes, ctx);
  console.log(`Published: ${said.join(', ')}`);
  return said;
}

/** The waiting versions whose time has come, as the changes that publish them. Nothing is read beyond the folder when none is due. */
async function dueVersions(env, now, ctx) {
  const none = { head: undefined, changes: [], names: [] };
  let folder;
  try {
    folder = await readFolder(env, DRAFTS, 5, ctx);
  } catch (e) {
    console.error(`Waiting versions could not be read: ${e.message}`);
    return none;
  }
  const files = folder.files.filter((f) => f.path.endsWith('.md'));
  if (!files.some((f) => isWaitingDue(f.text, now))) return none;
  // Each draft's page file is one of two paths (a draft is `<page>.md` or `<page>/<id>.md`): read both and see which is there.
  const candidates = [...new Set(files.flatMap((f) => candidatesOf(f.path)))];
  const read = await readFiles(env, candidates, ctx);
  const texts = new Map(candidates.flatMap((path, i) => (typeof read.texts[i] === 'string' ? [[path, read.texts[i]]] : [])));
  const pages = new Map();
  for (const f of files) {
    const at = pageOf(f.path, [...texts.keys()]);
    if (!at || !texts.has(at.path)) continue;
    if (!pages.has(at.path)) pages.set(at.path, { path: at.path, text: texts.get(at.path), drafts: {} });
    pages.get(at.path).drafts[at.id] = f.text;
  }
  const changes = [];
  const names = [];
  for (const { page, id } of due([...pages.values()], now)) {
    changes.push(...publish(page, id));
    names.push(page.path);
  }
  return { head: folder.head, changes, names };
}

const candidatesOf = (draft) => {
  const rest = draft.slice(DRAFTS.length + 1, -'.md'.length);
  const slash = rest.lastIndexOf('/');
  return [`src/content/${rest}.md`, ...(slash > 0 ? [`src/content/${rest.slice(0, slash)}.md`] : [])];
};

// The build's list; none (a build before the list, or a preview) is nothing to publish.
async function listOf(env) {
  try {
    const res = await env.ASSETS.fetch(new Request(`https://assets.local${SCHEDULED_LIST}`));
    const list = res.ok ? await res.json() : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}
