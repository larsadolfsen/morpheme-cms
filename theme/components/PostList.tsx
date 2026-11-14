// List of posts (List and ListItem with a leading image, m3.material.io/components/lists): one column on mobile, two on desktop. Thumbnail, date and reading time, title, description. The posts
// after the newest (BlogPosts.tsx), and the posts of the standard block "Blog posts" (blocks/posts/View.tsx). `random`: the list has all the posts it can take from, and on the site a script right after
// it shows `count` of them on each visit, before the list is drawn (without JavaScript: the first, the newest).
import Img from '@theme/components/Img';
import PostMeta from '@theme/components/PostMeta';
import type { PostView } from '@theme/components/posts';
import { BREAKPOINTS } from '@morphemecms/cms/lib/breakpoints.mjs';
import { useOnSite } from '@morphemecms/cms/src/standard/view';
import List, { ListItem } from '@theme/ui/List';

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
      <List
        dividers="none"
        className={['theme-post-list grid gap-x-6 expanded:grid-cols-2', className].filter(Boolean).join(' ')}
        data-random-posts={random ? count : undefined}
      >
        {posts.map((post, i) => (
          <ListItem
            key={post.href || post.title}
            li={{ hidden: random && i >= count }}
            href={post.href}
            lines={3}
            leadingMedia={
              post.image ? (
                <Img
                  image={post.image}
                  alt=""
                  className="list-item-image theme-post-picture"
                  sizes={`(min-width: ${BREAKPOINTS.medium}px) 128px, 88px`}
                />
              ) : (
                <span className="list-item-image theme-post-picture bg-surface-container-high" />
              )
            }
            overline={<PostMeta post={post} as="span" />}
            headline={<h3 className="m-0 type-title-medium">{post.title}</h3>}
            supporting={post.description ? <span className="line-clamp-2">{post.description}</span> : undefined}
          />
        ))}
      </List>
      {random && onSite && <script dangerouslySetInnerHTML={{ __html: PICK }} />}
    </>
  );
}
