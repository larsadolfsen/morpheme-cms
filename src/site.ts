// The site as the editor shows it: what src/site/ describes (the collections and their fields, the
// menu's sections (groups), the screens under "Virksomheden" and "Blokke") with the site's texts in the
// editor's language (siteText, @site/texts). The editor takes these from here, not from
// @site/editor. A commit says what was saved in the site's language: asWritten gives back a
// collection, a file, a part or a block as the site wrote it.
import * as site from '@site/editor';
import type { ColorPair } from '../lib/colors';
import { appIdOf, installedApps, withKinds, type AppDefinition, type AppList, type SiteApp } from './apps';
import { appBlocks, appFiles, appFolders, appPictures, appShared, appStores } from './appFiles';
import type { BlockDefinition, SiteBlock } from './blocks';
import type { ListRows } from './fields';
import { inSiteLanguage, siteT, siteText, t, translatingSite } from './i18n';
import { byText, type Block, type Collection, type DataFile, type Edit, type Field, type OwnedList, type Part } from './schema';
import { blockTypeOf, type SharedTexts } from './shared';
import { appFolder, needsOf, SCREENSHOTS, shotFile } from './store';

const written = new WeakMap<object, object>();

/** A collection, a file, a part or a block as the site wrote it, in its language: for the commits. */
export const asWritten = <T extends object>(shown: T): T => (written.get(shown) as T | undefined) ?? shown;

// Only the keys a thing has, so it is the same as it was but for its texts. `link`: remember `from` as what it was written as.
function shownAs<T extends object>(from: T, texts: Partial<T>, link: boolean): T {
  const to = { ...from };
  for (const key of Object.keys(texts) as (keyof T)[]) if (from[key] !== undefined) to[key] = texts[key]!;
  if (link) written.set(to, from);
  return to;
}

/** The site's parts with every text of theirs said by `say`: the label, the hint, the link elsewhere,
 * the message of a pattern, the options, a switch's two words … of each field, block, file and part.
 * `sayWritten`: what asWritten gives back for each thing it returns, with its texts said by it (the standard parts'
 * English in the site's language, inSiteLanguage); without it, asWritten gives back the thing as it was. */
export function translator(say: (text: string) => string, sayWritten?: (text: string) => string) {
  const shownTexts = build(say, !sayWritten);
  if (!sayWritten) return shownTexts;
  const writtenTexts = build(sayWritten, false);
  const both =
    <A extends object>(one: (x: A) => A, said: (x: A) => A) =>
    (x: A): A => {
      const to = one(x);
      written.set(to, said(x));
      return to;
    };
  return {
    ...shownTexts,
    block: both(shownTexts.block, writtenTexts.block),
    collection: both(shownTexts.collection, writtenTexts.collection),
    part: both(shownTexts.part, writtenTexts.part),
    app: both(shownTexts.app, writtenTexts.app),
  } as typeof shownTexts;
}

function build(say: (text: string) => string, link: boolean) {
  const shown = <T extends object>(from: T, texts: Partial<T>): T => shownAs(from, texts, link);
  const maybe = (text?: string) => (text === undefined ? text : say(text));
  const edit = (e?: Edit) => e && { ...e, text: say(e.text) };
  const field = (f: Field): Field =>
    shown(f, {
      label: say(f.label),
      hint: maybe(f.hint),
      edit: edit(f.edit),
      pattern: f.pattern && [f.pattern[0], say(f.pattern[1])],
      options: f.options?.map((o) => ({ ...o, label: say(o.label), hint: maybe(o.hint) })),
      add: maybe(f.add),
      singular: maybe(f.singular),
      toggle: f.toggle && [say(f.toggle[0]), say(f.toggle[1])],
      fields: f.fields?.map(field),
      field: f.field && field(f.field),
      blocks: f.blocks?.map(block),
    });
  const block = <B extends Block | SiteBlock>(b: B): B =>
    shown<Block | SiteBlock>(b, { label: say(b.label), hint: maybe(b.hint), edit: edit(b.edit), fields: b.fields.map(field) }) as B;
  const file = (f: DataFile): DataFile => shown(f, { label: say(f.label), fields: f.fields.map(field), root: f.root && field(f.root) });
  const collection = (c: Collection): Collection =>
    c.kind === 'files'
      ? shown(c, { label: say(c.label), singular: say(c.singular), create: maybe(c.create), files: c.files.map(file) })
      : shown(c, { label: say(c.label), singular: say(c.singular), create: maybe(c.create), fields: c.fields.map(field) });
  const part = (p: Part): Part =>
    shown(p, {
      label: say(p.label),
      fields: p.fields?.map(field),
      back: p.back && { ...p.back, label: say(p.back.label) },
      parts: p.parts?.map(part),
    });
  const group = (g: (typeof site.groups)[number]) => ({ ...g, title: say(g.title) });
  const color = (c: ColorField): ColorField => ({ ...c, label: say(c.label), hint: say(c.hint) });
  const pair = (p: ColorPair): ColorPair => ({ ...p, what: say(p.what) });
  const app = <A extends AppDefinition>(a: A): A =>
    shown<AppDefinition>(a, {
      label: say(a.label),
      hint: say(a.hint),
      description: maybe(a.description),
      releaseNotes: a.releaseNotes && Object.fromEntries(Object.entries(a.releaseNotes).map(([v, x]) => [v, say(x)])),
      screenshots: a.screenshots?.map((x) => ({ ...x, label: say(x.label) })),
      cookieList: a.cookieList?.map((c) => ({ ...c, purpose: say(c.purpose), lasts: maybe(c.lasts) })),
      settings: a.settings && { ...a.settings, fields: a.settings.fields.map(field) },
      kinds:
        a.kinds &&
        Object.fromEntries(
          Object.entries(a.kinds).map(([list, k]) => [
            list,
            {
              ...k,
              label: say(k.label),
              hint: maybe(k.hint),
              fields: k.fields?.map(field),
              variants: k.variants?.map((v) => ({ ...v, label: say(v.label) })),
            },
          ]),
        ),
      lists: a.lists?.map((l) => collection(l) as AppList),
    }) as A;
  return { block, collection, part, group, color, pair, app };
}

