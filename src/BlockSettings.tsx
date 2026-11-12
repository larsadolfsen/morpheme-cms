// "Blocks" › "Block settings" (#block-settings): the blocks that can be put in the text of a page, in
// groups, the editor's standard blocks (packages/editor/src/standard/) and those of each app installed under "Apps",
// under the app's name (e.g. "Mailchimp",
// src/apps/, AppList.tsx; an app not installed has none here), each with how many pages it is on at its right
// (ListItem's count, as the counts on the editor's front page), or "Disabled" when it is off. An app's group also has
// its kinds of the site's lists (Mailchimp's pop-up), each with how many there are at its right (or "Disabled"), as
// a block; one with neither says so. Tapping a block opens a sheet from the bottom (a dialog on a computer), as a
// image in "Files" does: what it is, a switch, and the pages it is on, each a link to it in the editor; a kind's the
// same, with the entries of it. The switch saves at once, in its own commit. A block that is off is not offered under
// "Insert", and a new page does not start with it; a kind that is off not under "+" of its list. A block on a page (a
// kind with entries) cannot be turned off: it is removed from the pages first, so turning a block off never changes the
// site. Saved in the site's file of block settings (config.blockSettings) as the blocks (and kinds, kindKey) that are
// off, so a new block is on until turned off. The sheet also shows how the block looks on the site (Preview): as on the
// first page it is on (a kind: as its first entry), or with an example when it is on none. Over the
// groups, as over the lists, a search by name, the order (by group, A–Z or Z–A, kept in this browser; A–Z
// under the first letter) and the funnel with the filters by group, by on or off and by whether it is used,
// each picked one as a chip.
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowsDownUp } from '@phosphor-icons/react';
import Screen from './Screen';
import {
  InputChip,
  Choice,
  Filters,
  Group,
  LeadingIcon,
  listClass,
  SupportingText,
  Preview,
  SearchRow,
  BottomSheet,
  SheetTitle,
  SwitchRow,
  SheetBody,
  ListItem,
} from './ui';
import { ConflictError, type RepoFile } from './github';
import type { FolderCollection } from './schema';
import type { Env } from './App';
import { kindAndName, lower, savedText } from './deploy';
import { readFields, splitFrontmatter } from './frontmatter.mjs';
import { HTML } from './markdown.mjs';
import { byText } from './schema';
import { exampleOf, type BlockData, type BlockProps, type SiteBlock } from './blocks';
import { blocksIn } from '../lib/blocks.mjs';
import { apps, offBlocks, preview, siteBlocks } from './registry';
import { activeApps, kindDraw, kindKey, type SiteApp } from './apps';
import { entriesOf, kindsOf } from './AppList';
import { asWritten, backFrom, collections } from './site';
import { exampleImage, kindExample as newOfKind } from './examples';
import { headed, letterOf } from './Sheet';
import { config } from '@site/editor';
import { siteT, t } from './i18n';

// In alphabetical order, as under "Insert" (BlockDialog.tsx).
const blocks = [...siteBlocks].sort((a, b) => byText(a.label, b.label));

// A block's name in the site's language, for the commit: a standard block's from the texts, the site's
// own as it wrote it (their labels are in the editor's language).
const siteLabel = (b: SiteBlock) =>
  (b.standard ? (siteT.blocks as Record<string, { label?: string }>)[b.type]?.label : undefined) ?? asWritten(b).label;

// HTML on a line of its own (the block "HTML code", markdown.mjs): an embedded video, a calendar, a table.
const HTML_LINE = /^<(?!div data-block)(iframe|table|div|figure|script|section|details|video|audio|form|style|center|blockquote)\b/m;

/** The pages and posts a block is on (any copy, also a hidden one), by their title. */
export function pagesWith(type: string, files: RepoFile[]): { path: string; title: string }[] {
  return files
    .filter(
      (f) =>
        f.path.endsWith('.md') && (type === HTML ? HTML_LINE.test(splitFrontmatter(f.text).body) : f.text.includes(`data-block="${type}"`)),
    )
    .map((f) => ({ path: f.path, title: String(readFields(splitFrontmatter(f.text).yaml).title ?? f.path) }))
    .sort((a, b) => byText(a.title, b.title));
}

/** The block as an example for its preview: its fields as on the first of its pages that shows it (or
 * has it hidden), with the page's title; its example (exampleOf) and no page when it is on none. */
