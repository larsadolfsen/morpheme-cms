// Publishes the pages and blog posts that are Planlagt once their time has come (packages/editor/lib/status.mjs): each hour (the
// cron in wrangler.jsonc, minute 7) the Worker reads the list the build made of them (/_scheduled.json,
// packages/editor/scripts/scheduled-list.mjs), and if a time has come, it makes those files Udgivet (their `status` and `publishAt`
// lines go) in one commit on main (*Udgiv planlagt: blogindlæg "…"*), which builds the site. Nothing is asked of
// GitHub in an hour with nothing to publish. Needs the Worker secret GITHUB_PUBLISH_TOKEN: a GitHub token with
// Contents: Read and write on the repository (docs/editor.md, Opsætning; packages/editor/worker/github.js).
import { commitFiles, readFiles } from './github.js';
import { isDue, nameOf, published, scheduleOf } from '../lib/scheduled.mjs';

/** The address of the build's list; on the site it gives nothing (packages/editor/worker/index.js). */
export const SCHEDULED_LIST = '/_scheduled.json';

export async function publishScheduled(env, now = Date.now()) {
  const due = (await listOf(env)).filter((e) => isDue(e.publishAt, now));
  if (!due.length) return [];
  if (!env.GITHUB_PUBLISH_TOKEN) {
    console.error('Planlagte sider og indlæg kan ikke udgives: Workeren mangler hemmeligheden GITHUB_PUBLISH_TOKEN.');
    return [];
  }
  // The files as they are now (one may have been published or changed since the build).
  const { head, texts } = await readFiles(
    env,
    due.map((e) => e.path),
  );
  const changes = due
    .map((e, i) => ({ path: e.path, text: texts[i] }))
    .filter(({ text }) => {
      const file = scheduleOf(text ?? '');
      return file.status === 'scheduled' && isDue(file.publishAt, now);
    });
  if (!changes.length) return [];
  const names = changes.map((c) => nameOf(c.path));
  await commitFiles(
    env,
    head,
    `Udgiv planlagt: ${names.join(', ')}`,
    changes.map((c) => ({ path: c.path, text: published(c.text) })),
  );
  console.log(`Udgivet: ${names.join(', ')}`);
  return names;
}

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
