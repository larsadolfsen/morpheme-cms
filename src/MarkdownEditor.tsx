// The text of a page or blog post: Milkdown (packages/editor/src/markdown.mjs) with a small toolbar. When the tools do
// not fit on one line, an arrow at its end shows the rest on a second row (useToolbarLines.ts).
// The text is shown in the site's own style (the "prose" classes of the pages). On pages the site's
// blocks (src/apps/<app>/blocks/) can be put in the text with a button; each is a card with the block as it looks
// on the site, which opens a menu (hide on the site, move; below expanded also Ret, Fjern; from expanded a tap opens the
// side panel instead), with a free line kept between
// two cards to write in. A fixed page's sections are such a text too (SectionsField.tsx), so both look
// and work the same. The last tool, "Section settings", opens the section's sheet (BlockDialog.tsx).
import {
  type CSSProperties,
  forwardRef,
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useLayoutEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { editorViewCtx, type Editor } from '@milkdown/kit/core';
import type { CmdKey } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import {
  imageSchema,
  insertImageCommand,
  toggleEmphasisCommand,
  toggleStrongCommand,
  turnIntoTextCommand,
  wrapInBlockquoteCommand,
  wrapInBulletListCommand,
  wrapInHeadingCommand,
  wrapInOrderedListCommand,
} from '@milkdown/kit/preset/commonmark';
import { history, redoCommand, undoCommand } from '@milkdown/kit/plugin/history';
import { clipboard } from '@milkdown/kit/plugin/clipboard';
import { $prose, $view, callCommand } from '@milkdown/kit/utils';
import { Fragment } from '@milkdown/kit/prose/model';
import type { Mark, Node } from '@milkdown/kit/prose/model';
import { Decoration, DecorationSet, type EditorView } from '@milkdown/kit/prose/view';
import { NodeSelection, Plugin, Selection, TextSelection, type EditorState } from '@milkdown/kit/prose/state';
import { liftListItem } from '@milkdown/kit/prose/schema-list';
import { lift } from '@milkdown/kit/prose/commands';
import {
  ArrowUUpLeft,
  ArrowUUpRight,
  Image,
  LinkSimple,
  ListBullets,
  ListChecks,
  ListNumbers,
  Palette,
  Quotes,
  Tag,
  TextAa,
  TextAlignCenter,
  TextAlignLeft,
  TextAlignRight,
  TextB,
  TextHThree,
  TextHOne,
  TextHTwo,
  TextItalic,
  TextT,
} from '@phosphor-icons/react';
import { listKindOf, styleOf } from './styleKind.mjs';
import { listRows, styleRows } from './styleMenu.mjs';
import { planBar, slotsFor } from './textBar.mjs';
import { sizeListText, sizeOfList } from './listSize.mjs';
import { HTML, insertBlock, makeEditor, markdownOf, partsOf, siteBlockSchema, spacing } from './markdown.mjs';
import { firstHeading, topHeadings } from './firstHeading.mjs';
import { h1Of, h1TextOf, h1Written } from './titleH1.mjs';
import { headingChoices } from '../lib/heading-levels.mjs';
import { TEXT_COLORS, colorClass } from '../lib/text-colors.mjs';
import { sectionHeading, setSection } from './sectionState.mjs';
import { sectionFrame } from './sectionFrame';
import { IMAGE, type BlockAsk } from './BlockDialog';
import SectionSettingsIcon from './SectionSettingsIcon';
import { askLink } from './LinkSheet';
import { atLeastNow, Menu, MenuDivider, MenuItem, Toolbar, ToolbarButton, ToolbarDivider } from './ui';
import { editsInPanel } from './sheetPlacement.mjs';
import { shownAt } from './images';
import { cropStyle, joinPicture, splitPicture } from '../lib/crop.mjs';
import { describe, htmlBlock, type BlockProps } from './blocks';
import { RowsFromList } from './InlineList';
import { typedInPlace } from './typedInPlace.mjs';
import type { Change, Focus, Item as Row } from './InlineItems';
import { leaveOut } from './pageEmptyRows';
import { addAt, isEmptyRow, moveBy, setField, withoutEmpty } from './inlineRows.mjs';
import { addColumnAt, addRowAt, removeColumnAt, removeRowAt, trimmed } from './inlineGrid.mjs';
import { chosenAlign, columnAddedAt, columnRemovedAt, columnsCut, withAlign } from './standard/table/rows.mjs';
import { editorRows } from './standard/rows/view';
import { fromLine, listPageOf } from './standard/rows/fields';
import { sourceOf, withPart } from './standard/rows/rows.mjs';
import { rowParts } from './standard/rows/view';
import { barIcons, type BarAction } from './contextualMenu';
import { blockBar, blockToolIds, type BlockBarState, type CardRow } from './blockBar';
import { preview } from './registry';
import { leaveTo } from './FormFrame';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { t } from './i18n';
import { motionReduced, motionTiming } from '../lib/motion';
import { barSlideKind } from './barMotion.mjs';
import { dragSteps, limitSteps } from './blockDrag.mjs';
import { blockHandleIcon, blockMarkIcon, duplicateIcon, selectAllBlocksIcon } from './blockHandleIcon';
import { blockSelection } from './blockSelection';
import { allOf, hideChoice, range, removeChoice, groupMove } from './blockSelectionRules.mjs';
import { ask } from './ask';
import { canPress, edgeScroll, movedAway } from '@theme/ui/longPressRules.mjs';
import { hasLabel, labelledHeading, toggleLabel } from './eyebrowState.mjs';
// The icons of the card's menu (Phosphor, as everywhere in the editor), as SVG: the card is not React.
import { AaIcon, AddIcon, CloseIcon, MoreVertIcon } from './icon';
import pencilIcon from '@phosphor-icons/core/assets/regular/pencil-simple.svg?raw';
import eyeIcon from '@phosphor-icons/core/assets/regular/eye.svg?raw';
import eyeSlashIcon from '@phosphor-icons/core/assets/regular/eye-slash.svg?raw';
import arrowUpIcon from '@phosphor-icons/core/assets/regular/arrow-up.svg?raw';
import arrowDownIcon from '@phosphor-icons/core/assets/regular/arrow-down.svg?raw';
import trashIcon from '@phosphor-icons/core/assets/regular/trash.svg?raw';
import { TextLargeIcon, TextMediumIcon, TextSmallIcon } from './TextSizeIcons';
// ProseMirror's own styles: keep its invisible helpers (around images, at the end of lines) out of the layout.
import '@milkdown/kit/prose/view/style/prosemirror.css';

// parts: the text in parts, for a fixed page's sections (partsOf in markdown.mjs). h1: the text of the page's H1 (its first
// heading, without marks), null without one, undefined before the editor is made; setH1: makes it say so (a new H1 at the
// top without one), kept out of the text's undo, which takes back what was typed in the text (titleH1.mjs: the page's title
// written into it, EntryForm.tsx).
export type MarkdownHandle = {
  markdown: () => string | null;
  parts: () => ReturnType<typeof partsOf> | null;
  h1: () => string | null | undefined;
  setH1: (text: string) => void;
  /** Whether the text has nothing but its H1 and blocks: no other text, so a title typed may write the H1. */
  bare: () => boolean;
  /** Scrolls to the block (its number among the text's blocks) and marks it as wrong, as a field is (`.editor-wrong`), until the next try. */
  showBlock: (at: number) => void;
  /** Leaves the empty rows out of the block (its number), or of every block without one (emptyRows.mjs); a block left with no row it must have is removed. */
  removeEmptyRows: (at?: number) => void;
};

// addImage: asks for an image (the gallery, Media.tsx); its address on the site. Its description is
// asked in the sheet. Without it there is no image button. blocks: asks which block to put in and its fields (BlockDialog);
// without it there is no block button; with it a free line is kept between two blocks, and before
// and after them (spacing in markdown.mjs). short: a smaller field, for a short text. h1: a page's text, where the
// first heading is the page's H1 by itself (firstHeading.mjs); a blog post's H1 is its title.
type Props = {
  value: string;
  onChange: () => void;
  addImage?: () => Promise<string | null>;
  blocks?: BlockAsk;
  /** The sheet an image or HTML is changed in, when there are no blocks (a blog post). */
  sheet?: BlockAsk;
  short?: boolean;
  h1?: boolean;
  /** A new page or text: opens as plain text with the cursor at the start, never in a heading. */
  startFocused?: boolean;
  /** A page (`h1`): the text of its H1 changed (typed, pasted, undone), with what it was; null without one (titleH1.mjs). */
  onH1?: (now: string | null, before: string | null) => void;
  /** How each part of the text looks on the site (looksOf in sections.mjs), shown so (editor.css). */
  looks?: (items: LookItem[]) => (string | null)[];
  /** The headings (H2) are the names of sections (a fixed page's, the front page's: sections.mjs), which the site
   * draws as text: no colour for them. */
  sections?: boolean;
  /** Whether the text has the section frame and the colour button (pages and posts). Without it: on unless `sections`.
   * The front page sets `sections` (its H2s are names drawn by the theme, no word colours) and `frame` (its sections take their colour). */
  frame?: boolean;
};

// A part of the text at the top level, for `looks`.
export type LookItem = { kind: 'block'; type: string } | { kind: 'heading' | 'gap' | 'other' } | { kind: 'p'; image: boolean };

const lookItem = (node: Node): LookItem =>
  node.type.name === 'siteBlock'
    ? { kind: 'block', type: node.attrs.type }
    : node.type.name === 'heading' && node.attrs.level === 2
      ? { kind: 'heading' }
      : node.type.name !== 'paragraph'
        ? { kind: 'other' }
        : node.content.size === 0
          ? { kind: 'gap' }
          : { kind: 'p', image: node.content.content.some((n) => n.type.name === 'image') };

// An empty paragraph: a free line between two blocks, which the arrows on a card skip.
const isGap = (node: Node) => node.type.name === 'paragraph' && node.content.size === 0;

// A card: a block, or an image (in a paragraph of its own).
const isCard = (node: Node | null | undefined) => !!node && (node.type.name === 'siteBlock' || node.type.name === 'image');

// Whether deleting back (or forward) from the cursor reaches a card: one is selected, right before
// (after) the cursor, or before (after) the text the cursor is at the start (end) of.
function nextToCard(state: EditorState, back: boolean) {
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
const cardDeletes = $prose(
  () =>
    new Plugin({
      props: {
        handleDOMEvents: {
          beforeinput: (view, event) => {
            const back = /^delete\w*Backward$/.test(event.inputType);
            if (!back && !/^delete\w*Forward$/.test(event.inputType)) return false;
            if (!nextToCard(view.state, back)) return false;
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
const gapHere = $prose(
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

// A page with only its H1 shows the hint under it (editor.css, h1::after): a tap on that line adds the empty paragraph
// and puts the cursor in it, with the keyboard open. (With an empty paragraph after the H1 the tap is on the paragraph.)
const hintTap = $prose(
  () =>
    new Plugin({
      props: {
        handleDOMEvents: {
          click: (view, event) => {
            const { doc, schema } = view.state;
            const h1 = view.dom.firstElementChild;
            if (doc.childCount !== 1 || doc.child(0).type.name !== 'heading' || event.target !== h1 || !h1) return false;
            const range = document.createRange();
            range.selectNodeContents(h1);
            if ((event as MouseEvent).clientY <= range.getBoundingClientRect().bottom) return false;
            const tr = view.state.tr.insert(doc.content.size, schema.nodes.paragraph.create());
            view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(tr.doc.content.size - 1), -1)).scrollIntoView());
            view.focus();
            event.preventDefault();
            return true;
          },
        },
      },
    }),
);

// A tap in the white below a section's last part, or between two sections (the text's own padding, no node there), puts the cursor in a
// free line there: the empty paragraph that is already after the part, or a new one that exists only in the editor (markdownOf leaves
// an empty paragraph out of the saved text, so nothing is written unless something is typed in it).
const tapBelow = $prose(
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

// A tap on the box of a check list item (its ::before, in the padding left of the text; editor.css) checks or unchecks it.
const checkToggle = $prose(
  () =>
    new Plugin({
      props: {
        handleDOMEvents: {
          mousedown: (view, event) => {
            const item = (event.target as HTMLElement | null)?.closest?.('li[data-item-type="task"]');
            if (!item || event.target !== item || !(event instanceof MouseEvent)) return false;
            const at = view.posAtDOM(item, 0);
            const $at = view.state.doc.resolve(at);
            const node = $at.parent;
            if (node.type.name !== 'list_item' || node.attrs.checked == null) return false;
            view.dispatch(view.state.tr.setNodeMarkup($at.before(), undefined, { ...node.attrs, checked: !node.attrs.checked }));
            event.preventDefault();
            return true;
          },
        },
      },
    }),
);

// action: keyboard, whether the choice was made with the keyboard (Enter or Space).
type CardItem = { icon: string; label: string; action: (keyboard: boolean) => void; danger?: boolean };

// The part of the text at the top level before or after the one at index i (a block, or a paragraph
// with an image), skipping the free lines between; null at the start or end.
function neighbour(doc: Node, i: number, by: -1 | 1) {
  let j = i + by;
  while (doc.maybeChild(j) && isGap(doc.child(j))) j += by;
  return doc.maybeChild(j) ? j : null;
}

// The element of the part at the top level at index k.
const partDOM = (view: EditorView, k: number) => view.nodeDOM(view.state.doc.resolve(0).posAtIndex(k)) as HTMLElement | null;

// Swaps the part at the top level at index i with the one before or after it; free lines between
// stay. The parts glide from where they were to where they are now. Returns the moved part's new
// index, or null when it cannot move.
function move(view: EditorView, i: number, by: -1 | 1): number | null {
  const { doc } = view.state;
  const j = neighbour(doc, i, by);
  if (j === null) return null;
  const node = doc.child(i);
  const [first, last] = by < 0 ? [j, i] : [i, j];
  const nodes: Node[] = [];
  for (let k = first; k <= last; k++) nodes.push(doc.child(k));
  // Where each part is now, to let it glide from there; by the node, as the text may be tidied after
  // the move (a section's heading goes with its card).
  const tops = new Map<Node, number>();
  doc.forEach((child, _, k) => {
    const top = partDOM(view, k)?.getBoundingClientRect().top;
    if (top !== undefined) tops.set(child, top);
  });
  const $start = doc.resolve(0);
  const from = $start.posAtIndex(first);
  const to = $start.posAtIndex(last) + doc.child(last).nodeSize;
  const tr = view.state.tr.replaceWith(from, to, Fragment.from([nodes[nodes.length - 1], ...nodes.slice(1, -1), nodes[0]]));
  // The cursor goes after the moved part, not on a block, which the next key would replace.
  view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(by < 0 ? from + node.nodeSize : to))));
  let at = -1;
  view.state.doc.forEach((child, _, k) => {
    if (child === node) at = k;
    const was = tops.get(child);
    const el = partDOM(view, k);
    const dy = was === undefined || !el ? 0 : was - el.getBoundingClientRect().top;
    if (el && Math.abs(dy) > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches)
      el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], motionTiming('spatial'));
  });
  if (at < 0) return null;
  // Where it went, in view (one step: past one block, paragraph, heading or image).
  const moved = partDOM(view, at);
  requestAnimationFrame(() => moved?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }));
  return at;
}