/** A colour under "Farver" (colorFields in @site/colors): its CSS variable without "--", its name and what it is for. */
type ColorField = (typeof site.colorFields)[number];

// A commit names a part in the site's language: the standard parts' English texts through inSiteLanguage, the site's own as written.
const local = translator(siteText, inSiteLanguage);
const each = <T>(all: T[], one: (x: T) => T) => (translatingSite ? all.map(one) : all);

// The screens under "Blokke" of the blocks with shared texts (shared.ts in the block's folder), named and
// drawn like the block: the apps' blocks' (src/apps/<app>/blocks/), as the site wrote them, and the standard blocks' (standard/), in the editor's language, where the site has
// no block by the same name.
type Folders<T> = Record<string, { default: T }>;
function sharedPartsOf(blocks: Folders<BlockDefinition>, shared: Folders<SharedTexts>): Part[] {
  return Object.entries(shared).flatMap(([path, m]): Part[] => {
    const block = blocks[path.replace(/shared\.ts$/, 'index.tsx')]?.default;
    if (!block) return [];
    const type = blockTypeOf(path);
    const { fields, values, preview } = m.default;
    return [
      {
        id: type,
        label: block.label,
        icon: block.icon,
        file: site.config.blockTexts,
        at: type,
        fields,
        defaults: values,
        preview: { type, ...preview },
        back: { href: '#blokke', label: t.common.parts.blocks },
      },
    ];
  });
}
export const sharedParts = sharedPartsOf(appBlocks, appShared);
const owned = new Set(Object.keys(appBlocks).map(blockTypeOf));
// Named in the site's language in the commits, as their blocks are (siteT).
const standardParts = sharedPartsOf(
  import.meta.glob<{ default: BlockDefinition }>('./standard/*/index.tsx', { eager: true }),
  import.meta.glob<{ default: SharedTexts }>('./standard/*/shared.ts', { eager: true }),
)
  .filter((p) => !owned.has(p.id))
  .map((p) => {
    const label = (siteT.blocks as Record<string, { label?: string }>)[p.id]?.label;
    if (label) written.set(p, { ...p, label });
    return p;
  });

/** The screens under "Blokke" as the site wrote them: its own (packages/editor/defaults/blockTexts.ts) and the blocks'. */
export const writtenBlockParts: Part[] = [...site.blockParts, ...sharedParts, ...standardParts];

/** The parts of "Virksomheden"; one with parts of its own (Part.parts) has them going back to it. */
export const companyParts = each(
  site.companyParts.map((p) =>
    p.parts ? { ...p, parts: p.parts.map((s) => ({ ...s, back: { href: `#company/${p.id}`, label: p.label } })) } : p,
  ),
  local.part,
);
/** The site's screens with parts (PartScreen), each part going back to its screen. */
export const partScreens = site.partScreens.map((s) => ({
  ...s,
  label: translatingSite ? siteText(s.label) : s.label,
  parts: each(
    s.parts.map((p) => ({ ...p, back: { href: `#${s.id}`, label: s.label } })),
    local.part,
  ),
}));
/** The site's own parts under "Udseende" (#appearance, Library.tsx Theme), after the logo and icon, each going back to it. */
export const appearance = each(
  site.appearance.map((p) => ({ ...p, back: { href: '#appearance', label: t.common.parts.appearance } })),
  local.part,
);
/** Where a screen goes back to: the start screen. The menu's sections ("Indhold" …) are lists in the drawer, not screens,
 * so Redirects and "Interne links" under "Indhold" go there too. */
