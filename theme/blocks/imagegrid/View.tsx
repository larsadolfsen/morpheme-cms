// "Image grid": its head, the tag filter (the theme's filter chips, drawn hidden and shown by script.ts: without JavaScript every image
// shows), and the images as the theme's cards (Card, kind by `card`: Filled, Elevated or Outlined) in a staggered grid (.mo-staggered-grid): the image to the
// card's edge in its own proportions (`media`, a CardMedia), under it the lines the block asks for (the subhead: credit and tags, then the caption: Material 3's
// card text under the media), never on the image. A card is a link to the image itself (so it opens without JavaScript; script.ts opens it in the lightbox, among the images shown),
// or only a card when the block says the images do not open. What it shows: view.ts, filter.mjs. Cards in the editor are only drawn.
import Card, { CardMedia } from '@theme/ui/Card';
import Chip from '@theme/ui/Chip';
import ChipSet from '@theme/ui/ChipSet';
import Lightbox from '@theme/ui/Lightbox';
import type { GridImage, ImageGridView } from '@morphemecms/cms/src/standard/imagegrid/view';
import { useInText } from '@morphemecms/cms/src/standard/view';

const FIRST_ROW = 4;

// The widths the grid shows an image at, by the columns it has (view.columns, else by the window: 2, 3 and 4).
const sizesOf = (columns?: string) =>
  columns
    ? `(min-width: 37.5rem) ${Math.round(100 / Number(columns))}vw, 50vw`
    : '(min-width: 75rem) 25vw, (min-width: 37.5rem) 33vw, 50vw';

function Picture({ image, index, sizes }: { image: GridImage; index: number; sizes: string }) {
  const first = index < FIRST_ROW;
  return (
    <CardMedia ratio={image.width && image.height ? image.width / image.height : undefined}>
      {/* In a <picture>: React 19 puts a <link rel="preload"> into the text before an eager image it renders on the server, which breaks the
          prose's spacing after a heading (h3 + h2) and shows only on the site, never in the Preview. It makes no preload for an image in a
          <picture>, and the browser's own priority (loading, fetchpriority) does the work. */}
      <picture>
        <img
          src={image.src}
          srcSet={image.srcset}
          sizes={image.srcset ? sizes : undefined}
          width={image.width}
          height={image.height}
          alt={image.alt}
          loading={first ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={index === 0 ? 'high' : undefined}
        />
      </picture>
    </CardMedia>
  );
}

// The lines under the image: the subhead (the credit, the tags), then the supporting text (the caption), as Material 3 orders a card's text.
function linesOf(image: GridImage, view: ImageGridView) {
  const names = new Map(view.tags.map((tag) => [tag.slug, tag.name]));
  const subhead = [
    view.show.credit ? image.credit : undefined,
    view.show.tags ? image.tags.map((slug) => names.get(slug) ?? slug).join(' · ') : undefined,
  ]
    .filter(Boolean)
    .join(' · ');
  return { subhead: subhead || undefined, supporting: (view.show.caption ? image.caption : undefined) || undefined };
}

export default function ImageGrid({ view }: { view: ImageGridView }) {
  const sizes = sizesOf(view.columns);
  return (
    <>
      <div
        className={['mo-block-imagegrid', useInText()].filter(Boolean).join(' ')}
        data-imagegrid=""
        data-start={view.start.join(',')}
        data-open={view.open ? '' : undefined}
      >
        {view.filter && (
          <div className="mo-block-imagegrid__filter" data-imagegrid-filter="" hidden>
            <ChipSet label={view.texts.filter}>
              {view.tags.map((tag) => (
                <Chip key={tag.slug} kind="filter" label={tag.name} data-tag={tag.slug} selected={view.start.includes(tag.slug)} />
              ))}
            </ChipSet>
            <button type="button" className="mo-block-imagegrid__clear" data-imagegrid-clear="" hidden>
              {view.texts.clear}
            </button>
          </div>
        )}
        <p className="mo-block-imagegrid__count" data-imagegrid-count="" data-template={view.texts.count} aria-live="polite" />
        <ul className="mo-staggered-grid mo-block-imagegrid__grid" data-columns={view.columns}>
          {view.images.map((image, i) => (
            <li key={image.src} data-tags={image.tags.join(',')} data-index={i} data-caption={image.caption}>
              {/* The card is a link to the image when it opens, else only a card (as: its element). */}
              {view.open ? (
                <Card
                  href={image.src}
                  // An image without a text leaves its link without a name: the caption, else the text for "image" (WCAG 2.4.4, 4.1.2).
                  aria-label={image.alt ? undefined : image.caption || view.texts.linkName}
                  kind={view.card}
                  media={<Picture image={image} index={i} sizes={sizes} />}
                  {...linesOf(image, view)}
                  data-image=""
                />
              ) : (
                <Card kind={view.card} media={<Picture image={image} index={i} sizes={sizes} />} {...linesOf(image, view)} data-image="" />
              )}
            </li>
          ))}
        </ul>
        <p className="mo-block-imagegrid__empty" data-imagegrid-empty="" hidden>
          {view.texts.empty}
        </p>
        {view.open && (
          <Lightbox
            label={view.texts.viewer}
            closeLabel={view.texts.close}
            previousLabel={view.texts.previous}
            nextLabel={view.texts.next}
            data-position={view.texts.position}
          />
        )}
      </div>
    </>
  );
}
