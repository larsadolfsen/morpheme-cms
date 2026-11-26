// "Testimonials": its head in the text, then its testimonials in Slider.tsx or (`layout` 'list') List.tsx, with the
// space of a block in the text.
import List from '@theme/blocks/testimonials/List';
import Slider from '@theme/blocks/testimonials/Slider';
import type { TestimonialsView } from '@morphemecms/cms/src/standard/testimonials/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function Testimonials({ view }: { view: TestimonialsView }) {
  const inText = useInText() || 'mo-is-in-text';
  return (
    <>
      {view.layout === 'list' ? (
        <List testimonials={view.testimonials} filters={view.filters} className={inText} oneColumn={view.oneColumn} />
      ) : (
        <Slider testimonials={view.testimonials} texts={view.texts} label={view.label} className={inText} />
      )}
    </>
  );
}
