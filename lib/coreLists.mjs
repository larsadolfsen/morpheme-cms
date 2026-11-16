// The system lists, the ones the core itself brings, declared in the shape of an own list's definition (docs/superpowers/specs/2026-11-14-dynamic-lists-framework-design.md,
// sections 3.4 and 8.3): the blog's posts and the testimonials. The reader (lib/lists.mjs) reads them like any list: an entry has these fields, and
// `asRowsOf` says which of them fill a row's slots. Only the way each list's entries are fetched differs (the site's `standard.source`, the editor's
// `sourceItems`), and both give entries with the fields declared here. Plain JavaScript, so the site, the editor and the tests import it.
import { asRowsOf } from './ownList.mjs';

/** @typedef {{ id: string, kind: string }} CoreField */
/** @typedef {{ id: 'posts' | 'testimonials', fields: CoreField[], asRows: ReturnType<typeof asRowsOf>, readOnly?: boolean }} CoreList */

/** @param {{ id: CoreList['id'], fields: CoreField[], readOnly?: boolean }} list @returns {CoreList} */
const declare = (list) => ({ ...list, asRows: asRowsOf({ fields: /** @type {any} */ (list.fields) }) });

/** The core's lists, in the order `Rows from` offers them. `readOnly`: its entries are not written in a list page (posts are written as posts).
 * Posts: newest first, never a hidden or draft post; `href` is the post's address. Testimonials: `quote` is the quote's first paragraph, `href` the
 * testimonial's anchor on the Testimonials page. */
export const CORE_LISTS = /** @type {CoreList[]} */ ([
  declare({
    id: 'posts',
    readOnly: true,
    fields: [
      { id: 'title', kind: 'title' },
      { id: 'description', kind: 'text' },
      { id: 'image', kind: 'image' },
      { id: 'date', kind: 'date' },
      { id: 'href', kind: 'href' },
      { id: 'categories', kind: 'tags' },
    ],
  }),
  declare({
    id: 'testimonials',
    fields: [
      { id: 'name', kind: 'title' },
      { id: 'context', kind: 'title' },
      { id: 'quote', kind: 'text' },
      { id: 'image', kind: 'image' },
      { id: 'href', kind: 'href' },
      { id: 'categories', kind: 'tags' },
    ],
  }),
]);

/** The core list with this id, or undefined. @param {unknown} id @returns {CoreList | undefined} */
export const coreListOf = (id) => CORE_LISTS.find((l) => l.id === id);
