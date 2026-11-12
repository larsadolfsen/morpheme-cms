// The site as the editor shows it: what src/site/ describes (the collections and their fields, the
// menu's sections (groups), the screens under "Business" and "Blocks") with the site's texts in the
// editor's language (siteText, @site/texts). The editor takes these from here, not from
// @site/editor. A commit says what was saved in the site's language: asWritten gives back a
// collection, a file, a part or a block as the site wrote it.
import * as site from '@site/editor';
import type { ColorPair } from '../lib/colors';
import { backTarget, placeOf as menuPlaceOf } from '../lib/menu.mjs';
import { activeApps, appFromManifest, appIdOf, withKinds, type AppDefinition, type AppList, type SiteApp } from './apps';
import { appBlocks, appEditors, appFiles, appFolders, appManifests, appPictures, appShared, appStores, appTextFiles } from './appFiles';
import type { AppManifest } from '../lib/appManifest.mjs';
import type { BlockDefinition, SiteBlock } from './blocks';
import type { ListRows } from './fields';
import { isEntryPath } from '../lib/ownList.mjs';
import { ownListsOf } from './ownLists';
import { setRowLists } from './standard/rows/lists';
import { inSiteLanguage, siteT, siteText, t, translatingSite } from './i18n';
import { byText, type Block, type Collection, type DataFile, type Edit, type Field, type OwnedList, type Part } from './schema';
import { blockTypeOf, type SharedTexts } from './shared';
import { appFolder, needsOf, SCREENSHOTS, shotFiles } from './store';

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
      heading: f.heading && { label: say(f.heading.label), hint: maybe(f.heading.hint) },
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

/** A colour under "Colors" (colorFields in @site/colors): its CSS variable without "--", its name and what it is for. */
type ColorField = (typeof site.colorFields)[number];

// A commit names a part in the site's language: the standard parts' English texts through inSiteLanguage, the site's own as written.
const local = translator(siteText, inSiteLanguage);
const each = <T>(all: T[], one: (x: T) => T) => (translatingSite ? all.map(one) : all);

