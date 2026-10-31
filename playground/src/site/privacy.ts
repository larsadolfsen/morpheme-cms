import { Cookie, FileText, ListChecks } from '@phosphor-icons/react';
import type { CookieCategory } from '@interstellarcms/cms/lib/cookieCategories.mjs';
import type { Field, PartScreen } from '@interstellarcms/cms/src/schema';
import { standardPageFieldsOf } from './collections';
import { config } from './config';

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
        ...categoryFields('necessary', 'nødvendige', 'Vises altid; de kan ikke slås fra.'),
        ...categoryFields('preferences', 'præferencer'),
        ...categoryFields('statistics', 'statistik'),
        ...categoryFields('marketing', 'marketing'),
        ...categoryFields('targeting', 'målrettede annoncer'),
      ],
    },
    {
      id: 'privatlivssider',
      label: 'Privatlivssider',
      icon: FileText,
      file: config.standardPages,
      fields: standardPageFieldsOf('privacy', 'cookies'),
      rows: true,
    },
    { id: 'samtykker', label: 'Samtykker', icon: ListChecks, opens: 'consents' },
  ],
};
