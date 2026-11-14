// The editor at /editor/ (docs/editor.md): sign in with GitHub, pick a part of the site, edit and
// save. The layout: the full-height navigation rail or drawer (MainMenu.tsx) with, beside it, the top bar (topBarSlot.tsx) over the screen. The address after # says what is open, so reloading keeps it:
//   (empty)          the start page
//   list/<id>       the list of a part, e.g. list/prices, and list/<id>/<app> a tab an installed app adds to it
//                    (AppDefinition.tabs): list/cookies/cookiescanner
//   lists           the short lists (the testimonials, the apps' lists)
//   settings         the Settings screen (Library.tsx SettingsScreen), opened by the cog at the bottom of the drawer (MainMenu.tsx);
//                    its rows are screens of their own
//   settings/appstore   the app store, its apps (AppList.tsx StorePage)
//   assistants       the assistants connected to the site, with Connect (the address) and Disconnect (Assistants.tsx), under Settings
//   new/<id>         a new entry, new/<id>/<kind> one of a kind (a pop-up: standard, or an app's)
//   company     the business, and company/<part> its parts: contact, payment; and
//                    company/payment/<part> its own parts: mobilepay, bank
//   company/logo    the logo and icon (BrandForm.tsx), the first part of the business (Library.tsx Company)
//   <screen>         a screen with parts of the site's own (partScreens), and <screen>/<part> its parts:
//                    privacy/cookie-banner, privacy/privacy-pages, or one of the editor's own screens (Part.opens):
//                    privacy/consents the visitors' answers in the cookie banner (Consents.tsx); and the settings of the apps installed with
//                    its category: analytics/google-analytics
//   files            the uploaded images, PDFs, videos and zip files (Media.tsx)
//   seo              "Search engine optimization" (Library.tsx Seo): seo/redirects the redirects' two lists
//                    (Redirects.tsx): seo/redirects/all the redirects, and seo/redirects/not-found
//                    the addresses visitors came to that do not exist; seo/rating the SEO rating of every page and
//                    post (SeoScores.tsx); and seo/<part> the site's own (seoParts)
//   appearance         how the site looks (Library.tsx Theme): appearance/theme-store the store's themes (ThemeStoreScreen.tsx), appearance/themes the themes installed (Themes) and appearance/themes/<theme>
//                    a theme's page, with the button that swaps to it (ThemePage), appearance/icon-packs the icon packs (IconPacks),
//                    appearance/motion how it moves (MotionSchemes), global/side-column the block beside the pages' text (SideColumn),
//                    global/header the header's menus and settings with its preview (HeaderSettings.tsx; once at header),
//                    global/footer the footer's texts and links with its preview (FooterSettings.tsx; once at src/data/footer.json),
//                    company/colors the colours (Colors.tsx;
//                    company/colors/fallback-colors the site's own while an app changes the pages'),
//   developer          the developer screens (Library.tsx Developer), under "Settings": developer/caching the copy of the site's files in R2 and the build settings (Advanced.tsx), and
//                    developer/parts the parts (Library.tsx PartsHome): developer/parts/editor the editor's, every
//                    one in every state (Parts.tsx), developer/parts/ui the theme's UI components, developer/parts/blocks the
//                    blocks, the standard ones and the apps', and developer/parts/list/<list> each kind of a list of kinds
//                    ("Promotion"), its own and the apps' (BlockParts.tsx), and developer/parts/values the
//                    theme's design tokens, "Values" (Tokens.tsx)
//   block-settings         the blocks that can be put in, "Block settings" (BlockSettings.tsx)
//   morpheme         "Morpheme", under "Settings": the CMS's version, a newer one and its notes, an update's progress (CmsPage.tsx),
//                    and morpheme/<line> an older minor line's notes, e.g. morpheme/0.13 (VersionLinePage.tsx)
//   licenses         "Licenses", under "Settings": the licences of what the site and the editor are made with, and
//                    licenses/<id> one with its text (Licenses.tsx)
//   status           "System status", from the footer: GitHub's and Cloudflare's status (ServiceStatus.tsx)
//   installed/connectors, installed/plugins   the connectors and plugins installed (AppList.tsx Apps with a role); the themes installed are appearance/themes
//   apps             the apps that come with the site, apps/<app> one with its button to install it and, while it
//                    is installed, the tabs of its page (AppList.tsx AppPage): Settings at apps/<app>, with its settings
//                    form (also on the screen with its category, analytics/<app>, AppList.tsx settingsRoute), and
//                    Information at apps/<app>/about (before an app's own screens, AppDefinition.screens)
//   apps/<app>/settings/<field>  the page of a field of its settings with its choices on a page of their own
//                    (Field.page), over its Settings tab, which keeps what is in it: apps/content-colors/settings/variant
//   <form>/<field>   the page of a field of a part's form with its choices on a page of their own (Field.page), over the
//                    form, which keeps what is in it (formAt)
//   blocks           the blocks, and blocks/<block> the texts all its copies have (blockTexts.ts)
//   deleted/<id>     what was deleted from a list, or deleted/files the files (Deleted.tsx)
//   <file path>      a file being edited, e.g. src/content/blog/mit-foerste-indlaeg.md
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AuthError,
  commit,
  ConflictError,
  deletedFiles,
  loadBytes,
  loadFiles,
  head,
  loadFolders,
  login,
  logout,
  rememberTexts,
  savedAt,
  versionsOf,
  versionText,
  viewer,
  type Change,
  type DeletedFile,
  type Version,
  type RepoFile,
  type Viewer,
} from './github';
import {
  changesText,
  hasUnsaved,
  kindAndName,
  lower,
  nameOf,
  savedText,
  setUnsaved,
  keepCurrent,
  registerWorker,
  waitForSite,
} from './deploy';
import { readCache, writeCache } from './cache';
import { forgetNotFound, loadNotFound, type Missing } from './notFound';
import { isEntryPath } from '../lib/ownList.mjs';
import { collectionOf, slugOf, type Collection, type FolderCollection, type Part, type Relation } from './schema';
import OwnListPage from './OwnListPage';
import { listDraftOf, restoreKeptLists, useListDrafts } from './listDraft';
import EntryForm, { newMarkdown } from './EntryForm';
import DataForm from './DataForm';
import CompanyForm from './CompanyForm';
import Media, { mediaOf } from './Media';
import Redirects, { REDIRECTS_ROUTE, TAB_ROUTES } from './Redirects';
import Consents from './Consents';
import SeoScores, { SEO_SCORES_ROUTE } from './SeoScores';
import Deleted from './Deleted';
import Parts from './Parts';
import { BlocksParts, ComponentParts, KindParts } from './BlockParts';
import Tokens from './Tokens';
import BrandForm from './BrandForm';
import BlockSettings from './BlockSettings';
import Advanced, { CACHING_ROUTE } from './Advanced';
import CmsPage, { CMS_ROUTE } from './CmsPage';
import { VersionLinePage } from './VersionLinePage';
import Assistants, { ASSISTANTS_ROUTE } from './Assistants';
import Licenses, { LICENSES_ROUTE, LicensePage } from './Licenses';
import ServiceStatus, { STATUS_ROUTE } from './ServiceStatus';
import { StoreThemePage } from './ThemeStore';
import { ThemeStoreScreen } from './ThemeStoreScreen';
import {
  AppPage,
  AppScreenPage,
  Apps,
  appPartsIn,
  autoUpdate,
  DeveloperPage,
  settingsHome,
  settingsRoute,
  StoreAppPage,
  StorePage,
} from './AppList';
import { isSection, type Section } from './sectionChoice.mjs';
import { activeApps, installedApps } from './apps';
import {
  DEVELOPER_ROUTE,
  readApp,
  readCatalog,
  readScreenshots,
  storeConnected,
  readThemes,
  readThemeScreenshots,
  STORE_ROUTE,
  STORE_THEMES,
  INSTALLED_ROUTE,
  type ShownApp,
  type ShownTheme,
  type StoreApp,
  type StoreFile,
  type StoreTheme,
} from './store';
import Colors, { colorsOf, FALLBACK_ROUTE } from './Colors';
import { applyColors, applyMotion } from './theme';
import SideColumn from './SideColumn';
import HeaderSettings from './HeaderSettings';
import FooterSettings from './FooterSettings';
import { apps, notOffered } from './registry';
import {
  Account,
  Blocks,
  Company,
  SETTINGS_ROUTE,
  SettingsScreen,
  List,
  Lists,
  PartsHome,
  PartsScreen,
  Seo,
  Start,
  Theme,
  ThemePage,
  Themes,
  IconPacks,
  MotionSchemes,
  motionOf,
} from './Library';
import {
  appearance,
  asWritten,
  blockParts,
  collections,
  collectionsFor,
  companyParts,
  isOwnList,
  listRowsOf,
  setOwnRowLists,
  partScreens,
  seoParts,
} from './site';
import { config, relationsOf, type SiteData, siteName, siteOf, testimonialsOf, usedBy, whatIsAt } from '@site/editor';
import { themes } from './themes';
import Screen from './Screen';
import { Button, EmptyNote, ProblemNote, startRipples } from './ui';
import { useMenuOpen } from './menuOpen';
import { MainMenu } from './MainMenu';
import { TopBarLayout } from './topBarSlot';
import { rememberEdit } from './startStorage';
import { bulkDeletion } from './bulkDelete.mjs';
import { Ask, ask } from './ask';
import { LinkAsk } from './LinkSheet';
import { rowSources } from './standard/rows/view';
import { type ListRows, type Option, type TestimonialRow } from './fields';
import { endOf, entriesOf, lookup, readAll } from './redirectData';
import { inForm, leaveTo, type Status } from './FormFrame';
import { arrived, screenOf, up } from './nav';
import { siteT, siteText, t } from './i18n';
import { setBuildState } from './buildState';
import { snackbar } from '../lib/snackbar';
import { appRouteOf } from '../lib/appRoute.mjs';
import { movedRoute } from './movedRoutes.mjs';
import { appType, clearNotifications, isOn, remember, signOff, stopServerWait, syncDevice, told, waitOnServer } from './notificationData';
import { syncDensity } from './density';
import Notifications from './Notifications';
import { openNotifications } from './notificationsOpen';
import { EditorOwn, InEditor } from './standard/view';
import { cmsNotice } from './cmsNotice.mjs';
import './editor.css';

