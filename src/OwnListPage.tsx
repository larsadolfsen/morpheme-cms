// The page of a list the owner made (`#list/<id>`, docs/superpowers/plans/2026-11-12-new-list.md, batch 4): the List typed in place
// (InlineList.tsx), not a new design: its rows are the entries of the list, one file each. The rows, the active row, the keys and the
// toolbar are the List block's (InlineItems.tsx, contextualMenu.ts); what is new here is only what a node view gave them: the state, the
// row-to-file saving (lib/ownListSave.mjs, saved a moment after typing stops, as one commit) and the sheet of a row's icon and link.
import { useEffect, useMemo, useRef, useState } from 'react';
import Screen from './Screen';
import OwnListSheet from './OwnListSheet';
import { DotsThreeVertical, PencilSimple, Trash } from '@phosphor-icons/react';
import InlineFieldsList, { type ListField } from './InlineFieldsList';
import type { Change, Focus, Item } from './InlineItems';
import type { Row } from './InlineList';
import { contextualMenu, type BarAction } from './contextualMenu';
import { useBlockDialog, type RowSpec } from './BlockDialog';
import { siteBlocks } from './registry';
import { atLeastNow, Button, IconButton, Menu, MenuItem, SupportingText } from './ui';
import AddFieldMenu from './AddFieldMenu';
import { DEFINITION_FILE, fieldsOf, isEntryPath, nameOf, parseDefinition, rowOfEntry } from '../lib/ownList.mjs';
import { savePlan } from '../lib/ownListSave.mjs';
import { addAt, isEmptyRow, moveBy, setField, withoutEmpty } from './inlineRows.mjs';
import { ConflictError, type RepoFile } from './github';
import { siteT, t } from './i18n';
import { kindNames } from './ownLists';
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
  // The list's fields as the definition has them now (an edit of the list changes them while the page is open): each `{ id, kind }`, in order.
  const definition = parseDefinition(files.find((f) => f.path === `${folder}/${DEFINITION_FILE}`)?.text ?? '{}').definition;
  const fields: ListField[] = definition
    ? (fieldsOf(definition) as { id: string; kind: string; label?: string }[]).map((f) => ({
        id: f.id,
        kind: f.kind,
        name: nameOf(definition, f, kindNames()),
      }))
    : [];
  const names = fields.map((f) => f.id);
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
        return { ...(rowOfEntry(data, names) as Row), key };
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
  const visible = useRef(fields);
  visible.current = fields;
  const sheet = useRef<{ remove: () => void; add: (kind: string) => void }>(null);
  // An empty list has no field yet: its page says so and has `Add field`.
  const addButton = useRef<HTMLSpanElement>(null);
  const [adding, setAdding] = useState(false);

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
  const go = (list: Item[], to: number) => change({ items: list, active: to, focus: { row: to, field: names[0] ?? '_' } });

  // The icon and link of the active row: the List block's own fields, in the sheet or the side panel (BlockDialog.tsx `row`).
  const blockField = (kind: string) => listBlock?.fields.find((f) => f.name === 'items')?.fields?.find((f) => f.name === kind);
  // The sheet of one field of a row: the field is the list's own (named by its id, with the name the owner gave it); the image comes from the
  // gallery and the tags from the relation `categories`, an icon and a link are the List block's fields.
  const settingsOf = (i: number, field: ListField): RowSpec => {
    const row = (now.current.items[i] ?? {}) as Record<string, unknown>;
    const own = collection.fields.find((f) => f.name === field.id);
    const picked = field.kind === 'icon' || field.kind === 'href' ? blockField(field.kind) : undefined;
    const spec = picked ? { ...picked, name: field.id, label: field.name, ...(field.kind === 'icon' ? { iconsOpen: true } : {}) } : own;
    return {
      headline: field.name,
      fields: spec ? [spec] : [],
      value: { [field.id]: row[field.id] ?? (field.kind === 'tags' ? [] : '') },
      closes: field.kind === 'icon',
      onChange: (v) => {
        let list: Item[] = now.current.items;
        // The tags are a list, not text: set whole (and left out when none), as the rest of a row's keys.
        if (field.kind === 'tags') {
          const tags = Array.isArray(v[field.id]) ? (v[field.id] as string[]) : [];
          list = list.map((r, j) => {
            if (j !== i) return r;
            const { [field.id]: _gone, ...rest } = r;
            return tags.length ? { ...rest, [field.id]: tags } : rest;
          });
        } else list = setField(list, i, field.id, String(v[field.id] ?? ''), names[0] ?? '_');
        change({ items: list });
      },
    };
  };
  const openRow = (i: number, field: ListField) => {
    setActive(i);
    asker.row(settingsOf(i, field), true);
  };
  const firstHref = fields.find((f) => f.kind === 'href');

  // The contextual menu (contextualMenu.ts), over the list: the row actions; the menu of a block has no place here.
  const bar = useRef<ReturnType<typeof contextualMenu> | undefined>(undefined);
  const rowActions = (): BarAction[] => {
    const { items: list, active: i } = now.current;
    if (i === null || i >= list.length || isEmptyRow(list[i])) return [];
    return [
      ...(firstHref ? [{ kind: 'link' as const, label: t.blocks.list.link, action: () => openRow(i, firstHref) }] : []),
      { kind: 'above', label: t.blocks.list.addAbove, action: () => go(addAt(list, i, names[0] ?? '_'), i) },
      { kind: 'below', label: t.blocks.list.addBelow, action: () => go(addAt(list, i + 1, names[0] ?? '_'), i + 1) },
      ...(i > 0 ? [{ kind: 'up' as const, label: t.common.moveUp, action: () => go(moveBy(list, i, -1), i - 1) }] : []),
      ...(i < list.length - 1 ? [{ kind: 'down' as const, label: t.common.moveDown, action: () => go(moveBy(list, i, 1), i + 1) }] : []),
    ];
  };
  const latest = useRef(rowActions);
  latest.current = rowActions;
  useEffect(() => {
    const made = contextualMenu({
      name: collection.label,
      dom: host.current!,
      rowActions: () => latest.current(),
      edit: () => now.current.active !== null && !!latest.current().length && firstHref && openRow(now.current.active, firstHref),
      compact: () => !atLeastNow('expanded'),
      labels: { edit: t.common.edit },
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
        {fields.length === 0 && (
          <div className="editor-text">
            <SupportingText>{t.ownList.noFields}</SupportingText>
            <span ref={addButton} className="mt-4 inline-block">
              <Button kind="filled" aria-haspopup="menu" aria-expanded={adding} onClick={() => setAdding(!adding)}>
                {t.ownList.addField}
              </Button>
            </span>
            <AddFieldMenu
              anchor={adding ? addButton.current : null}
              onPick={(kind) => sheet.current?.add(kind)}
              onClose={() => setAdding(false)}
            />
          </div>
        )}
        <div className="editor-text" ref={host} hidden={fields.length === 0}>
          <InlineFieldsList
            items={items}
            active={active}
            focus={focus}
            fields={fields}
            onChange={change}
            onSlot={(i, f) => openRow(i, f)}
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