// Selects the card at the top level at index k again (after it moved, it is a new card), so its tools are on the bar still and it can be moved again at once.
type CardHost = HTMLElement & { select?: () => void };
function reopen(view: EditorView, k: number) {
  const el = partDOM(view, k);
  const host = (el?.matches('.site-block') ? el : el?.querySelector('.site-block')) as CardHost | null;
  host?.select?.();
}

// Moves the selected blocks one place together (Move up, Move down), as `groupMove` plans it: the part they move past goes to their other side, and the
// parts glide as in `move`. The blocks stay selected, at their new places.
function moveGroup(view: EditorView, plan: Extract<ReturnType<typeof groupMove>, { ok: true }>, by: -1 | 1) {
  const { doc } = view.state;
  const { first, last, past } = plan;
  const [a, b] = by < 0 ? [past, last] : [first, past];
  const nodes: Node[] = [];
  for (let k = a; k <= b; k++) nodes.push(doc.child(k));
  const tops = new Map<Node, number>();
  doc.forEach((child, _, k) => {
    const top = partDOM(view, k)?.getBoundingClientRect().top;
    if (top !== undefined) tops.set(child, top);
  });
  const span = nodes.slice(first - a, last - a + 1);
  const rest = by < 0 ? nodes.slice(0, first - a) : nodes.slice(last - a + 1);
  const $start = doc.resolve(0);
  const from = $start.posAtIndex(a);
  const to = $start.posAtIndex(b) + doc.child(b).nodeSize;
  const moved = new Set(plan.places.map((p) => doc.child(p)));
  blockSelection.own(() =>
    view.dispatch(view.state.tr.replaceWith(from, to, Fragment.from(by < 0 ? [...span, ...rest] : [...rest, ...span]))),
  );
  // The selected blocks are found again by the node, as the text may be tidied after the move (a section's heading goes with its card).
  const now: number[] = [];
  view.state.doc.forEach((child, _, k) => void (moved.has(child) && now.push(k)));
  blockSelection.set(now.length === plan.places.length ? now : plan.places);
  view.state.doc.forEach((child, _, k) => {
    const was = tops.get(child);
    const el = partDOM(view, k);
    const dy = was === undefined || !el ? 0 : was - el.getBoundingClientRect().top;
    if (el && Math.abs(dy) > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches)
      el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], motionTiming('spatial'));
  });
}

// The blocks at the top level of the text, in order: their type and whether they are hidden.
const blocksOf = (doc: Node) => {
  const blocks: { type: string; hidden: boolean }[] = [];
  doc.forEach((n) => void (n.type.name === 'siteBlock' && blocks.push({ type: n.attrs.type, hidden: n.attrs.props?.hidden === true })));
  return blocks;
};

// "Move up" and "Move down" for the part at the top level at index i, where it can be moved: not past
// the start or end, nor past a block the template locks (locked: their types). The moved card stays selected,
// so it can be moved again at once.
const moves = (view: EditorView, i: number | null, locked: string[] = []): CardItem[] => {
  if (i === null) return [];
  const step = (by: -1 | 1) => (keyboard: boolean) => {
    const at = move(view, i, by);
    if (at !== null) reopen(view, at);
  };
  const can = (by: -1 | 1) => {
    const j = neighbour(view.state.doc, i, by);
    const next = j === null ? null : view.state.doc.child(j);
    return !!next && !(next.type.name === 'siteBlock' && locked.includes(next.attrs.type));
  };
  return [
    ...(can(-1) ? [{ icon: arrowUpIcon, label: t.common.moveUp, action: step(-1) }] : []),
    ...(can(1) ? [{ icon: arrowDownIcon, label: t.common.moveDown, action: step(1) }] : []),
  ];
};

// The places of the blocks (siteBlock) at the top level of the text, in order.
const blockPlaces = (doc: Node) => {
  const places: number[] = [];
  doc.forEach((child, _, index) => void (child.type.name === 'siteBlock' && places.push(index)));
  return places;
};

// The place the selection last changed at, where a range (Shift+click) starts.
let lastPicked: number | null = null;

// A block of the page that can be selected with others (docs/superpowers/specs/2026-11-13-touch-selection-design.md, section 6): a round mark at its top left
// (an empty circle, a filled one with a check while it is selected) that a mouse sees on the block pointed at and every block shows once some block is
// selected; a tap or a click on the block toggles it while blocks are selected; a touch held still on its card for half a second starts selecting (not in the
// text typed in the block: the phone's own press there selects a word), Space on the focused card too, and Shift+click adds a range. Selecting makes the text
// read-only (blockSelecting). Returns `toggle` (what a tap does), `start` (select this one), and how to let go of it.
function blockSelectable(view: EditorView, dom: HTMLElement, card: HTMLElement, top: () => number | null, inline: boolean) {
  const mark = dom.appendChild(document.createElement('span'));
  mark.className = 'site-block-mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.innerHTML = `<span class="site-block-mark-dot">${blockMarkIcon}</span>`;
  const sync = () => {
    const places = blockSelection.places();
    const here = top();
    const on = here !== null && places.includes(here);
    dom.classList.toggle('site-block-marks', places.length > 0);
    dom.classList.toggle('site-block-selected', on);
    mark.dataset.mark = on ? 'on' : 'off';
    dimHandle(dom.querySelector(':scope > .site-block-handle'));
    if (places.length > 0) {
      card.setAttribute('role', 'checkbox');
      card.setAttribute('aria-checked', String(on));
    } else {
      if (inline) card.setAttribute('role', 'group');
      else card.removeAttribute('role');
      card.removeAttribute('aria-checked');
    }
  };
  const toggle = (extend = false) => {
    const here = top();
    if (here === null) return;
    if (extend && lastPicked !== null && blockSelection.places().length)
      blockSelection.set(range(blockSelection.places(), blockPlaces(view.state.doc), lastPicked, here));
    else blockSelection.toggle(here);
    lastPicked = here;
  };
  const start = () => {
    const here = top();
    if (here === null) return;
    lastPicked = here;
    blockSelection.set([here]);
  };
  const off = blockSelection.subscribe(sync);
  sync();
  // A tap or a click while blocks are selected toggles the block (not what it does otherwise): nothing in it takes the focus or opens.
  const picking = (e: Event) =>
    blockSelection.places().length > 0 && !(e.target instanceof Element && e.target.closest('.site-block-handle'));
  dom.addEventListener('mousedown', (e) => picking(e) && e.preventDefault(), true);
  dom.addEventListener('pointerdown', (e) => picking(e) && e.preventDefault(), true);
  let swallow = false;
  dom.addEventListener(
    'click',
    (e) => {
      if (swallow) {
        swallow = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (!picking(e)) return;
      e.preventDefault();
      e.stopPropagation();
      toggle(e.shiftKey);
    },
    true,
  );
  mark.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle(e.shiftKey);
  });
  // Space on the focused card.
  card.addEventListener('keydown', (e) => {
    if (e.key !== ' ' || e.target !== card) return;
    e.preventDefault();
    if (blockSelection.places().length) toggle(e.shiftKey);
    else start();
  });
  // Shift+Arrow extends the selection from the focused card to the block above or below, and the focus goes there.
  card.addEventListener('keydown', (e) => {
    if (!e.shiftKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') || e.target !== card) return;
    const here = top();
    const blocks = blockPlaces(view.state.doc);
    const next = here === null ? undefined : blocks[blocks.indexOf(here) + (e.key === 'ArrowUp' ? -1 : 1)];
    if (here === null || next === undefined) return;
    e.preventDefault();
    const now = blockSelection.places();
    blockSelection.set(range(now.length ? now : [here], blocks, here, next));
    lastPicked = next;
    partDOM(view, next)?.querySelector<HTMLElement>('.site-block-card')?.focus();
  });
  card.addEventListener('keyup', (e) => e.key === ' ' && e.target === card && e.preventDefault());
  // A touch or a pen held still on the card, not on text typed in it.
  let press: { id: number; x: number; y: number; timer: number } | null = null;
  const typed = (target: EventTarget | null) =>
    target instanceof Element &&
    !!target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], .site-block-handle, .site-block-mark');
  const release = () => {
    if (press) clearTimeout(press.timer);
    press = null;
  };
  dom.addEventListener('pointerdown', (e) => {
    release();
    swallow = false;
    if (!canPress(e.pointerType, e.isPrimary) || blockSelection.places().length || typed(e.target)) return;
    const id = e.pointerId;
    press = {
      id,
      x: e.clientX,
      y: e.clientY,
      timer: window.setTimeout(() => {
        press = null;
        swallow = true;
        navigator.vibrate?.(10);
        start();
      }, 500),
    };
  });
  dom.addEventListener('pointermove', (e) => {
    if (press?.id === e.pointerId && movedAway(press, e.clientX, e.clientY)) release();
  });
  for (const type of ['pointerup', 'pointercancel']) dom.addEventListener(type, release);
  dom.addEventListener('contextmenu', (e) => press && e.preventDefault());
  return {
    toggle,
    start,
    destroy: () => {
      release();
      off();
    },
  };
}

// While blocks are selected the text is read-only (no cursor, no keyboard), and any change of the text that is not the selection's own (Undo, a block dragged)
// ends the selection, whose places would be wrong. A change that is the selection's own tells the bar to read the blocks again.
const blockSelecting = $prose(
  () =>
    new Plugin({
      props: { editable: () => blockSelection.places().length === 0 },
      view: (view) => {
        let was = view.state.doc;
        const off = blockSelection.subscribe(() => {
          view.setProps({});
          if (blockSelection.places().length) (document.activeElement as HTMLElement | null)?.blur?.();
        });
        return {
          update: (next) => {
            if (next.state.doc === was) return;
            was = next.state.doc;
            if (blockSelection.owned()) blockSelection.refresh();
            else blockSelection.clear();
          },
          destroy: off,
        };
      },
    }),
);

// The text bar's tools for the selected blocks (blockBar.ts): the count with a cross first, and in the `⋮` Duplicate (with one block selected, and not where
// the template allows no more of it), Hide or Show (Hide when any selected block is shown, Show when all are hidden), Remove (after a question that names
// the blocks, and the ones the page needs, which stay selected) and Select all. A block the template locks, or the last shown one of a block the page must
// have, is not hidden or removed. `sheet`: the blocks the page can have and its template.
function selectionBar(view: EditorView, sheet: BlockAsk | undefined, places: number[]): BlockBarState | null {
  const doc = view.state.doc;
  const rules = sheet?.template;
  const all = blocksOf(doc);
  const infos = places.flatMap((place) => {
    const node = doc.maybeChild(place);
    if (!node || node.type.name !== 'siteBlock') return [];
    const type: string = node.attrs.type;
    const block = type === HTML ? htmlBlock : sheet?.list.find((b) => b.type === type);
    const hidden = node.attrs.props?.hidden === true;
    const locked = !!rules?.locked?.includes(type);
    const shownOfType = all.filter((b) => b.type === type && !b.hidden).length;
    const last = !hidden && !!rules?.required?.includes(type) && shownOfType <= 1;
    const max = rules?.max?.[type];
    return [
      {
        place,
        node,
        hidden,
        locked,
        stays: locked || last,
        // A block that is always shown on the page has no Hide.
        noHide: !!block?.shown,
        more: max === undefined || all.filter((b) => b.type === type).length < max,
        name: String(block?.nameOf?.(node.attrs.props) ?? block?.label ?? type),
      },
    ];
  });
  if (!infos.length) return null;
  const at = (place: number) => doc.resolve(0).posAtIndex(place);
  const rows: CardRow[] = [];
  const one = infos.length === 1 ? infos[0] : null;
  if (one && !one.locked && one.more)
    rows.push({
      icon: duplicateIcon,
      label: t.text.duplicateBlock,
      action: () => blockSelection.own(() => view.dispatch(view.state.tr.insert(at(one.place) + one.node.nodeSize, one.node))),
    });
  const hide = hideChoice(infos.map((i) => ({ place: i.place, hidden: i.hidden, stays: i.stays || (i.noHide && !i.hidden) })));
  if (hide.targets.length)
    rows.push({
      icon: hide.action === 'hide' ? eyeSlashIcon : eyeIcon,
      label: hide.action === 'hide' ? t.text.hideOnPage : t.text.showOnPage,
      action: () => {
        const tr = view.state.tr;
        for (const place of hide.targets) {
          const node = doc.child(place);
          const { hidden: _, ...props } = node.attrs.props;
          tr.setNodeMarkup(at(place), undefined, { ...node.attrs, props: hide.action === 'hide' ? { ...props, hidden: true } : props });
        }
        blockSelection.own(() => view.dispatch(tr));
      },
    });
  const remove = removeChoice(infos);
  if (remove.targets.length)
    rows.push({
      icon: trashIcon,
      label: t.common.remove,
      danger: true,
      action: async () => {
        const named = (list: number[]) => infos.filter((i) => list.includes(i.place)).map((i) => i.name);
        if (!(await ask(t.text.removeBlocks(remove.targets.length, named(remove.targets), named(remove.skipped)), t.common.remove))) return;
        const tr = view.state.tr;
        for (const place of [...remove.targets].reverse()) tr.delete(at(place), at(place) + doc.child(place).nodeSize);
        blockSelection.own(() => view.dispatch(tr));
        // The blocks that stay are still selected, at their new places.
        blockSelection.set(remove.skipped.map((p) => p - remove.targets.filter((d) => d < p).length));
      },
    });
  rows.push({ icon: selectAllBlocksIcon, label: t.text.selectAllBlocks, action: () => blockSelection.set(allOf(blockPlaces(doc))) });
  // Move up and Move down move the selection together: disabled, with the reason, when the blocks are not next to each other or cannot go further.
  const parts: { gap: boolean; locked: boolean }[] = [];
  doc.forEach((child) =>
    parts.push({ gap: isGap(child), locked: child.type.name === 'siteBlock' && !!rules?.locked?.includes(child.attrs.type) }),
  );
  const moveAction = (by: -1 | 1): BarAction => {
    const plan = groupMove(parts, places, by);
    const why = plan.ok
      ? ''
      : plan.why === 'apart'
        ? t.text.moveApart
        : plan.why === 'locked'
          ? t.text.moveLocked
          : by < 0
            ? t.text.moveAtTop
            : t.text.moveAtBottom;
    return {
      label: by < 0 ? t.common.moveUp : t.common.moveDown,
      kind: by < 0 ? 'up' : 'down',
      disabled: !plan.ok,
      reason: why || undefined,
      action: () => plan.ok && moveGroup(view, plan, by),
    };
  };
  return {
    name: t.text.blocksSelected(infos.length),
    actions: [moveAction(-1), moveAction(1)],
    count: { n: infos.length, label: t.text.clearBlockSelection(infos.length), action: () => blockSelection.clear() },
    menu: rows,
  };
}

