// Structured data (schema.org JSON-LD) for search engines. Base.astro puts one @graph on every page:
// the business, the person behind it, the website and the page itself, plus what the page adds (a blog post, prices).
// What is said of the business and the person beyond the contact details is the site's (@site/schema).
// Only facts that are on the site; no ratings or reviews.
import { site } from './site';
import { sameAsOf } from './social.mjs';
import { siteT } from '@morphemecms/cms/src/i18n';
import { schema as facts } from '@site/schema';

/** What a site says of itself in the structured data (@site/schema). */
export type SiteSchema = {
  /** The end of the business's and the person's @id (https://<domain>/#<id>). */
  ids: { business: string; person: string };
  /** The schema.org type of the business, e.g. LocalBusiness or ProfessionalService. */
  businessType: string;
  /** The country of the address (ISO 3166, "DK"). */
  country: string;
  /** What the business has besides its contact details (priceRange, currenciesAccepted, paymentAccepted …). */
  terms: Record<string, unknown>;
  areaServed: unknown[];
  /** The @id of the business's offer catalog, as an address on the site ("/prices/#prices"), or null. */
  offers: string | null;
  /** The person behind the business (name, title and contact details are the site's), or null. */
  person: Record<string, unknown> | null;
  /** The page about the business or the person (an AboutPage), or null. */
  aboutPath: string | null;
};

const origin = site.url;
export const abs = (path: string) => new URL(path, origin).href;

export const ids = {
  business: `${origin}/#${facts.ids.business}`,
  person: `${origin}/#${facts.ids.person}`,
  website: `${origin}/#website`,
};

// Postcode and town from the address's second line ("1000 Copenhagen", contact.json).
const [, postalCode, town] = site.address.city.match(/^(\d{4})\s+(.+)$/) ?? [, undefined, site.address.city];

// The business in full: on the front page and the contact page (Base.astro). Other pages only refer to it by @id
// (businessRef), so the details live in one place.
export const business = {
  '@type': facts.businessType,
  '@id': ids.business,
  name: site.name,
  description: site.description,
  url: abs('/'),
  ...(site.portrait ? { image: abs(site.portrait) } : {}),
  logo: abs(site.logo),
  telephone: site.phoneIntl,
  email: site.email,
  ...(site.cvr ? { taxID: site.cvr } : {}),
  ...facts.terms,
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.address.street,
    ...(postalCode ? { postalCode } : {}),
    addressLocality: town,
    addressCountry: facts.country,
  },
  ...(facts.areaServed.length ? { areaServed: facts.areaServed } : {}),
  hasMap: site.mapsUrl,
  ...(facts.offers ? { hasOfferCatalog: { '@id': abs(facts.offers) } } : {}),
  ...(facts.person ? { founder: { '@id': ids.person }, employee: { '@id': ids.person } } : {}),
  ...(site.social.profiles.length ? { sameAs: sameAsOf(site.social.profiles) } : {}),
};

export const businessRef = { '@type': facts.businessType, '@id': ids.business, name: site.name, url: abs('/') };

/** The person behind the business, or null. */
export const person = facts.person && {
  '@type': 'Person',
  '@id': ids.person,
  name: site.name,
  jobTitle: site.role,
  ...(site.portrait ? { image: abs(site.portrait) } : {}),
  ...(typeof facts.person.url === 'string' ? { url: abs(facts.person.url) } : {}),
  email: site.email,
  telephone: site.phoneIntl,
  worksFor: { '@id': ids.business },
  ...Object.fromEntries(Object.entries(facts.person).filter(([key]) => key !== 'url')),
};

export const website = {
  '@type': 'WebSite',
  '@id': ids.website,
  name: site.name,
  url: abs('/'),
  inLanguage: site.locale,
  publisher: { '@id': ids.business },
};

export type Crumb = { name: string; href: string };

/** A question with its answer as HTML (a "Questions and answers" block on the page). */
export type Question = { question: string; answer: string };

/** The page itself, with breadcrumbs when the page is not the front page, and as an FAQPage too when it
 * has questions and answers. */
export function webPage({
  path,
  title,
  name,
  description,
  image,
  crumbs = [],
  questions = [],
}: {
  path: string;
  title: string;
  /** Short name of the page in the breadcrumbs (its heading). */
  name: string;
  description?: string;
  image?: string;
  crumbs?: Crumb[];
  /** The questions in the page's "Questions and answers" blocks, all of them in one FAQPage. */
  questions?: Question[];
}) {
  const url = abs(path);
  const kind = path === facts.aboutPath ? 'AboutPage' : path === site.contactPath ? 'ContactPage' : 'WebPage';
  const type = questions.length ? [kind, 'FAQPage'] : kind;
  const trail = path === '/' ? [] : [{ name: siteT.theme.frontPage, href: '/' }, ...crumbs, { name, href: path }];
  return [
    {
      '@type': type,
      '@id': `${url}#webside`,
      url,
      name: title,
      description,
      inLanguage: site.locale,
      isPartOf: { '@id': ids.website },
      about: { '@id': ids.business },
      ...(image ? { primaryImageOfPage: abs(image) } : {}),
      ...(trail.length ? { breadcrumb: { '@id': `${url}#breadcrumbs` } } : {}),
      ...(questions.length
        ? {
            mainEntity: questions.map((q) => ({
              '@type': 'Question',
              name: q.question,
              acceptedAnswer: { '@type': 'Answer', text: q.answer },
            })),
          }
        : {}),
    },
    ...(trail.length
      ? [
          {
            '@type': 'BreadcrumbList',
            '@id': `${url}#breadcrumbs`,
            itemListElement: trail.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.href) })),
          },
        ]
      : []),
  ];
}

/** A blog post (BlogPosting is a kind of Article). */
export function blogPosting({
  path,
  title,
  description,
  date,
  updated,
  image,
  categories,
}: {
  path: string;
  title: string;
  description?: string;
  date: Date;
  updated?: Date;
  image?: string;
  categories: string[];
}) {
  const url = abs(path);
  return {
    '@type': 'BlogPosting',
    '@id': `${url}#post`,
    headline: title,
    description,
    datePublished: date.toISOString(),
    dateModified: (updated ?? date).toISOString(),
    url,
    mainEntityOfPage: { '@id': `${url}#webside` },
    ...(image ? { image: abs(image) } : {}),
    author: { '@id': facts.person ? ids.person : ids.business },
    publisher: { '@id': ids.business },
    articleSection: categories,
    inLanguage: site.locale,
  };
}
