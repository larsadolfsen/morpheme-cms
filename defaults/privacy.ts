// "Privacy": what the site asks and tells its visitors about their data, as screens of their own (CompanyForm.tsx),
// at #privacy/<id>, and the cookie list's row: the cookie banner (src/data/cookies.json, read by packages/editor/theme/components/CookieConsent.astro),
// "Privacy pages", which pages are the privacy policy and the cookie policy, as a list like "Default pages" (in the
// same file, config.standardPages; standardPages.ts), and "Consents", the visitors' answers in the banner.
import { Cookie, FileText, ListChecks } from '@phosphor-icons/react';
import type { CookieCategory } from '../lib/cookieCategories.mjs';
import type { Field, PartScreen } from '../src/schema';
import { standardPageFieldsOf } from '@site/collections';
import { config } from '@site/config';

/** The fields of a category of cookies in the banner: its name and what it is for. */
function categoryFields(category: CookieCategory, place: string, hint = 'Shown when an app asks for it.'): Field[] {
  return [
    { name: category, label: `Name (${place})`, type: 'string', required: true, max: 30, hint },
    { name: `${category}Text`, label: `Text (${place})`, type: 'text', required: true },
  ];
}

export const privacy: PartScreen = {
  id: 'privacy',
  label: 'Privacy',
  parts: [
    {
      id: 'cookiebanner',
      label: 'Cookie banner',
      icon: Cookie,
      file: 'src/data/cookies.json',
      fields: [
        {
          name: 'enabled',
          label: 'Activated',
          type: 'boolean',
          toggle: ['On', 'Off'],
          hint: 'When the banner is off, there is no analytics or ads.',
          edit: { to: 'src/content/pages/privatlivspolitik.md', text: 'Edit privacy policy' },
        },
        { name: 'heading', label: 'Heading', type: 'string', required: true },
        { name: 'text', label: 'Text', type: 'text', required: true },
        {
          name: 'more',
          label: 'Link text',
          type: 'string',
          required: true,
          hint: 'The link goes to the cookie policy.',
          edit: { to: 'privacy/privatlivssider', text: 'Edit privacy pages' },
        },
        { name: 'no', label: 'Button text (no)', type: 'string', required: true, max: 20 },
        { name: 'yes', label: 'Button text (yes)', type: 'string', required: true, max: 20 },
        { name: 'choose', label: 'Button text (advanced)', type: 'string', required: true, max: 30 },
        { name: 'save', label: 'Button text (save choice)', type: 'string', required: true, max: 30 },
        {
          name: 'consentId',
          label: 'Text (consent ID)',
          type: 'string',
          required: true,
          max: 30,
          hint: 'Shown with the visitor’s ID after an answer.',
        },
        // Each category of cookies, with what it is for, when the banner's "Advanced" shows them (the necessary ones
        // always, the others when an app asks about them, packages/editor/site/consent.ts).
        ...categoryFields('necessary', 'necessary', 'Always shown; they cannot be switched off.'),
        ...categoryFields('preferences', 'preferences'),
        ...categoryFields('statistics', 'statistics'),
        ...categoryFields('marketing', 'marketing'),
        ...categoryFields('targeting', 'targeted ads'),
      ],
    },
    // The site's list of cookies ("Cookies", the standard block "Cookie list"), a screen of its own under "Lists"'s
    // address space (#liste/<id>): only its row is here, and the list goes back to this screen (Library.tsx).
    { id: 'cookies', label: 'Cookies', icon: Cookie, href: `#liste/${config.lists.cookies}` },
    {
      id: 'privatlivssider',
      label: 'Privacy pages',
      icon: FileText,
      file: config.standardPages,
      fields: standardPageFieldsOf('privacy', 'cookies'),
      rows: true,
    },
    // The visitors' answers in the banner, kept by the Worker (packages/editor/worker/consent.js): the editor's own screen (Consents.tsx).
    { id: 'samtykker', label: 'Consents', icon: ListChecks, opens: 'consents' },
  ],
};
