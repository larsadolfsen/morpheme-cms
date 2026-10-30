// The posts of the blog index or a category: the newest large, the rest as a list (PostList.tsx); without any, a note
// and a link to all the posts. BlogPosts.astro puts it in the page's width on the site.
import Img from '@theme/components/Img';
import PostList from '@theme/components/PostList';
import PostMeta from '@theme/components/PostMeta';
import type { PostView } from '@theme/components/posts';
import { Link } from '@interstellarcms/cms/src/standard/view';

export default function BlogPosts({ posts }: { posts: PostView[] }) {
  const [featured, ...rest] = posts;
  if (!featured)
    return (
      <div className="rounded-panel bg-tint p-8">
        <p className="text-lg font-medium">Der er ingen indlæg her endnu.</p>
        <Link href="/blog/" className="link mt-3 inline-block">
          Se alle indlæg
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
              className="aspect-[16/10] w-full object-cover transition-transform duration-700 ease-[var(--ease)] group-hover:scale-[1.03]"
              sizes="(min-width: 768px) 55vw, calc(100vw - 40px)"
            />
          </div>
        )}
        <div className="md:col-span-5">
          <PostMeta post={featured} />
          <h2 className="mt-2 text-[1.9rem] leading-tight transition-colors group-hover:text-accent md:text-4xl">{featured.title}</h2>
          <p className="mt-3 text-muted">{featured.description}</p>
        </div>
      </Link>
      {rest.length > 0 && <PostList posts={rest} className="mt-12 md:mt-16" />}
    </>
  );
}
