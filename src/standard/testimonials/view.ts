// What "Testimonials" shows (its view, drawn by the theme's View.tsx, Slider.tsx, List.tsx and Testimonial.tsx): its
// heading, its layout (to leaf through, or 'list': one after another with the whole text), its testimonials (each
// one's name, image, context, paragraphs, tags with their pages, and where its whole text is: `anchor` on the
// testimonials page, `href` from elsewhere), what the slider is called for screen readers, the tags to filter by in a
// list (`filters`), and its shared texts ("Read more", "Show less"). In the editor: viewOf, with the testimonials of
// the list "Testimonials"; on the site: load.ts.
import type { BlockData } from '../../blocks';
import type { TestimonialRow } from '../../fields';
import { siteT } from '../../i18n';
import { sharedIn } from '../../shared';
import { shownAt } from '../../images';
import { libraryAltPart } from '../../imageAlt.mjs';
import type { Image, ViewOf } from '../view';
import { chosen, tagsOf, tagsShown } from '.';
import { headOf, type HeadView } from '../head';
import shared from './shared';

export type TestimonialView = {
  slug: string;
  name: string;
  image?: Image;
  context?: string;
  quote: string[];
  categories: string[];
  tags: { name: string; href?: string }[];
  anchor: string;
  href: string;
};
export type TestimonialTexts = { more: string; less: string };
export type TestimonialsView = HeadView & {
  layout?: string;
  testimonials: TestimonialView[];
  /** What the slider is called for screen readers: its heading, else the block's name (labelOf). */
  label: string;
  filters: { slug: string; name: string }[];
  texts: TestimonialTexts;
};

/** What the slider is called for screen readers: the block's heading, else "Testimonials" in the site's language. */
export const labelOf = (props: Record<string, any>): string => props.heading?.trim() || siteT.blocks.testimonials.label;

// A tag's name, as the list of tags has it.
const tagName = (data: BlockData, slug: string) => data.relations.categories?.find((o) => o.value === slug)?.label ?? slug;

/** Testimonials in the editor (a site's own too: its preview of the front page), with their tags (`showTopic`). Only
 * drawn: a link leads nowhere. */
export const shownTestimonials = (rows: TestimonialRow[], data: BlockData, showTopic = true): TestimonialView[] =>
  rows.map((row) => ({
    slug: row.slug,
    name: row.name,
    ...(row.image
      ? {
          image: {
            src: shownAt(row.image),
            ...libraryAltPart(data.libraryAlt?.(row.image)),
            ...(row.alt?.trim() ? { alt: row.alt.trim() } : {}),
          },
        }
      : {}),
    context: row.context,
    // Its paragraphs, as the site splits its text.
    quote: String(row.quote ?? '')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean),
    categories: row.categories ?? [],
    tags: showTopic ? (row.categories ?? []).map((slug) => ({ name: tagName(data, slug) })) : [],
    anchor: row.slug,
    href: '',
  }));

/** Its shared texts in the editor. */
export const shownTexts = (data: BlockData) => sharedIn(data.site, 'testimonials', shared.values) as TestimonialTexts;

export const viewOf: ViewOf<TestimonialsView> = (props, data) => {
  const rows = chosen(props, data);
  return {
    ...headOf(props),
    layout: props.layout,
    testimonials: shownTestimonials(rows, data, tagsShown(props)),
    label: labelOf(props),
    filters: props.layout === 'list' && props.filter !== false ? tagsOf(rows).map((slug) => ({ slug, name: tagName(data, slug) })) : [],
    texts: shownTexts(data),
  };
};
