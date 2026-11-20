// Registers the active block's actions (blockActionList.ts) while the block is active: the block (a node view, not React) tells blockBar.ts its tools, and this reads
// them once and registers each as an action, so the palette lists them, the active block's first (docs/superpowers/specs/2026-11-13-command-palette-and-context-menus-design.md,
// sections 3 and 10 step 6). Exposes watchBlockActions.
import { actions } from './actions';
import { BLOCK_TOOL_ORDER, blockBar, type BlockBarState } from './blockBar';
import { blockActionsOf } from './blockActionList';

/** Registers the active block's actions while it is active, and takes them away when it is not or another block is: one subscription for the whole editor. */
export function watchBlockActions(): () => void {
  let dispose: (() => void) | null = null;
  let last: BlockBarState | null | undefined;
  const sync = () => {
    const state = blockBar.get();
    if (state === last) return;
    last = state;
    dispose?.();
    dispose = null;
    if (!state) return;
    // An id some other part registered already (Change to) is left to it.
    const list = blockActionsOf(state, BLOCK_TOOL_ORDER).filter((a) => !actions.get(a.id));
    if (list.length) dispose = actions.register(list);
  };
  const off = blockBar.subscribe(sync);
  sync();
  return () => {
    off();
    dispose?.();
    dispose = null;
  };
}
