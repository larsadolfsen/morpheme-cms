// "Virksomheden": the business, in parts (companyParts), each a screen of its own: its phone, e-mail
// and address (src/data/contact.json) and its bank details (src/data/payment.json), used
// all over the site; and its logo and icon (BrandForm.tsx). A part is saved with "Gem ændringer"; the JSON file
// keeps its keys in their order, so a save only changes what was edited. The same form has the other parts' fields (an
// app's settings, AppList.tsx appSettingsPart). A field with its choices on a page of their own (Field.page: an app's
// "Variant") has it at the form's address with its name after it (`at`, `page`, App.tsx): the form stays open under it
// with what is in it, saved or not (useFieldPages), a choice there goes back to it, and it comes back where it was.
// Exposes CompanyForm and usePartForm; the fields (with the block preview) are PartFields.tsx, a field's page PartFieldPage.tsx,
// the providers around them PartFormProviders.tsx.
import { useState } from 'react';
import { ConflictError, type RepoFile } from './github';
import FormFrame from './FormFrame';
import PartFields, { hasPreview } from './PartFields';
import PartFieldPage from './PartFieldPage';
import PartFormProviders from './PartFormProviders';
import { useFieldPages } from './useFieldPages';
import type { Part } from './schema';
import { clean, problemAt } from './check';
import { useWrongField, type FieldContext } from './fields';
import type { Env } from './App';
import { lower, savedText } from './deploy';
import { asWritten } from './site';
import { keptBy } from '@site/editor';
import { siteT, t } from './i18n';

type Props = { part: Part; env: Env; files: RepoFile[] };

/** A part's fields in its file, as a form: the values, whether they are changed, and its save ("Gem
 * ændringer"), which says what is wrong first (useWrongField); here and on an app's page (AppList.tsx). */
export function usePartForm({ part, env, files }: Props) {
  const { file: path, at, fields } = part as Required<Part>;
  const notify = env.notify;
  // A form that cannot be saved: why, as a message, and the field marked (useWrongField in fields.tsx).
  const wrongField = useWrongField((text) => notify({ text, error: true }));
  // The file as it was loaded or last saved, and its fields as they are now.
  // A file that is not there yet (the first block with shared texts) is made by the first save.
  const [base, setBase] = useState(() => files.find((f) => f.path === path) ?? { path, oid: '', text: '{}\n' });
  const valuesOf = (text: string) => {
    const data = JSON.parse(text) as Record<string, any>;
    const own = (at ? data[at] : data) ?? {};
    return Object.fromEntries(fields.map((f) => [f.name, own[f.name] ?? part.defaults?.[f.name] ?? '']));
  };
  const [initial, setInitial] = useState(() => valuesOf(base.text));
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  const context: FieldContext = {
    relations: env.relations,
    lists: env.lists,
    testimonials: env.testimonials,
    site: env.site,
  };

  async function save() {
    if (wrongField.stop(problemAt(fields, values))) return;
    // The file with these fields changed, written like the others (DataForm.tsx).
    const data = JSON.parse(base.text) as Record<string, any>;
    // Written as the fields write them (a number in pairs …); an emptied field is taken out.
    // Kept in their place in the file.
    const target = at ? (data[at] ??= {}) : data;
    const cleaned = clean(fields, values);
    for (const f of fields) if (!(f.name in cleaned)) delete target[f.name];
    Object.assign(target, cleaned);
    const text = `${JSON.stringify(data, null, 2)}\n`;
    if (text === base.text) return notify({ text: t.company.noChanges });
    // What the site's rules do not let it be (the same page twice among the standard pages), with a link to what to change.
    const kept = keptBy(null, path, data, files);
    if (kept) return notify(kept);
    const message = siteT.company.commit.edit(part.commit ?? asWritten(part).label.toLowerCase());
    const changes = [{ path, content: text, oid: base.oid || null }];
    const change = t.app.changes.edited(lower(part.label));
    setSaving(true);
    notify({ text: t.common.saving });
    try {
      const oids = await env.commit(message, changes, change);
      const saved = { path, oid: oids[path], text };
      setBase(saved);
      setInitial(valuesOf(text));
      setValues(valuesOf(text));
      env.onSaved(saved);
      notify({ text: savedText(change), kind: 'saved' });
      return true;
    } catch (e) {
      notify({ text: e instanceof ConflictError ? e.message : t.common.notSaved((e as Error).message), error: true, kind: 'failed' });
    } finally {
      setSaving(false);
    }
  }

  return { base, values, setValues, dirty, saving, save, wrongField, context };
}

/** `at`: the form's address, for its fields' pages (Field.page); `page`: the field whose page is open. */
export default function CompanyForm({ part, env, files, at: route, page }: Props & { at?: string; page?: string }) {
  const form = usePartForm({ part, env, files });
  const { dirty, saving, save } = form;
  // The fields with their choices on a page of their own, and the one open.
  const open = useFieldPages(part, route, route, page);
  const pageOf = route ? (name: string) => `#${route}/${name}` : undefined;
  return (
    <PartFormProviders form={form} pageOf={pageOf}>
      {open ? (
        <PartFieldPage part={part} field={open} route={route!} form={form} back={{ href: `#${route}`, label: part.label }} />
      ) : (
        <FormFrame
          title={part.label}
          back={part.back ?? { href: '#company', label: t.common.parts.company }}
          dirty={dirty}
          saving={saving}
          onSave={save}
          panel={hasPreview(part)}
        >
          <PartFields part={part} files={files} env={env} form={form} />
        </FormFrame>
      )}
    </PartFormProviders>
  );
}
