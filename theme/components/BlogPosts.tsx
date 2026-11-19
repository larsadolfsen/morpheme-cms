// Posts with the newest large, the rest as a list (PostList.tsx); without any, a note and a link to all the posts: a
// tag's page (BlogPosts.astro puts it in the page's width), and the standard block "Blog posts" with "Newest large"
// (blocks/posts/View.tsx), as on the blog page.
import Img from '@theme/components/Img';
import PostList from '@theme/components/PostList';
import PostMeta from '@theme/components/PostMeta';
import type { PostView } from '@theme/components/posts';
import { Link } from '@morphemecms/cms/src/standard/view';
import { BREAKPOINTS } from '@morphemecms/cms/lib/breakpoints.mjs';
import { siteT } from '@morphemecms/cms/src/i18n';

export default function BlogPosts({ posts }: { posts: PostView[] }) {
  const [featured, ...rest] = posts;
  if (!featured)
    return (
      <div className="mo-blog-empty">
        <p className="mo-type-title-medium">{siteT.theme.noPosts}</p>
        <Link href="/blog/" className="mo-link mo-blog-empty__link">
          {siteT.theme.seeAllPosts}
        </Link>
      </div>
    );
  return (
    <>
      <Link href={featured.href} className="mo-blog-featured">
        {featured.image && (
          <div className="mo-blog-featured__picture">
            <Img
              image={featured.image}
              alt={featured.imageAlt ?? ''}
              fetchPriority="high"
              className="mo-blog-featured__image"
              sizes={`(min-width: ${BREAKPOINTS.expanded}px) 55vw, calc(100vw - 40px)`}
            />
          </div>
        )}
        <div className="mo-blog-featured__text">
          <PostMeta post={featured} />
          <h2 className="mo-type-headline-medium mo-blog-featured__title">{featured.title}</h2>
          <p className="mo-blog-featured__description">{featured.description}</p>
        </div>
      </Link>
      {rest.length > 0 && <PostList posts={rest} className="mo-blog-featured__rest" />}
    </>
  );
}
