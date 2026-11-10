// Everything the editor writes, checked by the editor's own rules (check.ts) before the site is built
// (packages/editor/scripts/check-content.mjs): every block in the text of the pages and posts (src/apps/<app>/blocks/, an unknown
// one too), and the data files with the fields the editor edits them with: the fixed pages with their
// sections, the menu and the other single files, the lists (prices, testimonials, tags), the
// screens under "Business" and "Blocks", the apps installed and their settings (src/apps/), and the
// colours ("Colors": colours, readable together). A hidden block is not on the site, so it may be unfinished.
// The rules of a page's template (collections.ts) too: what may be there, how many, and what must.
// The redirects (redirectData.ts): none sends on through another, and none in a loop. And the site's own rules
// (siteProblems in its rules.ts: a button that opens a promotion not on its page).
// The file records (src/data/files: the tags of files in Filer): each is valid, no tag is both chosen and removed, one per address.
// And the site's texts the editor has no translation of, and a converted standard text with no Danish (untranslated).
import { check } from './check';
import {
  appearance,
  blockParts,
  collections,
  colorFields,
  colorPairs,
  colorRoles,
  companyParts,
  config,
  frontLeads,
  groups,
  partScreens,
  seoParts,
  siteProblems,
} from '@site/editor';
import { colorProblems, lowContrast, MODES, withMaterialNames } from '../lib/colors';
import { completeColors, dynamicProblems } from '../lib/dynamic-colors';
import { APP_HOOKS, hooksOf } from '../lib/hooks';
import { texts } from '@site/texts';
import { defaultsDaDK } from '../defaults/i18n/da-DK';
import type { Part } from './schema';
import { apps, asStandardTemplate, blockProblems, siteBlocks, standardPageOf, withPageBlocks } from './registry';
import { installedApps, settingsFile } from './apps';
import { appFolder, SCREENSHOTS, shotFiles, shotOf } from './store';
import { appFolders } from './appFiles';
import { widgetsWithoutComponent } from './widgets';
import { colorPairs as shownPairs, sharedParts, translator, writtenApps, writtenBlockParts, writtenCollections } from './site';
import { splitBlocks } from '../lib/blocks.mjs';
import { splitMissing } from '../lib/translate.mjs';
import { collections as standardCollections } from '../defaults/collections';
import { companyParts as standardCompany } from '../defaults/company';
import { blockParts as standardBlocks } from '../defaults/blockTexts';
import { colorFields as standardColorFields, colorPairs as standardColorPairs } from '../defaults/colors';
import { privacy as standardPrivacy } from '../defaults/privacy';
import { internalLinks as standardInternalLinks } from '../defaults/internalLinks';
import { appearance as standardAppearance, groups as standardGroups } from '../defaults/editor';
import { isRecordPath, recordProblems } from './fileRecords.mjs';
import { appTexts, DEFAULTS_LOCALE, locales, siteLocale, t, type Texts } from './i18n';
import { flatten, readAll, REDIRECT_FILES, type AllRedirects } from './redirectData';

const ratio = (n: number) => n.toLocaleString(config.locale, { maximumFractionDigits: 1 });

export type SiteFile = { path: string; text: string };

/** What is wrong, a line for each file or block ('src/content/pages/x.md: Udfyld "Pris › Pris".'), and
 * how many files and blocks were checked. */
