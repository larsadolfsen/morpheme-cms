// "Indstillinger" › "Apps" (#apps): the apps installed (src/apps/, apps.ts: the site's own and those from the app store,
// with one from the store not yet built as "Installeres…"), each with who made it under its name and, from the store,
// that it has a newer version, with search (by name, who made it and what it does), the order (A–Å, Å–A, kept in this
// browser) and headings by the first letter, as the lists under "Indhold" have. "Indstillinger" › "Appstore"
// (#indstillinger/appstore): all apps, those in the app store (store.ts) and the site's own, installed or not, with search (by name, what they
// do, who made them and the words they are found by), the same order and a funnel by category. An app's page
// (#apps/<app>) is the same for every app and without examples: its name, who made it, whether it is installed, its
// version (from the store) and what it does, "Installer" (or "Opdater til …"); installed, it has two tabs: "Indstillinger"
// (#apps/<app>: its settings form, saved with "Gem ændringer" in their file, config.apps.settings, also on the screen
// under "Indstillinger" with its kind, "Analytics" or "Promovering"; AppFormPage.tsx; then what it shows itself, what it
// adds (AppAdds.tsx: its blocks, the lists it brings: "Priser", each opening its list, and its kinds of the site's lists:
// a Mailchimp popup; each with its switch at the end of its row and opening a sheet with where it is used and the same
// switch, as under "Blokindstillinger", and a kind's button to a new one, while it is on), its notifications with their
// switches, and "Afinstaller", AppSettingsTab.tsx) and "Information" (#apps/<app>/om, AppInfoTab.tsx: its pictures, what
// it does more fully ("Om appen"), what it needs of the site ("Rettigheder", needsOf in store.ts: its code on every page,
// the addresses it loads from and sends forms to, its part of the Worker, a step in the build), the cookies it sets (and
// whether the cookie banner asks first), who made it (a row to their page, #apps/udvikler/<name>, with all their apps),
// and where it is used); one not installed has no tabs; installing, updating and uninstalling are each saved at once in its own commit,
// as a block turned on or off under "Blokindstillinger". The button pressed shows the loading indicator while it runs (busyAction.mjs). One of the site's own is installed or uninstalled in the site's
// file of apps; one from the store is copied into the site, or deleted from it, with it (appChanges in store.ts), and
// its page before it is installed is drawn from the store's catalog (StoreAppPage). Installed, its blocks and kinds are
// under "Blokindstillinger" (under its name), its blocks under "Indsæt" and its kinds under "+" of their list. An app in
// use (one of its blocks on a page, an entry of its kind or in its list) cannot be uninstalled, as a block on a page
// cannot be turned off; its page says where it is used, so uninstalling never changes the site.
import { useEffect, useState, type ReactNode } from 'react';
import { ArrowsDownUp, Gear, Info, PuzzlePiece, Swatches, UserCircle, type Icon } from '@phosphor-icons/react';
import Screen from './Screen';
import {
  Button,
  InputChip,
  Choice,
  EmptyNote,
  Filters,
  Group,
  LeadingIcon,
  SupportingText,
  SearchRow,
  useKept,
  ListItem,
  type TabChoice,
} from './ui';
import { pagesWith } from './BlockSettings';
import { ConflictError, type Change, type RepoFile } from './github';
import { cookieChanges, inCookieList } from './cookieList';
import type { Env } from './App';
import { ask, choose } from './ask';
import { installedApps, settingsFile, type SiteApp } from './apps';
import { AnyIcon } from './icon';
import {
  appCategories,
  appChanges,
  appFolder,
  breaking,
  changedFiles,
  notesSince,
  recordIn,
  DEVELOPER_ROUTE,
  newer,
  STORE_ROUTE,
  STORE_THEMES,
  type AppCategory,
  type AppCookie,
  type ShownApp,
  type StoreAdd,
  type StoreRecord,
} from './store';
import { apps, siteBlocks } from './registry';
import { asWritten, backFrom, collections, companyParts, partScreens } from './site';
import { byText, slugify, type Part } from './schema';
import { headed, letterOf } from './Sheet';
import { config } from '@site/editor';
import { allThemes, ThemeRow, themeInstalled, useThemeCatalog } from './ThemeStore';
import { siteT, siteText, t } from './i18n';
import { OwnerLicenses, StoreLicenseRows } from './Licenses';
import { StoreConnectNotice } from './StoreConnectNotice';
import { StoreConnectedRow } from './StoreConnectedRow';
import { connection, type StoreConnection } from './storeConnection';
import { told } from './notificationData';
import { kindAndName } from './deploy';
import AppInfoTab from './AppInfoTab';
import AppAdds from './AppAdds';
import AppFormPage from './AppFormPage';
import AppSettingsTab from './AppSettingsTab';
import { INFO_KEY } from '../lib/appRoute.mjs';
import { busyFor } from './busyAction.mjs';

export const appHref = (app: SiteApp) => `#apps/${app.id}`;

/** The screen with an app's settings, by its kind, if any: one under "Indstillinger" ("Analytics", partScreens) or a
 * part of "Virksomheden" with parts ("Betaling", companyParts); its address and its name. */
export function settingsHome(app: SiteApp): { route: string; label: string } | undefined {
  const kind = app.category;
  if (!kind) return undefined;
  const screen = partScreens.find((s) => s.apps?.includes(kind));
  if (screen) return { route: screen.id, label: screen.label };
  const company = companyParts.find((p) => p.parts && p.apps?.includes(kind));
  return company && { route: `virksomheden/${company.id}`, label: company.label };
}

/** Where an app's settings are: on the screen with its kind (#maaling/google-analytics, #virksomheden/betaling/mobilepay),
 * else on the Settings tab of its page (#apps/<id>); null without settings. */
