// What the editor can edit on a site, and the fields of each (the kinds of collection and field:
// packages/editor/src/schema.ts). The fields mirror src/content.config.ts and the readers of the data files
// (packages/editor/site/*.ts); keep them in step.
//   markdown: a folder of .md files (front matter + text): blog posts and pages.
//   folder:   a folder of .json files, one entry per file: categories, promotions (the testimonials are the standard
//             block "Udtalelser"'s, packages/editor/src/standard/testimonials/list.ts, an app's lists its own,
//             src/apps/<app>/lists.ts).
//   files:    single .json files: the settings (the standard pages …), the footer and the menu.
import { AppWindow, SquareHalfBottom } from '@phosphor-icons/react';
import type { Collection, Field } from '../src/schema';
import { fromContactBar } from '../lib/contactBar';
import { config } from '@site/config';
import { standardPaths } from '@site/standardPages';

// The page Google should count as the original of a page or a post (rel=canonical); empty is itself.
// Under "Søgemaskiner" with the Google texts (EntryForm.tsx).
const canonical: Field = {
  name: 'canonical',
  label: 'Canonical URL',
  type: 'relation',
  to: 'pages',
  fixed: true,
  hint: 'Den side, Google skal vise i stedet for denne.',
};

// Not for search engines: noindex, and not in the sitemap. Under "Søgemaskiner" too.
const noindex: Field = {
  name: 'noindex',
  label: 'Skjul for søgemaskiner (noindex)',
  type: 'boolean',
  hint: 'Siden vises ikke i Google.',
};

// The text of the picture at the top of a post (a page has its pictures in its text): "Dekorativt billede" (drawn with alt="", screen readers skip
// it), else its alternative text.
const topImageText: Field[] = [
  {
    name: 'imageDecorative',
    label: 'Dekorativt billede',
    type: 'boolean',
    toggle: ['Til', 'Fra'],
    hint: 'Skærmlæsere springer billedet over.',
  },
  { name: 'imageAlt', label: 'Alternativ tekst', type: 'string', only: { field: 'imageDecorative', is: ['', 'false'] } },
];

// "Status" at the top of a page or post (EntryForm.tsx): Kladde, Skjult, Udgivet or Planlagt, and for
// Planlagt when (packages/editor/lib/status.mjs). Udgivet is no `status` in the file. A post's date follows the time.
const status = (hidden: string): Field[] => [
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    segments: true,
    options: [
      { value: 'draft', label: 'Kladde', hint: 'Vises ikke på hjemmesiden.' },
      { value: 'unlisted', label: 'Skjult', hint: hidden },
      { value: '', label: 'Udgivet', hint: 'Vises på hjemmesiden.' },
      { value: 'scheduled', label: 'Planlagt', hint: 'Vises på hjemmesiden fra tidspunktet nedenfor.' },
    ],
  },
  {
    name: 'publishAt',
    label: 'Tidspunkt',
    type: 'datetime',
    required: true,
    only: { field: 'status', is: ['scheduled'] },
    hint: 'Udgives senest en time efter.',
  },
];

// The Google texts, and the picture when the page is shared, which the editor shows under "Sociale medier" (SHARE_FIELDS
// in packages/editor/src/seo.ts).
const seo: Field[] = [
  {
    name: 'seoTitle',
    label: 'Google-titel',
    type: 'string',
    hint: 'Højst ca. 60 tegn.',
    max: 70,
  },
  {
    name: 'seoDescription',
    label: 'Google-beskrivelse',
    type: 'text',
    hint: 'Ca. 140-155 tegn.',
    max: 170,
  },
  // og:image (Base.astro), cut to 1200 × 630 by packages/editor/scripts/responsive-images.mjs.
  {
    name: 'shareImage',
    label: 'Billede ved deling',
    type: 'image',
    hint: 'Vises, når siden deles, fx på Facebook.',
  },
];

// The title and description when a page or post is shared (og:title, og:description in Base.astro), under "Sociale
// medier" with the picture.
const shareTexts: Field[] = [
  {
    name: 'shareTitle',
    label: 'Titel ved deling',
    type: 'string',
    hint: 'Hvis feltet er tomt, bruges Google-titlen.',
    max: 70,
  },
  {
    name: 'shareDescription',
    label: 'Beskrivelse ved deling',
    type: 'text',
    hint: 'Hvis feltet er tomt, bruges Google-beskrivelsen.',
    max: 170,
  },
];

