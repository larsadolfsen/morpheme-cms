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
  as: Tag = 'p',
}: {
  post: PostView;
  tags?: { label: string; href: string }[];
  className?: string;
  /** `span` where it stands in a phrase (a list item's overline). */
  as?: 'p' | 'span';
}) {
  // In a list item's overline (`span`) the text takes the overline's own size and colour (label small), not body medium: a larger
  // text wrapped on a phone and left a line of space over the headline.
  const inOverline = Tag === 'span';
  return (
    <Tag
      className={[
        // The overline is one line (Material 3 Lists): it never wraps, and with a longer language (for example Danish dates and reading times)
        // in a narrow row it tightens the gaps and, as a last resort, shortens the reading time with an ellipsis.
        inOverline ? 'flex min-w-0 flex-nowrap items-center gap-x-1' : 'flex flex-wrap items-center gap-x-2',
        !inOverline && 'mo-type-body-medium text-on-surface-variant',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <time dateTime={post.date} className={inOverline ? 'shrink-0' : undefined}>
        {post.dateText}
      </time>
      <span aria-hidden="true" className={inOverline ? 'shrink-0' : undefined}>
        ·
      </span>
      <span className={inOverline ? 'inline-flex min-w-0 items-center gap-0.5' : 'inline-flex items-center gap-1'}>
        <Svg name="clock" size={inOverline ? 12 : 15} className={inOverline ? 'shrink-0' : undefined} />
        <span className={inOverline ? 'truncate' : undefined}>{siteT.theme.readingTime(post.minutes)}</span>
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
    </Tag>
  );
}
