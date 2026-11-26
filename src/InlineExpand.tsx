// "Expandable list" typed in place (docs/superpowers/specs/2026-11-12-inline-block-editing-design.md): the same as the List (owner, 16 Nov 2026: "The white
// list is the correct one"), so it is InlineList.tsx: the rows' heading and text typed where they stand, the icon in a slot, the link slot at the end of
// the active row and the toolbar's Link opening the row's page picker, and the row's one text button typed on the open row (no sheet), `Add list row` under the last row. Only the rows fold out (the
// active one open); the design (the rows on the page, or each on its own surface) is the block's `design`. An Expandable list that reads a list ("Rows from")
// is drawn by RowsFromList (InlineList.tsx), not typed.
import InlineList, { type Row } from './InlineList';
import type { InlineViewProps } from './inlineViews';

export default function InlineExpand({
  items,
  props,
  active,
  focus,
  onChange,
  onSettings,
  onIcon,
  onPick,
  folds,
  onFold,
}: InlineViewProps) {
  return (
    <InlineList
      items={items as Row[]}
      props={props}
      active={active}
      focus={focus}
      onChange={onChange}
      onSettings={onSettings}
      onIcon={onIcon}
      fold
      folds={folds}
      onFold={onFold}
      onPick={onPick}
    />
  );
}
