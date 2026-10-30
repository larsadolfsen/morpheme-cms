// "Blogindlæg": its head in the text (BlockHead.tsx), then PostCards.tsx (two by two when there are four) with "Alle indlæg" under
// them, with the space of a block in the text; in the editor, when they are picked at random, how many it picks from.
import ArrowLink from '@theme/blocks/ArrowLink';
import BlockHead from '@theme/blocks/BlockHead';
import PostCards from '@theme/blocks/posts/PostCards';
import type { PostsView } from '@interstellarcms/cms/src/standard/posts/view';
import { useInText } from '@interstellarcms/cms/src/standard/view';

export default function Posts({ view }: { view: PostsView }) {
  return (
    <>
      <BlockHead view={view} />
      <div className={`${useInText() || 'block-in-text'} block-posts-in-text`}>
        {view.note && <p className="block-posts-note">{view.note}</p>}
        <PostCards posts={view.posts} count={view.count} random={view.random} narrow />
        <ArrowLink href={view.all.href} label={view.all.text} className="block-posts-all" />
      </div>
    </>
  );
}
