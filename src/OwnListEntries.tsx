// A list's entries typed in place, on its edit page (`#list/<id>/edit`): PR B of docs/superpowers/plans/2026-11-14-dynamic-list-edit-page.md, built in the core for every list
// (docs/superpowers/specs/2026-11-14-dynamic-lists-framework-design.md, section 11, phase 8): an owner's list, Testimonials and an app's list, locked ones too. The entries are
// drawn as the editor's List block draws its rows (src/InlineList.tsx, no new design) and each one's title and text are typed where they stand; one row is one entry file.
// A bar of the active row has Add above, Add below, Move up, Move down and Remove (with an Undo). What is typed is saved by itself a moment later, one commit, the way pages are
// (no Save button): a row first typed makes its file (the name is the title's slug and never changes afterwards), a row with nothing in it makes none, Move writes the `order`
// of the two entries that swap, Remove deletes the file. A part that is not typed (icon, link, image, tags) opens the entry's own page, which keeps working. The rules that
// need no screen are lib/listEntries.mjs and lib/ownList.mjs.
import { useEffect, useRef, useState } from 'react';
import addAboveIcon from '@material-symbols/svg-400/outlined/add_row_above.svg?raw';
import addBelowIcon from '@material-symbols/svg-400/outlined/add_row_below.svg?raw';
import upIcon from '@material-symbols/svg-400/outlined/arrow_upward.svg?raw';
import downIcon from '@material-symbols/svg-400/outlined/arrow_downward.svg?raw';
import deleteIcon from '@material-symbols/svg-400/outlined/delete.svg?raw';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import InlineList, { type Row } from './InlineList';
import type { Change } from './InlineItems';
import { Toolbar, ToolbarButton } from './ui';
import { ConflictError, type RepoFile } from './github';
import { siteT, t } from './i18n';
import { savedText } from './deploy';
import { snackbar } from '../lib/snackbar';
import { isEmptyRow, removeAt } from './inlineRows.mjs';
import { entriesIn } from '../lib/ownListEdit.mjs';
import { entrySlug } from '../lib/ownList.mjs';
import { dataOfRow, isBlank, kindsOfList, moveRow, orderRows, rowOfData, slotFields } from '../lib/listEntries.mjs';
import type { Env } from './App';
import type { OwnedList } from './schema';

/** A raw SVG as the icon a toolbar button takes. */
const raw = (svg: string) =>
  (({ size }: { size?: number | string }) => (
    <span
      aria-hidden="true"
      style={{ display: 'inline-flex', width: Number(size) || 24, height: Number(size) || 24 }}
      dangerouslySetInnerHTML={{ __html: svg.replace('<svg', '<svg width="100%" height="100%" fill="currentColor"') }}
    />
  )) as unknown as PhosphorIcon;
const AddAbove = raw(addAboveIcon);
const AddBelow = raw(addBelowIcon);
const Up = raw(upIcon);
const Down = raw(downIcon);
const Remove = raw(deleteIcon);

type Entry = { id: string; row: Row; order?: number };
/** What is known of an entry's file: its data as saved (so the fields no part shows are kept), its path, blob id and text. */
type Known = { path?: string; oid: string | null; data: Record<string, any>; text?: string };

/** Two entries' data are the same when every key has the same value, whatever the order of the keys. */
const same = (a: Record<string, unknown>, b: Record<string, unknown>) => {
  const sorted = (o: Record<string, unknown>) =>
    JSON.stringify(
      Object.keys(o)
        .sort()
        .map((k) => [k, o[k]]),
    );
  return sorted(a) === sorted(b);
};

let counter = 0;
const newId = () => `row-${++counter}`;

