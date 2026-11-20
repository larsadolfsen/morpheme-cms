// A part's values in its form (CompanyForm.tsx usePartForm): its fields' values from the file's data, at `at` or at the top
// level, each falling back to the part's default, with `upgradeValues` (Part.upgradeValues) applied to what the file has.
// Exposes partValues (pure).

/**
 * @param {Record<string, any>} data the file's data
 * @param {{ at?: string, names: string[], defaults?: Record<string, unknown>, upgradeValues?: (values: Record<string, unknown>) => Record<string, unknown> }} part
 * @returns {Record<string, unknown>}
 */
export function partValues(data, { at, names, defaults, upgradeValues }) {
  const stored = (at ? data[at] : data) ?? {};
  const own = upgradeValues ? upgradeValues(stored) : stored;
  return Object.fromEntries(names.map((name) => [name, own[name] ?? defaults?.[name] ?? '']));
}
