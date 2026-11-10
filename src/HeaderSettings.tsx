// "Appearance" › "Header" (#appearance/header): what is in the header on every page, on one screen laid out as a page's form
// (SettingsSections.tsx): a preview of the header as the form has it, on a phone and a computer (partPreview.tsx), over the
// sections Main menu (menu.json), Mobile menu (mobile-menu.json), Call to action and Menu button (header.json). "Gem
// ændringer" saves each changed file in its own commit (useDataFiles.ts). Exposes HeaderSettings (default). Uses
// DataFileFields.tsx, fields.tsx, blocks.ts (BlockData), headerPreview.mjs and headerTheme.tsx.
import { useMemo, type ReactNode } from 'react';
import FormFrame from './FormFrame';
import { FieldList, Fields, ObjectFields, WrongField, type FieldContext } from './fields';
import { DataFileFields } from './DataFileFields';
import { useDataFiles, type DataFilePart } from './useDataFiles';
import { SettingsSections, useSettingsSections, type SettingsSection } from './SettingsSections';
import { PartPreview } from './partPreview';
import type { BlockData } from './blocks';
import { headerDraft, swapHeader } from './headerPreview.mjs';
import { headerThemeOf } from './headerTheme';
import { collections } from './site';
import type { FilesCollection } from './schema';
import type { Env } from './App';
import { t } from './i18n';

// The header's three files, by their collections (defaults/collections.ts), as the preview names them.
const FILES = { menu: 'menu', mobileMenu: 'mobile-menu', header: 'header-button' } as const;
const parts: DataFilePart[] = Object.values(FILES).flatMap((id) => {
  const collection = collections.find((c): c is FilesCollection => c.id === id && c.kind === 'files');
  return collection ? [{ collection, dataFile: collection.files[0] }] : [];
});
const at = (id: string) => parts.findIndex((p) => p.collection.id === id);

// The sections, each with the file it is of: a menu is one; header.json's group (the call to action) is one, and its other
// fields (the menu button's side) are "Menu button".
type Place = { id: string; label: string; file: number; field?: string };
const places: Place[] = parts.flatMap(({ collection, dataFile }, file): Place[] => {
  if (dataFile.root) return [{ id: collection.id, label: collection.label, file }];
  const groups = dataFile.fields.filter((f) => f.type === 'object').map((f) => ({ id: f.name, label: f.label, file, field: f.name }));
  const rest = dataFile.fields.some((f) => f.type !== 'object')
    ? [{ id: `${collection.id}-rest`, label: t.library.headerMenuButton, file }]
    : [];
  return [...groups, ...rest];
});
// The section a file's field is in (its path: "button.label", "items.0.label").
function placeOf(file: number, path: string) {
  const mine = places.filter((p) => p.file === file);
  return mine.find((p) => p.field === path.split('.')[0]) ?? mine.find((p) => !p.field)!;
}

type Values = Record<string, unknown>[];
// The files' values as headerDraft takes them; a file the site has not got is empty.
const shapeOf = (values: Values) => ({
  menu: values[at(FILES.menu)] ?? {},
  mobileMenu: values[at(FILES.mobileMenu)] ?? {},
  header: values[at(FILES.header)] ?? {},
});

const back = { href: '#appearance', label: t.common.parts.appearance };

export default function HeaderSettings({ env }: { env: Env }) {
  const layout = useSettingsSections(places);
  const form = useDataFiles(env, parts, (file, path) => {
    const { id } = placeOf(file, path);
    layout.unfold(id);
    layout.steer(id);
  });
  const context: FieldContext = { relations: env.relations, lists: env.lists, testimonials: env.testimonials, site: env.site };
  // What the theme draws the header's call to action from (headerThemeOf): the same site data, as the block cards have it.
  const data: BlockData = { lists: env.lists, testimonials: env.testimonials, relations: env.relations, site: env.site };

  // What the form changes, put into a copy of the site's front page each time it changes.
  const swap = useMemo(() => {
    const draft = headerDraft(shapeOf(form.initial), shapeOf(form.values));
    return (doc: Document) => swapHeader(doc, draft, headerThemeOf(draft.cta, data));
  }, [form.initial, form.values]);

  const fieldsOf = ({ file, field }: Place): ReactNode => {
    const { dataFile } = parts[file];
    const value = form.values[file];
    const set = (v: unknown) => form.set(file, v as Record<string, unknown>);
    if (dataFile.root) return <DataFileFields dataFile={dataFile} value={value} onChange={set} add />;
    const own = dataFile.fields.find((f) => f.name === field);
    if (own) return <ObjectFields field={own} value={value[own.name]} onChange={(v) => set({ ...value, [own.name]: v })} />;
    return <FieldList fields={dataFile.fields.filter((f) => f.type !== 'object')} value={value} onChange={set} />;
  };
  const sections: SettingsSection[] = places.map((p) => ({
    id: p.id,
    label: p.label,
    content: <WrongField.Provider value={form.wrong(p.file)}>{fieldsOf(p)}</WrongField.Provider>,
  }));

  return (
    <Fields.Provider value={context}>
      <FormFrame title={t.common.parts.header} back={back} dirty={form.dirty} saving={form.saving} onSave={form.save}>
        <SettingsSections
          title={t.common.parts.header}
          top={<PartPreview part="header" swap={swap} />}
          sections={sections}
          state={layout}
        />
      </FormFrame>
    </Fields.Provider>
  );
}
