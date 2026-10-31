// "Blogindlæg": its head in the text (BlockHead.tsx), then its posts as the blog shows them, with the space of a block in
// the text: a list (the theme's PostList.tsx: picture, date and reading time, title and description), or the newest
// large over the list (BlogPosts.tsx, as on the blog page), with "Alle indlæg" under them when it has it. In the editor,
// when they are picked at random, how many it picks from, and when it shows all, how many more there are.
import ArrowLink from '@theme/blocks/ArrowLink';
import BlockHead from '@theme/blocks/BlockHead';
import BlogPosts from '@theme/components/BlogPosts';
import PostList from '@theme/components/PostList';
import type { PostsView } from '@interstellarcms/cms/src/standard/posts/view';
import { useInText } from '@interstellarcms/cms/src/standard/view';
import { formatDate } from '@interstellarcms/cms/site/format';

export default function Posts({ view }: { view: PostsView }) {
  const posts = view.posts.map((p) => ({ ...p, dateText: formatDate(new Date(p.date)) }));
  return (
    <>
      <BlockHead view={view} />
      <div className={`${useInText() || 'block-in-text'} block-posts-in-text`}>
        {view.note && <p className="block-posts-note">{view.note}</p>}
        {view.design === 'featured' ? <BlogPosts posts={posts} /> : <PostList posts={posts} count={view.count} random={view.random} />}
        {view.more && <p className="block-posts-note block-posts-more">{view.more}</p>}
        {view.all && <ArrowLink href={view.all.href} label={view.all.text} className="block-posts-all" />}
      </div>
    </>
  );
}
