// The build's app problems for the editor: the list core wrote to dist/_apps/_problems.json (lib/appProblems.mjs).
// Exposes PROBLEMS_PATH and handleAppProblems(request, env, may). No dependencies; `may` is the sign-in check.
//   GET /api/apps/problems  the problems from the last build ([] without a file), for someone who can save the site

/** Where the build writes the problems: APP_FILES and PROBLEMS_FILE of lib/apps.mjs and lib/appProblems.mjs. Written out
 * here, as those modules use node:fs, which the Worker does not have; app-problems.test.mjs keeps them the same. */
export const PROBLEMS_PATH = '/_apps/_problems.json';

// Not session.js's json: that module imports @site/config, which plain Node cannot load.
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

/** The problems the build wrote, or [] when there is no usable file. */
async function problemsOf(request, env) {
  try {
    const res = await env.ASSETS?.fetch(new Request(new URL(PROBLEMS_PATH, request.url)));
    if (!res?.ok) return [];
    const list = JSON.parse(await res.text());
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** `may(request)` says whether the sender can save the site (mayEdit in session.js). */
export async function handleAppProblems(request, env, may) {
  if (request.method !== 'GET') return json({ error: 'method' }, 405);
  if (!(await may(request))) return json({ error: 'unauthorized' }, 401);
  return json(await problemsOf(request, env));
}
