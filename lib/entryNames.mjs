// The name of a new page or post while it is written (autosave of a new entry, src/EntryForm.tsx, worker/autosave.js): it is called
// `New page` / `New blog post` at once, with a number when that is taken (`new-page`, `new-page-2`), and follows the H1 of a page (the
// title of a post) until the person writes an address of their own. Plain functions, no dependencies, so the editor and the Worker use
// the same ones. `slugify` is the editor's (src/schema.ts), given in because this file cannot import it.

/** The first of `base`, `base-2`, `base-3` … that is not taken. @param {string} base @param {(name: string) => boolean} taken */
export function freeName(base, taken) {
  if (!taken(base)) return base;
  for (let n = 2; ; n++) if (!taken(`${base}-${n}`)) return `${base}-${n}`;
}

/** The page files to try for a wanted one, in order: `a/b.md`, `a/b-2.md` … `a/b-<count>.md`. @param {string} path @param {number} [count] */
export function candidatePaths(path, count = 9) {
  const stem = path.replace(/\.md$/, '');
  return [path, ...Array.from({ length: count - 1 }, (_, i) => `${stem}-${i + 2}.md`)];
}

/**
 * What a new entry is called now. `create`: the default title in the editor's language ("New page"); `title`: the title as it stands (a
 * page's follows its H1, a post's is typed); `typed`: the file name of an address the person wrote by hand, or '' (it then no longer
 * follows the title); `taken`: whether a file name is in use. A blank title (or one with no letters) is the default title, numbered
 * ("New page 2") when its file name is taken; a title the person wrote keeps its words, and only its file name is numbered.
 * @param {{ create: string; title: string; typed?: string; taken: (name: string) => boolean; slugify: (title: string) => string }} input
 * @returns {{ title: string; name: string; byHand: boolean }}
 */
export function entryName({ create, title, typed = '', taken, slugify }) {
  const own = title.trim();
  const slug = slugify(own);
  const fallback = slugify(create) || 'new';
  if (typed) return { title: own || create, name: freeName(typed, taken), byHand: true };
  if (slug) return { title: own, name: freeName(slug, taken), byHand: false };
  const name = freeName(fallback, taken);
  const n = name === fallback ? '' : ` ${name.slice(fallback.length + 1)}`;
  return { title: `${create}${n}`, name, byHand: false };
}

/**
 * Whether a new entry is still as the form opened it, so there is nothing worth keeping: no field changed, and the text (when it was
 * touched) has no H1 and is as it started. `changed`: the names of the fields that differ from a new entry's, the title leaving out.
 * @param {{ changed: string[]; bodyChanged: boolean; bare: boolean; h1: string | null; markdown: string; start: string }} input
 */
export function untouched({ changed, bodyChanged, bare, h1, markdown, start }) {
  if (changed.length) return false;
  if (!bodyChanged) return true;
  return bare && !(h1 ?? '').trim() && markdown.trim() === start.trim();
}
