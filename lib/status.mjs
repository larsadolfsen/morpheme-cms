// The status of a page or blog post: `status` in its front matter, "Status" at the top of it in the
// editor (packages/editor/defaults/collections.ts).
//   (none)     Udgivet: on the site.
//   draft      Kladde: not on the site (in dev, and on the editor's preview, it opens on its address).
//   unlisted   (removed, 0.17) a stored value is read as published with `noindex` (`hiddenFromSearch`); the editor writes `noindex: true`.
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

/** Whether a page or post is hidden from search engines: `noindex`, or a stored `unlisted` (migrated to `noindex`).
 * @param {{ status?: unknown; noindex?: unknown }} data */
export const hiddenFromSearch = (data) => data.noindex === true || data.noindex === 'true' || data.status === 'unlisted';

/** The fields of a page or post with a stored `unlisted` migrated: no `status`, and `noindex: true`.
 * @template {Record<string, unknown>} T @param {T} data @returns {T} */
export function migrateStatus(data) {
  if (data.status !== 'unlisted') return data;
  const { status: _status, ...rest } = data;
  return /** @type {T} */ ({ ...rest, noindex: true });
}
