// The keys and free lines between the cards of a flow editor (the page editor's blocks and images, a form window's field blocks): each
// takes the names of the nodes that are cards, so the page editor passes `siteBlock` and `image` and another editor passes its own.
// Exposes isGap, isCardOf, nextToCard, cardDeletes, gapHere and tapBelow. Depends on Milkdown's ProseMirror.
import { $prose } from '@milkdown/kit/utils';
import type { Node } from '@milkdown/kit/prose/model';
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view';
import { NodeSelection, Plugin, Selection, type EditorState } from '@milkdown/kit/prose/state';

// An empty paragraph: a free line between two cards, which the arrows on a card skip.
export const isGap = (node: Node) => node.type.name === 'paragraph' && node.content.size === 0;

// A card: a node with one of the names.
export const isCardOf = (cards: readonly string[]) => (node: Node | null | undefined) => !!node && cards.includes(node.type.name);

// Whether deleting back (or forward) from the cursor reaches a card: one is selected, right before
// (after) the cursor, or before (after) the text the cursor is at the start (end) of.
export function nextToCard(state: EditorState, back: boolean, cards: readonly string[]) {
  const isCard = isCardOf(cards);
  const { selection } = state;
  if (selection instanceof NodeSelection) return isCard(selection.node);
  if (!selection.empty) return false;
  const $pos = selection.$from;
  if (isCard(back ? $pos.nodeBefore : $pos.nodeAfter)) return true;
  if ($pos.parentOffset !== (back ? 0 : $pos.parent.content.size)) return false;
  const next = $pos.node(-1).maybeChild($pos.index(-1) + (back ? -1 : 1));
  return isCard(next) || isCard(back ? next?.lastChild : next?.firstChild);
}

// Deleting next to a card is ProseMirror's, as with a hardware keyboard (the card is selected, then
// removed). The keyboards of phones delete without a key (only beforeinput), and the browser then
// deleted the card, or what is in it, without ProseMirror knowing.
export const cardDeletes = (cards: readonly string[]) =>
  $prose(
    () =>
      new Plugin({
        props: {
          handleDOMEvents: {
            beforeinput: (view, event) => {
              const back = /^delete\w*Backward$/.test(event.inputType);
              if (!back && !/^delete\w*Forward$/.test(event.inputType)) return false;
              if (!nextToCard(view.state, back, cards)) return false;
              event.preventDefault();
              const key = new KeyboardEvent('keydown', { key: back ? 'Backspace' : 'Delete', keyCode: back ? 8 : 46 });
              view.someProp('handleKeyDown', (f) => f(view, key));
              return true;
            },
          },
        },
      }),
  );

// The free line the cursor is in, which opens up to write in (editor.css; the others are thin).
export const gapHere = () =>
  $prose(
    () =>
      new Plugin({
        props: {
          decorations: ({ doc, selection: { $from, empty } }) =>
            empty && $from.depth === 1 && isGap($from.parent)
              ? DecorationSet.create(doc, [Decoration.node($from.before(), $from.after(), { class: 'editor-gap-here' })])
              : null,
        },
      }),
  );

// A tap in the white below a section's last part, or between two sections (the text's own padding, no node there), puts the cursor in a
// free line there: the empty paragraph that is already after the part, or a new one that exists only in the editor (markdownOf leaves
// an empty paragraph out of the saved text, so nothing is written unless something is typed in it).
export const tapBelow = () =>
  $prose(
    () =>
      new Plugin({
        props: {
          handleDOMEvents: {
            click: (view, event) => {
              if (event.target !== view.dom) return false;
              const { doc, schema } = view.state;
              const y = (event as MouseEvent).clientY;
              const sections = (node: Node) => node.type.name === 'heading' && node.attrs.level <= 2;
              let hit: { node: Node; pos: number; next: Node | null } | null = null;
              doc.forEach((node, pos, i) => {
                const dom = view.nodeDOM(pos);
                if (dom instanceof HTMLElement && dom.getBoundingClientRect().bottom <= y) hit = { node, pos, next: doc.maybeChild(i + 1) };
              });
              const at = hit as { node: Node; pos: number; next: Node | null } | null;
              if (!at) return false;
              let h2 = false;
              doc.forEach((node) => void (h2 ||= node.type.name === 'heading' && node.attrs.level === 2));
              // The end of the text (when it has sections), or the end of a section: the next part is the heading that starts another.
              if (at.next ? !sections(at.next) : !h2) return false;
              let tr = view.state.tr;
              let free = at.pos + 1;
              if (!isGap(at.node)) {
                free = at.pos + at.node.nodeSize + 1;
                tr = tr.insert(at.pos + at.node.nodeSize, schema.nodes.paragraph.create()).setMeta('addToHistory', false);
              }
              view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(free), -1)).scrollIntoView());
              view.focus();
              event.preventDefault();
              return true;
            },
          },
        },
      }),
  );
