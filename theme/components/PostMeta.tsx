// Date and reading time for a blog post, then its tags as links: "March 12, 2024 · 5 min read · News, Tips" in English
// (posts.ts makes them). Props: post, optional tags and className. A theme may replace this file.
import { Fragment } from 'react';
import { Svg } from '@morphemecms/cms/src/icon';
import type { PostView } from '@theme/components/posts';
import { siteT } from '@morphemecms/cms/src/i18n';

export default function PostMeta({
  post,
  tags,
  className,
}: {
  post: PostView;
  tags?: { label: string; href: string }[];
  className?: string;
}) {
  return (
    <p className={['flex flex-wrap items-center gap-x-2 type-body-medium text-on-surface-variant', className].filter(Boolean).join(' ')}>
      <time dateTime={post.date}>{post.dateText}</time>
      <span aria-hidden="true">·</span>
      <span className="inline-flex items-center gap-1">
        <Svg name="clock" size={15} />
        {siteT.theme.readingTime(post.minutes)}
      </span>
      {tags && tags.length > 0 && (
        <>
          <span aria-hidden="true">·</span>
          <span>
            {tags.map((tag, i) => (
              <Fragment key={tag.href}>
                {i > 0 && ', '}
                <a href={tag.href} className="underline hover:text-primary">
                  {tag.label}
                </a>
              </Fragment>
            ))}
          </span>
        </>
      )}
    </p>
  );
}
