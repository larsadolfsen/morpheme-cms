// "Blog": its posts as on the blog page, the newest large and the rest as a list (BlogPosts.tsx), with the space of a
// block in the text; the blog page draws them across the page (templates/Blog.astro, BlogPosts.astro). In the editor,
// under them, how many more there are.
import BlogPosts from '@theme/components/BlogPosts';
import type { BlogView } from '@interstellarcms/cms/src/standard/blog/view';
import { useInText } from '@interstellarcms/cms/src/standard/view';
import { formatDate } from '@interstellarcms/cms/site/format';

export default function Blog({ view }: { view: BlogView }) {
  return (
    <div className={useInText()}>
      <BlogPosts posts={view.posts.map((p) => ({ ...p, dateText: formatDate(new Date(p.date)) }))} />
      {view.note && <p className="block-posts-note">{view.note}</p>}
    </div>
  );
}
