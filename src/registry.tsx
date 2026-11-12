// The blocks in the editor: the editor's standard blocks (packages/editor/src/standard/), which every site has,
// and the apps' (src/apps/<app>/blocks/), with their texts in the editor's language (site.ts). Each block is
// a folder named by its type (the `data-block` of its line in the text, packages/editor/lib/blocks.mjs).
// A standard block's folder has
//   index.tsx   what the editor knows about it (defineBlock in blocks.ts): its name, icon, fields and
//               what its card says;
//   view.ts     what it shows (its view), made from its fields and the site's data (viewOf);
//   load.ts     the same view on the site, when it is built (BlockSite.astro);
// and its look is the theme's (packages/editor/theme/blocks/<type>/, or the theme in use's): View.tsx, which draws its
// view in the editor (blockViews, from standard/themeBlocks.ts) and on the site. A new folder is a new block, in the editor and on
// the site; nothing else lists them. The apps (src/apps/<app>/, apps.ts) add blocks the same way, in their folder's
// blocks/, each with its own View.tsx and viewOf.ts for view.ts (it would differ from View.tsx only in case); they
// are offered once the app is installed. A theme has no blocks of its own, only the look of the standard ones.
import type { ReactNode } from 'react';
import { activeApps, appIdOf } from './apps';
import { htmlBlock, type BlockData, type BlockDefinition, type BlockProps, type DrawBlock, type SiteBlock } from './blocks';
import { check, templateProblems } from './check';
import { slugOf, type Field, type Lead, type Template } from './schema';
import { config, everyFixedPage, fixedPages, standardPages, standardPaths, Texts, type Props, type StandardPage } from '@site/editor';
import { readFields, splitFrontmatter } from './frontmatter.mjs';
import { partsOfMarkdown, sectionsFromParts } from './sections.mjs';
import { blockViews } from './standard/themeBlocks';
import { InEditor, type View, type ViewOf } from './standard/view';
import { appBlocks, appInlines, appViewOfs, appViews } from './appFiles';
import { inlineViews } from './inlineViews';
import { blocksIn, splitBlocks } from '../lib/blocks.mjs';
import { t } from './i18n';
import { localSiteBlock } from './site';

export { apps } from './site';

const standard = import.meta.glob<{ default: BlockDefinition }>('./standard/*/index.tsx', { eager: true });
const views = import.meta.glob<{ viewOf: ViewOf<unknown> }>('./standard/*/view.ts', { eager: true });
const fromApps = appBlocks;
const typeOf = (path: string) => path.split('/').at(-2)!;

// A block in the editor: its drawing (View.tsx) of the view its contract makes (view.ts).
function drawn(View: View<unknown> | undefined, viewOf: ViewOf<unknown> | undefined): SiteBlock['draw'] {
  if (!View || !viewOf) return undefined;
  return (props, data) => {
    const view = viewOf(props, data);
    return view === null ? null : <View view={view} />;
  };
}

// A folder's file, by the path of its index.tsx.
const beside = (path: string, file: string) => `${path.slice(0, path.lastIndexOf('/'))}/${file}`;

/** The types of the standard blocks: every theme has them. */
export const standardTypes = new Set(Object.keys(standard).map(typeOf));

/** The blocks that can be put in the text of a page: the standard ones (and HTML on a line of its own)
 * and the apps'. */
export const siteBlocks: SiteBlock[] = [
  ...Object.entries(standard).map(([path, m]) => ({
    ...m.default,
    draw: drawn(blockViews[typeOf(path)], views[beside(path, 'view.ts')]?.viewOf),
    inlineView: inlineViews[typeOf(path)],
    type: typeOf(path),
    standard: true,
  })),
  ...Object.entries(fromApps).map(([path, m]) =>
    localSiteBlock({
      ...m.default,
      draw: drawn(appViews[beside(path, 'View.tsx')]?.default, appViewOfs[beside(path, 'viewOf.ts')]?.viewOf),
      // An app's own: never a standard block's, whatever the app calls its block.
      inlineView: appInlines[beside(path, 'Inline.tsx')]?.default,
      type: typeOf(path),
      app: appIdOf(path),
    }),
  ),
  htmlBlock,
];

/** The blocks turned off under "Block settings" (BlockSettings.tsx), and the apps' kinds of the site's lists
 * (kindKey, "popups/mailchimp"), from the site's file of block settings (config.blockSettings). */
export function offBlocks(files: { path: string; text: string }[]): string[] {
  try {
    const off = JSON.parse(files.find((f) => f.path === config.blockSettings)?.text ?? '{}').off;
    return Array.isArray(off) ? off.map(String) : [];
  } catch {
    return [];
  }
}

/** The blocks not offered to put in, and that a new page does not start with: those turned off, and
 * those of the apps not installed (AppList.tsx). */
