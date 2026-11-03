// One testimonial, word for word, on an outlined card (Card.tsx in ../../ui/, .block-testimonial in ../blocks.css): the
// standard block "Udtalelser" (Slider.tsx, List.tsx), and a site's own testimonials (this site's front page). A long
// text is cut after seven lines with a "Læs mere" button that unfolds it in place: on the site by script.ts (only with
// JavaScript; without it the whole text is shown), in the editor here. `full` always shows everything, with the anchor the testimonials page has it by. Its
// tags (none unless shown) are chips (Chip), each a link to the tag's page when it has one. `short` shows the first two lines and
// links to the whole text on the testimonials page. "Læs mere" and "Vis mindre" are the block's shared texts. Before
// the name its picture, round, or without one the theme's mark, with the name's first letter as `data-initial` for a
// theme that shows it (the standard theme's and Material's avatars; a theme with a logo as its mark leaves it out).
import { useLayoutEffect, useRef, useState } from 'react';
import Card from '@theme/ui/Card';
import { Svg } from '@morpheme/cms/src/icon';
import { siteT } from '@morpheme/cms/src/i18n';
import type { TestimonialTexts, TestimonialView } from '@morpheme/cms/src/standard/testimonials/view';
import { Link, useOnSite } from '@morpheme/cms/src/standard/view';
import Chip from '@theme/ui/Chip';

export default function Testimonial({
  testimonial: t,
  texts,
  full = false,
  short = false,
  className,
}: {
  testimonial: TestimonialView;
  texts: TestimonialTexts;
  full?: boolean;
  short?: boolean;
  className?: string;
}) {
  const onSite = useOnSite();
  // In the editor: whether it is unfolded, and whether its text is cut (measured once it is drawn).
  const [open, setOpen] = useState(false);
  const [cut, setCut] = useState(true);
  const text = useRef<HTMLQuoteElement>(null);
  useLayoutEffect(() => {
    const el = text.current;
    if (el && !open && !onSite) setCut(el.scrollHeight > el.clientHeight + 2);
  });
  const clamp = !full && !open && !onSite;
  return (
    <Card
      as="figure"
      className={className ? `block-testimonial ${className}` : 'block-testimonial'}
      data-testimonial=""
      id={full ? t.anchor : undefined}
    >
      <div className="block-testimonial-head">
        <span className="block-testimonial-quote-mark" aria-hidden="true">
          “
        </span>
        {t.tags.length > 0 && (
          <span className="block-testimonial-tags">
            {t.tags.map((tag) =>
              tag.href ? <Chip key={tag.name} href={tag.href} label={tag.name} /> : <Chip key={tag.name} plain label={tag.name} />,
            )}
          </span>
        )}
      </div>
      {short ? (
        <>
          <blockquote className="block-testimonial-text block-testimonial-short">{t.quote.join(' ')}</blockquote>
          <Link href={t.href} className="block-testimonial-more">
            {texts.more} <span className="block-sr-only">{siteT.blocks.testimonials.from(t.name)}</span>
            <Svg name="arrow-right" size={16} />
          </Link>
        </>
      ) : (
        <blockquote
          ref={text}
          className="block-testimonial-text"
          data-clamp={full ? undefined : ''}
          style={
            clamp
              ? {
                  maxHeight: 'calc(1.625em * 7)',
                  overflow: 'hidden',
                  // Faded at the bottom only when it is cut.
                  ...(cut ? { maskImage: 'linear-gradient(to bottom, #000 55%, transparent)' } : {}),
                }
              : undefined
          }
        >
          {t.context && <p className="block-testimonial-context">{t.context}</p>}
          {t.quote.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </blockquote>
      )}
      {!full && !short && (
        <button
          type="button"
          className="block-testimonial-more"
          aria-expanded={open}
          data-expand=""
          data-more={texts.more}
          data-less={texts.less}
          hidden={onSite || !cut}
          onClick={() => setOpen(!open)}
        >
          <span>{open ? texts.less : texts.more}</span>
          <Svg name="caret-down" size={16} />
        </button>
      )}
      <figcaption className="block-testimonial-name">
        {t.image ? (
          <img
            className="block-testimonial-picture"
            src={t.image.src}
            srcSet={t.image.srcset}
            sizes={t.image.srcset ? '48px' : undefined}
            width={t.image.width}
            height={t.image.height}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="block-testimonial-mark" aria-hidden="true" data-initial={[...t.name.trim()][0]?.toLocaleUpperCase()}></span>
        )}
        {t.name}
      </figcaption>
    </Card>
  );
}
