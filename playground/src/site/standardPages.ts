import type { Lead, Template } from '@interstellarcms/cms/src/schema';

export const frontLeads: Record<string, Lead> = {
  hero: { body: 'text', upTo: 'buttons' },
  accordion: { heading: 'heading', body: 'intro' },
  testimonials: { heading: 'heading' },
  presentation: { heading: 'heading', body: 'paragraphs', list: true },
  cards: { heading: 'heading' },
  book: { image: true },
  steps: { heading: 'heading' },
  prices: { heading: 'heading', body: 'notes', list: true },
  posts: { heading: 'heading' },
  address: { image: true, heading: 'heading', body: 'text' },
};

export type StandardPage = {
  key: string;
  label: string;
  the: string;
  at?: string | null;
  template?: Template;
  needs?: { type: string; label: string };
  sameAs?: string;
};

export const standardPages: StandardPage[] = [
  {
    key: 'front',
    label: 'Forside',
    the: 'Forsiden',
    at: '/',
    template: { locked: ['hero'], max: { hero: 1 } },
    needs: { type: 'hero', label: 'Banner' },
  },
  {
    key: 'blog',
    label: 'Blogside',
    the: 'Blogsiden',
    at: '/blog/',
    template: { required: ['posts'], max: { posts: 1 } },
    needs: { type: 'posts', label: 'Blogindlæg' },
  },
  { key: 'notFound', label: '404-side', the: '404-siden', at: null },
  { key: 'contact', label: 'Kontaktside', the: 'Kontaktsiden' },
  { key: 'privacy', label: 'Privatlivspolitik', the: 'Privatlivspolitikken' },
  { key: 'cookies', label: 'Cookiepolitik', the: 'Cookiepolitikken', sameAs: 'privacy' },
];

export function differentPages(paths: Record<string, string>): boolean {
  const own = standardPages.filter((p) => paths[p.key] && !(p.sameAs && paths[p.key] === paths[p.sameAs])).map((p) => paths[p.key]);
  return new Set(own).size === own.length;
}

export function standardPaths(text: string | undefined): Record<string, string> {
  try {
    const all = JSON.parse(text ?? '{}') as Record<string, unknown>;
    return Object.fromEntries(standardPages.flatMap((p) => (all[p.key] ? [[p.key, String(all[p.key])]] : [])));
  } catch {
    return {};
  }
}
