// "Points with icon": its head in the text (BlockHead.tsx), and PointList.tsx with the spacing of a block in the text.
import BlockHead from '@theme/blocks/BlockHead';
import PointList from '@theme/blocks/points/PointList';
import type { PointsView } from '@morphemecms/cms/src/standard/points/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

export default function Points({ view }: { view: PointsView }) {
  return (
    <>
      <BlockHead view={view} />
      <PointList items={view.items} className={useInText() || 'block-in-text'} />
    </>
  );
}