export const backFrom = (_id: string) => ({ href: '#', label: site.siteName });

/** The site's own parts under "Søgemaskineoptimering" (#seo/<id>, in the menu under "Indhold"), each going back
 * to the start screen (backFrom). */
export const seoParts = each(
  site.seoParts.map((p) => ({ ...p, back: backFrom(p.id) })),
  local.part,
);
/** The site's own first ("Book en tid"), then the blocks' by their names. */
export const blockParts = [
  ...each(site.blockParts, local.part),
  ...[...each(sharedParts, local.part), ...standardParts].sort((a, b) => byText(a.label, b.label)),
];
export const groups = each(site.groups, local.group);
/** The colours under "Farver" (@site/colors), with their names and hints in the editor's language. */
export const colorFields = each(site.colorFields, local.color);
/** The pairs that must be readable (@site/colors), with what they are in the editor's language. */
export const colorPairs = each(site.colorPairs, local.pair);
/** The settings of the whole site, the drawer's last section. */
export const settings: string[] = site.settings;

/** Where a part of the menu is, as the way there says it: the title of the section it is in ("Indhold › …"). */
export const placeOf = (id: string): string | undefined => groups.find((g) => g.ids.includes(id))?.title;

/** Where a standard page (by its key, packages/editor/defaults/standardPages.ts) is chosen, as the way there from the start screen
 * ("Udseende › Standardsider"): the part with its field in the file of the standard pages. */
export function standardPageAt(key: string): string {
  const chosenIn = (p: Part) => p.file === site.config.standardPages && !!p.fields?.some((f) => f.name === key);
  const screen = [{ id: 'appearance', label: t.common.parts.appearance, parts: appearance }, ...partScreens].find((s) =>
    s.parts.some(chosenIn),
  );
  if (!screen) return '';
  return [placeOf(screen.id), screen.label, screen.parts.find(chosenIn)!.label].filter(Boolean).join(' › ');
}

/** An app's block with its texts in the editor's language; its card says
 * its lines (detail) in it itself. */
export const localSiteBlock = (b: SiteBlock): SiteBlock => (translatingSite ? local.block(b) : b);

/** An app (src/apps/, apps.ts) with its texts and its settings' fields in the editor's language. */
export const localApp = <A extends AppDefinition>(a: A): A => (translatingSite ? local.app(a) : a);

// The apps in the site (src/apps/<app>/index.ts, apps.ts), each with the blocks it adds (its blocks/), what it needs
// (from its folder), its pictures and, from the app store, where it came from (its store.json), by their names: as the
// site wrote them, and in the editor's language.
const appBlockPaths = Object.keys(appBlocks);
/** The apps as the site wrote them (the commits, the check before the build). */
export const writtenApps: SiteApp[] = Object.entries(appFiles)
  .map(([path, m]) => {
    const id = appIdOf(path);
    const store = Object.entries(appStores).find(([p]) => appIdOf(p) === id)?.[1].default;
    return {
      ...m.default,
      id,
      blocks: appBlockPaths.filter((p) => appIdOf(p) === id).map((p) => p.split('/').at(-2)!),
      needs: needsOf(appFolders[id]?.files ?? [], appFolders[id]?.csp),
      pictures: [],
      ...(store ? { store } : {}),
    };
  })
  .map((a) => withPictures(a))
  .sort((a, b) => byText(a.label, b.label));
export const apps: SiteApp[] = writtenApps.map((a) => withPictures(localApp(a))).sort((a, b) => byText(a.label, b.label));

/** An app with the addresses of its pictures (its `screenshots`, in their order), each with what it says under it. */
function withPictures(app: SiteApp): SiteApp {
  const folder = `/${appFolder(app.id)}/${SCREENSHOTS}/`;
  const pictures = (app.screenshots ?? []).flatMap((x, i) => {
    const src = appPictures[folder + shotFile(i, x.shows)];
    return src ? [{ src, label: x.label }] : [];
  });
  return { ...app, pictures };
}

// Which app a block's screen under "Standardblokke" comes from, by its type: the app with a block of that type
// (also the site's own, e.g. an app's booking block, "Book en tid").
const appOfType = new Map(appBlockPaths.map((p) => [blockTypeOf(p), appIdOf(p)]));
const standardIds = new Set(standardParts.map((p) => p.id));
/** "Standardblokke" in groups, as under "Blokindstillinger": the standard blocks (and the site's own, if no app has
 * a block of their type), then each app's under its name; in each, by their names. */
