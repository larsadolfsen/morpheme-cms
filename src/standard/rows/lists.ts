// The lists that say which of their fields fill a row (`asRows`), for "Rows from" in the editor. Filled by site.ts once it has the site's lists
// (a block's own file cannot import site.ts: that imports the blocks).
import type { OwnedList } from '../../schema';

let lists: OwnedList[] = [];

/** Told by site.ts: the lists of the site, the standard blocks' and the apps'. */
export const setRowLists = (all: OwnedList[]) => {
  lists = all.filter((c) => !!c.asRows);
};

/** The lists a block can read besides the blog's posts and the testimonials. */
export const rowLists = () => lists;
