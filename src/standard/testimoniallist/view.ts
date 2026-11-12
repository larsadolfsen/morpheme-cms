// What "Testimonials list" shows (its view, drawn by the theme's View.tsx and Rows.tsx): its heading, its testimonials as rows (each
// one's name, picture, context, whole text, tags and where its text is: `anchor` on the testimonials page) and the tags to
// filter by (`filters`). In the editor: viewOf, with the testimonials of the list "Testimonials"; on the site: load.ts.
import { chosen, tagsOf, tagsShown } from '../testimonials';
import { shownTestimonials, tagName, type TestimonialView } from '../testimonials/view';
import { headOf, type HeadView } from '../head';
import type { ViewOf } from '../view';

export type TestimonialListView = HeadView & {
  testimonials: TestimonialView[];
  filters: { slug: string; name: string }[];
};

export const viewOf: ViewOf<TestimonialListView> = (props, data) => {
  const rows = chosen(props, data);
  return {
    ...headOf(props),
    testimonials: shownTestimonials(rows, data, tagsShown(props, true)),
    filters: props.filter !== false ? tagsOf(rows).map((slug) => ({ slug, name: tagName(data, slug) })) : [],
  };
};
