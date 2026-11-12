// The layout List of "Testimonials" (`layout` 'list'): the theme's list (List.tsx in ../../ui/, as "List"), each testimonial an item with its picture (or the name's first
// letter) leading it, its name as the headline, its whole text as the supporting text (its introduction over it as the overline) and its tags
// after it. With `filters` (two tags or more), filter chips (Chip) over the list (.block-filters): one shows only the testimonials with that
// tag, "All" all of them again (on the site by script.ts; without JavaScript all are shown and the buttons are hidden; in
// the editor only drawn, "All" chosen). Each has its anchor, so a short one elsewhere can link to it.
import { siteT } from '@morphemecms/cms/src/i18n';
import type { TestimonialView } from '@morphemecms/cms/src/standard/testimonials/view';
import { useOnSite } from '@morphemecms/cms/src/standard/view';
import Chip from '@theme/ui/Chip';
import RowList, { ListItem } from '@theme/ui/List';

const say = siteT.blocks.testimonials;

export default function List({
  testimonials,
  filters,
  className,
}: {
  testimonials: TestimonialView[];
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
      <RowList className="block-testimonial-rows">
        {testimonials.map((t) => (
          <ListItem
            key={t.slug}
            id={t.anchor}
            data-tags={t.categories.join(' ')}
            leadingAvatar={t.image ? { src: t.image.src } : ([...t.name.trim()][0]?.toLocaleUpperCase() ?? '')}
            overline={t.context || undefined}
            headline={t.name}
            supporting={t.quote.join(' ')}
            lines={t.context ? 3 : 2}
            trailingSupporting={t.tags.length ? t.tags.map((tag) => tag.name).join(', ') : undefined}
          />
        ))}
      </RowList>
    </div>
  );
}
