// Pure helpers for the dashboard layout: validate the stored shape and edit it without mutating inputs.
// A placement is one widget on the dashboard; `widget` is the full id "<source>:<key>".

/**
 * @typedef {{ id: string, widget: string, settings: Record<string, unknown> }} Placement
 * @typedef {{ version: 1, widgets: Placement[] }} StoredDashboard
 */

export const DASHBOARD_VERSION = 1;
export const MAX_WIDGETS = 50;

const DEFAULT_WIDGETS = ['cms:continue', 'cms:unfinished', 'cms:blog-rhythm', 'cms:status'];

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function isPlainObject(value) {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** A widget id needs a non-empty source and key around the first ':'. @param {unknown} widget */
function isWidgetId(widget) {
  if (typeof widget !== 'string') return false;
  const at = widget.indexOf(':');
  return at > 0 && at < widget.length - 1;
}

/** @param {Placement} placement @returns {Placement} */
function copyPlacement(placement) {
  return { id: placement.id, widget: placement.widget, settings: { ...placement.settings } };
}

/**
 * Returns a clean copy of a stored dashboard, or null when the value does not match the expected shape.
 * A placement without `settings` gets `{}`.
 * @param {unknown} value
 * @returns {StoredDashboard | null}
 */
export function validDashboard(value) {
  if (!isPlainObject(value) || value.version !== DASHBOARD_VERSION || !Array.isArray(value.widgets)) return null;
  if (value.widgets.length > MAX_WIDGETS) return null;

  const seen = new Set();
  const widgets = [];
  for (const raw of value.widgets) {
    if (!isPlainObject(raw)) return null;
    if (typeof raw.id !== 'string' || raw.id === '') return null;
    if (seen.has(raw.id)) return null;
    if (!isWidgetId(raw.widget)) return null;

    let settings = {};
    if (raw.settings !== undefined) {
      if (!isPlainObject(raw.settings)) return null;
      settings = { ...raw.settings };
    }

    seen.add(raw.id);
    widgets.push({ id: raw.id, widget: raw.widget, settings });
  }

  return { version: DASHBOARD_VERSION, widgets };
}

/**
 * The starting dashboard for a new installation.
 * @param {() => string} newId
 * @returns {StoredDashboard}
 */
export function defaultDashboard(newId) {
  return {
    version: DASHBOARD_VERSION,
    widgets: DEFAULT_WIDGETS.map((widget) => ({ id: newId(), widget, settings: {} })),
  };
}

/**
 * Appends a new placement of `widget` with empty settings.
 * @param {StoredDashboard} dash
 * @param {string} widget
 * @param {() => string} newId
 * @returns {StoredDashboard}
 */
export function addWidget(dash, widget, newId) {
  return {
    version: DASHBOARD_VERSION,
    widgets: [...dash.widgets.map(copyPlacement), { id: newId(), widget, settings: {} }],
  };
}

/**
 * Removes the placement with `id`. An unknown id leaves the widgets unchanged.
 * @param {StoredDashboard} dash
 * @param {string} id
 * @returns {StoredDashboard}
 */
export function removeWidget(dash, id) {
  return {
    version: DASHBOARD_VERSION,
    widgets: dash.widgets.filter((p) => p.id !== id).map(copyPlacement),
  };
}

/**
 * Moves the placement with `id` to `toIndex`, clamped to the range of valid indexes.
 * An unknown id leaves the widgets unchanged.
 * @param {StoredDashboard} dash
 * @param {string} id
 * @param {number} toIndex
 * @returns {StoredDashboard}
 */
export function moveWidget(dash, id, toIndex) {
  const widgets = dash.widgets.map(copyPlacement);
  const from = widgets.findIndex((p) => p.id === id);
  if (from === -1) return { version: DASHBOARD_VERSION, widgets };

  const [moved] = widgets.splice(from, 1);
  const target = Math.min(Math.max(toIndex, 0), widgets.length);
  widgets.splice(target, 0, moved);
  return { version: DASHBOARD_VERSION, widgets };
}

/**
 * Replaces the settings of the placement with `id`.
 * @param {StoredDashboard} dash
 * @param {string} id
 * @param {Record<string, unknown>} settings
 * @returns {StoredDashboard}
 */
export function setSettings(dash, id, settings) {
  return {
    version: DASHBOARD_VERSION,
    widgets: dash.widgets.map((p) => (p.id === id ? { id: p.id, widget: p.widget, settings: { ...settings } } : copyPlacement(p))),
  };
}

/**
 * Drops placements whose widget is not among `knownIds` (for example, widgets from an app that is no longer installed).
 * @param {StoredDashboard} dash
 * @param {Iterable<string>} knownIds
 * @returns {StoredDashboard}
 */
export function withoutMissing(dash, knownIds) {
  const known = new Set(knownIds);
  return {
    version: DASHBOARD_VERSION,
    widgets: dash.widgets.filter((p) => known.has(p.widget)).map(copyPlacement),
  };
}
