// An app: more for the site, as a folder of its own in src/apps/<app>/ (registry.tsx finds them), installed
// under "Settings" › "Apps" (AppList.tsx): the site's own come with it in its code; those from the app store
// (store.ts) are copied into it when they are installed, with a note of where they came from (store.json):
//   index.ts      what the editor knows about it (defineApp): its name, who made it, its icon, what it does (in a
//                 sentence, and more fully), the cookies it sets and its settings (settings.ts in the folder, with
//                 defineSettings); in the store also its version, its category and the words it is found by;
//   screenshots/  the pictures it is shown with in the store, picked to give an idea of it (`screenshots` in
//                 index.ts, packages/editor/scripts/app-screenshots.mjs), on its page;
//   texts.ts      its texts in the editor's other languages, as a block's;
//   blocks/<type>/  the blocks it adds, each a folder like a standard block's (index.tsx, viewOf.ts, load.ts,
//                 View.tsx, texts.ts, evt. shared.ts and script.ts);
//   lists in index.ts  the lists it brings (`lists`, a FolderCollection each, with its icon): under "Lists" while
//                 it is installed, and on its page; the entries are files in the site's data (src/data/), so
//                 they stay, as the rest of the content, when it is uninstalled;
//   <list>/       a kind of entry it adds to one of the site's lists (`kinds` in index.ts), e.g. popups/: a
//                 pop-up with a signup form, chosen under "+" with the list's own kinds (FolderCollection
//                 .kinds); its part (View.tsx, given its view by viewOf.ts in the editor and load.ts on the site,
//                 and script.ts for what it does in a browser) is drawn in the pop-up under its text, on the site
//                 (Popup.astro finds them) and in the editor (`part` in index.ts, kindDraw);
//   slots/head.astro, slots/body-end.astro  what it puts on every page of the site, in <head> or at the
//                 end of <body> (AppSlot.astro), while it is installed;
//   hooks/<place>.ts  how it changes something the site does itself, run by the site's build while it is installed
//                 (@morphemecms/cms/lib/hooks.ts: hooks/page-colors.ts, the colours of a page);
//   page in index.ts  what it shows on its page under its settings (AppPage), drawn with the editor's parts (ui.tsx),
//                 asking its own addresses in the Worker (`api`);
//   screens in index.ts  screens of its own under its page (#apps/<app>/<screen>, AppScreenPage), drawn as its page,
//                 which links to them (Cookiescanner's "Blocked address");
//   tabs in index.ts  tabs it adds to the site's lists (#list/<list>/<app>, after the list's own tab in the top app
//                 bar, Library.tsx List), drawn as its page (Cookiescanner's "Problems" on "Cookies");
//   notifications in index.ts  the kinds of notifications it sends, each turned off under "Account", and how it finds
//                 them (`check`, with `api`; AppNotifications);
//   worker.js, build.mjs  its part of the site's Worker (/api/<app>/…, each hour) and a step after the site is built
//                 (packages/editor/lib/apps.mjs);
//   csp.json      what it loads from elsewhere on the site (packages/editor/lib/csp.mjs).
// An app that is not installed, or turned off ("off" in the file of apps), is not offered in the editor: its blocks are not under "Insert" nor
// "Block settings", its kinds not under "+", its lists not under "Lists", its settings not on its page. What was made with it stays,
// on the pages and on the site, and can still be edited. Installed, its blocks are under its name in "Block settings". The
// apps installed are in the site's file of apps (config.apps.installed), each app's settings in a file of
// its own in config.apps.settings. The site's build reads the settings, so settings.ts imports nothing
// that needs a browser.
import type { Icon } from '@phosphor-icons/react';
import type { ComponentType, ReactNode } from 'react';
import type { BlockData } from './blocks';
import type { Field, FolderCollection, KindPart, Opens, OwnedList, PreviewVariant } from './schema';
import type { ConsentCategory } from '../lib/cookieCategories.mjs';
import type { LegacyCategory } from '../lib/storeCategories.mjs';
import type { AppCategory, AppCookie, AppNeeds, AppShot, StoreRecord } from './store';
import type { ThirdParty } from './licenseData';
import type { WidgetDefinition } from './widgets';
import { config } from '@site/config';
import { activeOf, readAppsFile } from '../lib/appsFile.mjs';

