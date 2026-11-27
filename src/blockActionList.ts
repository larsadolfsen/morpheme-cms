// The active block's actions as registry entries (src/actions.ts), from what the block tells blockBar.ts (the bar's tools, its `⋮`, the action row): same names, same
// order and the same functions as the bar, its `⋮` and the row run. The action row comes first, then the bar, then the `⋮` (the order the palette lists them in). A row
// with a submenu (Change type) registers itself where it is built (`block.change-to-<type>`). Exposes blockActionsOf, blockCtx. Pure: only types are imported, so node tests it.
import type { EditorAction } from './actions';
import type { BlockBarState } from './blockBar';

/** A Material Symbols name for the kinds of tool that have a clear one (the rest are listed without an icon). */
const ICONS: Record<string, string | undefined> = {
  up: 'arrow_upward',
  down: 'arrow_downward',
  above: 'vertical_align_top',
  below: 'vertical_align_bottom',
  link: 'link',
  'align-left': 'format_align_left',
  'align-center': 'format_align_center',
  'align-right': 'format_align_right',
  crop: 'crop',
  'delete-row': 'delete',
  'delete-column': 'delete',
};

const TABLE = new Set([
  'column-before',
  'column-after',
  'delete-row',
  'delete-column',
  'align-left',
  'align-center',
  'align-right',
  'align-auto',
]);
const IMAGE = new Set(['change-image', 'crop', 'alt-text']);

/** An id part from a label: lower case letters and digits joined by hyphens. */
const slug = (label: string) =>
  label
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '');

/** What the palette knows of the active block: its name, and whether it is a Table or an image (their actions have a group of their own). */
export function blockCtx(state: BlockBarState | null) {
  if (!state || state.count) return { block: null as string | null, table: false, image: false };
  const kinds = new Set(state.actions.map((a) => a.kind as string));
  return { block: state.name, table: [...kinds].some((k) => TABLE.has(k)), image: [...kinds].some((k) => IMAGE.has(k)) };
}

/** The registry entries of a block's state, the action row first, then the bar, then the `⋮` (the order the palette lists them in). Ids are unique in the list. */
export function blockActionsOf(state: BlockBarState, order: readonly string[]): EditorAction[] {
  if (state.count) return [];
  const out: EditorAction[] = [];
  const add = (action: EditorAction) => {
    let id = action.id;
    for (let n = 2; out.some((a) => a.id === id); n++) id = `${action.id}-${n}`;
    out.push({ ...action, id });
  };
  const imageBlock = state.actions.some((a) => IMAGE.has(a.kind as string));
  // The action row above the block.
  (state.row?.items ?? []).forEach((item, order) => {
    const id = item.kind === 'up' ? 'move-up' : item.kind === 'down' ? 'move-down' : item.kind;
    add({
      id: `block.${id}`,
      label: item.label,
      icon: item.kind === 'settings' ? 'tune' : item.kind === 'visibility' ? 'visibility' : ICONS[item.kind],
      meaning: item.kind === 'settings' ? 'settings-here' : undefined,
      group: 'block',
      where: { row: { order } },
      state: () => (item.disabled ? 'disabled' : 'enabled'),
      reason: () => item.disabled?.reason,
      run: () => item.action(false),
    });
  });
  // The bar: the block's tools in the bar's order.
  const tools: { order: number; make: () => EditorAction }[] = [];
  for (const a of state.actions) {
    const kind = a.kind as string;
    const group = TABLE.has(kind) ? 'table' : IMAGE.has(kind) || (kind === 'remove' && imageBlock) ? 'image' : 'block';
    const id = kind === 'up' ? 'row-up' : kind === 'down' ? 'row-down' : kind;
    tools.push({
      order: order.indexOf(kind),
      make: () => ({
        id: `block.${id}`,
        label: a.label,
        icon: ICONS[kind],
        group,
        where: { bar: { context: 'block', order: Math.max(0, order.indexOf(kind)) } },
        pressed: a.pressed === undefined ? undefined : () => !!a.pressed,
        state: () => (a.disabled ? 'disabled' : 'enabled'),
        reason: () => a.reason,
        run: () => a.action(),
      }),
    });
  }
  if (state.edit) {
    const edit = state.edit;
    tools.push({
      order: order.indexOf('gear'),
      make: () => ({
        id: 'block.gear',
        label: edit.label,
        icon: 'tune',
        meaning: 'settings-here',
        group: 'block',
        where: { bar: { context: 'block', order: order.indexOf('gear') } },
        run: () => edit.action(),
      }),
    });
  }
  if (state.dynamic) {
    const dynamic = state.dynamic;
    tools.push({
      order: order.indexOf('dynamic'),
      make: () => ({
        id: 'block.rows-from',
        label: dynamic.label,
        icon: 'database',
        group: 'block',
        where: { bar: { context: 'block', order: order.indexOf('dynamic') } },
        pressed: () => dynamic.on,
        run: () => dynamic.action(),
      }),
    });
  }
  tools.sort((x, y) => x.order - y.order).forEach((tool) => add(tool.make()));
  // The block's own menu in the bar's `⋮`: Select block, Remove, the list page link. A row with a submenu (Change type) registers itself.
  state.menu.forEach((row, order) => {
    if (row.submenu) return;
    add({
      id: `block.menu.${slug(row.label) || order}`,
      label: row.label,
      group: imageBlock ? 'image' : 'block',
      where: { more: { context: 'block', order } },
      state: () => (row.disabled ? 'disabled' : 'enabled'),
      reason: () => row.disabled?.reason,
      run: () => row.action(false),
    });
  });
  return out;
}
