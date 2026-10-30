// "Blog", a standard block: every post on the blog, newest first, the newest large and the rest as a list (those with
// one of its tags, when it has any): the blog page ("Udseende" › "Standardsider" › "Blogside") and wherever else it is
// put in. The posts are the site's (BlockData.site.posts), their tags the relation `categories`. How it looks is the
// theme's (packages/editor/theme/blocks/blog/View.tsx; what it shows: view.ts, and load.ts on the site).
import { Article } from '@phosphor-icons/react';
import { defineBlock, type BlockData } from '../../blocks';
import { t } from '../../i18n';

/** The posts it shows: those with any of its tags (all when it has none), newest first, as the site has them. */
export const blogPostsOf = (categories: unknown, data: BlockData) => {
  const tags = Array.isArray(categories) ? categories.map(String) : [];
  return data.site.posts.filter((p) => !tags.length || p.categories.some((c) => tags.includes(c)));
};

export default defineBlock({
  label: t.blocks.blog.label,
  icon: Article,
  hint: t.blocks.blog.hint,
  fields: [
    {
      name: 'categories',
      label: t.blocks.blog.tags,
      type: 'relation',
      to: 'categories',
      multiple: true,
      add: t.blocks.blog.addTag,
      hint: t.blocks.blog.tagsHint,
    },
  ],
  example: {},
  // Its tags, or that it shows all, and how many posts that is.
  detail: (p, data) => {
    const tags = ((p.categories ?? []) as string[]).map((v) => data.relations.categories?.find((o) => o.value === v)?.label ?? v);
    return [t.blocks.blog.line(tags.join(', '), blogPostsOf(p.categories, data).length)];
  },
});
