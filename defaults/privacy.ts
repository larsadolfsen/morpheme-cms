// "Privatliv": what the site asks and tells its visitors about their data, as screens of their own (CompanyForm.tsx),
// at #privatliv/<id>, and the cookie list's row: the cookie banner (src/data/cookies.json, read by packages/editor/theme/components/CookieConsent.astro),
// "Privatlivssider", which pages are the privacy policy and the cookie policy, as a list like "Standardsider" (in the
// same file, config.standardPages; standardPages.ts), and "Samtykker", the visitors' answers in the banner.
import { Cookie, FileText, ListChecks } from '@phosphor-icons/react';
import type { CookieCategory } from '../lib/cookieCategories.mjs';
import type { Field, PartScreen } from '../src/schema';
import { standardPageFieldsOf } from '@site/collections';
import { config } from '@site/config';

/** The fields of a category of cookies in the banner: its name and what it is for. */
function categoryFields(category: CookieCategory, place: string, hint = 'Vises, når en app beder om den.'): Field[] {
  return [
    { name: category, label: `Navn (${place})`, type: 'string', required: true, max: 30, hint },
    { name: `${category}Text`, label: `Tekst (${place})`, type: 'text', required: true },
  ];
}

export const privacy: PartScreen = {
  id: 'privatliv',
  label: 'Privatliv',
  parts: [
    {
      id: 'cookiebanner',
      label: 'Cookiebanner',
      icon: Cookie,
      file: 'src/data/cookies.json',
      fields: [
        {
          name: 'enabled',
          label: 'Aktiveret',
          type: 'boolean',
          toggle: ['Til', 'Fra'],
          hint: 'Når banneret er fra, er der ingen måling eller annoncer.',
          edit: { to: 'src/content/pages/privatlivspolitik.md', text: 'Rediger privatlivspolitik' },
        },
        { name: 'heading', label: 'Overskrift', type: 'string', required: true },
        { name: 'text', label: 'Tekst', type: 'text', required: true },
        {
          name: 'more',
          label: 'Linktekst',
          type: 'string',
          required: true,
          hint: 'Linket går til cookiepolitikken.',
          edit: { to: 'privatliv/privatlivssider', text: 'Rediger privatlivssider' },
        },
        { name: 'no', label: 'Knaptekst (nej)', type: 'string', required: true, max: 20 },
        { name: 'yes', label: 'Knaptekst (ja)', type: 'string', required: true, max: 20 },
        { name: 'choose', label: 'Knaptekst (avanceret)', type: 'string', required: true, max: 30 },
        { name: 'save', label: 'Knaptekst (gem valg)', type: 'string', required: true, max: 30 },
        {
          name: 'consentId',
          label: 'Tekst (samtykke-id)',
          type: 'string',
          required: true,
          max: 30,
          hint: 'Vises med den besøgendes id efter et svar.',
        },
        // Each category of cookies, with what it is for, when the banner's "Avanceret" shows them (the necessary ones
        // always, the others when an app asks about them, packages/editor/site/consent.ts).
        ...categoryFields('necessary', 'nødvendige', 'Vises altid; de kan ikke slås fra.'),
        ...categoryFields('preferences', 'præferencer'),
        ...categoryFields('statistics', 'statistik'),
        ...categoryFields('marketing', 'marketing'),
        ...categoryFields('targeting', 'målrettede annoncer'),
      ],
    },
    // The site's list of cookies ("Cookies", the standard block "Cookieliste"), a screen of its own under "Lister"'s
    // address space (#liste/<id>): only its row is here, and the list goes back to this screen (Library.tsx).
    { id: 'cookies', label: 'Cookies', icon: Cookie, href: `#liste/${config.lists.cookies}` },
    {
      id: 'privatlivssider',
      label: 'Privatlivssider',
      icon: FileText,
      file: config.standardPages,
      fields: standardPageFieldsOf('privacy', 'cookies'),
      rows: true,
    },
    // The visitors' answers in the banner, kept by the Worker (packages/editor/worker/consent.js): the editor's own screen (Consents.tsx).
    { id: 'samtykker', label: 'Samtykker', icon: ListChecks, opens: 'consents' },
  ],
};
