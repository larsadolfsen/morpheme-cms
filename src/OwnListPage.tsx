// The page of a list the owner made (`#list/<id>`, docs/superpowers/plans/2026-11-12-new-list.md, batch 4): the List typed in place
// (InlineList.tsx), not a new design: its rows are the entries of the list, one file each. The rows, the active row, the keys and the
// toolbar are the List block's (InlineItems.tsx, inlineBar.ts); what is new here is only what a node view gave them: the state, the
// row-to-file saving (lib/ownListSave.mjs, saved a moment after typing stops, as one commit) and the sheet of a row's icon and link.
import { useEffect, useMemo, useRef, useState } from 'react';
import Screen from './Screen';
import OwnListSheet from './OwnListSheet';
import { DotsThreeVertical, PencilSimple, Trash } from '@phosphor-icons/react';
import InlineList, { type Row } from './InlineList';
import type { Change, Focus, Item } from './InlineItems';
import { inlineBar, type BarAction } from './inlineBar';
import { useBlockDialog, type RowSpec } from './BlockDialog';
import { siteBlocks } from './registry';
import { atLeastNow, IconButton, Menu, MenuItem } from './ui';
import { isEntryPath, rowOfEntry } from '../lib/ownList.mjs';
import { savePlan } from '../lib/ownListSave.mjs';
import { addAt, isEmptyRow, moveBy, setField, withoutEmpty } from './inlineRows.mjs';
import { ConflictError, type RepoFile } from './github';
import { siteT, t } from './i18n';
import { lower, savedText } from './deploy';
import { slugOf, type OwnedList } from './schema';
import { config } from '@site/editor';
import { Fields, type FieldContext } from './fields';
import { creditedIn, useUploads } from './images';
import { useMediaPicker } from './Media';
import { creditChanges, recordsIn } from './fileRecords.mjs';
import type { Env } from './App';

/** A row with a key of its own (a number, so it is not content), which stays while the page is open. */
type KeyedRow = Row & { key: number };

const SAVE_AFTER = 800;

