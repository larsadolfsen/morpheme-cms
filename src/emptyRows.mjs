// An empty row in a block typed in place (the List's "New row" left empty, a Steps block's empty step ...) is not saved: the site draws no empty
// row. Before a page is saved the editor finds the first one (`firstEmptyRow`) and asks what to do (EntryForm.tsx); the rows are left out
// of the text (`withoutEmptyRows`) or out of the editor's own blocks (MarkdownEditor.tsx, `leaveOut`). A block whose rows are required and
// that has none left is left out as a whole, as it would not be saved otherwise. The faded "next" row at the end of a list is not a row
// (a block with rows shows it only while it has none), and the other problems of a block stay in check.ts. The block's own facts come
// from `describe` (emptyRows.ts), so this has no dependencies and no browser.
import { blockHtml, parseBlock } from '../lib/blocks.mjs';
import { isEmptyRow, withoutEmpty } from './inlineRows.mjs';

/** @typedef {Record<string, any>} Props */
/** What a block typed in place with rows says of them: the list field's name, whether the rows are required, the block's name and its word for a row;
 * null for any other block (one with no rows, one that reads a list).
 * @typedef {(type: string, props: Props) => { key: string; required: boolean; name: string; word: string; items: string } | null} Describe */
/** Which block of the text it is in, counted over every block (hidden ones too, as the editor's blocks are), and its name and word for a row.
 * @typedef {{ at: number; type: string; kind: 'row' | 'block'; name: string; word: string; items: string }} EmptyRow */

/** The block's props without its empty rows, or null when the block is to go (its rows are required and none is left); undefined when there is
 * nothing to leave out (a block with no rows that are not required has nothing to leave out either).
 * @param {Describe} describe @param {string} type @param {Props} props @returns {Props | null | undefined} */
export function leaveOut(describe, type, props) {
  const own = describe(type, props);
  if (!own) return undefined;
  const rows = Array.isArray(props[own.key]) ? props[own.key] : [];
  if (rows.length ? !rows.some(isEmptyRow) : !own.required) return undefined;
  const kept = withoutEmpty(rows);
  return !kept.length && own.required ? null : { ...props, [own.key]: kept };
}

/** The first block with an empty row, not a hidden one (it is not on the site), or null.
 * @param {Describe} describe @param {string} text @returns {EmptyRow | null} */
export function firstEmptyRow(describe, text) {
  let at = -1;
  for (const line of text.split('\n')) {
    const block = parseBlock(line);
    if (!block) continue;
    at++;
    const left = block.props.hidden ? undefined : leaveOut(describe, block.type, block.props);
    if (left === undefined) continue;
    const { name, word, items } = describe(block.type, block.props);
    // `block`: it has no row at all (the faded "New row" of a new block, left empty): the block itself goes, a row cannot.
    return { at, type: block.type, kind: left === null ? 'block' : 'row', name, word, items };
  }
  return null;
}

/** The text with the empty rows of every block left out, and the blocks that are left with no row they must have.
 * @param {Describe} describe @param {string} text */
export function withoutEmptyRows(describe, text) {
  return text
    .split('\n')
    .flatMap((line) => {
      const block = parseBlock(line);
      if (!block || block.props.hidden) return [line];
      const left = leaveOut(describe, block.type, block.props);
      return left === undefined ? [line] : left === null ? [] : [blockHtml(block.type, left)];
    })
    .join('\n');
}
