// The order a list's fields and text are written in (docs/superpowers/specs/2026-11-15-list-edit-editor-window-design.md, section 6). `fields` is the one
// source of the field order; each line of text (`notes`) is stored with the field it follows (`after`), and the flow is derived from the two. Pure
// code that knows nothing of lists, ProseMirror or the browser, so a form can use it later.

/** @typedef {import('./ownList.mjs').Note} Note */
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