export default function OwnListPage({ collection, files, env }: { collection: OwnedList; files: RepoFile[]; env: Env }) {
  const folder = collection.folder;
  const names = collection.fields.map((f) => f.name);
  const show = {
    icon: names.includes('icon'),
    text: names.includes('text'),
    href: names.includes('href'),
    image: names.includes('image'),
    tags: names.includes('tags'),
  };
  const next = useRef(1);
  // What the page starts with: the entries as rows (by `order`, then the file name), each with the file it is.
  const start = useMemo(() => {
    const known = new Map<string, { oid: string; text: string }>();
    const slugs = new Map<number, string>();
    const rows: KeyedRow[] = files
      .filter((f) => f.path.startsWith(`${folder}/`) && isEntryPath(f.path))
      .sort((a, b) => a.path.localeCompare(b.path))
      .flatMap((f) => {
        try {
          const data = JSON.parse(f.text) as Record<string, unknown>;
          known.set(f.path, { oid: f.oid, text: f.text });
          return [{ order: Number(data.order) || 0, data, slug: slugOf(f.path, folder) }];
        } catch {
          return [];
        }
      })
      .sort((a, b) => a.order - b.order)
      .map(({ data, slug }) => {
        const key = next.current++;
        slugs.set(key, slug);
        return { ...(rowOfEntry(data) as Row), key };
      });
    return { rows, known, slugs };
  }, []);
  const [items, setItems] = useState<KeyedRow[]>(start.rows);
  const [active, setActive] = useState<number | null>(null);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [saving, setSaving] = useState(false);
  const now = useRef({ items, active });
  now.current = { items, active };
  const known = useRef(start.known);
  const slugs = useRef(start.slugs);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const host = useRef<HTMLDivElement>(null);
  // The list's menu (`Edit list`, `Delete list`) and its sheet.
  const menuAt = useRef<HTMLSpanElement>(null);
  const [menu, setMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  // The list is being deleted: nothing more is saved.
  const gone = useRef(false);
  // The fields the list has now (an edit of the list changes them while the page is open).
  const visible = useRef(names);
  visible.current = names;
  const sheet = useRef<{ remove: () => void }>(null);

  // An image is picked from the gallery, or uploaded; an uploaded one is saved in the commit of the entry that uses it (as in DataForm.tsx).
  const images = useUploads(env.notify);
  const [pickImage, picker] = useMediaPicker(env.media, images, env.files);
  const context: FieldContext = { relations: env.relations, lists: env.lists, testimonials: env.testimonials, site: env.site, pickImage };
  const listBlock = siteBlocks.find((b) => b.type === 'list');
  const [asker, dialog] = useBlockDialog(siteBlocks, {
    lists: env.lists,
    testimonials: env.testimonials,
    site: env.site,
    relations: env.relations,
  });

  // Saves what changed as one commit (the rows with a title, the rows that are gone), one save after another.
  const flush = () => {
    clearTimeout(timer.current);
    chain.current = chain.current.then(async () => {
      if (gone.current) return;
      const plan = savePlan({ folder, rows: now.current.items, known: known.current, slugs: slugs.current, visible: visible.current });
      if (!plan.writes.length && !plan.deletes.length) return;
      const change = t.app.changes.edited(lower(collection.label));
      const used = plan.writes.flatMap((w) => images.usedIn(w.content));
      const records = creditChanges([], recordsIn(env.files, config.fileRecords), config.fileRecords, creditedIn(used));
      const changes = [
        ...plan.writes.map((w) => ({ path: w.path, content: w.content, oid: w.oid })),
        ...plan.deletes.map((d) => ({ path: d.path, content: null, oid: d.oid })),
        ...used.map((u) => ({ path: u.path, content: u.bytes, oid: null })),
        ...records,
      ];
      setSaving(true);
      env.notify({ text: t.common.saving });
      try {
        const oids = await env.commit(siteT.forms.commit.edit(lower(collection.label)), changes, change);
        for (const w of plan.writes) {
          known.current.set(w.path, { oid: oids[w.path], text: w.content });
          env.onSaved({ path: w.path, oid: oids[w.path], text: w.content });
        }
        images.markSaved(used);
        for (const c of records) if (typeof c.content === 'string') env.onSaved({ path: c.path, oid: oids[c.path], text: c.content });
        for (const d of plan.deletes) known.current.delete(d.path);
        if (plan.deletes.length) env.forget(plan.deletes.map((d) => d.path));
        slugs.current = plan.slugs;
        env.notify({ text: savedText(change), kind: 'saved' });
      } catch (e) {
        env.notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
      } finally {
        setSaving(false);
      }
    });
  };
  const later = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_AFTER);
  };
  useEffect(() => () => flush(), []);

  const keyed = (list: Item[]) => list.map((r) => (typeof r.key === 'number' ? r : { ...r, key: next.current++ })) as KeyedRow[];
  const change = (c: Change) => {
    if ('active' in c) setActive(c.active ?? null);
    if ('focus' in c) setFocus(c.focus ?? null);
    if (c.items) {
      setItems(keyed(c.items));
      later();
    }
  };
  const go = (list: Item[], to: number) => change({ items: list, active: to, focus: { row: to, field: 'title' } });

  // The icon and link of the active row: the List block's own fields, in the sheet or the side panel (BlockDialog.tsx `row`).
  const rowFields = (fields: string[]) =>
    (listBlock?.fields.find((f) => f.name === 'items')?.fields ?? []).filter((f) => fields.includes(f.name));
  // The image and the tags are the list's own fields (the image from the gallery, the tags of the relation `categories`).
  const SLOTS = { icon: 'icon', link: 'href', image: 'image', tags: 'tags' } as const;
  const settingsOf = (i: number, slot: keyof typeof SLOTS): RowSpec => {
    const name = SLOTS[slot];
    const row = (now.current.items[i] ?? {}) as Record<string, unknown>;
    const own = slot === 'image' || slot === 'tags';
    const fields = own
      ? collection.fields.filter((f) => f.name === name)
      : rowFields([name]).map((f) => (slot === 'icon' ? { ...f, iconsOpen: true } : f));
    return {
      headline:
        slot === 'icon'
          ? t.blocks.list.icon
          : slot === 'image'
            ? t.ownList.image
            : slot === 'tags'
              ? t.ownList.tags
              : t.blocks.list.rowSettings,
      fields,
      value: { [name]: row[name] ?? (slot === 'tags' ? [] : '') },
      closes: slot === 'icon',
      onChange: (v) => {
        let list: Item[] = now.current.items;
        // The tags are a list, not text: set whole (and left out when none), as the rest of a row's keys.
        if (slot === 'tags') {
          const tags = Array.isArray(v.tags) ? v.tags : [];
          list = list.map((r, j) => {
            if (j !== i) return r;
            const { tags: _gone, ...rest } = r;
            return tags.length ? { ...rest, tags } : rest;
          });
        } else list = setField(list, i, name, String(v[name] ?? ''));
        change({ items: list });
      },
    };
  };
  const openRow = (i: number, slot: keyof typeof SLOTS) => {
    setActive(i);
    asker.row(settingsOf(i, slot), true);
  };

  // The floating toolbar (inlineBar.ts), over the list: the row actions; the menu of a block has no place here.
  const bar = useRef<ReturnType<typeof inlineBar> | undefined>(undefined);
  const rowActions = (): BarAction[] => {
    const { items: list, active: i } = now.current;
    if (i === null || i >= list.length || isEmptyRow(list[i])) return [];
    return [
      ...(show.href ? [{ kind: 'link' as const, label: t.blocks.list.link, action: () => openRow(i, 'link') }] : []),
      { kind: 'above', label: t.blocks.list.addAbove, action: () => go(addAt(list, i, 'title'), i) },
      { kind: 'below', label: t.blocks.list.addBelow, action: () => go(addAt(list, i + 1, 'title'), i + 1) },
      ...(i > 0 ? [{ kind: 'up' as const, label: t.common.moveUp, action: () => go(moveBy(list, i, -1), i - 1) }] : []),
      ...(i < list.length - 1 ? [{ kind: 'down' as const, label: t.common.moveDown, action: () => go(moveBy(list, i, 1), i + 1) }] : []),
    ];
  };
  const latest = useRef(rowActions);
  latest.current = rowActions;
  useEffect(() => {
    const made = inlineBar({
      name: collection.label,
      dom: host.current!,
      rowActions: () => latest.current(),
      edit: () => now.current.active !== null && openRow(now.current.active, 'link'),
      compact: () => !atLeastNow('expanded'),
      labels: { row: t.blocks.list.row, edit: t.common.edit },
    });
    made.block.hidden = true;
    bar.current = made;
    return () => made.destroy();
  }, []);
  useEffect(() => bar.current?.refresh(active !== null));

  // Leaving the list (a tap or the focus elsewhere, but not in its toolbar or sheet): the row is done and a row with nothing in it goes.
  useEffect(() => {
    const away = (e: Event) => {
      const target = e.target;
      if (now.current.active === null) return;
      if (
        target instanceof Element &&
        (host.current?.contains(target) || bar.current?.el.contains(target) || target.closest('.editor-side-sheet, dialog[open]'))
      )
        return;
      setActive(null);
      setFocus(null);
      asker.row(null);
      setItems((list) => withoutEmpty(list) as KeyedRow[]);
      flush();
    };
    document.addEventListener('pointerdown', away, true);
    document.addEventListener('focusin', away, true);
    return () => {
      document.removeEventListener('pointerdown', away, true);
      document.removeEventListener('focusin', away, true);
    };
  }, []);

  return (
    <Fields.Provider value={context}>
      <Screen
        title={collection.label}
        back={{ href: '#lists', label: t.common.parts.lists }}
        status={saving ? t.app.busy.saving : undefined}
        pageActions={
          <span ref={menuAt}>
            <IconButton
              icon={DotsThreeVertical}
              label={t.ownList.menu}
              aria-haspopup="menu"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            />
          </span>
        }
      >
        <div className="editor-text" ref={host}>
          <InlineList
            items={items}
            active={active}
            focus={focus}
            show={show}
            onChange={change}
            onSettings={(i) => openRow(i, 'link')}
            onIcon={(i) => openRow(i, 'icon')}
            onImage={(i) => openRow(i, 'image')}
            onTags={(i) => openRow(i, 'tags')}
          />
        </div>
        {dialog}
        {picker}
        <Menu anchor={menu ? menuAt.current : null} label={t.ownList.menu} onClose={() => setMenu(false)}>
          <MenuItem
            icon={PencilSimple}
            onClick={() => {
              setMenu(false);
              setEditing(true);
            }}
          >
            {t.ownList.edit}
          </MenuItem>
          <MenuItem
            icon={Trash}
            onClick={() => {
              setMenu(false);
              sheet.current?.remove();
            }}
          >
            {t.ownList.delete}
          </MenuItem>
        </Menu>
        <OwnListSheet
          ref={sheet}
          collection={collection}
          files={files}
          env={env}
          open={editing}
          onClose={() => setEditing(false)}
          onDeleting={() => {
            gone.current = true;
            clearTimeout(timer.current);
          }}
          onRemoved={(field, saved) => {
            for (const s of saved) known.current.set(s.path, { oid: s.oid, text: s.text });
            setItems(
              (list) =>
                list.map((r) => (field in r ? Object.fromEntries(Object.entries(r).filter(([k]) => k !== field)) : r)) as KeyedRow[],
            );
          }}
        />
      </Screen>
    </Fields.Provider>
  );
}
