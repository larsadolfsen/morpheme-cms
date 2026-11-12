// "Testimonials" on the site (view.ts): all of them (`show: 'all'`), those with any of its tags (`show: 'categories'`,
// all when it has none; the tags are then not on the cards, except in a list of all), those marked "Show on the front page"
// ('front'), or those picked ('picked', by file name, in that order), from the site (@site/standard), with their tags'
// pages, their pictures' sizes and where their whole text is.
import { standard } from '@site/standard';
import { pictureOf } from '../load';
import type { TestimonialItem } from '../site';
import type { Load } from '../view';
import { tagsShown } from '.';
import { headOf } from '../head';
import shared from './shared';
import { labelOf, type TestimonialsView, type TestimonialTexts, type TestimonialView } from './view';

/** Testimonials on the site (a site's own too: this site's front page), with their tags (`showTopic`). */
export const loadTestimonials = (items: TestimonialItem[], showTopic = true): Promise<TestimonialView[]> =>
  Promise.all(
    items.map(async (t) => {
      const anchor = standard.testimonials.anchor(t);
      return {
        slug: t.slug,
        name: t.name,
        ...(t.image ? { image: pictureOf(t.image) } : {}),
        context: t.context,
        quote: t.quote,
        categories: t.categories,
        tags: showTopic ? await Promise.all(t.categories.map((slug) => standard.testimonials.tag(slug))) : [],
        anchor,
        href: `${standard.testimonials.page}#${anchor}`,
      };
    }),
  );

/** Its shared texts, with those saved over them. */
export const testimonialTexts = (texts?: Record<string, any>): TestimonialTexts => ({ ...shared.values, ...texts }) as TestimonialTexts;

export const load: Load<TestimonialsView> = async (props, { texts }) => {
  const all = standard.testimonials.list;
  const chosen = () => {
    if (props.show === 'all') return all;
    if (props.show === 'categories') {
      const wanted: string[] = props.categories ?? [];
      return all.filter((t) => !wanted.length || t.categories.some((c) => wanted.includes(c)));
    }
    if (props.show === 'picked')
      return ((props.picked ?? []) as string[]).map((slug) => all.find((t) => t.slug === slug)).filter((t) => t !== undefined);
    return all.filter((t) => t.frontPage);
  };
  const items = chosen();
  const slugs = props.layout === 'list' && props.filter !== false ? [...new Set(items.flatMap((t) => t.categories))] : [];
  return {
    ...headOf(props),
    layout: props.layout,
    testimonials: await loadTestimonials(items, tagsShown(props)),
    label: labelOf(props),
    filters: await Promise.all(slugs.map(async (slug) => ({ slug, name: (await standard.testimonials.tag(slug)).name }))),
    texts: testimonialTexts(texts),
  };
};