// The handle's disabled state while two or more blocks are selected: shown, not hidden (M3: "Disabled components can't be focused, dragged, or pressed"),
// with its reason as `aria-description` (screen readers) and `title` (mouse hover); M3 prints no other way to say why.
function dimHandle(handle: Element | null) {
  if (!handle) return;
  const off = blockSelection.places().length > 1;
  handle.toggleAttribute('aria-disabled', off);
  if (off) {
    handle.setAttribute('aria-description', t.text.dragOff);
    handle.setAttribute('title', t.text.dragOff);
  } else {
    handle.removeAttribute('aria-description');
    handle.removeAttribute('title');
  }
}

// The handle of a block: a button at the block's top right that moves it by dragging, as the start screen's cards are moved (DashboardEdit.tsx): the
// block is raised with the theme's elevation and follows the finger, a line shows where it will land, and it goes there when the finger is lifted (the parts
// glide, `move`). At once, not after a hold: the handle is a drag control. Not past a block the template locks (`locked`: their types); near the top or
// bottom of the screen the page scrolls by itself. Keyboard and screen reader users move a block with Move up and Move down (not this button, tabindex -1).
// A tap does nothing, or toggles the block while blocks are selected; a touch held still on it for half a second selects the block (`select`), and a move of
// more than 10 px before that starts the drag. The block's own place in the text is `top()`.
function blockHandle(
  view: EditorView,
  dom: HTMLElement,
  name: string,
  top: () => number | null,
  locked: string[] = [],
  select?: { tap: () => void; long: () => void },
) {
  const handle = dom.appendChild(document.createElement('button'));
  handle.type = 'button';
  handle.className = 'site-block-handle';
  handle.tabIndex = -1;
  handle.setAttribute('aria-label', t.text.dragBlock(name));
  handle.innerHTML = blockHandleIcon;
  // With two or more blocks selected the handle is disabled (the M3 disabled state): shown, not hidden, with its reason for screen readers and the mouse.
  const several = () => blockSelection.places().length > 1;
  dimHandle(handle);
  // The parts of the text at the top level (not the free lines), with where each is and whether the template locks it.
  const parts = () => {
    const found: { index: number; el: HTMLElement; locked: boolean }[] = [];
    view.state.doc.forEach((child, _, index) => {
      const el = partDOM(view, index);
      if (el && !isGap(child)) found.push({ index, el, locked: child.type.name === 'siteBlock' && locked.includes(child.attrs.type) });
    });
    return found;
  };
  let run: { id: number; startY: number; y: number; scroll: number; frame: number } | null = null;
  const scroller = () => {
    for (let box = dom.parentElement; box && box !== document.body; box = box.parentElement)
      if (/auto|scroll/.test(getComputedStyle(box).overflowY) && box.scrollHeight > box.clientHeight) return box;
    return null;
  };
  const marked: HTMLElement[] = [];
  const unmark = () => {
    for (const el of marked.splice(0)) el.classList.remove('site-part-drop-above', 'site-part-drop-below');
  };
  // Where it would land now: the places to move, and the line at the part it goes next to.
  const plan = () => {
    const i = top();
    const list = parts();
    const self = list.findIndex((p) => p.index === i);
    if (!run || self < 0) return { steps: 0, list, self };
    const steps = limitSteps(
      list.map((p) => p.locked),
      self,
      dragSteps(
        list.map((p) => {
          const r = p.el.getBoundingClientRect();
          return r.top + r.height / 2;
        }),
        self,
        run.y,
      ),
    );
    return { steps, list, self };
  };
  const follow = () => {
    if (!run) return;
    dom.style.transform = `translateY(${run.y - run.startY + (scrollNow() - run.scroll)}px)`;
    unmark();
    const { steps, list, self } = plan();
    const next = list[self + steps];
    if (steps && next) {
      next.el.classList.add(steps < 0 ? 'site-part-drop-above' : 'site-part-drop-below');
      marked.push(next.el);
    }
  };
  const scrollNow = () => (scroller()?.scrollTop ?? 0) + window.scrollY;
  const tick = () => {
    if (!run) return;
    const box = scroller();
    const bounds = box ? box.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
    const step = edgeScroll(run.y, bounds.top, bounds.bottom);
    if (step) (box ?? window).scrollBy(0, step);
    follow();
    run.frame = requestAnimationFrame(tick);
  };
  const stop = () => {
    settle();
    if (run) cancelAnimationFrame(run.frame);
    run = null;
    dom.style.transform = '';
    dom.classList.remove('site-block-dragging');
    unmark();
  };
  // The finger is down but has not moved (yet): a tap, a long press that selects, or the start of the drag.
  let pending: { id: number; x: number; y: number; timer: number; long: boolean } | null = null;
  const settle = () => {
    if (pending) clearTimeout(pending.timer);
    pending = null;
  };
  const lift = () => {
    if (!pending) return;
    const { id, y } = pending;
    settle();
    run = { id, startY: y, y, scroll: scrollNow(), frame: 0 };
    dom.classList.add('site-block-dragging');
    run.frame = requestAnimationFrame(tick);
  };
  handle.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    settle();
    pending = { id: e.pointerId, x: e.clientX, y: e.clientY, long: false, timer: 0 };
    if (several()) return;
    if (select && canPress(e.pointerType, e.isPrimary))
      pending.timer = window.setTimeout(() => {
        if (!pending) return;
        pending.long = true;
        navigator.vibrate?.(10);
        select.long();
      }, 500);
  });
  handle.addEventListener('pointermove', (e) => {
    if (pending?.id === e.pointerId && !pending.long && !several() && movedAway(pending, e.clientX, e.clientY)) lift();
    if (run?.id === e.pointerId) run.y = e.clientY;
  });
  handle.addEventListener('pointerup', (e) => {
    if (pending?.id === e.pointerId) {
      const tapped = !pending.long;
      settle();
      if (tapped && blockSelection.places().length) select?.tap();
      return;
    }
    if (run?.id !== e.pointerId) return;
    const { steps } = plan();
    stop();
    // One part at a time, as Move up and Move down do (the free lines between stay); the block's place follows it.
    let at = top();
    for (let n = 0; n < Math.abs(steps) && at !== null; n++) at = move(view, at, steps < 0 ? -1 : 1);
  });
  handle.addEventListener('pointercancel', stop);
  handle.addEventListener('keydown', (e) => e.key === 'Escape' && stop());
  return handle;
}

// A card (a block or an image) in the text that is not typed in place: tapping it selects it, and its tools are on the text's one bar
// (blockBar.ts): its Edit as the gear, and the rest of its items (Hide, Move up, Move down, Remove) in the bar's `⋮`. It stays selected until a tap
// or the focus goes elsewhere (not to the bar, its menus or a sheet) or Escape. `items`: its items as they are when it is selected; `tap`
// runs first on a tap (from expanded it opens the card's side panel). Returns how to leave it.
function cardBar(
  view: EditorView,
  dom: HTMLElement,
  card: HTMLElement,
  name: string,
  items: () => (CardItem | undefined | false | '')[],
  tap?: () => void,
) {
  const owner = {};
  let selected = false;
  const show = () => {
    const all = items().filter((it): it is CardItem => !!it);
    const edit = all.find((it) => it.icon === pencilIcon);
    blockBar.show(owner, {
      name,
      actions: [],
      edit: edit && { label: edit.label, action: () => edit.action(false) },
      menu: all.filter((it) => it !== edit),
    });
  };
  const away = (e: Event) => {
    const target = e.target;
    if (
      target instanceof Element &&
      (dom.contains(target) || target.closest('.editor-tools, .editor-menu, .editor-side-sheet, dialog[open]'))
    )
      return;
    leave();
  };
  const escape = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    leave();
    card.focus();
  };
  function leave() {
    if (!selected) return;
    selected = false;
    blockBar.hide(owner);
    card.setAttribute('aria-pressed', 'false');
    document.removeEventListener('pointerdown', away, true);
    document.removeEventListener('keydown', escape, true);
  }
  function select() {
    if (!selected) {
      selected = true;
      card.setAttribute('aria-pressed', 'true');
      document.addEventListener('pointerdown', away, true);
      document.addEventListener('keydown', escape, true);
    }
    show();
  }
  (dom as CardHost).select = select;
  card.setAttribute('aria-pressed', 'false');
  card.addEventListener('mousedown', (e) => e.preventDefault());
  // While a finger is on the card, the text cannot be written in: a phone does not put the cursor in
  // the text next to the card and open the keyboard (and a keyboard that is open closes).
  card.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || view.props.editable?.(view.state) === false) return;
    const before = view.props.editable;
    view.setProps({ editable: () => false });
    let timer = 0;
    const unlock = () => {
      clearTimeout(timer);
      card.removeEventListener('click', later);
      document.removeEventListener('pointercancel', unlock, true);
      view.setProps({ editable: before });
    };
    const later = () => setTimeout(unlock);
    card.addEventListener('click', later, { once: true });
    document.addEventListener('pointercancel', unlock, { capture: true, once: true });
    timer = window.setTimeout(unlock, 1000);
  });
  card.addEventListener('click', () => {
    tap?.();
    select();
  });
  return () => {
    leave();
    blockBar.hide(owner);
  };
}

// The address of an image from its sheet: with its format and crop after it, and marked when it is decorative
// (crop.mjs).
const imageSrc = (props: BlockProps) =>
  joinPicture(
    String(props.src),
    String(props.format ?? ''),
    (props.crop as number[] | null | undefined) ?? null,
    props.decorative === true,
  );

// An image in the text as a card like a block's, cut to its format, with a menu to change it
// (another image, its description for screen readers, its format), move it with its paragraph and
// remove it.
// sheet: where it is changed (the sheet of the blocks, BlockDialog.tsx).
function imageCard(node: Node, view: EditorView, getPos: () => number | undefined, sheet: () => BlockAsk | undefined) {
  const dom = document.createElement('span');
  dom.className = 'site-block site-picture';
  dom.contentEditable = 'false';
  const card = dom.appendChild(document.createElement('button'));
  card.type = 'button';
  card.className = 'site-block-card';
  card.setAttribute('aria-label', t.text.image);
  // Cut to its format as on the site (crop.mjs): in a box of the format.
  const { src, format, crop, decorative } = splitPicture(node.attrs.src);
  if (node.attrs.alt && !decorative) card.setAttribute('aria-description', node.attrs.alt);
  const cut = format ? cropStyle(format, crop) : null;
  const box = cut?.box ? card.appendChild(document.createElement('span')) : card;
  if (cut?.box) {
    box.className = 'picture-crop';
    box.style.cssText = cut.box;
  }
  const img = box.appendChild(document.createElement('img'));
  img.src = shownAt(src);
  img.alt = '';
  if (cut) img.style.cssText = cut.img;
  if (node.attrs.title) img.title = node.attrs.title;
  const describe = async () => {
    const props = await sheet()?.edit(IMAGE, { src, alt: node.attrs.alt ?? '', format, crop, decorative }, false, true);
    if (props === 'remove') return remove();
    const pos = getPos();
    if (!props || pos === undefined) return;
    view.dispatch(
      view.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: imageSrc(props), alt: String(props.alt ?? '').trim() }),
    );
  };
  const remove = () => {
    const pos = getPos();
    if (pos !== undefined) view.dispatch(view.state.tr.delete(pos, pos + node.nodeSize));
  };
  // From expanded an image's sheet is the side panel: a tap opens it, and the menu has no pen or trash (Remove is in the panel).
  const inPanelNow = () => editsInPanel(atLeastNow('expanded'), true);
  const close = cardBar(
    view,
    dom,
    card,
    t.text.image,
    () => {
      const pos = getPos();
      return [
        !inPanelNow() && { icon: pencilIcon, label: t.common.edit, action: describe },
        ...moves(view, pos === undefined ? null : view.state.doc.resolve(pos).index(0), sheet()?.template?.locked),
        !inPanelNow() && { icon: trashIcon, label: t.common.remove, action: remove, danger: true },
      ];
    },
    () => inPanelNow() && void describe(),
  );
  return { dom, update: () => false, stopEvent: () => true, ignoreMutation: () => true, destroy: close };
}

// The link where the cursor is, or in the selection: where it is (all of it, when the cursor is in it)
// and its address; null when there is none.
function linkAt(state: EditorView['state']) {
  const type = state.schema.marks.link;
  const { from, to, empty, $from } = state.selection;
  if (!empty) {
    let href = '';
    state.doc.nodesBetween(from, to, (n) => void (href ||= type.isInSet(n.marks)?.attrs.href ?? ''));
    return href ? { from, to, href } : null;
  }
  // The text with the same link around the cursor.
  type Run = { from: number; to: number; mark: Mark };
  const start = $from.start();
  let run: Run | null = null;
  let found = null as Run | null;
  $from.parent.forEach((child, offset) => {
    const mark = type.isInSet(child.marks);
    const a = start + offset;
    const b = a + child.nodeSize;
    if (mark && run && run.mark.eq(mark) && run.to === a) run.to = b;
    else run = mark ? { from: a, to: b, mark } : null;
    if (run && run.from < from && from < run.to) found = { ...run };
  });
  return found && { from: found.from, to: found.to, href: String(found.mark.attrs.href) };
}

// The toolbar's and the selection's "Link": the link sheet (LinkSheet.tsx), then the selection, or
// the link the cursor is in, gets the address, or loses its link; with nothing selected, the page's
// name (or the address) is put in as the link.
async function editLink(view: EditorView) {
  const link = linkAt(view.state);
  const answer = await askLink(link?.href ?? '');
  view.focus();
  if (!answer) return;
  const { state } = view;
  const type = state.schema.marks.link;
  const { from, to } = link ?? state.selection;
  if (from === to) {
    if (answer.href)
      view.dispatch(state.tr.insertText(answer.text, from).addMark(from, from + answer.text.length, type.create({ href: answer.href })));
    return;
  }
  const tr = state.tr.removeMark(from, to, type);
  view.dispatch(answer.href ? tr.addMark(from, to, type.create({ href: answer.href })) : tr);
}

/** What applies where the cursor is, or to all of the selection: 'strong', 'emphasis', 'link',
 * 'h2', 'h3', 'large', 'medium' (a paragraph, not in a list or quote), 'small', 'bullet', 'ordered' and 'quote'; with a colour
 * (text-colors.mjs) 'textColor' and the colour's class ('color-accent'). For the toolbar and the selection's menu,
 * 'section' and 'section-<colour>' in a top-level H1 or H2 (sectionState.mjs), which mark them. */
