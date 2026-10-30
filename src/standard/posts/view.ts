// What "Blogindlæg" shows (its view, drawn by the theme's View.tsx and PostCards.tsx): its heading, its posts (each
// one's page, title and picture), how many it shows and whether they are picked at random on each visit (then all it
// picks from are there), and "Alle indlæg" (where it goes and what it says). In the editor (viewOf) the posts as the
// site picks them (postsOf: random ones are the newest, and `note` says how many it picks from); on the site:
// load.ts.
import type { BlockData } from '../../blocks';
import type { Picture, ViewOf } from '../view';
import { postsOf } from '.';
import type { PostChoice } from '../site';
import { headOf, type HeadView } from '../head';

export type PostView = { href: string; title: string; image?: Picture };
export type PostsView = HeadView & {
  posts: PostView[];
  count: number;
  random: boolean;
  all: { href: string; text: string };
  note?: string;
};

/** The posts of a choice in the editor (a site's own too: its preview of the front page), only drawn. */
export const shownPosts = (posts: BlockData['site']['posts']): PostView[] =>
  posts.map((p) => ({ href: '', title: p.title, image: p.image ? { src: p.image } : undefined }));

export const viewOf: ViewOf<PostsView> = (props, data) => {
  const { posts, note, all } = postsOf(props as PostChoice, data);
  return {
    ...headOf(props),
    posts: shownPosts(posts),
    count: posts.length,
    random: false,
    all: { href: '', text: all },
    note: note || undefined,
  };
};