// The words that link to a page or post from the others (packages/editor/site/autolinks.mjs). Under
// "Søgemaskiner" with the Google texts (EntryForm.tsx).
const keywords: Field[] = [
  {
    name: 'keyword',
    label: 'Primært søgeord',
    type: 'string',
    chips: 'one',
    hint: 'Ordet bliver et link hertil fra andre sider.',
  },
  {
    name: 'keywords',
    label: 'Sekundære søgeord',
    type: 'string',
    chips: 'many',
    hint: 'Hvert ord bliver et link hertil fra andre sider.',
  },
];

// The business, on "Virksomheden" (CompanyForm.tsx): its name and title, phone, e-mail, address and CVR number
// (src/data/contact.json), shown at the top and bottom of every page and in the blocks that show them ("Kontakt" and
// "Adresse"); and the bank details (src/data/payment.json), shown in "Betaling". The calendar
// is the app Calendly's (morpheme-apps/apps/calendly/).
export const contactFields: Field[] = [
  { name: 'name', label: 'Navn', type: 'string', required: true },
  { name: 'role', label: 'Titel', type: 'string', required: true },
  {
    name: 'phone',
    label: 'Telefon',
    type: 'string',
    required: true,
    digitsInPairs: 8,
    phone: '+45',
  },
  {
    name: 'email',
    label: 'E-mail',
    type: 'string',
    required: true,
    pattern: [
      '^[A-Za-z0-9._%+-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\\.[A-Za-z]{2,}$',
      'Skriv en gyldig e-mailadresse',
    ],
  },
  {
    name: 'street',
    label: 'Vej og nummer',
    type: 'string',
    required: true,
  },
  { name: 'city', label: 'Postnummer og by', type: 'string', required: true },
  {
    name: 'cvr',
    label: 'CVR-nummer',
    type: 'string',
    hint: 'Vises nederst på hver side.',
    pattern: ['^\\d{8}$', 'Et CVR-nummer har otte cifre'],
  },
];

// The social media (src/data/social.json, a part of its own under "Virksomheden", company.ts): the site's profiles, and
// which share buttons a post shows. A switch that is not in the file is on (company.ts gives the form that default).
// A profile address: empty, or one that begins with https://.
const httpsAddress: [string, string] = ['^$|^https://\\S+$', 'Skriv en adresse, der begynder med https://'];

