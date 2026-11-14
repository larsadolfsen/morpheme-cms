// The edit page of a list the owner made (`#list/<id>/edit`, the owner's decision of 14 November: the round button on the list's page is `Edit list`): the list's
// name, a bar like the editor's with a button for each field that can be added (Icon, Title, Body text, Image, Link, Tags, as many of a kind as wanted; the bar's
// planBar puts what does not fit in its `⋮`), each field with a name the owner can change, `Shown`, move up and down, and `Remove field`, then `Add item` and
// `Delete list`. A change is kept as the list's waiting version and committed once, with the page's `Save` (src/useOwnList.tsx); only `Delete list` commits at
// once. A field belongs to the list and is on by default; only the owner's own `Shown` switch hides it (`dropped`): its data stays in the items, and the page says in how
// many, with `Remove data`. `Remove field` asks, then takes the field and its data out of every item (at the `Save`). The rules are lib/ownList.mjs and
// lib/ownListEdit.mjs. Moving a field changes the order of an item's form, never its data.
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { Icon } from './icon';
import Screen from './Screen';
import { SaveBar } from './FormFrame';
import { Button, IconButton, LinkButton, Menu, MenuItem, SupportingText, SwitchRow, TextField, Toolbar, ToolbarButton } from './ui';
import { kindNames } from './ownLists';
import { ask } from './ask';
import { t } from './i18n';
import { planBar } from './textBar.mjs';
import { KINDS, nameOf } from '../lib/ownList.mjs';
import { addField, confirmDrop, heldBy, moveField, renamed, renameField, toggleField } from '../lib/ownListEdit.mjs';
import { useOwnList, type Definition } from './useOwnList';
import type { RepoFile } from './github';
import type { Env } from './App';

/** The icons of the bar, drawn by name in the pack in use (src/icon.tsx). */
const named = (name: string) =>
  (({ size, className }: { size?: number | string; className?: string }) => (
    <Icon name={name} size={Number(size) || 24} className={className} />
  )) as unknown as PhosphorIcon;
const KIND_ICONS: Record<string, PhosphorIcon> = {
  icon: named('list-checks'),
  title: named('text-t'),
  text: named('text-align-left'),
  image: named('image-square'),
  href: named('link-simple'),
  tags: named('tag'),
};
const MoreIcon = named('dots-three-vertical');
const ArrowUp = named('arrow-up');
const ArrowDown = named('arrow-down');

