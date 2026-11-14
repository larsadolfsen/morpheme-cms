// What the text's one bar shows for the block that is active: typed in place, or a card that was tapped (MarkdownEditor.tsx; docs/superpowers/specs/2026-11-13-contextual-toolbar-row-design.md,
// PR 2 and 4): the block (a node view, not React) tells this store its tools, the bar (React) reads it. One block is active at a time; a block that is not
// the active one cannot clear it. No dependencies, no browser.
import type { BarAction } from './contextualMenu';

/** A row of the block's own menu (Edit, Hide, Move up, Move down, Remove): a raw SVG icon, its name, what it does (`keyboard`: chosen with the keyboard). */
export type CardRow = { icon: string; label: string; action: (keyboard: boolean) => void; danger?: boolean };

export type BlockBarState = {
  /** The block's name: the name of the bar's group for screen readers. */
  name: string;
  /** The active row's actions (Add above, Add below, Move up, Move down, Link, the Table's column actions). */
  actions: BarAction[];
  /** The gear: the item's settings, or the block's own; missing for a block with none. */
  edit?: { label: string; action: () => void };
  /** The shortcut to the block's `Rows from` settings, shown pressed while the block reads a list. */
  dynamic?: { label: string; on: boolean; action: () => void };
  /** While blocks are selected: the count with a cross (two slots wide, first on the bar); tapping it clears the selection. */
  count?: { n: number; label: string; action: () => void };
  /** The block's own menu, in the bar's `⋮` after the tools: Edit, Hide, Move, Remove (a card selected by a tap has its Edit as the gear). */
  menu: CardRow[];
};

let current: { owner: object; state: BlockBarState } | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export const blockBar = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  },
  /** The active block's state, the same object until it changes; null when no block is active. */
  get: (): BlockBarState | null => current?.state ?? null,
  /** The block `owner` is active with these tools. */
  show(owner: object, state: BlockBarState) {
    current = { owner, state };
    emit();
  },
  /** The block `owner` is no longer active (not when another block has become the active one). */
  hide(owner: object) {
    if (current?.owner !== owner) return;
    current = null;
    emit();
  },
};

/** The order of the block's tools (owner order, 14 Nov): the first ones that fit are on the bar (four at 375 px), the rest in the `⋮`. A List's rows: Add below,
 * Add above, Settings (the gear), Link, Fill from a list, then Move up and Move down last (a block moves by its handle too). A Table: Row below, Row above,
 * Column after, Column before, then Table settings (the gear), the deletes and the alignments. 'gear' and 'dynamic' are the gear and the dynamic
 * button; the other names are the kinds of BarAction (`below`, `above` are rows: the Table's rows too). */
export const BLOCK_TOOL_ORDER = [
  'below',
  'above',
  'column-after',
  'column-before',
  'gear',
  'link',
  'dynamic',
  'up',
  'down',
  'delete-row',
  'delete-column',
  'align-left',
  'align-center',
  'align-right',
  'align-auto',
];

/** The ids of the block's tools in their order on the bar (`gear` only when the state has one). */
export function blockToolIds(state: BlockBarState): string[] {
  const have = new Set<string>([
    ...state.actions.map((a) => a.kind),
    ...(state.edit ? ['gear'] : []),
    ...(state.dynamic ? ['dynamic'] : []),
  ]);
  return BLOCK_TOOL_ORDER.filter((id) => have.has(id));
}
