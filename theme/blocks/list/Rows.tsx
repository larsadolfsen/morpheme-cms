// The rows of "List": the theme's list (List.tsx in ../../ui/), standard (its lines between the rows are the
// theme's: --list-divider, none in Material) or segmented. Each row is an item with its icon leading it, its heading as
// the headline and its text as the supporting text, and, with a page, the whole row is a link with an arrow after it.
// If any row has a text, all rows have two lines, so they look alike. `className`: the classes of where it is (the
// spacing of a block in the text).
import List, { ListItem } from '@theme/ui/List';
import type { ListDesign, ListRow } from '@morphemecms/cms/src/standard/list/view';

export default function Rows({ items, design, className }: { items: ListRow[]; design: ListDesign; className?: string }) {
  const withText = items.some((r) => r.text);
  return (
    <List kind={design === 'segmented' ? 'segmented' : 'standard'} className={className ? `block-list ${className}` : 'block-list'}>
      {items.map((r, i) => (
        <ListItem
          key={i}
          href={r.href || undefined}
          leadingIcon={r.icon || undefined}
          headline={r.title}
          supporting={withText ? (r.text ?? '') : undefined}
          trailingIcon={r.href ? 'caret-right' : undefined}
        />
      ))}
    </List>
  );
}
