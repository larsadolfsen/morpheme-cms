// Everything the editor writes, checked by the editor's own rules (check.ts) before the site is built
// (packages/editor/scripts/check-content.mjs): every block in the text of the pages and posts (src/apps/<app>/blocks/, an unknown
// one too), and the data files with the fields the editor edits them with: the fixed pages with their
// sections, the menu and the other single files, the lists (prices, testimonials, tags), the
// screens under "Virksomheden" and "Blokke", the apps installed and their settings (src/apps/), and the
// colours ("Farver": colours, readable together). A hidden block is not on the site, so it may be unfinished.
// The rules of a page's template (collections.ts) too: what may be there, how many, and what must.
// The redirects (redirects.ts): none sends on through another, and none in a loop. And the site's own rules
// (siteProblems in its rules.ts: a button that opens a promotion not on its page).
// And the site's texts the editor has no translation of (untranslated).
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
import { colorProblems, lowContrast, MODES } from '../lib/colors';
import { completeColors, dynamicProblems } from '../lib/dynamic-colors';
import { APP_HOOKS, hooksOf } from '../lib/hooks';
import { texts } from '@site/texts';
import { texts as standardTexts } from '../defaults/texts';
import type { Part } from './schema';
import { apps, asStandardTemplate, blockProblems, siteBlocks, standardPageOf, withPageBlocks } from './registry';
import { installedApps, settingsFile } from './apps';
import { appFolder, SCREENSHOTS, shotFile, shotOf } from './store';
import { appFolders } from './appFiles';
import { colorPairs as shownPairs, sharedParts, translator, writtenApps, writtenBlockParts, writtenCollections } from './site';
import { splitBlocks } from '../lib/blocks.mjs';
import { appTexts, DEFAULTS_LOCALE, locales, siteLocale, t, type Texts } from './i18n';
import { flatten, readAll, REDIRECT_FILES, type AllRedirects } from './redirects';

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
    // An entry of a list as the list has it now (FolderCollection.upgrade: a contact bar is an action bar).
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
    if (part.file && part.fields) data(part.file, part.fields, part.at, undefined, part.defaults);
  // The blocks turned off under "Blokindstillinger" (BlockSettings.tsx): a list of their types.
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
  // Each picture of an app shows something it has (shotOf) and is in its screenshots/, and each file there is one of them.
  for (const app of writtenApps) {
    const blocks = siteBlocks.filter((b) => b.app === app.id).map((b) => b.type);
    const files = (appFolders[app.id]?.files ?? []).filter((f) => f.startsWith(`${SCREENSHOTS}/`));
    const listed = (app.screenshots ?? []).map((x, i) => `${SCREENSHOTS}/${shotFile(i, x.shows)}`);
    for (const x of app.screenshots ?? [])
      if (!shotOf(x.shows, app, blocks)) problems.push(`${appFolder(app.id)}/index.ts: ${t.apps.unknownScreenshot(x.shows)}`);
    for (const file of listed.filter((f) => !files.includes(f)))
      problems.push(`${appFolder(app.id)}/index.ts: ${t.apps.noScreenshot(file)}`);
    for (const file of files.filter((f) => !listed.includes(f)))
      problems.push(`${appFolder(app.id)}/${file}: ${t.apps.unlistedScreenshot}`);
  }

  // The colours under "Farver" (Colors.tsx): every colour in both modes (those a file written before them does not have
  // made, completeColors), readable together, the choice of dynamic colour they were made from, if they were.
  const colorsFile = byPath.get(config.colors);
  if (colorsFile) {
    checked.add(colorsFile.path);
    try {
      const colors = completeColors(JSON.parse(colorsFile.text), colorRoles);
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
    // A standard page by its own rules too (the blog page has "Blogindlæg"), and the front page's leads read as the site reads
    // them (packages/editor/site/home.ts).
    const standard = standardPageOf(f, files);
    const front = standard?.key === 'front';
    for (const problem of blockProblems(f.text, asStandardTemplate(template, standard), front ? frontLeads : undefined))
      problems.push(`${f.path}: ${problem}`);
  }
  // The site's own rules (a button that opens a promotion that is not on its page).
  problems.push(...siteProblems(files));
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

/** The site's own texts with no translation, by the editor's other languages, by the file they belong
 * in: the site's in @site/texts, a block's in its texts.ts (or the site's, for what it takes from
 * the site). The editor shows them as they are written. Not the ones said in code (the messages in
 * rules.ts, the lines on the blocks' cards). */
export function untranslated(): Record<string, Record<string, string[]>> {
  // The editor shows a site's definitions translated already on a site in another language than Danish, so a text the walk
  // meets is traced back to the one it was translated from (the translations' tables are by it). A text is written in the
  // package's language when the package's standard parts or an app have it in Danish (defaults/texts.ts, an app's
  // texts.ts), else in the site's; it needs a translation in each other language.
  const tables = [standardTexts, ...Object.values(appTexts)].map((table) => Object.entries(table['en-US'] ?? {}));
  const danish = new Set(tables.flatMap((entries) => entries.map(([text]) => text)));
  const original = new Map(tables.flatMap((entries) => entries.map(([text, translated]) => [translated, text] as const)));
  const writtenIn = (text: string) => (danish.has(text) ? DEFAULTS_LOCALE : siteLocale);
  const missing = (l: string, own: Record<string, string>, walk: (w: ReturnType<typeof translator>) => void) => {
    const found = new Set<string>();
    walk(
      translator((shown) => {
        const text = original.get(shown) ?? shown;
        if (writtenIn(text) !== l && !(text in own)) found.add(text);
        return shown;
      }),
    );
    return [...found];
  };
  return Object.fromEntries(
    locales
      .filter((l) => l !== siteLocale || l !== DEFAULTS_LOCALE)
      .map((l) => {
        const site = (texts as Texts)[l] ?? {};
        const files: Record<string, string[]> = {
          'src/site/texts.ts': missing(l, site, (w) => {
            collections.forEach(w.collection);
            [...companyParts, ...partScreens.flatMap((s) => s.parts), ...appearance, ...seoParts, ...blockParts].forEach(w.part);
            partScreens.forEach((s) => w.group({ title: s.label, ids: [] }));
            groups.forEach(w.group);
            colorFields.forEach(w.color);
            colorPairs.forEach(w.pair);
          }),
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
}