export function activeOf(state: EditorView['state']): Set<string> {
  const { selection, storedMarks, schema } = state;
  const { $from, from, to, empty } = selection;
  const on = new Set<string>();
  for (const name of ['strong', 'emphasis', 'link', 'textColor']) {
    const mark = schema.marks[name];
    if (empty ? mark.isInSet(storedMarks ?? $from.marks()) : state.doc.rangeHasMark(from, to, mark)) on.add(name);
  }
  const color = colorAt(state);
  if (color) on.add(colorClass(color));
  const ancestors = Array.from({ length: $from.depth }, (_, i) => $from.node(i + 1).type.name);
  if ($from.parent.type.name === 'heading') on.add(`h${$from.parent.attrs.level}`);
  if (labelledHeading(state)) on.add('labelable');
  // Body medium is the plain paragraph (and a paragraph stored as body-medium, which draws the same).
  if (['bodyLarge', 'bodyMedium', 'bodySmall'].includes($from.parent.type.name))
    on.add({ bodyLarge: 'large', bodyMedium: 'medium', bodySmall: 'small' }[$from.parent.type.name as 'bodyLarge']);
  if ($from.parent.type.name === 'eyebrow') on.add('label');
  // The alignment of the block at the top of the text the cursor is in (lib/text-align.mjs); 'alignable' when it can have one.
  if ($from.depth === 1 && alignable($from.parent)) {
    on.add('alignable');
    if ($from.parent.attrs.align === 'center' || $from.parent.attrs.align === 'right') on.add(`align-${$from.parent.attrs.align}`);
  }
  if (ancestors.includes('bullet_list')) on.add(isCheckItem(state) ? 'check' : 'bullet');
  // The size of the text of a list item (the mark textSize): small, large, or medium when it has none.
  if (inListItem(state)) {
    const size = sizeOfList(state);
    on.add(size ?? 'medium');
  }
  if (ancestors.includes('ordered_list')) on.add('ordered');
  if (ancestors.includes('blockquote')) on.add('quote');
  if ($from.parent.type.name === 'paragraph' && !on.has('bullet') && !on.has('check') && !on.has('ordered') && !on.has('quote'))
    on.add('medium');
  const section = sectionHeading(state);
  if (section) {
    on.add('section');
    on.add(`section-h${section.level}`);
    if (section.color) on.add(`section-${section.color}`);
  }
  return on;
}

// Whether the cursor is in a list item of any kind: a list item is not a heading, so the heading controls are not offered there.
function inListItem(state: EditorView['state']) {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) if ($from.node(d).type.name === 'list_item') return true;
  return false;
}

// Whether the cursor is in an item of a check list (a list item with a box, `- [ ]`).
function isCheckItem(state: EditorView['state']) {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) {
    const node = $from.node(d);
    if (node.type.name === 'list_item') return node.attrs.checked != null;
  }
  return false;
}

// The colour where the cursor is, or the first in the selection (text-colors.mjs); null without one.
function colorAt(state: EditorView['state']): string | null {
  const type = state.schema.marks.textColor;
  const { from, to, empty, $from } = state.selection;
  if (empty) return type.isInSet(state.storedMarks ?? $from.marks())?.attrs.color ?? null;
  let color: string | null = null;
  state.doc.nodesBetween(from, to, (n) => void (color ??= type.isInSet(n.marks)?.attrs.color ?? null));
  return color;
}

/** Gives the selection one of the site's colours (text-colors.mjs), or takes its colour away (null). */
export function paint(view: EditorView, color: string | null) {
  const { state } = view;
  const type = state.schema.marks.textColor;
  const { from, to } = state.selection;
  if (from === to) return view.focus();
  const tr = state.tr.removeMark(from, to, type);
  view.dispatch(color ? tr.addMark(from, to, type.create({ color })) : tr);
  view.focus();
}

// An icon given as raw SVG (the block's tools, contextualMenu.ts), as the component a bar button wants: drawn at 20 dp, once per SVG.
const rawIcons = new Map<string, typeof TextB>();
function rawIcon(svg: string): typeof TextB {
  let icon = rawIcons.get(svg);
  if (!icon) {
    const html = svg.replace('<svg', '<svg width="20" height="20" fill="currentColor" aria-hidden="true"');
    icon = (() => (
      <span aria-hidden="true" className="inline-flex" dangerouslySetInnerHTML={{ __html: html }} />
    )) as unknown as typeof TextB;
    rawIcons.set(svg, icon);
  }
  return icon;
}

// The icon of each text style and list kind, for the bar's Text style and List menus (the names are STYLE_KINDS, styleKind.mjs).
const KIND_ICONS = {
  small: { node: TextSmallIcon },
  medium: { node: TextMediumIcon },
  large: { node: TextLargeIcon },
  label: { node: Tag },
  quote: { node: Quotes },
  bullet: { node: ListBullets },
  check: { node: ListChecks },
  ordered: { node: ListNumbers },
};

// The icon of a button when its style is not on: the general text (T) and list icons.
const GENERIC_ICONS = {
  text: { node: TextT },
  list: { node: ListBullets },
};

// The alignments of a paragraph or a smaller heading (lib/text-align.mjs), each with its icon and name; left is the text's own.
const ALIGN_FACES = {
  left: { node: TextAlignLeft },
  center: { node: TextAlignCenter },
  right: { node: TextAlignRight },
};
type Align = keyof typeof ALIGN_FACES;
const alignLabel = (align: Align) => ({ left: t.text.alignLeft, center: t.text.alignCenter, right: t.text.alignRight })[align];

// The alignment where the cursor is, from activeOf's names: left when the block has none.
const alignIn = (active: Iterable<string>): Align => {
  const on = new Set(active);
  return on.has('align-center') ? 'center' : on.has('align-right') ? 'right' : 'left';
};

// Whether a block at the top of the text can be aligned: a paragraph, a body style or an H3 or smaller heading (not a heading that
// starts a section, a list, a quote or a label), so the line before it stays before it on the site.
const alignable = (node: Node) =>
  ['paragraph', 'bodyLarge', 'bodyMedium', 'bodySmall'].includes(node.type.name) || (node.type.name === 'heading' && node.attrs.level >= 3);

/** Aligns every top-level block the selection touches that can be aligned; left takes the alignment away. */
export function alignSelection(view: EditorView, align: Align) {
  const { state } = view;
  const { from, to } = state.selection;
  const tr = state.tr;
  state.doc.forEach((node, offset) => {
    if (offset + node.nodeSize <= from || offset > to || !alignable(node)) return;
    const next = align === 'left' ? null : align;
    if ((node.attrs.align ?? null) !== next) tr.setNodeMarkup(offset, undefined, { ...node.attrs, align: next });
  });
  if (tr.docChanged) view.dispatch(tr);
  view.focus();
}

type KindGroup = 'style' | 'list';

// The levels of the top-level headings of a document, in order.
const levelsOf = (doc: EditorView['state']['doc']): number[] => topHeadings(doc).map(({ node }) => node.attrs.level);

// Whether a heading that starts a section (H1 or H2) is selected, or a part of one.
function inSectionHeading(state: EditorView['state']) {
  let found = false;
  const { from, to } = state.selection;
  state.doc.nodesBetween(from, to, (n) => void (found ||= n.type.name === 'heading' && n.attrs.level <= 2));
  return found;
}

// Whether the cursor is in a label above a heading (eyebrow.mjs), which has no bold, italic, link or colour.
const inLabel = (state: EditorView['state']) =>
  ['eyebrow', 'bodyLarge', 'bodyMedium', 'bodySmall'].includes(state.selection.$from.parent.type.name);

// The blocks just put in that are typed in place (blockCard starts the first row of each).
const fresh = new WeakSet<object>();

