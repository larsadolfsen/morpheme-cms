// Posts with the newest large, the rest as a list (PostList.tsx); without any, a note and a link to all the posts: a
// tag's page (BlogPosts.astro puts it in the page's width), and the standard block "Blogindlæg" with "Det nyeste stort"
// (blocks/posts/View.tsx), as on the blog page.
import Img from '@theme/components/Img';
import PostList from '@theme/components/PostList';
import PostMeta from '@theme/components/PostMeta';
import type { PostView } from '@theme/components/posts';
import { Link } from '@morpheme/cms/src/standard/view';
import { siteT } from '@morpheme/cms/src/i18n';

export default function BlogPosts({ posts }: { posts: PostView[] }) {
  const [featured, ...rest] = posts;
  if (!featured)
    return (
      <div className="rounded-panel bg-tint p-8">
        <p className="type-title-medium">{siteT.theme.noPosts}</p>
        <Link href="/blog/" className="link mt-3 inline-block">
          {siteT.theme.seeAllPosts}
        </Link>
      </div>
    );
  return (
    <>
      <Link href={featured.href} className="group grid items-center gap-6 md:grid-cols-12 md:gap-12">
        {featured.image && (
          <div className="overflow-hidden rounded-(--theme-picture-radius) md:col-span-7">
            <Img
              image={featured.image}
              alt={featured.imageAlt ?? ''}
              fetchPriority="high"
              className="aspect-[16/10] w-full object-cover [transition:scale_var(--motion-spatial-slow)] group-hover:scale-[1.03]"
              sizes="(min-width: 768px) 55vw, calc(100vw - 40px)"
            />
          </div>
        )}
        <div className="md:col-span-5">
          <PostMeta post={featured} />
          <h2 className="mt-2 type-headline-medium transition-colors group-hover:text-accent md:type-headline-large">{featured.title}</h2>
          <p className="mt-3 text-muted">{featured.description}</p>
        </div>
      </Link>
      {rest.length > 0 && <PostList posts={rest} className="mt-12 md:mt-16" />}
    </>
  );
}
