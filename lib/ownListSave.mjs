// What saving the page of a list the owner made (src/OwnListPage.tsx) writes: one file per row, in one commit. Pure code over the rows as typed
// (each with a `key`, stable while the page is open), the files the list has now, and which file each row has (`slugs`: key to the file name,
// which never changes once the row has one). A row is written once it has a title (an entry with no title would stop `check:content`), a new
// one under a name made of its title (`-2`, `-3` … when taken). Each written entry has `order` first, as the other lists' files have, the keys
// of the list's visible fields as typed (left out when empty), and every other key it had (the data of a dropped field) as it was. A row that
// is gone from the page is deleted; a file that no row ever stood for (it did not parse) is left alone.
import { entryOfRow, entrySlug, FIELDS } from './ownList.mjs';

/**
 * @param {{ folder: string; rows: Record<string, any>[]; known: Map<string, { oid: string; text: string }>; slugs: Map<number, string>; visible: string[] }} input
 * @returns {{ writes: { path: string; content: string; oid: string | null; key: number }[]; deletes: { path: string; oid: string }[]; slugs: Map<number, string> }}
 */
export function savePlan({ folder, rows, known, slugs, visible }) {
  const next = new Map(slugs);
  const writes = [];
  const taken = (name) => known.has(`${folder}/${name}.json`) || [...next.values()].includes(name);
  rows.forEach((row, i) => {
    if (typeof row.title !== 'string' || !row.title.trim()) return;
    let slug = next.get(row.key);
    if (!slug) {
      slug = entrySlug(row.title, taken);
      next.set(row.key, slug);
    }
    const path = `${folder}/${slug}.json`;
    const before = known.get(path);
    let data = {};
    try {
      data = before ? JSON.parse(before.text) : {};
    } catch {}
    const typed = entryOfRow(row, i + 1);
    const { order, ...rest } = data;
    const merged = { ...rest };
    for (const f of FIELDS) if (visible.includes(f.id) && !(f.id in typed)) delete merged[f.id];
    const { order: _o, ...fields } = typed;
    // A field that is switched off (hidden, its data kept) is not written from the row: the file's own value stays.
    for (const key of Object.keys(fields)) if (key !== 'title' && !visible.includes(key)) delete fields[key];
    const content = `${JSON.stringify({ order: i + 1, ...merged, ...fields }, null, 2)}\n`;
    if (before?.text !== content) writes.push({ path, content, oid: before?.oid ?? null, key: row.key });
  });
  const present = new Set(rows.map((r) => r.key));
  const deletes = [];
  for (const [key, slug] of next) {
    if (present.has(key)) continue;
    const file = known.get(`${folder}/${slug}.json`);
    if (file) deletes.push({ path: `${folder}/${slug}.json`, oid: file.oid });
    next.delete(key);
  }
  return { writes, deletes, slugs: next };
}
