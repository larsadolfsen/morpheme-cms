// "Blog posts" on the site (view.ts): the posts it shows (from the site, @site/standard), all of them or those it picks,
// with "All posts" under those it picks (to a tag, "All posts about …", when it goes to one; its shared texts). Nothing
// when there are none, but where the newest of all would be large (the blog page): there the theme says there are none.
import { standard } from '@site/standard';
import { imageOf } from '../load';
import type { ListedPost } from '../site';
import type { Load } from '../view';
import { headOf } from '../head';
import shared, { allPostsText, postCount } from './shared';
import { designOf, type PostView, type PostsView } from './view';

/** Posts as the site lists them, with their images' sizes. */
export const loadPosts = (posts: ListedPost[]): PostView[] =>
  posts.map(({ image, ...p }) => ({ ...p, image: image ? imageOf(image) : undefined }));

export const load: Load<PostsView> = async (props, { texts }) => {
  const design = designOf(props);
  if (props.show === 'all') {
    const categories = Array.isArray(props.categories) ? props.categories.map(String) : [];
    const posts = await standard.posts.list(categories);
    if (!posts.length && design === 'list') return null;
    return { ...headOf(props), design, posts: loadPosts(posts), count: posts.length, random: false };
  }
  const count = postCount(props.count);
  const { posts, random } = await standard.posts.choose(props, count);
  if (!posts.length) return null;
  const all = standard.posts.all(props);
  return {
    ...headOf(props),
    design,
    posts: loadPosts(posts),
    count,
    random,
    all: { href: all.href, text: allPostsText({ ...shared.values, ...texts }, all.tag) },
  };
};
