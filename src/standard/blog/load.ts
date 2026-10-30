// "Blog" on the site (view.ts): the posts with any of its tags (all when it has none), newest first, from the site
// (@site/standard), with their pictures' sizes.
import { standard } from '@site/standard';
import { pictureOf } from '../load';
import type { Load } from '../view';
import type { BlogView } from './view';

export const load: Load<BlogView> = async (props) => {
  const tags = Array.isArray(props.categories) ? props.categories.map(String) : [];
  const posts = await standard.posts.list(tags);
  return { posts: posts.map(({ image, ...p }) => ({ ...p, image: image ? pictureOf(image) : undefined })) };
};
