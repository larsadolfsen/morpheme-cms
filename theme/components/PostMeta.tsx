// Date and reading time for a blog post: "12. marts 2024 · 5 min. læsetid" (posts.ts makes them).
import { Svg } from '@interstellarcms/cms/src/icon';
import type { PostView } from '@theme/components/posts';

export default function PostMeta({ post, className }: { post: PostView; className?: string }) {
  return (
    <p className={['flex flex-wrap items-center gap-x-2 text-sm text-muted', className].filter(Boolean).join(' ')}>
      <time dateTime={post.date}>{post.dateText}</time>
      <span aria-hidden="true">·</span>
      <span className="inline-flex items-center gap-1">
        <Svg name="clock" size={15} />
        {post.minutes} min. læsetid
      </span>
    </p>
  );
}
