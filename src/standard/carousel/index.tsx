// "Carousel", a standard block: items swiped sideways in Material 3's layouts (m3.material.io/components/carousel). It is its own block, not a setting of
// Cards (owner, 27 Nov 2026: "A carouselle and s grid is not the same thing"). An item is an image or a video, with a brief optional label (title, subhead,
// text), or, in the uncontained layouts only, a card (`card`), drawn by the Card component in the block's variant (`design`: outlined, filled or elevated,
// and for filled its colour). An item's media is its own (`media`: an image, the default, a video, an icon or none), so a carousel can mix them. A new block
// starts as Multi-browse, M3's first layout. How it looks is the theme's (theme/blocks/carousel/View.tsx); what it shows: view.ts, and load.ts on the site.
// A Cards block that was a carousel (`phone: 'carousel'`) is read as this block (lib/blocks.mjs FORMER, lib/migrate-carousel.mjs).
import { defineBlock } from '../../blocks';
import { iconOptions, materialIcon } from '../../icon';
import { iconColorField } from '../../iconColor';
import { t } from '../../i18n';
import { buttonList } from '../buttons/fields';
import { FORMATS } from '../../../lib/crop.mjs';
import { ASPECTS, DEFAULT_ASPECT } from '../cards/cut.mjs';
import { example } from './shared';

// The layouts that take no cards; the card fields show in the others (the uncontained ones).
const PLAIN_LAYOUTS = ['multi-browse', 'hero', 'hero-center', 'full-screen'];

