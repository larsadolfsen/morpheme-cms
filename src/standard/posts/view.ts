// What "Blogindlæg" shows (its view, drawn by the theme's View.tsx): its heading, its design (a list, or the newest
// large over the list), its posts (each one's page, title, description, picture, date and reading time), how many it
// shows and whether they are picked at random on each visit (then all it picks from are there), and "Alle indlæg"
// (where it goes and what it says; none when it shows all). In the editor (viewOf) the posts as the site picks them
// (postsOf: random ones are the newest, and `note` says how many it picks from; of all, the first ones, and `more` says
// how many more there are, so the card stays short); on the site: load.ts.
import type { BlockData } from '../../blocks';
import { siteT } from '../../i18n';
import { shownPicture, type Picture, type ViewOf } from '../view';
import { postsOf } from '.';
import type { PostChoice } from '../site';
import { headOf, type HeadView } from '../head';

export type PostView = {
  href: string;
  title: string;
  description?: string;
  image?: Picture;
  imageAlt?: string;
  date: string;
  minutes: number;
};
export type PostsView = HeadView & {
  design: 'list' | 'featured';
  posts: PostView[];
  count: number;
  random: boolean;
  all?: { href: string; text: string };
  note?: string;
  more?: string;
};

/** Its design: the newest large, or a list (also one from before there was a choice). */
export const designOf = (props: Record<string, unknown>): PostsView['design'] => (props.design === 'featured' ? 'featured' : 'list');

/** A post as the editor has it, only drawn. */
export const shownPost = (p: BlockData['site']['posts'][number]): PostView => ({
  href: '',
  title: p.title,
  description: p.description,
  image: p.image ? shownPicture(p.image) : undefined,
  imageAlt: p.imageAlt,
  date: p.date.toISOString(),
  minutes: p.minutes,
});

/** How many of all the posts the editor draws. */
const SHOWN = 5;

export const viewOf: ViewOf<PostsView> = (props, data) => {
  const { posts, note, all } = postsOf(props as PostChoice, data);
  const shown = props.show === 'all' ? posts.slice(0, SHOWN) : posts;
  return {
    ...headOf(props),
    design: designOf(props),
    posts: shown.map(shownPost),
    count: shown.length,
    random: false,
    all: all ? { href: '', text: all } : undefined,
    note: note || undefined,
    more: posts.length > shown.length ? siteT.blocks.posts.more(posts.length - shown.length) : undefined,
  };
};