export function problemsOf(files: SiteFile[]): { problems: string[]; files: number; blocks: number } {
  const problems: string[] = [];
  const byPath = new Map(files.map((f) => [f.path, f]));
  const checked = new Set<string>();
  let blocks = 0;

  // A data file by the fields it is edited with (at the top or under `at`, over the values it starts
  // with; a file that is only a list under `root`).
  const data = (
    path: string,
    fields: Parameters<typeof check>[0],
    at?: string,
    root?: string,
    defaults?: Record<string, unknown>,
    values?: Record<string, unknown>,
    // An entry of a list as the list has it now (FolderCollection.upgrade: a contact bar is an action bar), or a part's
    // file as its form has it now (Part.upgrade: social.json's profiles as a list).
    upgrade?: (value: Record<string, unknown>) => Record<string, unknown>,
  ) => {
    const file = byPath.get(path);
    if (!file) return;
    checked.add(path);
    let value: unknown;
    try {
      value = JSON.parse(file.text);
    } catch {
      return problems.push(`${path}: ${t.app.invalidJson}`);
    }
    if (root) value = { [root]: value };
    else if (at) value = { ...defaults, ...((value as Record<string, unknown>)[at] ?? {}) };
    else if (values) value = { ...values, ...(value as Record<string, unknown>) };
    if (upgrade) value = upgrade(value as Record<string, unknown>);
    const problem = check(fields, value as Record<string, unknown>);
    if (problem) problems.push(`${path}: ${problem}`);
  };

  // With the kinds the apps add to them (a Mailchimp pop-up).
  for (const c of writtenCollections) {
    if (c.kind === 'files')
      for (const f of c.files)
        data(f.file, f.root ? [...f.fields, f.root] : withPageBlocks(f.fields), undefined, f.fields.length ? undefined : f.root?.name);
    if (c.kind === 'folder')
      for (const f of files)
        if (f.path.startsWith(`${c.folder}/`) && f.path.endsWith('.json'))
          data(f.path, c.fields, undefined, undefined, undefined, undefined, c.upgrade && ((v) => c.upgrade!(v, files)));
  }
  for (const part of [
    ...companyParts.flatMap((p) => [p, ...(p.parts ?? [])]),
    ...partScreens.flatMap((s) => s.parts),
    ...appearance,
    ...seoParts,
    ...writtenBlockParts,
  ] as Part[])
    if (part.file && part.fields) data(part.file, part.fields, part.at, undefined, part.defaults, undefined, part.upgrade);
  // The blocks turned off under "Block settings" (BlockSettings.tsx): a list of their types.
  data(config.blockSettings, [
    { name: 'off', label: t.app.blocksOff, type: 'list', field: { name: 'type', label: t.app.block, type: 'string' } },
  ]);
  // The apps installed under "Apps" (AppList.tsx): a list of their ids, and each app's settings.
  data(config.apps.installed, [
    { name: 'installed', label: t.app.appsInstalled, type: 'list', field: { name: 'id', label: t.app.app, type: 'string' } },
  ]);
  for (const app of apps)
    if (app.settings) data(settingsFile(app.id), app.settings.fields, undefined, undefined, undefined, app.settings.values);
  // Each app installed is in the site: one from the app store is copied into it when it is installed (store.ts).
  for (const id of installedApps(files))
    if (!apps.some((a) => a.id === id)) problems.push(`${config.apps.installed}: ${t.apps.missing(id, appFolder(id))}`);
  // Each file in an app's hooks/ is a place an app may change the site (@morphemecms/cms/lib/hooks.ts).
  for (const app of writtenApps)
    for (const file of hooksOf(appFolders[app.id]?.files ?? []).unknown)
      problems.push(`${appFolder(app.id)}/${file}: ${t.apps.unknownHook(APP_HOOKS.map((h) => `hooks/${h}.ts`).join(', '))}`);
  // Each widget of an app has a component (src/widgets.ts).
  for (const { app, key } of widgetsWithoutComponent(writtenApps))
    problems.push(`${appFolder(app)}/index.ts: ${t.apps.widgetNoComponent(key)}`);
  // Each picture of an app shows something it has (shotOf) and is in its screenshots/, and each file there is one of them.
  for (const app of writtenApps) {
    const blocks = siteBlocks.filter((b) => b.app === app.id).map((b) => b.type);
    const files = (appFolders[app.id]?.files ?? []).filter((f) => f.startsWith(`${SCREENSHOTS}/`));
    // A picture is in the new file name or, until the app's pictures are regenerated, the old one (lib/appShots.mjs).
    const wanted = (app.screenshots ?? []).map((x, i) => shotFiles(i, x.shows).map((f) => `${SCREENSHOTS}/${f}`));
    for (const x of app.screenshots ?? [])
      if (!shotOf(x.shows, app, blocks)) problems.push(`${appFolder(app.id)}/index.ts: ${t.apps.unknownScreenshot(x.shows)}`);
    for (const names of wanted.filter((names) => !names.some((f) => files.includes(f))))
      problems.push(`${appFolder(app.id)}/index.ts: ${t.apps.noScreenshot(names[0])}`);
    for (const file of files.filter((f) => !wanted.some((names) => names.includes(f))))
      problems.push(`${appFolder(app.id)}/${file}: ${t.apps.unlistedScreenshot}`);
  }

  // The colours under "Colors" (Colors.tsx): every colour in both modes (those a file written before them does not have
  // made, completeColors), readable together, the choice of dynamic colour they were made from, if they were.
  const colorsFile = byPath.get(config.colors);
  if (colorsFile) {
    checked.add(colorsFile.path);
    try {
      const colors = completeColors(withMaterialNames(JSON.parse(colorsFile.text)), colorRoles);
      const bad = colorProblems(
        colors,
        colorFields.map((f) => f.name),
      );
      for (const where of bad) problems.push(`${colorsFile.path}: ${t.colors.notAColorAt(where)}`);
      if (colors.dynamic !== undefined)
        for (const where of dynamicProblems(colors.dynamic)) problems.push(`${colorsFile.path}: ${t.colors.dynamic.wrongAt(where)}`);
      if (!bad.length)
        for (const mode of MODES)
          for (const pair of lowContrast(colors[mode], shownPairs))
            problems.push(`${colorsFile.path}: ${t.colors[mode]}: ${t.colors.tooLow(pair.what, ratio(pair.ratio), ratio(pair.min))}`);
    } catch {
      problems.push(`${colorsFile.path}: ${t.app.invalidJson}`);
    }
  }

  // The redirects in their three files: each straight to where it ends (flatten changes nothing).
  const redirectFiles = files.filter((f) => REDIRECT_FILES.includes(f.path));
  if (redirectFiles.length) {
    redirectFiles.forEach((f) => checked.add(f.path));
    try {
      const all = readAll(redirectFiles.map((f) => ({ ...f, oid: '' })));
      const flat = flatten(all);
      if (typeof flat === 'string') problems.push(flat);
      else for (const line of chainsOf(all, flat)) problems.push(line);
    } catch {
      problems.push(`${config.siteRedirects.map}: ${t.app.invalidJson}`);
    }
  }

  // The blocks in the text of the pages and posts, by the template of their collection.
  for (const f of files) {
    if (!f.path.endsWith('.md')) continue;
    checked.add(f.path);
    blocks += splitBlocks(f.text, null).filter((part) => 'type' in part).length;
    const collection = collections.find((c) => c.kind === 'markdown' && f.path.startsWith(`${c.folder}/`));
    const template = collection?.kind === 'markdown' ? collection.template : undefined;
    // A standard page by its own rules too (the blog page has "Blog posts"), and the front page's leads read as the site reads
    // them (packages/editor/site/home.ts).
    const standard = standardPageOf(f, files);
    const front = standard?.key === 'front';
    for (const problem of blockProblems(f.text, asStandardTemplate(template, standard), front ? frontLeads : undefined))
      problems.push(`${f.path}: ${problem}`);
  }
  // The site's own rules (a button that opens a promotion that is not on its page).
  problems.push(...siteProblems(files));
  // The file records directly in the records folder: a line for each problem, and each one counts as checked.
  for (const f of files) if (isRecordPath(f.path, config.fileRecords)) checked.add(f.path);
  for (const p of recordProblems(files, config.fileRecords)) {
    const text =
      p.problem === 'shape'
        ? t.check.recordShape
        : p.problem === 'overlap'
          ? t.check.recordOverlap(p.value!)
          : t.check.recordDuplicate(p.value!);
    problems.push(`${p.path}: ${text}`);
  }
  return { problems, files: checked.size, blocks };
}

