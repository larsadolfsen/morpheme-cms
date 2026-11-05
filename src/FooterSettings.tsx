// "Udseende" › "Footer" (#udseende/footer): the footer's text under the name, its two headings and its links (footer.json),
// under a preview of the footer as the form has it, on a phone and a computer (partPreview.tsx). "Gem ændringer" saves the
// file in its own commit (useDataFiles.ts). Exposes FooterSettings (default). Uses FooterSections.tsx, fields.tsx and
// footerPreview.mjs.
import { useMemo } from 'react';
import FormFrame from './FormFrame';
import { Fields, WrongField, type FieldContext } from './fields';
import { FooterSections } from './FooterSections';
import { useDataFiles, type DataFilePart } from './useDataFiles';
import { PartPreview } from './partPreview';
import { footerDraft, swapFooter } from './footerPreview.mjs';
import { collections } from './site';
import type { FilesCollection } from './schema';
import type { Env } from './App';
import { t } from './i18n';

// The footer's file, by its collection (defaults/collections.ts); a site without it has nothing to show.
const collection = collections.find((c): c is FilesCollection => c.id === 'footer' && c.kind === 'files');
const parts: DataFilePart[] = collection ? [{ collection, dataFile: collection.files[0] }] : [];

// The class of a link in the footer (Footer.astro), for a footer whose page has no link to copy.
const THEME = { linkClass: 'md-footer-item' };

const back = { href: '#udseende', label: t.common.parts.appearance };

export default function FooterSettings({ env }: { env: Env }) {
  const form = useDataFiles(env, parts);
  const context: FieldContext = { relations: env.relations, lists: env.lists, testimonials: env.testimonials, site: env.site };

  // What the form changes, put into a copy of the site's front page each time it changes.
  const swap = useMemo(() => {
    const draft = footerDraft(form.initial[0] ?? {}, form.values[0] ?? {});
    return (doc: Document) => swapFooter(doc, draft, THEME);
  }, [form.initial, form.values]);

  return (
    <Fields.Provider value={context}>
      <FormFrame title={t.common.parts.footer} back={back} dirty={form.dirty} saving={form.saving} onSave={form.save} wide>
        <div className="space-y-6">
          <PartPreview part="footer" swap={swap} />
          {parts.map(({ dataFile }, i) => (
            <WrongField.Provider key={dataFile.file} value={form.wrong(i)}>
              <FooterSections dataFile={dataFile} value={form.values[i]} onChange={(v) => form.set(i, v)} />
            </WrongField.Provider>
          ))}
        </div>
      </FormFrame>
    </Fields.Provider>
  );
}
