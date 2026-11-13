// The lists an owner makes (`New list`, docs/superpowers/plans/2026-11-12-new-list.md): a list is the folder `src/data/<id>/` with one JSON file
// per entry and its definition in `src/data/<id>/_list.json`. Pure code, no browser and no React, so the editor, the build and `check:content`
// use the same functions. Nothing a site gets changes while no `_list.json` exists.

/** The kinds of field, in this order. `asRows` is the key in a `ListRow` (null: the kind has no place in a row today). A list has any number of
 * fields of each kind (a field is `{ id, kind, label? }`); the first visible field of a kind is the one `Rows from` reads. */
export const KINDS = [
  { id: 'icon', type: 'icon', asRows: 'icon' },
  { id: 'title', type: 'text', asRows: 'title' },
  { id: 'text', type: 'textarea', asRows: 'text' },
  { id: 'image', type: 'image', asRows: null },
  { id: 'href', type: 'link', asRows: 'href' },
  { id: 'tags', type: 'tags', asRows: 'tags' },
];

/** The kind ids. */
export const KIND_IDS = KINDS.map((k) => k.id);
const IDS = KIND_IDS;
export const DEFINITION_VERSION = 2;
export const MAX_ID_LENGTH = 40;
/** The file name of a list's definition. */
export const DEFINITION_FILE = '_list.json';

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
/** @typedef {{ id: string; kind: string; label?: string }} Field */
/** @typedef {{ version: 2; label: string; fields: Field[]; dropped: string[] }} Definition */
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

/** A field id: letters, digits and hyphens, the kind and a number (`text`, `text-2`); stable, so rows store their values under it. */
const FIELD_ID = /^[a-z][a-z0-9-]{0,39}$/;

