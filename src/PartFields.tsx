// The body of a part's form: its fields, and the block as it would be with them beside (or under) them when the part has `preview`.
// Exposes PartFields and hasPreview (for FormFrame `panel`). The caller gives the Fields and WrongField providers (CompanyForm.tsx).
// Uses usePartForm's values (CompanyForm.tsx), FieldList/FieldRows (fields.tsx), FormColumns (ui.tsx).
import { useMemo } from 'react';
import type { RepoFile } from './github';
import Keywords from './Keywords';
import type { Part } from './schema';
import { FieldList, FieldRows } from './fields';
import type { Env } from './App';
import { preview as blockPreview } from './registry';
import { config, siteOf } from '@site/editor';
import { parseBlock } from '../lib/blocks.mjs';
import { FormColumns, Preview } from './ui';
import { t } from './i18n';
import type { usePartForm } from './CompanyForm';

/** Whether the part has a block preview, for FormFrame `panel`. */
export const hasPreview = (part: Part) => !!part.preview;

export default function PartFields({
  part,
  files,
  env,
  form,
}: {
  part: Part;
  files: RepoFile[];
  env: Env;
  form: ReturnType<typeof usePartForm>;
}) {
  const { base, values, setValues } = form;
  const { file: path, at, fields } = part as Required<Part>;

  // The block with the fields as they are: the site's data with this file as it would be saved; once for
  // each of its variants, under its name, if it has them.
  const shown = useMemo(() => {
    if (!part.preview) return null;
    const { type, props = {}, shared, variants } = part.preview;
    const data = JSON.parse(base.text) as Record<string, any>;
    Object.assign(at ? (data[at] ??= {}) : data, values);
    // With the file as it would be saved, also when it is not there yet (the first block with shared texts).
    const edited = [...files.filter((f) => f.path !== path), { path, oid: '', text: JSON.stringify(data) }];
    // The first copy of the block on a page, for its own texts and numbers.
    const line = new RegExp(`<div data-block="${type}"[^\n]*?></div>`);
    const found = files.map((f) => f.path.startsWith(`${config.folders.pages}/`) && f.text.match(line)?.[0]).find(Boolean);
    const own = (!shared && !variants && found && parseBlock(found)?.props) || props;
    const shownWith = { lists: env.lists, testimonials: env.testimonials, relations: env.relations, site: siteOf(edited) };
    return (variants ?? [{ label: '', props: {} }]).map((v) => ({
      label: v.label,
      block: blockPreview(type, { ...own, ...v.props }, shownWith),
    }));
  }, [values, files]);

  return (
    <>
      {shown ? (
        // A block's texts: on a wide computer screen the block as wide as on a page, and the fields
        // beside it at the right (FormColumns); narrower, the fields and then the block.
        <FormColumns
          first={<FieldList fields={fields} value={values} onChange={(v) => setValues(v as Record<string, unknown>)} />}
          main={
            <div>
              <p className="mb-2 font-medium">{t.company.preview}</p>
              <div className="space-y-6">
                {shown.map((s) => (
                  <section key={s.label}>
                    {s.label && <h3 className="mb-2 text-sm font-medium text-muted">{s.label}</h3>}
                    <Preview>{s.block}</Preview>
                  </section>
                ))}
              </div>
            </div>
          }
        />
      ) : part.rows ? (
        <FieldRows fields={fields} value={values} onChange={setValues} />
      ) : (
        <FieldList fields={fields} value={values} onChange={(v) => setValues(v as Record<string, unknown>)} />
      )}
      {part.below === 'keywords' && <Keywords files={files} />}
    </>
  );
}
