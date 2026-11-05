// The account screen (who is signed in, AccountRow) and the start screen of the editor (empty but for its title, status and FAB) and the
// list of each part: blog posts newest first, the rest by name, prices and testimonials in their order
// on the site (with arrows to move them), and a search. Lists that are not in an order of their own can
// be sorted another way (a list of kinds, by its kinds too); the choice is kept in this browser. Pages
// and posts can be filtered by their status and by what they pick (a post's tags), a list of what is
// shown on pages (Promovering) by a page, its kind and whether it is on, as "Filer" (Filters). In a list that can be deleted from, the clock in the top bar ("Slettede …") opens
// what was deleted (Deleted.tsx), as in "Filer". The tabs the apps installed add to a list (AppDefinition.tabs, Cookiescanner's
// "Problemer" on "Cookies") are in its top app bar after the list's own, each at #list/<list>/<app>. "Use theme" and the move arrows show the
// loading indicator while they run (only the pressed one).
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowsDownUp,
  ArrowUp,
  Check,
  ClockCounterClockwise,
  CircleHalf,
  FileText,
  GoogleLogo,
  List as ListIcon,
  ListBullets,
  Moon,
  Palette,
  Plus,
  Ruler,
  Shapes,
  SignOut,
  Sun,
  type Icon,
} from '@phosphor-icons/react';
import { byText, entryData, type Collection, type Part, type PartScreen } from './schema';
import { config, countsOf, header, relationsOf, siteName } from '@site/editor';
import { iconPack, iconPacks } from './iconPacks';
import { theme, themes, type ThemeInfo } from './themes';
import { StartFab } from './StartFab';
import { StartStatus } from './StartStatus';
import {
  appearance,
  backFrom,
  blockGroups,
  blockParts,
  collections,
  companyParts,
  icons,
  lists,
  listsShown,
  partScreens,
  seoParts,
} from './site';
import { readFields, splitFrontmatter } from './frontmatter.mjs';
import { ConflictError, type RepoFile, type Viewer } from './github';
import { AccountRow } from './AccountRow';
import Screen from './Screen';
import {
  ImageCarousel,
  InputChip,
  Choice,
  Filters,
  ChoiceListItem,
  Group,
  IconButton,
  LeadingIcon,
  NewChoice,
  SearchRow,
  useKept,
  SegmentedButton,
  UnfoldButton,
  GroupTitle,
  SwitchRow,
  IconLink,
  ScoreRing,
  scoreOf,
  Button,
  EmptyNote,
  ChoiceRow,
  ColorSwatches,
  IconSwatches,
  ListItem,
} from './ui';
import { openAtSeo } from './EntryForm';
import { isRated } from './SeoScores';
import { fileRating } from './seo';
import { dateName, headed, letterOf } from './Sheet';
import type { Env } from './App';
import { kindAndName, savedText } from './deploy';
import { shortDate, when } from './when';
import { untilTime } from '../lib/notice.mjs';
import { savedTheme, setTheme, shownMode, type Theme } from './theme';
import { browserLocale, locale, localeName, locales, savedLocale, setLocale, siteLocale, siteT, siteText, t, type Locale } from './i18n';
import { appType, EDITOR_TYPES, setDevice, setOn, useNotificationChoices } from './notificationData';
import { snackbar } from '../lib/snackbar';
import { ask } from './ask';
import { pagesWith } from './BlockSettings';
import { filesOf, mediaOf } from './Media';
import { restorable } from './Deleted';
import { installedApps, kindsOffered, tabsOf } from './apps';
import { appPartsIn, DeveloperRow } from './AppList';
import { kindLists } from './BlockParts';
import {
  chosenPack,
  chosenTheme,
  ThemePicture,
  ThemeStoreButtons,
  themeInstalled,
  themePending,
  themeUpdateOf,
  useThemeCatalog,
} from './ThemeStore';
import { STANDARD_THEME, STORE_ROUTE } from './store';
import { REDIRECTS_ROUTE } from './Redirects';
import { MOTION_SCHEMES, schemeInUse, type MotionScheme } from '../lib/motion';
import { applyMotion } from './theme';
import { colorsOf } from './Colors';
import { OwnerLicenses } from './Licenses';
import { CMS_ROUTE } from './CmsPage';
import { apps } from './site';
import { offBlocks } from './registry';
import { sideChoicesOf, sideSettingOf } from './SideColumn';

// Where a part opens: its list, or the file itself when it is one file (the menu).
export const hrefOf = (c: Collection) => (c.kind === 'files' && c.files.length === 1 ? `#${c.files[0].file}` : `#list/${c.id}`);

const countOf = (c: Collection, files: RepoFile[]): number =>
  c.kind === 'files' ? c.files.length : files.filter((f) => f.path.startsWith(`${c.folder}/`)).length;

// A part's name, where it opens, and how many entries it has (null for one file): for the main drawer (MainMenu.tsx).
export function partOf(id: string, files: RepoFile[]): { label: string; href: string; count: number | null } {
  const { parts } = t.common;
  if (id === 'company') return { label: parts.company, href: '#company', count: null };
  if (id === 'header') return { label: parts.header, href: '#appearance/header', count: null };
  if (id === 'footer') return { label: parts.footer, href: '#appearance/footer', count: null };
  if (id === 'lists') return { label: parts.lists, href: '#lists', count: listsShown(files).length };
  if (id === 'blocks') return { label: parts.blocks, href: '#blocks', count: blockParts.length };
  if (id === 'files') return { label: parts.media, href: '#files', count: mediaOf(files).length + filesOf(files).length };
  if (id === 'appearance') return { label: parts.appearance, href: '#appearance', count: null };
  if (id === 'block-settings') return { label: parts.blockSettings, href: '#block-settings', count: null };
  if (id === 'apps') return { label: parts.apps, href: '#apps', count: null };
  if (id === 'appstore') return { label: t.apps.find, href: `#${STORE_ROUTE}`, count: null };
  if (id === 'redirects') return { label: parts.redirects, href: `#${REDIRECTS_ROUTE}`, count: null };
  const seoPart = seoParts.find((p) => p.id === id);
  if (seoPart) return { label: seoPart.label, href: `#seo/${id}`, count: null };
  // The screens under "Udseende" (Theme): the ones the editor has, then the site's own (appearance).
  const appearanceLabel = {
    themes: parts.themes,
    ikonpakker: parts.iconPacks,
    bevaegelse: parts.motion,
    sidekolonne: parts.sideColumn,
    colors: parts.colors,
    logo: parts.brand,
    dele: parts.editorParts,
  }[id];
  const appearancePart = appearanceLabel ?? appearance.find((p) => p.id === id)?.label;
  if (appearancePart) return { label: appearancePart, href: `#appearance/${id}`, count: null };
  // The parts of a screen with parts ("Privatliv"): where each opens, or its screen's address with its id.
  for (const screen of partScreens) {
    const own = screen.parts.find((p) => p.id === id);
    if (own) return { label: own.label, href: own.href ?? `#${screen.id}/${id}`, count: null };
  }
  if (id === 'morpheme') return { label: parts.morpheme, href: `#${CMS_ROUTE}`, count: null };
  if (id === 'advanced') return { label: parts.advanced, href: '#advanced', count: null };
  if (id === 'licenses') return { label: parts.licenses, href: '#licenses', count: null };
  const screen = partScreens.find((s) => s.id === id);
  if (screen) return { label: screen.label, href: `#${id}`, count: null };
  if (id === 'seo') return { label: parts.seo, href: '#seo', count: null };
  const c = collections.find((x) => x.id === id)!;
  return { label: c.label, href: hrefOf(c), count: c.kind === 'files' && c.files.length === 1 ? null : countOf(c, files) };
}

/** The parts of a group on a screen with parts (Parts), A–Å by their names in the editor's language. */
export const partsIn = (ids: string[], files: RepoFile[]) =>
  ids.map((id) => ({ id, ...partOf(id, files) })).sort((a, b) => byText(a.label, b.label));

export { LeadingIcon };

// A part of the site as a row: its icon, its name and how many entries it has.
function PartRow({ id, label, href, count }: { id: string } & ReturnType<typeof partOf>) {
  return <ListItem href={href} icon={icons[id]} headline={label} count={count} arrow />;
}

