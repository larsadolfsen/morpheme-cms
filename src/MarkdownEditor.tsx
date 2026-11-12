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
  Fragment as ReactFragment,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
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
  CaretDown,
  CaretUp,
  Image,
  LinkSimple,
  ListBullets,
  ListChecks,
  ListNumbers,
  Plus,
  Quotes,
  Tag,
  TextAa,
  TextAlignCenter,
  TextAlignLeft,
  TextAlignRight,
  TextB,
  TextH,
  TextHThree,
  TextHOne,
  TextHTwo,
  TextItalic,
  TextT,
} from '@phosphor-icons/react';
import { LIST_KINDS, STYLE_KINDS, headingKindOf, listKindOf, styleKindOf } from './styleKind.mjs';
import { HTML, makeEditor, markdownOf, partsOf, siteBlockSchema, spacing } from './markdown.mjs';
import { firstHeading, topHeadings } from './firstHeading.mjs';
import { h1Of, h1TextOf, h1Written } from './titleH1.mjs';
import { headingChoices } from '../lib/heading-levels.mjs';
import { TEXT_COLORS, colorClass } from '../lib/text-colors.mjs';
import { sectionHeading, setSection } from './sectionState.mjs';
import { sectionFrame } from './sectionFrame';
import { IMAGE, type BlockAsk } from './BlockDialog';
import SectionSettingsIcon from './SectionSettingsIcon';
import { arrangeTools, nextArrangement } from './toolbarOrder.mjs';
import { askLink } from './LinkSheet';
import { atLeastNow, BottomSheet, Menu, MenuItem, SheetBody, SheetGroupTitle, SheetTitle, Toolbar, ToolbarButton } from './ui';
import { editsInPanel } from './sheetPlacement.mjs';
import { useToolbarLines } from './useToolbarLines';
import { shownAt } from './images';
import { cropStyle, joinPicture, splitPicture } from '../lib/crop.mjs';
import { describe, htmlBlock, type BlockProps } from './blocks';
import InlineList, { RowsFromList, type Change, type Focus, type Row } from './InlineList';
import { addAt, isEmptyRow, moveBy, setField, withoutEmpty } from './inlineRows.mjs';
import { editorRows } from './standard/rows/view';
import { fromLine } from './standard/rows/fields';
import { inlineBar, type BarAction } from './inlineBar';
import { preview } from './registry';
import { leaveTo } from './FormFrame';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { t } from './i18n';
import { motionTiming } from '../lib/motion';
import { stillTimer } from '../lib/still-timer.mjs';
import { STILL_MS, wordRange } from './stillCursor.mjs';
import { hasLabel, labelledHeading, toggleLabel } from './eyebrowState.mjs';
// The icons of the card's menu (Phosphor, as everywhere in the editor), as SVG: the card is not React.
import pencilIcon from '@phosphor-icons/core/assets/regular/pencil-simple.svg?raw';
import eyeIcon from '@phosphor-icons/core/assets/regular/eye.svg?raw';
import eyeSlashIcon from '@phosphor-icons/core/assets/regular/eye-slash.svg?raw';
import arrowUpIcon from '@phosphor-icons/core/assets/regular/arrow-up.svg?raw';
import arrowDownIcon from '@phosphor-icons/core/assets/regular/arrow-down.svg?raw';
import trashIcon from '@phosphor-icons/core/assets/regular/trash.svg?raw';
import boldIcon from '@phosphor-icons/core/assets/regular/text-b.svg?raw';
import italicIcon from '@phosphor-icons/core/assets/regular/text-italic.svg?raw';
import linkIcon from '@phosphor-icons/core/assets/regular/link-simple.svg?raw';
import h1Icon from '@phosphor-icons/core/assets/regular/text-h-one.svg?raw';
import h2Icon from '@phosphor-icons/core/assets/regular/text-h-two.svg?raw';
import h3Icon from '@phosphor-icons/core/assets/regular/text-h-three.svg?raw';
import textLargeIcon from './icons/text-t-large.svg?raw';
import textMediumIcon from './icons/text-t-medium.svg?raw';
import textSmallIcon from './icons/text-t-small.svg?raw';
import { TextLargeIcon, TextMediumIcon, TextSmallIcon } from './TextSizeIcons';
import textHIcon from '@phosphor-icons/core/assets/regular/text-h.svg?raw';
import textTIcon from '@phosphor-icons/core/assets/regular/text-t.svg?raw';
import alignLeftIcon from '@phosphor-icons/core/assets/regular/text-align-left.svg?raw';
import alignCenterIcon from '@phosphor-icons/core/assets/regular/text-align-center.svg?raw';
import alignRightIcon from '@phosphor-icons/core/assets/regular/text-align-right.svg?raw';
import bulletIcon from '@phosphor-icons/core/assets/regular/list-bullets.svg?raw';
import orderedIcon from '@phosphor-icons/core/assets/regular/list-numbers.svg?raw';
import quoteIcon from '@phosphor-icons/core/assets/regular/quotes.svg?raw';
import plusIcon from '@phosphor-icons/core/assets/regular/plus.svg?raw';
import dotsIcon from '@phosphor-icons/core/assets/regular/dots-three-vertical.svg?raw';
import caretDownIcon from '@phosphor-icons/core/assets/bold/caret-down-bold.svg?raw';
import checkIcon from '@phosphor-icons/core/assets/regular/list-checks.svg?raw';
import tagIcon from '@phosphor-icons/core/assets/regular/tag.svg?raw';
// ProseMirror's own styles: keep its invisible helpers (around pictures, at the end of lines) out of the layout.
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
};

// addImage: asks for a picture (the gallery, Media.tsx); its address on the site. Its description is
// asked in the sheet. Without it there is no picture button. blocks: asks which block to put in and its fields (BlockDialog);
// without it there is no block button; with it a free line is kept between two blocks, and before
// and after them (spacing in markdown.mjs). short: a smaller field, for a short text. h1: a page's text, where the
// first heading is the page's H1 by itself (firstHeading.mjs); a blog post's H1 is its title.
type Props = {
  value: string;
  onChange: () => void;
  addImage?: () => Promise<string | null>;
  blocks?: BlockAsk;
  /** The sheet a picture or HTML is changed in, when there are no blocks (a blog post). */
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

// A card: a block, or a picture (in a paragraph of its own).
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

// The menu of the card that is open, if any: one at a time; closed by a tap elsewhere or Escape.
let closeOpenMenu: (() => void) | null = null;

// action: keyboard, whether the choice was made with the keyboard (Enter or Space).
type CardItem = { icon: string; label: string; action: (keyboard: boolean) => void; danger?: boolean };

// The part of the text at the top level before or after the one at index i (a block, or a paragraph
// with a picture), skipping the free lines between; null at the start or end.
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
  // Where it went, in view (one step: past one block, paragraph, heading or picture).
  const moved = partDOM(view, at);
  requestAnimationFrame(() => moved?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }));
  return at;
}

