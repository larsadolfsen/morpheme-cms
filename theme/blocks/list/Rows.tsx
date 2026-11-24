// The rows of "List": the theme's list (List.tsx in ../../ui/), standard (its lines between the rows are the
// theme's: the divider's, none in Material) or `segmented`. Each row is an item with its icon leading it, its heading as
// the headline and its text as the supporting text, and, with a page, the whole row is a link with an arrow after it.
// If any row has a text, all rows have two lines, so they look alike. `className`: the classes of where it is (the
// spacing of a block in the text).
import List, { ListItem } from '@theme/ui/List';
import { leadingProps } from '@morphemecms/cms/src/standard/list/leading';
import { iconColorOf } from '@morphemecms/cms/src/iconColor';
import type { ListRow } from '@morphemecms/cms/src/standard/list/view';

export default function Rows({
  items,
  segmented,
  className,
  cut,
  oneColumn,
}: {
  items: ListRow[];
  segmented?: boolean;
  className?: string;
  /** `Max rows` of the lists: the rows from this one on are extra (MoreRows.tsx). */
  cut?: number;
  /** The setting Columns is off: one column, whatever the width (data-columns, blocks.css). */
  oneColumn?: boolean;
}) {
  const withText = items.some((r) => r.text);
  return (
    <List
      kind={segmented ? 'segmented' : 'standard'}
      className={className ? `mo-block-list ${className}` : 'mo-block-list'}
      data-columns={oneColumn ? 'one' : undefined}
    >
      {items.map((r, i) => (
        <ListItem
          key={i}
          href={r.href || undefined}
          leadingIcon={r.icon || undefined}
          {...leadingProps(r)}
          data-icon-color={r.icon ? iconColorOf(r.iconColor) : undefined}
          headline={r.title}
          supporting={withText ? (r.text ?? '') : undefined}
          trailingIcon={r.href ? 'caret-right' : undefined}
          {...(cut !== undefined && i >= cut ? { 'data-extra': '' } : {})}
        />
      ))}
    </List>
  );
}
