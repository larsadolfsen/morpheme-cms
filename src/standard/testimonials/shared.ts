// The shared texts of "Udtalelser" ("Blokke"): the buttons that unfold a testimonial and fold it again,
// to begin with in the site's language (siteT). Also on a site's own testimonials (Testimonial.tsx).
import { siteT, t } from '../../i18n';
import { defineShared } from '../../shared';

export default defineShared({
  fields: [
    { name: 'more', label: t.blocks.testimonials.more, type: 'string', required: true, max: 30 },
    { name: 'less', label: t.blocks.testimonials.less, type: 'string', required: true, max: 30 },
  ],
  values: { more: siteT.blocks.testimonials.moreText, less: siteT.blocks.testimonials.lessText },
  preview: { props: { show: 'front' } },
});