// A block in the text as a card: the block as it looks on the site (its draw, src/apps/<app>/blocks/), in a thin frame;
// for screen readers its name and what is in it (describe in blocks.ts). Tapping it opens a row of
// icons on it to edit, hide or show, move and remove it. cards: how to draw the previews of the
// text again, when what they show from elsewhere has changed.
function blockCard(
  first: Node,
  view: EditorView,
  getPos: () => number | undefined,
  asker: () => BlockAsk | undefined,
  cards: Set<() => void>,
) {
  // The block's node: a block typed in place (inline) is changed without being drawn again (update), so the node follows.
  let node = first;
  const ask = asker();
  const block = node.attrs.type === HTML ? htmlBlock : ask?.list.find((b) => b.type === node.attrs.type);
  const hidden = node.attrs.props.hidden === true;
  // A block gone from the site by itself (a notice whose time is over) is greyed like a hidden one.
  const over = !!block?.over?.(node.attrs.props);
  // A block typed in place (InlineList.tsx): its card is not a button to tap but the block itself, with its menu on a handle.
  const inline = typedInPlace(block) && node.attrs.type !== HTML;
  const spec = block?.inline;
  const Inline = block?.inlineView!; // drawn only when `inline` (typedInPlace: it has a view)
  const dom = document.createElement('div');
  dom.className = hidden || over ? 'site-block site-block-hidden' : 'site-block';
  dom.contentEditable = 'false';
  const card = dom.appendChild(document.createElement(inline ? 'div' : 'button'));
  if (card instanceof HTMLButtonElement) card.type = 'button';
  else card.setAttribute('role', 'group');
  card.className = inline ? 'site-block-card site-block-inline' : 'site-block-card';
  const name = block?.nameOf?.(node.attrs.props) ?? block?.label ?? node.attrs.type;
  card.setAttribute('aria-label', name);
  if (hidden) {
    // An eye struck through in the corner (for screen readers it says so in the description).
    const badge = card.appendChild(document.createElement('span'));
    badge.className = 'site-block-hidden-badge';
    badge.innerHTML = eyeSlashIcon.replace('<svg', '<svg width="18" height="18" fill="currentColor" aria-hidden="true"');
  }
  const shown = card.appendChild(document.createElement('div'));
  shown.className = ask?.data.page ? 'site-block-preview site-block-section not-prose' : 'site-block-preview not-prose';
  // What is typed in place is for screen readers too; the image of any other block is not.
  if (!inline) shown.setAttribute('aria-hidden', 'true');
  const root = createRoot(shown);
  // Typed in place: which row is active (null: none, the block shows its live look), and the field to put the cursor in.
  let active: number | null = null;
  let focus: Focus | null = null;
  // A grid (the Table): the column of the active cell.
  let col: number | null = null;
  // Its tools in the text's one bar (blockBar.ts), made below: shown while a row is active.
  let bar: { refresh: (shown: boolean) => void; destroy: () => void } | null = null;
  let syncRow: (open: boolean) => void = () => {};
  // The row whose icon picker is open instead of its settings.
  let iconOf: number | null = null;
  const settings = () => {
    iconOf = null;
    dynOpen = false;
    syncRow(true);
  };
  // A block that can read a list ("Rows from"): the dynamic block is selected (its contextual menu shows) and its dynamic settings are in
  // the panel or sheet (`dynOpen`); `dropped`: its typed rows were just set aside by switching to a list, and Undo brings them back.
  let dynSelected = false;
  let dynOpen = false;
  let dropped = false;
  let stopAway = () => {};
  let syncDynamic: () => void = () => {};
  let undoDynamic: () => void = () => {};
  let pickPart: (part: string) => void = () => {};
  // A block with no list (Notice, Video): its props are its one item.
  const single = !!spec?.single;
  const rows = () => (single ? [node.attrs.props as Row] : ((node.attrs.props[spec?.item ?? 'items'] as Row[] | undefined) ?? []));
  const setItems = (items: Row[], patch?: Record<string, unknown>) => {
    const here = at();
    if (here && single) {
      // The typed fields of the one item are put in the props; one that is emptied is left out, as the text of the block would be.
      const props: BlockProps = { ...node.attrs.props };
      for (const [name, value] of Object.entries(items[0] ?? {})) {
        if (value === '' || value === undefined) delete props[name];
        else props[name] = value;
      }
      return void view.dispatch(view.state.tr.setNodeMarkup(here.pos, undefined, { ...node.attrs, props }));
    }
    if (here) {
      const props: BlockProps = { ...node.attrs.props, [spec?.item ?? 'items']: items };
      for (const [name, value] of Object.entries(patch ?? {})) {
        if (value === undefined) delete props[name];
        else props[name] = value;
      }
      view.dispatch(view.state.tr.setNodeMarkup(here.pos, undefined, { ...node.attrs, props }));
    }
  };
  const change = (c: Change) => {
    if ('active' in c) active = c.active ?? null;
    if (active !== null) dynOpen = false;
    if ('focus' in c) focus = c.focus ?? null;
    if ('col' in c) col = c.col ?? null;
    if (c.items || c.props) setItems(c.items ?? rows(), c.props);
    else draw();
  };
  const draw = () => {
    const ask = asker();
    if (!ask) return;
    if (inline) {
      card.setAttribute('aria-description', hidden ? t.text.hiddenOnPage : '');
      card.setAttribute('aria-label', block?.nameOf?.(node.attrs.props) ?? block?.label ?? node.attrs.type);
      // A List that reads a list ("Rows from"): its rows from the list are drawn as they are on the site, none are typed here.
      const dynamic = editorRows(node.attrs.props, ask.data);
      if (dynamic) {
        active = null;
        focus = null;
        flushSync(() =>
          root.render(
            <RowsFromList
              undo={dropped ? { note: t.blocks.rows.typedHidden, label: t.text.undo, run: undoDynamic } : undefined}
              parts={rowParts(node.attrs.props)?.map((p) => ({
                part: p.part,
                text: `${t.blocks.rows.parts[p.part]}: ${p.removed ? t.blocks.rows.removedField : p.nowLabel || t.blocks.rows.noField}`,
              }))}
              onPart={rowParts(node.attrs.props) ? (part) => pickPart(part) : undefined}
              rows={dynamic.rows}
              line={fromLine(node.attrs.props, ask.data)[0] ?? ''}
              empty={dynamic.rows.length === 0}
              editList={listPageOf(node.attrs.props) ? () => (location.hash = listPageOf(node.attrs.props)!) : undefined}
            />,
          ),
        );
        syncDynamic();
        bar?.refresh(dynSelected);
        return;
      }
      dropped = false;
      flushSync(() =>
        root.render(
          <Inline
            items={rows()}
            props={node.attrs.props}
            data={ask.data}
            active={active}
            col={col}
            focus={focus}
            onChange={change}
            onSettings={settings}
            onEdit={() => void edit()}
            onProps={(patch) => {
              const here = at();
              if (here)
                view.dispatch(
                  view.state.tr.setNodeMarkup(here.pos, undefined, { ...node.attrs, props: { ...node.attrs.props, ...patch } }),
                );
            }}
            onIcon={(row) => {
              // The row's icon slot, also on a row that is not active: the row becomes the active one and its icon picker opens at once, not the settings.
              iconOf = row;
              if (active !== row) change({ active: row, focus: null });
              syncRow(true);
            }}
          />,
        ),
      );
      syncRow(false);
      bar?.refresh(active !== null || dynSelected);
      return;
    }
    const lines = block ? describe(block, node.attrs.props, ask.data) : [];
    card.setAttribute('aria-description', [hidden ? t.text.hiddenOnPage : '', ...lines].filter(Boolean).join('. '));
    // Without an image of it, what is in it, in lines.
    const image = preview(node.attrs.type, node.attrs.props, ask.data) ?? (
      <div className="site-block-lines">
        {lines.map((line, i) => (
          <span key={i}>{line}</span>
        ))}
      </div>
    );
    flushSync(() => root.render(image));
  };
  // A block just put in (a new List) starts with its first row active and the cursor in it (known by its props, which the new node keeps).
  // The sheet it came from is closing and gives the focus back to what had it: wait until no sheet is open.
  if (inline && fresh.delete(node.attrs.props)) {
    let tries = 0;
    const start = () => {
      if (document.querySelector('dialog[open]') && tries++ < 30) return void setTimeout(start, 50);
      change({ active: 0, focus: { row: 0, field: spec!.fields[0] } });
    };
    setTimeout(start);
  }
  draw();
  cards.add(draw);

  const at = () => {
    const pos = getPos();
    return pos === undefined ? null : { pos, $pos: view.state.doc.resolve(pos) };
  };
  // Where the card is at the top of the text, to move it.
  const top = () => {
    const pos = getPos();
    return pos === undefined ? null : view.state.doc.resolve(pos).index(0);
  };
  // What the template (collections.ts) says of this block: a locked one is only edited, and the last shown one of a block
  // the page must have cannot be hidden or removed (stays).
  const keeps = () => {
    const rules = asker()?.template;
    const type = node.attrs.type;
    const locked = !!rules?.locked?.includes(type);
    const shownOfType = blocksOf(view.state.doc).filter((b) => b.type === type && b.hidden === false).length;
    // (Not written with "!" before "hidden", which Tailwind would take for a class for the site.)
    const last = hidden === false && !!rules?.required?.includes(type) && shownOfType <= 1;
    return { rules, locked, stays: locked || last };
  };
  const edit = async () => {
    const props = await asker()?.edit(node.attrs.type, node.attrs.props, false, !keeps().stays);
    if (props === 'remove') return remove();
    const here = at();
    // The block's fields as changed; still hidden if it was.
    if (props && here)
      view.dispatch(
        view.state.tr.setNodeMarkup(here.pos, undefined, { ...node.attrs, props: hidden ? { ...props, hidden: true } : props }),
      );
  };
  const toggle = () => {
    const here = at();
    if (!here) return;
    const { hidden: _, ...props } = node.attrs.props;
    view.dispatch(view.state.tr.setNodeMarkup(here.pos, undefined, { ...node.attrs, props: hidden ? props : { ...props, hidden: true } }));
  };
  const remove = () => {
    const here = at();
    if (here) view.dispatch(view.state.tr.delete(here.pos, here.pos + node.nodeSize));
  };

  // The choices that can be made here: no "Edit" without fields (but to where it is edited instead,
  // Block.edit), no move past the start or end. By the template (collections.ts): a locked block is
  // only edited, and the last shown one of a block the page must have cannot be hidden or removed.
  // From expanded the block's fields are in the side panel: a tap opens it, and the menu has no pen or trash (Remove is in the panel).
  const inPanelNow = () => !inline && editsInPanel(atLeastNow('expanded'), !!block?.fields.length);
  // The block's own menu: Edit, Hide or Show, Move up and down, Remove. A block typed in place has these in the text bar's `⋮` (blockBar.ts); any other block
  // opens them as a row on its card.
  const menuItems = () => {
    const i = top();
    const { rules, locked, stays } = keeps();
    return [
      block?.fields.length
        ? (!inline || (typeof spec?.blockSettings === 'function' ? spec.blockSettings(node.attrs.props) : spec?.blockSettings)) &&
          !inPanelNow() && { icon: pencilIcon, label: t.common.edit, action: edit }
        : block?.edit && { icon: pencilIcon, label: block.edit.text, action: () => leaveTo(`#${block.edit!.to}`) },
      // A block typed in place that reads a list of the site (Testimonials, Blog posts): the page of the list is in its menu too.
      inline && block?.fields.length && block.edit
        ? { icon: pencilIcon, label: block.edit.text, action: () => leaveTo(`#${block.edit!.to}`) }
        : undefined,
      block?.shown || (stays && hidden === false)
        ? undefined
        : { icon: hidden ? eyeIcon : eyeSlashIcon, label: hidden ? t.text.showOnPage : t.text.hideOnPage, action: toggle },
      ...(locked ? [] : moves(view, i, rules?.locked)),
      { icon: selectAllBlocksIcon, label: t.text.selectBlock, action: () => selectable.start() },
      stays || inPanelNow() ? undefined : { icon: trashIcon, label: t.common.remove, action: remove, danger: true },
    ];
  };
  // Selected with other blocks (a mark, a tap, a long press), and moved by dragging its handle, unless the template locks it.
  const selectable = blockSelectable(view, dom, card, top, inline);
  if (!keeps().locked) blockHandle(view, dom, name, top, keeps().rules?.locked, { tap: () => selectable.toggle(), long: selectable.start });
  // Typed in place: its tools are in the text's one bar (blockBar.ts), and its own menu is in the bar's `⋮`.
  if (inline) {
    const rowFieldsOf = (names: string[]) =>
      (single ? block!.fields : (block?.fields.find((f) => f.name === spec!.item)?.fields ?? [])).filter((f) => names.includes(f.name));
    // The settings (link and small heading) and the icon picker, which the row's icon slot opens.
    const itemNames = spec!.settings ?? (spec!.link ? [spec!.link] : []);
    const slotNames = spec!.media ?? (spec!.icon ? [spec!.icon] : []);
    const itemFields = rowFieldsOf(itemNames);
    // The icon slot of a List opens the icon picker; a card's media sheet has the media fields (what it shows, the icon picker open at once), and the first card's has the
    // block's one media choice for every card too (`blockMedia`).
    const iconFields = rowFieldsOf(slotNames).map((f) => ({ ...f, iconsOpen: true }));
    const blockNames = spec!.blockMedia ?? [];
    const blockFields = (block?.fields ?? []).filter((f) => blockNames.includes(f.name));
    // The block's own values that the item's fields depend on (a card's icon, image or video by the block's media).
    const blockValue = () =>
      Object.fromEntries(blockNames.map((n) => [n, node.attrs.props[n] ?? blockFields.find((f) => f.name === n)?.default ?? '']));
    const valueOf = (row: Row, names: string[]) => ({
      ...blockValue(),
      ...Object.fromEntries(
        names.map((n) => {
          const field = rowFieldsOf([n])[0];
          // A list (a card's buttons) is none, not an empty text; a switch is off.
          return [n, row[n] ?? field?.default ?? (field?.type === 'list' ? [] : field?.type === 'boolean' ? false : '')];
        }),
      ),
    });
    const setFields = (list: Row[], i: number, names: string[], v: BlockProps) =>
      single
        ? [
            {
              ...list[0],
              // A switch or a list (a block's tags) is kept as it is, a text as text.
              ...Object.fromEntries(names.map((n) => [n, typeof v[n] === 'boolean' || Array.isArray(v[n]) ? v[n] : String(v[n] ?? '')])),
            },
          ]
        : names.reduce(
            // A switch or a list (a price card's Highlighted and button) is kept as it is, a text as text.
            (items, n) =>
              setField(items, i, n, typeof v[n] === 'boolean' || Array.isArray(v[n]) ? v[n] : String(v[n] ?? ''), spec!.fields[0]),
            list,
          );
    // The block's props with its own media choice changed (from the first card's sheet) and the items changed, in one step.
    const setBlockAndItems = (items: Row[], v: BlockProps) => {
      const here = at();
      if (!here) return;
      const own = Object.fromEntries(blockNames.map((n) => [n, v[n]]));
      const props = { ...node.attrs.props, ...own, [spec!.item]: items };
      view.dispatch(view.state.tr.setNodeMarkup(here.pos, undefined, { ...node.attrs, props }));
    };
    // A block with no link, settings or icon (Steps) has no item sheet: no Link action, and no gear unless it has block settings.
    const compact = () => !atLeastNow('expanded');
    // The active row has something in it (the row actions are for a row, not for the empty one being started).
    // A grid (the Table): a row or a column of the active cell is added (before or after) or deleted; the cursor stays in the cell.
    const gridActions = (g: NonNullable<typeof spec>['grid'] & object, saved: string[][]): BarAction[] => {
      if (active === null) return [];
      // A new table has no rows yet: it is one empty cell, so the first row and column come from the menu too.
      const list = saved.length ? saved : [['']];
      const [r, c] = [active, col ?? 0];
      const width = list[0]?.length ?? 1;
      const own = node.attrs.props.columns;
      const go = (cells: string[][], row: number, column: number, columns: unknown = own) =>
        change({ items: cells as unknown as Row[], props: { columns }, active: row, col: column, focus: { row, field: String(column) } });
      // The alignment of the column of the active cell (`null`: automatic, by the cells); it stays in step as columns are added and deleted.
      const chosen = c < width ? chosenAlign(own, width)[c] : null;
      const aligned = (value: 'left' | 'center' | 'right' | null, kind: BarAction['kind'], label: string): BarAction => ({
        kind,
        label,
        pressed: chosen === value,
        action: () => go(list, r, c, withAlign(own, width, c, value)),
      });
      return [
        { kind: 'above', label: spec!.texts.addAbove, action: () => go(addRowAt(list, r), r, c) },
        { kind: 'below', label: spec!.texts.addBelow, action: () => go(addRowAt(list, r + 1), r + 1, c) },
        { kind: 'column-before', label: g.addColumnBefore, action: () => go(addColumnAt(list, c), r, c, columnAddedAt(own, width, c)) },
        {
          kind: 'column-after',
          label: g.addColumnAfter,
          action: () => go(addColumnAt(list, c + 1), r, c + 1, columnAddedAt(own, width, c + 1)),
        },
        ...(list.length > 1 && r < list.length
          ? [{ kind: 'delete-row' as const, label: g.deleteRow, action: () => go(removeRowAt(list, r), Math.min(r, list.length - 2), c) }]
          : []),
        ...((list[0]?.length ?? 1) > 1 && c < (list[0]?.length ?? 1)
          ? [
              {
                kind: 'delete-column' as const,
                label: g.deleteColumn,
                action: () => go(removeColumnAt(list, c), r, Math.min(c, width - 2), columnRemovedAt(own, width, c)),
              },
            ]
          : []),
        ...(c < width
          ? [
              aligned('left', 'align-left', g.alignLeft),
              aligned('center', 'align-center', g.alignCenter),
              aligned('right', 'align-right', g.alignRight),
              aligned(null, 'align-auto', g.alignAuto),
            ]
          : []),
      ];
    };
    const rowActions = (): BarAction[] => {
      const list = rows();
      if (spec!.grid) return gridActions(spec!.grid, list as unknown as string[][]);
      // A card's link is the bar's Link, also while the card is still empty (its sheet has the page and the buttons).
      if (
        !single &&
        !isDynamic() &&
        active !== null &&
        spec!.settings &&
        spec!.barLink !== false &&
        (active >= list.length || isEmptyRow(list[active]))
      )
        return [{ kind: 'link', label: spec!.texts.link ?? '', action: settings }];
      if (single || isDynamic() || active === null || active >= list.length || isEmptyRow(list[active])) return [];
      const i = active;
      const go = (items: Row[], to: number) => change({ items, active: to, focus: { row: to, field: spec!.fields[0] } });
      return [
        ...(itemNames.length && spec!.barLink !== false
          ? [{ kind: 'link' as const, label: spec!.texts.link ?? '', action: settings }]
          : []),
        ...(spec!.max === undefined || list.length < spec!.max
          ? [
              { kind: 'above' as const, label: spec!.texts.addAbove, action: () => go(addAt(list, i, spec!.fields[0]), i) },
              { kind: 'below' as const, label: spec!.texts.addBelow, action: () => go(addAt(list, i + 1, spec!.fields[0]), i + 1) },
            ]
          : []),
        ...(i > 0 ? [{ kind: 'up' as const, label: t.common.moveUp, action: () => go(moveBy(list, i, -1), i - 1) }] : []),
        ...(i < list.length - 1 ? [{ kind: 'down' as const, label: t.common.moveDown, action: () => go(moveBy(list, i, 1), i + 1) }] : []),
      ];
    };
    // The dynamic settings: where the rows come from (the block's `Rows from`, tags and How many, its own fields), live in the panel or sheet.
    // Only a block with `Rows from` has them. Switching to a list sets the typed rows aside (they stay in the file) and offers Undo.
    const dynamicNames = ['from', 'tags', 'howMany', 'button'];
    const dynamicFields = (block?.fields ?? []).filter((f) => dynamicNames.includes(f.name));
    const canDynamic = dynamicFields.some((f) => f.name === 'from');
    const isDynamic = () => !!sourceOf(node.attrs.props.from);
    const setProps = (props: BlockProps) => {
      const here = at();
      if (here) view.dispatch(view.state.tr.setNodeMarkup(here.pos, undefined, { ...node.attrs, props }));
    };
    const dynamicSpec = () => {
      const props = node.attrs.props;
      return {
        headline: block?.nameOf?.(props) ?? block?.label ?? node.attrs.type,
        fields: dynamicFields,
        value: Object.fromEntries(dynamicFields.map((f) => [f.name, props[f.name] ?? (f.multiple ? [] : '')])),
        onChange: (v: BlockProps) => {
          const now_ = node.attrs.props;
          const was = sourceOf(now_.from);
          const next = { ...now_ };
          for (const f of dynamicFields) {
            const value = v[f.name];
            if (value === undefined || value === '' || (Array.isArray(value) && !value.length)) delete next[f.name];
            else next[f.name] = value;
          }
          const now = sourceOf(next.from);
          // Another list has other tags and other fields: the tags and the choice of fields start over.
          if (was !== now) {
            delete next.tags;
            delete next.map;
          }
          dropped = !was && !!now && rows().some((r) => !isEmptyRow(r));
          if (!now) dropped = false;
          setProps(next);
        },
      };
    };
    // Updates the panel when it shows these settings (not another block's row).
    syncDynamic = () => {
      if (dynOpen) asker()?.row(dynamicSpec(), false);
    };
    const openDynamic = () => {
      iconOf = null;
      active = null;
      focus = null;
      dynSelected = true;
      dynOpen = true;
      asker()?.row(dynamicSpec(), true);
      draw();
    };
    undoDynamic = () => {
      dropped = false;
      const { from: _from, tags: _tags, howMany: _howMany, map: _map, ...rest } = node.attrs.props;
      setProps(rest);
      syncDynamic();
    };
    // A part of a row (top line, bottom line, icon, link) set to a field of the list: the choice is in the panel or sheet (a select, as the list is),
    // and changes the block at once. The block keeps only a choice the list does not make itself (`map`).
    pickPart = (part: string) => {
      const info = rowParts(node.attrs.props)?.find((p) => p.part === part);
      if (!info) return;
      const none = part !== 'title' ? [{ label: t.blocks.rows.noField, value: '' }] : [];
      iconOf = null;
      dynSelected = true;
      dynOpen = false;
      asker()?.row(
        {
          headline: t.blocks.rows.parts[part as keyof typeof t.blocks.rows.parts],
          fields: [
            {
              name: 'field',
              label: t.blocks.rows.fieldShown,
              type: 'select',
              options: [...none, ...info.choices.map((c) => ({ label: c.label, value: c.name }))],
            },
          ],
          value: { field: info.now ?? '' },
          closes: true,
          onChange: (v: BlockProps) => {
            const map = withPart(info.asRows, node.attrs.props.map, part as 'title', String(v.field ?? ''));
            const { map: _old, ...rest } = node.attrs.props;
            setProps(map ? { ...rest, map } : rest);
          },
        },
        true,
      );
      draw();
    };
    if (canDynamic)
      dom.addEventListener('pointerdown', () => {
        if (!isDynamic() || dynSelected) return;
        dynSelected = true;
        draw();
      });
    // A block that reads a list has the dynamic settings behind the gear; a block with nothing to set on an item has the block's own
    // settings behind it (the FAQ list), or no gear (Steps). From expanded the settings are in the side panel, so no gear there.
    const gear = () =>
      !compact()
        ? undefined
        : isDynamic()
          ? openDynamic
          : itemNames.length || slotNames.length
            ? settings
            : spec!.blockSettings === true
              ? () => void edit()
              : undefined;
    const owner = {};
    bar = {
      refresh(shown) {
        if (!shown) return blockBar.hide(owner);
        const action = gear();
        const state: BlockBarState = {
          name,
          actions: rowActions(),
          edit: action && { label: t.common.edit, action },
          dynamic: canDynamic ? { label: t.blocks.rows.dynamicTip, on: isDynamic(), action: openDynamic } : undefined,
          menu: menuItems().filter((it): it is CardItem => !!it),
        };
        blockBar.show(owner, state);
      },
      destroy: () => blockBar.hide(owner),
    };
    // The settings of the active row (its icon and link), live: from expanded in the side panel while a row is active, below it in a bottom
    // sheet that Edit opens (`open`: a row's slot or Edit; else only an open sheet is updated).
    syncRow = (open) => {
      const sheet = asker();
      if (sheet && active !== null && !dynOpen && (itemNames.length || slotNames.length)) sheet.row(specOf(active), open || !compact());
    };
    const specOf = (i: number) => {
      const row = rows()[i] ?? {};
      if (iconOf === i)
        return {
          headline: spec!.texts.icon ?? '',
          fields: i === 0 ? [...blockFields, ...iconFields] : iconFields,
          value: valueOf(row, slotNames),
          // The icon picker closes when an icon is picked; the media fields stay open for the next choice.
          closes: !spec!.media,
          onChange: (v: BlockProps) => {
            if (!spec!.media) iconOf = null;
            if (i === 0 && blockNames.length) setBlockAndItems(setFields(rows(), i, slotNames, v), v);
            else setItems(setFields(rows(), i, slotNames, v));
          },
        };
      return {
        headline: spec!.texts.settings ?? '',
        fields: itemFields,
        value: valueOf(row, itemNames),
        onChange: (v: BlockProps) => setItems(setFields(rows(), i, itemNames, v)),
      };
    };
    // Leaving the block (a tap or the focus elsewhere, but not in its toolbar, its menu or its settings): the row being edited is done,
    // its settings close, and a row with nothing in it is dropped.
    const inside = (target: EventTarget | null) =>
      target instanceof Element &&
      (dom.contains(target) || !!target.closest('.editor-tools, .editor-menu, .editor-side-sheet, dialog[open]'));
    const away = (e: Event) => {
      if ((active === null && !dynSelected) || inside(e.target)) return;
      // A dynamic block has no row being typed in: the focus going back to the text (as a sheet opens or closes) is not leaving it, only a tap elsewhere is.
      if (e.type === 'focusin' && active === null) return;
      active = null;
      col = null;
      iconOf = null;
      focus = null;
      dynSelected = false;
      dynOpen = false;
      asker()?.row(null);
      const list = rows();
      // A grid loses the empty rows and columns at its end (what was started in the next one and left); a list its empty rows.
      const kept = spec!.grid ? (trimmed(list as unknown as string[][]) as unknown as Row[]) : single ? list : withoutEmpty(list);
      const cut = spec!.grid ? columnsCut(node.attrs.props.columns, (kept as unknown as string[][])[0].length) : undefined;
      if (
        spec!.grid
          ? JSON.stringify(kept) !== JSON.stringify(list) || JSON.stringify(cut) !== JSON.stringify(node.attrs.props.columns)
          : kept !== list
      )
        setItems(kept, spec!.grid ? { columns: cut } : undefined);
      else draw();
    };
    document.addEventListener('pointerdown', away, true);
    document.addEventListener('focusin', away, true);
    stopAway = () => {
      document.removeEventListener('pointerdown', away, true);
      document.removeEventListener('focusin', away, true);
    };
  }
  // A block typed in place has its tools on the bar through `bar` (rows); any other block is selected by a tap (cardBar).
  const close = inline ? () => {} : cardBar(view, dom, card, name, menuItems, () => inPanelNow() && void edit());
  // A changed block is drawn anew (update false); taps on the card and its menu are not ProseMirror's.
  return {
    dom,
    // Typed in place: the same block with other rows is kept (the cursor stays in the row); anything else is drawn again.
    update: (next: Node) => {
      if (!inline || next.type !== node.type || next.attrs.type !== node.attrs.type || (next.attrs.props.hidden === true) !== hidden)
        return false;
      node = next;
      draw();
      return true;
    },
    stopEvent: () => true,
    ignoreMutation: () => true,
    destroy: () => {
      close();
      selectable.destroy();
      stopAway();
      bar?.destroy();
      if (inline) asker()?.row(null);
      cards.delete(draw);
      // Not while React may be drawing (the editor goes with its form).
      queueMicrotask(() => root.unmount());
    },
  };
}

