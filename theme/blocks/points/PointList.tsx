// Points side by side where there is room (.block-points in ../blocks.css), a list without dividers (List.tsx in
// ../../ui/): each is an item with its icon leading it, its heading as the headline and its text as the supporting
// text, and, with a page and a link text, the link after the text: the standard block "Points with icon".
// `className`: the site's own classes on the list.
import List, { ListItem } from '@theme/ui/List';
import type { Point } from '@morphemecms/cms/src/standard/points/view';
import { Link } from '@morphemecms/cms/src/standard/view';

export default function PointList({ items, className }: { items: Point[]; className?: string }) {
  return (
    <List dividers="none" className={className ? `block-points ${className}` : 'block-points'}>
      {items.map((p, i) => (
        <ListItem
          key={i}
          leadingIcon={p.icon}
          headline={p.title}
          supporting={
            <>
              {p.text}
              {p.more && p.href && (
                <>
                  {' '}
                  <Link href={p.href} className="block-link">
                    {p.more}
                  </Link>
                </>
              )}
            </>
          }
        />
      ))}
    </List>
  );
}
