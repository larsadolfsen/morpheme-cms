// "Testimonial cards": its head in the text (BlockHead.tsx), then its testimonials as cards to leaf through (Slider.tsx), with the space of a block
// in the text. The same testimonials as rows are "Testimonials list" (../testimoniallist/).
import BlockHead from '@theme/blocks/BlockHead';
import Slider from '@theme/blocks/testimonials/Slider';
import type { TestimonialsView } from '@morphemecms/cms/src/standard/testimonials/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function Testimonials({ view }: { view: TestimonialsView }) {
  const inText = useInText() || 'block-in-text';
  return (
    <>
      <BlockHead view={view} />
      <Slider testimonials={view.testimonials} texts={view.texts} label={view.label} className={inText} />
    </>
  );
}
