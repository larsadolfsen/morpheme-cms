// A blog post as BlogPosts.tsx, PostList.tsx and PostMeta.tsx draw it: its page, title, description, picture, date
// (ISO, and as formatted text) and reading time. On the site: postViewOf (loadPosts.ts); the standard block
// "Blog posts" from its view (blocks/posts/View.tsx).
import type { Picture } from '@morphemecms/cms/src/standard/view';

export type PostView = {
  href: string;
  title: string;
  description?: string;
  image?: Picture;
  imageAlt?: string;
  date: string;
  dateText: string;
  minutes: number;
};
