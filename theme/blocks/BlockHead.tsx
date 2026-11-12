// A block's head (its contract: @morphemecms/cms/src/standard/head.ts), over the standard blocks that start a section
// ("Cards", "Points with icon", "List", "Steps", "Testimonials", "Questions and answers", "Blog posts", "Expandable list"), in the text's
// style (InProse). Only a heading: the heading itself, as the text has its headings. With a subheading under it ("Subheading"):
// the two together (.block-head in ../styles/blocks.css, an <hgroup>). Nothing without any of them.
import type { HeadView } from '@morphemecms/cms/src/standard/head';
import { InProse } from '@morphemecms/cms/src/standard/view';

export default function BlockHead({ view }: { view: HeadView }) {
  const { heading, subheading } = view;
  if (!subheading)
    return heading ? (
      <InProse>
        <h2>{heading}</h2>
      </InProse>
    ) : null;
  return (
    <InProse>
      <hgroup className="block-head">
        {heading && <h2>{heading}</h2>}
        {subheading && <p className="block-subheading">{subheading}</p>}
      </hgroup>
    </InProse>
  );
}
