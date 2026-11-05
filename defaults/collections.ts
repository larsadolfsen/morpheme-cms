// What the editor can edit on a site, and the fields of each (the kinds of collection and field:
// packages/editor/src/schema.ts). The fields mirror src/content.config.ts and the readers of the data files
// (packages/editor/site/*.ts); keep them in step.
//   markdown: a folder of .md files (front matter + text): blog posts and pages.
//   folder:   a folder of .json files, one entry per file: categories, promotions (the testimonials are the standard
//             block "Testimonials"'s, packages/editor/src/standard/testimonials/list.ts, an app's lists its own,
//             src/apps/<app>/lists.ts).
//   files:    single .json files: the settings (the standard pages …), the footer and the menu.
import { AppWindow, ArrowsHorizontal, ColumnsPlusLeft, ColumnsPlusRight, File, SquareHalfBottom } from '@phosphor-icons/react';
import type { Collection, Field } from '../src/schema';
import { fromContactBar } from '../lib/contactBar';
import { config } from '@site/config';
import { standardPaths } from '@site/standardPages';

// The fields of one button of the action bar (the bottom bar on a phone, ActionBar.astro) and of the button in the header
// ("Header button", src/data/header.json): its text, where it leads, and the promotion or page it leads to.
const barButtonLabel: Field = {
  name: 'label',
  label: 'Button text',
  type: 'string',
  max: 30,
  hint: "If the field is empty, the standard text or the page's name is used.",
};

const barButtonTo: Field = {
  name: 'to',
  label: 'Leads to',
  type: 'select',
  required: true,
  default: 'booking',
  options: [
    { label: 'Book an appointment', value: 'booking' },
    { label: 'Call', value: 'phone' },
    { label: 'Open promotion', value: 'promotion', onPage: 'promotions' },
    { label: 'A page', value: 'page' },
  ],
};

const barButtonOpen: Field = {
  name: 'open',
  label: 'Promotion',
  type: 'relation',
  to: 'promotions',
  onPage: true,
  required: true,
  only: { field: 'to', is: ['promotion'] },
};

const barButtonHref: Field = {
  name: 'href',
  label: 'Page',
  type: 'relation',
  to: 'pages',
  fixed: true,
  required: true,
  only: { field: 'to', is: ['page'] },
};

// The page Google should count as the original of a page or a post (rel=canonical); empty is itself.
// Under "Search engines" with the Google texts (EntryForm.tsx).
const canonical: Field = {
  name: 'canonical',
  label: 'Canonical URL',
  type: 'relation',
  to: 'pages',
  fixed: true,
  hint: 'The page Google should show instead of this one.',
};

// Not for search engines: noindex, and not in the sitemap. Under "Search engines" too.
const noindex: Field = {
  name: 'noindex',
  label: 'Hide from search engines (noindex)',
  type: 'boolean',
  hint: 'The page is not shown in Google.',
};

// The text of the picture at the top of a post (a page has its pictures in its text): "Decorative picture" (drawn with alt="", screen readers skip
// it), else its alt text.
const topImageText: Field[] = [
  {
    name: 'imageDecorative',
    label: 'Decorative picture',
    type: 'boolean',
    toggle: ['On', 'Off'],
    hint: 'Screen readers skip the picture.',
  },
  { name: 'imageAlt', label: 'Alt text', type: 'string', only: { field: 'imageDecorative', is: ['', 'false'] } },
];

// "Status" at the top of a page or post (EntryForm.tsx): Draft, Hidden, Published or Scheduled, and for
// Scheduled when (packages/editor/lib/status.mjs). Published is no `status` in the file. A post's date follows the time.
const status = (hidden: string): Field[] => [
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    segments: true,
    options: [
      { value: 'draft', label: 'Draft', hint: 'Not shown on the website.' },
      { value: 'unlisted', label: 'Hidden', hint: hidden },
      { value: '', label: 'Published', hint: 'Shown on the website.' },
      { value: 'scheduled', label: 'Scheduled', hint: 'Shown on the website from the time below.' },
    ],
  },
  {
    name: 'publishAt',
    label: 'Time',
    type: 'datetime',
    required: true,
    only: { field: 'status', is: ['scheduled'] },
    hint: 'Published at most an hour after.',
  },
];

