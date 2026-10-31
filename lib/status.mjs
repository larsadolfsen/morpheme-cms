// The status of a page or blog post: `status` in its front matter, "Status" at the top of it in the
// editor (packages/editor/defaults/collections.ts).
//   (none)     Udgivet: on the site.
//   draft      Kladde: not on the site (in dev, and on the editor's preview, it opens on its address).
//   unlisted   Skjult: opens on its address, but is not on the blog, in the sitemap or in Google.
//   scheduled  Planlagt: a draft until `publishAt` (Danish time, "2026-11-01T08:00"), then published.
//              A build after that time has it; each hour the site's Worker makes it Udgivet in the file
//              (packages/editor/worker/publish.js, packages/editor/lib/scheduled.mjs), which builds the site.
// No dependencies, so the Worker can use it.
import { isOver } from './notice.mjs';

/** What a page or post is on a site built at `now`: 'published', 'draft' or 'unlisted'.
 * @param {{ status?: unknown; publishAt?: unknown }} data
 * @returns {'published' | 'draft' | 'unlisted'} */
export function stateOf(data, now = Date.now()) {
  if (data.status === 'scheduled') return isOver(String(data.publishAt ?? ''), now) ? 'published' : 'draft';
  return data.status === 'draft' || data.status === 'unlisted' ? data.status : 'published';
}
