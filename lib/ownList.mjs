// The lists an owner makes (`New list`, docs/superpowers/plans/2026-11-12-new-list.md): a list is the folder `src/data/<id>/` with one JSON file
// per entry and its definition in `src/data/<id>/_list.json`. Pure code, no browser and no React, so the editor, the build and `check:content`
// use the same functions. Nothing a site gets changes while no `_list.json` exists.

/** The fixed set of fields, in this order. `asRows` is the key in a `ListRow` (null: the field has no place in a row today). */
export const FIELDS = [
  { id: 'icon', type: 'icon', asRows: 'icon' },
  { id: 'title', type: 'text', asRows: 'title' },
  { id: 'text', type: 'textarea', asRows: 'text' },
  { id: 'picture', type: 'image', asRows: null },
  { id: 'href', type: 'link', asRows: 'href' },
  { id: 'tags', type: 'tags', asRows: 'tags' },
];

const IDS = FIELDS.map((f) => f.id);
export const DEFINITION_VERSION = 1;
export const MAX_ID_LENGTH = 40;
/** The file name of a list's definition. */
export const DEFINITION_FILE = '_list.json';

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const has = (v) => (Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim() !== '' : v !== undefined && v !== null);

/** The editor's `slugify` (src/schema.ts), which this file cannot import. @param {string} text */
const slugify = (text) =>
  text
    .toLowerCase()
    .replace(new RegExp(String.fromCharCode(0xe6), 'g'), 'ae')
    .replace(new RegExp(String.fromCharCode(0xf8), 'g'), 'oe')
    .replace(new RegExp(String.fromCharCode(0xe5), 'g'), 'aa')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * The definition in a `_list.json`: `{ version: 1, label, fields, dropped? }`. Returns `{ definition }` (fields in the fixed order,
 * `dropped` always an array) or `{ problems }` (plain sentences, in English).
 * @param {string} text
 * @returns {{ definition: { version: 1; label: string; fields: string[]; dropped: string[] }; problems?: undefined } | { problems: string[]; definition?: undefined }}
 */
export function parseDefinition(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return { problems: ['The list definition is not valid JSON.'] };
  }
  if (!isObject(raw)) return { problems: ['The list definition must be an object.'] };
  const problems = [];
  if (raw.version !== DEFINITION_VERSION)
    problems.push(`The list definition has version ${JSON.stringify(raw.version)}; only version ${DEFINITION_VERSION} is known.`);
  if (typeof raw.label !== 'string' || raw.label.trim() === '') problems.push('The list definition needs a label.');
  const fields = Array.isArray(raw.fields) ? raw.fields : null;
  if (!fields) problems.push('The list definition needs a list of fields.');
  else {
    for (const f of fields) if (!IDS.includes(f)) problems.push(`Unknown field "${String(f)}"; the fields are ${IDS.join(', ')}.`);
    if (new Set(fields).size !== fields.length) problems.push('A field is listed twice.');
    if (!fields.includes('title')) problems.push('The list needs the field "title".');
  }
  const dropped = raw.dropped === undefined ? [] : Array.isArray(raw.dropped) ? raw.dropped : null;
  if (!dropped) problems.push('"dropped" must be a list of fields.');
  else if (fields) {
    for (const d of dropped) {
      if (d === 'title') problems.push('The field "title" cannot be dropped.');
      else if (!fields.includes(d)) problems.push(`"${String(d)}" is dropped but is not one of the fields.`);
    }
  }
  if (problems.length) return { problems };
  return {
    definition: {
      version: DEFINITION_VERSION,
      label: raw.label.trim(),
      fields: IDS.filter((id) => fields.includes(id)),
      dropped: IDS.filter((id) => dropped.includes(id)),
    },
  };
}

/**
 * The id (and folder) of a new list: the slug of its label, at most 40 characters, never one that is taken. Returns `{ id }` or
 * `{ problem }` (a plain message; `suggestion` is a free id when the label's is taken).
 * @param {string} label @param {Iterable<string>} taken ids and folder names already in use
 * @returns {{ id: string; problem?: undefined; suggestion?: undefined } | { problem: string; id?: undefined; suggestion?: string }}
 */
export function idOf(label, taken) {
  const used = new Set([...taken].map((t) => String(t).toLowerCase()));
  const id = slugify(String(label ?? ''))
    .slice(0, MAX_ID_LENGTH)
    .replace(/-$/, '');
  if (!id) return { problem: 'Give the list a name with letters or numbers.' };
  if (id.startsWith('_')) return { problem: 'The name of a list cannot start with an underscore.' };
  if (!used.has(id)) return { id };
  for (let n = 2; ; n++) {
    const suffix = `-${n}`;
    const candidate = id.slice(0, MAX_ID_LENGTH - suffix.length).replace(/-$/, '') + suffix;
    if (!used.has(candidate)) return { problem: 'A list or collection with this name exists. Choose another name.', suggestion: candidate };
  }
}

/** The fields the list shows: its fields minus the dropped ones, as `FIELDS` entries. @param {{ fields: string[]; dropped?: string[] }} definition */
export const fieldsOf = (definition) =>
  FIELDS.filter((f) => definition.fields.includes(f.id) && !(definition.dropped ?? []).includes(f.id));