// What the forms and lists need from the app.
export type Env = {
  relations: Record<Relation, Option[]>;
  /** The rows of the lists (the apps' and the standard blocks'), by the list's id, and the testimonials, in their
   * order, for the cards of the blocks. */
  lists: ListRows;
  testimonials: TestimonialRow[];
  /** The rest of the site, for the previews of the blocks (sitedata.ts). */
  site: SiteData;
  /** The images uploaded to the site (Media.tsx), for the gallery an image is chosen from. */
  media: RepoFile[];
  /** All the files the editor has, for what links to a page that moves (addresses.ts). */
  files: RepoFile[];
  /** Shows a message at the bottom of the screen; null hides it. */
  notify: (status: Status) => void;
  /** Saves files as one commit (github.ts) and later tells when the site has the change. `change`: what it changed, in
   * the editor's language (t.app.changes, deploy.ts), for that message. `onSite: false`: nothing on the site changes (a
   * waiting version in src/drafts/), so it does not wait for the site. Returns the new blob ids. */
  commit: (message: string, changes: Change[], change: string, onSite?: boolean) => Promise<Record<string, string>>;
  /** When some files were last saved (github.ts); a new file is left out. */
  savedAt: (paths: string[]) => Promise<Record<string, Date>>;
  /** The commits that changed a file, and its text in one of them (github.ts; Versions.tsx). */
  versions: (path: string, after?: string) => Promise<{ versions: Version[]; more: string | null }>;
  versionText: (version: Version, path: string) => Promise<string | null>;
  /** The files deleted from a folder (github.ts deletedFiles; Deleted.tsx). */
  deleted: (folder: string, options?: { text?: boolean }) => Promise<DeletedFile[]>;
  /** Why a new page or post cannot have this address (it is taken), or null; redirects: the files of
   * the redirects as they are now (redirectData.ts, loaded with `load`). */
  taken: (address: string, redirects: RepoFile[]) => Taken | null;
  /** Single files outside the folders the app loads (github.ts loadFiles). */
  load: (paths: string[]) => Promise<RepoFile[]>;
  /** All the files in a folder of the site, at any depth (an app's, to install, update or uninstall it). */
  folder: (path: string) => Promise<RepoFile[]>;
  /** The app store (store.ts): its apps and its themes, an app's or a theme's files from it, and their images (as
   * addresses in this browser). */
  store: {
    connected: () => Promise<boolean>;
    catalog: () => Promise<ShownApp[]>;
    themes: () => Promise<ShownTheme[]>;
    files: (of: { files: StoreFile[]; label?: string; name?: string }) => Promise<{ path: string; content: string | Uint8Array }[]>;
    screenshots: (app: StoreApp) => Promise<{ src: string; label: string }[]>;
    themeScreenshots: (theme: Pick<StoreTheme, 'screenshots' | 'files'>) => Promise<{ key: string; src: string }[]>;
  };
  /** An image's bytes by its blob id (github.ts loadBytes). */
  bytes: (oid: string, address?: string) => Promise<Uint8Array>;
  /** The addresses visitors came to that do not exist (notFound.ts; null: the site does not keep
   * them), and taking some off that list. */
  notFound: { list: () => Promise<Missing[] | null>; forget: (paths: string[]) => Promise<void> };
  /** An app's own addresses in the site's Worker (/api/<app>/<path>, its worker.js), asked with the GitHub sign-in, for
   * its page (AppDefinition.page). */
  appApi: (app: string, path?: string, init?: RequestInit) => Promise<Response>;
  /** Files deleted on their own (a file in Filer). */
  forget: (paths: string[]) => void;
  /** A file was saved; more: other files saved with it, and files it removed (a post that moved). */
  onSaved: (file: RepoFile, more?: { files: RepoFile[]; removed: string[] }) => void;
  remove: (collection: Collection & { folder: string }, file: RepoFile, deleting: (b: boolean) => void) => void;
  /** Deletes the files selected in a list as one commit; true when they were deleted (App.tsx removeMany). */
  removeMany: (collection: Collection & { folder: string }, files: RepoFile[]) => Promise<boolean>;
  nextOrder: (collection: FolderCollection) => number;
  /** Saves a list in a new order; says what changed (deploy.ts). */
  reorder: (collection: Collection, files: RepoFile[]) => Promise<string>;
};

