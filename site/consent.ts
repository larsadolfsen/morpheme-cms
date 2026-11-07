// What the cookie banner asks about: the categories of cookies (@morphemecms/cms/lib/cookieCategories.mjs) of what the
// active apps (installed, not turned off) load with their settings (`cookies` in their index.ts: Google Analytics statistics, Google Ads
// marketing, Google Tag Manager both), each a yes or no of its own; and whether the site has the banner (and
// "Cookieindstillinger" in the footer) at all: when it is switched on ("Privatliv" › "Cookiebanner",
// src/data/cookies.json) and there is something to ask about. For the theme (Base.astro, Footer.astro,
// CookieConsent.astro), which knows no app by name.
import type { AppDefinition } from '../src/apps';
import { appIdOf } from '../src/apps';
import { CONSENT_CATEGORIES, type ConsentCategory } from '../lib/cookieCategories.mjs';
import cookies from '@data/cookies.json';
import { active, settingsOf } from './apps';

// Only the apps' index.ts, without their blocks (as opens.ts).
const appFiles = import.meta.glob<{ default: AppDefinition }>('/src/apps/*/index.ts', { eager: true });

const asked = new Set(
  Object.entries(appFiles).flatMap(([path, { default: app }]) => {
    const id = appIdOf(path);
    return active.includes(id) ? (app.cookies?.(settingsOf(id, app.settings?.values)) ?? []) : [];
  }),
);

/** The categories the banner asks about, in its order. */
export const consentCategories: ConsentCategory[] = CONSENT_CATEGORIES.filter((c) => asked.has(c));

export const cookieBanner = cookies.enabled && consentCategories.length > 0;
