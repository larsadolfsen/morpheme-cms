// The two providers a part's form needs: the fields' context (with the address of a field's page) and the field marked as wrong.
// Exposes PartFormProviders. Depends on usePartForm (CompanyForm.tsx) and fields.tsx; used by CompanyForm.tsx and AppList.tsx.
import type { ReactNode } from 'react';
import { Fields, WrongField } from './fields';
import type { usePartForm } from './CompanyForm';

/** Around PartFields and PartFieldPage. `pageOf`: the address of a field's page, where it has one (Field.page). */
export default function PartFormProviders({
  form,
  pageOf,
  children,
}: {
  form: ReturnType<typeof usePartForm>;
  pageOf?: (name: string) => string;
  children: ReactNode;
}) {
  return (
    <Fields.Provider value={{ ...form.context, pageOf }}>
      <WrongField.Provider value={form.wrongField.field}>{children}</WrongField.Provider>
    </Fields.Provider>
  );
}
