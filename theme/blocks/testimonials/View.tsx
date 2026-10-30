// "Udtalelser": its head in the text (BlockHead.tsx), then its testimonials in Slider.tsx or (`layout` 'list') List.tsx, with the
// space of a block in the text.
import BlockHead from '@theme/blocks/BlockHead';
import List from '@theme/blocks/testimonials/List';
import Slider from '@theme/blocks/testimonials/Slider';
import type { TestimonialsView } from '@interstellarcms/cms/src/standard/testimonials/view';
import { useInText } from '@interstellarcms/cms/src/standard/view';

export default function Testimonials({ view }: { view: TestimonialsView }) {
  const inText = useInText() || 'block-in-text';
  return (
    <>
      <BlockHead view={view} />
      {view.layout === 'list' ? (
        <List testimonials={view.testimonials} texts={view.texts} filters={view.filters} className={inText} />
      ) : (
        <Slider testimonials={view.testimonials} texts={view.texts} label={view.label} className={inText} />
      )}
    </>
  );
}