export function settingsRoute(app: SiteApp): string | null {
  if (!app.settings) return null;
  const home = settingsHome(app);
  return home ? `${home.route}/${app.id}` : `apps/${app.id}`;
}

/** An app's settings as a part, a form of its own (CompanyForm.tsx): its fields in its file, under its name, going back
 * to the screen with its category, or to its page. */
export function appSettingsPart(app: SiteApp): Part | null {
  if (!app.settings) return null;
  const home = settingsHome(app);
  return {
    id: app.id,
    label: app.label,
    icon: app.icon,
    file: settingsFile(app.id),
    fields: app.settings.fields,
    defaults: app.settings.values,
    commit: siteT.apps.settingsOf(asWritten(app).label),
    back: home ? { href: `#${home.route}`, label: home.label } : { href: appHref(app), label: app.label },
  };
}

/** The settings of the apps installed of a screen's kinds (PartScreen.apps, or Part.apps of a part with parts), after
 * its own parts. */
export function appPartsIn(screen: { apps?: AppCategory[] }, files: RepoFile[]): Part[] {
  if (!screen.apps) return [];
  const installed = installedApps(files);
  return apps
    .filter((a) => !!a.category && screen.apps!.includes(a.category) && installed.includes(a.id))
    .flatMap((a) => appSettingsPart(a) ?? [])
    .sort((a, b) => byText(a.label, b.label));
}

/** The entries of an app's kind in a list (a Mailchimp pop-up), by their title, each opening it. */
export function entriesOf(app: SiteApp, list: string, files: RepoFile[]): { href: string; title: string }[] {
  const c = collections.find((x) => x.id === list);
  if (c?.kind !== 'folder' || !c.kinds) return [];
  return files
    .filter((f) => f.path.startsWith(`${c.folder}/`) && f.path.endsWith('.json'))
    .flatMap((f) => {
      try {
        const data = JSON.parse(f.text) as Record<string, unknown>;
        return data[c.kinds!] === app.id ? [{ href: `#${f.path}`, title: c.summary(data) || f.path }] : [];
      } catch {
        return [];
      }
    });
}

/** The lists an app brings ("Priser"), each with how many entries it has, opening it. */
export const listsOf = (app: SiteApp, files: RepoFile[]) =>
  (app.lists ?? []).map((l) => ({
    key: l.id,
    icon: l.icon,
    label: l.label,
    href: `#liste/${l.id}`,
    count: files.filter((f) => f.path.startsWith(`${l.folder}/`) && f.path.endsWith('.json')).length,
  }));

/** Where an app is in use: the pages and posts with one of its blocks (also a hidden one), the entries
 * of its kinds (a Mailchimp popup), by their title, and the lists it brings that have entries ("Priser"), each
 * with the icon of what is used there (the first of its blocks on a page) and opening it. */
export function usesOf(app: SiteApp, files: RepoFile[]): { href: string; title: string; icon: Icon }[] {
  const pages = new Map<string, { title: string; icon: Icon }>();
  for (const b of siteBlocks.filter((x) => x.app === app.id))
    for (const p of pagesWith(b.type, files)) if (!pages.has(p.path)) pages.set(p.path, { title: p.title, icon: b.icon });
  const entries = Object.entries(app.kinds ?? {}).flatMap(([list, kind]) =>
    entriesOf(app, list, files).map((e) => ({ ...e, icon: kind.icon })),
  );
  const lists = listsOf(app, files).flatMap((l) => (l.count ? [{ href: l.href, title: l.label, icon: l.icon }] : []));
  return [...[...pages].map(([path, p]) => ({ href: `#${path}`, ...p })), ...entries, ...lists];
}

/** An app's kinds of the site's lists (a pop-up), each by its own name ("Mailchimp popup", "Calendly bookingark") and
 * opening the list, with the list's id, its name for one and for more. */
export function kindsOf(app: SiteApp) {
  return Object.entries(app.kinds ?? {}).flatMap(([list, kind]) => {
    const c = collections.find((x) => x.id === list);
    return c
      ? [
          {
            key: list,
            icon: kind.icon,
            label: kind.label,
            hint: kind.hint,
            href: `#liste/${c.id}`,
            one: c.singular,
            more: c.label,
            create: c.create,
          },
        ]
      : [];
  });
}

const statusOf = (installed: boolean) => (installed ? t.apps.installed : t.apps.notInstalled);

type Sort = 'az' | 'za';
const SORTS: Sort[] = ['az', 'za'];
// The order picked last time, in this browser (the same for the apps and the store).
const SORT_KEY = 'editor-sort-apps';

/** The order of a list of apps, A–Å or Å–A, kept in this browser. */
function useSort(): [Sort, (next: Sort) => void] {
  const [sort, setSort] = useState<Sort>(() => {
    try {
      const saved = localStorage.getItem(SORT_KEY);
      if (SORTS.some((s) => s === saved)) return saved as Sort;
    } catch {}
    return 'az';
  });
  function pickSort(next: Sort) {
    setSort(next);
    try {
      localStorage.setItem(SORT_KEY, next);
    } catch {}
  }
  return [sort, pickSort];
}

const sortChoice = (sort: Sort, pickSort: (next: Sort) => void) => (
  <Choice
    title={t.library.sort}
    icon={ArrowsDownUp}
    value={sort}
    options={SORTS.map((value) => ({ value, label: t.library.sorts[value] }))}
    onChange={pickSort}
  />
);

/** The store's catalog (store.ts) for a screen: null while it is read, 'failed' when it could not be; `skip`: not read
 * (the page of one of the site's own apps). */