// The uploaded images only by their paths (no text), for "Files" (Media.tsx).
const FOLDERS = config.folders;
const FOLDERS_KEY = JSON.stringify(FOLDERS);

const json = (file: RepoFile) => JSON.parse(file.text) as Record<string, unknown>;

// Addresses of the site that are not pages.
const RESERVED = config.reserved;

/** Why a new page or post cannot have an address (/<slug>/): a message; with `redirect` when the site
 * sends it on elsewhere, which the site's owner may remove (EntryForm.tsx): where it ends after every redirect
 * (redirectData.ts), its name, and how many other addresses send on through it. */
export type Taken = { text: string; redirect?: { end: string; name: string; via: number } };

// Why a new page or post cannot have an address (/<slug>/), or null. redirects: the files of the
// redirects (redirectData.ts), as they are now.
function taken(address: string, relations: Record<Relation, Option[]>, redirects: RepoFile[]): Taken | null {
  const pages = [...relations.pages, ...relations.fixed].map((o) => o.value);
  const posts = relations.blog.map((o) => `/${o.value}/`);
  if (pages.includes(address) || posts.includes(address) || RESERVED.includes(address)) return { text: t.app.addressTaken(address) };
  const all = readAll(redirects);
  const look = lookup(all);
  if (look(address) === undefined) return null;
  const { end } = endOf(address, look);
  const via = entriesOf(all).filter((e) => e.from !== address && e.to.split('#')[0] === address).length;
  const name = whatIsAt(end, relations);
  return { text: t.app.addressRedirects(address, name), redirect: { end, name, via } };
}

// The editor's address after the "#" (nav.ts screenOf).
function routeOf(hash: string) {
  const route = movedRoute(screenOf(hash));
  // An app's settings: on the screen with its category, when it has one ("Analytics", AppList.tsx settingsRoute), and so
  // the pages of their fields (Field.page) after them. Otherwise they are on the Settings tab of its page: apps/<id>
  // (a field's page, apps/<id>/settings/<field>, stays, drawn by the same page).
  const app = apps.find((a) => route === `apps/${a.id}/settings` || route.startsWith(`apps/${a.id}/settings/`));
  const rest = app ? route.slice(`apps/${app.id}/settings`.length) : '';
  const kindScreen = app && settingsHome(app) && settingsRoute(app);
  const moved = !app ? route : kindScreen ? `${kindScreen}${rest}` : rest ? route : `apps/${app.id}`;
  if (moved !== screenOf(hash)) history.replaceState(history.state, '', `#${moved}`);
  return moved;
}

// The editor; what it draws of the site is in the editor (InEditor: a link only drawn …), its own screens are its own
// (EditorOwn: the theme's UI parts on them are links that lead somewhere).
export default function App() {
  return (
    <InEditor>
      <EditorOwn>
        <Editor />
      </EditorOwn>
    </InEditor>
  );
}

