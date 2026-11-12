// "Testimonials list" on the site (view.ts): the testimonials it picks (`show`, as "Testimonial cards" does) with their tags'
// pages, their pictures' sizes and where their whole text is, and the tags to filter by.
import { standard } from '@site/standard';
import { tagsShown } from '../testimonials';
import { chosenOnSite, loadTestimonials } from '../testimonials/load';
import { headOf } from '../head';
import type { Load } from '../view';
import type { TestimonialListView } from './view';

export const load: Load<TestimonialListView> = async (props) => {
  const items = chosenOnSite(props);
  const slugs = props.filter !== false ? [...new Set(items.flatMap((t) => t.categories))] : [];
  return {
    ...headOf(props),
    testimonials: await loadTestimonials(items, tagsShown(props, true)),
    filters: await Promise.all(slugs.map(async (slug) => ({ slug, name: (await standard.testimonials.tag(slug)).name }))),
  };
};