function example(
  block: SiteBlock,
  pages: { path: string; title: string }[],
  files: RepoFile[],
  data: BlockData,
): { props: BlockProps; on?: string } {
  const copies = pages.flatMap((p) => {
    const text = files.find((f) => f.path === p.path)?.text ?? '';
    return blocksIn(text)
      .filter((b) => b.type === block.type)
      .map((b) => ({ props: b.props as BlockProps, on: p.title }));
  });
  return copies.find((c) => !c.props.hidden) ?? copies[0] ?? { props: exampleOf(block, data) };
}

/** An app's kind of a list for its preview: drawn with the fields of its first entry (one that is on, if any), with
 * the entry's name, else with the example "Parts" draws it with (kindExample in examples.ts); in its first state
 * (Mailchimp's before a signup). None when it has no drawing. */
function kindExample(app: SiteApp, list: string, files: RepoFile[], data: BlockData): { node: ReactNode; on?: string } | null {
  const kind = app.kinds![list];
  const collection = collections.find((c) => c.id === list && c.kind === 'folder') as FolderCollection | undefined;
  const draw = kindDraw(kind, collection);
  if (!draw) return null;
  const copies = entriesOf(app, list, files).flatMap((e) => {
    try {
      return [{ props: JSON.parse(files.find((f) => `#${f.path}` === e.href)?.text ?? '') as Record<string, unknown>, on: e.title }];
    } catch {
      return [];
    }
  });
  const onOff = collection?.onOff;
  const copy = copies.find((c) => !onOff || c.props[onOff] !== false) ?? copies[0];
  const props = copy?.props ?? (collection ? newOfKind(collection, app.id) : { ...t.parts.examples.entry, image: exampleImage });
  return { node: draw({ ...props, ...kind.variants?.[0]?.props }, data), on: copy?.on };
}

/** "How it looks": the block in a Preview, with where its fields come from under it (`note`, by whether it
 * draws nothing). Should it draw nothing with its example, no empty frame, only that. */
function Looks({ children, note }: { children: ReactNode; note: (blank: boolean) => string }) {
  const box = useRef<HTMLDivElement>(null);
  const [blank, setBlank] = useState(false);
  useLayoutEffect(() => {
    const el = box.current;
    setBlank(!!el && !el.textContent?.trim() && !el.querySelector('img, svg, iframe, video'));
  }, [children]);
  return (
    <div>
      <p className="mb-2 font-medium">{t.blockSettings.looks}</p>
      <div ref={box} hidden={blank}>
        <Preview>{children}</Preview>
      </div>
      <SupportingText className={blank ? '' : 'mt-2'}>{note(blank)}</SupportingText>
    </div>
  );
}

// What can be turned off, in the order it is saved: the blocks, by their type, then the apps' kinds, by kindKey.
const switchable = () => [
  ...siteBlocks.map((b) => b.type),
  ...apps.flatMap((a) => Object.keys(a.kinds ?? {}).map((list) => kindKey(list, a.id))),
];

export type SwitchTexts = {
  label: string;
  stuck: string;
  stillOn: string;
  onHint: string;
  offHint: string;
  commit: (on: boolean) => string;
  /** What turning it on or off changed, in the editor's language (deploy.ts). */
  change: (on: boolean) => string;
};

/** Whether a block (or an app's kind, by `id`) is on, and `turn`, which turns it on or off, saved at once in its own
 * commit: the switch here, and the one in its row on its app's page (AppList.tsx). Used (`count`), it cannot be turned
 * off (it can be turned on again, if it was off): `turn` says so. */
export function useOnOff(id: string, count: number, texts: SwitchTexts, env: Env, files: RepoFile[]) {
  const notify = env.notify;
  const [saving, setSaving] = useState(false);
  const off = offBlocks(files);
  const on = !off.includes(id);
  const stuck = on && count > 0;

  async function turn(on: boolean) {
    if (!on && count) return notify({ text: texts.stillOn, error: true });
    const file = files.find((f) => f.path === config.blockSettings);
    const next = off.filter((t) => t !== id).concat(on ? [] : [id]);
    const text = `${JSON.stringify({ off: switchable().filter((t) => next.includes(t)) }, null, 2)}\n`;
    if (text === file?.text) return;
    setSaving(true);
    notify({ text: t.common.saving });
    try {
      const path = config.blockSettings;
      const oids = await env.commit(texts.commit(on), [{ path, content: text, oid: file?.oid || null }], texts.change(on));
      env.onSaved({ path, oid: oids[path], text });
      notify({ text: savedText(texts.change(on)), kind: 'saved' });
    } catch (e) {
      notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setSaving(false);
    }
  }

  return { on, stuck, saving, turn };
}