// A line for each redirect that sends on through another: its file, where it sends and where it ends.
function chainsOf(all: AllRedirects, flat: AllRedirects): string[] {
  const lines: string[] = [];
  const compare = (file: string, was: Record<string, string>, now: Record<string, string>) => {
    for (const [from, to] of Object.entries(was)) if (now[from] !== to) lines.push(`${file}: ${t.redirects.chain(from, to, now[from])}`);
  };
  compare(config.redirects, all.own, flat.own);
  compare(config.siteRedirects.map, all.map.paths, flat.map.paths);
  compare(config.siteRedirects.map, all.map.ids, flat.map.ids);
  all.rules.forEach((line, i) => {
    if (line !== flat.rules[i]) lines.push(`${config.siteRedirects.rules}: ${t.redirects.chainRule(line.trim(), flat.rules[i].trim())}`);
  });
  return lines;
}

type Definitions = {
  collections: typeof collections;
  parts: Part[];
  screens: typeof partScreens;
  groups: typeof groups;
  colorFields: typeof colorFields;
  colorPairs: typeof colorPairs;
};

/** The definitions the walk goes over: the site's (the standard parts, merged with the site's own) ... */
const siteDefinitions: Definitions = {
  collections,
  parts: [...companyParts, ...partScreens.flatMap((s) => s.parts), ...appearance, ...seoParts, ...blockParts],
  screens: partScreens,
  groups,
  colorFields,
  colorPairs,
};
/** ... and the package's own standard parts, as defaults/ writes them, whatever the site overrides. */
const standardDefinitions: Definitions = {
  collections: standardCollections,
  parts: [...standardCompany, ...standardPrivacy.parts, ...standardAppearance, standardInternalLinks, ...standardBlocks],
  screens: [standardPrivacy],
  groups: standardGroups,
  colorFields: standardColorFields,
  colorPairs: standardColorPairs,
};

/** Shows each text of the definitions to the translator `w`. */
function walkDefinitions(w: ReturnType<typeof translator>, d: Definitions) {
  d.collections.forEach(w.collection);
  d.parts.forEach(w.part);
  d.screens.forEach((s) => w.group({ id: s.id, title: s.label, ids: [] }));
  d.groups.forEach(w.group);
  d.colorFields.forEach(w.color);
  d.colorPairs.forEach(w.pair);
}

