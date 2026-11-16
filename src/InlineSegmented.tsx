// The Segmented list typed in place (docs/superpowers/specs/2026-11-12-inline-block-editing-design.md): the same as the List (owner, 16 Nov 2026:
// "The white list is the correct one"), so it is InlineList.tsx: the rows' heading and text typed where they stand, the icon in a slot, the link
// slot at the end of the active row and the toolbar's Link opening the row's sheet (its page and its button), `Add list row` under the last row.
// Only the look differs: rows that fold out (the active one open), or, for a list whose rows are always open (`show` 'all'), each on its own surface.
// A Segmented list that reads a list ("Rows from") is drawn by RowsFromList (InlineList.tsx), not typed.
import InlineList, { type Row } from './InlineList';
import type { InlineViewProps } from './inlineViews';

export default function InlineSegmented({ items, props, active, focus, onChange, onSettings, onIcon, folds, onFold }: InlineViewProps) {
  const all = props.show === 'all';
  return (
    <InlineList
      items={items as Row[]}
      props={props}
      active={active}
      focus={focus}
      onChange={onChange}
      onSettings={onSettings}
      onIcon={onIcon}
      kind={all ? 'segmented' : 'standard'}
      fold={!all}
      folds={folds}
      onFold={onFold}
    />
  );
}