/** The switch that turns a block (or an app's kind, by `id`) on or off, with what it means under it. */
function OnOffSwitch({ id, count, texts, env, files }: { id: string; count: number; texts: SwitchTexts; env: Env; files: RepoFile[] }) {
  const { on, stuck, saving, turn } = useOnOff(id, count, texts, env, files);
  return (
    <div>
      <SwitchRow label={texts.label} selected={on} disabled={stuck || saving} onChange={turn} />
      <SupportingText className="mt-2">{stuck ? texts.stuck : on ? texts.onHint : texts.offHint}</SupportingText>
    </div>
  );
}

/** What the switch of a block says, on `count` pages. */
export const blockSwitchTexts = (block: SiteBlock, count: number): SwitchTexts => ({
  label: t.blockSettings.active,
  stuck: t.blockSettings.stuck,
  stillOn: t.blockSettings.stillOn(count),
  onHint: t.blockSettings.onHint,
  offHint: t.blockSettings.offHint,
  commit: (on) => siteT.blockSettings.commit[on ? 'on' : 'off'](siteLabel(block)),
  change: (on) => t.app.changes[on ? 'turnedOn' : 'turnedOff'](kindAndName(t.app.changes.block, block.label)),
});

/** What the switch of an app's kind of a list (`list`, its id) says, with `count` entries. */
export function kindSwitchTexts(app: SiteApp, list: string, count: number): SwitchTexts {
  const c = collections.find((x) => x.id === list)!;
  const create = c.create ?? c.label;
  const written = asWritten(app).kinds?.[list]?.label ?? app.kinds![list].label;
  return {
    label: t.blockSettings.active,
    stuck: t.blockSettings.kindStuck(c.label),
    stillOn: t.blockSettings.kindStillOn(count, count === 1 ? c.singular : c.label.toLocaleLowerCase()),
    onHint: t.blockSettings.kindOnHint(create),
    offHint: t.blockSettings.kindOffHint(create),
    commit: (on) => siteT.blockSettings.commit[on ? 'kindOn' : 'kindOff'](written),
    change: (on) => t.app.changes[on ? 'turnedOn' : 'turnedOff'](lower(app.kinds![list].label)),
  };
}

/** "Activated": the switch of a block, here and in the sheet on its app's page (AppList.tsx). On a page, it
 * cannot be turned off. */
export function BlockSwitch({ block, env, files }: { block: SiteBlock; env: Env; files: RepoFile[] }) {
  const count = useMemo(() => pagesWith(block.type, files).length, [block.type, files]);
  return <OnOffSwitch id={block.type} count={count} texts={blockSwitchTexts(block, count)} env={env} files={files} />;
}

/** "Activated": the switch of an app's kind of a list (`list`, its id), here and in the sheet on the app's
 * page (AppList.tsx); off, it is not under "+" of the list. With entries, it cannot be turned off. */
export function KindSwitch({ app, list, env, files }: { app: SiteApp; list: string; env: Env; files: RepoFile[] }) {
  const count = useMemo(() => entriesOf(app, list, files).length, [app, list, files]);
  return <OnOffSwitch id={kindKey(list, app.id)} count={count} texts={kindSwitchTexts(app, list, count)} env={env} files={files} />;
}

type Sort = 'group' | 'az' | 'za';
const SORTS: Sort[] = ['group', 'az', 'za'];
// The order picked last time, in this browser.
const SORT_KEY = 'editor-sort-block-settings';
type OnOff = '' | 'on' | 'off';
type Use = '' | 'used' | 'unused';

// A row of the list: a block, or a kind an app adds to a list (a pop-up).
type Row = { key: string; label: string; group: string; used: boolean; on: boolean; node: ReactNode };

// What the sheet shows: a block, or an app's kind of a list (`list`, its id).
type Open = { block: SiteBlock } | { app: SiteApp; list: string };

