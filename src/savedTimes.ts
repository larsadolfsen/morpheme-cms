// When each file was last saved on the site, kept while the editor is open and shared by the lists (Library.tsx) and the
// start screen's "Continue" widget (widgets/continue.tsx). Exposes `saved` (by path) and `loadSavedTimes`.
// Depends on Env['savedAt'] (GitHub's history) and RepoFile.
import type { RepoFile } from './github';
import type { Env } from './App';

/** When each page was last saved, kept while the editor is open. Asked again for a file that has changed since (another
 * blob id), so a file just saved shows its new time. */
export const saved = new Map<string, { oid: string; date: Date }>();

/** Asks for the time of each of `files` that is not kept (or kept for another blob id) and keeps the answers. Resolves
 * to whether anything was asked; rejects when GitHub could not answer. */
export async function loadSavedTimes(savedAt: Env['savedAt'], files: RepoFile[]): Promise<boolean> {
  const missing = files.filter((f) => saved.get(f.path)?.oid !== f.oid);
  if (!missing.length) return false;
  const times = await savedAt(missing.map((f) => f.path));
  for (const f of missing) if (times[f.path]) saved.set(f.path, { oid: f.oid, date: times[f.path] });
  return true;
}
