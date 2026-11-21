// "Parts" › "UI components" (#developer/parts/ui), "Parts" › "Blocks" (#developer/parts/blocks) and "Parts" › a list of kinds
// ("Promotion", #developer/parts/list/<id>): how the site looks, every part in every version, to see and agree on it.
// "UI components" also has the active theme's coverage (summary, mark on each part, filter by style) and the site frame's parts.
// "UI components" has the theme's UI components (its buttons and icon buttons, text fields and checkboxes …,
// packages/editor/theme/ui/, through @site/editor) in every kind, size and state; "Blocks" every block, the standard
// ones (packages/editor/src/standard/), which every theme styles, and then the apps', each in its own group; a list of
// kinds each of its kinds as the site draws an entry of it, the list's own (the pop-up, the bars) and the apps' (a
// pop-up, once for each of its states), the kind a group. A block's versions are the
// options of its choices side by side (a field with `segments`: the designs of "Cards"), the first choice's all, each
// other's but the one a new block has (its default, else the empty one: the backgrounds of "Cards", with the first's empty
// option). All of it is drawn with the
// made-up site of examples.ts, never the site's own, with the search, the order and the filter of "Editor"
// (PartsShown.tsx). Nothing here is saved.
import { useMemo } from 'react';
import Screen from './Screen';
import { PartGroup, Part, PartsShown } from './PartsShown';
import { CoverageSummary } from './CoverageSummary';
import { ComponentGallery, galleryGroups } from './ComponentGallery';
import { Preview } from './ui';
import { exampleOf, type BlockData, type BlockProps, type SiteBlock } from './blocks';
import { apps, preview, siteBlocks, standardTypes } from './registry';
import { exampleImage, exampleData, kindExample } from './examples';
import type { Field, FolderCollection, PreviewVariant } from './schema';
import { kindDraw } from './apps';
import { collections } from './site';
import { t } from './i18n';

const { screens } = t.parts;
const back = { href: '#developer/parts', label: t.common.parts.editorParts };

// The fields filled in with the plain image where they have none (a card's, a list's items').
function imaged(fields: Field[], props: BlockProps): BlockProps {
  const filled = { ...props };
  for (const f of fields) {
    const v = filled[f.name];
    if (f.type === 'image' && !v) filled[f.name] = exampleImage;
    else if (f.type === 'object' && f.fields) filled[f.name] = imaged(f.fields, (v ?? {}) as BlockProps);
    else if (f.type === 'list' && f.fields && Array.isArray(v)) filled[f.name] = v.map((item) => imaged(f.fields!, item as BlockProps));
  }
  return filled;
}

// A block's versions: one for each option of its first choice side by side and for each other option of the others
// than the one a new block has, else only itself.
function versionsOf(block: SiteBlock): PreviewVariant[] {
  const [first, ...rest] = block.fields.filter((f) => f.type === 'select' && f.segments && !f.only);
  if (!first?.options) return [{ label: '', props: {} }];
  return [
    ...first.options.map((o) => ({ label: o.label, props: { [first.name]: o.value } })),
    ...rest.flatMap((c) =>
      (c.options ?? []).filter((o) => o.value !== String(c.default ?? '')).map((o) => ({ label: o.label, props: { [c.name]: o.value } })),
    ),
  ];
}

/** A block in each of its versions, filled in as an example, under its name (and the version's). */
function BlockShown({ block, data }: { block: SiteBlock; data: BlockData }) {
  const example = exampleOf(block, data);
  return versionsOf(block).map((v) => (
    <Part key={v.label} name={v.label ? `${block.label} · ${v.label}` : block.label} use={block.hint}>
      <Preview>{preview(block.type, imaged(block.fields, { ...example, ...v.props }), data)}</Preview>
    </Part>
  ));
}

// The standard blocks (not HTML, which has no look of its own).
const standardBlocks = siteBlocks.filter((b) => standardTypes.has(b.type));

