// A blog post as BlogPosts.tsx, PostList.tsx and PostMeta.tsx draw it: its page, title, description, picture, date
// (ISO, and as Danish text) and reading time. On the site: postViewOf (loadPosts.ts); the standard block "Blog" from its
// view (blocks/blog/View.tsx).
import type { Picture } from '@interstellarcms/cms/src/standard/view';

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
