// A blog post as BlogPosts.tsx, PostList.tsx and PostMeta.tsx draw it: its page, title, description, picture, date
// (ISO, and as Danish text) and reading time. On the site: postViewOf (loadPosts.ts); the standard block
// "Blogindlæg" from its view (blocks/posts/View.tsx).
import type { Picture } from '@morpheme/cms/src/standard/view';

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