export default function OwnListEdit({ id, files, saved, env }: { id: string; files: RepoFile[]; saved: RepoFile[]; env: Env }) {
  const list = useOwnList(id, files, saved, env);
  const { definition, entries, pending, saving, status, change } = list;
  const [label, setLabel] = useState(definition.label);
  useLayoutEffect(() => setLabel(definition.label), [definition.label]);
  const dropped = definition.dropped ?? [];
  const names = kindNames();

  const rename = () => {
    const next = renamed(definition, label);
    if (next.label === definition.label) return setLabel(definition.label);
    change(next);
  };
  async function remove(field: string, confirm: string) {
    const f = definition.fields.find((x) => x.id === field);
    const name = f ? nameOf(definition, f, names) : field;
    if (!(await ask(t.ownList.removeDataAsk(String(name), heldBy(entries, field)), confirm))) return;
    change(confirmDrop(definition, field, []).definition as Definition, field);
  }

  return (
    <Screen title={definition.label} back={{ href: `#list/${id}`, label: definition.label }} status={status}>
      <div className="editor-text space-y-6">
        <TextField
          label={t.ownList.name}
          value={label}
          disabled={saving}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={rename}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), rename())}
        />
        <FieldBar disabled={saving} onAdd={(kind) => change(addField(definition, kind).definition as Definition)} />
        <div>
          <h2 className="mb-1 font-medium">{t.ownList.fields}</h2>
          {definition.fields.length === 0 && <SupportingText>{t.ownList.noFields}</SupportingText>}
          {definition.fields.map((f, i) => {
            const off = dropped.includes(f.id);
            const held = off ? heldBy(entries, f.id) : 0;
            const name = String(nameOf(definition, f, names));
            return (
              <div key={f.id} className="own-list-field mb-3" data-field={f.id}>
                <FieldName
                  kind={t.ownList[f.kind as 'icon']}
                  value={name}
                  disabled={saving}
                  onSave={(next) => {
                    const own = next.trim() === nameOf(definition, { ...f, label: undefined }, names) ? '' : next;
                    if (own !== (f.label ?? '')) change(renameField(definition, f.id, own) as Definition);
                  }}
                />
                <div className="mt-1 flex items-center gap-1">
                  <IconButton
                    icon={ArrowUp}
                    label={t.ownList.moveFieldUp(name)}
                    disabled={saving || i === 0}
                    onClick={() => change(moveField(definition, f.id, -1) as Definition)}
                  />
                  <IconButton
                    icon={ArrowDown}
                    label={t.ownList.moveFieldDown(name)}
                    disabled={saving || i === definition.fields.length - 1}
                    onClick={() => change(moveField(definition, f.id, 1) as Definition)}
                  />
                </div>
                <SwitchRow
                  label={t.ownList.shown}
                  selected={!off}
                  disabled={saving}
                  // The owner's own choice, on for every new field. Off: nothing to keep when no item has data for it, so it is removed at once; else it is hidden until the data is removed.
                  onChange={(selected) =>
                    change(
                      (selected || heldBy(entries, f.id) > 0
                        ? toggleField(definition, f.id, selected)
                        : confirmDrop(definition, f.id, []).definition) as Definition,
                    )
                  }
                />
                {off ? (
                  <div className="mb-2">
                    <SupportingText>{t.ownList.held(held)}</SupportingText>
                    {held > 0 && (
                      <Button kind="text" disabled={saving} onClick={() => void remove(f.id, t.ownList.removeData)}>
                        {t.ownList.removeData}
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button kind="text" disabled={saving} onClick={() => void remove(f.id, t.ownList.removeField)}>
                    {t.ownList.removeField}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LinkButton kind="outlined" href={`#new/${id}`}>
            {t.ownList.create}
          </LinkButton>
          <Button
            kind="text"
            disabled={saving}
            style={{ '--button-text-text': 'var(--mo-error)' } as CSSProperties}
            onClick={() => void list.deleteList()}
          >
            {t.ownList.delete}
          </Button>
        </div>
      </div>
      {pending && <SaveBar saving={saving} onSave={list.save} />}
    </Screen>
  );
}

/** The bar: a button for each kind of field, as many as fit the bar's width (textBar.mjs planBar), the rest in the `⋮`. Pressing one adds that field. */
function FieldBar({ onAdd, disabled }: { onAdd: (kind: string) => void; disabled: boolean }) {
  const bar = useRef<HTMLDivElement>(null);
  const more = useRef<HTMLButtonElement>(null);
  const [width, setWidth] = useState(10000);
  const [open, setOpen] = useState(false);
  useLayoutEffect(() => {
    const el = bar.current!;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(el);
    return () => watch.disconnect();
  }, []);
  const plan = planBar({ width, context: KINDS.map((k: { id: string }) => k.id), fixed: [] });
  const button = (kind: string) => (
    <ToolbarButton
      key={kind}
      icon={KIND_ICONS[kind]}
      label={t.ownList.addKind(t.ownList[kind as 'icon'])}
      disabled={disabled}
      onClick={() => onAdd(kind)}
    />
  );
  return (
    <>
      <Toolbar ref={bar} label={t.ownList.fieldTools} className="editor-tools rounded-panel border border-outline-variant">
        <div className="editor-tools-slide">
          <div className="editor-tools-main">
            <div role="group" aria-label={t.ownList.fieldTools} className="editor-tools-group">
              {plan.bar.context.map(button)}
            </div>
            {plan.overflow && <ToolbarButton ref={more} icon={MoreIcon} label={t.text.more} popup={open} onClick={() => setOpen(!open)} />}
          </div>
        </div>
      </Toolbar>
      <Menu popup="end" anchor={open ? more.current : null} label={t.text.more} onClose={() => setOpen(false)}>
        {plan.more.context.map((kind: string) => (
          <MenuItem
            key={kind}
            icon={KIND_ICONS[kind]}
            onClick={() => {
              setOpen(false);
              onAdd(kind);
            }}
          >
            {t.ownList.addKind(t.ownList[kind as 'icon'])}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

/** A field's name: typed, and saved when the box is left or Enter is pressed. */
function FieldName({ kind, value, disabled, onSave }: { kind: string; value: string; disabled: boolean; onSave: (name: string) => void }) {
  const [text, setText] = useState(value);
  useLayoutEffect(() => setText(value), [value]);
  return (
    <TextField
      label={`${t.ownList.fieldName} (${kind.toLowerCase()})`}
      value={text}
      disabled={disabled}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => onSave(text)}
      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onSave(text))}
    />
  );
}