function useCatalog(env: Env, skip = false): ShownApp[] | null | 'failed' {
  const [catalog, setCatalog] = useState<ShownApp[] | null | 'failed'>(null);
  useEffect(() => {
    if (skip) return;
    let on = true;
    env.store.catalog().then(
      (apps) => on && setCatalog(apps),
      () => on && setCatalog('failed'),
    );
    return () => {
      on = false;
    };
  }, [skip]);
  return catalog;
}

/** Whether the site's Worker has a store key (store.ts storeConnected): null while it is not known; a catalog that could
 * not be read counts as connected (the list says it failed). */
function useStoreConnected(env: Env): boolean | null {
  const [connected, setConnected] = useState<boolean | null>(null);
  useEffect(() => {
    let on = true;
    env.store.connected().then(
      (yes) => on && setConnected(yes),
      () => on && setConnected(true),
    );
    return () => {
      on = false;
    };
  }, []);
  return connected;
}

// The apps updated while the editor is open, by their id, to their version: their page and the list say so until the
// site's build has it (and the editor reloads with it, deploy.ts keepCurrent).
const updated = new Map<string, string>();
const versionOf = (app: SiteApp) => updated.get(app.id) ?? app.store?.version ?? '';

/** The newer version of an app from the store, when the store has one. */
const updateOf = (app: SiteApp, catalog: ShownApp[] | null | 'failed') => {
  const found = app.store && Array.isArray(catalog) ? catalog.find((a) => a.id === app.id) : undefined;
  return found && newer(found.version, versionOf(app)) ? found : undefined;
};

/** An icon of the store's catalog (Phosphor's name) in front of a row. */
const storeIcon = (name?: string) => <LeadingIcon>{name && <AnyIcon name={name} size={24} />}</LeadingIcon>;

export function Apps({ env, files }: { env: Env; files: RepoFile[] }) {
  const installed = installedApps(files);
  const catalog = useCatalog(env);
  const store = Array.isArray(catalog) ? catalog : [];
  const [query, setQuery] = useKept('apps-soeg', '');
  const [sort, pickSort] = useSort();

  // The apps installed: the site's own and those from the store; and one from the store in the file of apps that the
  // site's build does not have yet, from the catalog (by its id until it is read). One that is not installed is under
  // "Appstore".
  const rows = [
    ...apps
      .filter((a) => installed.includes(a.id))
      .map((a) => ({
        id: a.id,
        label: a.label,
        publisher: a.publisher,
        hint: a.hint,
        icon: <LeadingIcon icon={a.icon} />,
        status: updateOf(a, catalog) ? t.apps.updateFound : '',
      })),
    ...installed
      .filter((id) => !apps.some((a) => a.id === id))
      .map((id) => {
        const found = store.find((a) => a.id === id);
        return {
          id,
          label: found?.label ?? id,
          publisher: found?.publisher ?? '',
          hint: found?.hint ?? '',
          icon: storeIcon(found?.icon),
          status: t.apps.pending,
        };
      }),
  ];
  // By the name, who made it and what it does.
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = rows
    .filter((a) => words.every((w) => `${a.label} ${a.publisher} ${a.hint}`.toLowerCase().includes(w)))
    .sort((a, b) => (sort === 'za' ? -1 : 1) * byText(a.label, b.label));
  // Under the first letter of their names (headed, from HEADINGS_FROM apps).
  const groups = headed(shown, (a) => letterOf(a.label));

  return (
    <Screen title={t.common.parts.apps} wide back={backFrom('apps')}>
      <SearchRow
        value={query}
        onChange={setQuery}
        label={t.common.searchIn(t.common.parts.apps)}
        sort={sortChoice(sort, pickSort)}
        className="mb-6"
      />
      {groups.length ? (
        groups.map((g) => (
          <Group key={g.key ?? 'all'} title={g.key ?? undefined}>
            {g.items.map((a) => (
              // Who made it under its name.
              <ListItem
                key={a.id}
                href={`#apps/${a.id}`}
                leading={a.icon}
                headline={a.label}
                supporting={a.publisher}
                count={a.status}
                arrow
              />
            ))}
          </Group>
        ))
      ) : (
        <p className="mb-8 px-1 text-muted">{t.common.noMatch}</p>
      )}
    </Screen>
  );
}

const backToStore = { href: `#${STORE_ROUTE}`, label: t.apps.find };

/** All apps, as "Appstore" lists them: those in the store's catalog, and the site's own (not from the store), drawn
 * from the site's code; each with all its words (for the search) and its icon. */
function allApps(catalog: ShownApp[] | null | 'failed') {
  const store = Array.isArray(catalog) ? catalog : [];
  return [
    ...store.map((a) => ({ ...a, glyph: storeIcon(a.icon) })),
    ...apps
      .filter((a) => !a.store && !store.some((s) => s.id === a.id))
      .map((a) => ({
        id: a.id,
        label: a.label,
        hint: a.hint,
        publisher: a.publisher,
        category: a.category,
        words: [a.label, a.hint, a.publisher, ...(a.keywords ?? [])].join(' ').toLowerCase(),
        glyph: <LeadingIcon icon={a.icon} />,
      })),
  ];
}

/** The address of a developer's page, by their name. */
const developerHref = (name: string) => `#${DEVELOPER_ROUTE}/${slugify(name)}`;

/** An app's row in "Appstore" and on a developer's page: its icon, its name, what it does, and whether it is installed,
 * opening its page. */
function AppRow({ app, installed }: { app: ReturnType<typeof allApps>[number]; installed: boolean }) {
  return (
    <ListItem
      href={`#apps/${app.id}`}
      leading={app.glyph}
      headline={app.label}
      supporting={app.hint}
      count={installed && t.apps.installed}
      arrow
    />
  );
}

/** A developer's page (#apps/udvikler/<name>): their name, and all their apps and themes (in the store and the site's
 * own), each opening its page. */
