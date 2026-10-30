// Points side by side where there is room (.block-points in ../blocks.css): each with an icon in a circle, a heading,
// a text and, with a page and a link's text, the link after the text: the standard block "Punkter med ikon".
// `className`: the site's own classes on the list.
import { Svg } from '@interstellarcms/cms/src/icon';
import type { Point } from '@interstellarcms/cms/src/standard/points/view';
import { Link } from '@interstellarcms/cms/src/standard/view';

export default function PointList({ items, className }: { items: Point[]; className?: string }) {
  return (
    <ul className={className ? `block-points ${className}` : 'block-points'}>
      {items.map((p, i) => (
        <li key={i} className="block-point">
          <span className="block-point-icon">
            <Svg name={p.icon} size={24} />
          </span>
          <div>
            <h3 className="block-point-title">{p.title}</h3>
            <p className="block-point-text">
              {p.text}
              {p.more && p.href && (
                <>
                  {' '}
                  <Link href={p.href} className="block-link">
                    {p.more}
                  </Link>
                </>
              )}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