// The Google texts, and the picture when the page is shared, which the editor shows under "Social media" (SHARE_FIELDS
// in packages/editor/src/seo.ts).
const seo: Field[] = [
  {
    name: 'seoTitle',
    label: 'Google title',
    type: 'string',
    hint: 'At most about 60 characters.',
    max: 70,
  },
  {
    name: 'seoDescription',
    label: 'Google description',
    type: 'text',
    hint: 'About 140-155 characters.',
    max: 170,
  },
  // og:image (Base.astro), cut to 1200 × 630 by packages/editor/scripts/responsive-images.mjs.
  {
    name: 'shareImage',
    label: 'Picture when shared',
    type: 'image',
    hint: 'Shown when the page is shared, e.g. on Facebook.',
  },
];

// The title and description when a page or post is shared (og:title, og:description in Base.astro), under "Social
// media" with the picture.
const shareTexts: Field[] = [
  {
    name: 'shareTitle',
    label: 'Title when shared',
    type: 'string',
    hint: 'If the field is empty, the Google title is used.',
    max: 70,
  },
  {
    name: 'shareDescription',
    label: 'Description when shared',
    type: 'text',
    hint: 'If the field is empty, the Google description is used.',
    max: 170,
  },
];

// The words that link to a page or post from the others (packages/editor/site/autolinks.mjs). Under
// "Search engines" with the Google texts (EntryForm.tsx).
const keywords: Field[] = [
  {
    name: 'keyword',
    label: 'Main keyword',
    type: 'string',
    chips: 'one',
    hint: 'The word becomes a link to here from other pages.',
  },
  {
    name: 'keywords',
    label: 'Other keywords',
    type: 'string',
    chips: 'many',
    hint: 'Each word becomes a link to here from other pages.',
  },
];

// The business, on "Business" (CompanyForm.tsx): its name and title, phone, e-mail, address and CVR number
// (src/data/contact.json), shown at the top and bottom of every page and in the blocks that show them ("Contact" and
// "Address"); and the bank details (src/data/payment.json), shown in "Payment". The calendar
// is the app Calendly's (morpheme-apps/apps/calendly/).
export const contactFields: Field[] = [
  { name: 'name', label: 'Name', type: 'string', required: true },
  { name: 'role', label: 'Title', type: 'string', required: true },
  {
    name: 'phone',
    label: 'Phone',
    type: 'string',
    required: true,
    digitsInPairs: 8,
    phone: '+45',
  },
  {
    name: 'email',
    label: 'Email',
    type: 'string',
    required: true,
    pattern: [
      '^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\\.[A-Za-z]{2,}$',
      'Write a valid email address',
    ],
  },
  {
    name: 'street',
    label: 'Street and number',
    type: 'string',
    required: true,
  },
  { name: 'city', label: 'Postcode and town', type: 'string', required: true },
  {
    name: 'cvr',
    label: 'CVR number',
    type: 'string',
    hint: 'Shown at the bottom of every page.',
    pattern: ['^\\d{8}$', 'A CVR number has eight digits'],
  },
];

// The social media (src/data/social.json, a part of its own under "Business", company.ts): the site's profiles, and
// which share buttons a post shows. A switch that is not in the file is on (company.ts gives the form that default).
// A profile address: empty, or one that begins with https://.
const httpsAddress: [string, string] = ['^$|^https://\\S+$', 'Skriv en adresse, der begynder med https://'];