export default function BlockSettings({ env, files }: { env: Env; files: RepoFile[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<Open | null>(null);
  const off = offBlocks(files);
  const pages = useMemo(() => Object.fromEntries(blocks.map((b) => [b.type, pagesWith(b.type, files)])), [files]);

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>(() => {
    try {
      const saved = localStorage.getItem(SORT_KEY);
      if (SORTS.some((s) => s === saved)) return saved as Sort;
    } catch {}
    return 'group';
  });
  const [group, setGroup] = useState('');
  const [onOff, setOnOff] = useState<OnOff>('');
  const [use, setUse] = useState<Use>('');

  function pickSort(next: Sort) {
    setSort(next);
    try {
      localStorage.setItem(SORT_KEY, next);
    } catch {}
  }

  const blockRow = (b: SiteBlock, group: string): Row => ({
    key: b.type,
    label: b.label,
    group,
    used: pages[b.type].length > 0,
    on: !off.includes(b.type),
    node: (
      <ListItem
        key={b.type}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen({ block: b });
          dialog.current?.showModal();
        }}
        icon={b.icon}
        headline={b.label}
        count={off.includes(b.type) ? t.blockSettings.inactive : pages[b.type].length}
        arrow
      />
    ),
  });
  const installed = activeApps(files);
  // A group for each installed app, under its name, in alphabetical order: its blocks and its kinds.
  const fromApps = apps
    .filter((a) => installed.includes(a.id))
    .sort((a, b) => byText(a.label, b.label))
    .map((a) => ({
      title: a.label,
      rows: [
        ...blocks.filter((b) => b.app === a.id).map((b) => blockRow(b, a.label)),
        ...kindsOf(a).map((k): Row => {
          const n = entriesOf(a, k.key, files).length;
          const key = kindKey(k.key, a.id);
          const on = !off.includes(key);
          return {
            key,
            label: k.label,
            group: a.label,
            used: n > 0,
            on,
            node: (
              <ListItem
                key={key}
                aria-haspopup="dialog"
                onClick={() => {
                  setOpen({ app: a, list: k.key });
                  dialog.current?.showModal();
                }}
                icon={k.icon}
                headline={k.label}
                count={on ? n : t.blockSettings.inactive}
                arrow
              />
            ),
          };
        }),
      ],
    }));
  const groups = [
    { title: t.blockSettings.standard, rows: blocks.filter((b) => b.standard).map((b) => blockRow(b, t.blockSettings.standard)) },
    ...fromApps,
  ];
  const all = groups.flatMap((g) => g.rows);
  // Each filter only when it can leave some out: by on or off, and by use, when there are both.
  const bothOnOff = all.some((r) => r.on === true) && all.some((r) => r.on === false);
  const bothUses = all.some((r) => r.used) && all.some((r) => !r.used);
  const shownGroup = groups.some((g) => g.title === group) ? group : '';
  const shownOnOff = bothOnOff ? onOff : '';
  const shownUse = bothUses ? use : '';
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const fits = (r: Row) =>
    words.every((w) => r.label.toLowerCase().includes(w)) &&
    (!shownGroup || r.group === shownGroup) &&
    (!shownOnOff || r.on === (shownOnOff === 'on')) &&
    (!shownUse || r.used === (shownUse === 'used'));
  // An app's group with neither blocks nor kinds says so, while nothing is searched or filtered.
  const narrowed = words.length > 0 || !!shownGroup || !!shownOnOff || !!shownUse;
  const inGroups = groups.map((g) => ({ title: g.title, rows: g.rows.filter(fits), empty: !g.rows.length && !narrowed }));
  const found = inGroups.flatMap((g) => g.rows);
  // A–Z or Z–A: all in one list, under the first letter of their names (headed, from HEADINGS_FROM).
  const lettered =
    sort === 'group'
      ? []
      : headed(
          [...found].sort((a, b) => (sort === 'za' ? -1 : 1) * byText(a.label, b.label)),
          (r) => letterOf(r.label),
        );
  const onOffLabel = (v: OnOff) => (v === 'on' ? t.blockSettings.active : t.blockSettings.inactive);
  const useLabel = (u: Use) => (u === 'used' ? t.library.inUse : t.common.notInUse);
  const filters = [
    groups.length > 1 && {
      title: t.library.groupFilter,
      value: shownGroup,
      options: [{ value: '', label: t.library.allGroups }, ...groups.map((g) => ({ value: g.title, label: g.title }))],
      onChange: setGroup,
    },
    bothOnOff && {
      title: t.library.onOffFilter,
      value: shownOnOff,
      options: [
        { value: '', label: t.library.allOnOff },
        { value: 'on', label: onOffLabel('on') },
        { value: 'off', label: onOffLabel('off') },
      ],
      onChange: (v: string) => setOnOff(v as OnOff),
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
    shownOnOff && { key: 'onOff', label: onOffLabel(shownOnOff), clear: () => setOnOff('') },
    shownUse && { key: 'use', label: useLabel(shownUse), clear: () => setUse('') },
  ].filter((c) => !!c);
  // What the blocks draw from besides their fields: the lists' rows, the testimonials, the rest of the site.
  const data: BlockData = { lists: env.lists, testimonials: env.testimonials, relations: env.relations, site: env.site };
  // The sheet, the same for a block and an app's kind: its name and icon, what it is, how it looks, its switch, and
  // where it is used (the pages a block is on, the entries of a kind).
  const sheet = (() => {
    if (!open) return null;
    if ('block' in open) {
      const b = open.block;
      const here = pages[b.type];
      const shown = b.draw ? example(b, here, files, data) : null;
      const app = apps.find((a) => a.id === b.app);
      return {
        label: b.label,
        icon: b.icon,
        about: `${b.hint ?? b.label} ${b.app ? t.blockSettings.isApp(app?.label ?? b.app) : t.blockSettings.isStandard}`,
        looks: shown && (
          <Looks
            key={b.type}
            note={(blank) => (shown.on ? t.blockSettings.asOn(shown.on) : blank ? t.blockSettings.nothing : t.blockSettings.empty)}
          >
            {preview(b.type, shown.props, data)}
          </Looks>
        ),
        toggle: <BlockSwitch block={b} env={env} files={files} />,
        usedTitle: t.blockSettings.pages,
        used: here.map((p) => ({ href: `#${p.path}`, title: p.title })),
        none: t.blockSettings.noPages,
      };
    }
    const { app, list } = open;
    const kind = app.kinds![list];
    const c = collections.find((x) => x.id === list)!;
    const shown = kindExample(app, list, files, data);
    return {
      label: kind.label,
      icon: kind.icon,
      about: `${kind.hint ?? kind.label} ${t.blockSettings.isKind(c.singular, app.label)}`,
      looks: shown && (
        <Looks
          key={kindKey(list, app.id)}
          note={(blank) => (shown.on ? t.blockSettings.asIn(shown.on) : blank ? t.blockSettings.kindNothing : t.blockSettings.kindEmpty)}
        >
          {shown.node}
        </Looks>
      ),
      toggle: <KindSwitch app={app} list={list} env={env} files={files} />,
      usedTitle: t.blockSettings.usedIn,
      used: entriesOf(app, list, files),
      none: t.blockSettings.noEntries(c.label.toLocaleLowerCase()),
    };
  })();

  return (
    <Screen title={t.common.parts.blockSettings} wide back={backFrom('block-settings')}>
      <SearchRow
        value={query}
        onChange={setQuery}
        label={t.common.searchIn(t.common.parts.blockSettings)}
        sort={
          <Choice
            title={t.library.sort}
            icon={ArrowsDownUp}
            value={sort}
            options={SORTS.map((s) => ({ value: s, label: t.library.sorts[s] }))}
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
      {!found.length && !(sort === 'group' && inGroups.some((g) => g.empty)) ? (
        <p className="mb-8 px-1 text-on-surface-variant">{t.common.noMatch}</p>
      ) : sort === 'group' ? (
        inGroups
          .filter((g) => g.rows.length || g.empty)
          .map((g) => (
            <Group key={g.title} title={g.title}>
              {g.rows.map((r) => r.node)}
              {g.empty && <ListItem tone="muted" headline={t.blockSettings.noBlocks} />}
            </Group>
          ))
      ) : (
        lettered.map((g) => (
          <Group key={g.key ?? 'all'} title={g.key ?? undefined}>
            {g.items.map((r) => r.node)}
          </Group>
        ))
      )}
      <BottomSheet
        ref={dialog}
        aria-label={sheet?.label}
        onClose={(e) => e.target === e.currentTarget && setOpen(null)}
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <SheetTitle title={sheet?.label ?? ''} onClose={() => dialog.current?.close()} />
        {sheet && (
          <SheetBody>
            <div className="flex items-start gap-3">
              <LeadingIcon icon={sheet.icon} />
              <p className="pt-1.5 text-on-surface-variant">{sheet.about}</p>
            </div>
            {sheet.looks}
            {sheet.toggle}
            <div>
              <p className="mb-1 font-medium">{sheet.usedTitle}</p>
              {sheet.used.length ? (
                <ul className={listClass}>
                  {sheet.used.map((u) => (
                    <ListItem key={u.href} href={u.href} onClick={() => dialog.current?.close()} headline={u.title} />
                  ))}
                </ul>
              ) : (
                <p className="text-on-surface-variant">{sheet.none}</p>
              )}
            </div>
          </SheetBody>
        )}
      </BottomSheet>
    </Screen>
  );
}