// The start screen: the site's name, the CMS version and when the site was last updated (built on Cloudflare, App.tsx), as StartStatus.tsx shows them, under it, and the FAB
// menu for a new page or post (StartFab.tsx). The parts of the site are in the main drawer (MainMenu.tsx); the rest is left empty for now.
export function Start({ builtAt }: { builtAt: Date | null }) {
  return (
    <Screen
      title={siteName}
      wide
      status={<StartStatus builtAt={builtAt} />}
      // The link to the website in the top bar (Screen.tsx).
      home
    >
      <StartFab />
    </Screen>
  );
}

// "Virksomheden": its parts (CompanyForm.tsx), each on a screen of its own; or one of them with parts
// of its own ("Betaling"), and the settings of the apps installed of its kinds (Part.apps: MobilePay), going back to
// "Virksomheden".
export function Company({ part, files }: { part?: Part; files: RepoFile[] }) {
  if (part?.parts)
    return (
      <Parts
        title={part.label}
        route={`company/${part.id}`}
        parts={[...part.parts, ...appPartsIn(part, files)]}
        back={{ href: '#company', label: t.common.parts.company }}
      />
    );
  return <Parts title={t.common.parts.company} route="company" parts={companyParts} />;
}

// "Udseende": first "Temaer" (Themes), with the theme the site is built with at the end of its row (or, after a swap,
// until the site is built with the new one, that one), "Ikonpakker" (IconPacks), with the pack chosen, "Bevægelse"
// (MotionSchemes), with the scheme chosen, and "Sidekolonne" (SideColumn.tsx), with the block chosen; then how the
// site looks, the colours (Colors.tsx), the logo and icon (BrandForm.tsx), the header with its menus and its preview
// (HeaderSettings.tsx), the footer with its preview (FooterSettings.tsx) and the site's own parts there (appearance in packages/editor/defaults/editor.ts: "Standardsider", a
// screen of its own, CompanyForm.tsx, going back here), and how the editor and the blocks look, their parts ("Dele", PartsHome), each on a
// screen of its own, with the icons the site gives them.
// The blocks that can be put in are under "Blokke" ("Blokindstillinger", BlockSettings.tsx).
export function Theme({ files }: { files: RepoFile[] }) {
  const chosen = themes.find((x) => x.id === chosenTheme(files)) ?? theme;
  const parts: Part[] = [
    { id: 'themes', label: t.common.parts.themes, icon: icons.themes, detail: chosen.name },
    {
      id: 'ikonpakker',
      label: t.common.parts.iconPacks,
      icon: icons.ikonpakker,
      detail: iconPacks.find((x) => x.id === chosenPack(files))?.name,
    },
    { id: 'bevaegelse', label: t.common.parts.motion, icon: icons.bevaegelse, detail: t.library.motionSchemes[motionOf(files)] },
    {
      id: 'sidekolonne',
      label: t.common.parts.sideColumn,
      icon: icons.sidekolonne,
      detail: sideChoicesOf(files).find((x) => x.type === sideSettingOf(files))?.label ?? t.library.sideNone,
    },
    { id: 'colors', label: t.common.parts.colors, icon: icons.colors, trailing: <ThemeColors files={files} /> },
    { id: 'logo', label: t.common.parts.brand, icon: icons.logo },
    { id: 'header', label: t.common.parts.header, icon: icons.header },
    { id: 'footer', label: t.common.parts.footer, icon: icons.footer },
    ...appearance,
    { id: 'dele', label: t.common.parts.editorParts, icon: icons.dele },
  ];
  return <Parts title={t.common.parts.appearance} route="appearance" parts={parts} back={backFrom('appearance')} />;
}

/** By "Farver": the site's primary, secondary and tertiary colours (accent, secondary, tertiary) in the mode the editor
 * is shown in, as the site has them. */
function ThemeColors({ files }: { files: RepoFile[] }) {
  const mode = shownMode();
  const colors = colorsOf(files)[mode];
  return (
    <ColorSwatches colors={['accent', 'secondary', 'tertiary'].map((n) => colors[n])} label={t.colors.pages.swatches(t.colors[mode])} />
  );
}

const backToAppearance = { href: '#appearance', label: t.common.parts.appearance };
const backToThemes = { href: '#appearance/themes', label: t.common.parts.themes };

/** Under a theme's name: whether the site is built with it ("I brug") or is changing to it ("Skifter hertil"). */
function themeStatus(id: string, files: RepoFile[]): string | undefined {
  if (id === theme.id) return t.library.themeInUse;
  if (id === chosenTheme(files)) return t.library.themeNext;
}

/** "Temaer" (#appearance/themes): the themes installed (src/themes/, packages/editor/src/themes.ts; and one from the store the site's build
 * does not have yet, as "Installeres…"), by name, each with its picture, its version and who made it, and whether it is
 * in use or the store has a newer version, opening its page (ThemePage). More are in "Appstore", under "Indstillinger". */
export function Themes({ env, files }: { env: Env; files: RepoFile[] }) {
  const catalog = useThemeCatalog(env);
  const store = Array.isArray(catalog) ? catalog : [];
  const rows = [...themes.filter((x) => themeInstalled(x.id)), ...store.filter((x) => themePending(x.id))].sort((a, b) =>
    byText(a.name, b.name),
  );
  return (
    <Screen title={t.common.parts.themes} wide back={backToAppearance}>
      <Group>
        {rows.map((x) => {
          const installed = themes.find((y) => y.id === x.id);
          const status = !installed
            ? t.apps.pending
            : (themeStatus(x.id, files) ?? (themeUpdateOf(installed, catalog) ? t.apps.updateFound : undefined));
          return (
            <ListItem
              key={x.id}
              href={`#appearance/themes/${x.id}`}
              leading={<ThemePicture src={x.icon} />}
              headline={x.name}
              supporting={t.library.themeByline(x.version, x.author)}
              truncate
              count={status}
              arrow
            />
          );
        })}
      </Group>
    </Screen>
  );
}

/** "Ikonpakker" (#appearance/ikonpakker): the icon packs installed (the system's own, packages/editor/icons/, and those the themes
 * installed bring; iconPacks.ts), by name, each with who made it, its licence, the theme it came with and a few of its
 * icons as they are, the one chosen ticked (chosenPack), with "I brug" by the one the site and the editor are built with
 * and "Skifter hertil …" by the one chosen until they are. A tap on another asks first and then saves it in the site's
 * file (config.icons) at once, in its own commit, as a theme is; the site and the editor have its icons after the
 * next build (themePlugin in packages/editor/site/theme.mjs). */
