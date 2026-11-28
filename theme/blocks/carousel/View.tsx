// "Carousel", as Material 3 has it (m3.material.io/components/carousel; Carousel.tsx in ../../ui/): its items swiped sideways in the layout the block says, on every
// screen size. An item is what M3 prints (Overview: "Contain visual items like images or video, along with optional label text"): an image or a video filling the
// whole item (28dp corners), with its brief label on it; an item that is a card (the uncontained layouts only) is the Card component in the variant picked (outlined,
// filled or elevated; `color`: the container of a filled card), with its media at the top, a headline, a subhead, a text and either one link (the card with a page is
// one) or the action area (its buttons). Its optional header has an arrow icon button that shows every item, instead of `Show all` under the row (script.ts).
// The card items use their own class (`mo-block-carousel__card`), not the Cards block's, so a theme's rules for the Cards block do not reach them.
import { Svg } from '@morphemecms/cms/src/icon';
import { siteT } from '@morphemecms/cms/src/i18n';
import type { CarouselItem, CarouselView } from '@morphemecms/cms/src/standard/carousel/view';
import { Link, previewStyle, useInText } from '@morphemecms/cms/src/standard/view';
import Buttons from '@theme/blocks/buttons/Buttons';
import { loadingOf, sizesOf } from '@theme/blocks/carousel/sizes.mjs';
import Video from '@theme/blocks/video/View';
import Button from '@theme/ui/Button';
import Card, { CardMedia as MediaBox, cardKinds, type CardKind } from '@theme/ui/Card';
import Carousel from '@theme/ui/Carousel';
import { aspectOf } from '@theme/ui/carouselLayout';
import IconButton from '@theme/ui/IconButton';

/** The image of an item cut to the part the owner chose (crop.mjs: percent of the image from the left, from the top, its width and height): wider than its box and moved. */
const cutStyle = ([x, y, w]: number[]) => ({
  width: `${Math.round((100 / w) * 100 * 100) / 100}%`,
  height: 'auto',
  maxWidth: 'none',
  objectFit: 'fill' as const,
  transform: `translate(${-Math.round(x * 10) / 10}%, ${-Math.round(y * 10) / 10}%)`,
});

/** The header's arrow: forward to show every item, back (drawn instead, by the theme, while the items are all shown) to show fewer; an icon button takes one icon, so both are in it. */
function ArrowIcons() {
  return (
    <>
      <Svg name="arrow_forward" className="mo-block-carousel__arrow-forward" />
      <Svg name="arrow_back" className="mo-block-carousel__arrow-back" />
    </>
  );
}

/** An image that has loaded gives its item its own width (the editor's preview, which does not know the image's size beforehand; the site writes it in): its natural width / height, kept within M3's range by the layout. */
const widen = (img: HTMLImageElement) => {
  if (img.naturalWidth && img.naturalHeight)
    img
      .closest<HTMLElement>('[data-carousel-item]')
      ?.style.setProperty('--mo-comp-carousel-item-aspect', String(aspectOf(img.naturalWidth / img.naturalHeight)));
};

/** An item's image: told how wide its layout draws it (sizes.mjs), the ones in the first screen of the page loaded at once, every other when it comes near. */
function Picture({
  item,
  cut,
  layout,
  rank,
  onSize,
}: {
  item: CarouselItem;
  cut: boolean;
  layout: CarouselView['layout'];
  rank: number;
  onSize?: (img: HTMLImageElement) => void;
}) {
  const image = item.image!;
  const crop = image.crop && cut ? image.crop : undefined;
  return (
    <img
      style={{ ...(crop ? cutStyle(crop) : null), ...previewStyle(image.placeholder) }}
      src={image.src}
      srcSet={image.srcset}
      sizes={image.srcset ? sizesOf(layout, { crop: crop?.[2] }) : undefined}
      width={image.width}
      height={image.height}
      alt={image.alt ?? ''}
      {...loadingOf(rank)}
      decoding="async"
      onLoad={onSize ? (e) => onSize(e.currentTarget) : undefined}
    />
  );
}

