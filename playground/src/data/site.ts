import contact from './contact.json';
import booking from './booking.json';
import menu from './menu.json';
import blocks from './blocks.json';
import colors from './colors.json';
import { sharedTexts, type SharedTexts } from '@interstellarcms/cms/src/shared';
import { standardShared } from '@interstellarcms/cms/src/standard/sharedTexts';

const phoneIntl = `${contact.phone.trim().startsWith('+') ? '+' : '+45'}${contact.phone.replace(/\D/g, '')}`;

export const site = {
  name: contact.name,
  role: contact.role,
  description: 'Interstellar CMS - Headless and embedded Astro CMS with Material Design 3',
  phone: contact.phone,
  phoneHref: `tel:${phoneIntl}`,
  phoneIntl,
  email: contact.email,
  address: { street: contact.street, city: contact.city },
  mapsUrl: '',
  bookingPath: '/editor/',
  booking: { heading: booking.heading, text: booking.text },
  labels: { book: booking.book, call: booking.call },
  portrait: '/favicon.svg',
  portraitAlt: 'Interstellar CMS',
};

export { tracking } from './tracking';

export type NavItem = { label: string; href: string; children?: { label: string; href: string }[] };
export const nav: NavItem[] = Array.isArray(menu) ? menu : (menu as any).items ?? [];
for (const item of nav) item.children?.sort((a, b) => a.label.localeCompare(b.label, 'da'));

export const prices: any[] = [];
export const serviceGroups: any[] = [];

export const blockTexts = sharedTexts(
  { ...standardShared },
  blocks,
);