export function DeveloperPage({ slug, env, files }: { slug: string; env: Env; files: RepoFile[] }) {
  const installed = installedApps(files);
  const catalog = useCatalog(env);
  const themeCatalog = useThemeCatalog(env);
  const theirs = allApps(catalog)
    .filter((a) => slugify(a.publisher) === slug)
    .sort((a, b) => byText(a.label, b.label));
  const theirThemes = allThemes(themeCatalog)
    .filter((x) => slugify(x.author) === slug)
    .sort((a, b) => byText(a.name, b.name));
  const name = theirs[0]?.publisher ?? theirThemes[0]?.author;
  return (
    <Screen title={name ?? t.apps.developer} wide back={backToStore}>
      {name && (
        <div className="mb-8 flex items-center gap-3 px-4">
          <LeadingIcon icon={UserCircle} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{name}</span>
            <span className="block truncate text-sm text-muted">
              {[theirs.length && t.apps.appCount(theirs.length), theirThemes.length && t.library.themeCount(theirThemes.length)]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </span>
        </div>
      )}
      {theirs.length > 0 && (
        <Group title={t.apps.developerApps}>
          {theirs.map((a) => (
            <AppRow key={a.id} app={a} installed={installed.includes(a.id)} />
          ))}
        </Group>
      )}
      {theirThemes.length > 0 && (
        <Group title={t.common.parts.themes}>
          {theirThemes.map((x) => (
            <ThemeRow key={x.id} of={x} />
          ))}
        </Group>
      )}
      {!name &&
        (catalog === null || themeCatalog === null ? (
          <EmptyNote busy>{t.apps.loadingStore}</EmptyNote>
        ) : (
          <EmptyNote>{t.apps.noDeveloper}</EmptyNote>
        ))}
    </Screen>
  );
}

/** Who made an app or a theme, under "Udvikler", as a row to their page with all they have made. */
export function DeveloperRow({ name }: { name: string }) {
  return (
    <Group title={t.apps.developer}>
      <ListItem href={developerHref(name)} icon={UserCircle} headline={name} arrow />
    </Group>
  );
}

/** "Appstore" (#indstillinger/appstore, under "Indstillinger"): in a tab of its own each in the top app bar, all apps,
 * those in the app store and the site's own, each with what it does and whether it is installed, and all themes
 * (#indstillinger/appstore/temaer, ThemeStore.tsx), those in the store
 * and those installed, each with its version and who made it; each opening its page. With search (by name, what it
 * does, who made it and the words it is found by, in both languages), the order and the filters by category (apps)
 * and by whether it is installed, each picked one as a chip. */
export function StorePage(props: { env: Env; files: RepoFile[]; tab: 'apps' | 'themes' }) {
  // Connecting or disconnecting draws the screen again from the start, so the catalogs and the key are asked again.
  const [round, setRound] = useState(0);
  return <StoreScreen key={round} {...props} again={() => setRound((r) => r + 1)} />;
}

function StoreScreen({ env, files, tab, again }: { env: Env; files: RepoFile[]; tab: 'apps' | 'themes'; again: () => void }) {
  const installed = installedApps(files);
  const [key, setKey] = useState<StoreConnection | null>(null);
  useEffect(() => {
    connection().then(setKey, () => {});
  }, []);
  const catalog = useCatalog(env);
  const themeCatalog = useThemeCatalog(env);
  const connected = useStoreConnected(env);
  const [query, setQuery] = useKept('butik-soeg', '');
  const [sort, pickSort] = useSort();
  const [category, setCategory] = useKept<AppCategory | ''>('butik-kategori', '');
  const [state, setState] = useKept<'' | 'installed' | 'notInstalled'>('butik-status', '');
  const apps = tab === 'apps';
  const read = apps ? catalog : themeCatalog;

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const order = (a: string, b: string) => (sort === 'za' ? -1 : 1) * byText(a, b);
  const appGroups = headed(
    allApps(catalog)
      .filter((a) => words.every((w) => a.words.includes(w)))
      .filter((a) => !category || a.category === category)
      .filter((a) => !state || installed.includes(a.id) === (state === 'installed'))
      .sort((a, b) => order(a.label, b.label)),
    (a) => letterOf(a.label),
  );
  const themeGroups = headed(
    allThemes(themeCatalog)
      .filter((x) => words.every((w) => x.words.includes(w)))
      .filter((x) => !state || themeInstalled(x.id) === (state === 'installed'))
      .sort((a, b) => order(a.name, b.name)),
    (x) => letterOf(x.name),
  );
  const filters = [
    ...(apps
      ? [
          {
            title: t.apps.categoryFilter,
            value: category,
            options: [
              { value: '', label: t.apps.allCategories },
              ...appCategories.map((value) => ({ value, label: t.apps.categories[value] })),
            ],
            onChange: (v: string) => setCategory(v as AppCategory | ''),
          },
        ]
      : []),
    {
      title: t.apps.stateFilter,
      value: state,
      options: [
        { value: '', label: t.apps.allStates },
        { value: 'installed', label: t.apps.installed },
        { value: 'notInstalled', label: t.apps.notInstalled },
      ],
      onChange: (v: string) => setState(v as typeof state),
    },
  ];
  // Each filter picked, as a chip that removes it.
  const chips = [
    apps && category && { key: 'category', label: t.apps.categories[category], clear: () => setCategory('') },
    state && { key: 'state', label: t.apps[state], clear: () => setState('') },
  ].filter((c) => !!c);
  const empty = apps ? !appGroups.length : !themeGroups.length;

  return (
    <Screen
      title={t.apps.find}
      wide
      back={backFrom('appstore')}
      tabs={{
        label: t.apps.find,
        value: tab,
        options: [
          { value: 'apps', label: t.common.parts.apps, icon: PuzzlePiece },
          { value: 'themes', label: t.common.parts.themes, icon: Swatches },
        ],
        onChange: (v) => (location.hash = v === 'apps' ? STORE_ROUTE : STORE_THEMES),
      }}
    >
      <SearchRow
        value={query}
        onChange={setQuery}
        label={apps ? t.apps.searchStore : t.library.searchThemes}
        sort={sortChoice(sort, pickSort)}
        filter={<Filters title={t.library.filter} selected={chips.length > 0} groups={filters} />}
        className="mb-6"
      />
      {chips.length > 0 && (
        <div className="-mt-2 mb-6 flex flex-wrap gap-2">
          {chips.map((c) => (
            <InputChip key={c.key} removeLabel={t.library.removeFilter(c.label)} onRemove={c.clear}>
              {c.label}
            </InputChip>
          ))}
        </div>
      )}
      {/* The site's own are shown also when the store cannot be read. */}
      {connected === false ? (
        <StoreConnectNotice mayChange={key?.mayChange ?? false} onConnected={again} />
      ) : read === null || connected === null ? (
        <EmptyNote busy>{t.apps.loadingStore}</EmptyNote>
      ) : read === 'failed' ? (
        <EmptyNote>{t.apps.storeFailed}</EmptyNote>
      ) : null}
      {read === null ? null : empty ? (
        <p className="mb-8 px-1 text-muted">{t.common.noMatch}</p>
      ) : apps ? (
        appGroups.map((g) => (
          <Group key={g.key ?? 'all'} title={g.key ?? undefined}>
            {g.items.map((a) => (
              <AppRow key={a.id} app={a} installed={installed.includes(a.id)} />
            ))}
          </Group>
        ))
      ) : (
        themeGroups.map((g) => (
          <Group key={g.key ?? 'all'} title={g.key ?? undefined}>
            {g.items.map((x) => (
              <ThemeRow key={x.id} of={x} />
            ))}
          </Group>
        ))
      )}
      {key?.connected && key.by === 'button' && key.mayChange && <StoreConnectedRow site={key.site} onDisconnected={again} />}
    </Screen>
  );
}

const recordOf = (app: ShownApp): StoreRecord => ({ version: app.version, ref: app.version, files: app.files });

/** The cookies an app sets (its cookies.json among its files from the store), in the site's language; none when it
 * has no such file. */
function cookiesIn(files: { path: string; content: string | Uint8Array }[]): AppCookie[] {
  const file = files.find((f) => f.path === 'cookies.json');
  try {
    const list = file && JSON.parse(typeof file.content === 'string' ? file.content : new TextDecoder().decode(file.content));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** Saves the changes to an app's folder (appChanges) and to the cookie list (cookieChanges) in one commit, and gives
 * the editor the site's files it changed: the file of apps and the cookie list. `change`: what it changed (deploy.ts). */
async function saveApp(env: Env, message: string, change: string, changes: Change[], apps: RepoFile | undefined) {
  const oids = await env.commit(message, changes, change);
  const site = changes.filter((c) => c.path === config.apps.installed || inCookieList(c.path));
  const saved = site.flatMap((c) => (typeof c.content === 'string' ? [{ path: c.path, oid: oids[c.path], text: c.content }] : []));
  const removed = site.filter((c) => c.content === null).map((c) => c.path);
  // Only taken out of the list (an update): the file of apps, as it is, with them.
  const [first, ...more] = saved.length ? saved : apps ? [apps] : [];
  if (first) env.onSaved(first, { files: more, removed });
}

// Whether the apps were updated on their own while the editor is open (autoUpdate): once.
let autoUpdated = false;

/** Updates the apps installed from the store on their own, once while the editor is open (App.tsx): each with a newer
 * version in the store, in its own commit, with a message linking to its page, where what is new stands. One whose
 * files were changed in the site is left for "Opdater til …" on its page, which says they are written over. A version
 * with a higher first number (breaking) is not updated to: a message says it is there, once for each such version. */
export async function autoUpdate(env: Env, files: RepoFile[]) {
  if (autoUpdated) return;
  autoUpdated = true;
  const installed = installedApps(files);
  const file = files.find((f) => f.path === config.apps.installed);
  const catalog = await env.store.catalog().catch(() => [] as ShownApp[]);
  for (const app of apps.filter((a) => a.store && installed.includes(a.id))) {
    const next = catalog.find((a) => a.id === app.id);
    if (!next || !newer(next.version, versionOf(app))) continue;
    try {
      // As the site has it now (another tab, or an update the site's build does not have yet, may have come first).
      const current = await env.folder(appFolder(app.id));
      const record = recordIn(current, appFolder(app.id)) ?? app.store!;
      if (!newer(next.version, record.version)) continue;
      if (breaking(next.version, record.version)) {
        if (!told('updates', `${app.id}@${next.version}`))
          env.notify({
            text: t.apps.breakingFound(next.label, next.version),
            edit: { text: t.apps.whatsNew, to: `apps/${app.id}` },
            kind: 'updates',
          });
        continue;
      }
      if (changedFiles(app.id, record, current).length) continue;
      const wanted = { files: await env.store.files(next), record: recordOf(next) };
      const changes = [...appChanges(app.id, current, wanted, installed, file), ...cookieChanges(app.id, cookiesIn(wanted.files), files)];
      const change = t.app.changes.updated(kindAndName(t.app.changes.app, next.label), next.version);
      await saveApp(env, siteT.apps.commit.update(next.written, next.version), change, changes, file);
      updated.set(app.id, next.version);
      env.notify({
        text: t.apps.autoUpdated(next.label, next.version),
        edit: { text: t.apps.whatsNew, to: `apps/${app.id}` },
        kind: 'updates',
      });
    } catch (e) {
      // Tried again the next time the editor opens.
      console.warn(`${app.id}:`, e);
    }
  }
}

type StoreAction = 'install' | 'update' | 'uninstall';

/** Installing, updating and uninstalling an app from the store, each saved at once in its own commit: its folder
 * copied from the store, or deleted, with the site's file of apps (appChanges in store.ts). Each says true when it
 * was saved. */
function useStoreActions(env: Env, files: RepoFile[]) {
  // Which action runs, on which app; `asking` while a dialog waits for the user (busyAction.mjs shows only the pressed button).
  const [running, setRunning] = useState<{ id: string; action: StoreAction; asking: boolean } | null>(null);
  const saving = !!running;
  const installed = installedApps(files);
  const file = files.find((f) => f.path === config.apps.installed);

  async function change(
    id: string,
    action: StoreAction,
    // `kind`: the notification it is when it is saved (an update is "Apps opdateret", as one on its own).
    text: { busy: string; done: string; commit: string; change: string; kind?: 'saved' | 'updates' },
    next: () => Promise<Parameters<typeof appChanges>[2]>,
    // Whether to go on, with the app's files in the site now (an update asks, when some were changed).
    go: (current: RepoFile[]) => Promise<boolean> = async () => true,
  ): Promise<boolean> {
    setRunning({ id, action, asking: false });
    env.notify({ text: text.busy });
    try {
      const [current, wanted] = await Promise.all([env.folder(appFolder(id)), next()]);
      if (!(await go(current))) {
        env.notify(null);
        return false;
      }
      const cookies = cookieChanges(id, wanted ? cookiesIn(wanted.files) : null, files);
      await saveApp(env, text.commit, text.change, [...appChanges(id, current, wanted, installed, file), ...cookies], file);
      env.notify({ text: text.done, kind: text.kind ?? 'saved' });
      return true;
    } catch (e) {
      env.notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
      return false;
    } finally {
      setRunning(null);
    }
  }

  return {
    saving,
    busy: (id: string, action: StoreAction) => busyFor(running, id, action),
    install: (app: ShownApp) =>
      change(
        app.id,
        'install',
        {
          busy: t.apps.installing,
          done: t.apps.isInstalledSoon(app.label),
          commit: siteT.apps.commit.install(app.written),
          change: t.app.changes.installed(kindAndName(t.app.changes.app, app.label)),
        },
        async () => ({ files: await env.store.files(app), record: recordOf(app) }),
      ),
    async update(app: ShownApp, record: StoreRecord) {
      const done = await change(
        app.id,
        'update',
        {
          busy: t.apps.updating,
          done: t.apps.isUpdatedSoon(app.label, app.version),
          commit: siteT.apps.commit.update(app.written, app.version),
          change: t.app.changes.updated(kindAndName(t.app.changes.app, app.label), app.version),
          kind: 'updates',
        },
        async () => ({ files: await env.store.files(app), record: recordOf(app) }),
        async (current) => {
          env.notify(null);
          return askUpdate(
            app.label,
            record.version,
            app.version,
            notesSince(app.releaseNotes, record.version, app.version),
            changedFiles(app.id, record, current),
          );
        },
      );
      if (done) updated.set(app.id, app.version);
      return done;
    },
    uninstall: (id: string, label: string, written: string) =>
      change(
        id,
        'uninstall',
        {
          busy: t.apps.uninstalling,
          done: t.apps.isUninstalled(label),
          commit: siteT.apps.commit.uninstall(written),
          change: t.app.changes.uninstalled(kindAndName(t.app.changes.app, label)),
        },
        async () => null,
      ),
  };
}

/** Before an app or a theme is updated from `from` to `version`: what is new in it since (`notes`, its release notes),
 * that it can break something (a higher first number, breaking), and, when files in its folder were changed in the site
 * (`changed`), that they are written over. Without any of them, it is updated at once. */
export async function askUpdate(
  name: string,
  from: string,
  version: string,
  notes: { version: string; text: string }[],
  changed: string[],
) {
  const big = breaking(version, from);
  if (!notes.length && !changed.length && !big) return true;
  const answer = await choose({
    title: t.apps.askUpdate(name, version),
    notes: notes.map((n) => ({ title: t.apps.version(n.version), text: n.text })),
    text: [big && t.apps.breaking, changed.length && t.apps.overwrites].filter(Boolean).join(' '),
    choices: [{ value: 'yes', label: t.apps.updateNow }],
  });
  return !!answer;
}

/** What is new in the last versions up to the one shown (an app's release notes), the newest first, on its page. */
const newsOf = (notes: Record<string, string> | undefined, version: string) => notesSince(notes, '0', version).slice(0, 3);

/** The top of an app's page: its icon, its name, who made it, whether it is installed, its version (from the store),
 * and what it does. */
function AppHead({
  icon,
  label,
  publisher,
  status,
  version,
  hint,
}: {
  icon: ReactNode;
  label: string;
  publisher: string;
  status: string;
  version?: string;
  hint: string;
}) {
  return (
    <div className="mb-8 px-4">
      <div className="flex items-center gap-3">
        {icon}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{label}</span>
          <span className="block truncate text-sm text-muted">{t.apps.publisher(publisher)}</span>
          <span className="block truncate text-sm text-muted">{status}</span>
          {version && <span className="block truncate text-sm text-muted">{t.apps.version(version)}</span>}
        </span>
      </div>
      <p className="mt-3 text-muted">{hint}</p>
    </div>
  );
}

/** An app's pictures from the store (readScreenshots), once its entry in the catalog is read; none until then. */
function useStorePictures(env: Env, app: ShownApp | undefined) {
  const [pictures, setPictures] = useState<{ src: string; label: string }[]>([]);
  useEffect(() => {
    if (!app?.screenshots?.length) return;
    let on = true;
    let made: string[] = [];
    env.store.screenshots(app).then((found) => {
      made = found.map((x) => x.src);
      if (on) setPictures(found);
      else made.forEach((src) => URL.revokeObjectURL(src));
    });
    return () => {
      on = false;
      made.forEach((src) => URL.revokeObjectURL(src));
    };
  }, [app?.id, app?.version]);
  return pictures;
}

/** The page of an app in the store that is not installed, or installed but not yet built (#apps/<app>), from the
 * catalog: as an app's page in the site, what it adds without switches, and "Installer" (or "Afinstaller"). */
export function StoreAppPage({ id, env, files }: { id: string; env: Env; files: RepoFile[] }) {
  const catalog = useCatalog(env);
  const { saving, busy, install, uninstall } = useStoreActions(env, files);
  const pending = installedApps(files).includes(id);
  const app = Array.isArray(catalog) ? catalog.find((a) => a.id === id) : undefined;
  const pictures = useStorePictures(env, app);

  const row = (a: StoreAdd, key: string) => <ListItem key={key} leading={storeIcon(a.icon)} headline={a.label} supporting={a.hint} />;
  // Its kinds under the name of the list they are added to ("Promovering").
  const kinds = app?.adds.kinds ?? [];
  const listName = (list: string) => collections.find((c) => c.id === list)?.label ?? list;

  return (
    <Screen title={app?.label ?? (pending ? id : t.apps.find)} wide back={pending ? backToApps : backToStore}>
      {app && (
        <>
          <AppHead
            icon={storeIcon(app.icon)}
            label={app.label}
            publisher={app.publisher}
            status={pending ? t.apps.pending : t.apps.notInstalled}
            version={app.version}
            hint={app.hint}
          />
          {!pending && (
            <div className="mb-8">
              <Button disabled={saving} busy={busy(app.id, 'install')} onClick={() => install(app)}>
                {t.apps.install}
              </Button>
            </div>
          )}
          <AppInfoTab
            pictures={pictures}
            description={app.description}
            news={newsOf(app.releaseNotes, app.version)}
            needs={app.needs}
            notifies={app.notifies?.map((label) => ({ label }))}
            cookies={app.cookies ?? []}
            consent={!!app.consent}
            publisher={app.publisher}
            licenses={<StoreLicenseRows licenses={app.licenses} name={app.label} author={app.publisher} version={app.version} />}
          >
            {app.adds.blocks.length > 0 && <Group title={t.apps.blocks}>{app.adds.blocks.map((a, i) => row(a, `${i}`))}</Group>}
            {app.adds.lists.length > 0 && <Group title={t.apps.lists}>{app.adds.lists.map((a, i) => row(a, `${i}`))}</Group>}
            {[...new Set(kinds.map((k) => k.list))].map((list) => (
              <Group key={list} title={listName(list)}>
                {kinds.filter((k) => k.list === list).map((k, i) => row(k, `${i}`))}
              </Group>
            ))}
          </AppInfoTab>
        </>
      )}
      {!app &&
        (catalog === null ? (
          <EmptyNote busy>{t.apps.loadingStore}</EmptyNote>
        ) : (
          <EmptyNote>{catalog === 'failed' ? t.apps.storeFailed : t.apps.notInStore}</EmptyNote>
        ))}
      {/* Installed but not yet built, it can be uninstalled again, also without the catalog. */}
      {pending ? (
        <div>
          <Button
            kind="outlined"
            disabled={saving}
            busy={busy(id, 'uninstall')}
            onClick={async () => {
              const label = app?.label ?? id;
              if (await ask(t.apps.askUninstall(label), t.apps.uninstall)) uninstall(id, label, app?.written ?? id);
            }}
          >
            {t.apps.uninstall}
          </Button>
          <SupportingText className="mt-2">{t.apps.pendingHint}</SupportingText>
        </div>
      ) : null}
    </Screen>
  );
}

const backToApps = { href: '#apps', label: t.common.parts.apps };

type AppProps = { app: SiteApp; env: Env; files: RepoFile[] };

type AppTab = 'settings' | 'information';

/** The tabs of an installed app's page, in the top bar: Settings (#apps/<id>) and Information (#apps/<id>/om). A form
 * with unsaved changes asks first, as for every address (App.tsx). */
const tabsOf = (app: SiteApp, tab: AppTab): TabChoice<AppTab> => ({
  label: t.apps.tabs,
  value: tab,
  options: [
    { value: 'settings', label: t.apps.tabSettings, icon: Gear },
    { value: 'information', label: t.apps.tabInfo, icon: Info },
  ],
  onChange: (v) => (location.hash = v === 'settings' ? appHref(app) : `${appHref(app)}/${INFO_KEY}`),
});

/** An app's page, the same for every app: it installs the app. Installed, it has the tabs Settings (its settings form,
 * what it adds, "Afinstaller") and Information; `page`: the field of its settings whose page is open (Field.page).
 * One that is not installed has no tabs. */
export function AppPage({ app, env, files, tab, page }: AppProps & { tab: AppTab; page?: string }) {
  // One that is not installed is found under "Appstore".
  if (!installedApps(files).includes(app.id))
    return (
      <Screen title={app.label} wide back={backToStore}>
        <AppContent app={app} env={env} files={files} tab="information" />
      </Screen>
    );
  const part = appSettingsPart(app);
  const content = (fields?: ReactNode) => <AppContent app={app} env={env} files={files} tab={tab} fields={fields} />;
  // With settings, the Save bar and the question about unsaved changes (FormFrame); the form is kept on both tabs.
  return part ? (
    <AppFormPage app={app} part={part} env={env} files={files} page={page} tabs={tabsOf(app, tab)} back={backToApps}>
      {content}
    </AppFormPage>
  ) : (
    <Screen title={app.label} wide back={backToApps} tabs={tabsOf(app, tab)}>
      {content()}
    </Screen>
  );
}

/** A screen of an app's own under its page (#apps/<id>/<key>, AppDefinition.screens), while it is installed: its title,
 * back to the app's page, and what the app shows on it. */
export function AppScreenPage({ app, id, env }: { app: SiteApp; id: string; env: Env }) {
  const screen = app.screens![id];
  return (
    <Screen title={siteText(screen.title)} wide back={{ href: `#apps/${app.id}`, label: app.label }}>
      <div data-app-page={app.id}>
        <screen.page api={(path, init) => env.appApi(app.id, path, init)} />
      </div>
    </Screen>
  );
}

/** What every app's page has, in this order: its name, who made it, whether it is installed, its version (from the
 * store) and what it does; "Installer" (or, from the store, "Opdater" when it has a newer version); then, installed on
 * the Settings tab, its settings form (`fields`) and what AppSettingsTab has, else what AppInfoTab has (what it adds,
 * not installed, with the pictures, what it needs, its cookies, who made it and where it is used). */
function AppContent({ app, env, files, tab, fields }: AppProps & { tab: AppTab; fields?: ReactNode }) {
  const notify = env.notify;
  const [toggling, setToggling] = useState<'install' | 'uninstall' | null>(null);
  const store = useStoreActions(env, files);
  const saving = !!toggling || store.saving;
  const catalog = useCatalog(env);
  const update = updateOf(app, catalog);
  // Its release notes as the store has them: also those of a version the site's build does not have yet.
  const inStore = Array.isArray(catalog) ? catalog.find((a) => a.id === app.id) : undefined;
  const installed = installedApps(files);
  const on = installed.includes(app.id);
  // Where it is used: while it is, it cannot be uninstalled.
  const uses = on ? usesOf(app, files) : [];
  const stuck = uses.length > 0;

  // Installed or uninstalled, saved at once in its own commit. One in use cannot be uninstalled. One from the store
  // is deleted from the site (it can be installed again from the store).
  async function install(yes: boolean) {
    if (!yes && stuck) return notify({ text: t.apps.stuck, error: true });
    if (!yes && !(await ask(t.apps.askUninstall(app.label), t.apps.uninstall))) return;
    if (!yes && app.store) return store.uninstall(app.id, app.label, asWritten(app).label);
    const file = files.find((f) => f.path === config.apps.installed);
    const next = installed.filter((id) => id !== app.id).concat(yes ? [app.id] : []);
    const text = `${JSON.stringify({ installed: [...new Set(next)].sort() }, null, 2)}\n`;
    if (text === file?.text) return;
    setToggling(yes ? 'install' : 'uninstall');
    notify({ text: yes ? t.apps.installing : t.apps.uninstalling });
    try {
      // With its cookies added to the cookie list, or those it added taken out.
      const changes = [
        { path: config.apps.installed, content: text, oid: file?.oid || null },
        ...cookieChanges(app.id, yes ? (asWritten(app).cookieList ?? []) : null, files),
      ];
      const change = t.app.changes[yes ? 'installed' : 'uninstalled'](kindAndName(t.app.changes.app, app.label));
      await saveApp(env, siteT.apps.commit[yes ? 'install' : 'uninstall'](asWritten(app).label), change, changes, file);
      notify({ text: yes ? t.apps.isInstalled(app.label) : t.apps.isUninstalled(app.label), kind: 'saved' });
    } catch (e) {
      notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setToggling(null);
    }
  }

  return (
    <div>
      <AppHead
        icon={<LeadingIcon icon={app.icon} selected={on} />}
        label={app.label}
        publisher={app.publisher}
        status={on && update ? t.apps.updateFound : statusOf(on)}
        version={app.store && versionOf(app)}
        hint={app.hint}
      />
      {(!on || (update && app.store)) && (
        <div className="mb-8">
          {on ? (
            <Button disabled={saving} busy={store.busy(app.id, 'update')} onClick={() => store.update(update!, app.store!)}>
              {t.apps.update(update!.version)}
            </Button>
          ) : (
            <Button disabled={saving} busy={toggling === 'install' || store.busy(app.id, 'install')} onClick={() => install(true)}>
              {t.apps.install}
            </Button>
          )}
        </div>
      )}
      {on && tab === 'settings' ? (
        <>
          {fields}
          <AppSettingsTab
            app={app}
            env={env}
            files={files}
            busy={saving}
            uninstalling={toggling === 'uninstall' || store.busy(app.id, 'uninstall')}
            stuck={stuck}
            onUninstall={() => install(false)}
          />
        </>
      ) : (
        <AppInfoTab
          pictures={app.pictures}
          description={app.description}
          news={app.store ? newsOf(inStore?.releaseNotes ?? app.releaseNotes, update?.version ?? versionOf(app)) : []}
          needs={app.needs}
          notifies={Object.values(app.notifications?.types ?? {}).map((label) => ({ label: siteText(label) }))}
          cookies={app.cookieList ?? []}
          consent={!!app.cookies}
          publisher={app.publisher}
          licenses={
            <OwnerLicenses
              id={`app/${app.id}`}
              name={app.label}
              author={app.publisher}
              version={app.store && versionOf(app)}
              declared={app}
            />
          }
          uses={uses}
        >
          {/* Not installed, what it adds is listed here; installed, it is on the Settings tab. */}
          {!on && <AppAdds app={app} env={env} files={files} on={false} />}
        </AppInfoTab>
      )}
    </div>
  );
}
