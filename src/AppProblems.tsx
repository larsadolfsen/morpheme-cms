// The problems the last build found in one app, as an error notice at the top of its page: one line for each kind (the same change and message on several pages is one); nothing when
// there are none, or when the list cannot be read. Exposes AppProblems (default). Depends on ./ui (Notice), ./i18n,
// groupProblems (lib/appProblemLines.mjs), the AppProblem type (lib/appProblems.mjs, whose problemsOf needs node modules, so it is not imported here) and the Worker's GET /api/apps/problems (worker/app-problems.js).
import { useEffect, useState } from 'react';
import { Notice } from './ui';
import { t } from './i18n';
import type { AppProblem } from '../lib/appProblems.mjs';
import { groupProblems, type ProblemLine } from '../lib/appProblemLines.mjs';

/** The problems of the last build, all apps' ([] when the Worker does not answer, as when no one is signed in (401)). */
async function lastProblems(): Promise<AppProblem[]> {
  try {
    const res = await fetch('/api/apps/problems', { cache: 'no-store' });
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) return [];
    const list = await res.json();
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** What a line is about, in a few words: the change of the site it is in (a hook), the step after the build, its code or its app.json,
 * and the page it was found on, or how many pages when it was found on several. */
const where = (l: ProblemLine) =>
  [
    l.place === 'hook'
      ? ((t.apps.changes as Record<string, string>)[l.hook ?? ''] ?? t.apps.problemPlaces.hook)
      : t.apps.problemPlaces[l.place],
    l.pages.length > 1 ? t.apps.problemPages(l.pages.length) : l.pages[0],
  ]
    .filter(Boolean)
    .join(' · ');

/** The problems of an app (`id`) from the last build, as one error notice with a line for each; nothing without any. */
export default function AppProblems({ id }: { id: string }) {
  const [found, setFound] = useState<AppProblem[]>([]);
  useEffect(() => {
    let on = true;
    lastProblems().then((all) => on && setFound(all.filter((p) => p.app === id)));
    return () => {
      on = false;
    };
  }, [id]);
  if (!found.length) return null;
  return (
    <section className="mb-8">
      <Notice title={t.apps.problemsTitle}>
        <ul className="space-y-1">
          {groupProblems(found).map((l, i) => (
            <li key={i}>{t.apps.problemLine(where(l), l.message)}</li>
          ))}
        </ul>
      </Notice>
    </section>
  );
}
