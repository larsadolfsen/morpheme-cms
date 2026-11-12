// "Testimonials list": its head in the text (BlockHead.tsx), and Rows.tsx with the spacing of a block in the text.
import BlockHead from '@theme/blocks/BlockHead';
import Rows from '@theme/blocks/testimoniallist/Rows';
import type { TestimonialListView } from '@morphemecms/cms/src/standard/testimoniallist/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function TestimonialList({ view }: { view: TestimonialListView }) {
  return (
    <>
      <BlockHead view={view} />
      <Rows testimonials={view.testimonials} filters={view.filters} className={useInText() || undefined} />
    </>
  );
}