export default defineBlock({
  group: 'cards',
  label: t.blocks.carousel.label,
  icon: materialIcon('view_carousel'),
  hint: t.blocks.carousel.hint,
  edit: { to: 'blocks/carousel', text: t.blocks.carousel.edit },
  // Typed in place (InlineCarousel.tsx): the label where it stands; the media from the item's slots, the page and the buttons of a card on the card itself.
  inline: {
    item: 'items',
    fields: ['title', 'subhead', 'text'],
    media: ['media', 'icon', 'iconColor', 'image', 'alt', 'aspect', 'video'],
    itemMedia: 'media',
    link: 'href',
    onItem: ['buttons', 'divider', 'card'],
    barLink: false,
    blockSettings: true,
    texts: {
      addAbove: t.blocks.carousel.addAbove,
      addBelow: t.blocks.carousel.addBelow,
      link: t.blocks.carousel.link,
      row: t.blocks.carousel.itemMenu,
      icon: t.blocks.carousel.media,
    },
  },
  fields: [
    // M3's order and names (m3.material.io/components/carousel/guidelines, Layouts), each hint M3's "Best used for"; the uncontained multi-aspect ratio layout is a
    // variant of Uncontained and follows it. Every layout is offered for every item: the editor decides (owner, 25 Nov 2026). Multi-browse is the layout of a new block.
    {
      name: 'layout',
      label: t.blocks.carousel.layout,
      type: 'select',
      default: 'multi-browse',
      // A carousel always has a layout: no "None" above Multi-browse.
      required: true,
      versions: true,
      options: [
        { label: t.blocks.carousel.layoutMultiBrowse, value: 'multi-browse', hint: t.blocks.carousel.layoutMultiBrowseHint },
        { label: t.blocks.carousel.layoutUncontained, value: 'uncontained', hint: t.blocks.carousel.layoutUncontainedHint },
        { label: t.blocks.carousel.layoutMultiAspect, value: 'multi-aspect-ratio', hint: t.blocks.carousel.layoutMultiAspectHint },
        { label: t.blocks.carousel.layoutHero, value: 'hero', hint: t.blocks.carousel.layoutHeroHint },
        { label: t.blocks.carousel.layoutHeroCenter, value: 'hero-center', hint: t.blocks.carousel.layoutHeroCenterHint },
        { label: t.blocks.carousel.layoutFullScreen, value: 'full-screen', hint: t.blocks.carousel.layoutFullScreenHint },
      ],
    },
    // The carousel's optional header (M3, Carousel, Accessibility: "If the carousel has a header, you can use an arrow icon button instead" of Show all). Empty:
    // no header, `Show all` under the row. Typed in place above it (InlineCarousel.tsx).
    { name: 'header', label: t.blocks.carousel.header, type: 'string', hint: t.blocks.carousel.headerHint },
    // The variant of the card items (M3's three cards; outlined is the empty choice), only in the layouts that take cards.
    {
      name: 'design',
      label: t.blocks.cards.design,
      type: 'select',
      segments: true,
      only: { field: 'layout', is: PLAIN_LAYOUTS, not: true },
      options: [
        { label: t.blocks.cards.designOutlined, value: '', icon: materialIcon('square') },
        { label: t.blocks.cards.designFilled, value: 'filled', icon: materialIcon('circle') },
        { label: t.blocks.cards.designElevated, value: 'elevated', icon: materialIcon('shapes') },
      ],
    },
    // A filled card is Material's surface container until another container is picked.
    {
      name: 'color',
      label: t.blocks.cards.color,
      type: 'select',
      segments: true,
      only: { field: 'design', is: ['filled'] },
      options: [
        { label: t.blocks.cards.colorSurface, value: '' },
        { label: t.blocks.cards.colorPrimary, value: 'primary' },
        { label: t.blocks.cards.colorSecondary, value: 'secondary' },
        { label: t.blocks.cards.colorTertiary, value: 'tertiary' },
      ],
    },
    // One aspect ratio for the images of the card items (the multi-aspect ratio layout has each item's own); 3:2 is the cards' look.
    {
      name: 'ratio',
      label: t.blocks.cards.ratio,
      type: 'select',
      default: '3:2',
      hint: t.blocks.carousel.ratioHint,
      only: { field: 'layout', is: ['uncontained'] },
      options: FORMATS.map((f) => ({ label: f, value: f })),
    },
    {
      name: 'items',
      label: t.blocks.carousel.items,
      singular: t.blocks.carousel.item,
      type: 'list',
      summary: 'title',
      required: true,
      fields: [
        // What fills the item: an image (the default), a video, or (for a card) an icon or nothing.
        {
          name: 'media',
          label: t.blocks.cards.media,
          type: 'select',
          segments: true,
          options: [
            { label: t.blocks.cards.mediaImage, value: '', icon: materialIcon('image') },
            { label: t.blocks.cards.mediaVideo, value: 'video', icon: materialIcon('videocam') },
            { label: t.blocks.cards.mediaIcon, value: 'icon', icon: materialIcon('shapes') },
            { label: t.blocks.cards.mediaNone, value: 'none', icon: materialIcon('block') },
          ],
        },
        // A card (the Card component in the block's variant) instead of a plain item: only in the uncontained layouts (M3, Guidelines, Uncontained: "this layout can be
        // customized to show more text or other UI above or below each item without the text being masked or cropped").
        {
          name: 'card',
          label: t.blocks.carousel.card,
          type: 'boolean',
          toggle: t.blocks.carousel.cardToggle,
          hint: t.blocks.carousel.cardHint,
          only: { field: 'layout', is: PLAIN_LAYOUTS, not: true },
        },
        // The color comes first, so it is chosen before the icons below it.
        { ...iconColorField, only: { field: 'media', is: ['icon'] } },
        {
          name: 'icon',
          label: t.blocks.cards.icon,
          type: 'select',
          icons: true,
          options: iconOptions(t.blocks.icons),
          only: { field: 'media', is: ['icon'] },
        },
        { name: 'image', label: t.blocks.cards.image, type: 'image', only: { field: 'media', is: [''] } },
        {
          name: 'alt',
          label: t.blocks.picture.alt,
          type: 'string',
          hint: t.blocks.picture.altHint,
          libraryText: 'image',
          only: { field: 'media', is: [''] },
        },
        // The item's own aspect ratio, only in the multi-aspect ratio layout, where its width follows it (Material 3: "Item widths can range anywhere between 9:16 for min width size to 16:9 for max width").
        {
          name: 'aspect',
          label: t.blocks.cards.ratio,
          type: 'select',
          default: DEFAULT_ASPECT,
          hint: t.blocks.carousel.aspectHint,
          only: { field: 'layout', is: ['multi-aspect-ratio'], and: { field: 'media', is: [''] } },
          options: ASPECTS.map((f) => ({ label: f, value: f })),
        },
        {
          name: 'video',
          label: t.blocks.cards.video,
          type: 'string',
          pattern: ['(youtube(-nocookie)?\\.com|youtu\\.be|vimeo\\.com)/', t.blocks.video.urlProblem],
          only: { field: 'media', is: ['video'] },
        },
        // The label is brief and optional (M3, Guidelines: "Item text is optional and should be brief").
        { name: 'title', label: t.blocks.cards.title, type: 'string' },
        { name: 'subhead', label: t.blocks.cards.subhead, type: 'string' },
        { name: 'text', label: t.blocks.cards.text, type: 'text' },
        // An item with a page is one link (the whole item); a video is played, so it has none, and a card with buttons has none either (a link inside a link is not valid).
        {
          name: 'href',
          label: t.blocks.cards.href,
          type: 'relation',
          to: 'pages',
          hint: t.blocks.carousel.hrefHint,
          only: { field: 'media', is: ['video'], not: true, and: { field: 'buttons', is: [''] } },
        },
        // A card's action area: only on a card that is not a link, no fixed maximum.
        {
          ...buttonList,
          name: 'buttons',
          label: t.blocks.cards.buttons,
          singular: t.blocks.cards.button,
          hint: t.blocks.cards.buttonsHint,
          only: { field: 'card', is: ['true'], and: { field: 'href', is: [''], loose: true } },
        },
        // One optional line between the text and the buttons: only on a card with buttons.
        {
          name: 'divider',
          label: t.blocks.cards.divider,
          type: 'boolean',
          toggle: t.blocks.cards.dividerToggle,
          hint: t.blocks.cards.dividerHint,
          only: { field: 'buttons', is: [''], not: true },
        },
      ],
    },
  ],
  example,
  detail: (p) => [
    ((p.items ?? []) as { title?: string }[])
      .map((c) => c.title)
      .filter(Boolean)
      .join(' · '),
  ],
});