export function IconPacks({ env, files }: { env: Env; files: RepoFile[] }) {
  const [saving, setSaving] = useState(false);
  const chosen = chosenPack(files);
  const shown = iconPacks.filter((x) => !x.theme || themeInstalled(x.theme));

  async function choose(id: string, name: string) {
    if (saving || id === chosen) return;
    if (!(await ask(t.library.changeIconPackAsk(name), t.library.changeIconPack))) return;
    const path = config.icons;
    const file = files.find((f) => f.path === path);
    const text = `${JSON.stringify({ pack: id }, null, 2)}\n`;
    setSaving(true);
    env.notify({ text: t.common.saving });
    try {
      const change = t.app.changes.chosen(kindAndName(t.app.changes.iconPack, name));
      const oids = await env.commit(siteT.library.iconPackCommit(name), [{ path, content: text, oid: file?.oid || null }], change);
      env.onSaved({ path, oid: oids[path], text });
      env.notify({ text: t.library.iconPackSaved(capital(change)), kind: 'saved' });
    } catch (e) {
      env.notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen title={t.common.parts.iconPacks} wide back={backToAppearance}>
      <Group>
        {shown.map((x) => {
          const status = x.id === iconPack ? t.library.iconPackInUse : x.id === chosen ? t.library.iconPackNext : undefined;
          const from = x.theme && themes.find((y) => y.id === x.theme)?.name;
          return (
            <ChoiceRow
              key={x.id}
              selected={x.id === chosen}
              trailing={<IconSwatches icons={x.samples} label={t.library.iconPackSamples(x.name)} />}
              onClick={() => choose(x.id, x.name)}
              headline={x.name}
              supporting={
                <>
                  {t.library.iconPackByline(x.author, x.license)}
                  {from && <span className="block">{t.library.iconPackFrom(from)}</span>}
                  {status && <span className="block">{status}</span>}
                </>
              }
            />
          );
        })}
      </Group>
    </Screen>
  );
}

/** How the site moves (lib/motion.ts): the scheme chosen in the site's file (config.motion, `{ "scheme": "<scheme>" }`),
 * as it is saved, else the theme the editor is built with's ("motion" in its theme.json), else the standard theme's. */
export function motionOf(files: RepoFile[]): MotionScheme {
  let scheme: unknown;
  try {
    scheme = JSON.parse(files.find((f) => f.path === config.motion)?.text ?? '{}').scheme;
  } catch {}
  return schemeInUse(scheme, theme.motion, themes.find((x) => x.id === STANDARD_THEME)?.motion);
}

/** "Bevægelse" (#appearance/bevaegelse): Material 3's motion schemes and our calm one (lib/motion.ts), each with how it
 * moves, the one in use ticked (motionOf) and "Temaets valg" by the theme's own. A tap on another asks first and then
 * saves it in the site's file (config.motion) at once, in its own commit, as an icon pack is; the editor moves by it at
 * once (applyMotion, App.tsx), the site after it is built. */
export function MotionSchemes({ env, files }: { env: Env; files: RepoFile[] }) {
  const [saving, setSaving] = useState(false);
  const chosen = motionOf(files);
  const ofTheme = schemeInUse(undefined, theme.motion, themes.find((x) => x.id === STANDARD_THEME)?.motion);

  async function choose(scheme: MotionScheme) {
    if (saving || scheme === chosen) return;
    const name = t.library.motionSchemes[scheme];
    if (!(await ask(t.library.changeMotionAsk(name), t.library.changeMotion))) return;
    const path = config.motion;
    const file = files.find((f) => f.path === path);
    const text = `${JSON.stringify({ scheme }, null, 2)}\n`;
    setSaving(true);
    env.notify({ text: t.common.saving });
    try {
      const change = t.app.changes.chosen(kindAndName(t.app.changes.motion, name));
      const oids = await env.commit(
        siteT.library.motionCommit(siteT.library.motionSchemes[scheme]),
        [{ path, content: text, oid: file?.oid || null }],
        change,
      );
      env.onSaved({ path, oid: oids[path], text });
      applyMotion(scheme);
      env.notify({ text: t.library.motionSaved(capital(change)), kind: 'saved' });
    } catch (e) {
      env.notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen title={t.common.parts.motion} wide back={backToAppearance}>
      <Group>
        {MOTION_SCHEMES.map((scheme) => (
          <ChoiceRow
            key={scheme}
            selected={scheme === chosen}
            onClick={() => choose(scheme)}
            headline={t.library.motionSchemes[scheme]}
            supporting={
              <>
                {t.library.motionHints[scheme]}
                {scheme === ofTheme && <span className="block">{t.library.motionOfTheme}</span>}
              </>
            }
          />
        ))}
      </Group>
    </Screen>
  );
}

/** A theme's page (#appearance/themes/<id>), the same for every theme, made to show what it would make of the site, so
 * it can be chosen or not: its picture, name, version and who made it, and whether it is in use; "Brug temaet", for any
 * other than the one chosen, which asks first and then saves it in the site's file (config.theme) at once, in its own
 * commit, and the site is built with it; the pictures of the site in it (its screenshots/, packages/editor/scripts/theme-screenshots.mjs),
 * each opening a sheet with it whole (ImageCarousel); what it is (its description) and what it gives the site (its highlights), in the
 * editor's language, else the first it has; and what stays as it is. Every theme has every block (what it does not draw
 * itself, the standard theme does), so changing it never leaves a block without its drawing; who made it, a row to their
 * page; and, from the store, "Opdater til …" and "Afinstaller" (ThemeStoreButtons). */
export function ThemePage({ of, env, files }: { of: ThemeInfo; env: Env; files: RepoFile[] }) {
  const [saving, setSaving] = useState(false);
  const chosen = chosenTheme(files);
  const status = of.id === chosen && of.id !== theme.id ? t.library.themeChanging(of.name) : themeStatus(of.id, files);
  const inLocale = <T,>(x?: Record<string, T>) => x && (x[locale] ?? Object.values(x)[0]);
  const description = inLocale(of.description);
  const highlights = inLocale(of.highlights) ?? [];
  const shotName = (key: string) => t.library.themeShots[key] ?? of.name;
  const kept: [Icon, string][] = [
    [FileText, t.library.themeKeptContent],
    [Palette, t.library.themeKeptBrand],
    [Shapes, t.library.themeKeptBlocks],
  ];

  async function use() {
    if (!(await ask(t.library.changeThemeAsk(of.name), t.library.changeTheme))) return;
    const path = config.theme;
    const file = files.find((f) => f.path === path);
    const text = `${JSON.stringify({ theme: of.id }, null, 2)}\n`;
    setSaving(true);
    env.notify({ text: t.common.saving });
    try {
      const change = t.app.changes.chosen(kindAndName(t.app.changes.theme, of.name));
      const oids = await env.commit(siteT.library.themeCommit(of.name), [{ path, content: text, oid: file?.oid || null }], change);
      env.onSaved({ path, oid: oids[path], text });
      env.notify({ text: savedText(change), kind: 'saved' });
    } catch (e) {
      env.notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen title={of.name} wide back={backToThemes}>
      <div className="mb-8 flex items-center gap-4 px-4">
        <img src={of.icon} alt="" className="size-16 shrink-0 rounded-2xl" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{of.name}</span>
          <span className="block truncate text-sm text-muted">{t.library.themeByline(of.version, of.author)}</span>
          {status && <span className="block text-sm text-muted">{status}</span>}
        </span>
      </div>
      {of.id !== chosen && themeInstalled(of.id) && (
        <div className="mb-8">
          <Button busy={saving} disabled={saving} onClick={use}>
            {t.library.useTheme}
          </Button>
        </div>
      )}
      <ThemeStoreButtons of={of} env={env} files={files} top />
      {of.screenshots.length > 0 && (
        <section className="mb-8">
          <GroupTitle>{t.library.themeLooks}</GroupTitle>
          <ImageCarousel label={t.library.themeLooks} images={of.screenshots.map((x) => ({ src: x.src, label: shotName(x.key) }))} />
        </section>
      )}
      {description && (
        <section className="mb-8">
          <GroupTitle>{t.library.themeAbout}</GroupTitle>
          <p className="px-4">{description}</p>
        </section>
      )}
      {highlights.length > 0 && (
        <Group title={t.library.themeHighlights}>
          {highlights.map((h) => (
            <ListItem key={h} icon={Check} headline={h} />
          ))}
        </Group>
      )}
      <Group title={t.library.themeKept}>
        {kept.map(([glyph, text]) => (
          <ListItem key={text} icon={glyph} headline={text} />
        ))}
      </Group>
      <OwnerLicenses id={`tema/${of.id}`} name={of.name} author={of.author} version={of.version} declared={of} />
      <DeveloperRow name={of.author} />
      <ThemeStoreButtons of={of} env={env} files={files} />
    </Screen>
  );
}

/** "Dele" (#appearance/dele): the parts the editor and the site are built of, each on a screen of its own: the editor's
 * (Parts.tsx), the theme's UI components, the blocks (the standard ones and the apps') and each list of kinds
 * ("Promovering", its own kinds and the apps'), as the theme shows them (BlockParts.tsx), and the theme's design tokens ("Værdier", Tokens.tsx). */
export function PartsHome() {
  const parts: Part[] = [
    { id: 'editor', label: t.parts.screens.editor, icon: icons.dele },
    { id: 'ui', label: t.parts.screens.components, icon: icons.appearance },
    { id: 'blocks', label: t.parts.screens.blocks, icon: icons.blocks },
    ...kindLists().map((c) => ({ id: `list/${c.id}`, label: c.label, icon: icons[c.id] ?? icons.lists })),
    { id: 'vaerdier', label: t.parts.screens.values, icon: Ruler },
  ];
  return <Parts title={t.common.parts.editorParts} route="appearance/dele" parts={parts} back={backToAppearance} />;
}

/** "Søgemaskineoptimering" (#seo), no longer in the menu: "Videresendelser" (Redirects.tsx, #seo/redirects) and then
 * the site's own parts (seoParts: "Interne links"), each on a screen of its own (CompanyForm.tsx). "SEO-vurdering"
 * (SeoScores.tsx, #seo/vurdering) is hidden: nothing links to it. */
export function Seo() {
  const parts: Part[] = [{ id: 'redirects', label: t.common.parts.redirects, icon: icons.redirects }, ...seoParts];
  return <Parts title={t.common.parts.seo} route="seo" parts={parts} back={backFrom('seo')} />;
}

// A screen with parts of the site's own (partScreens): "Privatliv"; and with the settings of the apps installed with its
// category (PartScreen.apps): "Analytics" and "Promovering", each opening the app's form (#analytics/google-analytics).
export function PartsScreen({ screen, files }: { screen: PartScreen; files: RepoFile[] }) {
  const parts = [...screen.parts, ...appPartsIn(screen, files)];
  return (
    <Parts title={screen.label} route={screen.id} parts={parts} back={backFrom(screen.id)}>
      {!parts.length && <EmptyNote>{t.apps.noneHere}</EmptyNote>}
    </Parts>
  );
}

// "Blokke": the blocks, each with the texts all its copies have (blockTexts.ts), in groups by where they come
// from: the standard blocks, the theme's and each app's under its name (blockGroups). Over them, as over the
// lists, a search by name, the order (by group, A–Å or Å–A, kept in this browser; A–Å under the first letter)
// and the funnel with the filters by group and by whether the block is on a page, each picked one as a chip.
type BlockSort = 'group' | 'az' | 'za';
const BLOCK_SORTS: BlockSort[] = ['group', 'az', 'za'];
const BLOCK_SORT_KEY = 'editor-sort-blocks';
type Use = '' | 'used' | 'unused';

export function Blocks({ files }: { files: RepoFile[] }) {
  const [query, setQuery] = useKept('blocks-soeg', '');
  const [sort, setSort] = useState<BlockSort>(() => {
    try {
      const saved = localStorage.getItem(BLOCK_SORT_KEY);
      if (BLOCK_SORTS.some((s) => s === saved)) return saved as BlockSort;
    } catch {}
    return 'group';
  });
  const [group, setGroup] = useKept('blocks-gruppe', '');
  const [use, setUse] = useKept<Use>('blocks-brug', '');
  // The blocks on a page (any copy, also a hidden one), by their type (a part's id).
  const used = useMemo(() => new Set(blockParts.filter((p) => pagesWith(p.id, files).length).map((p) => p.id)), [files]);
  const bothUses = blockParts.some((p) => used.has(p.id)) && blockParts.some((p) => !used.has(p.id));
  const shownUse = bothUses ? use : '';
  const shownGroup = blockGroups.some((g) => g.title === group) ? group : '';

  function pickSort(next: BlockSort) {
    setSort(next);
    try {
      localStorage.setItem(BLOCK_SORT_KEY, next);
    } catch {}
  }

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const fits = (p: Part) =>
    words.every((w) => p.label.toLowerCase().includes(w)) && (!shownUse || used.has(p.id) === (shownUse === 'used'));
  const inGroups = blockGroups
    .filter((g) => !shownGroup || g.title === shownGroup)
    .map((g) => ({ title: g.title, parts: g.parts.filter(fits) }))
    .filter((g) => g.parts.length > 0);
  // A–Å or Å–A: all in one list, under the first letter of their names (headed, from HEADINGS_FROM).
  const lettered =
    sort === 'group'
      ? []
      : headed(
          inGroups.flatMap((g) => g.parts).sort((a, b) => (sort === 'za' ? -1 : 1) * byText(a.label, b.label)),
          (p) => letterOf(p.label),
        );
  const useLabel = (u: Use) => (u === 'used' ? t.library.inUse : t.common.notInUse);
  const filters = [
    blockGroups.length > 1 && {
      title: t.library.groupFilter,
      value: shownGroup,
      options: [{ value: '', label: t.library.allGroups }, ...blockGroups.map((g) => ({ value: g.title, label: g.title }))],
      onChange: setGroup,
    },
    bothUses && {
      title: t.library.useFilter,
      value: shownUse,
      options: [
        { value: '', label: t.library.allUses },
        { value: 'used', label: useLabel('used') },
        { value: 'unused', label: useLabel('unused') },
      ],
      onChange: (v: string) => setUse(v as Use),
    },
  ].filter((g) => !!g);
  // Each filter picked, as a chip that removes it.
  const chips = [
    shownGroup && { key: 'group', label: shownGroup, clear: () => setGroup('') },
    shownUse && { key: 'use', label: useLabel(shownUse), clear: () => setUse('') },
  ].filter((c) => !!c);

  return (
    <Screen title={t.common.parts.blocks} wide back={{ href: '#', label: siteName }}>
      <SearchRow
        value={query}
        onChange={setQuery}
        label={t.common.searchIn(t.common.parts.blocks)}
        sort={
          <Choice
            title={t.library.sort}
            icon={ArrowsDownUp}
            value={sort}
            options={BLOCK_SORTS.map((s) => ({ value: s, label: t.library.sorts[s] }))}
            onChange={pickSort}
          />
        }
        filter={filters.length > 0 && <Filters title={t.library.filter} selected={chips.length > 0} groups={filters} />}
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
      {!inGroups.length ? (
        <p className="mb-8 px-1 text-muted">{t.common.noMatch}</p>
      ) : sort === 'group' ? (
        inGroups.map((g) => <PartGroup key={g.title} title={g.title} route="blocks" parts={g.parts} />)
      ) : (
        lettered.map((g) => <PartGroup key={g.key ?? 'all'} title={g.key ?? undefined} route="blocks" parts={g.items} />)
      )}
    </Screen>
  );
}

// A screen with parts, each opening its own screen at #<route>/<part>; `children` over them. It goes back
// to the start screen, or to `back`.
function Parts({
  title,
  route,
  parts,
  back = { href: '#', label: siteName },
  children,
}: {
  title: string;
  route: string;
  parts: Part[];
  back?: { href: string; label: string };
  children?: ReactNode;
}) {
  return (
    <Screen title={title} wide back={back}>
      {children}
      <PartGroup route={route} parts={parts} />
    </Screen>
  );
}

function PartGroup({ title, route, parts }: { title?: string; route: string; parts: Part[] }) {
  return (
    <Group title={title}>
      {parts.map((p) => (
        <ListItem
          key={p.id}
          href={p.href ?? `#${route}/${p.id}`}
          icon={p.icon}
          headline={p.label}
          count={p.detail}
          trailing={p.trailing}
          arrow
        />
      ))}
    </Group>
  );
}

// A screen with parts of the site as rows, under one on the start screen: "Lister" (the short lists: the site's,
// testimonials, and those of the apps installed, prices), A–Å as on the start screen.
function PartsOf({ title, ids, files }: { title: string; ids: string[]; files: RepoFile[] }) {
  return (
    <Screen title={title} wide back={{ href: '#', label: siteName }}>
      <Group>
        {partsIn(ids, files).map((p) => (
          <PartRow key={p.id} {...p} />
        ))}
      </Group>
    </Screen>
  );
}

export const Lists = ({ files }: { files: RepoFile[] }) => <PartsOf title={t.common.parts.lists} ids={listsShown(files)} files={files} />;

// The account: who is logged in, light or dark, the language, and "Log ud".
export function Account({ user, files, onLogout }: { user: Viewer | null; files: RepoFile[]; onLogout: () => void }) {
  return (
    // Titled with the name of the one logged in.
    <Screen title={user ? (user.name ?? user.login) : t.common.parts.account} back={{ href: '#', label: siteName }}>
      {/* Who is logged in, as plain text: nothing to tap. */}
      {user && (
        <div className="mb-8">
          <AccountRow user={user} supporting={t.library.githubAccount(user.login)} />
        </div>
      )}
      <section className="mb-8">
        <GroupTitle>{t.library.theme}</GroupTitle>
        <ThemePicker />
      </section>
      <LocalePicker />
      <NotificationChoices files={files} />
      <Group>
        <ListItem tone="accent" onClick={onLogout} leading={<SignOut size={20} />} headline={t.library.logOut} />
      </Group>
    </Screen>
  );
}

// "Notifikationer" (notificationData.ts): "På telefonen", a switch for each of the editor's types, and under the name of each
// installed app that sends any, a switch for each of its types (`notifications` in its index.ts).
function NotificationChoices({ files }: { files: RepoFile[] }) {
  const { off, device } = useNotificationChoices();
  const installed = installedApps(files);
  const choice = (type: string, label: string) => (
    <SwitchRow
      key={type}
      label={label}
      texts={[t.library.on, t.library.off]}
      selected={!off.includes(type)}
      onChange={(on) => setOn(type, on)}
    />
  );
  return (
    <>
      <section className="mb-8">
        <GroupTitle>{t.library.notifications}</GroupTitle>
        <div className="space-y-5 px-4">
          <SwitchRow
            label={t.library.onDevice}
            hint={t.library.onDeviceHint}
            texts={[t.library.on, t.library.off]}
            selected={device}
            onChange={async (on) => {
              if (!(await setDevice(on))) snackbar({ text: t.library.deviceBlocked, error: true });
            }}
          />
          {EDITOR_TYPES.map((type) => choice(type, t.library.notificationTypes[type]))}
        </div>
      </section>
      {apps
        .filter((a) => a.notifications && installed.includes(a.id))
        .map((app) => (
          <section key={app.id} className="mb-8">
            <GroupTitle>{siteText(app.label)}</GroupTitle>
            <div className="space-y-5 px-4">
              {Object.entries(app.notifications!.types).map(([id, label]) => choice(appType(app.id, id), siteText(label)))}
            </div>
          </section>
        ))}
    </>
  );
}

// Light, as the phone or computer is set (Auto, the default), or dark, as three buttons side by side.
function ThemePicker() {
  const [theme, pick] = useState(savedTheme);
  const choices: { value: Theme; label: string; icon: Icon }[] = [
    { value: 'light', label: t.library.themes.light, icon: Sun },
    { value: 'auto', label: t.library.themes.auto, icon: CircleHalf },
    { value: 'dark', label: t.library.themes.dark, icon: Moon },
  ];
  return (
    <SegmentedButton
      label={t.library.theme}
      value={theme}
      options={choices}
      onChange={(value) => {
        pick(value);
        setTheme(value);
      }}
    />
  );
}

// The editor's language: a row with the one chosen, which opens a sheet with Automatic (the browser's,
// else the site's; the default) and the languages, each by its own name, with a search that finds a
// language by that, by its name in the editor's language ("Danish") and by its code (da-DK). A choice
// opens the editor again in it.
function LocalePicker() {
  const picked = savedLocale();
  const choices: { value: Locale | 'auto'; label: string; lang?: string; words?: string }[] = [
    { value: 'auto', label: t.library.languageAuto(localeName(browserLocale() ?? siteLocale)) },
    ...locales.map((l) => ({ value: l, label: localeName(l), lang: l, words: `${localeName(l, locale)} ${l}` })),
  ];
  return (
    <Group>
      <ChoiceListItem
        title={t.library.language}
        value={picked}
        options={choices}
        search={t.library.languageSearch}
        onChange={(v) => v !== picked && setLocale(v)}
      />
    </Group>
  );
}

// path: a page's address, for the tree of pages. count: the number at the right of the row, as on the
// start screen (the blog posts with a tag).
type Item = {
  href: string;
  title: string;
  detail: string;
  date?: string;
  /** Kladde, Skjult or Planlagt (statusOf), before its date; an entry not yet looked through, what it says
   * (FolderCollection.fresh: "Ny"). */
  status?: string;
  /** Added by something else and not yet looked through (FolderCollection.fresh): at the top of the list. */
  fresh?: boolean;
  /** Which of them, or published: what the choices over the list show. */
  state?: State;
  file?: RepoFile;
  path?: string;
  count?: number | null;
  /** In a list of kinds: the name of its kind, for sorting by it. */
  kind?: string;
  /** In a list of what is shown on pages (FolderCollection.shownOn): on every page, or on these pages
   * and the posts with these tags. */
  shownOn?: { everywhere: boolean; pages: string[]; tags: string[] };
  /** In a list of what can be turned on and off (FolderCollection.onOff): whether it is on. */
  on?: boolean;
  /** Pages and posts: what is picked in each field that picks several (a post's tags), by the field's name; a list's
   * entries: the value of each field it is filtered by (FolderCollection.filters). */
  picks?: Record<string, string[]>;
};

// The statuses of a page or post (`status`, packages/editor/lib/status.mjs), in the order of the choices over the list.
type State = 'published' | 'draft' | 'unlisted' | 'scheduled';
const STATES: State[] = ['published', 'draft', 'unlisted', 'scheduled'];
const stateOf = (d: Record<string, unknown>): State =>
  d.status === 'draft' || d.status === 'unlisted' || d.status === 'scheduled' ? d.status : 'published';

// What a page or post is when not simply published (`status`, packages/editor/lib/status.mjs): "Kladde", "Skjult" or
// "Planlagt 1. nov. kl. 8.00".
function statusOf(d: Record<string, unknown>): string | undefined {
  if (d.status === 'draft') return t.library.status.draft;
  if (d.status === 'unlisted') return t.library.status.unlisted;
  if (d.status !== 'scheduled') return undefined;
  const at = untilTime(String(d.publishAt ?? ''));
  return at === null ? t.library.status.scheduled : t.library.status.scheduledAt(when(new Date(at)));
}

function itemsOf(collection: Collection, files: RepoFile[]): Item[] {
  if (collection.kind === 'files') return collection.files.map((f) => ({ href: `#${f.file}`, title: f.label, detail: f.view }));
  const own = files.filter((f) => f.path.startsWith(`${collection.folder}/`));
  if (collection.kind === 'markdown') {
    const items: Item[] = own
      .filter((f) => f.path.endsWith('.md'))
      .map((file) => {
        const d = readFields(splitFrontmatter(file.text).yaml);
        // Blog posts show their date; pages when they were last saved (`saved`, asked in List).
        const detail = collection.id === 'blog' ? String(d.date ?? '') : '';
        const date = collection.id === 'blog' ? detail : undefined;
        const path = String(d.path ?? `/${file.path.slice(collection.folder.length + 1).replace(/(\/index)?\.md$/, '')}/`);
        return {
          href: `#${file.path}`,
          title: String(d.title ?? file.path),
          detail,
          date,
          status: statusOf(d),
          state: stateOf(d),
          file,
          path,
          picks: Object.fromEntries(
            collection.fields
              .filter((f) => f.type === 'relation' && f.multiple)
              .map((f) => [f.name, Array.isArray(d[f.name]) ? (d[f.name] as unknown[]).map(String) : []]),
          ),
        };
      });
    return items.sort((a, b) => (collection.id === 'blog' ? b.detail.localeCompare(a.detail) : byText(a.title, b.title)));
  }
  const items = own
    .filter((f) => f.path.endsWith('.json'))
    .map((file) => ({ file, data: entryData(collection, file.text, files) }))
    .sort(
      (a, b) =>
        (collection.orderable ? Number(a.data.order) - Number(b.data.order) : 0) ||
        byText(collection.summary(a.data), collection.summary(b.data)),
    );
  // The number the site has for each entry (the places that use a tag).
  const count = countsOf(collection, files);
  // In a list of kinds, each entry says its kind beside its name (Pop op-vindue, Handlingslinje, Mailchimp).
  const kinds = collection.fields.find((f) => f.name === collection.kinds)?.options ?? [];
  const kindLabel = (data: Record<string, unknown>) =>
    kinds.find((o) => o.value === (data[collection.kinds!] ?? kinds[0]?.value))?.label ?? '';
  const on = collection.shownOn;
  const onOff = collection.fields.find((f) => f.name === collection.onOff);
  const fresh = collection.fresh;
  return items.map(({ file, data }) => ({
    href: `#${file.path}`,
    ...(fresh && data[fresh.field] === true ? { fresh: true, status: fresh.label(data) } : {}),
    // Without a name of its own (the contact bar), by its kind's name.
    title: collection.summary(data) || kindLabel(data),
    detail: collection.kinds ? kindLabel(data) : (collection.detail?.(data) ?? ''),
    picks: Object.fromEntries(
      (collection.filters ?? []).map(({ field: name }) => {
        const value = data[name] ?? collection.fields.find((f) => f.name === name)?.default;
        return [name, value == null || value === '' ? [] : [String(value)]];
      }),
    ),
    count: count(file),
    file,
    kind: collection.kinds ? kindLabel(data) : undefined,
    shownOn: on && {
      everywhere: !!on.everywhere && data[on.everywhere.field] === on.everywhere.is,
      pages: Array.isArray(data[on.pages]) ? (data[on.pages] as unknown[]).map(String) : [],
      tags: on.tags && Array.isArray(data[on.tags]) ? (data[on.tags] as unknown[]).map(String) : [],
    },
    on: onOff && (data[onOff.name] ?? onOff.default) !== false,
  }));
}

// The pages as the menu on the site has them (src/data/menu.json, "Hovedmenu"): each item of the menu, by
// the name it has there, with the page it goes to and the items under it; then the pages that are
// not in the menu, A–Å. A link to a part of a page (/kontakt/#find-vej) is that page; an item whose
// page is gone is shown without a link.
type Branch = { key: string; item: Item; children: Branch[] };
type MenuEntry = { label: string; href: string; children?: MenuEntry[] };
function menuOf(items: Item[], files: RepoFile[]): { menu: Branch[]; rest: Item[] } {
  let entries: MenuEntry[] = [];
  try {
    entries = JSON.parse(files.find((f) => f.path === config.menu)?.text ?? '{}').items ?? [];
  } catch {}
  const used = new Set<Item>();
  const branch = (e: MenuEntry, key: string): Branch => {
    const page = items.find((i) => i.path === e.href.replace(/#.*/, ''));
    if (page) used.add(page);
    return {
      key,
      item: { ...(page ?? { href: '', detail: '' }), title: e.label },
      children: (e.children ?? []).map((c, i) => branch(c, `${key}-${i}`)),
    };
  };
  const menu = entries.map((e, i) => branch(e, `m${i}`));
  return { menu, rest: items.filter((i) => !used.has(i)).sort((a, b) => byText(a.title, b.title)) };
}

// List or as the menu (pages), as picked last time in this browser.
type View = 'liste' | 'menu';
// Whether the pages and posts show their SEO rating ("Vis SEO-vurdering"), as left last time in this browser.
const seoKey = (c: Collection) => `editor-seo-${c.id}`;
function savedSeo(c: Collection): boolean {
  try {
    return localStorage.getItem(seoKey(c)) === 'vis';
  } catch {
    return false;
  }
}

const viewKey = (c: Collection) => `editor-view-${c.id}`;
function savedView(c: Collection): View {
  try {
    return localStorage.getItem(viewKey(c)) === 'menu' ? 'menu' : 'liste';
  } catch {
    return 'liste';
  }
}

// The items of the menu that are open (their pages under them shown), as left last time in this browser.
const openKey = (c: Collection) => `editor-menu-${c.id}`;
function savedOpen(c: Collection): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(openKey(c)) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

// When each page was last saved, kept while the editor is open. Asked again for a page whose file has
// changed since (another blob id), so a page just saved shows its new time.
const saved = new Map<string, { oid: string; date: Date }>();

// The ways a list can be sorted; by time only where the entries have one: blog posts by their date,
// pages by when they were last saved; by their kind where they have kinds (Promovering).
type Sort = 'nyeste' | 'aeldste' | 'az' | 'za' | 'type';
const sortLabel = (c: Collection, s: Sort) => {
  const { sorts } = t.library;
  return c.id === 'pages' && s === 'nyeste' ? sorts.savedNewest : c.id === 'pages' && s === 'aeldste' ? sorts.savedOldest : sorts[s];
};

const byTitle = (a: Item, b: Item) => byText(a.title, b.title);
const compare: Record<Sort, (a: Item, b: Item) => number> = {
  nyeste: (a, b) => (b.date ?? '').localeCompare(a.date ?? '') || byTitle(a, b),
  aeldste: (a, b) => (a.date ?? '').localeCompare(b.date ?? '') || byTitle(a, b),
  az: byTitle,
  za: (a, b) => byTitle(b, a),
  type: (a, b) => byText(a.kind ?? '', b.kind ?? '') || byTitle(a, b),
};

// The sorting picked for a list last time, in this browser.
const sortKey = (c: Collection) => `editor-sort-${c.id}`;

function savedSort(c: Collection, sorts: Sort[], first: Sort): Sort {
  try {
    const s = localStorage.getItem(sortKey(c)) as Sort | null;
    if (s && sorts.includes(s)) return s;
  } catch {}
  return first;
}

// "i dag kl. 13.42" as "I dag kl. 13.42", alone on its line.
const capital = (s: string) => s.charAt(0).toLocaleUpperCase(locale) + s.slice(1);

export function List({ collection, tab, files, env }: { collection: Collection; tab?: string; files: RepoFile[]; env: Env }) {
  // The kinds a new entry can be: the list's own and those of the apps installed and not turned off (apps.ts).
  const kinds = collection.kind === 'folder' ? kindsOffered(collection, apps, installedApps(files), offBlocks(files)) : [];
  // The tabs the apps installed add to it, and the one open (none: the list's own).
  const appTabs = tabsOf(collection.id, apps, installedApps(files));
  const appTab = appTabs.find((a) => a.app.id === tab);
  const [query, setQuery] = useKept(`${collection.id}-soeg`, '');
  // The move that runs (row and target row, null: none); only its arrow shows busy, all arrows stay disabled meanwhile.
  const [moving, setMoving] = useState<{ from: number; to: number } | null>(null);
  const busy = moving !== null;
  const items = useMemo(() => itemsOf(collection, files), [collection, files]);
  const pages = collection.id === 'pages';
  // Pages and posts: their address in a column on a computer, and a filter that shows only those with
  // one status (when they do not all have the same).
  const markdown = collection.kind === 'markdown';
  const [picked, setState] = useKept<State | ''>(`${collection.id}-status`, '');
  const states = markdown ? STATES.filter((s) => items.some((i) => i.state === s)) : [];
  // All again when the status picked is no longer there to pick (the last draft was published meanwhile).
  const state = states.length > 1 && states.includes(picked as State) ? picked : '';
  // Prices and testimonials are in their order on the site; the other lists of entries can be sorted.
  // Blog posts newest first, pages A–Å, until another is picked.
  const sorts: Sort[] =
    collection.kind === 'files' || (collection.kind === 'folder' && collection.orderable) || items.length < 2
      ? []
      : collection.id === 'blog' || pages
        ? ['nyeste', 'aeldste', 'az', 'za']
        : collection.kind === 'folder' && collection.kinds
          ? ['az', 'za', 'type']
          : ['az', 'za'];
  const [sort, setSort] = useState(() => savedSort(collection, sorts, pages ? 'az' : sorts[0]));
  // Pages and posts: the Google icon by the order shows the score of each one's SEO rating at the start of its row
  // (ScoreRing, the same as under "Søgemaskiner" and "SEO-vurdering"); a tap on the ring opens it there, on the rest of
  // the row at its top.
  const rated = isRated(collection);
  const [seo, setSeo] = useState(() => rated && savedSeo(collection));
  const scores = useMemo(
    () =>
      seo
        ? new Map(
            items.flatMap((i) =>
              i.file ? [[i.file.path, scoreOf(fileRating(i.file.text, collection.id === 'blog', env.relations))]] : [],
            ),
          )
        : null,
    [seo, items, env.relations],
  );
  const ring = (item: Item) => {
    const score = item.file ? scores?.get(item.file.path) : undefined;
    return score === undefined ? null : <ScoreRing score={score} label={t.seo.scoreLabel(score)} onClick={openAtSeo} />;
  };
  const [, setSavedLoaded] = useState(0);
  useEffect(() => {
    if (!pages) return;
    const missing = items.flatMap((i) => (i.file && saved.get(i.file.path)?.oid !== i.file.oid ? [i.file] : []));
    if (!missing.length) return;
    env.savedAt(missing.map((f) => f.path)).then(
      (times) => {
        for (const f of missing) if (times[f.path]) saved.set(f.path, { oid: f.oid, date: times[f.path] });
        setSavedLoaded((n) => n + 1);
      },
      () => {},
    );
  }, [items]);
  // A list of what is shown on pages: only those on one page or the posts of one tag (and those on every
  // page), picked among the pages and tags the entries are on, by their names (relationsOf), the tags
  // under a heading of their own (`tag:<slug>`); all again when that one is no longer among them.
  const [onPage, setOnPage] = useKept(`${collection.id}-side`, '');
  const pageNames = useMemo(() => {
    if (!items.some((i) => i.shownOn)) return [];
    const { pages: all, fixed, categories } = relationsOf(files);
    const pages = new Set(items.flatMap((i) => i.shownOn?.pages ?? []));
    const tags = new Set(items.flatMap((i) => i.shownOn?.tags ?? []));
    const onTags = categories.filter((c) => tags.has(c.value));
    return [
      ...[...fixed, ...all]
        .filter((p) => pages.has(p.value))
        .map((p) => ({ ...p, group: onTags.length ? t.library.pagesGroup : undefined })),
      ...onTags.map((c) => ({ value: `tag:${c.value}`, label: c.label, group: t.library.tagsGroup })),
    ];
  }, [items, files]);
  const page = pageNames.some((p) => p.value === onPage) ? onPage : '';
  // By the kind (when there are two or more) and by whether it is turned on (both, when there are both).
  const [kind, setKind] = useKept(`${collection.id}-type`, '');
  const kindNames = [...new Set(items.flatMap((i) => (i.kind ? [i.kind] : [])))].sort(byText);
  const shownKind = kindNames.length > 1 && kindNames.includes(kind) ? kind : '';
  const [onOff, setOnOff] = useKept<'' | 'on' | 'off'>(`${collection.id}-til`, '');
  // Pages and posts: by what is picked in each field that picks several (a post's tags), among those
  // picked in an entry, by their names (relationsOf); a list's entries by each field it is filtered by
  // (FolderCollection.filters: a cookie's provider), among the values they have, when they have two or more. All
  // again when the one picked is no longer among them.
  const [picks, setPicks] = useKept<Record<string, string>>(`${collection.id}-valgt`, {});
  const pickFilters = useMemo(() => {
    if (collection.kind === 'folder')
      return (collection.filters ?? []).flatMap(({ field: name, all }) => {
        const f = collection.fields.find((x) => x.name === name);
        const used = [...new Set(items.flatMap((i) => i.picks?.[name] ?? []))];
        if (!f || used.length < 2) return [];
        const options = used
          .map((value) => ({ value, label: f.options?.find((o) => o.value === value)?.label ?? value }))
          .sort((a, b) => byText(a.label, b.label));
        return [{ field: f, all, options, value: options.some((o) => o.value === picks[name]) ? picks[name] : '' }];
      });
    if (!markdown) return [];
    const relations = relationsOf(files);
    return collection.fields.flatMap((f) => {
      if (f.type !== 'relation' || !f.multiple || !f.to) return [];
      const used = new Set(items.flatMap((i) => i.picks?.[f.name] ?? []));
      const options = relations[f.to].filter((o) => used.has(o.value));
      return options.length
        ? [{ field: f, all: '', options, value: options.some((o) => o.value === picks[f.name]) ? picks[f.name] : '' }]
        : [];
    });
  }, [collection, items, files, picks]);
  const pick = (name: string, value: string) => setPicks({ ...picks, [name]: value });
  const onOffField = collection.kind === 'folder' ? collection.fields.find((f) => f.name === collection.onOff) : undefined;
  const onOffLabels = onOffField?.toggle;
  const bothOnOff = items.some((i) => i.on) && items.some((i) => i.on === false);
  const shownOnOff = onOffLabels && bothOnOff ? onOff : '';
  const filters = [
    states.length > 1 && {
      title: t.library.statusFilter,
      value: state,
      options: [{ value: '', label: t.library.statusShown.all }, ...states.map((s) => ({ value: s, label: t.library.statusShown[s] }))],
      onChange: (v: string) => setState(v as State | ''),
    },
    ...pickFilters.map((p) => ({
      title: p.field.label,
      value: p.value,
      options: [{ value: '', label: p.all || t.library.allOf(p.field.label) }, ...p.options],
      onChange: (v: string) => pick(p.field.name, v),
    })),
    pageNames.length > 0 && {
      title: t.library.pageFilter,
      value: page,
      options: [{ value: '', label: t.library.allPages }, ...pageNames],
      onChange: setOnPage,
    },
    kindNames.length > 1 && {
      title: t.library.kindFilter,
      value: shownKind,
      options: [{ value: '', label: t.library.allKinds }, ...kindNames.map((k) => ({ value: k, label: k }))],
      onChange: setKind,
    },
    onOffLabels &&
      bothOnOff && {
        title: t.library.onOffFilter,
        value: shownOnOff,
        options: [
          { value: '', label: t.library.allOnOff },
          { value: 'on', label: onOffLabels[0] },
          { value: 'off', label: onOffLabels[1] },
        ],
        onChange: (v: string) => setOnOff(v as typeof onOff),
      },
  ].filter((g) => !!g);
  // Each filter picked, as a chip that removes it.
  const chips = [
    state && { key: 'state', label: t.library.statusShown[state], clear: () => setState('') },
    ...pickFilters.flatMap((p) =>
      p.value
        ? [{ key: p.field.name, label: p.options.find((o) => o.value === p.value)?.label ?? p.value, clear: () => pick(p.field.name, '') }]
        : [],
    ),
    page && { key: 'page', label: pageNames.find((p) => p.value === page)?.label ?? page, clear: () => setOnPage('') },
    shownKind && { key: 'kind', label: shownKind, clear: () => setKind('') },
    shownOnOff && onOffLabels && { key: 'onOff', label: onOffLabels[shownOnOff === 'on' ? 0 : 1], clear: () => setOnOff('') },
  ].filter((c) => !!c);
  const q = query.trim().toLowerCase();
  // Pages get the time they were last saved as their date, once it has come.
  const dated = pages
    ? items.map((i) => {
        const t = i.file && saved.get(i.file.path);
        return t ? { ...i, date: t.date.toISOString() } : i;
      })
    : items;
  const found = dated.filter(
    (i) =>
      // With the line under it, when the list has one of its own (FolderCollection.detail).
      `${i.title}${collection.kind === 'folder' && collection.detail ? ` ${i.detail}` : ''}`.toLowerCase().includes(q) &&
      (!state || i.state === state) &&
      pickFilters.every((p) => !p.value || !!i.picks?.[p.field.name]?.includes(p.value)) &&
      (!page ||
        !!i.shownOn?.everywhere ||
        (page.startsWith('tag:') ? !!i.shownOn?.tags.includes(page.slice(4)) : !!i.shownOn?.pages.includes(page))) &&
      (!shownKind || i.kind === shownKind) &&
      (!shownOnOff || i.on === (shownOnOff === 'on')),
  );
  const shown = sorts.length ? [...found].sort(compare[sort]) : found;
  // Pages can be shown as the menu has them; a search or a filter always gives the list of what it finds.
  const [view, setView] = useState(() => savedView(collection));
  const tree = pages && view === 'menu' && !q && !chips.length ? menuOf(dated, files) : null;
  // The items of the menu whose pages under them are shown; all closed at first, kept in this browser.
  const [openBranches, setOpenBranches] = useState(() => savedOpen(collection));
  const orderable = collection.kind === 'folder' && collection.orderable && !q;

  function pickSort(s: Sort) {
    setSort(s);
    try {
      localStorage.setItem(sortKey(collection), s);
    } catch {}
  }

  function toggleBranch(href: string) {
    const next = new Set(openBranches);
    if (!next.delete(href)) next.add(href);
    setOpenBranches(next);
    try {
      localStorage.setItem(openKey(collection), JSON.stringify([...next]));
    } catch {}
  }

  function pickSeo(next: boolean) {
    setSeo(next);
    try {
      localStorage.setItem(seoKey(collection), next ? 'vis' : 'skjul');
    } catch {}
  }

  function pickView(v: View) {
    setView(v);
    try {
      localStorage.setItem(viewKey(collection), v);
    } catch {}
  }

  async function move(i: number, to: number) {
    const next = items.map((item) => item.file!);
    [next[i], next[to]] = [next[to], next[i]];
    setMoving({ from: i, to });
    env.notify({ text: t.library.savingOrder });
    try {
      env.notify({ text: savedText(await env.reorder(collection, next)), kind: 'saved' });
    } catch (e) {
      env.notify({ text: t.library.orderNotSaved((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setMoving(null);
    }
  }

  // The entries not yet looked through first, under a heading of their own (FolderCollection.fresh); the rest under
  // headings (headed, from HEADINGS_FROM entries): the first letter by name, the month by date, the kind by kind (none in
  // their own order, or while the pages' times are coming).
  const fresh = collection.kind === 'folder' && collection.fresh ? shown.filter((i) => i.fresh) : [];
  const groups = headed(fresh.length ? shown.filter((i) => !i.fresh) : shown, (item) =>
    !sorts.length
      ? ''
      : sort === 'type'
        ? (item.kind ?? '')
        : sort === 'az' || sort === 'za'
          ? letterOf(item.title)
          : (item.date ?? '').slice(0, 7),
  );
  const listRow = (item: Item) => {
    const i = shown.indexOf(item);
    return (
      <ListItem
        key={item.href}
        href={item.href}
        leading={ring(item)}
        headline={item.title}
        supporting={
          (markdown || pages || item.detail || item.status) && (
            <Under item={item} address={markdown}>
              {pages ? (
                <SavedTime item={item} />
              ) : (
                <>
                  <Status item={item} />
                  {collection.id === 'blog' ? shortDate(item.detail) : item.detail}
                </>
              )}
            </Under>
          )
        }
        truncate
        columns
        count={item.count}
        arrow={!orderable}
        actions={
          orderable && (
            <span className="flex shrink-0 pr-2">
              <IconButton
                icon={ArrowUp}
                label={t.common.moveUp}
                busy={moving?.from === i && moving.to === i - 1}
                disabled={i === 0 || busy}
                onClick={() => move(i, i - 1)}
              />
              <IconButton
                icon={ArrowDown}
                label={t.common.moveDown}
                busy={moving?.from === i && moving.to === i + 1}
                disabled={i === shown.length - 1 || busy}
                onClick={() => move(i, i + 1)}
              />
            </span>
          )
        }
      />
    );
  };
  const privacyScreen = partScreens.find((s) => s.id === 'privacy');
  return (
    <Screen
      title={collection.label}
      wide
      back={
        collection.id === config.lists.cookies && privacyScreen
          ? { href: `#${privacyScreen.id}`, label: privacyScreen.label }
          : lists.includes(collection.id)
            ? { href: '#lists', label: t.common.parts.lists }
            : header.includes(collection.id)
              ? { href: '#appearance/header', label: t.common.parts.header }
              : { href: '#', label: siteName }
      }
      tabs={
        appTabs.length > 0
          ? {
              label: collection.label,
              value: appTab?.app.id ?? '',
              options: [
                { value: '', label: collection.label, icon: icons[collection.id as keyof typeof icons] ?? ListIcon },
                ...appTabs.map((a) => ({ value: a.app.id, label: siteText(a.tab.label), icon: a.tab.icon })),
              ],
              onChange: (v) => (location.hash = v ? `list/${collection.id}/${v}` : `list/${collection.id}`),
            }
          : undefined
      }
      actions={
        <>
          {/* What was deleted from the list, as in "Filer". */}
          {restorable(collection) && (
            <IconButton
              icon={ClockCounterClockwise}
              label={t.history.deletedOf(collection.label)}

              onClick={() => (location.hash = `slettet/${collection.id}`)}
            />
          )}
          {/* Of more than one kind (a pop-up: Standard or an app's, e.g. Mailchimp): a sheet to pick it. */}
          {collection.create &&
            (kinds.length > 1 ? (
              <NewChoice title={collection.create} options={kinds} onChange={(kind) => (location.hash = `#ny/${collection.id}/${kind}`)} />
            ) : (
              <IconLink href={`#ny/${collection.id}`} label={collection.create!} icon={Plus} />
            ))}
        </>
      }
    >
      {/* An app's tab, drawn as its page. */}
      {appTab && (
        <div data-app-page={appTab.app.id}>
          <appTab.tab.page api={(path, init) => env.appApi(appTab.app.id, path, init)} />
        </div>
      )}
      {/* The search, in a long list and in every list that can be sorted or filtered (Promovering), with those. */}
      {!appTab && (items.length > 8 || sorts.length > 0 || filters.length > 0) && (
        <SearchRow
          value={query}
          onChange={setQuery}
          label={t.common.searchIn(collection.label)}
          sort={
            sorts.length > 0 && (
              // Greyed out while the pages are shown as the menu, which has its own order, so the buttons do not move.
              <Choice
                title={t.library.sort}
                icon={ArrowsDownUp}
                value={sort}
                disabled={!!tree}
                options={sorts.map((s) => ({ value: s, label: sortLabel(collection, s) }))}
                onChange={pickSort}
              />
            )
          }
          filter={filters.length > 0 && <Filters title={t.library.filter} selected={chips.length > 0} groups={filters} />}
          seo={
            rated && (
              <IconButton
                icon={GoogleLogo}
                label={seo ? t.library.hideSeo : t.library.showSeo}
                aria-pressed={seo}
                selected={seo}

                onClick={() => pickSeo(!seo)}
              />
            )
          }
          view={
            pages && (
              // The menu icon to show the pages as the menu has them, and then the list icon to go back.
              <IconButton
                icon={view === 'menu' ? ListBullets : ListIcon}
                label={view === 'menu' ? t.library.showAsList : t.library.showAsMenu}
                aria-pressed={view === 'menu'}

                onClick={() => pickView(view === 'menu' ? 'liste' : 'menu')}
              />
            )
          }
          className="mb-6"
        />
      )}
      {!appTab && chips.length > 0 && (
        <div className="-mt-2 mb-6 flex flex-wrap gap-2">
          {chips.map((c) => (
            <InputChip key={c.key} removeLabel={t.library.removeFilter(c.label)} onRemove={c.clear}>
              {c.label}
            </InputChip>
          ))}
        </div>
      )}
      {!appTab && tree && (
        <>
          <Group title={t.library.menu}>
            <TreeRows branches={tree.menu} depth={0} open={openBranches} toggle={toggleBranch} ring={scores ? ring : undefined} />
          </Group>
          {tree.rest.length > 0 && (
            <Group title={t.library.notInMenu}>
              <TreeRows
                branches={tree.rest.map((item) => ({ key: item.href, item, children: [] }))}
                depth={0}
                open={openBranches}
                toggle={toggleBranch}
                ring={scores ? ring : undefined}
              />
            </Group>
          )}
        </>
      )}
      {!appTab && !tree && fresh.length > 0 && collection.kind === 'folder' && (
        <Group title={collection.fresh!.heading}>{fresh.map(listRow)}</Group>
      )}
      {appTab || tree ? null : shown.length ? (
        groups.map((g) => (
          <Group
            key={g.key || 'all'}
            title={g.key ? (sort === 'type' || sort === 'az' || sort === 'za' ? g.key : dateName(g.key)) : undefined}
          >
            {g.items.map(listRow)}
          </Group>
        ))
      ) : (
        <p className="mb-8 px-1 text-muted">{t.common.noMatch}</p>
      )}
    </Screen>
  );
}

// What is under a row's name in a list (its supporting text; beside it on a computer, ListItem's `columns`): its status
// and date (`children`), at the right on a computer, and there a page's or post's address before them (`address`).
function Under({ item, address, children }: { item: Item; address?: boolean; children: ReactNode }) {
  return (
    <span className="flex gap-6">
      {address && <span className="hidden min-w-0 flex-1 truncate expanded:block">{item.path}</span>}
      <span className="min-w-0 truncate expanded:ml-auto expanded:shrink-0 expanded:text-right">{children}</span>
    </span>
  );
}

// A page's or post's status (Item.status) before its date or time.
const Status = ({ item }: { item: Item }) => (item.status ? <span className="mr-2 font-medium text-accent">{item.status}</span> : null);

// The time a page was last saved, under its name (a space until it has come, so rows do not jump).
function SavedTime({ item }: { item: Item }) {
  return (
    <>
      <Status item={item} />
      {item.file && saved.has(item.file.path) ? capital(when(saved.get(item.file.path)!.date)) : '\u00a0'}
    </>
  );
}

// The rows of the pages as the menu has them: each item, and under it, when it is opened with the
// arrow at the right of its row, the items under it, indented a step. An item without a page is not a link.
function TreeRows({
  branches,
  depth,
  open,
  toggle,
  ring,
}: {
  branches: Branch[];
  depth: number;
  open: Set<string>;
  toggle: (href: string) => void;
  /** With "Vis SEO-vurdering": the score of a page at the start of its row (a tap on it opens the page at its rating). */
  ring?: (item: Item) => ReactNode;
}) {
  return (
    <>
      {branches.map(({ key, item, children }) => {
        const shown = open.has(key);
        return (
          <Fragment key={key}>
            <ListItem
              href={item.href || undefined}
              tone={item.href ? undefined : 'muted'}
              // Indented a step under the item it is under, in the editor's segmented lists.
              style={depth ? { paddingInlineStart: `calc(var(--list-segmented-padding-inline, 1rem) + ${depth * 1.25}rem)` } : undefined}
              leading={ring?.(item)}
              headline={item.title}
              supporting={
                item.href ? (
                  <Under item={item} address>
                    <SavedTime item={item} />
                  </Under>
                ) : (
                  t.library.pageGone
                )
              }
              truncate
              columns
              actions={
                children.length > 0 && (
                  <span className="shrink-0 pr-1.5">
                    <UnfoldButton
                      open={shown}
                      count={children.length}
                      label={shown ? t.library.hideSubpagesOf(item.title) : t.library.showSubpagesOf(item.title)}
                      title={shown ? t.library.hideSubpages : t.library.showSubpages}
                      onClick={() => toggle(key)}
                    />
                  </span>
                )
              }
            />
            {shown && <TreeRows branches={children} depth={depth + 1} open={open} toggle={toggle} ring={ring} />}
          </Fragment>
        );
      })}
    </>
  );
}