/** An app's settings, on its page once it is installed (#apps/<app>, AppList.tsx). */
export type AppSettings = {
  fields: Field[];
  /** The settings before any are saved, in the site's language. */
  values: Record<string, unknown>;
  /** Made-up settings over `values`, which its blocks and kinds are drawn with under "Parts" (exampleData in
   * examples.ts), where the site's own are never shown (MobilePay's number). */
  example?: Record<string, unknown>;
  /** The value a save of these settings sets, said in the notice after it ("CMS-version set to 0.10.0"), asked with the
   * saved values and the app's own addresses in the Worker (`api`); undefined, or a failure, says "CMS-version changed". */
  changedTo?: (values: Record<string, unknown>, props: AppPageProps) => Promise<string | undefined>;
};
export const defineSettings = (settings: AppSettings) => settings;

/** A kind of entry an app adds to one of the site's lists (its value is the app's id): its name and
 * icon where one is picked under "+", what it is, and fields of its own, shown only for it. `omit`: the
 * list's own fields it does not have (a bar at the bottom of the screen has no picture or heading); the
 * fields that depend on one of them go with it (Field.only), and they must not depend on another
 * themselves. `draw`: how one looks on the site, by the form of an entry of it (DataForm.tsx), once for each
 * of `variants` (its states, e.g. before and after a signup), under its name, with its props over the entry's; or
 * `part`, its part in the list's own drawing (FolderCollection.drawPart, kindDraw). `opens`: what a button can
 * open of one (a button's "Open promotion", the list's FolderCollection.opens), without it nothing. */
export type AppKind = {
  label: string;
  hint?: string;
  icon: Icon;
  fields?: Field[];
  omit?: string[];
  draw?: (props: Record<string, any>, data: BlockData) => ReactNode;
  /** Its part in the list's own drawing instead of a drawing of its own (a pop-up's signup form, KindPart). */
  part?: KindPart;
  variants?: PreviewVariant[];
  opens?: Opens;
};

/** How an entry of an app's kind looks on the site, beside its form and under "Parts": its own drawing, or its part in the
 * list's own drawing (`collection`: the list it is a kind of). */
export function kindDraw(kind: AppKind, collection?: { drawPart?: FolderCollection['drawPart'] }): AppKind['draw'] {
  if (kind.draw) return kind.draw;
  const { part } = kind;
  const drawPart = collection?.drawPart;
  return part && drawPart ? (props, data) => drawPart(props, data, part) : undefined;
}

/** What an app's page is given for what it shows (AppDefinition.page): `api` asks the app's own addresses in the site's
 * Worker (/api/<app>/<path>, its worker.js), signed in with GitHub as the editor is. */
export type AppPageProps = { api: (path?: string, init?: RequestInit) => Promise<Response> };

/** A screen of an app's own under its page (AppDefinition.screens): its title (in the site's language, shown with
 * siteText), and what it shows, drawn as the app's page with the editor's parts and given the same `api`. */
export type AppScreen = { title: string; page: ComponentType<AppPageProps> };

/** A tab an app adds to one of the site's lists (AppDefinition.tabs): its name (in the site's language, shown with
 * siteText) and icon in the list's top app bar, after the list's own, and what it shows, drawn as the app's page with
 * the editor's parts and given the same `api`. */
export type AppTab = { label: string; icon: Icon; page: ComponentType<AppPageProps> };

/** The notifications an app sends ("Notifications", notificationData.ts). `types`: each kind it sends, by its id, with its
 * name (in the site's language, shown with siteText), under "Account" › "Notifications", where each can be turned off; it
 * sends no other. `check`: what it has to say now, asked with its `api` when the editor opens and every 15 minutes while
 * it is open; each comes once (by its `id`). */
export type AppNotifications = {
  types: Record<string, string>;
  check: (props: AppPageProps) => Promise<AppNotification[]>;
};
/** A notification from an app: its type (one of `types`), an id it comes once by, the text (in the site's language, with
 * siteText), whether it is about something wrong, and evt. the screen it leads to (`to`: a route, as `apps/<app>`) with
 * the text of the link to it (`link`, in the site's language; without it, the app's name). */
export type AppNotification = { type: string; id: string; text: string; error?: boolean; to?: string; link?: string };

/** A list an app brings, as the site's own lists (packages/editor/defaults/collections.ts), with its icon under "Lists". */
export type AppList = OwnedList;

