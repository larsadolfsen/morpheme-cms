// "Blog posts": its head in the text (BlockHead.tsx), then its posts as the blog shows them, with the spacing of a
// block in the text: a list (the theme's PostList.tsx: image, date and reading time, title and description), or the
// newest post large over the list (BlogPosts.tsx, as on the blog page), with "All posts" under them when it has it. In
// the editor: when the posts are picked at random, how many it picks from, and when it shows all, how many more there
// are.
import ArrowLink from '@theme/blocks/ArrowLink';
import BlockHead from '@theme/blocks/BlockHead';
import BlogPosts from '@theme/components/BlogPosts';
import PostList from '@theme/components/PostList';
import type { PostsView } from '@morphemecms/cms/src/standard/posts/view';
import { useInText } from '@morphemecms/cms/src/standard/view';
import { formatDate } from '@morphemecms/cms/site/format';

export default function Posts({ view }: { view: PostsView }) {
  const posts = view.posts.map((p) => ({ ...p, dateText: formatDate(new Date(p.date)) }));
  return (
    <>
      <BlockHead view={view} />
      <div
        className={[useInText() || 'mo-is-in-text', 'mo-block-posts__in-text', view.design !== 'featured' && 'mo-block-posts__rows']
          .filter(Boolean)
          .join(' ')}
        data-columns={view.oneColumn ? 'one' : undefined}
      >
        {view.note && <p className="mo-block-posts__note">{view.note}</p>}
        {view.design === 'featured' ? (
          <BlogPosts posts={posts} />
        ) : (
          <PostList posts={posts} count={view.count} random={view.random} columns={1} />
        )}
        {view.more && <p className="mo-block-posts__note mo-block-posts__more">{view.more}</p>}
        {view.all && <ArrowLink href={view.all.href} label={view.all.text} className="mo-block-posts__all" />}
      </div>
    </>
  );
}
