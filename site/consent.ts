// What the cookie banner asks about: the categories of cookies (@morphemecms/cms/lib/cookieCategories.mjs) of what the
// active apps (installed, not turned off) load with their settings (`cookies` in their index.ts: Google Analytics statistics, Google Ads
// marketing, Google Tag Manager both), each a yes or no of its own; and whether the site has the banner (and
// "Cookie settings" in the footer) at all: when it is switched on ("Privacy" › "Cookie banner",
// src/data/cookies.json) and there is something to ask about. For the theme (Base.astro, Footer.astro,
// CookieConsent.astro), which knows no app by name.
import type { AppDefinition } from '../src/apps';
import { appIdOf } from '../lib/appId.mjs';
import { CONSENT_CATEGORIES, type ConsentCategory } from '../lib/cookieCategories.mjs';
import type { AppManifest } from '../lib/appManifest.mjs';
import { consentCategoriesOf } from '../lib/appDefinition.mjs';
import cookies from '@data/cookies.json';
import { active, settingsOf } from './apps';

// Only the apps' index.ts, without their blocks (as opens.ts).
const appFiles = import.meta.glob<{ default: AppDefinition }>('/src/apps/*/index.ts', { eager: true });

// And those of an app with an app.json (contract 4), which declares its cookies there.
const manifests = import.meta.glob<AppManifest>('/src/apps/*/app.json', { eager: true, import: 'default' });

const asked = new Set([
  ...Object.entries(appFiles).flatMap(([path, { default: app }]) => {
    const id = appIdOf(path);
    return active.includes(id) ? (app.cookies?.(settingsOf(id, app.settings?.values)) ?? []) : [];
  }),
  ...Object.entries(manifests).flatMap(([path, manifest]) => {
    const id = appIdOf(path);
    return active.includes(id) ? consentCategoriesOf(manifest, settingsOf(id)) : [];
  }),
]);

/** The categories the banner asks about, in its order. */
export const consentCategories: ConsentCategory[] = CONSENT_CATEGORIES.filter((c) => asked.has(c));

export const cookieBanner = cookies.enabled && consentCategories.length > 0;