export const socialFields: Field[] = [
  {
    name: 'facebook',
    label: 'Facebook',
    type: 'string',
    hint: "The address of the site's profile. Shown in Google's data about the business.",
    pattern: httpsAddress,
  },
  {
    name: 'instagram',
    label: 'Instagram',
    type: 'string',
    pattern: httpsAddress,
  },
  {
    name: 'linkedin',
    label: 'LinkedIn',
    type: 'string',
    pattern: httpsAddress,
  },
  {
    name: 'x',
    label: 'X',
    type: 'string',
    pattern: httpsAddress,
  },
  {
    name: 'youtube',
    label: 'YouTube',
    type: 'string',
    pattern: httpsAddress,
  },
  {
    name: 'tiktok',
    label: 'TikTok',
    type: 'string',
    pattern: httpsAddress,
  },
  {
    name: 'pinterest',
    label: 'Pinterest',
    type: 'string',
    pattern: httpsAddress,
  },
  { name: 'shareFacebook', label: 'Share on Facebook', type: 'boolean' },
  { name: 'shareX', label: 'Share on X', type: 'boolean' },
  { name: 'shareLinkedin', label: 'Share on LinkedIn', type: 'boolean' },
  { name: 'sharePinterest', label: 'Share on Pinterest', type: 'boolean', hint: 'Shown only when the post has a picture.' },
  { name: 'shareCopyLink', label: 'Copy link', type: 'boolean' },
];

// The bank details, a part of its own under "Payment" (company.ts, src/data/payment.json).
export const bankFields: Field[] = [
  { name: 'bank', label: 'Bank', type: 'string', required: true },
  { name: 'reg', label: 'Reg. no.', type: 'string', required: true },
  { name: 'account', label: 'Account number', type: 'string', required: true },
];

// The standard pages (src/data/standard-pages.json, config.standardPages, packages/editor/defaults/standardPages.ts), each a field that
// picks a page, as rows of a list (Part.rows): the front page, shown at / (packages/editor/site/home.ts), the blog page, shown at
// /blog/, the page shown for an address that does not exist (packages/editor/site/standardPages.ts) and the contact page under
// "Appearance" › "Default pages" (appearance in editor.ts), and the privacy policy and the cookie policy under "Privacy" ›
// "Privacy pages" (privacy.ts). Different pages, but the cookie policy may be the privacy policy (keptBy in rules.ts).
const standardPageFields: Field[] = [
  {
    name: 'front',
    label: 'Front page',
    type: 'relation',
    to: 'standardPages',
    required: true,
    hint: 'The page is shown on the front page, and its own address sends on there.',
  },
  {
    name: 'blog',
    label: 'Blog page',
    type: 'relation',
    to: 'standardPages',
    required: true,
    hint: 'The page is shown at /blog/, and its own address sends on there.',
  },
  {
    name: 'notFound',
    label: '404 page',
    type: 'relation',
    to: 'standardPages',
    required: true,
    hint: 'The page is shown when an address does not exist.',
  },
  {
    name: 'contact',
    label: 'Contact page',
    type: 'relation',
    to: 'standardPages',
    required: true,
    hint: 'The link to the directions goes here.',
  },
  {
    name: 'privacy',
    label: 'Privacy policy',
    type: 'relation',
    to: 'standardPages',
    required: true,
    hint: 'The page that tells what information is stored, and why.',
  },
  {
    name: 'cookies',
    label: 'Cookie policy',
    type: 'relation',
    to: 'standardPages',
    required: true,
    hint: "The cookie banner's link goes here; it may be the privacy policy.",
  },
];

/** The fields of the standard pages by their keys, in that order. */
export const standardPageFieldsOf = (...keys: string[]) => keys.map((key) => standardPageFields.find((f) => f.name === key)!);

/** The "Book an appointment" box's own heading and text, in a page's text; empty,
 * the shared ones ("Blocks" › "Book an appointment", booking.json). */
export const bookingTexts: Field[] = [
  {
    name: 'heading',
    label: 'Heading',
    type: 'string',
    hint: 'If empty, the default text is used.',
    placeholder: (site) => site.booking.heading,
  },
  {
    name: 'text',
    label: 'Text',
    type: 'text',
    hint: 'If empty, the default text is used.',
    placeholder: (site) => site.booking.text,
  },
];

