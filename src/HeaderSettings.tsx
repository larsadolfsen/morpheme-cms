// "Udseende" › "Header" (#udseende/header): what is in the header on every page, on one screen: the main menu (menu.json),
// "Mobilmenu" (mobile-menu.json), the action button and the menu button's side (header.json), under a preview of the header
// as the form has it, on a phone and a computer (partPreview.tsx). "Gem ændringer" saves each changed file in its own commit
// (useDataFiles.ts). Exposes HeaderSettings (default). Uses DataFileFields.tsx, fields.tsx, headerPreview.mjs and headerTheme.tsx.
import { useMemo } from 'react';
import FormFrame from './FormFrame';
import { FieldGroup } from './ui';
import { FieldList, Fields, WrongField, type FieldContext } from './fields';
import { DataFileFields } from './DataFileFields';
import { useDataFiles, type DataFilePart } from './useDataFiles';
import { PartPreview } from './partPreview';
import { headerDraft, swapHeader } from './headerPreview.mjs';
import { headerThemeOf } from './headerTheme';
import { collections } from './site';
import type { FilesCollection } from './schema';
import type { Env } from './App';
import { t } from './i18n';

// The header's three files, by their collections (defaults/collections.ts), as the preview names them.
const FILES = { menu: 'menu', mobileMenu: 'mobilmenu', header: 'headerknap' } as const;
const parts: DataFilePart[] = Object.values(FILES).flatMap((id) => {
  const collection = collections.find((c): c is FilesCollection => c.id === id && c.kind === 'files');
  return collection ? [{ collection, dataFile: collection.files[0] }] : [];
});
const at = (id: string) => parts.findIndex((p) => p.collection.id === id);

type Values = Record<string, unknown>[];
// The files' values as headerDraft takes them; a file the site has not got is empty.
const shapeOf = (values: Values) => ({
  menu: values[at(FILES.menu)] ?? {},
  mobileMenu: values[at(FILES.mobileMenu)] ?? {},
  header: values[at(FILES.header)] ?? {},
});

const back = { href: '#udseende', label: t.common.parts.appearance };

export default function HeaderSettings({ env }: { env: Env }) {
  const form = useDataFiles(env, parts);
  const context: FieldContext = { relations: env.relations, lists: env.lists, testimonials: env.testimonials, site: env.site };

  // What the form changes, put into a copy of the site's front page each time it changes.
  const swap = useMemo(() => {
    const draft = headerDraft(shapeOf(form.initial), shapeOf(form.values));
    return (doc: Document) => swapHeader(doc, draft, headerThemeOf(draft.button, context));
  }, [form.initial, form.values]);

  return (
    <Fields.Provider value={context}>
      <FormFrame title={t.common.parts.header} back={back} dirty={form.dirty} saving={form.saving} onSave={form.save} wide>
        <div className="space-y-6">
          <PartPreview part="header" swap={swap} />
          {parts.map(({ collection, dataFile }, i) => (
            <WrongField.Provider key={collection.id} value={form.wrong(i)}>
              {dataFile.root ? (
                <FieldGroup label={collection.label}>
                  <DataFileFields dataFile={dataFile} value={form.values[i]} onChange={(v) => form.set(i, v)} add />
                </FieldGroup>
              ) : (
                <OwnFields dataFile={dataFile} value={form.values[i]} onChange={(v) => form.set(i, v)} />
              )}
            </WrongField.Provider>
          ))}
        </div>
      </FormFrame>
    </Fields.Provider>
  );
}

// header.json: the action button in its own group (an object field draws one), the menu button's side in "Menuknap".
function OwnFields({
  dataFile,
  value,
  onChange,
}: {
  dataFile: DataFilePart['dataFile'];
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) {
  const groups = dataFile.fields.filter((f) => f.type === 'object');
  const rest = dataFile.fields.filter((f) => f.type !== 'object');
  const set = (v: unknown) => onChange(v as Record<string, unknown>);
  return (
    <>
      <FieldList fields={groups} value={value} onChange={set} />
      {rest.length > 0 && (
        <FieldGroup label={t.library.headerMenuButton}>
          <FieldList fields={rest} value={value} onChange={set} />
        </FieldGroup>
      )}
    </>
  );
}