export type AppDefinition = {
  label: string;
  /** Who made it, under its name on its page. */
  publisher: string;
  /** Its own licence: an SPDX expression ("MIT", with its text in LICENSE in its folder), or "UNLICENSED" when all
   * rights are reserved. Under "Licenses" and on its page, also in the store. */
  license: string;
  /** The third-party work it brings (fonts, icons, code, pictures), each with its licence (ThirdParty): every package
   * its code imports that is not the editor's (npm run check:content says which are missing), or a work with its
   * licence file in its folder; [] when it brings none. Under "Licenses" and on its page, also in the store. */
  thirdParty: ThirdParty[];
  icon: Icon;
  /** What it does, in a short sentence, on its page and in the list of apps. */
  hint: string;
  /** What it does and how, more fully, on its page under "About the app": a paragraph for each blank line. */
  description?: string;
  /** The pictures it is shown with on its page (as a theme's), a few picked to give an idea of it, each with what it
   * shows and what it says under it (AppShot); taken by packages/editor/scripts/app-screenshots.mjs with made-up content only. */
  screenshots?: AppShot[];
  /** The cookies it sets, on its page under "Cookies"; without any, it sets none. What the cookie banner asks about
   * first is `cookies`. */
  cookieList?: AppCookie[];
  settings?: AppSettings;
  /** The kinds it adds to the site's lists, by the list's id (a FolderCollection with `kinds`). */
  kinds?: Record<string, AppKind>;
  /** The lists it brings ("Prices"), under "Lists" while it is installed. */
  lists?: AppList[];
  /** Its version, shown on its page: in the app store (store.ts) the one released, and a site-local app can set one too.
   * X.Y.Z ("1.2.1"): X for a major release, Y for new features, Z for fixes
   * or fitting a theme, the numbers after the one raised back to 0; without one, the page shows none. X is raised only
   * when the app itself changes something a site that has it can break on (a block, field or setting gone or changed),
   * never for a new contract on its own: which editor it runs in is its `api` (APP_API), and fitting it to a new one is
   * Z (Y with new features), since a major release is not updated to on its own. */
  version?: string;
  /** In the app store: what is new in each version, by the version ("1.1.0"), shown before it is updated to it; every
   * version after the first has one: the next after the one released, given once until it is released, with all that
   * is new since in its note (packages/editor/scripts/releases.mjs). */
  releaseNotes?: Record<string, string>;
  /** In the app store: its main category (a filter in the store) and words it is found by, besides its name and
   * what it does ("newsletter"). The category also says where its settings are: under "Settings" on the site's
   * screen with it (PartScreen.apps in partScreens: "analytics" on "Analytics"), or on a part of "Business" with it
   * (Part.apps in companyParts: "payments" on "Payment"), so they are where they are used and not on its page under
   * "Apps", which only installs it; without such a screen, on a screen of their own (#apps/<id>/settings).
   * The old ids `newsletter`, `payment` and `design` are still accepted, as deprecated aliases of `email`,
   * `payments` and `appearance` (categoryOf in lib/storeCategories.mjs). */
  category?: AppCategory | LegacyCategory;
  /** Its subcategory of `category`, if it has one (SUBCATEGORIES in lib/storeCategories.mjs lists them; none yet): one
   * that is not listed for the category is left out. */
  subcategory?: string;
  keywords?: string[];
  /** The categories of cookies (lib/cookieCategories.mjs) of what it loads that sets cookies (a tag), with these
   * settings (its saved ones over settings.ts); none when it loads nothing that does. The cookie banner asks about each
   * of them (packages/editor/site/consent.ts), and it starts only after a yes to one of them (afterConsent in
   * src/scripts/tracking.ts). */
  cookies?: (values: Record<string, unknown>) => ConsentCategory[];
  /** What it shows on its page under its settings while it is installed (Cookiescanner's last scan), drawn with the
   * editor's parts (ui.tsx), its texts with siteText. */
  page?: ComponentType<AppPageProps>;
  /** Screens of its own under its page while it is installed, by the last part of their address (#apps/<id>/<key>; not
   * "settings", the Settings tab's field pages, and not "about", the Information tab: the editor matches those
   * first, so a screen with either key is never shown), each linked to from its page. */
  screens?: Record<string, AppScreen>;
  /** Tabs it adds to the site's lists while it is installed, by the list's id, each at #list/<list>/<app>. */
  tabs?: Record<string, AppTab>;
  /** Widgets it adds to the start screen while it is installed, by their key: the full id of a widget is
   * "<appId>:<key>" ("booking:today"), and each must have a `component` (the check before the build says which has not). */
  widgets?: Record<string, WidgetDefinition>;
  notifications?: AppNotifications;
};
export const defineApp = (app: AppDefinition) => app;

/** An app with its id, the name of its folder (src/apps/<id>/), the types of the blocks it adds, what it needs of the
 * site (needsOf, from its folder), the addresses of its pictures with what each says under it, and where it came from when it was installed from the
 * app store (its store.json; the site's own have none). */
