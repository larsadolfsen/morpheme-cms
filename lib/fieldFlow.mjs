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
