// A single data file's fields in a form: its own ("Activated") and, when it is a list (the menus), its items as the menu
// (MenuList). DataForm.tsx draws a menu with them, and Appearance › Header (HeaderSettings.tsx) both menus. Exposes
// DataFileFields. Uses fields.tsx (FieldList, MenuList).
import type { DataFile } from './schema';
import { FieldList, MenuList } from './fields';

export function DataFileFields({
  dataFile,
  value,
  onChange,
  add,
}: {
  dataFile: DataFile;
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  /** "Add …" under the list (MenuList `add`), where the top bar has no "+" for it. */
  add?: boolean;
}) {
  const root = dataFile.root;
  return (
    <>
      {dataFile.fields.length > 0 && (
        <FieldList fields={dataFile.fields} value={value} onChange={(v) => onChange(v as Record<string, unknown>)} />
      )}
      {root && (
        <MenuList
          field={root}
          value={(value[root.name] ?? []) as unknown[]}
          onChange={(v) => onChange({ ...value, [root.name]: v })}
          add={add}
        />
      )}
    </>
  );
}
