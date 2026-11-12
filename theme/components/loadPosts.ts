// A blog post on the site, as BlogPosts.tsx, PostList.tsx and PostMeta.tsx draw it (posts.ts), with its image's sizes.
import { imageOf } from '@morphemecms/cms/src/standard/load';
import { postPath, type Post } from '@morphemecms/cms/site/content';
import { formatDate, readingMinutes } from '@morphemecms/cms/site/format';
import type { PostView } from '@theme/components/posts';

export const postViewOf = (post: Post): PostView => ({
  href: postPath(post),
  title: post.data.title,
  description: post.data.description,
  image: post.data.image ? imageOf(post.data.image) : undefined,
  imageAlt: post.data.imageDecorative ? undefined : post.data.imageAlt,
  date: post.data.date.toISOString(),
  dateText: formatDate(post.data.date),
  minutes: readingMinutes(post.body),
});
