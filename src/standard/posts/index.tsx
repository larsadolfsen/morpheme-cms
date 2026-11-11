// "Blog posts", a standard block: blog posts as a list, all of them (those with some tags, when it has any), 3–6 of
// them (the newest or random ones with some tags) or those picked, with "All posts" under them but when it shows all; the newest large when its design is "Newest large".
// The posts are the site's (the relation `blog`, and BlockData.site.posts), their tags the relation `categories`. How it
// looks is the theme's (packages/editor/theme/blocks/posts/View.tsx; what it shows: view.ts, and load.ts on the site).
import { Article, Newspaper, Rows } from '@phosphor-icons/react';
import { defineBlock, type BlockData, type BlockProps } from '../../blocks';
import { siteT, t } from '../../i18n';
import type { Relation } from '../../schema';
import { sharedIn } from '../../shared';
import { headFields } from '../head';
import type { PostChoice } from '../site';
import shared, { allPostsText, postCount } from './shared';

/** The posts a "Blog posts" block or a site's own section shows, as the site picks them: all (with `show` "all"), the
 * newest `count`, or those picked. Random: the newest stand here (the site picks anew on each visit), and the note says
 * how many it picks from. `all`: what "All posts" says (to a tag when the posts are from one blog tag, or one is
 * picked); empty when it shows all. */
export function postsOf(choice: PostChoice, data: BlockData) {
  const { show = 'categories', categories = [], order = 'newest', picked = [] } = choice;
  const pool = data.site.posts.filter((p) => !categories.length || p.categories.some((c) => categories.includes(c)));
  if (show === 'all') return { posts: pool, note: '', all: '' };
  const n = postCount(choice.count);
  const posts =
    show === 'picked'
      ? picked.map((slug) => data.site.posts.find((p) => p.slug === slug)).filter((p) => p !== undefined)
      : pool.slice(0, n);
  const random = show !== 'picked' && order === 'random' && pool.length > n;
  const slug = choice.link || (show !== 'picked' && categories.length === 1 ? categories[0] : null);
  const tag = slug && !data.site.tagsOffBlog.includes(slug) ? data.relations.categories?.find((o) => o.value === slug)?.label : undefined;
  return {
    posts,
    note: random ? siteT.blocks.posts.randomNote(n, pool.length) : '',
    all: allPostsText(sharedIn(data.site, 'posts', shared.values), tag),
  };
}

// Which posts it shows, for its card: "Communication · 12 posts", "The newest 3 from Communication", "Random 3
// from all posts", or the titles of those picked.
function postsLine(p: BlockProps, data: BlockData): string {
  const label = (to: Relation, v: string) => data.relations[to]?.find((o) => o.value === v)?.label ?? v;
  if (p.show === 'picked') return ((p.picked ?? []) as string[]).map((v) => label('blog', v)).join(' · ');
  const tags = ((p.categories ?? []) as string[]).map((v) => label('categories', v)).join(', ');
  if (p.show === 'all') return t.blocks.posts.allFrom(tags, postsOf(p as PostChoice, data).posts.length);
  const from = tags || t.blocks.posts.all;
  return (p.order === 'random' ? t.blocks.posts.randomFrom : t.blocks.posts.newestFrom)(postCount(p.count), from);
}

export default defineBlock({
  group: 'content',
  label: t.blocks.posts.label,
  icon: Newspaper,
  hint: t.blocks.posts.hint,
  edit: { to: 'blocks/posts', text: t.blocks.posts.edit },
  fields: [
    ...headFields,
    // A list (the empty choice: so are the blocks from before there was a choice), or the newest large over the list
    // (as on the blog page).
    {
      name: 'design',
      label: t.blocks.posts.design,
      type: 'select',
      segments: true,
      options: [
        { label: t.blocks.posts.designList, value: '', icon: Rows },
        { label: t.blocks.posts.designFeatured, value: 'featured', icon: Article },
      ],
    },
    {
      name: 'show',
      label: t.blocks.posts.show,
      type: 'select',
      required: true,
      default: 'categories',
      options: [
        { label: t.blocks.posts.every, value: 'all' },
        { label: t.blocks.posts.some, value: 'categories' },
        { label: t.blocks.posts.picked, value: 'picked' },
      ],
    },
    {
      name: 'categories',
      label: t.blocks.posts.tags,
      type: 'relation',
      to: 'categories',
      multiple: true,
      add: t.blocks.posts.addTag,
      hint: t.blocks.posts.tagsHint,
      only: { field: 'show', is: ['all', 'categories'] },
    },
    {
      name: 'count',
      label: t.blocks.posts.count,
      type: 'select',
      required: true,
      default: '3',
      options: ['3', '4', '5', '6'].map((n) => ({ label: t.blocks.posts.countOption(n), value: n })),
      only: { field: 'show', is: ['categories'] },
    },
    {
      name: 'order',
      label: t.blocks.posts.order,
      type: 'select',
      required: true,
      default: 'newest',
      options: [
        { label: t.blocks.posts.newest, value: 'newest' },
        { label: t.blocks.posts.random, value: 'random' },
      ],
      only: { field: 'show', is: ['categories'] },
    },
    {
      name: 'picked',
      label: t.blocks.posts.items,
      type: 'relation',
      to: 'blog',
      multiple: true,
      maxItems: 6,
      add: t.blocks.posts.addItem,
      required: true,
      hint: t.blocks.posts.itemsHint,
      only: { field: 'show', is: ['picked'] },
    },
    {
      name: 'link',
      label: t.blocks.posts.link,
      type: 'relation',
      to: 'categories',
      hint: t.blocks.posts.linkHint,
      only: { field: 'show', is: ['categories', 'picked'] },
    },
  ],
  detail: (p, data) => [postsLine(p, data)],
});
