// Testimonials one after another with the whole text (.block-testimonial-list in ../blocks.css), in two columns where
// there is room, so long and short texts sit well together: the standard block "Udtalelser" with `layout` 'list'. With
// `filters`, filter chips (Chip) with their tags over them (.block-filters; with two tags or more): one shows only those with that
// tag, "Alle" all of them again (on the site by script.ts; without JavaScript all are shown and the buttons are hidden;
// in the editor only drawn, "Alle" chosen). Each has its anchor, so a short one elsewhere can link to it.
import { siteT } from '@interstellarcms/cms/src/i18n';
import type { TestimonialTexts, TestimonialView } from '@interstellarcms/cms/src/standard/testimonials/view';
import { useOnSite } from '@interstellarcms/cms/src/standard/view';
import Testimonial from '@theme/blocks/testimonials/Testimonial';
import Chip from '@theme/ui/Chip';

const say = siteT.blocks.testimonials;

export default function List({
  testimonials,
  texts,
  filters,
  className,
}: {
  testimonials: TestimonialView[];
  texts: TestimonialTexts;
  filters: { slug: string; name: string }[];
  className?: string;
}) {
  const onSite = useOnSite();
  if (testimonials.length === 0 && !onSite) return <p className="block-empty">{say.none}</p>;
  return (
    <div className={className ? `block-testimonials ${className}` : 'block-testimonials'} data-testimonial-filter="">
      {filters.length > 1 && (
        <div className="block-filters" role="group" aria-label={say.filterLabel} hidden={onSite} data-filters="">
          <Chip kind="filter" label={say.filterAll} selected data-tag="" />
          {filters.map((tag) => (
            <Chip key={tag.slug} kind="filter" label={tag.name} data-tag={tag.slug} />
          ))}
        </div>
      )}
      <div className="block-testimonial-list">
        {testimonials.map((t) => (
          <div key={t.slug} data-tags={t.categories.join(' ')}>
            <Testimonial testimonial={t} texts={texts} full />
          </div>
        ))}
      </div>
    </div>
  );
}
