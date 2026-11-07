// The Worker's own saves to the repository on GitHub (no one signed in): the planned pages and posts it publishes
// (packages/editor/worker/publish.js) and what an app saves itself (`github` in the tools an app's part of the Worker is given,
// packages/editor/worker/index.js), each in one commit on the site's branch, which builds the site. With the Worker secret
// GITHUB_PUBLISH_TOKEN: a GitHub token with Contents: Read and write on the repository (docs/editor.md, Opsætning).
// Through the cache of the site's files in R2, like the editor's (packages/editor/worker/files.js): the files are read from it, and
// what is saved goes into it. `ctx`: the request's, so R2 is written after the answer has gone. `token`: another sign-in
// than the Worker's own (someone signed in to the editor who asked for it, packages/editor/worker/index.js), whose name the commit is in.
import { filesOf, toBase64 } from './files.js';

/** The branch's head and the files at it, by their paths (a file that is not there: undefined). */
export async function readFiles(env, paths, ctx, token = env.GITHUB_PUBLISH_TOKEN) {
  const files = filesOf(env, token, ctx);
  try {
    const at = await files.head();
    const entries = await files.entriesAt(at.tree, paths);
    const texts = await files.texts(entries.flatMap((e) => (e?.type === 'blob' ? [e.oid] : [])));
    return { head: at.commit, texts: entries.map((e) => (e?.type === 'blob' ? (texts.get(e.oid) ?? null) : undefined)) };
  } finally {
    await files.finish('Workeren læser');
  }
}

/** Saves the files (`{ path, text }`, or `{ path, bytes }` for a picture) in one commit on the branch, if its head is still `head`; returns the new commit's id. */
export async function commitFiles(env, head, headline, changes, ctx, token = env.GITHUB_PUBLISH_TOKEN) {
  const files = filesOf(env, token, ctx);
  try {
    const at = { commit: head, tree: await files.rootOf(head) };
    return (
      await files.save(
        at,
        headline,
        changes.map((f) => ({ path: f.path, contents: toBase64(f.bytes ?? new TextEncoder().encode(f.text)) })),
      )
    ).commit;
  } finally {
    await files.finish('Workeren gemmer');
  }
}