// The icons the owner picks from on the site's own fields (the same as the standard blocks', iconNames in
// packages/editor/src/icon.tsx, which draws them).
export const icons = [
  ['Diploma', 'certificate'],
  ['Heart', 'heart'],
  ['Hand with heart', 'hand-heart'],
  ['Three people', 'users-three'],
  ['Two people', 'users'],
  ['Graduation cap', 'graduation-cap'],
  ['Handshake', 'handshake'],
  ['Book', 'book-open'],
  ['Book with text', 'book-open-text'],
  ['Medal', 'medal'],
  ['Conversation', 'chats'],
  ['Lotus flower', 'flower-lotus'],
  ['Leaf', 'leaf'],
  ['Light bulb', 'lightbulb'],
  ['Train', 'train'],
  ['Bus', 'bus'],
  ['Bicycle', 'bicycle'],
  ['Car', 'car'],
  ['Door', 'door-open'],
  ['Video camera', 'video-camera'],
  ['Lifebuoy', 'lifebuoy'],
  ['Phone', 'phone'],
  ['Clock', 'clock'],
  ['Map pin', 'map-pin'],
  ['Coffee', 'coffee'],
  ['Wheelchair', 'wheelchair'],
  ['Info', 'info'],
  ['Letter', 'envelope-simple'],
].map(([label, value]) => ({ label, value }));

// A link in the menu: any page, the front page and the blog too, stored by its address.
const menuHref: Field = { name: 'href', label: 'Page', type: 'relation', to: 'pages', fixed: true, required: true };

