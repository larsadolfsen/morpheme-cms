// "Punkter med ikon": its head in the text (BlockHead.tsx), and PointList.tsx with the space of a block in the text.
import BlockHead from '@theme/blocks/BlockHead';
import PointList from '@theme/blocks/points/PointList';
import type { PointsView } from '@interstellarcms/cms/src/standard/points/view';
import { useInText } from '@interstellarcms/cms/src/standard/view';

export default function Points({ view }: { view: PointsView }) {
  return (
    <>
      <BlockHead view={view} />
      <PointList items={view.items} className={useInText() || 'block-in-text'} />
    </>
  );
}
