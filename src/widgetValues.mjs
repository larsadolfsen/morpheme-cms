// Pure helpers for a placed widget's settings (WidgetSettings.tsx): the values the form starts with, and the values the
// placement keeps. No React, so it runs under node --test.

/** The settings a widget has: its defaults with the values stored on the placement over them. The same overlay the widget
 * itself is given (DashboardGrid.tsx), and the settings form's starting values.
 * @param {Record<string, unknown> | undefined} defaults
 * @param {Record<string, unknown> | undefined} stored
 * @returns {Record<string, unknown>} */
export function valuesOf(defaults, stored) {
  return { ...defaults, ...stored };
}

/** Only the values that differ from `defaults` (compared by their JSON), so a placement keeps only what the person
 * changed. A field the form left out of `values` (an emptied one, which `clean` takes out) or left undefined counts as
 * emptied: it is kept as '' (or [] for a list default) when the default is not empty, and dropped when it is.
 * @param {Record<string, unknown> | undefined} defaults
 * @param {Record<string, unknown>} values
 * @returns {Record<string, unknown>} */
export function changedOf(defaults, values) {
  /** @type {Record<string, unknown>} */
  const changed = {};
  for (const key of new Set([...Object.keys(defaults ?? {}), ...Object.keys(values)])) {
    const base = defaults?.[key];
    const value = values[key] === undefined ? (Array.isArray(base) ? [] : '') : values[key];
    const same = JSON.stringify(value) === JSON.stringify(base) || (value === '' && base === undefined);
    if (!same) changed[key] = value;
  }
  return changed;
}
