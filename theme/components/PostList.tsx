// List of posts: one column on mobile, two on desktop. Thumbnail, date and reading time, title, description. The posts
// after the newest (BlogPosts.tsx), and the posts of the standard block "Blogindlæg" (blocks/posts/View.tsx). `random`: the list has all the posts it can take from, and on the site a script right after
// it shows `count` of them on each visit, before the list is drawn (without JavaScript: the first, the newest).
import Img from '@theme/components/Img';
import PostMeta from '@theme/components/PostMeta';
import type { PostView } from '@theme/components/posts';
import { BREAKPOINTS } from '@morphemecms/cms/lib/breakpoints.mjs';
import { Link, useOnSite } from '@morphemecms/cms/src/standard/view';

// Shows the number in data-random-posts of the posts in the list just before it, picked at random.
const PICK = `(() => {
  const list = document.currentScript.previousElementSibling;
  const items = [...list.children];
  const shown = new Set();
  while (shown.size < Number(list.dataset.randomPosts)) shown.add(Math.floor(Math.random() * items.length));
  items.forEach((li, i) => (li.hidden = !shown.has(i)));
})();`;

export default function PostList({
  posts,
  count = posts.length,
  random = false,
  className,
}: {
  posts: PostView[];
  count?: number;
  random?: boolean;
  className?: string;
}) {
  const onSite = useOnSite();
  return (
    <>
      <ul
        className={['grid gap-x-12 expanded:grid-cols-2', className].filter(Boolean).join(' ')}
        data-random-posts={random ? count : undefined}
      >
        {posts.map((post, i) => (
          <li key={post.href || post.title} hidden={random && i >= count} className="border-t border-line">
            <Link href={post.href} className="group grid grid-cols-[5.5rem_1fr] gap-4 py-5 medium:grid-cols-[8rem_1fr] medium:gap-5">
              {post.image ? (
                <Img
                  image={post.image}
                  alt=""
                  className="theme-post-picture aspect-square w-full object-cover"
                  sizes={`(min-width: ${BREAKPOINTS.medium}px) 128px, 88px`}
                />
              ) : (
                <span className="theme-post-picture aspect-square bg-tint" />
              )}
              <div>
                <PostMeta post={post} />
                <h3 className="mt-1 type-title-medium transition-colors group-hover:text-accent">{post.title}</h3>
                {post.description && <p className="mt-1.5 line-clamp-2 type-body-medium text-muted">{post.description}</p>}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {random && onSite && <script dangerouslySetInnerHTML={{ __html: PICK }} />}
    </>
  );
}
