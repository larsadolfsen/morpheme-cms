// "Links": its heading in the text, and LinkGroups.tsx with the space of a block in the text.
import LinkGroups from '@theme/blocks/links/LinkGroups';
import type { LinksView } from '@morpheme/cms/src/standard/links/view';
import { InProse, useInText } from '@morpheme/cms/src/standard/view';

export default function Links({ view }: { view: LinksView }) {
  return (
    <>
      {view.heading && (
        <InProse>
          <h2>{view.heading}</h2>
        </InProse>
      )}
      <LinkGroups groups={view.groups} className={useInText() || 'block-in-text'} />
    </>
  );
}
