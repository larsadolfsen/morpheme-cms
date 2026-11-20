import { config } from '@site/config';

// A date as the site's language writes it ("12. marts 2024", "March 12, 2024").
const dateFmt = new Intl.DateTimeFormat(config.locale, { day: 'numeric', month: 'long', year: 'numeric' });

export const formatDate = (d: Date) => dateFmt.format(d);

export function readingMinutes(markdown: string | undefined) {
  const words = (markdown ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