/**
 * The definition in a `_list.json`: version 2 is `{ version: 2, label, fields: [{ id, kind, label? }], dropped? }`; version 1 (the six fixed
 * fields, `fields` a list of kind names) is read as version 2 with each id equal to its kind, so its entries need no change. Returns
 * `{ definition }` (always version 2; `dropped` an array of field ids) or `{ problems }` (plain sentences, in English). A list may have no field.
 * @param {string} text
 * @returns {{ definition: Definition; problems?: undefined } | { problems: string[]; definition?: undefined }}
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
  if (raw.version !== 1 && raw.version !== DEFINITION_VERSION)
    problems.push(`The list definition has version ${JSON.stringify(raw.version)}; only versions 1 and ${DEFINITION_VERSION} are known.`);
  if (typeof raw.label !== 'string' || raw.label.trim() === '') problems.push('The list definition needs a label.');
  const list = Array.isArray(raw.fields) ? raw.fields : null;
  /** @type {Field[]} */
  const fields = [];
  if (!list) problems.push('The list definition needs a list of fields.');
  else if (raw.version === 1) {
    for (const f of list) if (!IDS.includes(f)) problems.push(`Unknown field "${String(f)}"; the fields are ${IDS.join(', ')}.`);
    if (new Set(list).size !== list.length) problems.push('A field is listed twice.');
    for (const id of IDS) if (list.includes(id)) fields.push({ id, kind: id });
  } else {
    for (const f of list) {
      if (!isObject(f) || typeof f.id !== 'string' || !FIELD_ID.test(f.id)) {
        problems.push(`A field needs an id of letters, digits and hyphens: ${JSON.stringify(f)}.`);
        continue;
      }
      if (!IDS.includes(f.kind))
        problems.push(`The field "${f.id}" has an unknown kind "${String(f.kind)}"; the kinds are ${IDS.join(', ')}.`);
      else if (fields.some((x) => x.id === f.id)) problems.push(`The field id "${f.id}" is used twice.`);
      else if (f.id === 'order') problems.push('"order" cannot be the id of a field.');
      else if (f.label !== undefined && typeof f.label !== 'string') problems.push(`The name of the field "${f.id}" must be text.`);
      else fields.push({ id: f.id, kind: f.kind, ...(typeof f.label === 'string' && f.label.trim() ? { label: f.label.trim() } : {}) });
    }
  }
  const dropped = raw.dropped === undefined ? [] : Array.isArray(raw.dropped) ? raw.dropped : null;
  if (!dropped) problems.push('"dropped" must be a list of fields.');
  else if (list) {
    // Version 1 named kinds, which are the ids it is read with.
    for (const d of dropped) if (!fields.some((f) => f.id === d)) problems.push(`"${String(d)}" is dropped but is not one of the fields.`);
  }
  if (problems.length) return { problems };
  return {
    definition: {
      version: DEFINITION_VERSION,
      label: raw.label.trim(),
      fields,
      dropped: fields.map((f) => f.id).filter((id) => dropped.includes(id)),
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

/** The kind's entry of `KINDS`. @param {string} kind */
export const kindOf = (kind) => KINDS.find((k) => k.id === kind);

/** The fields the list shows: its fields minus the dropped ones, each `{ id, kind, label?, type, asRows }`, in the order the owner made them.
 * @param {{ fields: Field[]; dropped?: string[] }} definition */
export const fieldsOf = (definition) =>
  definition.fields.filter((f) => !(definition.dropped ?? []).includes(f.id)).map((f) => ({ ...kindOf(f.kind), ...f }));

/** The `asRows` of the list, the same object an app's `app.json` declares: `{ title?, text?, icon?, href?, tags? }` naming, for each kind, the FIRST
 * visible field of that kind (a row has one of each); the image has no place in a row. Without a title field the first body text is the title; without either, `title` is ''. @param {{ fields: Field[]; dropped?: string[] }} definition
 * @returns {{ title: string; text?: string; icon?: string; href?: string; tags?: string }} */
export function asRowsOf(definition) {
  /** @type {any} */
  const asRows = {};
  const fields = fieldsOf(definition);
  for (const f of fields) if (f.asRows && !(f.asRows in asRows)) asRows[f.asRows] = f.id;
  // A list with no title field names its rows by its first body text (as `labelOfEntry` does); a second body text is then the row's text.
  if (!asRows.title && asRows.text) {
    asRows.title = asRows.text;
    const second = fields.filter((f) => f.kind === 'text')[1];
    if (second) asRows.text = second.id;
    else delete asRows.text;
  }
  // A list with neither a title nor a body text has nothing to name a row by: `''` is no field, so `Rows from` shows no rows of it.
  if (!asRows.title) asRows.title = '';
  return asRows;
}

/** The id for a new field of a kind: the kind, `-2`, `-3` … the first not used by a field or a dropped one (an id is never reused). @param {{ fields: Field[] }} definition @param {string} kind */
export function newFieldId(definition, kind) {
  const used = new Set(definition.fields.map((f) => f.id));
  if (!used.has(kind)) return kind;
  for (let n = 2; ; n++) if (!used.has(`${kind}-${n}`)) return `${kind}-${n}`;
}

/** The name a field shows when the owner gave it none: its kind's name, numbered from the second field of that kind (`names` gives each kind's name).
 * @param {{ fields: Field[] }} definition @param {Field} field @param {Record<string, string>} names */
export function nameOf(definition, field, names) {
  if (field.label) return field.label;
  const same = definition.fields.filter((f) => f.kind === field.kind);
  const at = same.findIndex((f) => f.id === field.id);
  return same.length > 1 && at > 0 ? `${names[field.kind]} ${at + 1}` : (names[field.kind] ?? field.kind);
}

/**
 * What is wrong with one entry's data. Keys with no field are allowed only for dropped fields (and `order`); `tags` must be known tags.
 * @param {{ fields: Field[]; dropped?: string[] }} definition @param {Record<string, unknown>} data @param {{ tags?: Iterable<string> }} [known] the slugs of `categories`; tags are not checked without it
 * @returns {string[]}
 */
export function entryProblems(definition, data, known = {}) {
  if (!isObject(data)) return ['The entry must be an object.'];
  const problems = [];
  const visible = fieldsOf(definition);
  const dropped = new Set(definition.dropped ?? []);
  for (const key of Object.keys(data)) {
    if (key === 'order') {
      if (typeof data.order !== 'number' || !Number.isFinite(data.order)) problems.push('"order" must be a number.');
    } else if (!visible.some((f) => f.id === key) && !dropped.has(key)) problems.push(`The list has no field "${key}".`);
  }
  for (const f of visible) {
    const v = data[f.id];
    if (v === undefined) continue;
    if (f.kind === 'tags') {
      if (!Array.isArray(v) || v.some((t) => typeof t !== 'string')) problems.push(`"${f.id}" must be a list of tags.`);
      else if (known.tags) {
        const all = new Set(known.tags);
        for (const t of v) if (!all.has(t)) problems.push(`The tag "${t}" does not exist.`);
      }
    } else if (typeof v !== 'string') problems.push(`"${f.id}" must be text.`);
  }
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
 * The entry file's data for a row: the values of the given field ids as typed, keys left out when empty, `order` set.
 * @param {Record<string, any>} row @param {number} order @param {string[]} ids the ids of the list's fields
 */
export function entryOfRow(row, order, ids) {
  /** @type {Record<string, any>} */
  const entry = {};
  for (const id of ids) if (has(row[id])) entry[id] = row[id];
  entry.order = order;
  return entry;
}

/** The row an entry draws as: its data without `order`, no key for an empty value. @param {Record<string, any>} entry @param {string[]} ids */
export function rowOfEntry(entry, ids) {
  /** @type {Record<string, any>} */
  const row = {};
  for (const id of ids) if (has(entry[id])) row[id] = entry[id];
  return row;
}

/** What names a row in `Lists` and in pickers: its first title field, else its first body text, else nothing (the caller says "Item <n>").
 * @param {{ fields: Field[]; dropped?: string[] }} definition @param {Record<string, any>} data */
export function labelOfEntry(definition, data) {
  const fields = fieldsOf(definition);
  for (const kind of ['title', 'text'])
    for (const f of fields) if (f.kind === kind && typeof data[f.id] === 'string' && data[f.id].trim()) return String(data[f.id]).trim();
  return '';
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

/**
 * What is wrong with the lists the owner made, for `check:content`: each `<dataFolder>/<id>/_list.json` is parsed (parseDefinition), each entry of
 * that folder is checked (entryProblems; tags against `tags`, the slugs of the tag list), and every block with `from: '<id>'` in `blocks` (the
 * `from` of each block in the pages' text) must name a list that exists (`known`: the ids of every list a block can read, the owner's too). A
 * site with no `_list.json` gives nothing, so nothing changes for it. Returns `{ ids, problems, paths }`: the ids of the owner's lists and the
 * files looked at (`path: sentence` lines).
 * @param {{ path: string; text: string }[]} files
 * @param {{ dataFolder: string; tags?: Iterable<string>; known?: Iterable<string>; blocks?: { path: string; from: string }[] }} options
 */
export function ownListProblems(files, { dataFolder, tags, known = [], blocks = [] }) {
  const problems = [];
  const paths = [];
  const ids = [];
  const prefix = `${dataFolder}/`;
  for (const file of files) {
    if (!file.path.startsWith(prefix)) continue;
    const rest = file.path.slice(prefix.length).split('/');
    if (rest.length !== 2 || rest[1] !== DEFINITION_FILE) continue;
    paths.push(file.path);
    const { definition, problems: found } = parseDefinition(file.text);
    if (!definition) {
      for (const p of found) problems.push(`${file.path}: ${p}`);
      continue;
    }
    ids.push(rest[0]);
    for (const entry of files) {
      if (!entry.path.startsWith(`${prefix}${rest[0]}/`) || !isEntryPath(entry.path)) continue;
      paths.push(entry.path);
      let data;
      try {
        data = JSON.parse(entry.text);
      } catch {
        problems.push(`${entry.path}: The entry is not valid JSON.`);
        continue;
      }
      for (const p of entryProblems(definition, data, { tags })) problems.push(`${entry.path}: ${p}`);
    }
  }
  if (ids.length) {
    const exist = new Set([...known, ...ids]);
    for (const b of blocks)
      if (b.from && !exist.has(b.from)) problems.push(`${b.path}: A block reads the list "${b.from}", which does not exist.`);
  }
  return { ids, problems, paths };
}