export default function OwnListEntries({ collection, files, env }: { collection: OwnedList; files: RepoFile[]; env: Env }) {
  const slots = slotFields(collection.fields, kindsOfList(collection)) as Record<string, string>;
  const folder = collection.folder;
  const known = useRef(new Map<string, Known>());
  const [entries, setEntries] = useState<Entry[]>(() => {
    const found = entriesIn(files, folder) as { path: string; data: Record<string, any> }[];
    const made = found.map((e) => {
      const file = files.find((f) => f.path === e.path)!;
      const id = newId();
      known.current.set(id, { path: e.path, oid: file.oid ?? null, data: e.data, text: file.text });
      return { id, row: rowOfData(e.data, slots) as Row, order: typeof e.data.order === 'number' ? (e.data.order as number) : undefined };
    });
    // The list's own order, then by name, as the list page has them.
    return made
      .map((m, n) => ({ m, n }))
      .sort((a, b) => (a.m.order ?? a.n) - (b.m.order ?? b.n) || a.n - b.n)
      .map(({ m }) => m);
  });
  const [active, setActive] = useState<number | null>(null);
  const [focus, setFocus] = useState<{ row: number; field: string } | null>(null);
  const live = useRef(entries);
  live.current = entries;
  const removed = useRef<{ id: string; path: string; oid: string | null }[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  const label = collection.label.toLowerCase();

  /** Writes what changed, as one commit: new and changed entries, moved entries (their `order`), removed ones. */
  async function write() {
    const rows = live.current;
    const wanted = rows.filter((e) => !isEmptyRow(e.row) || known.current.get(e.id)?.path);
    const orders = orderRows(wanted.map((e) => e.order)) as number[];
    const taken = new Set([...files.map((f) => f.path), ...[...known.current.values()].flatMap((k) => (k.path ? [k.path] : []))]);
    const changes: { path: string; content: string | null; oid: string | null }[] = [];
    const next = new Map<string, Known & { path: string }>();
    const dropped: string[] = [];
    wanted.forEach((e, n) => {
      const was = known.current.get(e.id);
      const data = dataOfRow(was?.data ?? {}, e.row, slotsRef.current, orders[n]) as Record<string, any>;
      if (isBlank(data)) {
        if (was?.path) {
          changes.push({ path: was.path, content: null, oid: was.oid });
          dropped.push(e.id);
        }
        return;
      }
      const path =
        was?.path ??
        `${folder}/${entrySlug(String(e.row.title ?? e.row.text ?? ''), (name: string) => taken.has(`${folder}/${name}.json`))}.json`;
      taken.add(path);
      const content = `${JSON.stringify(data, null, 2)}\n`;
      if (was?.path && same(was.data, data)) return;
      changes.push({ path, content, oid: was?.oid ?? null });
      next.set(e.id, { path, oid: was?.oid ?? null, data, text: content });
    });
    const gone = removed.current.splice(0);
    for (const r of gone) changes.push({ path: r.path, content: null, oid: r.oid });
    if (!changes.length) return;
    const what = t.app.changes.edited(label);
    env.notify({ text: t.common.saving });
    try {
      const oids = await env.commit(siteT.forms.commit.edit(label), changes, what);
      for (const [id, k] of next) {
        known.current.set(id, { ...k, oid: oids[k.path] ?? k.oid });
        env.onSaved({ path: k.path, oid: oids[k.path], text: k.text! });
      }
      for (const id of dropped) known.current.set(id, { oid: null, data: {} });
      const deleted = changes.filter((c) => c.content === null).map((c) => c.path);
      if (deleted.length) env.forget(deleted);
      // The orders that were given are the rows' own now.
      const byId = new Map(wanted.map((e, n) => [e.id, orders[n]]));
      setEntries((rs) => rs.map((e) => (byId.has(e.id) ? { ...e, order: byId.get(e.id) } : e)));
      env.notify({ text: savedText(what), kind: 'saved' });
    } catch (e) {
      // What was removed stays to be tried again with the next change.
      removed.current.push(...gone);
      env.notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
    }
  }
  const flush = () => {
    clearTimeout(timer.current);
    timer.current = undefined;
    return (chain.current = chain.current.then(write, write));
  };
  const later = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 800);
  };
  // Leaving the page saves what waits.
  useEffect(
    () => () => {
      if (timer.current) void flush();
    },
    [],
  );

  const forget = (e: Entry) => {
    const k = known.current.get(e.id);
    if (k?.path) removed.current.push({ id: e.id, path: k.path, oid: k.oid });
  };

  /** The items InlineItems made (it keeps untouched rows as the same objects): the ids follow the rows, a row made new gets one. */
  function onItems(items: Row[]) {
    const cur = live.current;
    const made: Entry[] = items.map((row, i) => {
      if (items.length === cur.length) return { ...cur[i], row };
      const same = cur.find((e) => e.row === row);
      return same ?? { id: newId(), row };
    });
    for (const e of cur) if (!made.some((m) => m.id === e.id)) forget(e);
    setEntries(made);
    later();
  }
  const change = (c: Change) => {
    if (c.items) onItems(c.items as Row[]);
    if (c.active !== undefined) setActive(c.active);
    if (c.focus !== undefined) setFocus(c.focus);
  };

  const at = active !== null && active < entries.length ? active : null;
  const add = (index: number) => {
    setEntries([...entries.slice(0, index), { id: newId(), row: { title: '' } }, ...entries.slice(index)]);
    setActive(index);
    setFocus({ row: index, field: 'title' });
  };
  const move = (by: -1 | 1) => {
    if (at === null) return;
    const rows = entries.map((e, n) => ({ ...e, order: e.order ?? n }));
    const next = moveRow(rows, at, by) as Entry[];
    if (next === rows) return;
    setEntries(next);
    setActive(at + by);
    later();
  };
  const remove = () => {
    if (at === null) return;
    const gone = entries[at];
    const k = known.current.get(gone.id);
    forget(gone);
    setEntries(removeAt(entries, at) as Entry[]);
    setActive(entries.length > 1 ? Math.max(0, at - 1) : null);
    later();
    snackbar({
      text: t.ownList.itemRemoved,
      links: [
        {
          text: t.ownList.undo,
          href: '#',
          onClick: (e) => {
            e.preventDefault();
            // Not deleted yet: it simply stays. Else its file is gone, and it comes back as a new one with the data it had.
            const waiting = removed.current.some((r) => r.id === gone.id);
            removed.current = removed.current.filter((r) => r.id !== gone.id);
            if (!waiting) known.current.set(gone.id, { oid: null, data: k?.data ?? {} });
            setEntries((rs) => [...rs.slice(0, at), gone, ...rs.slice(at)]);
            setActive(at);
            later();
          },
        },
      ],
    });
  };

  /** A part that is not typed here (icon, link, image, tags) is on the entry's own page: what waits is saved, then it opens. */
  const open = (i: number) => {
    const e = entries[i];
    void flush().then(() => {
      const path = known.current.get(e?.id)?.path;
      if (path) location.hash = `#${path}`;
    });
  };

  if (!slots.title) return null;
  const rows = entries.map((e) => e.row);
  return (
    <div className="own-list-entries" data-entries="">
      <h2 className="mb-1 font-medium">{t.ownList.items}</h2>
      <Toolbar label={t.ownList.itemTools} className="own-list-entry-tools rounded-panel border border-outline-variant">
        <div role="group" aria-label={t.ownList.itemTools} className="flex items-center gap-1">
          <ToolbarButton icon={AddAbove} label={t.ownList.addAbove} disabled={at === null} onClick={() => at !== null && add(at)} />
          <ToolbarButton
            icon={AddBelow}
            label={t.ownList.addBelow}
            disabled={entries.length > 0 && at === null}
            onClick={() => add(at === null ? entries.length : at + 1)}
          />
          <ToolbarButton icon={Up} label={t.ownList.moveUp} disabled={at === null || at === 0} onClick={() => move(-1)} />
          <ToolbarButton
            icon={Down}
            label={t.ownList.moveDown}
            disabled={at === null || at === entries.length - 1}
            onClick={() => move(1)}
          />
          <ToolbarButton icon={Remove} label={t.ownList.removeItem} disabled={at === null} onClick={remove} />
        </div>
      </Toolbar>
      <InlineList
        items={rows}
        active={active}
        focus={focus}
        onChange={change}
        onSettings={open}
        onIcon={open}
        onImage={open}
        onTags={open}
        show={{ icon: !!slots.icon, text: !!slots.text, href: !!slots.href, image: !!slots.image, tags: !!slots.tags }}
      />
    </div>
  );
}
