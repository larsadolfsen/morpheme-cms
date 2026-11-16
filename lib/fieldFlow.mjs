// The neutral part of a definition of fields: `fields`, `notes` and `format`, and nothing that says "list". A list's `parseDefinition`
// (lib/ownList.mjs) calls `parseFields`; a form's definition can later call it too (spec section 12.4 a). Pure, imports only `fieldFormats.mjs`.

import { isFormat } from './fieldFormats.mjs';

const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
/** A field id: letters, digits and hyphens, the kind and a number (`text`, `text-2`); stable, so values are stored under it. */
export const FIELD_ID = /^[a-z][a-z0-9-]{0,39}$/;
export const NOTE_STYLES = ['heading', 'body', 'label'];
export const MAX_NOTE_LENGTH = 500;

/**
 * Reads the fields and the notes of a definition (the version 2 shape). Every key of a field that it does not know is kept, in the field's own
 * order after `id`, `kind` and `label`, so a round trip never drops one. Returns `{ fields, notes, problems }` (plain sentences, in English).
 * `format` must be a format of the field's kind, else the problem `The field "<id>" has an unknown format` and the field is read as Any text.
 * @param {{ fields?: unknown; notes?: unknown }} raw
 * @param {{ kinds: string[]; reserved?: string[] }} options `kinds` the field kinds the host knows; `reserved` ids no field may have
 * @returns {{ fields: any[]; notes: { style: string; text: string; after: string | null }[]; problems: string[] }}
 */
export function parseFields(raw, { kinds, reserved = [] }) {
  const problems = [];
  const fields = [];
  for (const f of Array.isArray(raw.fields) ? raw.fields : []) {
    if (!isObject(f) || typeof f.id !== 'string' || !FIELD_ID.test(f.id)) {
      problems.push(`A field needs an id of letters, digits and hyphens: ${JSON.stringify(f)}.`);
      continue;
    }
    if (!kinds.includes(f.kind))
      problems.push(`The field "${f.id}" has an unknown kind "${String(f.kind)}"; the kinds are ${kinds.join(', ')}.`);
    else if (fields.some((x) => x.id === f.id)) problems.push(`The field id "${f.id}" is used twice.`);
    else if (reserved.includes(f.id)) problems.push(`"${f.id}" cannot be the id of a field.`);
    else if (f.label !== undefined && typeof f.label !== 'string') problems.push(`The name of the field "${f.id}" must be text.`);
    else {
      const { id, kind, label, format, ...rest } = f;
      const ok = format !== undefined && isFormat(kind, format);
      if (format !== undefined && !ok) problems.push(`The field "${id}" has an unknown format.`);
      const field = {
        id,
        kind,
        ...(typeof label === 'string' && label.trim() ? { label: label.trim() } : {}),
        ...(ok ? { format } : {}),
        ...rest,
      };
      if (field.required !== undefined && typeof field.required !== 'boolean')
        problems.push(`The field "${id}" has a "required" that is not true or false.`);
      fields.push(field);
    }
  }
  const notes = [];
  if (raw.notes !== undefined && !Array.isArray(raw.notes)) problems.push('"notes" must be a list of texts.');
  else
    (raw.notes ?? []).forEach((n, i) => {
      const at = i + 1;
      if (!isObject(n) || !NOTE_STYLES.includes(n.style)) return void problems.push(`The text at ${at} has an unknown style.`);
      const text = typeof n.text === 'string' ? n.text.trim() : null;
      if (text === null || text.length > MAX_NOTE_LENGTH || /[\r\n]/.test(text))
        return void problems.push(`The text at ${at} must be plain text of at most ${MAX_NOTE_LENGTH} characters on one line.`);
      if (text === '') return;
      const known = n.after === null || n.after === undefined || fields.some((f) => f.id === n.after);
      if (!known) problems.push(`The text at ${at} follows a field the list does not have.`);
      notes.push({ style: n.style, text, after: known ? (n.after ?? null) : null });
    });
  return { fields, notes, problems };
}

// The order of the flow: the text and the fields of a definition in the order the window shows them (spec section 6). `fields` is the one source of the
// field order; each line of text (`notes`) is stored with the field it follows (`after`), and the flow is derived from the two.

/** A line of the text: its style, plain text and the id of the field it follows (`null`: before the first field). */
/** @typedef {{ style: 'heading' | 'body' | 'label'; text: string; after: string | null }} Note */
/** @typedef {{ type: 'text'; style: Note['style']; text: string } | { type: 'field'; id: string }} FlowItem */

/** Whether a line has text to draw or save. @param {{ text: string }} note */
const filled = (note) => typeof note.text === 'string' && note.text.trim() !== '';

/**
 * The flow of the window: the text before the first field, then each field with the text that follows it, in `fields` order and, among lines
 * with the same `after`, in `notes` order. A line that follows a field the list does not have is read as `after: null`.
 * @param {{ fields: { id: string }[]; notes?: Note[] }} definition @returns {FlowItem[]}
 */
export function flowOf(definition) {
  const ids = new Set(definition.fields.map((f) => f.id));
  const notes = (definition.notes ?? [])
    .filter(filled)
    .map((n) => ({ ...n, after: n.after !== null && ids.has(n.after) ? n.after : null }));
  /** @param {string | null} after @returns {FlowItem[]} */
  const textAfter = (after) => notes.filter((n) => n.after === after).map((n) => ({ type: 'text', style: n.style, text: n.text.trim() }));
  return [...textAfter(null), ...definition.fields.flatMap((f) => [{ type: 'field', id: f.id }, ...textAfter(f.id)])];
}

/**
 * The definition a flow stands for: `fields` are the field items in document order (each field as the definition has it; an id it has no field for
 * is ignored), and each line's `after` is the nearest field before it, `null` if none. A field the flow does not have is removed (its entries are
 * the caller's business), and `dropped` keeps only fields that are left. Empty lines are not kept.
 * @template {{ fields: { id: string }[]; dropped?: string[]; notes?: Note[] }} D
 * @param {D} definition @param {FlowItem[]} flow @returns {D & { notes: Note[] }}
 */
export function definitionOfFlow(definition, flow) {
  const byId = new Map(definition.fields.map((f) => [f.id, f]));
  /** @type {D['fields']} */
  const fields = [];
  /** @type {Note[]} */
  const notes = [];
  /** @type {string | null} */
  let after = null;
  for (const item of flow) {
    if (item.type === 'field') {
      const field = byId.get(item.id);
      if (!field || fields.includes(field)) continue;
      fields.push(field);
      after = item.id;
    } else if (filled(item)) notes.push({ style: item.style, text: item.text.trim(), after });
  }
  const next = { ...definition, fields, notes };
  if (definition.dropped) next.dropped = definition.dropped.filter((d) => fields.some((f) => f.id === d));
  return next;
}

/** The list's text in the order written, for the list page: every line above the rows, wherever it stands among the fields (Q3).
 * @param {{ notes?: Note[] }} definition @returns {{ style: Note['style']; text: string }[]} */
export const textsOf = (definition) => (definition.notes ?? []).filter(filled).map((n) => ({ style: n.style, text: n.text.trim() }));
