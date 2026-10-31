// Titles and meta descriptions for the pages that are built in code (src/pages/*.astro):
// the front page, the blog list and categories, contact, prices, testimonials and services.
// Each value lives with the rest of that page's texts (home.json, blog-page.json, categories/*.json,
// contact.json, prices.json, testimonials-page.json, services-page.json), so they are accessible
// at the bottom of the page in the editor (/editor/, "Sider" › "Faste sider"). Pages and blog posts in src/content/
// have theirs in their own frontmatter (seoTitle, seoDescription, heading).
// - title: the whole <title> (also og:title). At most about 60 characters.
// - description: the meta description, hand-written, 140-155 characters, ending with a call to action.
// - image: the picture shown when the page is shared (og:image); empty: the site's portrait.
// Pages missing here, or with empty fields, fall back to their own title and description (Base.astro).
import home from './home.json';
import blogPage from './blog-page.json';
import { categories } from './categories';
import contact from './contact.json';
import prices from './prices.json';
import testimonialsPage from './testimonials-page.json';
import servicesPage from './services-page.json';

export type Seo = { title?: string; description?: string; image?: string };

type Texts = { seoTitle?: string; seoDescription?: string; shareImage?: string };
const pages: [string, Texts][] = [
  ['/', home],
  ['/blog/', blogPage],
  ...categories.map((c): [string, Texts] => [`/blog/kategori/${c.slug}/`, c]),
  ['/kontakt/', contact],
  ['/priser/', prices],
  ['/udtalelser/', testimonialsPage],
  ['/ydelser/', servicesPage],
];

export const seo: Record<string, Seo> = Object.fromEntries(
  pages.map(([path, t]) => [
    path,
    { title: t.seoTitle || undefined, description: t.seoDescription || undefined, image: t.shareImage || undefined },
  ]),
);
