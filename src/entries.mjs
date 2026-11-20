// The pages and posts of a site read from their files' front matter: path, collection, title, status, publishAt and
// date. Takes plain files, so the start screen's widgets and app pages can use it with any list of files. Exposes
// `entriesOf`. Depends on frontmatter.mjs.
import { readFields, splitFrontmatter } from './frontmatter.mjs';
import { waitingOf } from './pageVersions.mjs';
import { isOver } from '../lib/notice.mjs';

/** @typedef {{ path: string; collection: string; title: string; status: 'published' | 'draft' | 'scheduled'; publishAt: string | undefined; date: string | undefined; waiting?: { publishAt?: string } }} Entry */

/** What `status` in the front matter says a page or post is, as the lists show it (Library.tsx).
 * @param {unknown} status
 * @returns {Entry['status']} */
// A stored `scheduled` whose time has passed is published (lib/status.mjs stateOf).
const statusOf = (status, publishAt) =>
  status === 'draft' ? status : status === 'scheduled' && !isOver(String(publishAt ?? '')) ? status : 'published';

/** @param {unknown} value @returns {string | undefined} */
const textOf = (value) => (value === undefined || value === null || value === '' ? undefined : String(value));

/** Each markdown file under the folder of a collection, as an entry. A draft page that has a waiting version with a time
 * (src/drafts/, lib/versions.mjs) is Scheduled, at that time; a stored status Scheduled (an older site) is too.
 * @param {{ path: string; text: string }[]} files
 * @param {{ id: string; folder: string }[]} collections
 * @returns {Entry[]} */
export function entriesOf(files, collections) {
  /** @type {Entry[]} */
  const entries = files.flatMap((file) => {
    const collection = collections.find((c) => file.path.startsWith(`${c.folder}/`));
    if (!collection || !file.path.endsWith('.md')) return [];
    const d = readFields(splitFrontmatter(file.text).yaml);
    return [
      {
        path: file.path,
        collection: collection.id,
        title: String(d.title ?? file.path),
        status: statusOf(d.status, d.publishAt),
        publishAt: textOf(d.publishAt),
        date: textOf(d.date),
      },
    ];
  });
  // Waiting versions (src/drafts/): a draft with a waiting time is Scheduled; a published page with changes waiting says so.
  const waiting = waitingOf(files);
  for (const entry of entries) {
    const w = waiting.get(entry.path);
    if (!w) continue;
    if (entry.status === 'draft' && w.publishAt) Object.assign(entry, { status: 'scheduled', publishAt: w.publishAt });
    else if (entry.status === 'published') entry.waiting = w.publishAt ? { publishAt: w.publishAt } : {};
  }
  return entries;
}