/** "Parts" › "UI components" (#developer/parts/ui): the theme's UI components in every kind, size and state. The groups and their
 * parts are ComponentGallery's (src/ComponentGallery.tsx), which the site's UI components page (`componentsPath`) draws as well. */
export function ComponentParts() {
  return (
    <Screen title={screens.components} back={back}>
      <div className="mo-editor-parts-sections">
        <div className="mo-editor-parts-intro">
          <p className="mo-editor-parts-intro-text">{screens.componentsIntro}</p>
          <CoverageSummary />
        </div>
        <PartsShown groups={galleryGroups(true)} keep="parts-components" search={screens.search} none={screens.none} styleFilter>
          <ComponentGallery editor />
        </PartsShown>
      </div>
    </Screen>
  );
}

/** "Parts" › "Blocks" (#developer/parts/blocks): every block, the standard ones and then the apps', each a group of its
 * own, in all its versions. */
export function BlocksParts() {
  const data = useMemo(exampleData, []);
  const blocks = [...standardBlocks, ...apps.flatMap((app) => siteBlocks.filter((b) => b.app === app.id))];
  return (
    <Screen title={screens.blocks} back={back}>
      <div className="mo-editor-parts-sections">
        <p className="mo-editor-parts-intro-text">{screens.blocksIntro}</p>
        <PartsShown
          groups={blocks.map((b) => ({ id: b.type, title: b.label }))}
          keep="parts-blocks"
          search={screens.search}
          none={screens.none}
        >
          {blocks.map((b) => (
            <PartGroup key={b.type} group={b.type}>
              <BlockShown block={b} data={data} />
            </PartGroup>
          ))}
        </PartsShown>
      </div>
    </Screen>
  );
}

/** The lists of kinds ("Promotion"), each a screen of "Parts". */
export const kindLists = () => collections.filter((c): c is FolderCollection => c.kind === 'folder' && !!c.kinds && !!c.fields?.length);

/** "Parts" › a list of kinds ("Promotion", #developer/parts/list/<id>): each of its kinds as the site draws it, its own
 * (FolderCollection.draws: the pop-up, the bars) and the apps' (AppKind: Mailchimp's signup, once for each of its
 * states), each a group of its own, as a new one of the kind with the made-up texts (kindExample). */
export function KindParts({ id }: { id: string }) {
  const data = useMemo(exampleData, []);
  const list = kindLists().find((c) => c.id === id);
  const kindField = list?.fields.find((f) => f.name === list.kinds);
  if (!list || !kindField) return null;
  const own = (kindField.options ?? []).flatMap((o) => {
    const draw = list.draws?.[o.value];
    return draw ? [{ id: o.value, label: o.label, hint: o.hint, variants: [{ label: '', props: {} }], draw }] : [];
  });
  const added = apps.flatMap((app) => {
    const kind = app.kinds?.[list.id];
    const draw = kind && kindDraw(kind, list);
    return kind && draw
      ? [{ id: app.id, label: kind.label, hint: kind.hint, variants: kind.variants ?? [{ label: '', props: {} }], draw }]
      : [];
  });
  const kinds = [...own, ...added];
  return (
    <Screen title={list.label} back={back}>
      <div className="mo-editor-parts-sections">
        <p className="mo-editor-parts-intro-text">{screens.kindsIntro(list.singular)}</p>
        <PartsShown
          groups={kinds.map((k) => ({ id: k.id, title: k.label }))}
          keep={`parts-list-${list.id}`}
          search={screens.search}
          none={screens.none}
        >
          {kinds.map((k) => (
            <PartGroup key={k.id} group={k.id}>
              {k.variants.map((v) => (
                <Part key={v.label} name={v.label ? `${k.label} · ${v.label}` : k.label} use={k.hint}>
                  <Preview>{k.draw({ ...kindExample(list, k.id), ...v.props }, data)}</Preview>
                </Part>
              ))}
            </PartGroup>
          ))}
        </PartsShown>
      </div>
    </Screen>
  );
}
