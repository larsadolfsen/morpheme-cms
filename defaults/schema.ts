// What the structured data (schema.org JSON-LD, packages/editor/site/schema.ts) says of a site beyond its contact
// details, when the site's src/site/schema.ts does not say more: a local business in the country of the site's
// language, without terms, an area, offers or a person behind it. Only facts that are on the site; no ratings or reviews.
import { config } from '@site/config';
import type { SiteSchema } from '../site/schema';

export const schema: SiteSchema = {
  ids: { business: 'virksomhed', person: 'person' },
  businessType: 'LocalBusiness',
  country: config.locale.split('-')[1] ?? 'DK',
  terms: {},
  areaServed: [],
  offers: null,
  person: null,
  aboutPath: config.aboutPath ?? null,
};