// Opens the menu of the card at the top level at index k again (after it moved, it is a new card).
type CardHost = HTMLElement & { openMenu?: (keyboard: boolean, focus?: string) => void };
function reopen(view: EditorView, k: number, keyboard: boolean, label: string) {
  const el = partDOM(view, k);
  const host = (el?.matches('.site-block') ? el : el?.querySelector('.site-block')) as CardHost | null;
  host?.openMenu?.(keyboard, label);
}

// The blocks at the top level of the text, in order: their type and whether they are hidden.
const blocksOf = (doc: Node) => {
  const blocks: { type: string; hidden: boolean }[] = [];
  doc.forEach((n) => void (n.type.name === 'siteBlock' && blocks.push({ type: n.attrs.type, hidden: n.attrs.props?.hidden === true })));
  return blocks;
};

// "Move up" and "Move down" for the part at the top level at index i, where it can be moved: not past
// the start or end, nor past a block the template locks (locked: their types). The menu stays open on
// the moved card, so it can be moved again at once.
const moves = (view: EditorView, i: number | null, locked: string[] = []): CardItem[] => {
  if (i === null) return [];
  const step = (by: -1 | 1) => (keyboard: boolean) => {
    const at = move(view, i, by);
    if (at !== null) reopen(view, at, keyboard, by < 0 ? t.common.moveUp : t.common.moveDown);
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

// The row of icons on a card (a block or a picture) in the text, opened by tapping it: items, as
// they are when it opens (no row when there are none). `tap` runs first on a tap that opens the row (not on one that
// closes it): from expanded it opens the card's side panel. Returns how to close it.
function cardMenu(
  view: EditorView,
  dom: HTMLElement,
  card: HTMLElement,
  name: string,
  items: () => (CardItem | undefined | false | '')[],
  tap?: () => void,
) {
  let menu: HTMLElement | null = null;
  function close() {
    menu?.remove();
    menu = null;
    card.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', outside, true);
    document.removeEventListener('keydown', escape, true);
    if (closeOpenMenu === close) closeOpenMenu = null;
  }
  const outside = (e: Event) => void (dom.contains(e.target as globalThis.Node) || close());
  const escape = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    close();
    card.focus();
  };
  // keyboard: opened with Enter or Space, so a choice gets the focus: the first, or the one named
  // `focus` (the arrow used to move the card, when it opens again on the moved card).
  function open(keyboard: boolean, focus?: string) {
    closeOpenMenu?.();
    const shown = items().filter((it): it is CardItem => !!it);
    if (!shown.length) return;
    menu = dom.appendChild(document.createElement('div'));
    menu.className = 'site-block-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', name);
    for (const it of shown) {
      const b = menu.appendChild(document.createElement('button'));
      b.type = 'button';
      b.setAttribute('role', 'menuitem');
      b.setAttribute('aria-label', it.label);
      b.title = it.label;
      b.innerHTML = it.icon.replace('<svg', '<svg width="20" height="20" fill="currentColor" aria-hidden="true"');
      if (it.danger) b.className = 'site-block-danger';
      b.addEventListener('click', (e) => {
        close();
        it.action(e.detail === 0);
      });
    }
    card.setAttribute('aria-expanded', 'true');
    closeOpenMenu = close;
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', escape, true);
    // On a card taller than the screen, under the toolbar (not above the screen) where the card goes on.
    const bar = document.querySelector('.editor-tools')?.getBoundingClientRect().bottom ?? 0;
    const box = dom.getBoundingClientRect();
    const at = menu.getBoundingClientRect();
    if (at.top < bar + 8) menu.style.top = `${Math.min(bar + 8 - box.top, box.height - at.height - 8)}px`;
    if (keyboard)
      (menu.querySelector<HTMLElement>(`[aria-label="${focus}"]`) ?? menu.querySelector('button'))?.focus({ preventScroll: true });
  }
  (dom as CardHost).openMenu = open;
  card.setAttribute('aria-haspopup', 'menu');
  card.setAttribute('aria-expanded', 'false');
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
  card.addEventListener('click', (e) => {
    if (menu) return close();
    tap?.();
    open(e.detail === 0);
  });
  return close;
}

// The address of a picture from its sheet: with its format and crop after it, and marked when it is decorative
// (crop.mjs).
const pictureSrc = (props: BlockProps) =>
  joinPicture(
    String(props.src),
    String(props.format ?? ''),
    (props.crop as number[] | null | undefined) ?? null,
    props.decorative === true,
  );