export function notOffered(files: { path: string; text: string }[]): string[] {
  const installed = activeApps(files);
  return [...offBlocks(files), ...siteBlocks.filter((b) => b.app && !installed.includes(b.app)).map((b) => b.type)];
}

/** The fields with a fixed page's sections (`pageBlocks`) given every block a page can have after their own (not HTML):
 * the editor draws them and checks them by their own fields, as the site's build does (checkSite.ts), also one turned
 * off or of an app not installed, as on a page; those are only not offered under "Insert" (SectionsField's `off`). */
export const withPageBlocks = (fields: Field[]): Field[] =>
  fields.map((f) =>
    f.type === 'blocks' && f.pageBlocks
      ? {
          ...f,
          blocks: [
            ...(f.blocks ?? []),
            ...siteBlocks.filter((b) => b.type !== htmlBlock.type && !f.blocks?.some((own) => own.type === b.type)),
          ],
        }
      : f,
  );

/** What is wrong with the blocks in a text, a message for each, by their own fields (check.ts) and
 * the page's template: the editor says the first before it saves a page (EntryForm.tsx), and the
 * site's build says them all (checkSite.ts). A hidden block is not on the site, so it may be
 * unfinished. */
/** The standard page a page is ("Settings" › "Appearance" › "Default pages", config.standardPages: the front page,
 * the blog page …), by the address there, or undefined. */
export function standardPageOf(file: { path: string; text: string }, files: { path: string; text: string }[]): StandardPage | undefined {
  if (!config.standardPages || !file.path.startsWith(`${config.folders.pages}/`)) return undefined;
  const own = String(readFields(splitFrontmatter(file.text).yaml).path ?? `/${slugOf(file.path, config.folders.pages)}/`);
  const paths = standardPaths(files.find((f) => f.path === config.standardPages)?.text);
  return standardPages.find((p) => paths[p.key] === own);
}

/** A page's template as a standard page's: its own rules and the standard page's (its `template`, packages/editor/defaults/standardPages.ts). */
export const asStandardTemplate = (template: Template | undefined, standard: StandardPage | undefined): Template | undefined => {
  const own = standard?.template;
  if (!own) return template;
  return {
    ...template,
    ...own,
    max: { ...template?.max, ...own.max },
    required: [...(template?.required ?? []), ...(own.required ?? [])],
    locked: [...(template?.locked ?? []), ...(own.locked ?? [])],
  };
};

/** What is wrong with the blocks in a text (with or without its front matter) by their fields and the template. With
 * `leads` (the front page), a block's heading, text and image may be the text above its card, as the site reads it. */
export function blockProblems(text: string, template?: Template, leads?: Record<string, Lead>): string[] {
  const name = (type: string) => siteBlocks.find((b) => b.type === type)?.label ?? type;
  const rules = template
    ? templateProblems(
        template,
        blocksIn(text).map((b) => ({ type: b.type, hidden: b.props.hidden })),
        name,
      )
    : [];
  const parts = leads
    ? (sectionsFromParts(partsOfMarkdown(splitFrontmatter(text).body), leads) as { type: string; hidden?: boolean }[])
        .filter((s) => s.type !== 'text' && !s.hidden)
        .map(({ type, ...props }) => ({ type, props }))
    : splitBlocks(text, null);
  const own = parts.flatMap((part) => {
    if (!('type' in part)) return [];
    const block = siteBlocks.find((b) => b.type === part.type);
    if (!block) return [t.blocks.gone(part.type)];
    const problem = check(block.fields, part.props, block.label);
    return problem ? [problem] : [];
  });
  return [...own, ...rules];
}

/** The block as it looks on the site, or null when there is no image of it. On a fixed page its
 * sections (the theme's previews.tsx), or the block of the section's type (Book an appointment); a section can
 * draw a block by its type too (`block`, the prices on the prices page), so the theme never imports one. */
export function preview(type: string, props: BlockProps, data: BlockData) {
  const file = data.page?.file;
  const drawOf = (t: string) => siteBlocks.find((b) => b.type === t)?.draw;
  const block: DrawBlock = (t, p) => drawOf(t)?.(p, data) ?? null;
  const draw = file ? (fixedPages[file]?.[type] ?? everyFixedPage[type] ?? drawOf(type)) : drawOf(type);
  return draw ? (
    <InEditor>
      <Texts.Provider value={data.site}>
        <Drawn draw={draw} props={props as Props} data={data} block={block} />
      </Texts.Provider>
    </InEditor>
  ) : null;
}

// A block drawn as a component, inside Texts: a section that reads the texts (useTexts in the theme's
// previews.tsx) uses a hook, which is only allowed while React draws a component.
function Drawn({
  draw,
  props,
  data,
  block,
}: {
  draw: (props: Props, data: BlockData, block: DrawBlock) => ReactNode;
  props: Props;
  data: BlockData;
  block: DrawBlock;
}) {
  return draw(props, data, block);
}
