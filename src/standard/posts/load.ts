// "Blogindlæg" on the site (view.ts): the posts it picks (from the site, @site/standard), with "Alle indlæg" under them
// (to a tag, "Alle indlæg om …", when it goes to one; its shared texts); nothing when there are none.
import { standard } from '@site/standard';
import { pictureOf } from '../load';
import type { PostCard } from '../site';
import type { Load } from '../view';
import { headOf } from '../head';
import shared, { allPostsText, postCount } from './shared';
import type { PostsView, PostView } from './view';

/** Posts on cards, with their pictures' sizes (a site's own too: this site's front page). */
export const loadPostCards = (posts: PostCard[]): PostView[] =>
  posts.map((p) => ({ href: p.href, title: p.title, image: p.image ? pictureOf(p.image) : undefined }));

export const load: Load<PostsView> = async (props, { texts }) => {
  const count = postCount(props.count);
  const { posts, random } = await standard.posts.choose(props, count);
  if (!posts.length) return null;
  const all = standard.posts.all(props);
  return {
    ...headOf(props),
    posts: loadPostCards(posts),
    count,
    random,
    all: { href: all.href, text: allPostsText({ ...shared.values, ...texts }, all.tag) },
  };
};
