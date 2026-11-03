// The visitor's yes or no to each category of cookies in the cookie banner (@morpheme/cms/lib/cookieCategories.mjs:
// preferences, statistics, marketing, targeting; necessary ones are not asked about), and the site's events. The apps that measure
// (Google Analytics, Google Ads, Google Tag Manager: src/apps/) load their tags with afterConsent, only after a yes to
// their category (Google consent mode, "basic": the Google tag is not loaded at all until the visitor says yes, and it
// is told which categories the visitor said yes to), and send the events on. Where events are sent from:
// `tracking.hosts` in packages/editor/site/tracking.ts.
//
// Events (GA4 event names; mark them as key events in GA4 and import them in Google Ads):
// - book_appointment: a time was booked (the app Calendly: in the booking sheet or on the booking page)
// - open_booking:     the booking calendar was opened
// - click_to_call:    a phone link was tapped
// - email_click:      an e-mail link was clicked
import { CONSENT_CATEGORIES, isConsentCategory, type ConsentCategory } from '@morpheme/cms/lib/cookieCategories.mjs';
import { cookieList } from './cookieList';
import { tracking } from './tracking';
import { site } from './site';

/** The visitor's yes (true) or no to each category the cookie banner asked about. */
export type Consent = Partial<Record<ConsentCategory, boolean>>;
const KEY = 'consent';
const MAX_AGE = 365 * 24 * 60 * 60 * 1000; // ask again after a year

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const params = new URLSearchParams(location.search);
try {
  if (params.get('tracking') === 'test') sessionStorage.setItem('tracking-test', '1');
} catch {}
/** Whether events are sent from another address than the site's own (?tracking=test): GA4's debug mode. */
export const testing = (() => {
  try {
    return sessionStorage.getItem('tracking-test') === '1';
  } catch {
    return false;
  }
})();
const live = tracking.hosts.includes(location.hostname) || testing;

/** The visitor's answer in the cookie banner, within the last year; undefined without one (or with one from before
 * the banner asked about each category, which is asked again). */
export function storedConsent(): Consent | undefined {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (!saved || typeof saved.choices !== 'object' || !saved.choices || Date.now() - saved.at >= MAX_AGE) return undefined;
    return Object.fromEntries(
      Object.entries(saved.choices).filter(([category, yes]) => isConsentCategory(category) && typeof yes === 'boolean'),
    ) as Consent;
  } catch {
    return undefined;
  }
}

const granted = (category: ConsentCategory) => storedConsent()?.[category] === true;

// Google's consent mode: what its tags may store, by the visitor's answer (statistics: Analytics; marketing: Ads). A yes
// to marketing is a yes to measuring whether the ads work; personalised ads (remarketing) only after a yes to targeted
// ads, which the banner asks about only when an app is set to use them (`cookies` in its index.ts), so a site that does
// not use them never allows them. Targeted ads store what ads do (ad_storage, ad_user_data) too.
function googleSignals() {
  const yes = (...categories: ConsentCategory[]) => (categories.some(granted) ? 'granted' : 'denied');
  return {
    analytics_storage: yes('statistics'),
    ad_storage: yes('marketing', 'targeting'),
    ad_user_data: yes('marketing', 'targeting'),
    ad_personalization: yes('targeting'),
  };
}

// Google signals (Analytics data joined with Google accounts, for ads and demographics) and ad personalisation in any
// tag, likewise only after a yes to targeted ads, whatever the accounts' own settings say.
function googleSettings() {
  window.gtag('set', 'allow_google_signals', granted('targeting'));
  window.gtag('set', 'allow_ad_personalization_signals', granted('targeting'));
}

/** Google's data layer with the visitor's answer in consent mode, for a tag of Google's (googleTag, Google Tag
 * Manager's container, src/apps/gtm/), set up once, before the first tag loads; a new answer updates it (choose). */
export function googleConsent() {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === 'function') return;
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };
  window.gtag('consent', 'default', googleSignals());
  googleSettings();
  window.gtag('js', new Date());
}

let tagged = false;

/** The Google tag (gtag.js) with this ID (Google Analytics' G-…, Google Ads' AW-…), for the apps that measure with it
 * (src/apps/google-analytics/, src/apps/google-ads/), in afterConsent: loaded once for all of them, each ID configured. */
export function googleTag(id: string, config: Record<string, unknown> = {}) {
  googleConsent();
  window.gtag('config', id, config);
  if (tagged) return;
  tagged = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
}

