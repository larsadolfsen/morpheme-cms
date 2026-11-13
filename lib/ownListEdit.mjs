// Editing and deleting a list the owner made (`Edit list`, src/OwnListEdit.tsx): the definition after a switch or a new name, the text of its file, how
// many entries still hold the data of a field that was switched off, the field removed for good (its key gone from every entry), and where a list is
// used (`Delete list` is refused while a block reads it). Pure code over the files (`{ path, text }`), no browser. See lib/ownList.mjs.
import { dropField, isEntryPath, newFieldId } from './ownList.mjs';

/** The definition with a new field of a kind at the end (its id is the kind, `-2`, `-3` …; it may be the kind's second, third … field). Returns `{ definition, id }`.
 * @param {{ version: 2; label: string; fields: { id: string; kind: string; label?: string }[]; dropped: string[] }} definition @param {string} kind */
export function addField(definition, kind) {
  const id = newFieldId(definition, kind);
  return { id, definition: { ...definition, fields: [...definition.fields, { id, kind }] } };
}

/** The definition with a field's own name (an empty name goes back to the kind's). @template {{ fields: { id: string; kind: string; label?: string }[] }} D @param {D} definition @param {string} id @param {string} label @returns {D} */
export const renameField = (definition, id, label) => ({
  ...definition,
  fields: definition.fields.map((f) => {
    if (f.id !== id) return f;
    const { label: _old, ...rest } = f;
    return label.trim() ? { ...rest, label: label.trim() } : rest;
  }),
});

/** The definition with a field switched off (it goes to `dropped`: hidden, its data kept) or on again (out of `dropped`).
 * @template {{ fields: { id: string }[]; dropped: string[] }} D @param {D} definition @param {string} id @param {boolean} on @returns {D} */
export function toggleField(definition, id, on) {
  if (!definition.fields.some((f) => f.id === id)) return definition;
  const dropped = definition.dropped ?? [];
  if (on) return { ...definition, dropped: dropped.filter((d) => d !== id) };
  if (dropped.includes(id)) return definition;
  return { ...definition, dropped: definition.fields.map((f) => f.id).filter((x) => x === id || dropped.includes(x)) };
}

/** The definition with another name. The id of the list (its folder, what blocks store) never changes. */
export const renamed = (definition, label) => ({ ...definition, label: label.trim() || definition.label });

/** The text of `_list.json`; `dropped` is left out while nothing is waiting to be removed. */
export function definitionText(definition) {
  const { version, label, fields, dropped } = definition;
  return `${JSON.stringify({ version, label, fields, ...(dropped?.length ? { dropped } : {}) }, null, 2)}\n`;
}

/** The entry files of a list folder, parsed: `{ path, data }`; a file that does not parse is left out. @param {{ path: string; text: string }[]} files @param {string} folder */
export function entriesIn(files, folder) {
  return files
    .filter((f) => f.path.startsWith(`${folder}/`) && isEntryPath(f.path))
    .flatMap((f) => {
      try {
        return [{ path: f.path, data: JSON.parse(f.text) }];
      } catch {
        return [];
      }
    });
}

/** How many entries hold data for a field (what "The data in 3 items stays" says). */
export const heldBy = (entries, field) => entries.filter((e) => e.data && field in e.data).length;

/**
 * A field removed for good: it leaves `fields` and `dropped`, and its key leaves every entry that has it. Returns the definition and only the
 * entries that changed (`{ path, data }`), so one commit writes just those.
 * @template {{ fields: { id: string }[]; dropped?: string[] }} D
 * @param {D} definition @param {string} field @param {{ path: string; data: Record<string, unknown> }[]} entries
 */
export function confirmDrop(definition, field, entries) {
  const next = {
    ...definition,
    fields: definition.fields.filter((f) => f.id !== field),
    dropped: (definition.dropped ?? []).filter((d) => d !== field),
  };
  const changed = dropField(
    entries.map((e) => e.data),
    field,
  );
  return {
    definition: /** @type {D} */ (next),
    entries: entries.flatMap((e, i) => (changed[i] === e.data ? [] : [{ path: e.path, data: changed[i] }])),
  };
}

/** Where a list is used: the pages (and posts) with a block that reads it, hidden ones too, and the data files with one (an app's, the header's).
 * @param {{ path: string; text: string }[]} files @param {string} id @param {string} folder the list's own folder, which is not a place it is used */
export function listUses(files, id, folder) {
  const reads = (value) =>
    Array.isArray(value)
      ? value.some(reads)
      : value && typeof value === 'object'
        ? (typeof value.from === 'string' && value.from.trim() === id && 'type' in value) || Object.values(value).some(reads)
        : false;
  return files.flatMap((f) => {
    if (f.path.startsWith(`${folder}/`)) return [];
    if (f.path.endsWith('.md')) {
      for (const [, props] of f.text.matchAll(/data-block="[a-z]+"\s+data-props="([^"]*)"/g)) {
        try {
          const decoded = props
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
          if (JSON.parse(decoded)?.from?.trim?.() === id) return [f.path];
        } catch {}
      }
      return [];
    }
    if (f.path.endsWith('.json')) {
      try {
        return reads(JSON.parse(f.text)) ? [f.path] : [];
      } catch {}
    }
    return [];
  });
}

/** Every file of a list: its entries and its definition (what `Delete list` removes, in one commit). */
export const filesOfList = (files, folder) => files.filter((f) => f.path.startsWith(`${folder}/`));
