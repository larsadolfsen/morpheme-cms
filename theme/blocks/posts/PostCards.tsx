// Blog posts as cards without dates, a picture and a title (.block-posts in ../blocks.css), three across from a tablet
// up (four: two by two, or four in a row when not `narrow`): the standard block "Blogindlæg", and a site's own (this
// site's front page). All the posts are shown (the site took `count` of a tag's, and all that were picked); `random`:
// the list has all the posts it can take from, and on the site a script right after it shows `count` of them on each
// visit, before the list is drawn (without JavaScript: the first, the newest). `className`: the site's own classes.
import type { PostView } from '@interstellarcms/cms/src/standard/posts/view';
import { Link, useOnSite } from '@interstellarcms/cms/src/standard/view';

const sizes = '(min-width: 1152px) 352px, (min-width: 640px) 31vw, 96px';

// Shows the number in data-random-posts of the posts in the list just before it, picked at random.
const PICK = `(() => {
  const list = document.currentScript.previousElementSibling;
  const items = [...list.children];
  const shown = new Set();
  while (shown.size < Number(list.dataset.randomPosts)) shown.add(Math.floor(Math.random() * items.length));
  items.forEach((li, i) => (li.hidden = !shown.has(i)));
})();`;

export default function PostCards({
  posts,
  count = posts.length,
  random = false,
  narrow = false,
  className,
}: {
  posts: PostView[];
  count?: number;
  random?: boolean;
  /** In the text column of a page: four posts two by two (else four in a row on a computer). */
  narrow?: boolean;
  className?: string;
}) {
  const onSite = useOnSite();
  // Three across, so 6 is two rows and 5 is three and two; 4 is two by two in a page.
  const shown = random ? count : posts.length;
  const columns = shown === 4 ? (narrow ? 'block-posts-2' : 'block-posts-4') : 'block-posts-3';
  return (
    <>
      <ul className={['block-posts', columns, className].filter(Boolean).join(' ')} data-random-posts={random ? count : undefined}>
        {posts.map((post, i) => (
          <li key={i} hidden={random && i >= count}>
            <Link href={post.href} className="block-post">
              <div className="block-post-picture">
                {post.image && (
                  <img
                    src={post.image.src}
                    srcSet={post.image.srcset}
                    sizes={post.image.srcset ? sizes : undefined}
                    width={post.image.width}
                    height={post.image.height}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </div>
              <h3 className="block-post-title">{post.title}</h3>
            </Link>
          </li>
        ))}
      </ul>
      {random && onSite && <script dangerouslySetInnerHTML={{ __html: PICK }} />}
    </>
  );
}
