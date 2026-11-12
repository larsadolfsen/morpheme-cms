// "Testimonial cards" on the site (view.ts): all of them (`show: 'all'`), those with any of its tags (`show: 'categories'`,
// all when it has none; the tags are then not on the cards), those marked "Show on the front page"
// ('front'), or those picked ('picked', by file name, in that order), from the site (@site/standard), with their tags'
// pages, their pictures' sizes and where their whole text is. "Testimonials list" picks the same way (chosenOnSite).
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

/** The testimonials a block shows on the site, as its `show` says. */
export const chosenOnSite = (props: Record<string, any>): TestimonialItem[] => {
  const all = standard.testimonials.list;
  if (props.show === 'all') return all;
  if (props.show === 'categories') {
    const wanted: string[] = props.categories ?? [];
    return all.filter((t) => !wanted.length || t.categories.some((c) => wanted.includes(c)));
  }
  if (props.show === 'picked')
    return ((props.picked ?? []) as string[]).map((slug) => all.find((t) => t.slug === slug)).filter((t) => t !== undefined);
  return all.filter((t) => t.frontPage);
};

export const load: Load<TestimonialsView> = async (props, { texts }) => ({
  ...headOf(props),
  testimonials: await loadTestimonials(chosenOnSite(props), tagsShown(props)),
  label: labelOf(props),
  texts: testimonialTexts(texts),
});