export const socialFields: Field[] = [
  {
    name: 'facebook',
    label: 'Facebook',
    type: 'string',
    hint: 'Adressen på sitets profil. Vises i Googles data om virksomheden.',
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
  { name: 'shareFacebook', label: 'Del på Facebook', type: 'boolean' },
  { name: 'shareX', label: 'Del på X', type: 'boolean' },
  { name: 'shareLinkedin', label: 'Del på LinkedIn', type: 'boolean' },
  { name: 'sharePinterest', label: 'Del på Pinterest', type: 'boolean', hint: 'Vises kun, når indlægget har et billede.' },
  { name: 'shareCopyLink', label: 'Kopiér link', type: 'boolean' },
];

// The bank details, a part of its own under "Betaling" (company.ts, src/data/payment.json).
export const bankFields: Field[] = [
  { name: 'bank', label: 'Bank', type: 'string', required: true },
  { name: 'reg', label: 'Reg.nr.', type: 'string', required: true },
  { name: 'account', label: 'Kontonummer', type: 'string', required: true },
];

// The standard pages (src/data/standard-pages.json, config.standardPages, packages/editor/defaults/standardPages.ts), each a field that
// picks a page, as rows of a list (Part.rows): the front page, shown at / (packages/editor/site/home.ts), the blog page, shown at
// /blog/, the page shown for an address that does not exist (packages/editor/site/standardPages.ts) and the contact page under
// "Udseende" › "Standardsider" (appearance in editor.ts), and the privacy policy and the cookie policy under "Privatliv" ›
// "Privatlivssider" (privacy.ts). Different pages, but the cookie policy may be the privacy policy (keptBy in rules.ts).
const standardPageFields: Field[] = [
  {
    name: 'front',
    label: 'Forside',
    type: 'relation',
    to: 'standardPages',
    required: true,
    hint: 'Siden vises på forsiden, og dens egen adresse sender videre dertil.',
  },
  {
    name: 'blog',
    label: 'Blogside',
    type: 'relation',
    to: 'standardPages',
    required: true,
    hint: 'Siden vises på /blog/, og dens egen adresse sender videre dertil.',
  },
  {
    name: 'notFound',
    label: '404-side',
    type: 'relation',
    to: 'standardPages',
    required: true,
    hint: 'Siden vises, når en adresse ikke findes.',
  },
  {
    name: 'contact',
    label: 'Kontaktside',
    type: 'relation',
    to: 'standardPages',
    required: true,
    hint: 'Linket til vejvisningen går hertil.',
  },
  {
    name: 'privacy',
    label: 'Privatlivspolitik',
    type: 'relation',
    to: 'standardPages',
    required: true,
    hint: 'Siden, der fortæller, hvilke oplysninger der gemmes, og hvorfor.',
  },
  {
    name: 'cookies',
    label: 'Cookiepolitik',
    type: 'relation',
    to: 'standardPages',
    required: true,
    hint: 'Cookiebannerets link går hertil; det må være privatlivspolitikken.',
  },
];

/** The fields of the standard pages by their keys, in that order. */
export const standardPageFieldsOf = (...keys: string[]) => keys.map((key) => standardPageFields.find((f) => f.name === key)!);

/** The "Book en tid" box's own heading and text, in a page's text; empty,
 * the shared ones ("Blokke" › "Book en tid", booking.json). */
export const bookingTexts: Field[] = [
  {
    name: 'heading',
    label: 'Overskrift',
    type: 'string',
    hint: 'Hvis feltet er tomt, bruges standardteksten.',
    placeholder: (site) => site.booking.heading,
  },
  {
    name: 'text',
    label: 'Tekst',
    type: 'text',
    hint: 'Hvis feltet er tomt, bruges standardteksten.',
    placeholder: (site) => site.booking.text,
  },
];

// The icons the owner picks from on the site's own fields (the same as the standard blocks', iconNames in
// packages/editor/src/icon.tsx, which draws them).
export const icons = [
  ['Diplom', 'certificate'],
  ['Hjerte', 'heart'],
  ['Hånd med hjerte', 'hand-heart'],
  ['Tre personer', 'users-three'],
  ['To personer', 'users'],
  ['Studenterhue', 'graduation-cap'],
  ['Håndtryk', 'handshake'],
  ['Bog', 'book-open'],
  ['Bog med tekst', 'book-open-text'],
  ['Medalje', 'medal'],
  ['Samtale', 'chats'],
  ['Lotusblomst', 'flower-lotus'],
  ['Blad', 'leaf'],
  ['Pære', 'lightbulb'],
  ['Tog', 'train'],
  ['Bus', 'bus'],
  ['Cykel', 'bicycle'],
  ['Bil', 'car'],
  ['Dør', 'door-open'],
  ['Videokamera', 'video-camera'],
  ['Redningskrans', 'lifebuoy'],
  ['Telefon', 'phone'],
  ['Ur', 'clock'],
  ['Kortnål', 'map-pin'],
  ['Kaffe', 'coffee'],
  ['Kørestol', 'wheelchair'],
  ['Info', 'info'],
  ['Brev', 'envelope-simple'],
].map(([label, value]) => ({ label, value }));

// A link in the menu: any page, the front page and the blog too, stored by its address.
const menuHref: Field = { name: 'href', label: 'Side', type: 'relation', to: 'pages', fixed: true, required: true };

export const collections: Collection[] = [
  {
    kind: 'markdown',
    id: 'blog',
    create: 'Nyt blogindlæg',
    label: 'Blogindlæg',
    singular: 'blogindlæg',
    folder: 'src/content/blog',
    deletable: true,
    fields: [
      ...status('Vises ikke på bloggen eller i Google, men kan åbnes på sin adresse.'),
      { name: 'title', label: 'Titel', type: 'string', required: true },
      { name: 'date', label: 'Dato', type: 'date', required: true },
      { name: 'path', label: 'Adresse', type: 'string', address: 'post' },
      { name: 'description', label: 'Kort beskrivelse', type: 'text' },
      {
        name: 'categories',
        label: 'Tags',
        type: 'relation',
        to: 'categories',
        multiple: true,
        add: 'Tilføj tag',
        edit: { to: 'ny/kategorier', text: 'Opret et tag' },
      },
      { name: 'image', label: 'Billede øverst', type: 'image' },
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
    create: 'Ny side',
    label: 'Sider',
    singular: 'side',
    folder: 'src/content/pages',
    fields: [
      ...status('Vises ikke i Google, men kan åbnes på sin adresse.'),
      { name: 'title', label: 'Titel', type: 'string', required: true },
      { name: 'path', label: 'Adresse', type: 'string', address: 'page' },
      { name: 'description', label: 'Kort beskrivelse', type: 'text' },
      {
        name: 'categories',
        label: 'Tags',
        type: 'relation',
        to: 'categories',
        multiple: true,
        add: 'Tilføj tag',
        edit: { to: 'ny/kategorier', text: 'Opret et tag' },
        hint: 'Vises ikke på hjemmesiden.',
      },
      {
        name: 'wide',
        label: 'Hele bredden',
        type: 'boolean',
        layout: true,
        hint: 'Siden fylder hele bredden uden spalten ved siden af teksten.',
      },
      {
        name: 'side',
        label: 'Sidekolonne',
        type: 'boolean',
        toggle: ['Til', 'Fra'],
        // Without the key the column is on; only "Fra" is written (side: false).
        default: true,
        missing: true,
        layout: true,
        hint: 'Blokken ved siden af teksten vises på siden. Den vælges under Udseende › Sidekolonne.',
      },
      {
        name: 'review',
        label: 'Til gennemsyn',
        type: 'text',
        hint: 'Vises kun på sider under /ny/.',
      },
      ...seo,
      ...shareTexts,
      ...keywords,
      canonical,
      noindex,
    ],
    blocks: true,
    // One "Book en tid" a page (at the very end it goes across the page, PageLayout.astro). A new page
    // starts empty.
    template: { max: { booking: 1 } },
  },
  {
    kind: 'folder',
    id: 'kategorier',
    create: 'Nyt tag',
    label: 'Tags',
    singular: 'tag',
    folder: 'src/data/categories',
    deletable: true,
    slugFrom: 'name',
    summary: (d) => String(d.name ?? ''),
    fields: [
      { name: 'name', label: 'Navn', type: 'string', required: true },
      ...seo,
      {
        name: 'blogCategory',
        label: 'Blogkategori',
        type: 'boolean',
        toggle: ['Vis', 'Skjul'],
        default: true,
        hint: 'Vis tagget på bloggen med sin egen side.',
      },
    ],
  },
  {
    // "Promovering": what is laid over the pages to get visitors to book, call or sign up, in
    // src/data/popups/<slug>.json, read by packages/editor/site/popups.ts, on every page or those picked under "Sider".
    // The pop-ups are shown by packages/editor/theme/components/Popup.astro; a kind an app adds without a part
    // in the pop-up (src/apps/<app>/popups/View.tsx) shows itself (the app Calendly's booking sheet,
    // morpheme-apps/apps/calendly/, when a button opens it).
    kind: 'folder',
    id: 'popups',
    create: 'Ny promovering',
    label: 'Promovering',
    singular: 'promovering',
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
    // What a button ("Knapper": "Åbn promovering") can open of one: a pop-up itself, the action bar nothing (opens.ts).
    opens: { standard: { label: 'Pop op-vindue' } },
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
          { label: 'Pop op-vindue', value: 'standard', icon: AppWindow, hint: 'Med billede, tekst og en knap.' },
          {
            label: 'Handlingslinje',
            value: 'bookingbar',
            icon: SquareHalfBottom,
            hint: 'Knapper eller tekst nederst på skærmen på en telefon.',
          },
        ],
      },
      {
        name: 'enabled',
        label: 'Aktiveret',
        type: 'boolean',
        toggle: ['Til', 'Fra'],
        default: true,
      },
      // At the top of the box, to its edges in 3:2, as on the cards with a picture ("Kort").
      { name: 'image', label: 'Billede', type: 'image', hint: 'Vises øverst, skåret til 3:2.' },
      { name: 'heading', label: 'Overskrift', type: 'string', required: true, max: 80 },
      { name: 'text', label: 'Tekst', type: 'text' },
      // Where it is shown, for every kind: on every page, on those picked (without `where`, from
      // before, those picked), or on the blog posts with one of the tags picked and those tags' pages.
      {
        name: 'where',
        label: 'Vises på',
        type: 'select',
        default: 'some',
        options: [
          { label: 'Alle sider', value: 'all' },
          { label: 'Udvalgte sider', value: 'some' },
          { label: 'Blogindlæg med tags', value: 'tags' },
        ],
      },
      {
        name: 'pages',
        label: 'Sider',
        type: 'relation',
        to: 'pages',
        fixed: true,
        multiple: true,
        required: true,
        add: 'Tilføj side',
        hint: 'Vises kun på disse sider.',
        only: { field: 'where', is: ['some'] },
      },
      {
        name: 'tags',
        label: 'Tags',
        type: 'relation',
        to: 'categories',
        multiple: true,
        required: true,
        add: 'Tilføj tag',
        hint: 'Vises på blogindlæg med et af disse tags og på taggenes sider.',
        only: { field: 'where', is: ['tags'] },
      },
      // When it opens (packages/editor/theme/components/Popup.astro): after `delay`, at `scroll` % down the page, or as the
      // visitor is about to leave it.
      {
        name: 'trigger',
        label: 'Vises',
        type: 'select',
        required: true,
        default: 'time',
        hint: 'Hver besøgende ser det, til de lukker det.',
        options: [
          { label: 'Efter en tid', value: 'time' },
          { label: 'Når siden er rullet ned', value: 'scroll' },
          {
            label: 'Når den besøgende vil forlade siden',
            value: 'exit',
            hint: 'På en telefon: når den besøgende ruller hurtigt op.',
          },
        ],
      },
      {
        name: 'delay',
        label: 'Vises efter',
        type: 'select',
        required: true,
        default: '5',
        only: { field: 'trigger', is: ['time'] },
        options: [
          { label: 'Med det samme', value: '0' },
          { label: '5 sekunder', value: '5' },
          { label: '10 sekunder', value: '10' },
          { label: '30 sekunder', value: '30' },
        ],
      },
      {
        name: 'scroll',
        label: 'Rullet ned',
        type: 'select',
        required: true,
        default: '25',
        options: [
          { label: '25 % af siden', value: '25' },
          { label: '50 % af siden', value: '50' },
          { label: '75 % af siden', value: '75' },
          { label: 'Hele siden', value: '100' },
        ],
        only: { field: 'trigger', is: ['scroll'] },
      },
      {
        name: 'button',
        label: 'Knap',
        type: 'select',
        required: true,
        default: 'booking',
        options: [
          { label: 'Book en tid', value: 'booking' },
          { label: 'Ring', value: 'phone' },
          { label: 'En side', value: 'page' },
          { label: 'Download PDF', value: 'file' },
          { label: 'Ingen knap', value: 'none' },
        ],
      },
      {
        name: 'label',
        label: 'Knaptekst',
        type: 'string',
        max: 30,
        hint: 'Hvis feltet er tomt, bruges standardteksten.',
        only: { field: 'button', is: ['booking', 'phone', 'page', 'file'] },
      },
      // A PDF from "Filer" (public/filer/), by its address (/filer/<name>.pdf).
      {
        name: 'file',
        label: 'PDF',
        type: 'relation',
        to: 'files',
        required: true,
        edit: { to: 'filer', text: 'Upload en PDF' },
        only: { field: 'button', is: ['file'] },
      },
      {
        name: 'href',
        label: 'Side (knap)',
        type: 'relation',
        to: 'pages',
        fixed: true,
        required: true,
        only: { field: 'button', is: ['page'] },
      },
      // The action bar's one or two items, each a button or a text (`type`; without one, a button, as before there were
      // texts). The first button is filled, a second with a line. Each button goes where a button of "Knapper" can
      // (Button in packages/editor/src/standard/buttons/fields.ts, the targets of `buttonTargets` in config.ts and a
      // page): "Book en tid" (what books on the page, an app's booking sheet, else the booking page), "Ring", "Åbn
      // promovering" (one shown on every page: a pop-up, or an app's booking sheet) or a page. A text is a list row of
      // two lines, its heading over its text, beside the button (ActionBar.astro).
      {
        name: 'buttons',
        label: 'Knapper og tekst',
        singular: 'punkt',
        type: 'list',
        summary: ['label', 'heading'],
        required: true,
        maxItems: 2,
        hint: 'Højst to punkter.',
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
              { label: 'Knap', value: 'button' },
              { label: 'Tekst', value: 'text' },
            ],
          },
          {
            name: 'heading',
            label: 'Overskrift',
            type: 'string',
            required: true,
            max: 30,
            only: { field: 'type', is: ['text'] },
          },
          {
            name: 'text',
            label: 'Tekst',
            type: 'string',
            max: 40,
            hint: 'Står under overskriften.',
            only: { field: 'type', is: ['text'] },
          },
          {
            name: 'label',
            label: 'Knaptekst',
            type: 'string',
            max: 30,
            hint: 'Hvis feltet er tomt, bruges standardteksten eller sidens navn.',
            only: { field: 'type', is: ['button'] },
          },
          {
            name: 'to',
            label: 'Fører til',
            type: 'select',
            required: true,
            default: 'booking',
            only: { field: 'type', is: ['button'] },
            options: [
              { label: 'Book en tid', value: 'booking' },
              { label: 'Ring', value: 'phone' },
              { label: 'Åbn promovering', value: 'promotion', onPage: 'promotions' },
              { label: 'En side', value: 'page' },
            ],
          },
          {
            name: 'open',
            label: 'Promovering',
            type: 'relation',
            to: 'promotions',
            onPage: true,
            required: true,
            only: { field: 'to', is: ['promotion'] },
          },
          {
            name: 'href',
            label: 'Side',
            type: 'relation',
            to: 'pages',
            fixed: true,
            required: true,
            only: { field: 'to', is: ['page'] },
          },
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
        label: 'Footeren',
        view: '/',
        fields: [
          { name: 'text', label: 'Tekst (under navnet)', type: 'text', required: true },
          {
            name: 'contactHeading',
            label: 'Overskrift (kontakt)',
            type: 'string',
            required: true,
            edit: { to: 'virksomheden/kontakt', text: 'Rediger telefon, e-mail og adresse' },
          },
          { name: 'linksHeading', label: 'Overskrift (links)', type: 'string', required: true },
          {
            name: 'links',
            label: 'Links',
            singular: 'link',
            type: 'list',
            summary: 'label',
            required: true,
            fields: [{ name: 'label', label: 'Tekst', type: 'string', required: true }, menuHref],
          },
        ],
      },
    ],
  },
  {
    kind: 'files',
    id: 'menu',
    label: 'Hovedmenu',
    singular: 'hovedmenu',
    files: [
      // src/data/menu.json, read by packages/editor/site/site.ts (nav, navShown) for the header (Header.astro, MobileMenu.tsx).
      {
        file: 'src/data/menu.json',
        label: 'Hovedmenuen',
        view: '/',
        fields: [
          {
            name: 'enabled',
            label: 'Aktiveret',
            type: 'boolean',
            toggle: ['Til', 'Fra'],
            default: true,
            hint: 'Når menuen er fra, har headeren hverken menu eller menuknap.',
          },
        ],
        root: {
          name: 'items',
          label: 'Menupunkter',
          singular: 'menupunkt',
          type: 'list',
          summary: 'label',
          fields: [
            { name: 'label', label: 'Tekst', type: 'string', required: true },
            menuHref,
            {
              name: 'children',
              label: 'Undermenu',
              singular: 'punkt',
              type: 'list',
              summary: 'label',
              fields: [{ name: 'label', label: 'Tekst', type: 'string', required: true }, menuHref],
            },
          ],
        },
      },
    ],
  },
  {
    kind: 'files',
    id: 'mobilmenu',
    label: 'Mobilmenu',
    singular: 'mobilmenu',
    files: [
      // src/data/mobile-menu.json, read by packages/editor/site/site.ts (mobileNav) for the bar under the header (MobileNav.astro).
      {
        file: 'src/data/mobile-menu.json',
        label: 'Mobilmenuen',
        view: '/',
        fields: [
          {
            name: 'enabled',
            label: 'Aktiveret',
            type: 'boolean',
            toggle: ['Til', 'Fra'],
            default: false,
            hint: 'Punkterne står på en linje under headeren på en telefon og kan skubbes til siden.',
          },
        ],
        root: {
          name: 'items',
          label: 'Menupunkter',
          singular: 'menupunkt',
          type: 'list',
          summary: 'label',
          fields: [{ name: 'label', label: 'Tekst', type: 'string', required: true }, menuHref],
        },
      },
    ],
  },
];
