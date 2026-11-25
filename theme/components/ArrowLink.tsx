// "Read about ..." with an arrow. Without href a span, for use inside a card that is itself a link; in the editor only drawn.
// `label`: its text.
import { Svg } from '@morphemecms/cms/src/icon';
import { Link } from '@morphemecms/cms/src/standard/view';

export default function ArrowLink({ href, label, className }: { href?: string; label: string; className?: string }) {
  const classes = ['mo-arrow-link', className].filter(Boolean).join(' ');
  const inside = (
    <>
      {label}
      <Svg name="arrow_forward" size={18} />
    </>
  );
  return href ? (
    <Link href={href} className={classes}>
      {inside}
    </Link>
  ) : (
    <span className={classes}>{inside}</span>
  );
}
