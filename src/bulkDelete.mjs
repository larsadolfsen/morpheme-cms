/**
 * What deleting several pages or posts at once commits: one change per file that nothing on the site uses, all in
 * one commit (so a conflict on any file stops the whole delete and nothing is half deleted), and the files left out
 * because something uses them. Exposes `bulkDeletion` and `togglePath`.
 * Used by App.tsx (remove many) and Library.tsx (selecting).
 */

/** `files`: the selected files; `reasonFor(file)`: why one cannot be deleted (a text), or a falsy value. */
export function bulkDeletion(files, reasonFor) {
  const changes = [];
  const kept = [];
  for (const file of files) {
    const reason = reasonFor(file);
    if (reason) kept.push({ file, reason });
    else changes.push({ path: file.path, content: null, oid: file.oid });
  }
  return { changes, kept };
}

/** The selected paths with `path` added, or taken out when it is there. */
export function togglePath(paths, path) {
  return paths.includes(path) ? paths.filter((p) => p !== path) : [...paths, path];
}