export type SiteApp = AppDefinition & {
  id: string;
  blocks: string[];
  needs: AppNeeds;
  pictures: { src: string; label: string }[];
  store?: StoreRecord;
};

/** A list with the kinds the apps add to it: each an option of its field of kinds (`kinds`, a select),
 * and its fields after the list's own, shown only for it; the list's own fields a kind leaves out (the
 * app's `omit`, or the list's own for its own kinds) are shown only for the others. All apps', installed or not, so an entry made with an app
 * stays one; only those of the apps installed, and not turned off, are offered under "+" (kindsOffered). */
export function withKinds<C extends { id: string; kind: string; fields?: Field[]; kinds?: string; omit?: Record<string, string[]> }>(
  collection: C,
  apps: SiteApp[],
): C {
  const name = collection.kinds;
  const added = apps.flatMap((a) => (a.kinds?.[collection.id] ? [{ app: a, kind: a.kinds[collection.id] }] : []));
  if (!name || !collection.fields || (!added.length && !collection.omit)) return collection;
  const all = [...(collection.fields.find((f) => f.name === name)?.options ?? []).map((o) => o.value), ...added.map(({ app }) => app.id)];
  // The kinds that have a field of the list's own: all but those that leave it out.
  const omitted = (k: string) => [...(collection.omit?.[k] ?? []), ...(added.find(({ app }) => app.id === k)?.kind.omit ?? [])];
  const having = (field: string) => all.filter((k) => !omitted(k).includes(field));
  return {
    ...collection,
    fields: [
      ...collection.fields.map((f) =>
        f.name === name
          ? {
              ...f,
              options: [
                ...(f.options ?? []),
                ...added.map(({ app, kind }) => ({ value: app.id, label: kind.label, hint: kind.hint, icon: kind.icon })),
              ],
            }
          : having(f.name).length < all.length
            ? { ...f, only: { field: name, is: having(f.name) } }
            : f,
      ),
      ...added.flatMap(({ app, kind }) => (kind.fields ?? []).map((f) => ({ ...f, only: { field: name, is: [app.id] } }))),
    ],
  };
}

/** An app's kind of a list as it is turned off under "Block settings", among the blocks turned off ("popups/mailchimp",
 * as its address under "+", #new/popups/mailchimp). */
export const kindKey = (list: string, app: string) => `${list}/${app}`;

/** The kinds a new entry of a list can be, under its "+": its own, and those of the apps installed and not turned off
 * under "Block settings" (`off`, offBlocks). */
export function kindsOffered(
  collection: { id: string; fields?: Field[]; kinds?: string },
  apps: SiteApp[],
  installed: string[],
  off: string[],
) {
  const field = collection.fields?.find((f) => f.name === collection.kinds);
  return (field?.options ?? []).filter(
    (o) => !apps.some((a) => a.id === o.value) || (installed.includes(o.value) && !off.includes(kindKey(collection.id, o.value))),
  );
}

/** The tabs the apps installed add to a list (AppDefinition.tabs), each with its app, in the order of the apps. */
export const tabsOf = (list: string, apps: SiteApp[], installed: string[]) =>
  apps.flatMap((app) => (installed.includes(app.id) && app.tabs?.[list] ? [{ app, tab: app.tabs[list] }] : []));

// The id of an app from the path of a file in its folder (lib/appId.mjs, also read by the @app/self plugin).
export { appIdOf } from '../lib/appId.mjs';

/** The file of an app's settings (config.apps.settings/<id>.json). */
export const settingsFile = (id: string) => `${config.apps.settings}/${id}.json`;

/** The site's file of apps as the files have it now: the apps installed and those turned off. */
export const appsState = (files: { path: string; text: string }[]) =>
  readAppsFile(files.find((f) => f.path === config.apps.installed)?.text);

/** The apps installed, by their ids, from the site's file of apps, also those turned off. */
export const installedApps = (files: { path: string; text: string }[]): string[] => appsState(files).installed;

/** The apps installed and not turned off, by their ids: those that run, offer their blocks and show their screens. */
export const activeApps = (files: { path: string; text: string }[]): string[] => activeOf(appsState(files));

/** Each app's settings as the files have them now, by its id, over those it starts with (`values`). */
export function appSettings(
  files: { path: string; text: string }[],
  apps: { id: string; settings?: AppSettings }[],
): Record<string, Record<string, any>> {
  return Object.fromEntries(
    apps.map((a) => {
      let saved = {};
      try {
        saved = JSON.parse(files.find((f) => f.path === settingsFile(a.id))?.text ?? '{}');
      } catch {}
      return [a.id, { ...a.settings?.values, ...saved }];
    }),
  );
}
