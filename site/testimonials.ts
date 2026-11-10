// The site's client testimonials: one JSON file per testimonial in src/data/testimonials/, edited in the
// editor (/editor/, "Testimonials"). Each has its picture (optional), its tags (`categories`, the same tags as the blog posts,
// src/data/categories/) and whether it is shown on the front page. `order` is the order on the
// testimonials page and the front page (set with the arrows in the editor).
import { settings } from './settings';

type TestimonialData = {
  name: string;
  image?: string;
  context?: string;
  /** Paragraphs separated by a blank line. */
  quote: string;
  categories?: string[];
  frontPage: boolean;
  order: number;
};

export type Testimonial = {
  /** The file name, e.g. "marie-louise-eriksen" (a "Hero" picks its quote by it). */
  slug: string;
  name: string;
  /** Its picture (optional), by the name. */
  image?: string;
  context?: string;
  /** One string per paragraph. */
  quote: string[];
  /** Its tags (slugs in src/data/categories/), e.g. ["stress"]. */
  categories: string[];
  frontPage: boolean;
};

const files = import.meta.glob<TestimonialData>('@data/testimonials/*.json', { eager: true, import: 'default' });

export const testimonials: Testimonial[] = Object.entries(files)
  .map(([file, t]) => ({ file, t }))
  .sort((a, b) => a.t.order - b.t.order || a.file.localeCompare(b.file))
  .map(({ file, t }) => ({
    slug: file.replace(/^.*\/|\.json$/g, ''),
    name: t.name,
    image: t.image || undefined,
    context: t.context || undefined,
    quote: t.quote
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean),
    categories: t.categories ?? [],
    frontPage: t.frontPage,
  }));

/** The address of the testimonials page (the site's setting, found when it is built). */
export const testimonialsPath = settings.testimonialsPath;