/** The `asRows` of the list, the same object an app's `app.json` declares: `{ title, text?, icon?, href?, tags? }`; no picture. */
export function asRowsOf(definition) {
  /** @type {Record<string, string>} */
  const asRows = {};
  for (const f of fieldsOf(definition)) if (f.asRows) asRows[f.asRows] = f.id;
  return asRows;
}

/**
 * What is wrong with one entry's data. Keys with no field are allowed only for dropped fields (and `order`); `tags` must be known tags.
 * @param {{ fields: string[]; dropped?: string[] }} definition @param {Record<string, unknown>} data @param {{ tags?: Iterable<string> }} [known] the slugs of `categories`; tags are not checked without it
 * @returns {string[]}
 */
export function entryProblems(definition, data, known = {}) {
  if (!isObject(data)) return ['The entry must be an object.'];
  const problems = [];
  const visible = new Set(fieldsOf(definition).map((f) => f.id));
  const dropped = new Set(definition.dropped ?? []);
  for (const key of Object.keys(data)) {
    if (key === 'order') {
      if (typeof data.order !== 'number' || !Number.isFinite(data.order)) problems.push('"order" must be a number.');
    } else if (!visible.has(key) && !dropped.has(key)) problems.push(`The list has no field "${key}".`);
  }
  for (const f of FIELDS) {
    const v = data[f.id];
    if (v === undefined || !visible.has(f.id)) continue;
    if (f.id === 'tags') {
      if (!Array.isArray(v) || v.some((t) => typeof t !== 'string')) problems.push('"tags" must be a list of tags.');
      else if (known.tags) {
        const all = new Set(known.tags);
        for (const t of v) if (!all.has(t)) problems.push(`The tag "${t}" does not exist.`);
      }
    } else if (typeof v !== 'string') problems.push(`"${f.id}" must be text.`);
  }
  if (visible.has('title') && !has(data.title)) problems.push('The entry needs a title.');
  return problems;
}

/** The entries without the data of a field (the confirmed removal of a field); an entry without it is the same object. @template {Record<string, unknown>} T @param {T[]} entries @param {string} field */
export const dropField = (entries, field) =>
  entries.map((e) => {
    if (!(field in e)) return e;
    const { [field]: _gone, ...rest } = e;
    return /** @type {T} */ (rest);
  });

/** Whether a path in a list's folder is an entry: a `.json` file whose name does not start with `_` (the definition is not). @param {string} path */
export function isEntryPath(path) {
  const name = String(path).split('/').pop() ?? '';
  return name.endsWith('.json') && !name.startsWith('_') && name.length > '.json'.length;
}

/**
 * The entry file's data for a row: keys left out when empty (the title is always kept), `order` set.
 * @param {Record<string, any>} row @param {number} order
 */
export function entryOfRow(row, order) {
  /** @type {Record<string, any>} */
  const entry = { title: typeof row.title === 'string' ? row.title : '' };
  for (const f of FIELDS) if (f.id !== 'title' && has(row[f.id])) entry[f.id] = row[f.id];
  entry.order = order;
  return entry;
}

/** The row an entry draws as: its data without `order`, every field present as typed, no key for an empty one. @param {Record<string, any>} entry */
export function rowOfEntry(entry) {
  /** @type {Record<string, any>} */
  const row = { title: typeof entry.title === 'string' ? entry.title : '' };
  for (const f of FIELDS) if (f.id !== 'title' && has(entry[f.id])) row[f.id] = entry[f.id];
  return row;
}

/** The file name (without `.json`) of a new entry: the slug of its title, `-2`, `-3` … when taken; the slug never changes afterwards. @param {string} title @param {(name: string) => boolean} taken */
export function entrySlug(title, taken) {
  const base = slugify(title) || 'item';
  if (!taken(base)) return base;
  for (let n = 2; ; n++) if (!taken(`${base}-${n}`)) return `${base}-${n}`;
}

/**
 * The entries whose `order` must be written after the row at `i` moves by `by` (-1 up, 1 down): the two entries swap their places. Entries
 * are `{ slug, order? }` in the list's order; a missing `order` counts as its place. Returns `[{ slug, order }, { slug, order }]`, or [] when it cannot move.
 * @param {{ slug: string; order?: number }[]} entries @param {number} i @param {-1 | 1} by
 */
export function moveOrders(entries, i, by) {
  const j = i + by;
  if (i < 0 || j < 0 || i >= entries.length || j >= entries.length) return [];
  const at = (n) => (typeof entries[n].order === 'number' ? entries[n].order : n);
  let a = at(i);
  let b = at(j);
  if (a === b) [a, b] = [i, j];
  return [
    { slug: entries[i].slug, order: b },
    { slug: entries[j].slug, order: a },
  ];
}

/** The `order` for a new entry added last. @param {{ order?: number }[]} entries */
export const nextOrder = (entries) => entries.reduce((m, e, n) => Math.max(m, typeof e.order === 'number' ? e.order : n), -1) + 1;