// A picture in the text as a card like a block's, cut to its format, with a menu to change it
// (another picture, its description for screen readers, its format), move it with its paragraph and
// remove it.
// sheet: where it is changed (the sheet of the blocks, BlockDialog.tsx).
function pictureCard(node: Node, view: EditorView, getPos: () => number | undefined, sheet: () => BlockAsk | undefined) {
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
      view.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, src: pictureSrc(props), alt: String(props.alt ?? '').trim() }),
    );
  };
  const remove = () => {
    const pos = getPos();
    if (pos !== undefined) view.dispatch(view.state.tr.delete(pos, pos + node.nodeSize));
  };
  // From expanded a picture's sheet is the side panel: a tap opens it, and the menu has no pen or trash (Remove is in the panel).
  const inPanelNow = () => editsInPanel(atLeastNow('expanded'), true);
  const close = cardMenu(
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

// The three groups of kinds of text, each a button with a menu when there is little room: the headings, the text styles
// (T) and the lists.
// The icon of each text style, once, for both toolbars: the raw one the floating row draws and the component the top toolbar
// and the style menu draw. Its names are STYLE_KINDS (styleKind.mjs), checked by styleKind.test.mjs.
const KIND_ICONS = {
  small: { raw: textSmallIcon, node: TextSmallIcon },
  medium: { raw: textMediumIcon, node: TextMediumIcon },
  large: { raw: textLargeIcon, node: TextLargeIcon },
  label: { raw: tagIcon, node: Tag },
  quote: { raw: quoteIcon, node: Quotes },
  bullet: { raw: bulletIcon, node: ListBullets },
  check: { raw: checkIcon, node: ListChecks },
  ordered: { raw: orderedIcon, node: ListNumbers },
};
// The icons of the three buttons when their style is not on: the general text (T), heading (H) and list icons.
// The text styles in the "More" sheet, in the toolbar's order (the headings are the H button's).
const TEXT_KINDS_IN_SHEET = ['small', 'medium', 'large', 'label', 'quote'];

// A choice in the "More" sheet: its icon and name, checked when it is the one there is.
function SheetChoice({
  icon: Glyph,
  selected,
  onClick,
  children,
}: {
  icon?: typeof TextB;
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="flex min-h-12 w-full items-center gap-3 rounded-full px-4 text-left text-on-surface hover:bg-surface-container-high aria-pressed:bg-surface-container-high aria-pressed:font-medium"
    >
      {Glyph && <Glyph aria-hidden="true" size={24} />}
      {children}
    </button>
  );
}

const GENERIC_ICONS = {
  text: { raw: textTIcon, node: TextT },
  heading: { raw: textHIcon, node: TextH },
  list: { raw: bulletIcon, node: ListBullets },
};

// The alignments of a paragraph or a smaller heading (lib/text-align.mjs), each with its icon and name; left is the text's own.
const ALIGN_FACES = {
  left: { raw: alignLeftIcon, node: TextAlignLeft },
  center: { raw: alignCenterIcon, node: TextAlignCenter },
  right: { raw: alignRightIcon, node: TextAlignRight },
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

type KindGroup = 'headings' | 'text' | 'list';

// A button's icon (a raw svg) and its name.
type Face = { icon: string; label: string };

// shows: an icon and a name that follow the selection (a group of kinds of text shows the one there is). on: marked
// when it applies (aria-pressed); without it the button is never marked. off: not there for the selection (the button is
// hidden). word: at a still cursor it acts on the word the cursor is in, which is selected first. menu: it opens a menu,
// so it has an arrow down after its icon.
type Look = (Face | { shows: (state: EditorView['state']) => Face }) & {
  on?: (state: EditorView['state']) => boolean;
  action: (button: HTMLElement) => void;
  off?: (state: EditorView['state']) => boolean;
  // Not there (the marks in a block with none).
  dim?: (state: EditorView['state']) => boolean;
  word?: boolean;
  menu?: boolean;
};

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

// When a word or more is selected, or the cursor has stood still in a word (STILL_MS, stillCursor.mjs): one row of icons
// over it, never two: bold, italic, link, the headings (H, a menu with the levels headingChoices gives for the text; a
// page's H1 alone is that heading's own button), "+" (the blocks, only where there are any) and "More" (three dots), which
// opens a sheet from the bottom with the rest: the colours, the text styles, the lists and the alignment. At a still
// cursor, bold, italic and link act on the whole word, the headings on the line; a move or a keypress hides the row. On a
// phone, where the phone's own menu is over the selection and its handles under it, the row is at the bottom of the
// screen, over the keyboard.
function selectionMenu(
  ctx: Ctx,
  h1: boolean,
  kinds: (button: HTMLElement, group: KindGroup) => void,
  insert: () => (() => void) | null,
  more: () => void,
) {
  return new Plugin({
    view(view) {
      const menu = document.body.appendChild(document.createElement('div'));
      menu.className = 'editor-selection-menu';
      menu.setAttribute('role', 'toolbar');
      menu.setAttribute('aria-label', t.text.selection);
      menu.hidden = true;
      const run = <T,>(command: { key: CmdKey<T> }, payload?: T) => void callCommand(command.key, payload)(ctx);
      const marked = (state: EditorView['state'], name: string) => activeOf(state).has(name);
      // On a page the Heading button also stands for the H1 (firstHeading.mjs).
      const heading = (state: EditorView['state'], level: number) =>
        activeOf(state).has(`h${level}`) || (h1 && level === 2 && activeOf(state).has('h1'));
      // The heading levels offered: on a page only those headingChoices gives (H1 until the text has one, then H2 and
      // H3); a blog post has H2 and H3.
      const levels = (state: EditorView['state']) => (h1 ? headingChoices(levelsOf(state.doc)) : [2, 3]);
      const headingFace = (level: number): Face => ({
        icon: [h1Icon, h2Icon, h3Icon][level - 1],
        label: [t.text.pageHeading, t.text.heading, t.text.subheading][level - 1],
      });
      const looks: Look[] = [
        {
          icon: boldIcon,
          label: t.text.bold,
          on: (s) => marked(s, 'strong'),
          action: () => run(toggleStrongCommand),
          dim: inLabel,
          word: true,
        },
        {
          icon: italicIcon,
          label: t.text.italic,
          on: (s) => marked(s, 'emphasis'),
          action: () => run(toggleEmphasisCommand),
          dim: inLabel,
          word: true,
        },
        {
          icon: linkIcon,
          label: t.text.link,
          on: (s) => marked(s, 'link'),
          action: () => void editLink(view).then(() => update(view)),
          dim: inLabel,
          word: true,
        },
        // The only heading offered (H1, while a page has none): its own button, marked when it is one; again to make it
        // text.
        {
          shows: (s) => ({ icon: GENERIC_ICONS.heading.raw, label: headingFace(levels(s)[0]).label }),
          on: (s) => heading(s, levels(s)[0]),
          action: () => {
            const [level] = levels(view.state);
            if (heading(view.state, level)) run(turnIntoTextCommand);
            else run(wrapInHeadingCommand, level);
          },
          off: (s) => levels(s).length > 1,
        },
        // The headings offered, in a menu: a plain H (the menu marks the level there is, the button's name says it). Not
        // marked: it is the one control that shows the heading's level.
        {
          shows: (s) => {
            const level = levels(s).find((l) => heading(s, l));
            return {
              icon: GENERIC_ICONS.heading.raw,
              label: level === undefined ? t.text.heading : headingFace(level).label,
            };
          },
          action: (button) => kinds(button, 'headings'),
          off: (s) => levels(s).length < 2,
          menu: true,
        },
        // The blocks (the same sheet as the toolbar's "+"), where the text has blocks.
        { icon: plusIcon, label: t.text.insert, action: () => insert()?.(), off: () => !insert() },
        // The rest, in a sheet from the bottom.
        { icon: dotsIcon, label: t.text.more, action: () => more() },
      ];
      // Where the cursor stood still in a word, so the row is shown for that word; null after a move. A change made by
      // a button (acting) is no move.
      let stillAt: number | null = null;
      let acting = false;
      const still = stillTimer(STILL_MS, () => {
        if (!view.hasFocus() || !wordRange(view.state)) return;
        stillAt = view.state.selection.from;
        update(view);
      });
      const stillWord = (state: EditorView['state']) => (stillAt === state.selection.from ? wordRange(state) : null);
      // The state as if the word at a still cursor were selected, so the buttons are marked as for the word.
      const asShown = (state: EditorView['state']) => {
        const word = stillWord(state);
        return word ? state.apply(state.tr.setSelection(TextSelection.create(state.doc, word.from, word.to))) : state;
      };
      const faceOf = (look: Look, state: EditorView['state']) => ('shows' in look ? look.shows(state) : look);
      // Draws a button's icon and name when they are not what it shows already; a button that opens a menu (the colours,
      // the kinds of text) has a small arrow down after its icon (editor.css).
      const drawn = new Map<HTMLButtonElement, string>();
      const draw = (b: HTMLButtonElement, look: Look, { icon, label }: Face) => {
        b.title = label;
        b.setAttribute('aria-label', label);
        if (drawn.get(b) === icon) return;
        drawn.set(b, icon);
        b.innerHTML = icon.replace('<svg', '<svg width="20" height="20" fill="currentColor" aria-hidden="true"');
        if (look.menu)
          b.insertAdjacentHTML(
            'beforeend',
            caretDownIcon.replace('<svg', '<svg width="12" height="12" fill="currentColor" aria-hidden="true" class="editor-menu-arrow"'),
          );
      };
      const buttons = looks.map((look, i) => {
        const b = menu.appendChild(document.createElement('button'));
        b.type = 'button';
        if (look.menu) b.setAttribute('aria-haspopup', 'menu');
        draw(b, look, faceOf(look, view.state));
        const act = () => {
          const word = look.word ? stillWord(view.state) : null;
          if (word) view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, word.from, word.to)));
          acting = true;
          try {
            look.action(b);
          } finally {
            acting = false;
          }
          update(view);
          // Again when "Save changes" has come after the first change.
          setTimeout(follow, 100);
        };
        // The selection stays: no focus taken with the mouse, and a tap does not end the selection
        // (its click is the phone's, so the tap acts itself).
        b.addEventListener('mousedown', (e) => e.preventDefault());
        b.addEventListener('click', act);
        b.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        b.addEventListener('touchend', (e) => {
          e.preventDefault();
          act();
        });
        return b;
      });
      function update(view: EditorView) {
        const { selection, doc } = view.state;
        const word = stillWord(view.state);
        const selected =
          selection instanceof TextSelection && !selection.empty && doc.textBetween(selection.from, selection.to).trim() !== '';
        const shown = view.hasFocus() && (selected || !!word);
        menu.hidden = !shown;
        if (!shown) return;
        const state = asShown(view.state);
        // A button that does not apply there (the marks in a block with none) is left out, on a phone too: the row floats by the text.
        looks.forEach((look, i) => {
          buttons[i].hidden = !!look.off?.(state) || !!look.dim?.(state);
          if (buttons[i].hidden) return;
          if ('shows' in look) draw(buttons[i], look, look.shows(state));
          if (look.on) buttons[i].setAttribute('aria-pressed', String(look.on(state)));
        });
        const screen = visualViewport ?? { offsetLeft: 0, offsetTop: 0, width: innerWidth, height: innerHeight };
        const { offsetWidth: width, offsetHeight: height } = menu;
        const text = view.dom.getBoundingClientRect();
        const { from, to } = word ?? selection;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);
        const middle = start.top === end.top ? (start.left + end.right) / 2 : text.left + text.width / 2;
        // Over the selection; under it when there is no room over it (the top toolbar, or the top of the visible screen). Always
        // inside the visible screen (the visual viewport: not under the keyboard) and above "Save changes".
        const bar = document.querySelector('.editor-tools')?.getBoundingClientRect().bottom ?? 0;
        const save = document.querySelector('.editor-save-bar')?.getBoundingClientRect().top ?? Infinity;
        const floor = Math.max(bar, screen.offsetTop);
        const ceiling = Math.min(screen.offsetTop + screen.height, save);
        const over = start.top - height - 10;
        const under = end.bottom + 10;
        const left = screen.offsetLeft + 4;
        menu.style.left = `${Math.max(left, Math.min(middle - width / 2, screen.offsetLeft + screen.width - width - 4))}px`;
        menu.style.top = `${Math.max(screen.offsetTop, Math.min(over > floor ? over : under, ceiling - height - 4))}px`;
      }
      // Gone when the text is left (not for a tap on the menu itself, which keeps the focus).
      const refresh = () => setTimeout(() => update(view));
      // Where it is follows the page and the keyboard.
      // Again a frame and a quarter of a second later: the page (and "Save changes") has moved by then when the keyboard opened.
      const follow = () => {
        if (menu.hidden) return;
        update(view);
        requestAnimationFrame(() => menu.hidden || update(view));
        setTimeout(() => menu.hidden || update(view), 250);
      };
      view.dom.addEventListener('blur', refresh);
      view.dom.addEventListener('focus', refresh);
      addEventListener('scroll', follow, { passive: true });
      visualViewport?.addEventListener('resize', follow);
      visualViewport?.addEventListener('scroll', follow);
      return {
        // A move or a keypress hides the row at a still cursor and waits again.
        update: (view: EditorView, prev: EditorState) => {
          if (!acting && (!prev.selection.eq(view.state.selection) || !prev.doc.eq(view.state.doc))) {
            stillAt = null;
            still.restart();
          }
          update(view);
        },
        destroy: () => {
          still.stop();
          view.dom.removeEventListener('blur', refresh);
          view.dom.removeEventListener('focus', refresh);
          removeEventListener('scroll', follow);
          visualViewport?.removeEventListener('resize', follow);
          visualViewport?.removeEventListener('scroll', follow);
          menu.remove();
        },
      };
    },
  });
}

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
  const inline = !!block?.inline && node.attrs.type !== HTML;
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
  // What is typed in place is for screen readers too; the picture of any other block is not.
  if (!inline) shown.setAttribute('aria-hidden', 'true');
  const root = createRoot(shown);
  // Typed in place: which row is active (null: none, the block shows its live look), and the field to put the cursor in.
  let active: number | null = null;
  let focus: Focus | null = null;
  // Its floating toolbar (made below, with the block's menu).
  let bar: ReturnType<typeof inlineBar> | null = null;
  let syncRow: (open: boolean) => void = () => {};
  let stopAway = () => {};
  const rows = () => (node.attrs.props.items as Row[] | undefined) ?? [];
  const setItems = (items: Row[]) => {
    const here = at();
    if (here) view.dispatch(view.state.tr.setNodeMarkup(here.pos, undefined, { ...node.attrs, props: { ...node.attrs.props, items } }));
  };
  const change = (c: Change) => {
    if ('active' in c) active = c.active ?? null;
    if ('focus' in c) focus = c.focus ?? null;
    if (c.items) setItems(c.items);
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
            <RowsFromList rows={dynamic.rows} line={fromLine(node.attrs.props, ask.data)[0] ?? ''} empty={dynamic.rows.length === 0} />,
          ),
        );
        bar?.refresh(false);
        return;
      }
      flushSync(() =>
        root.render(
          <InlineList
            items={(node.attrs.props.items as Row[] | undefined) ?? []}
            active={active}
            focus={focus}
            onChange={change}
            onSettings={() => syncRow(true)}
          />,
        ),
      );
      syncRow(false);
      bar?.refresh(active !== null);
      return;
    }
    const lines = block ? describe(block, node.attrs.props, ask.data) : [];
    card.setAttribute('aria-description', [hidden ? t.text.hiddenOnPage : '', ...lines].filter(Boolean).join('. '));
    // Without a picture of it, what is in it, in lines.
    const picture = preview(node.attrs.type, node.attrs.props, ask.data) ?? (
      <div className="site-block-lines">
        {lines.map((line, i) => (
          <span key={i}>{line}</span>
        ))}
      </div>
    );
    flushSync(() => root.render(picture));
  };
  // A block just put in (a new List) starts with its first row active and the cursor in it (known by its props, which the new node keeps).
  // The sheet it came from is closing and gives the focus back to what had it: wait until no sheet is open.
  if (inline && fresh.delete(node.attrs.props)) {
    let tries = 0;
    const start = () => {
      if (document.querySelector('dialog[open]') && tries++ < 30) return void setTimeout(start, 50);
      change({ active: 0, focus: { row: 0, field: 'title' } });
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

  // The choices that can be made here: no "Ret" without fields (but to where it is edited instead,
  // Block.edit), no move past the start or end. By the template (collections.ts): a locked block is
  // only edited, and the last shown one of a block the page must have cannot be hidden or removed.
  // From expanded the block's fields are in the side panel: a tap opens it, and the menu has no pen or trash (Remove is in the panel).
  const inPanelNow = () => !inline && editsInPanel(atLeastNow('expanded'), !!block?.fields.length);
  // Typed in place: the floating toolbar (inlineBar.ts) has the row actions, and its last button opens the block's own menu below.
  let handle = card;
  if (inline) {
    const itemFields = (block?.fields.find((f) => f.name === 'items')?.fields ?? []).filter(
      (f) => f.name === 'icon' || f.name === 'href' || f.name === 'heading',
    );
    const compact = () => !atLeastNow('expanded');
    // The active row has something in it (the row actions are for a row, not for the empty one being started).
    const rowActions = (): BarAction[] => {
      const list = rows();
      if (active === null || active >= list.length || isEmptyRow(list[active])) return [];
      const i = active;
      const go = (items: Row[], to: number) => change({ items, active: to, focus: { row: to, field: 'title' } });
      return [
        { kind: 'above', label: t.blocks.list.addAbove, action: () => go(addAt(list, i), i) },
        { kind: 'below', label: t.blocks.list.addBelow, action: () => go(addAt(list, i + 1), i + 1) },
        ...(i > 0 ? [{ kind: 'up' as const, label: t.common.moveUp, action: () => go(moveBy(list, i, -1), i - 1) }] : []),
        ...(i < list.length - 1 ? [{ kind: 'down' as const, label: t.common.moveDown, action: () => go(moveBy(list, i, 1), i + 1) }] : []),
      ];
    };
    bar = inlineBar({
      name,
      dom,
      rowActions,
      edit: () => syncRow(true),
      compact,
      labels: { row: t.blocks.list.row, edit: t.common.edit },
    });
    handle = bar.block;
    // The settings of the active row (its icon and link), live: from expanded in the side panel while a row is active, below it in a bottom
    // sheet that Edit opens (`open`: a row's slot or Edit; else only an open sheet is updated).
    syncRow = (open) => {
      const sheet = asker();
      if (sheet && active !== null) sheet.row(specOf(active), open || !compact());
    };
    const specOf = (i: number) => {
      const row = rows()[i] ?? {};
      return {
        headline: t.blocks.list.rowSettings,
        fields: itemFields,
        value: { icon: row.icon ?? '', href: row.href ?? '' },
        onChange: (v: BlockProps) => {
          let items = rows();
          for (const key of ['icon', 'href'] as const) items = setField(items, i, key, String(v[key] ?? ''));
          setItems(items);
        },
      };
    };
    // Leaving the block (a tap or the focus elsewhere, but not in its toolbar, its menu or its settings): the row being edited is done,
    // its settings close, and a row with nothing in it is dropped.
    const inside = (target: EventTarget | null) =>
      target instanceof Element &&
      (dom.contains(target) || bar!.el.contains(target) || !!target.closest('.editor-side-sheet, dialog[open]'));
    const away = (e: Event) => {
      if (active === null || inside(e.target)) return;
      active = null;
      focus = null;
      asker()?.row(null);
      const list = rows();
      const kept = withoutEmpty(list);
      if (kept !== list) setItems(kept);
      else draw();
    };
    document.addEventListener('pointerdown', away, true);
    document.addEventListener('focusin', away, true);
    stopAway = () => {
      document.removeEventListener('pointerdown', away, true);
      document.removeEventListener('focusin', away, true);
    };
  }
  const close = cardMenu(
    view,
    dom,
    handle,
    name,
    () => {
      const i = top();
      const { rules, locked, stays } = keeps();
      return [
        block?.fields.length
          ? !inline && !inPanelNow() && { icon: pencilIcon, label: t.common.edit, action: edit }
          : block?.edit && { icon: pencilIcon, label: block.edit.text, action: () => leaveTo(`#${block.edit!.to}`) },
        block?.shown || (stays && hidden === false)
          ? undefined
          : { icon: hidden ? eyeIcon : eyeSlashIcon, label: hidden ? t.text.showOnPage : t.text.hideOnPage, action: toggle },
        ...(locked ? [] : moves(view, i, rules?.locked)),
        stays || inPanelNow() ? undefined : { icon: trashIcon, label: t.common.remove, action: remove, danger: true },
      ];
    },
    () => inPanelNow() && void edit(),
  );
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
  // The sheet from the bottom behind the selection menu's "More" (three dots): the colours, the text styles, the lists and
  // the alignment. `noColor`: the words there have none (a label above a heading, the name of a section).
  const moreSheet = useRef<HTMLDialogElement>(null);
  const [noColor, setNoColor] = useState(false);
  const moreRef = useRef(() => {});
  const insertRef = useRef<(() => void) | null>(null);
  // The button that opened a menu with kinds of text, and its group, while it is open: in the toolbar, or over the
  // selection (word), whose button says it is open as the colour button does.
  const [kindsAt, setKindsAt] = useState<{ at: HTMLElement; group: KindGroup; word?: boolean } | null>(null);
  useEffect(() => {
    if (!kindsAt?.word) return;
    kindsAt.at.setAttribute('aria-expanded', 'true');
    return () => kindsAt.at.setAttribute('aria-expanded', 'false');
  }, [kindsAt]);
  // The alignment button that opened its menu (over the selection or in the toolbar), while it is open.
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
    const selecting = $prose((ctx) =>
      selectionMenu(
        ctx,
        !!h1,
        (button, group) => setKindsAt((open) => (open?.at === button ? null : { at: button, group, word: true })),
        () => insertRef.current,
        () => moreRef.current(),
      ),
    );
    const pictureView = $view(imageSchema.node, () => (node, view, getPos) => pictureCard(node, view, getPos, () => sheeted.current));
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
      .use(pictureView)
      .use(selecting)
      .use(cardDeletes)
      .use(marking)
      .use(onEdit)
      .use(looking)
      .use(sectionFrame(framed))
      .use(gapHere)
      .use(hintTap)
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
    editor.current?.action((ctx) => void editLink(ctx.get(editorViewCtx)));
  }

  function color(name: string | null) {
    editor.current?.action((ctx) => paint(ctx.get(editorViewCtx), name));
  }

  // Opens the sheet behind "More" (what applies there is marked, from `active`); a choice closes it and gives the text its focus back.
  moreRef.current = () => {
    editor.current?.action((ctx) => {
      const state = ctx.get(editorViewCtx).state;
      setNoColor(inLabel(state) || (!!sections && inSectionHeading(state)));
    });
    moreSheet.current?.showModal();
  };
  const chosen = (change: () => void) => {
    moreSheet.current?.close();
    change();
    editor.current?.action((ctx) => ctx.get(editorViewCtx).focus());
  };

  // The sheet with the settings of the section the cursor is in (its colour, picture and width), then those set.
  async function sectionSettings() {
    let current: ReturnType<typeof sectionHeading> = null;
    editor.current?.action((ctx) => void (current = sectionHeading(ctx.get(editorViewCtx).state)));
    const at = current as ReturnType<typeof sectionHeading>;
    if (!at) return;
    const answered = await (blocks ?? sheetProp)?.section(at, { picture: true });
    if (!answered) return;
    editor.current?.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      setSection(view, answered);
      view.focus();
    });
  }

  // A new picture from the gallery, then the sheet with it and what it shows, where it can still be
  // changed or left out (the browser's own box for what it shows without a sheet).
  async function image() {
    const src = await addImage!();
    if (!src) return;
    const sheet = blocks ?? sheetProp;
    const picked = await sheet?.edit(IMAGE, { src, alt: '' }, true);
    if (picked && picked !== 'remove') run(insertImageCommand, { src: pictureSrc(picked), alt: String(picked.alt ?? '').trim() });
  }

  // Puts the chosen block where the cursor is (a paragraph is split around it), or after the block
  // that is selected. With no text after it, an empty paragraph follows, where the cursor goes, so
  // the next text or block comes after it instead of replacing it.
  async function block() {
    // The blocks and pictures in the text now, for how many of a type there may be (the template).
    let have: string[] = [];
    editor.current?.action((ctx) => {
      const doc = ctx.get(editorViewCtx).state.doc;
      have = blocksOf(doc).map((b) => b.type);
      doc.descendants((n) => void (n.type.name === 'image' && have.push(IMAGE)));
    });
    const chosen = await blocks!.choose({ image: !!addImage, have });
    if (!chosen) return;
    if (chosen.type === IMAGE) return image();
    editor.current?.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      const { state } = view;
      const node = siteBlockSchema.type(ctx).create({ type: chosen.type, props: chosen.props });
      if (blocks!.list.find((b) => b.type === chosen.type)?.inline) fresh.add(chosen.props);
      let tr = state.tr;
      // Where the new block ends, when the cursor must be moved past it (-1: it is in text already).
      let end = -1;
      if (state.selection instanceof NodeSelection) {
        tr = tr.insert(state.selection.to, node);
        end = state.selection.to + node.nodeSize;
      } else {
        tr = tr.replaceSelectionWith(node);
        if (tr.selection instanceof NodeSelection) end = tr.selection.to;
      }
      if (end >= 0) {
        if (!tr.doc.resolve(end).nodeAfter?.isTextblock) tr = tr.insert(end, state.schema.nodes.paragraph.create());
        tr = tr.setSelection(TextSelection.create(tr.doc, end + 1));
      }
      // A section whose heading is written above its card gets one, its name, selected to write over.
      const chosenBlock = blocks!.list.find((b) => b.type === chosen.type);
      if (chosenBlock?.lead?.heading) {
        let at = -1;
        tr.doc.forEach((n, offset) => void (n === node && (at = offset)));
        if (at >= 0) {
          tr = tr.insert(at, state.schema.nodes.heading.create({ level: 2 }, state.schema.text(chosenBlock.label)));
          tr = tr.setSelection(TextSelection.create(tr.doc, at + 1, at + 1 + chosenBlock.label.length));
        }
      }
      view.dispatch(tr.scrollIntoView());
      view.focus();
    });
  }

  insertRef.current = blocks ? () => void block() : null;

  const all: {
    label: string;
    icon: typeof TextB;
    action: (e: ReactMouseEvent<HTMLButtonElement>) => void;
    on?: string;
    large?: boolean;
    role?: string;
  }[] = [
    // The settings of the section the cursor's H1 or H2 starts (not a fixed page's text, whose H2s are its sections' names; the front
    // page has it for its H2s, but not for its H1, which stays the banner without a colour). It is 48 dp, as a
    // tap needs, and `tools` below puts it last on the first line, before the tools that may go under the arrow.
    ...(framed && active.includes('section') && !(sections && active.includes('section-h1')) && (blocks ?? sheetProp)
      ? [{ label: t.text.sectionSettings, icon: SectionSettingsIcon, action: sectionSettings, large: true, role: 'settings' }]
      : []),
    { label: t.text.bold, icon: TextB, action: () => run(toggleStrongCommand), on: 'strong' },
    { label: t.text.italic, icon: TextItalic, action: () => run(toggleEmphasisCommand), on: 'emphasis', role: 'italic' },
    { label: t.text.link, icon: LinkSimple, action: link, on: 'link', role: 'link' },
    // On a page the levels in choices (H1 until the text has one); a blog post has H2 and H3.
    ...(h1 ? choices : [2, 3]).map((level) => ({
      label: [t.text.pageHeading, t.text.heading, t.text.subheading][level - 1],
      icon: [TextHOne, TextHTwo, TextHThree][level - 1],
      action: () => setKind(`h${level}`),
      on: `h${level}`,
    })),
    { label: t.text.bodySmall, icon: KIND_ICONS.small.node, action: () => setKind('small'), on: 'small' },
    { label: t.text.bodyMedium, icon: KIND_ICONS.medium.node, action: () => setKind('medium'), on: 'medium' },
    { label: t.text.bodyLarge, icon: KIND_ICONS.large.node, action: () => setKind('large'), on: 'large' },
    { label: t.text.label, icon: KIND_ICONS.label.node, action: () => setKind('label'), on: 'label' },
    { label: t.text.quote, icon: KIND_ICONS.quote.node, action: () => setKind('quote'), on: 'quote' },
    { label: t.text.bulletList, icon: KIND_ICONS.bullet.node, action: () => setKind('bullet'), on: 'bullet', role: 'list' },
    { label: t.text.checkList, icon: KIND_ICONS.check.node, action: () => setKind('check'), on: 'check', role: 'list' },
    { label: t.text.orderedList, icon: KIND_ICONS.ordered.node, action: () => setKind('ordered'), on: 'ordered', role: 'list' },
    // The alignment of the paragraph or smaller heading, a menu (the icon follows the block's).
    { label: t.text.alignmentIs(alignLabel(alignIn(active))), icon: ALIGN_FACES[alignIn(active)].node, action: () => {}, role: 'align' },
    // A picture and the blocks are put in with "+" (a sheet with them all); without blocks (a blog
    // post) a picture has its own button.
    ...(blocks
      ? [{ label: t.text.insert, icon: Plus, action: block }]
      : addImage
        ? [{ label: t.text.image, icon: Image, action: image }]
        : []),
    { label: t.text.undo, icon: ArrowUUpLeft, action: () => run(undoCommand), role: 'undo' },
    { label: t.text.redo, icon: ArrowUUpRight, action: () => run(redoCommand), role: 'redo' },
  ];

  // The tools in their order (toolbarOrder.mjs): Section settings last on the first line, and what may go under the arrow at the
  // end, Undo and Redo first, then the link, so "+" stays on the first line. The arrangement is tried from the widest:
  // 'all' on one line, 'mid' with Section settings before Undo and Redo, 'priority' with the link behind it too, 'bare' with Italic and the lists as well (the last to go).
  const [arrangement, setArrangement] = useState<'all' | 'mid' | 'priority' | 'bare'>('all');
  const tools = arrangeTools(all, arrangement);

  // When the toolbar is too short for all its buttons, the kinds of text are two buttons: the headings (H1, H2, H3) and the
  // rest (T, the bulleted and the numbered list and the quote), so a heading and T both show from the start. Each shows
  // the kind where the cursor is (else its first: the heading the text can have next, and T), with an arrow and the
  // others of its group under it; a group of one (H1, while a page has none) is that button itself.
  const hasSettings = tools.some((item) => item.role === 'settings');
  const kinds = tools.filter((t) => ['h1', 'h2', 'h3', ...STYLE_KINDS].includes(t.on ?? ''));
  const isList = (t: (typeof kinds)[number]) => LIST_KINDS.includes(t.on!);
  const kindGroups = [
    kinds.filter((t) => /^h\d$/.test(t.on!)),
    kinds.filter((t) => !/^h\d$/.test(t.on!) && !isList(t)),
    kinds.filter(isList),
  ].filter((g) => g.length);
  const groupOf = (group: typeof kinds): KindGroup => (/^h\d$/.test(group[0].on!) ? 'headings' : isList(group[0]) ? 'list' : 'text');
  const shownOf = (group: typeof kinds) => group.find((t) => active.includes(t.on!)) ?? group.find((t) => t.on === 'medium') ?? group[0];
  const [narrow, setNarrow] = useState(false);
  const kindsShown = kindsAt ? (kindGroups.find((group) => groupOf(group) === kindsAt.group) ?? []) : [];
  useEffect(() => {
    const bar = toolbar.current!;
    // A button is 2.5rem, with 0.125rem between them and 0.25rem around them, and each of the lines
    // between the groups 0.5rem (the classes below).
    const fits = () => setNarrow(bar.clientWidth < tools.length * 42 + 6 + (3 + (hasSettings ? 1 : 0)) * 10 + (hasSettings ? 8 : 0));
    const watch = new ResizeObserver(fits);
    watch.observe(bar);
    return () => watch.disconnect();
  }, [tools.length, hasSettings]);
  // When the tools do not fit on one line even so, the line keeps those that fit and a button at its end (an arrow) shows
  // the rest on a second line, instead of the toolbar scrolling sideways. The tools past the first line are marked
  // data-wrapped (hidden, out of reach of Tab, while it is closed), and a line between groups that starts or ends a line
  // data-line-start or data-line-end (not drawn).
  const line = useRef<HTMLDivElement>(null);
  const lineId = useId();
  const { overflows, expanded, setExpanded } = useToolbarLines(toolbar, line, [tools.map((item) => item.label).join('|'), narrow]);
  const open = overflows && expanded;
  // After each measure: which arrangement shows what must stay on the first line (tools wrapped that may not wrap: not
  // Undo, Redo or the link, and not the arrow). A change of the width starts again from all on one line.
  useLayoutEffect(() => {
    const wrapped = [...(line.current?.querySelectorAll<HTMLElement>('button[data-wrapped]') ?? [])];
    const listLabels = [t.text.list, t.text.bulletList, t.text.checkList, t.text.orderedList];
    const mayWrap = (label: string) =>
      [t.text.undo, t.text.redo, t.text.link].includes(label) ||
      label.startsWith(t.text.alignmentIs('')) ||
      (arrangement === 'bare' && (listLabels.includes(label) || label.startsWith(t.text.listIs(''))));
    const next = nextArrangement(arrangement, {
      any: wrapped.length > 0,
      kept: wrapped.some((el) => !mayWrap(el.getAttribute('aria-label') ?? '')),
    });
    if (next !== arrangement) setArrangement(next);
  });
  const barWidth = useRef(0);
  useEffect(() => {
    const bar = toolbar.current!;
    const watch = new ResizeObserver(() => {
      if (Math.abs(bar.clientWidth - barWidth.current) < 1) return;
      barWidth.current = bar.clientWidth;
      setArrangement('all');
    });
    watch.observe(bar);
    return () => watch.disconnect();
  }, []);

  const tool = ({ label, icon, action, on, large, role }: (typeof tools)[number]) =>
    role === 'align' ? (
      <ToolbarButton
        key="align"
        icon={icon}
        label={label}
        menu={!!alignAt && alignAt.closest('.editor-selection-menu') === null}
        onClick={(e) => setAlignAt(alignAt === e.currentTarget ? null : e.currentTarget)}
      />
    ) : (
      <ToolbarButton key={label} icon={icon} label={label} selected={on ? active.includes(on) : undefined} large={large} onClick={action} />
    );

  // The lines between the marks on the text, the kinds of text, "+" (or "Picture") and "Undo".
  const lineBefore = (item: (typeof tools)[number]) =>
    item.role === 'settings' || item === kinds[0] || item.icon === Plus || item.icon === Image || item.icon === ArrowUUpLeft;
  // A button of the toolbar; when it is too short, each group of kinds of text is one button (at its first), with a menu.
  const button = (item: (typeof tools)[number]) => {
    if (!narrow || !kinds.includes(item)) return tool(item);
    const members = kindGroups.find((g) => g[0] === item);
    if (!members) return null;
    if (members.length === 1) return tool(item);
    const group = groupOf(members);
    const generic =
      (group === 'headings' && headingKindOf(active, inText) === 'generic') ||
      (group === 'text' && styleKindOf(active, inText) === 'generic') ||
      (group === 'list' && listKindOf(active, inText) === 'generic');
    const shown = shownOf(members);
    const [genericIcon, genericLabel, labelIs] =
      group === 'list'
        ? [GENERIC_ICONS.list.node, t.text.list, t.text.listIs]
        : group === 'headings'
          ? [GENERIC_ICONS.heading.node, t.text.heading, t.text.kindIs]
          : [GENERIC_ICONS.text.node, t.text.kind, t.text.kindIs];
    const opened = kindsAt?.group === group && !kindsAt.word;
    // Not marked: it always shows a kind of its group (the menu under it marks the one there is).
    return (
      <ToolbarButton
        key={`kinds-${group}`}
        icon={generic ? genericIcon : shown.icon}
        label={generic ? genericLabel : labelIs(shown.label)}
        menu={opened}
        onClick={(e) => setKindsAt(opened ? null : { at: e.currentTarget, group })}
      />
    );
  };

  return (
    <div className="rounded-panel bg-surface-container-lowest">
      {/* The top edge of the text's box: it draws its own border and rounded corners, so the box's side lines start under it and never run past it when it sticks; no shadow. Stays at the top of the screen while scrolling through the text (under the safe area, as the top bar scrolls away). The buttons are centred on one line; when they do not fit, the line starts at the left and
          the arrow at its end shows the rest on a second line (measure above). */}
      <Toolbar
        ref={toolbar}
        label={t.text.tools}
        className="editor-tools sticky top-[env(safe-area-inset-top)] z-10 items-start rounded-t-panel border border-outline-variant pb-(--toolbar-docked-padding-block)"
      >
        <div
          ref={line}
          id={lineId}
          className={[
            'editor-tools-line flex min-w-0 flex-1 flex-wrap items-center gap-[0.125rem]',
            overflows ? 'justify-start' : 'justify-center',
            !open && 'editor-tools-closed',
            hasSettings && 'editor-tools-tall',
            arrangement !== 'all' && 'editor-tools-compact',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {tools.map((tool) => (
            <ReactFragment key={tool.label}>
              {lineBefore(tool) && <span aria-hidden="true" className="mx-1 my-2 w-px shrink-0 self-stretch bg-outline-variant" />}
              {button(tool)}
            </ReactFragment>
          ))}
        </div>
        {overflows && (
          <ToolbarButton
            icon={open ? CaretUp : CaretDown}
            label={open ? t.text.fewerTools : t.text.moreTools}
            expanded={open}
            controls={lineId}
            onClick={() => setExpanded(!open)}
          />
        )}
      </Toolbar>
      {/* The rest of the selection menu: the site's colours (text-colors.mjs), each named in its colour, as it is in the text
          (its class), and "No color" in the text's own; then the text styles, the lists and the alignment. */}
      <BottomSheet ref={moreSheet} aria-label={t.text.more}>
        <SheetTitle title={t.text.more} onClose={() => moreSheet.current?.close()} />
        <SheetBody>
          {!noColor && (
            <>
              <SheetGroupTitle>{t.text.color}</SheetGroupTitle>
              {TEXT_COLORS.map((name) => (
                <SheetChoice key={name} selected={active.includes(colorClass(name))} onClick={() => chosen(() => color(name))}>
                  <span className={colorClass(name)}>{t.text.colors[name as keyof typeof t.text.colors]}</span>
                </SheetChoice>
              ))}
              <SheetChoice selected={!active.includes('textColor')} onClick={() => chosen(() => color(null))}>
                <span className="text-on-surface">{t.text.noColor}</span>
              </SheetChoice>
            </>
          )}
          {(
            [
              [t.text.kind, all.filter(({ on }) => TEXT_KINDS_IN_SHEET.includes(on ?? ''))],
              [t.text.list, all.filter(({ on }) => LIST_KINDS.includes(on ?? ''))],
            ] as const
          ).map(([title, items]) => (
            <ReactFragment key={title}>
              <SheetGroupTitle>{title}</SheetGroupTitle>
              {items
                .filter(({ on }) => on !== 'label' || active.includes('labelable'))
                .map(({ label, icon: Glyph, on }) => (
                  <SheetChoice key={label} icon={Glyph} selected={active.includes(on!)} onClick={() => chosen(() => setKind(on!))}>
                    {label}
                  </SheetChoice>
                ))}
            </ReactFragment>
          ))}
          {active.includes('alignable') && (
            <>
              <SheetGroupTitle>{t.text.alignment}</SheetGroupTitle>
              {(Object.keys(ALIGN_FACES) as Align[]).map((align) => (
                <SheetChoice
                  key={align}
                  icon={ALIGN_FACES[align].node}
                  selected={alignIn(active) === align}
                  onClick={() => chosen(() => editor.current?.action((ctx) => alignSelection(ctx.get(editorViewCtx), align)))}
                >
                  {alignLabel(align)}
                </SheetChoice>
              ))}
            </>
          )}
        </SheetBody>
      </BottomSheet>
      <Menu anchor={alignAt} label={t.text.alignment} onClose={() => setAlignAt(null)}>
        {(Object.keys(ALIGN_FACES) as Align[]).map((align) => (
          <MenuItem
            key={align}
            icon={ALIGN_FACES[align].node}
            selected={alignIn(active) === align}
            onClick={() => {
              setAlignAt(null);
              editor.current?.action((ctx) => alignSelection(ctx.get(editorViewCtx), align));
            }}
          >
            {alignLabel(align)}
          </MenuItem>
        ))}
      </Menu>
      <Menu anchor={kindsAt?.at ?? null} label={kindsAt?.group === 'list' ? t.text.list : t.text.kind} onClose={() => setKindsAt(null)}>
        {kindsShown
          .filter(({ on }) => on !== 'label' || active.includes('labelable'))
          .map(({ label, icon, action, on }) => (
            <MenuItem key={label} icon={icon} selected={active.includes(on!)} onClick={action as () => void}>
              {label}
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
