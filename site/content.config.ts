// The site's content collections (blog posts, pages) and their front matter. Exposes `collections` for Astro.
// Depends on astro:content.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { PAGE_TEMPLATES } from '../lib/page-template.mjs';

// Kladde, Skjult or Planlagt (Udgivet when left out), and for Planlagt when, in Danish time
// ("2026-11-01T08:00"): what each one is on the site is in packages/editor/lib/status.mjs.
const status = {
  status: z.enum(['draft', 'unlisted', 'scheduled']).optional(),
  publishAt: z.string().optional(),
};

// Blog posts: one .md file per post in src/content/blog/.
// The file name becomes the URL: mit-foerste-indlaeg.md -> /mit-foerste-indlaeg/
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    // Last edit (when imported, the old site's); dateModified in the structured data.
    updated: z.coerce.date().optional(),
    description: z.string().optional().default(''),
    categories: z.array(z.string()).optional().default([]),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    // "Decorative image": `image` is drawn with alt="" (screen readers skip it), whatever `imageAlt` says.
    imageDecorative: z.boolean().optional(),
    ...status,
    // Google title and description (the <title> and meta description). Empty: built from the title.
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    // The image shown when it is shared (og:image). Empty: `image`, else the first image in the text.
    shareImage: z.string().optional(),
    // The title and description when it is shared (og:title, og:description). Empty: the Google title and description.
    shareTitle: z.string().optional(),
    shareDescription: z.string().optional(),
    // Words that link here from the other pages and posts (packages/editor/site/autolinks.mjs): the primary
    // keyword, and more separated by commas.
    keyword: z.string().optional(),
    keywords: z.string().optional(),
    // The address of the page Google should count as the original (rel=canonical). Empty: this one.
    canonical: z.string().optional(),
    // Not for search engines: noindex (Base.astro) and not in the sitemap (packages/editor/astro.mjs).
    noindex: z.boolean().optional().default(false),
  }),
});

// Imported pages. `path` is the exact URL, e.g. /ydelser/raadgivning/
// Pages created in the editor (/editor/) have no `path`: the file name is the URL (getPages()).
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    path: z
      .string()
      .regex(/^\/.*\/$/, 'path must start and end with /')
      .optional(),
    description: z.string().optional().default(''),
    // Tags chosen in the editor, not shown on the page.
    categories: z.array(z.string()).optional().default([]),
    order: z.number().optional().default(0),
    ...status,
    // Google title and description (the <title> and meta description). Empty: built from the title.
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    // The image shown when it is shared (og:image). Empty: the first image in the text.
    shareImage: z.string().optional(),
    // The title and description when it is shared (og:title, og:description). Empty: the Google title and description.
    shareTitle: z.string().optional(),
    shareDescription: z.string().optional(),
    // Words that link here from the other pages and posts (packages/editor/site/autolinks.mjs): the primary
    // keyword, and more separated by commas.
    keyword: z.string().optional(),
    keywords: z.string().optional(),
    // The address of the page Google should count as the original (rel=canonical). Empty: this one.
    canonical: z.string().optional(),
    // Not for search engines: noindex (Base.astro) and not in the sitemap (packages/editor/astro.mjs).
    noindex: z.boolean().optional().default(false),
    // The page's template, one the theme offers (lib/page-template.mjs; PageLayout.astro). Left out: the theme's first.
    template: z.enum(PAGE_TEMPLATES as [string, ...string[]]).optional(),
    // A new version of a page (/new/…): what the owner should look at or answer before it replaces the
    // current page. Shown at the top of the new version and on /new/.
    review: z.string().optional(),
    updated: z.coerce.date().optional(),
  }),
});

export const collections = { blog, pages };