// The screens under "Blocks" of the blocks with shared texts (shared.ts in the block's folder), named and
// drawn like the block: the apps' blocks' (src/apps/<app>/blocks/), as the site wrote them, and the standard blocks' (standard/), in the editor's language, where the site has
// no block by the same name.
type Folders<T> = Record<string, { default: T }>;
function sharedPartsOf(blocks: Folders<BlockDefinition>, shared: Folders<SharedTexts>): Part[] {
  return Object.entries(shared).flatMap(([path, m]): Part[] => {
    const block = blocks[path.replace(/shared\.ts$/, 'index.tsx')]?.default;
    if (!block) return [];
    const type = blockTypeOf(path);
    const { fields, values, preview, upgradeValues } = m.default;
    return [
      {
        id: type,
        label: block.label,
        icon: block.icon,
        file: site.config.blockTexts,
        at: type,
        fields,
        defaults: values,
        upgradeValues,
        preview: { type, ...preview },
        back: { href: '#blocks', label: t.common.parts.blocks },
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

/** The screens under "Blocks" as the site wrote them: its own (packages/editor/defaults/blockTexts.ts) and the blocks'. */
export const writtenBlockParts: Part[] = [...site.blockParts, ...sharedParts, ...standardParts];

/** The parts of "Business"; one with parts of its own (Part.parts) has them going back to it. */
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
/** The site's own parts under "Appearance" (#appearance, Library.tsx Theme), after the logo and icon, each going back to it. */
export const appearance = each(
  site.appearance.map((p) => ({ ...p, back: { href: '#appearance', label: t.common.parts.appearance } })),
  local.part,
);
/** Where a screen goes back to: "Settings" (#settings) for Appearance, Developer, Licenses, Morpheme and Privacy, else the
 * start screen. The menu's sections ("Content" …) are lists in the drawer, not screens, so Redirects and "Internal links"
 * under "Content" go there too. */
export const backFrom = (id: string) => backTarget(id, site.settings, { settingsTitle: t.common.parts.settings, siteName: site.siteName });

/** The site's own parts under "Search engine optimization" (#seo/<id>, in the menu under "Content"), each going back
 * to the start screen (backFrom). */
export const seoParts = each(
  site.seoParts.map((p) => ({ ...p, back: backFrom(p.id) })),
  local.part,
);
/** The site's own first ("Book an appointment"), then the blocks' by their names. */
export const blockParts = [
  ...each(site.blockParts, local.part),
  ...[...each(sharedParts, local.part), ...standardParts].sort((a, b) => byText(a.label, b.label)),
];
export const groups = each(site.groups, local.group);
/** The colours under "Colors" (@site/colors), with their names and hints in the editor's language. */
export const colorFields = each(site.colorFields, local.color);
/** The pairs that must be readable (@site/colors), with what they are in the editor's language. */
export const colorPairs = each(site.colorPairs, local.pair);
/** The rows of the Settings screen (#settings), opened by the cog at the bottom of the drawer. */
export const settings: string[] = site.settings;

/** Where a part of the menu is, as the way there says it: the title of the section it is in ("Content › …"). */
export const placeOf = (id: string): string | undefined => menuPlaceOf(id, groups, settings, t.common.parts.settings);

/** Where a standard page (by its key, packages/editor/defaults/standardPages.ts) is chosen, as the way there from the start screen
 * ("Settings › Appearance › Default pages"): the part with its field in the file of the standard pages. */
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
// An app with an app.json (contract 4) is made from it, its editor.ts and its texts.json; one with only an index.ts (contract 2 or 3)
// from that, as before.
const inFolder = <T>(files: Record<string, T>, id: string) => Object.entries(files).find(([path]) => appIdOf(path) === id)?.[1];
const fromManifests: [string, AppDefinition, AppManifest][] = Object.entries(appManifests).map(([path, manifest]) => {
  const id = appIdOf(path);
  const editor = inFolder(appEditors, id)?.default;
  return [id, appFromManifest(manifest, editor, inFolder(appTextFiles, id), id), manifest];
});
const fromIndexes: [string, AppDefinition, null][] = Object.entries(appFiles)
  .map(([path, m]): [string, AppDefinition, null] => [appIdOf(path), m.default, null])
  .filter(([id]) => !fromManifests.some(([own]) => own === id));
/** The apps as the site wrote them (the commits, the check before the build). */
export const writtenApps: SiteApp[] = [...fromManifests, ...fromIndexes]
  .map(([id, definition, manifest]) => {
    const store = Object.entries(appStores).find(([p]) => appIdOf(p) === id)?.[1].default;
    return {
      ...definition,
      id,
      blocks: appBlockPaths.filter((p) => appIdOf(p) === id).map((p) => p.split('/').at(-2)!),
      needs: needsOf(
        appFolders[id]?.files ?? [],
        manifest ? manifest.csp : appFolders[id]?.csp,
        Object.keys(definition.widgets ?? {}).length > 0,
        manifest,
      ),
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
    // The new file name first, then the old one (DEPRECATED_SHOT_WORDS) for an app whose pictures are not regenerated yet.
    const file = shotFiles(i, x.shows).find((f) => appPictures[folder + f]);
    const src = file && appPictures[folder + file];
    return src ? [{ src, label: x.label }] : [];
  });
  return { ...app, pictures };
}

// Which app a block's screen under "Standard blocks" comes from, by its type: the app with a block of that type
// (also the site's own, e.g. an app's booking block, "Book an appointment").
const appOfType = new Map(appBlockPaths.map((p) => [blockTypeOf(p), appIdOf(p)]));
const standardIds = new Set(standardParts.map((p) => p.id));
/** "Standard blocks" in groups, as under "Block settings": the standard blocks (and the site's own, if no app has
 * a block of their type), then each app's under its name; in each, by their names. */
export const blockGroups: { title: string; parts: Part[] }[] = [
  { title: t.blockSettings.standard, parts: blockParts.filter((p) => standardIds.has(p.id) || !appOfType.has(p.id)) },
  ...apps.map((a) => ({ title: a.label, parts: blockParts.filter((p) => !standardIds.has(p.id) && appOfType.get(p.id) === a.id) })),
]
  .map((g) => ({ ...g, parts: [...g.parts].sort((a, b) => byText(a.label, b.label)) }))
  .filter((g) => g.parts.length > 0);

// The lists the standard blocks bring (standard/<type>/list.ts: "Testimonials"), on every site: in the editor's
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

// The lists under "Lists" besides the site's own: the standard blocks', always, and the apps'.
const ownedLists = [...standardLists, ...listsOf(writtenApps)];
setRowLists(ownedLists);

/** Told by the app once it has the site's files: "Rows from" offers the owner's lists too. */
export const setOwnRowLists = (files: { path: string; text: string }[]) => setRowLists([...ownedLists, ...ownListsOf(files)]);

/** The made-up rows of the lists the standard blocks and the apps bring (`examples`), by the list's id, as listRowsOf
 * gives them: what the made-up site (examples.ts) has in them. */
export const listExamples: ListRows = Object.fromEntries(
  ownedLists.flatMap((l) => (l.examples ? [[l.id, l.examples.map((row, i) => ({ ...row, slug: String(i + 1) }))]] : [])),
);

/** The rows of the lists the standard blocks and the apps bring, by the list's id, in their order (`order`, then the
 * file's name), each with its `slug`: what the blocks show from them (BlockData.lists). */
export const listRowsOf = (files: { path: string; text: string }[]): ListRows =>
  Object.fromEntries(
    [...ownedLists, ...ownListsOf(files)].map((l) => [
      l.id,
      files
        .filter((f) => f.path.startsWith(`${l.folder}/`) && f.path.endsWith('.json') && isEntryPath(f.path))
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

/** Every list the editor shows for these files: the code's (`collections`) and the ones the owner made (src/ownLists.ts). Without
 * a `_list.json` in the files it is `collections` itself. */
export const collectionsFor = (files: { path: string; text: string }[]): Collection[] => {
  const mine = ownListsOf(files).filter((l) => !collections.some((c) => c.id === l.id));
  return mine.length ? [...collections, ...mine] : collections;
};

/** Whether a list is one the owner made (it has a `_list.json`), not one the code brings. */
export const isOwnList = (files: { path: string; text: string }[], id: string) =>
  ownListsOf(files).some((l) => l.id === id) && !collections.some((c) => c.id === id);

/** The icon of each part on the start screen, in the sidebar and under "Lists", by its id: the site's, the
 * standard blocks' and the apps' lists', and those of the parts the menu lists (appearance, seoParts, partScreens). */
export const icons = {
  ...site.icons,
  ...Object.fromEntries(ownedLists.map((l) => [l.id, l.icon])),
  // The parts the menu lists by their id: the site's standard pages, Internal links and the parts of the screens with parts.
  ...Object.fromEntries(
    [...appearance, ...seoParts, ...partScreens.flatMap((s) => s.parts)].flatMap((p) => (p.icon ? [[p.id, p.icon]] : [])),
  ),
};

/** The short lists, under "Lists" (#lists): the site's, the standard blocks' and the apps', which go back there too. */
export const lists = [...site.lists, ...ownedLists.map((l) => l.id)];

/** The lists under "Lists" now: the site's, the standard blocks' and those of the apps installed, without the cookie
 * list, which is a row under "Privacy" (privacy.ts). */
export const listsShown = (files: { path: string; text: string }[]) => {
  const installed = activeApps(files);
  const own = ownListsOf(files).map((l) => l.id);
  return [
    ...site.lists,
    ...[...standardLists, ...listsOf(writtenApps.filter((a) => installed.includes(a.id)))].map((l) => l.id),
    ...own.filter((id) => !collections.some((c) => c.id === id)),
  ].filter((id) => id !== site.config.lists.cookies);
};