function Editor() {
  // Whether someone is signed in (the Worker keeps the sign-in, packages/editor/worker/session.js): null until the Worker or this
  // browser's copy of the files (cache.ts) has said.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [user, setUser] = useState<Viewer | null>(null);
  const [files, setFiles] = useState<RepoFile[] | null>(null);
  // A list with a waiting version (src/listDraft.ts) is shown on its address and under Lists; one the Worker kept comes back once the files are here.
  useListDrafts();
  useEffect(() => {
    if (files) void restoreKeptLists();
  }, [!!files]);
  const [error, setError] = useState('');
  const [route, setRoute] = useState(() => routeOf(location.hash));
  // Counts the visits to an address: a form starts fresh on each, but not when a new entry that was
  // just saved gets its own address.
  const [visit, setVisit] = useState(0);
  // The messages at the bottom and the save bar stand next to the standard drawer while it is open (editor.css).
  const { open: menuOpen } = useMenuOpen();
  useEffect(() => {
    document.documentElement.dataset.sidebar = menuOpen ? 'open' : 'closed';
  }, [menuOpen]);
  // Stops waiting for the last save to be on the site.
  const stopWaiting = useRef<() => void>(undefined);
  // What the saves the editor waits for the website to have changed (save).
  const waitingFor = useRef<string[]>([]);

  useEffect(registerWorker, []);
  useEffect(startRipples, []);
  // Signed up for the notifications on the phone from the site's Worker, also when the editor is closed, while
  // "On the phone" is on (notificationData.ts).
  useEffect(() => {
    if (signedIn) syncDevice();
  }, [signedIn]);
  // Density kept on the person's account replaces the copy in this browser (density.ts).
  useEffect(() => {
    if (signedIn) syncDensity();
  }, [signedIn]);
  // A tap on such a notification while the editor is open: to the screen it is about (packages/editor/pages/editor/sw.js).
  useEffect(() => {
    const onMessage = (e: MessageEvent) => typeof e.data?.to === 'string' && leaveTo(`#${e.data.to}`);
    navigator.serviceWorker?.addEventListener('message', onMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', onMessage);
  }, []);
  // The notifications' old address (#notifications, a screen before they were a side sheet): opens the sheet.
  useEffect(() => {
    if (route === 'notifications') openNotifications();
  }, [route]);
  // When the site was last updated (built on Cloudflare), for the start screen.
  const [builtAt, setBuiltAt] = useState<Date | null>(null);
  useEffect(() => keepCurrent((v) => v.builtAt && setBuiltAt(new Date(v.builtAt))), []);

  // Where the editor is, to come back to when leaving is asked about.
  const here = useRef(route);
  here.current = route;
  useEffect(() => {
    const onHash = () => {
      // The history's step (nav.ts): null when it undoes the one below.
      const step = arrived(here.current);
      if (!step) return;
      // To or from a page of the open form's own (a field's, Field.page): the form stays, with what is in it, and
      // scrolls itself (CompanyForm.tsx).
      const next = routeOf(location.hash);
      if (inForm(here.current, next)) return setRoute(next);
      // While something is unsaved, another address (the phone's back gesture, the sidebar, a link)
      // is first undone, and taken again only when the owner leaves without saving (leaveTo).
      if (hasUnsaved()) {
        step.undo();
        return leaveTo(step.redo);
      }
      setRoute(next);
      setVisit((v) => v + 1);
      scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // The commit the files are from. Not moved on by the owner's own saves, so the next check loads the
  // files again with those changes and anything else that came in.
  const commitOf = useRef('');
  // Counts the owner's saves, so that files loaded while one was made (from before it) are not shown.
  const saves = useRef(0);

  // The files from this browser at once (cache.ts), then from GitHub only when the branch has moved
  // on: checked on opening, and when the app is shown again, at most every half minute, and not
  // while something is unsaved. Only the files whose text this browser does not have are loaded (github.ts). The open
  // form keeps the file it opened with; saving checks it. Signed out (the Worker says so), the sign-in is shown.
  const signedOut = signedIn === false;
  useEffect(() => {
    if (signedOut) return;
    let stopped = false;
    let checked = 0;
    async function refresh() {
      if (stopped || hasUnsaved() || Date.now() - checked < 30_000) return;
      checked = Date.now();
      try {
        const [user, at] = await Promise.all([viewer(), head()]);
        if (stopped) return;
        setUser(user);
        setSignedIn(true);
        if (at.commit !== commitOf.current) {
          const before = saves.current;
          const loaded = await loadFolders(FOLDERS, 3, at);
          if (stopped) return;
          // Saved meanwhile: these files are older than that save; the next check loads them again.
          if (saves.current !== before) {
            checked = 0;
            return;
          }
          commitOf.current = loaded.commit;
          setFiles(Object.values(loaded.folders).flat());
        }
      } catch (e) {
        if (e instanceof AuthError) signOut();
        // With files from this browser, the editor goes on; the next check tries again.
        else if (!commitOf.current) setError((e as Error).message);
        checked = 0;
      }
    }
    readCache().then((cached) => {
      if (stopped) return;
      if (cached) {
        // Kept from other folders than these (an older editor): shown, and loaded again at once.
        commitOf.current = cached.folders === FOLDERS_KEY ? cached.commit : '';
        rememberTexts(cached.files);
        setUser(cached.user);
        setFiles(cached.files);
        setSignedIn(true);
      }
      refresh();
    });
    const onShow = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onShow);
    return () => {
      stopped = true;
      document.removeEventListener('visibilitychange', onShow);
    };
  }, [signedOut]);

  // Keeps what is shown, with the owner's saves, for the next time the editor opens.
  useEffect(() => {
    if (files && user && commitOf.current) writeCache({ commit: commitOf.current, files, user, folders: FOLDERS_KEY });
  }, [files, user]);

  // The lists the owner made are known to "Rows from" before its choices are made (rowSources reads them), so they are offered.
  const relations = useMemo<Record<Relation, Option[]>>(() => {
    setOwnRowLists(files ?? []);
    return { ...relationsOf(files ?? []), rowSources: rowSources(t.blocks.rows) };
  }, [files]);
  // What a link in the text can go to (LinkSheet.tsx): the fixed pages (not those that are also a
  // page), the other pages and the posts, by their addresses.
  const linkGroups = useMemo(() => {
    const fixed = relations.fixed.filter((f) => !relations.pages.some((o) => o.value === f.value));
    return [
      { title: t.forms.fixedPages, options: fixed },
      { title: t.forms.pages, options: relations.pages },
      { title: t.text.linkPosts, options: relations.blog.map((o) => ({ ...o, value: `/${o.value}/` })) },
    ].filter((g) => g.options.length);
  }, [relations]);
  const listRows = useMemo(() => listRowsOf(files ?? []), [files]);
  const testimonials = useMemo(() => testimonialsOf(files ?? []), [files]);

  // The site's colours as loaded and saved ("Colors"), also before the site is built again with them.
  const colorsFile = files?.find((f) => f.path === config.colors)?.text;
  useEffect(() => {
    if (colorsFile !== undefined) applyColors(colorsOf(files!));
  }, [colorsFile]);
  // How the site moves ("Motion") as loaded and saved, also before the site is built again with it.
  const motionFile = files?.find((f) => f.path === config.motion)?.text;
  useEffect(() => {
    if (files) applyMotion(motionOf(files));
  }, [motionFile, files === null]);

  const siteData = useMemo(() => siteOf(files ?? []), [files]);
  const media = useMemo(() => mediaOf(files ?? []), [files]);

  // A message at the bottom (snackbar in lib/snackbar.ts, the same as on the site), with a link to what it
  // is about; one of a kind kept in the notifications too (notificationData.ts).
  function notify(next: Status, device = true, toast = true) {
    const edit = next?.edit;
    if (next?.kind)
      remember({ text: next.text, type: next.kind, error: next.error, link: edit && { text: edit.text, href: `#${edit.to}` } }, device);
    if (!toast) return;
    snackbar(
      next && {
        text: next.text,
        error: next.error,
        links: [
          ...(edit
            ? [
                {
                  text: edit.text,
                  href: `#${edit.to}`,
                  onClick: (e: MouseEvent) => {
                    e.preventDefault();
                    leaveTo(`#${edit.to}`);
                  },
                },
              ]
            : []),
        ],
      },
    );
  }

  async function save(message: string, changes: Change[], change: string, onSite = true) {
    const saved = await commit(message, changes);
    if (!onSite) return saved.blobs;
    // One message for all saves: a later save is on the site together with or after the ones before. It says what
    // each of them changed (each once).
    stopWaiting.current?.();
    if (!waitingFor.current.includes(change)) waitingFor.current.push(change);
    const what = changesText(waitingFor.current);
    // The Worker says it on the phone too, also when the editor is closed by then (notificationData.ts).
    // The form's Publish button shows it until the website is updated (buildState.ts); only a failure is a message.
    setBuildState('updating');
    const onServer = waitOnServer(saved.commit, t.app.siteUpdated(what), t.app.siteNotUpdated(what));
    stopWaiting.current = waitForSite(saved.commit, async (online) => {
      waitingFor.current = [];
      setBuildState('idle');
      const text = online ? t.app.siteUpdated(what) : t.app.siteNotUpdated(what);
      // On screen the editor says it, and the Worker does not; else only the Worker sends it to the phone.
      const byServer = document.visibilityState !== 'visible' && (await onServer);
      if (!byServer) stopServerWait();
      notify(
        { text, error: !online, kind: 'site', edit: online ? undefined : { text: t.footer.status, to: 'status' } },
        !byServer,
        !online,
      );
    });
    return saved.blobs;
  }

  function signOut() {
    stopWaiting.current?.();
    setBuildState('idle');
    waitingFor.current = [];
    // No notifications on this phone for someone signed out: signed off at the Worker while the sign-in is still there.
    void signOff()
      .catch(() => {})
      .then(logout);
    commitOf.current = '';
    writeCache(null);
    clearNotifications();
    setSignedIn(false);
    setUser(null);
    setFiles(null);
  }

  const replace = (saved: RepoFile[], removed: string[] = []) => {
    saves.current++;
    setFiles((all) => [...(all ?? []).filter((f) => !saved.some((s) => s.path === f.path) && !removed.includes(f.path)), ...saved]);
  };

  const env: Env = {
    relations,
    lists: listRows,
    testimonials,
    site: siteData,
    media,
    files: files ?? [],
    forget: (paths) => replace([], paths),
    notify,
    commit: save,
    savedAt,
    versions: versionsOf,
    versionText,
    deleted: deletedFiles,
    load: (paths) => loadFiles(paths),
    folder: (path) => loadFolders({ all: path }, 8).then((r) => r.folders.all),
    store: {
      connected: storeConnected,
      catalog: readCatalog,
      themes: readThemes,
      files: readApp,
      screenshots: readScreenshots,
      themeScreenshots: readThemeScreenshots,
    },
    bytes: (oid, address) => loadBytes(oid, address),
    notFound: { list: loadNotFound, forget: forgetNotFound },
    // The sign-in's cookie goes with the request (packages/editor/worker/session.js).
    appApi: (app, path = '', init) => fetch(`/api/${app}/${path}`, { cache: 'no-store', ...init }),
    taken: (address, redirects) => taken(address, relations, redirects),
    onSaved(file, more) {
      replace([file, ...(more?.files ?? [])], more?.removed);
      // The start screen's last pages and posts edited (startStorage.ts).
      rememberEdit(file.path, more?.removed);
      // A new entry, or a post that got a new address: from now on it is edited as the file it
      // became. A form that saves another file than the one at its address (Virksomheden) stays where it is.
      if (route.startsWith('new/') || more?.removed.includes(route)) {
        history.replaceState(history.state, '', `#${file.path}`);
        setRoute(file.path);
      }
    },
    async remove(collection, file, deleting) {
      const reason = usedBy(collection, file, files ?? []);
      if (reason) return notify(reason);
      if (!(await ask(t.app.deleteEntry(collection.singular), t.common.delete))) return;
      deleting(true);
      notify({ text: t.common.deleting });
      const change = t.app.changes.deleted(kindAndName(collection.singular, nameOf(collection, file)));
      try {
        await save(
          siteT.app.commit.delete(asWritten(collection).singular, slugOf(file.path, collection.folder)),
          [{ path: file.path, content: null, oid: file.oid }],
          change,
        );
        replace([], [file.path]);
        // Back to the list, as with the back arrow: the deleted entry is not left behind it in the history.
        setUnsaved(false);
        up(`#list/${collection.id}`);
        notify({ text: savedText(change), kind: 'saved' });
      } catch (e) {
        notify({ text: t.app.notDeleted((e as Error).message), error: true, kind: 'failed' });
        deleting(false);
      }
    },
    async removeMany(collection, picked) {
      const { changes, kept } = bulkDeletion(picked, (f: RepoFile) => usedBy(collection, f, files ?? [])?.text);
      const what = lower(collection.label);
      if (kept.length) notify({ text: t.app.notDeletedSome(kept.length, what, kept[0].reason), error: true, kind: 'failed' });
      if (!changes.length) return false;
      if (!(await ask(t.app.deleteEntries(changes.length, what), t.common.delete))) return false;
      notify({ text: t.common.deleting });
      const change = t.app.changes.deleted(`${changes.length} ${what}`);
      try {
        // One commit: a file changed elsewhere (a conflict) stops all of them, so none is half deleted.
        await save(siteT.app.commit.deleteMany(changes.length, asWritten(collection).label.toLowerCase()), changes, change);
        replace(
          [],
          changes.map((c) => c.path),
        );
        rememberEdit(
          '',
          changes.map((c) => c.path),
        );
        notify({ text: t.app.deletedEntries(changes.length, what), kind: 'saved' });
        return true;
      } catch (e) {
        notify({ text: e instanceof ConflictError ? e.message : t.app.notDeleted((e as Error).message), error: true, kind: 'failed' });
        return false;
      }
    },
    nextOrder(collection) {
      const own = (files ?? []).filter(
        (f) => f.path.startsWith(`${collection.folder}/`) && f.path.endsWith('.json') && isEntryPath(f.path),
      );
      return Math.max(0, ...own.map((f) => Number(json(f).order) || 0)) + 1;
    },
    // Numbers the entries 1, 2, 3… in the new order and saves the files whose number changed.
    async reorder(collection, ordered) {
      const changes = ordered.flatMap((file, i) => {
        const { order, ...rest } = json(file);
        if (order === i + 1) return [];
        const text = `${JSON.stringify({ order: i + 1, ...rest }, null, 2)}\n`;
        return [{ path: file.path, content: text, oid: file.oid }];
      });
      const change = t.app.changes.order(lower(collection.label));
      if (!changes.length) return change;
      const oids = await save(siteT.app.commit.reorder(asWritten(collection).label.toLowerCase()), changes, change);
      replace(changes.map((c) => ({ path: c.path, oid: oids[c.path], text: c.content })));
      return change;
    },
  };

  // The apps from the store updated on their own, once the files are there (autoUpdate in AppList.tsx).
  const loaded = !!files;
  useEffect(() => {
    if (signedIn && loaded) autoUpdate(env, files!);
  }, [signedIn, loaded]);

  // What the installed apps have to say (AppNotifications in apps.ts): asked when the editor opens and every 15 minutes
  // while it is open; each comes once, at the bottom and under "Notifications", while its type is on (notificationData.ts).
  const notifying = activeApps(files ?? [])
    .filter((id) => apps.some((a) => a.id === id && a.notifications))
    .join();
  useEffect(() => {
    if (!signedIn || !notifying) return;
    const ask = () => {
      for (const app of apps.filter((a) => notifying.split(',').includes(a.id))) {
        const { types, check } = app.notifications!;
        check({ api: (path, init) => env.appApi(app.id, path, init) })
          .then((found) => {
            for (const n of found) {
              const type = appType(app.id, n.type);
              if (!(n.type in types) || told(type, n.id) || !isOn(type)) continue;
              const to = siteText(n.link ?? app.label);
              const link = n.to ? { text: to, href: `#${n.to}` } : undefined;
              remember({ text: n.text, type, error: n.error, link });
              notify({ text: n.text, error: n.error, edit: n.to ? { to: n.to, text: to } : undefined });
            }
          })
          .catch(() => {});
      }
    };
    ask();
    const timer = setInterval(ask, 15 * 60_000);
    return () => clearInterval(timer);
  }, [signedIn, notifying]);

  // The CMS's own update from npm (worker/cms-update.js): asked when the editor opens and every 15 minutes; its outcome
  // comes once under "Notifications"; the Worker already sent it to the phone.
  useEffect(() => {
    if (!signedIn) return;
    const ask = () =>
      fetch('/api/cms', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((status) => {
          const n = cmsNotice(status?.update);
          if (!n || told('updates', n.id) || !isOn('updates')) return;
          const text = t.cms[n.key](n.version);
          remember({ text, type: 'updates', error: n.error, link: { text: t.common.parts.morpheme, href: `#${CMS_ROUTE}` } }, false);
        })
        .catch(() => {});
    ask();
    const timer = setInterval(ask, 15 * 60_000);
    return () => clearInterval(timer);
  }, [signedIn]);

  // Signed out, or not yet known with nothing from this browser to show: the sign-in (while the Worker is asked, the
  // icon and the name alone).
  if (signedIn === false || (signedIn === null && !files)) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-5 px-6 pb-[env(safe-area-inset-bottom)] text-center">
        <img src="/editor/icon-192.png" alt="" className="size-20 rounded-[1.375rem] shadow-soft" />
        <h1 className="text-2xl font-semibold">{siteName}</h1>
        {signedIn === null && !error ? <EmptyNote busy>{t.app.loading}</EmptyNote> : <Button onClick={login}>{t.app.logIn}</Button>}
        {error && <ProblemNote>{error}</ProblemNote>}
      </main>
    );
  }

  return (
    <>
      <TopBarLayout
        aside={<MainMenu route={route} files={files} user={user} />}
        above={
          files &&
          user &&
          !user.canSave && (
            <p className="bg-primary px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] text-center text-sm text-on-primary">
              {t.app.cannotSave(user.login)}
            </p>
          )
        }
      >
        <>
          <div className="editor-content relative flex min-w-0 flex-1 flex-col">
            {files ? (
              <Page key={visit} route={route} files={files} env={env} user={user} builtAt={builtAt} onLogout={signOut} />
            ) : (
              <Screen title={siteName}>
                <EmptyNote busy={!error}>{error || t.app.loading}</EmptyNote>
              </Screen>
            )}
          </div>

          <LinkAsk groups={linkGroups} />
          <Ask />
          <Notifications />
        </>
      </TopBarLayout>
    </>
  );
}

/** The part whose form is at an address (CompanyForm.tsx): one of "Business"'s (or of its parts', with the settings of the apps of their kinds), "Search engine optimization"'s, "Appearance"'s, or one on a screen of parts with
 * the settings of the apps of its kinds ("Analytics"). */
function partAt(route: string, files: RepoFile[]): Part | null {
  // company/<part>, or company/<part>/<its part> (Part.parts).
  const [, companyId, ownId, ...more] = route.split('/');
  const company = route.startsWith('company/') && !more.length && companyParts.find((p) => p.id === companyId);
  return (
    (company &&
      (ownId ? [...(company.parts ?? []), ...appPartsIn(company, files)].find((p) => p.id === ownId) : company.file && company)) ||
    (route.startsWith('blocks/') && blockParts.find((p) => p.id === route.slice(7))) ||
    (route.startsWith('seo/') && seoParts.find((p) => p.id === route.slice(4))) ||
    (route.startsWith('appearance/') && appearance.find((p) => p.id === route.slice('appearance/'.length))) ||
    partScreens.flatMap((s) => [...s.parts, ...appPartsIn(s, files)].filter((p) => route === `${s.id}/${p.id}`))[0] ||
    null
  );
}

/** The form at an address: a part's (partAt, `at` its address), or the page of one of its fields with its choices on a
 * page of their own (Field.page: the form's address with the field's name after it, `page`). */
function formAt(route: string, files: RepoFile[]): { part: Part; at: string; page?: string } | null {
  const part = partAt(route, files);
  if (part) return { part, at: route };
  const cut = route.lastIndexOf('/');
  const above = cut > 0 ? partAt(route.slice(0, cut), files) : null;
  const page = route.slice(cut + 1);
  return above?.fields?.some((f) => f.name === page && f.page) ? { part: above, at: route.slice(0, cut), page } : null;
}

type PageProps = { route: string; files: RepoFile[]; env: Env; user: Viewer | null; builtAt: Date | null; onLogout: () => void };

function Page({ route, files, env, user, builtAt, onLogout }: PageProps) {
  if (!route) return <Start builtAt={builtAt} files={files} env={env} />;
  if (route === 'account') return <Account user={user} files={files} onLogout={onLogout} />;
  // The old address of the notifications, now a side sheet: the start screen, with the sheet over it (App).
  if (route === 'notifications') return <Start builtAt={builtAt} files={files} env={env} />;
  if (route === 'lists') return <Lists files={files} env={env} />;
  if (route === 'company') return <Company files={files} />;
  if (route === 'blocks') return <Blocks files={files} />;
  if (route === 'files' || route.startsWith('files/'))
    return <Media key={route} files={files} env={env} open={route === 'files' ? undefined : '/' + route.slice('files/'.length)} />;
  if (route === 'seo') return <Seo />;
  if (route === REDIRECTS_ROUTE) return <Redirects env={env} />;
  if (route === SEO_SCORES_ROUTE) return <SeoScores files={files} env={env} />;
  if (route === TAB_ROUTES.redirects) return <Redirects env={env} tab="redirects" />;
  if (route === TAB_ROUTES.missing) return <Redirects env={env} tab="missing" />;
  const screen = partScreens.find((s) => s.id === route);
  if (screen) return <PartsScreen screen={screen} files={files} />;
  // A part of a screen of parts that is one of the editor's own screens (Part.opens), going back to that screen.
  const opening = partScreens.flatMap((s) => s.parts.filter((p) => p.opens && route === `${s.id}/${p.id}`).map((p) => ({ s, p })))[0];
  if (opening?.p.opens === 'consents') return <Consents env={env} back={{ href: `#${opening.s.id}`, label: opening.s.label }} />;
  if (route === 'appearance') return <Theme files={files} />;
  if (route === 'appearance/themes') return <Themes env={env} files={files} />;
  if (route === 'appearance/icon-packs') return <IconPacks env={env} files={files} />;
  if (route === 'appearance/motion') return <MotionSchemes env={env} files={files} />;
  if (route === 'global/side-column') return <SideColumn env={env} files={files} />;
  if (route === 'global/header') return <HeaderSettings env={env} />;
  if (route === 'global/footer') return <FooterSettings env={env} />;
  // A theme installed has its page; one from the store that is not (or not yet built), its page in the store.
  const themeShown = route.startsWith('appearance/themes/') && themes.find((x) => x.id === route.slice('appearance/themes/'.length));
  if (themeShown) return <ThemePage key={themeShown.id} of={themeShown} env={env} files={files} />;
  if (/^appearance\/themes\/[^/]+$/.test(route))
    return <StoreThemePage key={route} id={route.slice('appearance/themes/'.length)} env={env} />;
  // The colours, or the site's own on a page of the same form while an app changes the pages' (FALLBACK_ROUTE).
  if (route === 'company/colors' || route === FALLBACK_ROUTE) return <Colors env={env} files={files} fallback={route === FALLBACK_ROUTE} />;
  if (route === 'company/logo') return <BrandForm env={env} />;
  if (route === 'block-settings') return <BlockSettings env={env} files={files} />;
  if (route === SETTINGS_ROUTE) return <SettingsScreen />;
  if (route === CACHING_ROUTE) return <Advanced env={env} />;
  if (route === CMS_ROUTE) return <CmsPage />;
  if (route.startsWith(`${CMS_ROUTE}/`)) return <VersionLinePage key={route} line={route.slice(CMS_ROUTE.length + 1)} />;
  if (route === ASSISTANTS_ROUTE) return <Assistants />;
  if (route === LICENSES_ROUTE) return <Licenses />;
  if (route === STATUS_ROUTE) return <ServiceStatus />;
  if (route.startsWith(`${LICENSES_ROUTE}/`)) return <LicensePage key={route} id={route.slice(LICENSES_ROUTE.length + 1)} />;
  if (route === 'apps') return <Apps env={env} files={files} />;
  if (route === `${INSTALLED_ROUTE}/connectors`) return <Apps env={env} files={files} role="connector" />;
  if (route === `${INSTALLED_ROUTE}/plugins`) return <Apps env={env} files={files} role="plugin" />;
  if (route === STORE_ROUTE) return <StorePage env={env} files={files} />;
  if (route.startsWith(`${STORE_ROUTE}/`) && isSection(route.slice(STORE_ROUTE.length + 1)))
    return <StorePage env={env} files={files} section={route.slice(STORE_ROUTE.length + 1) as Section} />;
  if (route === STORE_THEMES) return <ThemeStoreScreen env={env} />;
  if (route.startsWith(`${DEVELOPER_ROUTE}/`))
    return <DeveloperPage key={route} slug={route.slice(DEVELOPER_ROUTE.length + 1)} env={env} files={files} />;
  // An app in the site (its own, or one from the store while it is installed) has its page, with the tabs Settings
  // (apps/<id>, and a settings field's page, apps/<id>/settings/<field>) and Information (apps/<id>/about, matched
  // before an app's own screens); one from the store that is not (or no longer) installed, its page in the store.
  const shownApp = route.startsWith('apps/') ? apps.find((a) => appRouteOf(route, a.id)) : undefined;
  const shown = shownApp && appRouteOf(route, shownApp.id);
  if (shownApp && shown && (!shownApp.store || installedApps(files).includes(shownApp.id)))
    return <AppPage key={shownApp.id} app={shownApp} env={env} files={files} tab={shown.tab} page={shown.page} />;
  if (shownApp || /^apps\/[^/]+$/.test(route)) {
    return <StoreAppPage key={route} id={route.split('/')[1]} env={env} files={files} />;
  }
  // A screen of an app's own under its page, while it is installed (Cookiescanner's "Blocked address").
  const [, screenApp, screenId, ...deeper] = route.split('/');
  const ownScreen =
    route.startsWith('apps/') && !deeper.length && apps.find((a) => a.id === screenApp && screenId && a.screens?.[screenId]);
  if (ownScreen && activeApps(files).includes(ownScreen.id)) return <AppScreenPage key={route} app={ownScreen} id={screenId} env={env} />;
  if (route === 'developer/parts') return <PartsHome />;
  if (route === 'developer/parts/editor') return <Parts env={env} />;
  if (route === 'developer/parts/ui') return <ComponentParts />;
  if (route === 'developer/parts/blocks') return <BlocksParts />;
  if (route.startsWith('developer/parts/list/')) return <KindParts key={route} id={route.slice('developer/parts/list/'.length)} />;
  if (route === 'developer/parts/values') return <Tokens />;
  if (route.startsWith('deleted/')) return <Deleted id={route.slice('deleted/'.length)} files={files} env={env} />;
  // company/<part>, or company/<part>/<its part> (Part.parts).
  const [, companyId, ownId, ...more] = route.split('/');
  const company = route.startsWith('company/') && !more.length && companyParts.find((p) => p.id === companyId);
  if (company && company.parts && !ownId) return <Company part={company} files={files} />;
  // A part's form, or the page of one of its fields (Field.page) with the form under it: the same form, so it keeps what
  // is in it while the editor goes between them (useFormPages, inForm).
  const form = formAt(route, files);
  if (form) return <CompanyForm part={form.part} at={form.at} page={form.page} env={env} files={files} />;
  // A list, or a tab an installed app adds to it (list/<id>/<app>).
  const [, listId, listTab, ...below] = route.split('/');
  const listed = route.startsWith('list/') && !below.length && collectionsFor(files).find((c) => c.id === listId);
  // A list the owner made: in git, or a new one that has only its waiting version so far (src/listDraft.ts).
  if (
    (listed && listed.kind === 'folder' && isOwnList(files, listed.id)) ||
    (!listed && route.startsWith('list/') && !below.length && listDraftOf(listId))
  )
    return <OwnListPage key={listId} id={listId} files={files} env={env} />;
  if (listed) return <List key={listed.id} collection={listed} tab={listTab} files={files} env={env} />;

  // new/<list>, or new/<list>/<kind> for one of its kinds (a pop-up: standard, mailchimp).
  const [, newIn, newKind] = route.split('/');
  const creating = route.startsWith('new/') && collectionsFor(files).find((c) => c.id === newIn && c.create);
  if (creating) {
    if (creating.kind === 'markdown') return <EntryForm collection={creating} file={newMarkdown(creating, notOffered(files))} env={env} />;
    if (creating.kind === 'folder')
      return <DataForm key={route} collection={creating} kind={newKind} file={{ path: '', oid: '', text: '' }} env={env} />;
  }

  const found = collectionOf(collectionsFor(files), route);
  // An optional file (the header's) that the site has not got yet opens empty; the first save makes it.
  const file = files.find((f) => f.path === route) ?? (found?.dataFile?.optional ? { path: route, oid: '', text: '{}\n' } : undefined);
  if (!found || !file)
    return (
      <Screen title={t.app.notFound} back={{ href: '#', label: siteName }}>
        <EmptyNote>{t.app.nothingAt(route)}</EmptyNote>
      </Screen>
    );
  if (found.collection.kind === 'markdown') return <EntryForm collection={found.collection} file={file} env={env} />;
  return <DataForm collection={found.collection} dataFile={found.dataFile} file={file} env={env} />;
}