// The cookies of each category on the site's own address, to be removed after a no to it: those of the cookie list
// ("Lister" › "Cookies", `*` for the rest of a name), and the others Google's tag may set (GA4: _ga, _ga_<id>, and
// _gid and _gat from older tags; Ads: _gcl_au and the other _gcl_ ones).
const pattern = (name: string) => new RegExp(`^${name.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
const COOKIES: Record<ConsentCategory, RegExp[]> = {
  preferences: [],
  statistics: [/^(_ga(_.+)?|_gid|_gat(_.+)?)$/],
  marketing: [/^_gcl_.+$/],
  targeting: [],
};
for (const c of cookieList) if (isConsentCategory(c.category)) COOKIES[c.category].push(pattern(c.name));

// Each one is removed on the hostname and on every parent domain (Google's are set on example.dk for
// www.example.dk).
function removeCookies(categories: ConsentCategory[]) {
  const patterns = categories.flatMap((category) => COOKIES[category]);
  const names = document.cookie
    .split(';')
    .map((c) => c.split('=')[0].trim())
    .filter((name) => patterns.some((p) => p.test(name)));
  if (!names.length) return;
  const labels = location.hostname.split('.');
  const domains = ['', ...labels.slice(0, -1).map((_, i) => `; domain=.${labels.slice(i).join('.')}`)];
  for (const name of names)
    for (const domain of domains) document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${domain}`;
}

/** The random id of this browser's answers in the consent log (packages/editor/worker/consent.js), shown in the cookie banner so the
 * visitor can point to their own; null before the first answer. */
export function consentId(): string | null {
  try {
    const id = JSON.parse(localStorage.getItem(KEY) ?? 'null')?.id;
    return typeof id === 'string' ? id : null;
  } catch {
    return null;
  }
}

/** Saves the visitor's answer (a yes or no to each category the banner asks about), in the browser and in the consent
 * log, starts what waited for a yes and removes the cookies of each category said no to. A no to all the categories of
 * something already started on this page reloads it, so it stops. */
export function choose(consent: Consent) {
  const id = consentId() ?? crypto.randomUUID();
  try {
    localStorage.setItem(KEY, JSON.stringify({ choices: consent, at: Date.now(), id }));
  } catch {}
  logConsent(id, consent);
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', googleSignals());
    googleSettings();
  }
  removeCookies(CONSENT_CATEGORIES.filter((category) => !granted(category)));
  if (started.some((categories) => !categories.some(granted))) return location.reload();
  for (const wait of waiting.splice(0)) afterConsent(wait.categories, wait.run);
}

// The answer to the consent log on the site's Worker (/api/consent), also when the page reloads right after
// (keepalive). Not the answers of a test (?tracking=test: the cookie scan's visitors, src/apps/cookiescanner/).
function logConsent(id: string, consent: Consent) {
  if (testing) return;
  fetch('/api/consent', { method: 'POST', keepalive: true, body: JSON.stringify({ id, choices: consent }) }).catch(() => {});
}

export function track(name: string, data: Record<string, unknown> = {}) {
  if (!CONSENT_CATEGORIES.some(granted)) return;
  if (!live) return console.info('[tracking]', name, data);
  // The apps that measure send it on (Google Analytics, Google Ads, Google Tag Manager: src/apps/).
  dispatchEvent(new CustomEvent('tracking', { detail: { name, data } }));
}

// What the apps start after a yes (afterConsent), waiting for one; and the categories of each started on this page.
const waiting: { categories: ConsentCategory[]; run: () => void }[] = [];
const started: ConsentCategory[][] = [];

let told = false;

function start(categories: ConsentCategory[], run: () => void) {
  if (!live) {
    if (!told)
      console.info(
        `[tracking] Ikke på ${tracking.hosts[0]}: tags hentes ikke, og events logges kun her. Tilføj ?tracking=test for at sende dem.`,
      );
    told = true;
    return;
  }
  started.push(categories);
  run();
}

/** The categories an app's tag waits for, as its slot writes them on its <meta> (data-consent, from `cookies` in its
 * index.ts). */
export const consentOf = (meta: HTMLElement | null) => (meta?.dataset.consent ?? '').split(' ').filter(isConsentCategory);

/** Runs `run` once the visitor has said yes to one of `categories` in the cookie banner (now, if they already have),
 * on the site's own address (`hosts`, or with ?tracking=test): for an app that loads something that sets cookies
 * (`cookies` in its index.ts, e.g. Google Analytics, src/apps/google-analytics/). A no to all of them after a yes
 * reloads the page, so it stops. */
export function afterConsent(categories: ConsentCategory[], run: () => void) {
  if (categories.some(granted)) start(categories, run);
  else waiting.push({ categories, run });
}

// The cookies of each category the visitor has not said yes to, also any left from before (a yes earlier).
removeCookies(CONSENT_CATEGORIES.filter((category) => !granted(category)));

// A time was booked: an app that books says so with the event "booking:done" on the window, with how
// (`method`, e.g. "calendly": src/apps/calendly/).
addEventListener('booking:done', (e) => track('book_appointment', { method: (e as CustomEvent).detail?.method }));

document.addEventListener('click', (e) => {
  const link = (e.target as Element | null)?.closest?.('a');
  const href = link?.getAttribute('href') ?? '';
  if (href.startsWith('tel:')) track('click_to_call', { link_url: href });
  else if (href.startsWith('mailto:')) track('email_click', { link_url: href });
  else if (href === site.bookingPath) track('open_booking', { page: location.pathname });
});
