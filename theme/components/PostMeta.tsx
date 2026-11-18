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
        'mo-post-meta',
        inOverline ? 'mo-is-overline' : 'mo-type-body-medium mo-is-body',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <time dateTime={post.date} className={inOverline ? 'mo-keep' : undefined}>
        {post.dateText}
      </time>
      <span aria-hidden="true" className={inOverline ? 'mo-keep' : undefined}>
        ·
      </span>
      <span className="mo-post-meta__duration">
        <Svg name="clock" size={inOverline ? 12 : 15} className={inOverline ? 'mo-keep' : undefined} />
        <span className={inOverline ? 'mo-truncate' : undefined}>{siteT.theme.readingTime(post.minutes)}</span>
      </span>
      {tags && tags.length > 0 && (
        <>
          <span aria-hidden="true">·</span>
          <span>
            {tags.map((tag, i) => (
              <Fragment key={tag.href}>
                {i > 0 && ', '}
                <a href={tag.href} className="mo-post-meta__tag">
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
