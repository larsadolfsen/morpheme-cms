// The pages and posts of a site read from their files' front matter: path, collection, title, status, publishAt and
// date. Takes plain files, so the start screen's widgets and app pages can use it with any list of files. Exposes
// `entriesOf`. Depends on frontmatter.mjs.
import { readFields, splitFrontmatter } from './frontmatter.mjs';

/** @typedef {{ path: string; collection: string; title: string; status: 'published' | 'draft' | 'scheduled'; publishAt: string | undefined; date: string | undefined }} Entry */

/** What `status` in the front matter says a page or post is, as the lists show it (Library.tsx).
 * @param {unknown} status
 * @returns {Entry['status']} */
const statusOf = (status) => (status === 'draft' || status === 'scheduled' ? status : 'published');

/** @param {unknown} value @returns {string | undefined} */
const textOf = (value) => (value === undefined || value === null || value === '' ? undefined : String(value));

/** Each markdown file under the folder of a collection, as an entry.
 * @param {{ path: string; text: string }[]} files
 * @param {{ id: string; folder: string }[]} collections
 * @returns {Entry[]} */
export function entriesOf(files, collections) {
  return files.flatMap((file) => {
    const collection = collections.find((c) => file.path.startsWith(`${c.folder}/`));
    if (!collection || !file.path.endsWith('.md')) return [];
    const d = readFields(splitFrontmatter(file.text).yaml);
    return [
      {
        path: file.path,
        collection: collection.id,
        title: String(d.title ?? file.path),
        status: statusOf(d.status),
        publishAt: textOf(d.publishAt),
        date: textOf(d.date),
      },
    ];
  });
}
