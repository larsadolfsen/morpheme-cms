// Testimonials to leaf through in a carousel (Carousel.tsx in ../../ui/): the standard block "Udtalelser", and a site's
// own (this site's front page). One card with the next one peeking in at the edge, two on a tablet, three on a
// computer, with the carousel's page indicator under them. With one testimonial it is just the card (Testimonial.tsx);
// in the editor with none, a note. `label`: what it is called for screen readers; `short`: two lines each, with a link
// to the whole text.
import { siteT } from '@interstellarcms/cms/src/i18n';
import type { TestimonialTexts, TestimonialView } from '@interstellarcms/cms/src/standard/testimonials/view';
import { useOnSite } from '@interstellarcms/cms/src/standard/view';
import Testimonial from '@theme/blocks/testimonials/Testimonial';
import Carousel from '@theme/ui/Carousel';

const say = siteT.blocks.testimonials;

export default function Slider({
  testimonials,
  texts,
  label,
  short = false,
  className,
}: {
  testimonials: TestimonialView[];
  texts: TestimonialTexts;
  label: string;
  short?: boolean;
  className?: string;
}) {
  const onSite = useOnSite();
  if (testimonials.length === 0) return onSite ? null : <p className="block-empty">{say.none}</p>;
  if (testimonials.length === 1) return <Testimonial testimonial={testimonials[0]} texts={texts} short={short} className={className} />;
  return (
    <Carousel
      label={label}
      roleDescription={say.carousel}
      itemRoleDescription={say.slide}
      items={testimonials.map((t, i) => ({
        key: t.slug,
        label: say.slideOf(i + 1, testimonials.length),
        content: <Testimonial testimonial={t} texts={texts} short={short} />,
      }))}
      indicatorLabels={testimonials.map((t, i) => say.show1(i + 1, t.name))}
      className={className}
    />
  );
}
