// What "Blog" shows (its view, drawn by the theme's View.tsx): its posts, newest first, each with its page, title,
// description, picture, date (ISO) and reading time in minutes. In the editor (viewOf) the first ones as the editor has
// them, only drawn, and how many more there are (`note`, so the card stays short); on the site all of them: load.ts.
import { siteT } from '../../i18n';
import { shownPicture, type Picture, type ViewOf } from '../view';
import { blogPostsOf } from '.';

export type BlogPostView = {
  href: string;
  title: string;
  description?: string;
  image?: Picture;
  imageAlt?: string;
  date: string;
  minutes: number;
};
export type BlogView = { posts: BlogPostView[]; note?: string };

/** How many posts the editor draws. */
const SHOWN = 5;

export const viewOf: ViewOf<BlogView> = (props, data) => {
  const all = blogPostsOf(props.categories, data);
  return {
    posts: all.slice(0, SHOWN).map((p) => ({
      href: '',
      title: p.title,
      description: p.description,
      image: p.image ? shownPicture(p.image) : undefined,
      imageAlt: p.imageAlt,
      date: p.date.toISOString(),
      minutes: p.minutes,
    })),
    note: all.length > SHOWN ? siteT.blocks.blog.more(all.length - SHOWN) : undefined,
  };
};
