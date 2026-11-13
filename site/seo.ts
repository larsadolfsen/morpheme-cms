// Titles and meta descriptions for the pages that are built in code (packages/editor/pages/*.astro): the tags' pages (the front
// page and the blog page are pages, with theirs in their front matter, packages/editor/site/standardPages.ts). Each value lives
// with the rest of the tag's texts (categories/*.json), so the owner finds them at the bottom of the tag in the editor.
// Pages and blog posts in src/content/ have theirs in their own frontmatter (seoTitle, seoDescription, heading).
// - title: the whole <title> (also og:title). At most about 60 characters.
// - description: the meta description, hand-written, 140-155 characters, ending with a call to action.
// - image: the image shown when the page is shared (og:image); empty: the site's portrait.
// - canonical, noindex, nofollow: as a page's ("Canonical URL", "No index", "No follow").
// Pages missing here, or with empty fields, fall back to their own title and description (Base.astro).
import { categories } from './categories';

export type Seo = { title?: string; description?: string; image?: string; canonical?: string; noindex?: boolean; nofollow?: boolean };

type Texts = { seoTitle?: string; seoDescription?: string; shareImage?: string; canonical?: string; noindex?: boolean; nofollow?: boolean };
const pages: [string, Texts][] = categories.map((c): [string, Texts] => [`/blog/tags/${c.slug}/`, c]);

export const seo: Record<string, Seo> = Object.fromEntries(
  pages.map(([path, t]) => [
    path,
    {
      title: t.seoTitle || undefined,
      description: t.seoDescription || undefined,
      image: t.shareImage || undefined,
      canonical: t.canonical || undefined,
      noindex: t.noindex === true || undefined,
      nofollow: t.nofollow === true || undefined,
    },
  ]),
);
