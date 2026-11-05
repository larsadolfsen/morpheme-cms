// "Udseende" › "Footer" (#appearance/footer): the footer's text under the name, its two headings and its links (footer.json),
// on one screen laid out as a page's form (SettingsSections.tsx): a preview of the footer as the form has it, on a phone and
// a computer (partPreview.tsx), over the sections Text, Contact and Links. "Gem ændringer" saves the file in its own
// commit (useDataFiles.ts). Exposes FooterSettings (default). Uses fields.tsx and footerPreview.mjs.
import { useMemo } from 'react';
import FormFrame from './FormFrame';
import { FieldList, Fields, WrongField, type FieldContext } from './fields';
import { useDataFiles, type DataFilePart } from './useDataFiles';
import { SettingsSections, useSettingsSections, type SettingsSection } from './SettingsSections';
import { PartPreview } from './partPreview';
import { footerDraft, swapFooter } from './footerPreview.mjs';
import { collections } from './site';
import type { FilesCollection } from './schema';
import type { Env } from './App';
import { t } from './i18n';

// The footer's file, by its collection (defaults/collections.ts); a site without it has nothing to show.
const collection = collections.find((c): c is FilesCollection => c.id === 'footer' && c.kind === 'files');
const parts: DataFilePart[] = collection ? [{ collection, dataFile: collection.files[0] }] : [];

// The sections and the file's fields (by name) that each has.
const places = [
  { id: 'text', label: t.library.footerSections.text, names: ['text'] },
  { id: 'contact', label: t.library.footerSections.contact, names: ['contactHeading'] },
  { id: 'links', label: t.library.footerSections.links, names: ['linksHeading', 'links'] },
];
// The section a field is in (its path: "links.0.label").
const placeOf = (path: string) => places.find((p) => p.names.includes(path.split('.')[0])) ?? places[0];

// The class of a link in the footer (Footer.astro), for a footer whose page has no link to copy.
const THEME = { linkClass: 'md-footer-item' };

const back = { href: '#appearance', label: t.common.parts.appearance };

export default function FooterSettings({ env }: { env: Env }) {
  const layout = useSettingsSections(places);
  const form = useDataFiles(env, parts, (_file, path) => {
    const { id } = placeOf(path);
    layout.unfold(id);
    layout.steer(id);
  });
  const context: FieldContext = { relations: env.relations, lists: env.lists, testimonials: env.testimonials, site: env.site };

  // What the form changes, put into a copy of the site's front page each time it changes.
  const swap = useMemo(() => {
    const draft = footerDraft(form.initial[0] ?? {}, form.values[0] ?? {});
    return (doc: Document) => swapFooter(doc, draft, THEME);
  }, [form.initial, form.values]);

  const sections: SettingsSection[] = places.map((p) => ({
    id: p.id,
    label: p.label,
    content: parts[0] && (
      <WrongField.Provider value={form.wrong(0)}>
        <FieldList
          fields={parts[0].dataFile.fields.filter((f) => p.names.includes(f.name))}
          value={form.values[0]}
          onChange={(v) => form.set(0, v as Record<string, unknown>)}
        />
      </WrongField.Provider>
    ),
  }));

  return (
    <Fields.Provider value={context}>
      <FormFrame title={t.common.parts.footer} back={back} dirty={form.dirty} saving={form.saving} onSave={form.save}>
        <SettingsSections
          title={t.common.parts.footer}
          top={<PartPreview part="footer" swap={swap} />}
          sections={sections}
          state={layout}
        />
      </FormFrame>
    </Fields.Provider>
  );
}