export const collections: Collection[] = [
  {
    kind: 'markdown',
    id: 'blog',
    create: 'New blog post',
    label: 'Blog posts',
    singular: 'blog post',
    folder: 'src/content/blog',
    deletable: true,
    fields: [
      ...status('Not shown on the blog or in Google, but can be opened at its address.'),
      { name: 'title', label: 'Title', type: 'string', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'path', label: 'URL', type: 'string', address: 'post' },
      { name: 'description', label: 'Short description', type: 'text' },
      {
        name: 'categories',
        label: 'Tags',
        type: 'relation',
        to: 'categories',
        multiple: true,
        add: 'Add tag',
        edit: { to: 'new/tags', text: 'Create a tag' },
      },
      { name: 'image', label: 'Picture at the top', type: 'image' },
      ...topImageText,
      ...seo,
      ...shareTexts,
      ...keywords,
      canonical,
      noindex,
    ],
  },
  {
    kind: 'markdown',
    id: 'pages',
    create: 'New page',
    label: 'Pages',
    singular: 'page',
    folder: 'src/content/pages',
    fields: [
      ...status('Not shown in Google, but can be opened at its address.'),
      { name: 'title', label: 'Title', type: 'string', required: true },
      { name: 'path', label: 'URL', type: 'string', address: 'page' },
      { name: 'description', label: 'Short description', type: 'text' },
      {
        name: 'categories',
        label: 'Tags',
        type: 'relation',
        to: 'categories',
        multiple: true,
        add: 'Add tag',
        edit: { to: 'new/tags', text: 'Create a tag' },
        hint: 'Not shown on the website.',
      },
      {
        name: 'template',
        label: 'Template',
        type: 'select',
        segments: true,
        layout: true,
        // The options the theme in use offers, the first of its list the default (templateFieldOf in src/templateField.ts).
        offered: 'templates',
        options: [
          { label: 'Single column', value: 'single', icon: File },
          { label: 'Full width', value: 'full', icon: ArrowsHorizontal },
          { label: 'Sidebar left', value: 'sidebar-left', icon: ColumnsPlusLeft },
          { label: 'Sidebar right', value: 'sidebar-right', icon: ColumnsPlusRight },
        ],
        hint: 'The theme decides which templates there are.',
      },
      {
        name: 'review',
        label: 'For review',
        type: 'text',
        hint: 'Only shown on pages under /ny/.',
      },
      ...seo,
      ...shareTexts,
      ...keywords,
      canonical,
      noindex,
    ],
    blocks: true,
    // One "Book an appointment" a page (at the very end it goes across the page, PageLayout.astro). A new page
    // starts empty.
    template: { max: { booking: 1 } },
  },
  {
    kind: 'folder',
    id: 'tags',
    create: 'New tag',
    label: 'Tags',
    singular: 'tag',
    folder: 'src/data/categories',
    deletable: true,
    slugFrom: 'name',
    summary: (d) => String(d.name ?? ''),
    fields: [
      { name: 'name', label: 'Name', type: 'string', required: true },
      ...seo,
      {
        name: 'blogCategory',
        label: 'Blog category',
        type: 'boolean',
        toggle: ['Show', 'Hide'],
        default: true,
        hint: 'Show the tag on the blog with its own page.',
      },
    ],
  },
  {
    // "Promotion": what is laid over the pages to get visitors to book, call or sign up, in
    // src/data/popups/<slug>.json, read by packages/editor/site/popups.ts, on every page or those picked under "Pages".
    // The pop-ups are shown by packages/editor/theme/components/Popup.astro; a kind an app adds without a part
    // in the pop-up (src/apps/<app>/popups/View.tsx) shows itself (the app Calendly's booking sheet,
    // morpheme-apps/apps/calendly/, when a button opens it).
    kind: 'folder',
    id: 'popups',
    create: 'New promotion',
    label: 'Promotion',
    singular: 'promotion',
    folder: 'src/data/popups',
    deletable: true,
    // A pop-up by its heading; a kind without one by its name (the app's bar), else by the kind's name
    // (the action bar, DataForm.tsx, Library.tsx).
    slugFrom: ['heading', 'name'],
    summary: (d) => String(d.heading ?? d.name ?? ''),
    shownOn: { pages: 'pages', tags: 'tags', everywhere: { field: 'where', is: 'all' } },
    onOff: 'enabled',
    // Of kinds, picked under "+" when a new one is made: the pop-up, with a button; the action bar (`bookingbar`) at the
    // bottom of a phone's screen (shown by packages/editor/theme/components/ActionBar.astro), without the pop-up's fields
    // (`omit`) and with its own; and those the apps add (src/apps/<app>/popups/, e.g.
    // Mailchimp's with a signup form, and Calendly's booking sheet), with fields of their own and without
    // those of the pop-up they do not have (AppKind.omit).
    kinds: 'type',
    omit: {
      bookingbar: ['image', 'heading', 'text', 'trigger', 'button'],
    },
    // What a button ("Buttons": "Open promotion") can open of one: a pop-up itself, the action bar nothing (opens.ts).
    opens: { standard: { label: 'Pop-up' } },
    // A contact bar (`contactbar`, a kind of its own before it became an action bar) is an action bar with its two
    // buttons, to call and to its page, without one the contact page (packages/editor/lib/contactBar.ts).
    upgrade: (data, files) => fromContactBar(data, standardPaths(files.find((f) => f.path === config.standardPages)?.text).contact ?? ''),
    fields: [
      {
        name: 'type',
        label: 'Type',
        type: 'select',
        locked: true,
        // Without one (those made before there were kinds), it is the standard one.
        default: 'standard',
        options: [
          { label: 'Pop-up', value: 'standard', icon: AppWindow, hint: 'With a picture, text and a button.' },
          {
            label: 'Action bar',
            value: 'bookingbar',
            icon: SquareHalfBottom,
            hint: 'Buttons or text at the bottom of the screen on a phone.',
          },
        ],
      },
      {
        name: 'enabled',
        label: 'Activated',
        type: 'boolean',
        toggle: ['On', 'Off'],
        default: true,
      },
      // At the top of the box, to its edges in 3:2, as on the cards with a picture ("Cards").
      { name: 'image', label: 'Picture', type: 'image', hint: 'Shown at the top, cropped to 3:2.' },
      { name: 'heading', label: 'Heading', type: 'string', required: true, max: 80 },
      { name: 'text', label: 'Text', type: 'text' },
      // Where it is shown, for every kind: on every page, on those picked (without `where`, from
      // before, those picked), or on the blog posts with one of the tags picked and those tags' pages.
      {
        name: 'where',
        label: 'Shown on',
        type: 'select',
        default: 'some',
        options: [
          { label: 'All pages', value: 'all' },
          { label: 'Selected pages', value: 'some' },
          { label: 'Blog posts with tags', value: 'tags' },
        ],
      },
      {
        name: 'pages',
        label: 'Pages',
        type: 'relation',
        to: 'pages',
        fixed: true,
        multiple: true,
        required: true,
        add: 'Add page',
        hint: 'Only shown on these pages.',
        only: { field: 'where', is: ['some'] },
      },
      {
        name: 'tags',
        label: 'Tags',
        type: 'relation',
        to: 'categories',
        multiple: true,
        required: true,
        add: 'Add tag',
        hint: "Shown on blog posts with one of these tags and on the tags' pages.",
        only: { field: 'where', is: ['tags'] },
      },
      // When it opens (packages/editor/theme/components/Popup.astro): after `delay`, at `scroll` % down the page, or as the
      // visitor is about to leave it.
      {
        name: 'trigger',
        label: 'Shown',
        type: 'select',
        required: true,
        default: 'time',
        hint: 'Each visitor sees it until they close it.',
        options: [
          { label: 'After a while', value: 'time' },
          { label: 'When the page is scrolled down', value: 'scroll' },
          {
            label: 'When the visitor is about to leave the page',
            value: 'exit',
            hint: 'On a phone: when the visitor scrolls up quickly.',
          },
        ],
      },
      {
        name: 'delay',
        label: 'Shown after',
        type: 'select',
        required: true,
        default: '5',
        only: { field: 'trigger', is: ['time'] },
        options: [
          { label: 'At once', value: '0' },
          { label: '5 seconds', value: '5' },
          { label: '10 seconds', value: '10' },
          { label: '30 seconds', value: '30' },
        ],
      },
      {
        name: 'scroll',
        label: 'Scrolled down',
        type: 'select',
        required: true,
        default: '25',
        options: [
          { label: '25% of the page', value: '25' },
          { label: '50% of the page', value: '50' },
          { label: '75% of the page', value: '75' },
          { label: 'The whole page', value: '100' },
        ],
        only: { field: 'trigger', is: ['scroll'] },
      },
      {
        name: 'button',
        label: 'Button',
        type: 'select',
        required: true,
        default: 'booking',
        options: [
          { label: 'Book an appointment', value: 'booking' },
          { label: 'Call', value: 'phone' },
          { label: 'A page', value: 'page' },
          { label: 'Download PDF', value: 'file' },
          { label: 'No button', value: 'none' },
        ],
      },
      {
        name: 'label',
        label: 'Button text',
        type: 'string',
        max: 30,
        hint: 'If empty, the default text is used.',
        only: { field: 'button', is: ['booking', 'phone', 'page', 'file'] },
      },
      // A PDF from "Files" (public/filer/), by its address (/filer/<name>.pdf).
      {
        name: 'file',
        label: 'PDF',
        type: 'relation',
        to: 'files',
        required: true,
        edit: { to: 'files', text: 'Upload a PDF' },
        only: { field: 'button', is: ['file'] },
      },
      {
        name: 'href',
        label: 'Page (button)',
        type: 'relation',
        to: 'pages',
        fixed: true,
        required: true,
        only: { field: 'button', is: ['page'] },
      },
      // The action bar's one or two items, each a button or a text (`type`; without one, a button, as before there were
      // texts). The first button is filled, a second with a line. Each button goes where a button of "Buttons" can
      // (Button in packages/editor/src/standard/buttons/fields.ts, the targets of `buttonTargets` in config.ts and a
      // page): "Book an appointment" (what books on the page, an app's booking sheet, else the booking page), "Call", "Open
      // promotion" (one shown on every page: a pop-up, or an app's booking sheet) or a page. A text is a list row of
      // two lines, its heading over its text, beside the button (ActionBar.astro).
      {
        name: 'buttons',
        label: 'Buttons and text',
        singular: 'item',
        type: 'list',
        summary: ['label', 'heading'],
        required: true,
        maxItems: 2,
        hint: 'At most two items.',
        default: [{ type: 'button', label: '', to: 'booking' }],
        only: { field: 'type', is: ['bookingbar'] },
        fields: [
          {
            name: 'type',
            label: 'Type',
            type: 'select',
            segments: true,
            default: 'button',
            options: [
              { label: 'Button', value: 'button' },
              { label: 'Text', value: 'text' },
            ],
          },
          {
            name: 'heading',
            label: 'Heading',
            type: 'string',
            required: true,
            max: 30,
            only: { field: 'type', is: ['text'] },
          },
          {
            name: 'text',
            label: 'Text',
            type: 'string',
            max: 40,
            hint: 'Shown under the heading.',
            only: { field: 'type', is: ['text'] },
          },
          { ...barButtonLabel, only: { field: 'type', is: ['button'] } },
          { ...barButtonTo, only: { field: 'type', is: ['button'] } },
          barButtonOpen,
          barButtonHref,
        ],
      },
    ],
  },
  {
    kind: 'files',
    id: 'footer',
    label: 'Footer',
    singular: 'footer',
    files: [
      // src/data/footer.json, read by packages/editor/theme/layouts/Base.astro.
      {
        file: 'src/data/footer.json',
        label: 'The footer',
        view: '/',
        fields: [
          { name: 'text', label: 'Text (under the name)', type: 'text', required: true },
          {
            name: 'contactHeading',
            label: 'Heading (contact)',
            type: 'string',
            required: true,
            edit: { to: 'company/kontakt', text: 'Edit phone, email and address' },
          },
          { name: 'linksHeading', label: 'Heading (links)', type: 'string', required: true },
          {
            name: 'links',
            label: 'Links',
            singular: 'link',
            type: 'list',
            summary: 'label',
            required: true,
            fields: [{ name: 'label', label: 'Text', type: 'string', required: true }, menuHref],
          },
        ],
      },
    ],
  },
  {
    kind: 'files',
    id: 'menu',
    label: 'Main menu',
    singular: 'main menu',
    files: [
      // src/data/menu.json, read by packages/editor/site/site.ts (nav, navShown) for the header (Header.astro, MobileMenu.tsx).
      {
        file: 'src/data/menu.json',
        label: 'The main menu',
        view: '/',
        fields: [
          {
            name: 'enabled',
            label: 'Activated',
            type: 'boolean',
            toggle: ['On', 'Off'],
            default: true,
            hint: 'When the menu is off, the header has neither menu nor menu button.',
          },
        ],
        root: {
          name: 'items',
          label: 'Menu items',
          singular: 'menu item',
          type: 'list',
          summary: 'label',
          fields: [
            { name: 'label', label: 'Text', type: 'string', required: true },
            menuHref,
            {
              name: 'children',
              label: 'Submenu',
              singular: 'item',
              type: 'list',
              summary: 'label',
              fields: [{ name: 'label', label: 'Text', type: 'string', required: true }, menuHref],
            },
          ],
        },
      },
    ],
  },
  {
    kind: 'files',
    id: 'mobile-menu',
    label: 'Mobile menu',
    singular: 'mobile menu',
    files: [
      // src/data/mobile-menu.json, read by packages/editor/site/site.ts (mobileNav) for the bar under the header (MobileNav.astro).
      {
        file: 'src/data/mobile-menu.json',
        label: 'The mobile menu',
        view: '/',
        fields: [
          {
            name: 'enabled',
            label: 'Activated',
            type: 'boolean',
            toggle: ['On', 'Off'],
            default: false,
            hint: 'The items are on a line under the header on a phone and can be swiped sideways.',
          },
        ],
        root: {
          name: 'items',
          label: 'Menu items',
          singular: 'menu item',
          type: 'list',
          summary: 'label',
          fields: [{ name: 'label', label: 'Text', type: 'string', required: true }, menuHref],
        },
      },
    ],
  },
  {
    kind: 'files',
    id: 'headerknap',
    label: 'Header button',
    singular: 'header button',
    files: [
      // src/data/header.json, optional (a site without it has no button and the menu button at the start), read by the header
      // (Header.astro). The button is one of the action bar's (barButtonLabel …).
      {
        file: 'src/data/header.json',
        label: 'The header',
        view: '/',
        optional: true,
        fields: [
          {
            name: 'button',
            label: 'Action button',
            type: 'object',
            fields: [
              {
                name: 'enabled',
                label: 'Activated',
                type: 'boolean',
                toggle: ['On', 'Off'],
                default: false,
                hint: 'The button is in the header.',
              },
              barButtonLabel,
              barButtonTo,
              barButtonOpen,
              barButtonHref,
            ],
          },
          {
            name: 'menuSide',
            label: 'Menu button position',
            type: 'select',
            segments: true,
            default: 'start',
            options: [
              { label: 'Left', value: 'start' },
              { label: 'Right', value: 'end' },
            ],
          },
        ],
      },
    ],
  },
];
