// A block's head (its contract: @interstellarcms/cms/src/standard/head.ts), over the standard blocks that start a section
// ("Kort", "Punkter med ikon", "Trin", "Udtalelser", "Spørgsmål og svar", "Blogindlæg", "Foldeliste"), in the text's
// style (InProse). Only a heading: the heading itself, as the text has its headings. With a label above it ("Etiket")
// or a subheading under it ("Underoverskrift"): the three together (.block-head in ../styles/blocks.css, an <hgroup>),
// each only when it is there. Nothing without any of them.
import type { HeadView } from '@interstellarcms/cms/src/standard/head';
import { InProse } from '@interstellarcms/cms/src/standard/view';

export default function BlockHead({ view }: { view: HeadView }) {
  const { eyebrow, heading, subheading } = view;
  if (!eyebrow && !subheading)
    return heading ? (
      <InProse>
        <h2>{heading}</h2>
      </InProse>
    ) : null;
  return (
    <InProse>
      <hgroup className="block-head">
        {eyebrow && <p className="block-eyebrow">{eyebrow}</p>}
        {heading && <h2>{heading}</h2>}
        {subheading && <p className="block-subheading">{subheading}</p>}
      </hgroup>
    </InProse>
  );
}
