// The page of one field of a part with its choices (Field.page, e.g. an app's "Variant"), as a form screen of its own.
// Exposes PartFieldPage. The caller gives the Fields and WrongField providers (CompanyForm.tsx).
// Uses usePartForm's values and save (CompanyForm.tsx), FormFrame (FormFrame.tsx).
import FormFrame from './FormFrame';
import type { Field, Part } from './schema';
import { problemAt } from './check';
import { up } from './nav';
import type { usePartForm } from './CompanyForm';

export default function PartFieldPage({
  part,
  field,
  route,
  form,
  back,
}: {
  part: Part;
  field: Field;
  /** The form's address, without "#". */
  route: string;
  form: ReturnType<typeof usePartForm>;
  back: { href: string; label: string };
}) {
  const { values, setValues, dirty, saving, save, wrongField } = form;
  const { fields } = part as Required<Part>;
  const Page = field.page!;
  // Back to the form: the field that keeps it from being saved is there (useWrongField).
  const goBack = () => up(`#${route}`);
  return (
    <FormFrame
      title={field.label}
      back={{ ...back, guard: (go) => go() }}
      dirty={dirty}
      saving={saving}
      onSave={() => {
        if (problemAt(fields, values)) goBack();
        return save();
      }}
      wide
    >
      {field.hint && <p className="text-on-surface-variant">{field.hint}</p>}
      <Page
        field={field}
        value={String(values[field.name] ?? '')}
        values={values}
        onChange={(v) => {
          if (wrongField.field?.path === field.name) wrongField.field.clear();
          setValues({ ...values, [field.name]: v });
          goBack();
        }}
      />
    </FormFrame>
  );
}
