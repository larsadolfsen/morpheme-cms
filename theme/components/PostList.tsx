// List of posts: one column on mobile, two on desktop. Thumbnail, date and reading time, title, description.
import Img from '@theme/components/Img';
import PostMeta from '@theme/components/PostMeta';
import type { PostView } from '@theme/components/posts';
import { Link } from '@interstellarcms/cms/src/standard/view';

export default function PostList({ posts, className }: { posts: PostView[]; className?: string }) {
  return (
    <ul className={['grid gap-x-12 md:grid-cols-2', className].filter(Boolean).join(' ')}>
      {posts.map((post) => (
        <li key={post.href || post.title} className="border-t border-line">
          <Link href={post.href} className="group grid grid-cols-[5.5rem_1fr] gap-4 py-5 sm:grid-cols-[8rem_1fr] sm:gap-5">
            {post.image ? (
              <Img
                image={post.image}
                alt=""
                className="theme-post-picture aspect-square w-full object-cover"
                sizes="(min-width: 640px) 128px, 88px"
              />
            ) : (
              <span className="theme-post-picture aspect-square bg-tint" />
            )}
            <div>
              <PostMeta post={post} />
              <h3 className="mt-1 text-lg leading-snug font-medium transition-colors group-hover:text-accent">{post.title}</h3>
              {post.description && <p className="mt-1.5 line-clamp-2 text-[0.95rem] text-muted">{post.description}</p>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
