// A page's title and its H1 (the first heading of its text, firstHeading.mjs) kept the same while the owner writes either
// (EntryForm.tsx, MarkdownEditor.tsx): the rule for when they are linked (linked, h1FromTitle, titleFromH1), and the H1 in
// the editor's document, read (h1Of, h1TextOf) and written (h1Written). Only ProseMirror's model; no Milkdown, no browser,
// so it is tested (titleH1.test.mjs).
import { Fragment } from '@milkdown/kit/prose/model';

/** Whether a title and an H1 move together: while they are the same (spaces around them aside) or one of them is empty.
 * A page whose title was made different from its H1 keeps both as they are.
 * @param {string | null | undefined} title @param {string | null | undefined} h1 @returns {boolean} */
export const linked = (title, h1) => {
  const a = String(title ?? '').trim();
  const b = String(h1 ?? '').trim();
  return !a || !b || a === b;
};

/** The H1 to write when the title changed from `before` to `title`, or null to leave the H1 as it is: not when they were
 * not linked, nor when the title is emptied (the text keeps its heading), nor when it already says so.
 * @param {string} before @param {string | null} h1 @param {string} title @returns {string | null} */
export const h1FromTitle = (before, h1, title) => (linked(before, h1) && title.trim() && title !== (h1 ?? '') ? title : null);

/** The title to write when the H1 changed from `before` to `now`, or null to leave the title as it is: not when they were
 * not linked, nor when the H1 is emptied or removed, nor when the title already says so.
 * @param {string} title @param {string | null} before @param {string | null} now @returns {string | null} */
export const titleFromH1 = (title, before, now) => (now != null && now.trim() && now !== title && linked(title, before) ? now : null);

/** The H1 of a document: its first top-level heading of level 1 (as pageH1 in sections.mjs finds it in the Markdown), with
 * its position; null without one.
 * @param {import('@milkdown/kit/prose/model').Node} doc
 * @returns {{ node: import('@milkdown/kit/prose/model').Node, pos: number } | null} */
export function h1Of(doc) {
  /** @type {{ node: import('@milkdown/kit/prose/model').Node, pos: number } | null} */
  let found = null;
  doc.forEach((node, pos) => {
    if (!found && node.type.name === 'heading' && node.attrs.level === 1) found = { node, pos };
  });
  return found;
}

/** The H1's text (without its marks and colours), or null without one.
 * @param {import('@milkdown/kit/prose/model').Node} doc @returns {string | null} */
export const h1TextOf = (doc) => h1Of(doc)?.node.textContent ?? null;

// Whether a position in a string falls between the two halves of a character (a surrogate pair).
const splits = (/** @type {string} */ s, /** @type {number} */ at) =>
  /[\uDC00-\uDFFF]/.test(s[at] ?? '') && /[\uD800-\uDBFF]/.test(s[at - 1] ?? '');

/** The transaction that makes the H1 say `text`, or null when it does: a new H1 at the top of the text without one; else
 * only the part that differs is replaced, so the rest keeps its marks and colours (a heading of more than text gets the
 * text alone).
 * @param {import('@milkdown/kit/prose/state').EditorState} state @param {string} text
 * @returns {import('@milkdown/kit/prose/state').Transaction | null} */
export function h1Written(state, text) {
  const { schema } = state;
  const found = h1Of(state.doc);
  if (!found) return state.tr.insert(0, schema.nodes.heading.create({ level: 1 }, text ? schema.text(text) : null));
  const { node, pos } = found;
  const old = node.textContent;
  if (old === text) return null;
  const start = pos + 1;
  let onlyText = true;
  node.forEach((child) => void (onlyText &&= child.isText));
  if (!onlyText) return state.tr.replaceWith(start, start + node.content.size, text ? schema.text(text) : Fragment.empty);
  let a = 0;
  while (a < old.length && a < text.length && old[a] === text[a]) a++;
  if (splits(old, a) || splits(text, a)) a--;
  let b = 0;
  while (b < old.length - a && b < text.length - a && old[old.length - 1 - b] === text[text.length - 1 - b]) b++;
  if (b && (splits(old, old.length - b) || splits(text, text.length - b))) b--;
  const from = start + a;
  const to = start + old.length - b;
  const added = text.slice(a, text.length - b);
  const tr = state.tr;
  if (!added) return tr.delete(from, to);
  // The marks of what is replaced, or of the text where it goes (as typing there would have them).
  const $from = state.doc.resolve(from);
  const marks = from === to ? $from.marks() : $from.marksAcross(state.doc.resolve(to));
  return tr.replaceWith(from, to, schema.text(added, marks ?? undefined));
}