export default forwardRef<MarkdownHandle, Props>(function MarkdownEditor(
  { value, onChange, addImage, blocks, sheet: sheetProp, short, h1, startFocused, onH1, looks, sections, frame },
  ref,
) {
  const spaced = !!blocks;
  const framed = frame ?? !sections;
  const root = useRef<HTMLDivElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const editor = useRef<Editor | null>(null);
  const changed = useRef(onChange);
  changed.current = onChange;
  const h1Changed = useRef(onH1);
  h1Changed.current = onH1;
  const sheeted = useRef(blocks ?? sheetProp);
  sheeted.current = blocks ?? sheetProp;
  const looked = useRef(looks);
  looked.current = looks;
  // What applies where the cursor is (activeOf), marked in the toolbar.
  const [active, setActive] = useState<string[]>([]);
  // Whether the cursor is in the text (the field has the focus): else the text style button shows the generic H icon (styleKind.mjs).
  const [inText, setInText] = useState(false);
  // The heading levels the toolbar offers on a page (headingChoices): [1] while the text has no H1, then [2, 3].
  const [choices, setChoices] = useState<number[]>([1]);
  // The words there have no colour (a label above a heading, the name of a section): the Color tool is off.
  const [noColor, setNoColor] = useState(false);
  // A sheet that the bar opened (Settings, a link, Insert) is open: it blurs the text, but the bar keeps its text tools until it closes.
  const [holding, setHolding] = useState(false);
  // The button that opened a menu with the kinds of text (Text style, List), while it is open.
  const [kindsAt, setKindsAt] = useState<{ at: HTMLElement; group: KindGroup } | null>(null);
  // The `⋮` button, and the menu under it while it is open; the Alignment and Color menus of its rows open under it too.
  const moreButton = useRef<HTMLButtonElement>(null);
  const [moreAt, setMoreAt] = useState<HTMLElement | null>(null);
  const [colorAt, setColorAt] = useState<HTMLElement | null>(null);
  // The bar's width, in dp, measured with a ResizeObserver (never a timer): how many tools fit (textBar.mjs).
  const [barWidth, setBarWidth] = useState(0);
  // The alignment button that opened its menu, while it is open.
  const [alignAt, setAlignAt] = useState<HTMLElement | null>(null);
  useEffect(() => {
    alignAt?.setAttribute('aria-expanded', 'true');
    return () => alignAt?.setAttribute('aria-expanded', 'false');
  }, [alignAt]);
  // The previews of the blocks, drawn again when what they show from elsewhere changes: the lists,
  // the testimonials, the rest of the site, the page's address or a fixed page's other fields.
  const cards = useRef(new Set<() => void>());
  const data = blocks?.data;
  useEffect(
    () => queueMicrotask(() => cards.current.forEach((draw) => draw())),
    [data?.lists, data?.testimonials, data?.site, data?.path, data?.page?.values],
  );

  useEffect(() => {
    let cancelled = false;
    // Tell the form as soon as the text changes (Milkdown's own listener waits 200 ms); not for the
    // free lines put in as the text is loaded.
    let loaded = false;
    const marking = $prose(
      () =>
        new Plugin({
          view: (view) => {
            const focus = () => setInText(view.hasFocus());
            view.dom.addEventListener('focus', focus);
            view.dom.addEventListener('blur', focus);
            return {
              destroy: () => {
                view.dom.removeEventListener('focus', focus);
                view.dom.removeEventListener('blur', focus);
              },
              update: (view) => {
                focus();
                const next = headingChoices(levelsOf(view.state.doc));
                setChoices((was) => (was.join() === next.join() ? was : next));
                // On a page the first heading is the H1 by itself (firstHeading.mjs); the Heading button stands for it.
                const now = [...activeOf(view.state)].map((name) => (h1 && name === 'h1' ? 'h2' : name)).sort();
                setActive((was) => (was.join() === now.join() ? was : now));
                setNoColor(inLabel(view.state) || (!!sections && inSectionHeading(view.state)));
              },
            };
          },
        }),
    );
    // On a page, a change of its H1's text is told too (onH1), with what it was.
    const onEdit = $prose(
      () =>
        new Plugin({
          view: () => ({
            update: (view, prev) => {
              if (!loaded || view.state.doc.eq(prev.doc)) return;
              changed.current();
              if (!h1) return;
              const [before, now] = [h1TextOf(prev.doc), h1TextOf(view.state.doc)];
              if (now !== before) h1Changed.current?.(now, before);
            },
          }),
        }),
    );
    const imageView = $view(imageSchema.node, () => (node, view, getPos) => imageCard(node, view, getPos, () => sheeted.current));
    const cardView = $view(
      siteBlockSchema.node,
      () => (node, view, getPos) => blockCard(node, view, getPos, () => sheeted.current, cards.current),
    );
    // The look of each part on the site, as data-look on it.
    const looking = $prose(
      () =>
        new Plugin({
          props: {
            decorations: (state) => {
              const looks = looked.current;
              if (!looks) return null;
              const nodes: { node: Node; pos: number }[] = [];
              state.doc.forEach((node, pos) => void nodes.push({ node, pos }));
              const marks = looks(nodes.map(({ node }) => lookItem(node)));
              return DecorationSet.create(
                state.doc,
                nodes.flatMap(({ node, pos }, i) =>
                  marks[i] ? [Decoration.node(pos, pos + node.nodeSize, { 'data-look': marks[i]! })] : [],
                ),
              );
            },
          },
        }),
    );
    let made = makeEditor(root.current, value)
      .use(cardView)
      .use(imageView)
      .use(cardDeletes)
      .use(marking)
      .use(blockSelecting)
      .use(onEdit)
      .use(looking)
      .use(sectionFrame(framed))
      .use(gapHere)
      .use(hintTap)
      .use(tapBelow)
      .use(checkToggle)
      .use(history)
      .use(clipboard);
    // A page (h1) keeps its first heading as its H1 and has no other H1 (firstHeading.mjs); a blog post's H1 is its title.
    if (h1) made = made.use(firstHeading);
    (spaced ? made.use(spacing) : made).create().then((created) => {
      if (cancelled) return created.destroy();
      editor.current = created;
      // The free lines between the blocks of the text as it is loaded, and the cursor in the first,
      // so a key pressed before the text is tapped does not replace the first block.
      if (spaced)
        created.action((ctx) => {
          const view = ctx.get(editorViewCtx);
          view.dispatch(view.state.tr.setMeta('addToHistory', false));
          view.dispatch(view.state.tr.setSelection(Selection.atStart(view.state.doc)).setMeta('addToHistory', false));
        });
      // A new page: the cursor at the start, in plain text, never an H1.
      if (startFocused)
        created.action((ctx) => {
          const view = ctx.get(editorViewCtx);
          view.dispatch(view.state.tr.setSelection(Selection.atStart(view.state.doc)).setMeta('addToHistory', false));
          view.focus();
        });
      loaded = true;
    });
    return () => {
      cancelled = true;
      editor.current?.destroy();
      editor.current = null;
    };
    // The editor is made once per file; the parent gives each file its own key.
  }, []);

  useImperativeHandle(ref, () => ({
    markdown: () => editor.current?.action(markdownOf) ?? null,
    parts: () => editor.current?.action(partsOf) ?? null,
    h1: () => editor.current?.action((ctx) => h1TextOf(ctx.get(editorViewCtx).state.doc)),
    bare: () =>
      !!editor.current?.action((ctx) => {
        let bare = true;
        const h1Node = h1Of(ctx.get(editorViewCtx).state.doc)?.node;
        ctx.get(editorViewCtx).state.doc.forEach((node) => {
          if (node !== h1Node && node.type.name !== 'siteBlock' && node.textContent.trim()) bare = false;
        });
        return bare;
      }),
    showBlock: (at) =>
      editor.current?.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        let n = -1;
        view.state.doc.forEach((node, pos) => {
          if (node.type.name !== 'siteBlock' || ++n !== at) return;
          const el = view.nodeDOM(pos);
          if (!(el instanceof HTMLElement)) return;
          for (const old of view.dom.querySelectorAll('.editor-wrong')) old.classList.remove('editor-wrong');
          void el.offsetWidth;
          el.classList.add('editor-wrong');
          el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        });
      }),
    removeEmptyRows: (at) =>
      editor.current?.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        let tr = view.state.tr;
        let n = -1;
        // From the end, so the places of the blocks before it stay.
        const blocks: { pos: number; node: Node; at: number }[] = [];
        view.state.doc.forEach((node, pos) => node.type.name === 'siteBlock' && blocks.push({ pos, node, at: ++n }));
        for (const { pos, node, at: i } of blocks.reverse()) {
          if (node.attrs.props?.hidden || (at !== undefined && at !== i)) continue;
          const left = leaveOut(node.attrs.type, node.attrs.props);
          if (left === undefined) continue;
          tr = left === null ? tr.delete(pos, pos + node.nodeSize) : tr.setNodeMarkup(pos, undefined, { ...node.attrs, props: left });
        }
        if (tr.docChanged) view.dispatch(tr);
      }),
    setH1: (text) =>
      editor.current?.action((ctx) => {
        const view = ctx.get(editorViewCtx);
        const tr = h1Written(view.state, text);
        if (tr) view.dispatch(tr.setMeta('addToHistory', false));
      }),
  }));

  function run<T>(command: { key: CmdKey<T> }, payload?: T) {
    editor.current?.action(callCommand(command.key, payload));
  }

  // Makes the text where the cursor is a heading ('h1', 'h2', 'h3'), a paragraph ('medium'), a list
  // ('bullet', 'ordered') or a quote ('quote'), whatever it is now: a list becomes the other kind of
  // list, and the text of a list or a quote comes out of it to be something else.
  function setKind(kind: string) {
    editor.current?.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { schema, selection } = view.state;
      const is = (k: string) => activeOf(view.state).has(k);
      const outOfLists = () => {
        for (
          let i = 0;
          i < 10 && (is('bullet') || is('check') || is('ordered')) && liftListItem(schema.nodes.list_item)(view.state, view.dispatch);
          i++
        );
      };
      const outOfQuotes = () => {
        for (let i = 0; i < 10 && is('quote') && lift(view.state, view.dispatch); i++);
      };
      // A size picked in a list item keeps the list: the text of the items has the size (a mark, lib/text-sizes.mjs).
      if (['small', 'medium', 'large'].includes(kind) && (is('bullet') || is('check') || is('ordered'))) {
        sizeListText(view, kind);
        return view.focus();
      }
      if (kind === 'label') {
        toggleLabel(view);
        return view.focus();
      }
      // The text styles that are a block of their own (Body large and Body small): a paragraph or a heading made into it,
      // or back. Body medium is the plain paragraph.
      const ownBlocks = ['bodyLarge', 'bodyMedium', 'bodySmall', 'eyebrow'];
      if (kind === 'large' || kind === 'small') {
        outOfLists();
        outOfQuotes();
        if (is('h1') || is('h2') || is('h3')) callCommand(turnIntoTextCommand.key)(ctx);
        const { $from } = view.state.selection;
        if ($from.parent.type.name !== 'heading') {
          // Its alignment goes with it.
          const align = $from.parent.attrs.align ?? null;
          view.dispatch(view.state.tr.setNodeMarkup($from.before(), schema.nodes[kind === 'small' ? 'bodySmall' : 'bodyLarge'], { align }));
        }
        return view.focus();
      }
      if (ownBlocks.includes(view.state.selection.$from.parent.type.name)) {
        const { $from } = view.state.selection;
        view.dispatch(view.state.tr.setNodeMarkup($from.before(), schema.nodes.paragraph, { align: $from.parent.attrs.align ?? null }));
        if (kind === 'medium') return view.focus();
      }
      // The items of the bulleted list the cursor is in get a box (checked false) or lose it (null): a check list.
      const mark = (checked: boolean | null) => {
        const { state } = view;
        const { $from } = state.selection;
        for (let d = $from.depth; d > 0; d--) {
          if ($from.node(d).type.name === 'bullet_list') {
            const tr = state.tr;
            const list = $from.node(d);
            const start = $from.before(d);
            list.forEach((item, offset) => tr.setNodeMarkup(start + 1 + offset, undefined, { ...item.attrs, checked }));
            view.dispatch(tr);
            return;
          }
        }
      };
      // A list picked again, while the cursor is in it, takes the text out of the list.
      if (kind === 'check' || kind === 'bullet' || kind === 'ordered') {
        if (is(kind)) {
          outOfLists();
          return view.focus();
        }
      }
      if (kind === 'check') {
        // A check list is a bulleted list whose items have a box (`- [ ]`).
        if (!is('bullet')) setKind('bullet');
        mark(false);
        return view.focus();
      }
      if (kind === 'quote') {
        if (!is('quote')) {
          outOfLists();
          if (is('h1') || is('h2') || is('h3')) callCommand(turnIntoTextCommand.key)(ctx);
          callCommand(wrapInBlockquoteCommand.key)(ctx);
        }
        return view.focus();
      }
      if (kind === 'bullet' && is('check')) {
        mark(null);
        return view.focus();
      }
      if (kind === 'bullet' || kind === 'ordered') {
        const list = schema.nodes[kind === 'bullet' ? 'bullet_list' : 'ordered_list'];
        const { $from } = view.state.selection;
        for (let d = $from.depth; d > 0; d--) {
          const node = $from.node(d);
          if (node.type.name !== 'bullet_list' && node.type.name !== 'ordered_list') continue;
          if (node.type !== list) view.dispatch(view.state.tr.setNodeMarkup($from.before(d), list, { spread: node.attrs.spread }));
          return view.focus();
        }
        outOfQuotes();
        if (is('h1') || is('h2') || is('h3')) callCommand(turnIntoTextCommand.key)(ctx);
        callCommand((kind === 'bullet' ? wrapInBulletListCommand : wrapInOrderedListCommand).key)(ctx);
        return view.focus();
      }
      outOfLists();
      outOfQuotes();
      if (kind === 'medium') callCommand(turnIntoTextCommand.key)(ctx);
      else callCommand(wrapInHeadingCommand.key, Number(kind.slice(1)))(ctx);
      view.focus();
    });
  }

  function link() {
    editor.current?.action((ctx) => void holdWhile(editLink(ctx.get(editorViewCtx))));
  }

  function color(name: string | null) {
    editor.current?.action((ctx) => paint(ctx.get(editorViewCtx), name));
  }

  // Runs what a sheet from the bar asks (Settings, a link, Insert): the bar keeps its text tools while it is open.
  async function holdWhile<T>(task: Promise<T>) {
    setHolding(true);
    try {
      return await task;
    } finally {
      setHolding(false);
    }
  }

  // The sheet with the settings of the section the cursor is in (its colour, image and width), then those set.
  async function sectionSettings() {
    let current: ReturnType<typeof sectionHeading> = null;
    editor.current?.action((ctx) => void (current = sectionHeading(ctx.get(editorViewCtx).state)));
    const at = current as ReturnType<typeof sectionHeading>;
    if (!at) return;
    const answered = await holdWhile(Promise.resolve((blocks ?? sheetProp)?.section(at, { image: true })));
    if (!answered) return;
    editor.current?.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      setSection(view, answered);
      view.focus();
    });
  }

  // A new image from the gallery, then the sheet with it and what it shows, where it can still be
  // changed or left out (the browser's own box for what it shows without a sheet).
  async function image() {
    const src = await holdWhile(addImage!());
    if (!src) return;
    const sheet = blocks ?? sheetProp;
    const picked = await sheet?.edit(IMAGE, { src, alt: '' }, true);
    if (picked && picked !== 'remove') run(insertImageCommand, { src: imageSrc(picked), alt: String(picked.alt ?? '').trim() });
  }

  // Puts the chosen block where the cursor is (a paragraph is split around it), or after the block
  // that is selected. With no text after it, an empty paragraph follows, where the cursor goes, so
  // the next text or block comes after it instead of replacing it.
  async function block() {
    // The blocks and images in the text now, for how many of a type there may be (the template).
    let have: string[] = [];
    editor.current?.action((ctx) => {
      const doc = ctx.get(editorViewCtx).state.doc;
      have = blocksOf(doc).map((b) => b.type);
      doc.descendants((n) => void (n.type.name === 'image' && have.push(IMAGE)));
    });
    const chosen = await holdWhile(blocks!.choose({ image: !!addImage, have }));
    if (!chosen) return;
    if (chosen.type === IMAGE) return image();
    editor.current?.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { state } = view;
      const node = siteBlockSchema.type(ctx).create({ type: chosen.type, props: chosen.props });
      if (typedInPlace(blocks!.list.find((b) => b.type === chosen.type))) fresh.add(chosen.props);
      // At the top level of the text, never inside a list item or a quote (a block there is drawn indented and written indented).
      // `end`: where the new block ends, when the cursor must be moved past it (-1: it is in text already).
      let { tr, end } = insertBlock(state, node);
      if (end >= 0) {
        if (!tr.doc.resolve(end).nodeAfter?.isTextblock) tr = tr.insert(end, state.schema.nodes.paragraph.create());
        tr = tr.setSelection(TextSelection.create(tr.doc, end + 1));
      }
      // A section whose heading is written above its card gets one, its name, selected to write over.
      const chosenBlock = blocks!.list.find((b) => b.type === chosen.type);
      if (chosenBlock?.lead?.heading) {
        let at = -1;
        tr.doc.forEach((n: Node, offset: number) => void (n === node && (at = offset)));
        if (at >= 0) {
          tr = tr.insert(at, state.schema.nodes.heading.create({ level: 2 }, state.schema.text(chosenBlock.label)));
          tr = tr.setSelection(TextSelection.create(tr.doc, at + 1, at + 1 + chosenBlock.label.length));
        }
      }
      view.dispatch(tr.scrollIntoView());
      view.focus();
    });
  }

  // The one bar (textBar.mjs): the text tools while the cursor is in the text (or a sheet of the bar is open), a divider, then the main tools
  // (Insert, Undo, Redo, Section settings). It never scrolls: the tools that do not fit are in the `⋮` menu.
  // A block typed in place that is active (blockBar.ts) has its tools on the bar instead of the text's.
  const activeBlock = useSyncExternalStore(blockBar.subscribe, blockBar.get);
  // Blocks selected with each other (blockSelection.ts): their tools are on the bar instead of any one block's.
  const picked = useSyncExternalStore(blockSelection.subscribe, blockSelection.get);
  const selecting = picked.places.length > 0;
  const selectionState = selecting
    ? (editor.current?.action((ctx) => selectionBar(ctx.get(editorViewCtx), sheeted.current, picked.places)) ?? null)
    : null;
  const block_ = selectionState ?? activeBlock;
  // Escape ends it, Ctrl or Cmd+A selects all the blocks, and Back (a phone's gesture or button) ends it and stays on the page, as in the lists (useSelection.ts).
  useEffect(() => {
    if (!selecting) return;
    const key = (e: KeyboardEvent) => {
      if (document.querySelector('dialog:modal')) return;
      if (e.key === 'Escape') blockSelection.clear();
      else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        editor.current?.action((ctx) => blockSelection.set(allOf(blockPlaces(ctx.get(editorViewCtx).state.doc))));
      }
    };
    document.addEventListener('keydown', key, true);
    window.history.pushState({ ...window.history.state, blockSelection: true }, '');
    const back = () => {
      if (!(window.history.state as { blockSelection?: boolean } | null)?.blockSelection) blockSelection.clear();
    };
    window.addEventListener('popstate', back);
    return () => {
      document.removeEventListener('keydown', key, true);
      window.removeEventListener('popstate', back);
      if ((window.history.state as { blockSelection?: boolean } | null)?.blockSelection) window.history.back();
    };
  }, [selecting]);
  // Nothing is selected when the editor opens or goes.
  useEffect(() => {
    blockSelection.clear();
    return () => blockSelection.clear();
  }, []);
  const textContext = !block_ && (inText || holding);
  const inContext = textContext || !!block_;
  const headingLevels = h1 ? choices : [2, 3];
  const alignOn = active.includes('alignable');
  const alignNow = alignIn(active);
  const styleKey = styleOf(active, true);
  const listKey = listKindOf(active, true);
  const STYLE_FACES: Record<string, { label: string; icon: typeof TextB }> = {
    h1: { label: t.text.pageHeading, icon: TextHOne },
    h2: { label: t.text.heading, icon: TextHTwo },
    h3: { label: t.text.subheading, icon: TextHThree },
    small: { label: t.text.bodySmall, icon: KIND_ICONS.small.node },
    medium: { label: t.text.bodyMedium, icon: KIND_ICONS.medium.node },
    large: { label: t.text.bodyLarge, icon: KIND_ICONS.large.node },
    label: { label: t.text.label, icon: KIND_ICONS.label.node },
    quote: { label: t.text.quote, icon: KIND_ICONS.quote.node },
  };
  const LIST_FACES: Record<string, { label: string; icon: typeof TextB }> = {
    bullet: { label: t.text.bulletList, icon: KIND_ICONS.bullet.node },
    check: { label: t.text.checkList, icon: KIND_ICONS.check.node },
    ordered: { label: t.text.orderedList, icon: KIND_ICONS.ordered.node },
  };
  // In the Text style menu the three body styles share one icon, Aa; the labels tell them apart (the bar's own button shows the style's T).
  const rowIcon = (row: string) => (['small', 'medium', 'large'].includes(row) ? AaIcon : STYLE_FACES[row].icon);
  const styleFace = STYLE_FACES[styleKey] ?? { label: t.text.kind, icon: GENERIC_ICONS.text.node };
  const styleLabel = STYLE_FACES[styleKey] ? t.text.kindIs(styleFace.label) : t.text.kind;
  const listFace = LIST_FACES[listKey];
  const lists = listRows(active);
  const settingsShown =
    framed && active.includes('section') && !(sections && active.includes('section-h1')) && !!(blocks ?? sheetProp) && textContext;
  const insertLabel = blocks ? t.text.insertBlock : t.text.image;
  const hasInsert = !!blocks || !!addImage;
  const contextIds = block_
    ? [...(block_.count ? ['block:count'] : []), ...blockToolIds(block_).map((id) => `block:${id}`)]
    : textContext
      ? ['bold', 'italic', 'link', 'style', ...(lists.length ? ['list'] : []), 'align', 'color']
      : [];
  const blockMenu = block_?.menu ?? [];
  // Undo, Redo and Section settings, a divider, then Insert block (never in the ⋮) and the ⋮.
  // While blocks are selected the text is read-only, so Insert block is not offered (and the bar has room for Move up and Move down on a phone).
  const insertShown = hasInsert && !block_?.count;
  const mainIds = ['undo', 'redo', ...(settingsShown ? ['settings'] : []), ...(insertShown ? ['insert'] : [])];
  useLayoutEffect(() => {
    const bar = toolbar.current!;
    const measure = () => setBarWidth(bar.clientWidth);
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(bar);
    return () => watch.disconnect();
  }, []);
  // A menu of one of the ⋮ menu's rows is open under the ⋮ button.
  const underMore = [kindsAt?.at, alignAt, colorAt].some((at) => !!at && at === moreButton.current);
  const plan = planBar({
    // The count with its cross is two slots wide.
    slots: slotsFor(barWidth, (contextIds.length > 0 ? 1 : 0) + (insertShown ? 1 : 0)) - (block_?.count ? 1 : 0),
    context: contextIds,
    main: mainIds,
    more: blockMenu.length > 0,
  });
  // The bar's motion (barMotion.mjs): the contextual tools slide in from the left and push the main tools right when a context starts, slide out
  // when it ends, and fade in place from one context to another. FLIP: the new layout is measured, then the old place is animated from, with the
  // theme's springs only (motionTiming) and none at all for a visitor who asked for reduced motion. The bar's height and the dividers never move.
  const contextKey = block_ ? (block_.count ? 'block:selection' : `block:${block_.name}`) : textContext ? 'text' : '';
  const slideRow = useRef<HTMLDivElement>(null);
  const contextBox = useRef<HTMLDivElement>(null);
  const mainBox = useRef<HTMLDivElement>(null);
  const slid = useRef<{ key: string; mainLeft: number; ghost: HTMLElement | null } | null>(null);
  useLayoutEffect(() => {
    const row = slideRow.current;
    const main = mainBox.current;
    if (!row || !main) return;
    const context = contextBox.current;
    const mainLeft = main.offsetLeft;
    const was = slid.current;
    const kind = was ? barSlideKind(was.key, contextKey) : 'none';
    if (was && kind !== 'none' && !motionReduced()) {
      const spatial = motionTiming('spatial', 'fast');
      // A slide that is not over is reversed from where it is: its place now counts, not its end.
      const visibleShift = new DOMMatrixReadOnly(getComputedStyle(main).transform).m41;
      for (const running of main.getAnimations()) running.cancel();
      const pushed = mainLeft - was.mainLeft;
      if (pushed || visibleShift) main.animate([{ transform: `translateX(${visibleShift - pushed}px)` }, { transform: 'none' }], spatial);
      if (kind === 'enter' && context) {
        context.animate([{ transform: `translateX(${-context.offsetWidth}px)` }, { transform: 'none' }], spatial);
      }
      if (kind === 'leave' && was.ghost) {
        const ghost = row.appendChild(was.ghost);
        const gone = () => ghost.remove();
        ghost.animate([{ transform: 'none' }, { transform: `translateX(${-ghost.offsetWidth}px)` }], spatial).finished.then(gone, gone);
      }
      if (kind === 'change' && context) context.animate([{ opacity: 0 }, { opacity: 1 }], motionTiming('effects'));
    }
    // What the contextual tools looked like, to slide them out once the context ends (a copy: they are gone by then).
    let ghost: HTMLElement | null = null;
    if (context) {
      ghost = context.cloneNode(true) as HTMLElement;
      ghost.classList.add('editor-tools-ghost');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.setAttribute('inert', '');
    }
    slid.current = { key: contextKey, mainLeft, ghost };
  });
  // What a tool does and how it looks; the bar draws it as a button, the `⋮` menu as a row.
  const blockTool = (id: string) => {
    if (id === 'count') return { label: block_!.count!.label, icon: CloseIcon, action: block_!.count!.action };
    if (id === 'gear') return { label: block_!.edit!.label, icon: rawIcon(barIcons.gear), action: block_!.edit!.action };
    if (id === 'dynamic')
      return {
        label: block_!.dynamic!.label,
        icon: rawIcon(barIcons.dynamic),
        action: block_!.dynamic!.action,
        pressed: block_!.dynamic!.on,
      };
    // One of the active block's row actions (Add above, Move down, the Table's column actions ...).
    const row = block_!.actions.find((a) => a.kind === id)!;
    return {
      label: row.label,
      icon: rawIcon(barIcons[row.kind]),
      action: row.action,
      pressed: row.pressed,
      disabled: row.disabled,
      reason: row.reason,
    };
  };
  const toolOf = (
    id: string,
  ): { label: string; icon: typeof TextB; action: () => void; on?: string; pressed?: boolean; disabled?: boolean; reason?: string } => {
    // The block's tools are named 'block:<kind>' (not the text's 'link').
    if (id.startsWith('block:')) return blockTool(id.slice(6));
    switch (id) {
      case 'bold':
        return { label: t.text.bold, icon: TextB, action: () => run(toggleStrongCommand), on: 'strong' };
      case 'italic':
        return { label: t.text.italic, icon: TextItalic, action: () => run(toggleEmphasisCommand), on: 'emphasis' };
      case 'link':
        return { label: t.text.link, icon: LinkSimple, action: link, on: 'link' };
      case 'insert':
        return { label: insertLabel, icon: blocks ? AddIcon : Image, action: blocks ? block : image };
      case 'undo':
        return { label: t.text.undo, icon: ArrowUUpLeft, action: () => run(undoCommand) };
      case 'redo':
        return { label: t.text.redo, icon: ArrowUUpRight, action: () => run(redoCommand) };
      default:
        return { label: t.text.sectionSettings, icon: SectionSettingsIcon, action: sectionSettings };
    }
  };
  const menuOf = (id: string) => ({ style: 'style', list: 'list' })[id] as KindGroup | undefined;
  // A button of the bar. Text style, List, Alignment and Color open a menu under them; the others act.
  const barButton = (id: string) => {
    if (id === 'style' || id === 'list') {
      const group = menuOf(id)!;
      const opened = kindsAt?.group === group;
      const [icon, label] =
        group === 'style'
          ? [styleFace.icon, styleLabel]
          : [listFace?.icon ?? GENERIC_ICONS.list.node, listFace ? t.text.listIs(listFace.label) : t.text.list];
      return (
        <ToolbarButton
          key={id}
          icon={icon}
          label={label}
          menu={opened}
          onClick={(e) => setKindsAt(opened ? null : { at: e.currentTarget, group })}
        />
      );
    }
    if (id === 'align')
      return (
        <ToolbarButton
          key={id}
          icon={ALIGN_FACES[alignNow].node}
          label={t.text.alignmentIs(alignLabel(alignNow))}
          menu={!!alignAt && alignAt.closest('.editor-tools') !== null && alignAt !== moreButton.current}
          disabled={!alignOn}
          onClick={(e) => setAlignAt(alignAt === e.currentTarget ? null : e.currentTarget)}
        />
      );
    if (id === 'color')
      return (
        <ToolbarButton
          key={id}
          icon={Palette}
          label={t.text.color}
          menu={!!colorAt && colorAt !== moreButton.current}
          disabled={noColor}
          onClick={(e) => setColorAt(colorAt === e.currentTarget ? null : e.currentTarget)}
        />
      );
    if (id === 'block:count' && block_?.count)
      return <ToolbarButton key={id} icon={CloseIcon} label={block_.count.label} count={block_.count.n} onClick={block_.count.action} />;
    const { label, icon, action, on, pressed, disabled, reason } = toolOf(id);
    return (
      <ToolbarButton
        key={id}
        icon={icon}
        label={label}
        selected={on ? active.includes(on) : pressed}
        disabled={disabled}
        reason={reason}
        onClick={action}
      />
    );
  };
  // A row of the `⋮` menu. Text style, Alignment and Color open their own menu, under the `⋮` button.
  const moreRows = (id: string) => {
    const under = (open: () => void) => () => {
      open();
    };
    if (id === 'style')
      return (
        <MenuItem key={id} icon={styleFace.icon} onClick={under(() => setKindsAt({ at: moreButton.current!, group: 'style' }))}>
          {styleLabel}
        </MenuItem>
      );
    if (id === 'list')
      return lists.map((kind) => (
        <MenuItem key={kind} icon={LIST_FACES[kind].icon} selected={active.includes(kind)} onClick={() => setKind(kind)}>
          {LIST_FACES[kind].label}
        </MenuItem>
      ));
    if (id === 'align')
      return (
        <MenuItem key={id} icon={ALIGN_FACES[alignNow].node} disabled={!alignOn} onClick={under(() => setAlignAt(moreButton.current))}>
          {alignLabel(alignNow)}
        </MenuItem>
      );
    if (id === 'color')
      return (
        <MenuItem key={id} icon={Palette} disabled={noColor} onClick={under(() => setColorAt(moreButton.current))}>
          {t.text.color}
        </MenuItem>
      );
    const { label, icon, action, on, pressed, disabled } = toolOf(id);
    return (
      <MenuItem key={id} icon={icon} selected={on ? active.includes(on) : pressed} disabled={disabled} onClick={action}>
        {label}
      </MenuItem>
    );
  };
  // In the `⋮` menu the context's tools come first, then a divider, then the main tools.
  const MORE_ORDER = ['bold', 'italic', 'link', 'style', 'align', 'list', 'color'];
  const moreContext = [...plan.more.context].sort((a, b) => MORE_ORDER.indexOf(a) - MORE_ORDER.indexOf(b));
  const moreMain = plan.more.main.length ? plan.more.main : [];

  return (
    <div className="rounded-panel bg-surface-container-lowest">
      <span className="sr-only" role="status" aria-live="polite">
        {selecting ? t.text.blocksSelected(picked.places.length) : ''}
      </span>
      {/* The top edge of the text's box: it draws its own border and rounded corners, so the box's side lines start under it and never run past it when it sticks; no shadow. Stays at the top of the screen while scrolling through the text (under the safe area, as the top bar scrolls away). One row, 44 dp high: the text tools, a divider and the main tools; the `⋮` at its end has what does not fit (textBar.mjs). */}
      <Toolbar
        ref={toolbar}
        label={t.text.tools}
        className="editor-tools sticky top-[env(safe-area-inset-top)] z-10 rounded-t-panel border border-outline-variant pb-(--toolbar-docked-padding-block)"
      >
        <div ref={slideRow} className="editor-tools-slide">
          {plan.bar.context.length > 0 && (
            <div ref={contextBox} className="editor-tools-context">
              <div role="group" aria-label={block_?.name ?? t.text.textTools} className="editor-tools-group">
                {plan.bar.context.map(barButton)}
              </div>
              <ToolbarDivider />
            </div>
          )}
          <div ref={mainBox} className="editor-tools-main">
            <div role="group" aria-label={t.text.pageTools} className="editor-tools-group">
              {plan.bar.main.filter((id) => id !== 'insert').map(barButton)}
              {plan.bar.main.includes('insert') && plan.bar.main.length > 1 && <ToolbarDivider />}
              {plan.bar.main.filter((id) => id === 'insert').map(barButton)}
            </div>
            {plan.overflow && (
              <ToolbarButton
                ref={moreButton}
                icon={MoreVertIcon}
                label={t.text.more}
                popup={!!moreAt || underMore}
                onClick={(e) => {
                  // A tap on the ⋮ while one of its rows' menus (Text style, Alignment, Color) is open closes that menu and does not open the ⋮
                  // menu behind it; else it opens or closes the ⋮ menu, with none of the others open.
                  if (underMore) {
                    setKindsAt(null);
                    setAlignAt(null);
                    setColorAt(null);
                    return setMoreAt(null);
                  }
                  setKindsAt(null);
                  setAlignAt(null);
                  setColorAt(null);
                  setMoreAt(moreAt ? null : e.currentTarget);
                }}
              />
            )}
          </div>
        </div>
      </Toolbar>
      <Menu popup="end" anchor={moreAt} label={t.text.more} onClose={() => setMoreAt(null)}>
        {moreContext.map(moreRows)}
        {moreContext.length > 0 && moreMain.length > 0 && <MenuDivider />}
        {moreMain.map(moreRows)}
        {blockMenu.length > 0 && (moreContext.length > 0 || moreMain.length > 0) && <MenuDivider />}
        {blockMenu.map((row) => (
          <MenuItem key={row.label} icon={rawIcon(row.icon)} onClick={() => row.action(false)}>
            {row.label}
          </MenuItem>
        ))}
      </Menu>
      <Menu popup="start" anchor={alignAt} label={t.text.alignment} onClose={() => setAlignAt(null)}>
        {(Object.keys(ALIGN_FACES) as Align[]).map((align) => (
          <MenuItem
            key={align}
            icon={ALIGN_FACES[align].node}
            selected={alignNow === align}
            onClick={() => {
              setAlignAt(null);
              editor.current?.action((ctx) => alignSelection(ctx.get(editorViewCtx), align));
            }}
          >
            {alignLabel(align)}
          </MenuItem>
        ))}
      </Menu>
      {/* The site's colours (text-colors.mjs), each named in its colour, as it is in the text (its class), and "No color" in the text's own, last. */}
      <Menu popup="start" anchor={colorAt} label={t.text.color} onClose={() => setColorAt(null)}>
        {TEXT_COLORS.map((name) => (
          <MenuItem key={name} selected={active.includes(colorClass(name))} onClick={() => color(name)}>
            <span className={colorClass(name)}>{t.text.colors[name as keyof typeof t.text.colors]}</span>
          </MenuItem>
        ))}
        <MenuItem selected={!active.includes('textColor')} onClick={() => color(null)}>
          <span className="text-on-surface">{t.text.noColor}</span>
        </MenuItem>
      </Menu>
      {/* Text style: the heading levels the text may have, a divider, then the body sizes, Label and Quote; the rows that do not apply (a heading in a list item, a list or Quote in a heading) are hidden (styleMenu.mjs). */}
      <Menu
        popup="start"
        anchor={kindsAt?.at ?? null}
        label={kindsAt?.group === 'list' ? t.text.list : t.text.kind}
        onClose={() => setKindsAt(null)}
      >
        {kindsAt?.group === 'style' &&
          styleRows(active, headingLevels).map((row, i) =>
            row === '-' ? (
              <MenuDivider key={`-${i}`} />
            ) : (
              <MenuItem key={row} icon={rowIcon(row)} selected={active.includes(row)} onClick={() => setKind(row)}>
                {STYLE_FACES[row].label}
              </MenuItem>
            ),
          )}
        {kindsAt?.group === 'list' &&
          lists.map((kind) => (
            <MenuItem key={kind} icon={LIST_FACES[kind].icon} selected={active.includes(kind)} onClick={() => setKind(kind)}>
              {LIST_FACES[kind].label}
            </MenuItem>
          ))}
      </Menu>
      <div
        ref={root}
        className={`editor-text prose max-w-none rounded-b-panel border-x border-b border-outline-variant px-5 py-4 medium:px-8 ${short ? 'editor-text-short' : ''} ${spaced ? 'editor-spaced' : ''}`}
        style={
          { '--editor-gap-text': JSON.stringify(t.text.typeHere), '--editor-empty-text': JSON.stringify(t.text.emptyHint) } as CSSProperties
        }
      />
    </div>
  );
});
