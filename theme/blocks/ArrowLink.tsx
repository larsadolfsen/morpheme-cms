// A link with an arrow after its text (.block-arrow-link in ../styles/blocks.css), last in a block or a panel: "See all
// posts" under "Blog posts", and the apps' "Read more" (@theme/blocks/ArrowLink). A theme draws it its own way with its
// own blocks/ArrowLink.tsx, with the same props. `className`: the place's own, after the part's.
import { Svg } from '@morphemecms/cms/src/icon';
import { Link } from '@morphemecms/cms/src/standard/view';

export default function ArrowLink({ href, label, className }: { href: string; label: string; className?: string }) {
  return (
    <Link href={href} className={className ? `block-arrow-link ${className}` : 'block-arrow-link'}>
      {label}
      <Svg name="arrow-right" size={18} />
    </Link>
  );
}