export const blockGroups: { title: string; parts: Part[] }[] = [
  { title: t.blockSettings.standard, parts: blockParts.filter((p) => standardIds.has(p.id) || !appOfType.has(p.id)) },
  ...apps.map((a) => ({ title: a.label, parts: blockParts.filter((p) => !standardIds.has(p.id) && appOfType.get(p.id) === a.id) })),
]
  .map((g) => ({ ...g, parts: [...g.parts].sort((a, b) => byText(a.label, b.label)) }))
  .filter((g) => g.parts.length > 0);

// The lists the standard blocks bring (standard/<type>/list.ts: "Udtalelser"), on every site: in the editor's
// language, and as the site writes them (siteT), for the commits.
const standardLists = Object.values(
  import.meta.glob<{ default: (say: typeof t) => OwnedList }>('./standard/*/list.ts', { eager: true }),
).map((m) => {
  const shown = m.default(t);
  written.set(shown, m.default(siteT));
  return shown;
});

// The lists the apps bring (AppDefinition.lists), after the site's own and the standard blocks': all apps', installed
// or not, so what was made with one can still be edited.
const listsOf = (all: SiteApp[]) => all.flatMap((a) => a.lists ?? []);

/** The site's lists as it wrote them, the standard blocks' and the apps', with the kinds the apps add to them
 * (withKinds). */
export const writtenCollections = [...site.collections, ...standardLists.map(asWritten), ...listsOf(writtenApps)].map((c) =>
  withKinds(c, writtenApps),
);
export const collections = [...each(site.collections, local.collection), ...standardLists, ...listsOf(apps)].map((c) => {
  const merged = withKinds(c, apps);
  if (merged !== c) written.set(merged, withKinds(asWritten(c), writtenApps));
  return merged;
});

// The lists under "Lister" besides the site's own: the standard blocks', always, and the apps'.
const ownedLists = [...standardLists, ...listsOf(writtenApps)];

/** The made-up rows of the lists the standard blocks and the apps bring (`examples`), by the list's id, as listRowsOf
 * gives them: what the made-up site (examples.ts) has in them. */
export const listExamples: ListRows = Object.fromEntries(
  ownedLists.flatMap((l) => (l.examples ? [[l.id, l.examples.map((row, i) => ({ ...row, slug: String(i + 1) }))]] : [])),
);

/** The rows of the lists the standard blocks and the apps bring, by the list's id, in their order (`order`, then the
 * file's name), each with its `slug`: what the blocks show from them (BlockData.lists). */
export const listRowsOf = (files: { path: string; text: string }[]): ListRows =>
  Object.fromEntries(
    ownedLists.map((l) => [
      l.id,
      files
        .filter((f) => f.path.startsWith(`${l.folder}/`) && f.path.endsWith('.json'))
        .sort((a, b) => a.path.localeCompare(b.path))
        .flatMap((f): Record<string, unknown>[] => {
          try {
            return [{ ...(JSON.parse(f.text) as Record<string, unknown>), slug: f.path.slice(l.folder.length + 1, -'.json'.length) }];
          } catch {
            return [];
          }
        })
        .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)),
    ]),
  );

/** The icon of each part on the start screen, in the sidebar and under "Lister", by its id: the site's, the
 * standard blocks' and the apps' lists', and those of the parts the menu lists (appearance, seoParts, partScreens). */
export const icons = {
  ...site.icons,
  ...Object.fromEntries(ownedLists.map((l) => [l.id, l.icon])),
  // The parts the menu lists by their id: the site's standard pages, Internal links and the parts of the screens with parts.
  ...Object.fromEntries(
    [...appearance, ...seoParts, ...partScreens.flatMap((s) => s.parts)].flatMap((p) => (p.icon ? [[p.id, p.icon]] : [])),
  ),
};

/** The short lists, under "Lister" (#lister): the site's, the standard blocks' and the apps', which go back there too. */
export const lists = [...site.lists, ...ownedLists.map((l) => l.id)];

/** The lists under "Lister" now: the site's, the standard blocks' and those of the apps installed, without the cookie
 * list, which is a row under "Privatliv" (privacy.ts). */
export const listsShown = (files: { path: string; text: string }[]) => {
  const installed = installedApps(files);
  return [...site.lists, ...[...standardLists, ...listsOf(writtenApps.filter((a) => installed.includes(a.id)))].map((l) => l.id)].filter(
    (id) => id !== site.config.lists.cookies,
  );
};
