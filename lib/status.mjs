// The status of a page or blog post: `status` in its front matter, "Status" at the top of it in the
// editor (packages/editor/defaults/collections.ts).
//   (none)     Udgivet: on the site.
//   draft      Kladde: not on the site (in dev, and on the editor's preview, it opens on its address).
//   unlisted   A stored value of 0.16 ("Hidden"). On a page it is read as published with `noindex` (`hiddenFromSearch`, `migrateStatus`).
//              On a blog post it is read as published with `unlisted: true` (`isUnlisted`, `migrateStatus`).
//   scheduled  Planlagt: a draft until `publishAt` (Danish time, "2026-11-01T08:00"), then published.
//              A build after that time has it; each hour the site's Worker makes it Udgivet in the file
//              (packages/editor/worker/publish.js, packages/editor/lib/scheduled.mjs), which builds the site.
// No dependencies, so the Worker can use it.
import { isOver } from './notice.mjs';

/** What a page or post is on a site built at `now`: 'published' or 'draft'. A stored `unlisted` is published.
 * @param {{ status?: unknown; publishAt?: unknown }} data
 * @returns {'published' | 'draft'} */
export function stateOf(data, now = Date.now()) {
  if (data.status === 'scheduled') return isOver(String(data.publishAt ?? ''), now) ? 'published' : 'draft';
  return data.status === 'draft' ? 'draft' : 'published';
}

/** Whether a blog post is kept out of the blog and every list of posts, "Not on the blog": `unlisted: true`, or a stored
 * `status: unlisted` (0.16). It is still published, opens at its address, and is in Google and the sitemap (it has no `noindex`).
 * @param {{ status?: unknown; unlisted?: unknown }} data */
export const isUnlisted = (data) => data.unlisted === true || data.unlisted === 'true' || data.status === 'unlisted';

/** Whether a page or post is hidden from search engines: `noindex`, or on a page a stored `unlisted` (migrated to `noindex`).
 * A post that is not on the blog is not hidden from search engines.
 * @param {{ status?: unknown; noindex?: unknown }} data @param {'page' | 'post'} kind */
export const hiddenFromSearch = (data, kind = 'page') =>
  data.noindex === true || data.noindex === 'true' || (kind === 'page' && data.status === 'unlisted');

/** The fields of a page or post with a stored `unlisted` migrated: no `status`, and `noindex: true` on a page, `unlisted: true`
 * on a post.
 * @template {Record<string, unknown>} T @param {T} data @param {'page' | 'post'} kind @returns {T} */
export function migrateStatus(data, kind = 'page') {
  if (data.status !== 'unlisted') return data;
  const { status: _status, ...rest } = data;
  return /** @type {T} */ (kind === 'post' ? { ...rest, unlisted: true } : { ...rest, noindex: true });
}
