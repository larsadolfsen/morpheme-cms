// Date and reading time for a blog post: "12. marts 2024 · 5 min. læsetid" in Danish (posts.ts makes them).
import { Svg } from '@morphemecms/cms/src/icon';
import type { PostView } from '@theme/components/posts';
import { siteT } from '@morphemecms/cms/src/i18n';

export default function PostMeta({ post, className }: { post: PostView; className?: string }) {
  return (
    <p className={['flex flex-wrap items-center gap-x-2 type-body-medium text-muted', className].filter(Boolean).join(' ')}>
      <time dateTime={post.date}>{post.dateText}</time>
      <span aria-hidden="true">·</span>
      <span className="inline-flex items-center gap-1">
        <Svg name="clock" size={15} />
        {siteT.theme.readingTime(post.minutes)}
      </span>
    </p>
  );
}