/** The site's own texts with no translation, by the editor's other languages, by the file they belong
 * in: the site's in @site/texts, a block's in its texts.ts (or the site's, for what it takes from
 * the site). The editor shows them as they are written. Not the ones said in code (the messages in
 * rules.ts, the lines on the blocks' cards). A text of the package's standard parts with no translation in a language
 * (defaults/i18n/da-DK/ for da-DK, a blank value too) is under 'defaults/i18n/da-DK/index.ts': it stops `check:content`. */
export function untranslated(): Record<string, Record<string, string[]>> {
  // The editor shows a site's definitions translated already on a site in another language than the standard parts', so a text
  // the walk meets is traced back to the one it was translated from (the translations' tables are by it). The standard parts are
  // written in English (the keys of defaults/i18n/da-DK/); the texts of an app are still written in Danish (its texts.ts, until
  // the apps are converted); every other text is written in the site's language. A text needs a translation in each other language.
  const tables = Object.values(appTexts).map((table) => Object.entries(table['en-US'] ?? {}));
  const danish = new Set(tables.flatMap((entries) => entries.map(([text]) => text)));
  const original = new Map(tables.flatMap((entries) => entries.map(([text, translated]) => [translated, text] as const)));
  // An entry with no Danish (a blank value) is no translation. The walk meets the Danish as it is shown.
  const converted = Object.entries(defaultsDaDK);
  const english = new Set(converted.map(([text]) => text));
  const inDanish = Object.fromEntries(converted.filter(([, danish]) => danish.trim()));
  for (const [text, danish] of Object.entries(inDanish)) original.set(danish, text);
  const writtenIn = (text: string) => (english.has(text) ? DEFAULTS_LOCALE : danish.has(text) ? 'da-DK' : siteLocale);
  // The texts of the package's standard parts: the walk over defaults/'s own definitions, so one with no Danish entry is known too.
  const standardSet = new Set<string>();
  walkDefinitions(
    translator((shown) => {
      standardSet.add(original.get(shown) ?? shown);
      return shown;
    }),
    standardDefinitions,
  );
  const lacking = new Map<string, Set<string>>();
  const missing = (l: string, own: Record<string, string>, walk: (w: ReturnType<typeof translator>) => void) => {
    const found = new Set<string>();
    walk(
      translator((shown) => {
        const text = original.get(shown) ?? shown;
        if (writtenIn(text) !== l && !(text in own)) found.add(text);
        return shown;
      }),
    );
    // A text of the package's standard parts stops the check, the others (the site's own, an app's) only warn.
    const split = splitMissing(found, standardSet);
    split.standard.forEach((text) => lacking.set(l, (lacking.get(l) ?? new Set()).add(text)));
    return split.own;
  };
  const gaps = Object.fromEntries(
    locales
      .filter((l) => l !== siteLocale || l !== DEFAULTS_LOCALE)
      .map((l) => {
        const site = {
          ...(l === 'da-DK' ? inDanish : {}),
          ...Object.fromEntries(Object.entries((texts as Texts)[l] ?? {}).filter(([, v]) => v.trim())),
        };
        const files: Record<string, string[]> = {
          'src/site/texts.ts': missing(l, site, (w) => walkDefinitions(w, siteDefinitions)),
        };
        // An app's block's own texts, and the fields of its shared texts (shared.ts), in its texts.ts.
        for (const block of siteBlocks.filter((b) => b.app))
          files[`src/apps/${block.app}/blocks/${block.type}/texts.ts`] = missing(
            l,
            { ...site, ...appTexts[`blocks/${block.type}`]?.[l] },
            (w) => {
              w.block(block);
              sharedParts.filter((p) => p.id === block.type).forEach(w.part);
            },
          );
        // An app's name, what it does and its settings, in its texts.ts.
        for (const app of apps) files[`src/apps/${app.id}/texts.ts`] = missing(l, { ...site, ...appTexts[app.id]?.[l] }, (w) => w.app(app));
        return [l, Object.fromEntries(Object.entries(files).filter(([, list]) => list.length))];
      }),
  );
  // A standard text with no Danish: no entry in defaults/i18n/da-DK/, or a blank one.
  const blank = converted.filter(([, danish]) => !danish.trim()).map(([text]) => text);
  for (const text of blank) lacking.set('da-DK', (lacking.get('da-DK') ?? new Set()).add(text));
  for (const [l, list] of lacking) gaps[l] = { ...gaps[l], 'defaults/i18n/da-DK/index.ts': [...list] };
  return gaps;
}