export default function CarouselBlock({ view, label }: { view: CarouselView; label?: string }) {
  const say = siteT.blocks.carousel;
  const { layout, header, items, more, top } = view;
  // A carousel at the top of the page loads the images its first screen shows at once: an image's place among the images of the row (-1 when the carousel is not at the top).
  const rankOf = (i: number) => (top ? items.slice(0, i).filter((item) => item.media === 'image' && item.image).length : -1);
  const type: CardKind = cardKinds.find((k) => k === view.design) ?? 'outlined';
  const colored = type === 'filled' && view.color ? `mo-block-carousel__${view.color}` : undefined;
  const hasCards = items.some((item) => item.card);

  // An item that is a card: the Card component in the block's variant, its media at the top (the image cut to the part chosen, or the video with its play button).
  const cardOf = (item: CarouselItem, i: number) => {
    const media =
      item.media === 'image' && item.image ? (
        <MediaBox ratio={ratioOf(item.ratio)}>
          <Picture item={item} cut layout={layout} rank={rankOf(i)} />
        </MediaBox>
      ) : item.media === 'video' && item.video ? (
        <Video view={item.video} />
      ) : undefined;
    const parts = {
      kind: type,
      className: 'mo-block-carousel__card',
      media,
      icon:
        item.media === 'icon' && item.icon ? (
          <Svg name={item.icon} size={24} className="mo-block-carousel__card-icon" iconColor={item.iconColor} />
        ) : undefined,
      headline: item.title,
      subhead: item.subhead || undefined,
      supporting: item.text || undefined,
    };
    // A card with a page is one link, the whole card, with `more` at its end; one without is not a link and may have buttons.
    return item.href ? (
      <Card {...parts} href={item.href}>
        <span className="mo-block-carousel__card-more">
          {more}
          <Svg name="arrow_forward" size={18} />
        </span>
      </Card>
    ) : (
      <Card {...parts} actions={item.buttons.length > 0 ? <Buttons buttons={item.buttons} /> : undefined} divider={item.divider} />
    );
  };

  // A plain item: the image or video fills the whole item, with no card surface and no outline, and the label (headline, subhead, text) sits inside the item on the
  // image. An item with a page is one link, the whole item.
  const plainOf = (item: CarouselItem, i: number) => {
    const image = item.media === 'image' && item.image;
    const video = item.media === 'video' && item.video;
    const body = (
      <>
        {image && (
          <span className="mo-block-carousel__item-media">
            <Picture
              item={item}
              cut={false}
              layout={layout}
              rank={rankOf(i)}
              onSize={layout === 'multi-aspect-ratio' && item.aspect === undefined ? widen : undefined}
            />
          </span>
        )}
        {video && (
          <span className="mo-block-carousel__item-media">
            <Video view={item.video!} />
          </span>
        )}
        {item.media === 'icon' && item.icon && (
          <Svg name={item.icon} size={28} className="mo-block-carousel__item-icon" iconColor={item.iconColor} />
        )}
        {(item.title || item.subhead || item.text || item.href) && (
          <span className="mo-block-carousel__item-label" data-carousel-fade="0.5 8" data-carousel-inset="1rem">
            <span className="mo-block-carousel__item-title" data-carousel-fade="0.1 10">
              {item.title}
            </span>
            {item.subhead && <span className="mo-block-carousel__item-subhead">{item.subhead}</span>}
            {item.text && <span className="mo-block-carousel__item-text">{item.text}</span>}
            {item.href && <span className="mo-visually-hidden">{more}</span>}
          </span>
        )}
      </>
    );
    const own = ['mo-block-carousel__item', !image && !video && 'mo-has-no-media'].filter(Boolean).join(' ');
    if (item.href)
      return (
        <Link href={item.href} className={own}>
          {body}
        </Link>
      );
    return <div className={own}>{body}</div>;
  };

  return (
    <div
      className={['mo-block-carousel', header && 'mo-has-header', hasCards && 'mo-has-cards', colored, useInText()]
        .filter(Boolean)
        .join(' ')}
      data-carousel-block=""
    >
      {header && (
        <div className="mo-block-carousel__header">
          <span className="mo-block-carousel__heading">{header}</span>
          <IconButton
            icon={<ArrowIcons />}
            label={say.showAllOf(header)}
            aria-expanded="false"
            className="mo-block-carousel__arrow"
            data-carousel-show-all=""
            data-carousel-arrow=""
            data-all={say.showAllOf(header)}
            data-fewer={say.showFewerOf(header)}
          />
        </div>
      )}
      <Carousel
        layout={layout === 'hero-center' ? 'hero' : layout}
        alignment={layout === 'hero-center' ? 'center' : 'start'}
        label={label || header || say.carousel}
        roleDescription={say.carousel}
        itemsFocusable
        itemRoleDescription={say.slide}
        items={items.map((item, i) => ({
          key: String(i),
          label: say.slideOf(i + 1, items.length),
          content: item.card ? cardOf(item, i) : plainOf(item, i),
          ...(layout === 'multi-aspect-ratio' ? { aspect: item.aspect } : {}),
          // An item with a page is one link and a card with buttons has them to focus; one with nothing to focus in it is reached itself.
          focusable: !item.href && item.buttons.length === 0,
        }))}
      />
      {!header && (
        <div className="mo-block-carousel__show-all">
          <Button kind="text" aria-expanded="false" data-carousel-show-all="" data-all={say.showAll} data-fewer={say.showFewer}>
            {say.showAll}
          </Button>
        </div>
      )}
    </div>
  );
}

/** A card image's width / height from its ratio ("3:2"). */
function ratioOf(ratio?: string) {
  const [w, h] = ratio ? ratio.split(':').map(Number) : [3, 2];
  return w && h ? w / h : 3 / 2;
}
