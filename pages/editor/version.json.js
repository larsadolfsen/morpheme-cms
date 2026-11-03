// /editor/version.json: the commit the site was built from, and when (builtAt; the site is online a
// moment after, shown on the editor's start screen). After a save, the editor asks for this
// until it is the saved commit (or a later one), and then says that the site has been updated.
// Cloudflare's builds set WORKERS_CI_COMMIT_SHA; a build elsewhere asks git. `editor` is the
// fingerprint of the editor's code (packages/editor/site/editor-version.mjs): an open editor with another one
// reloads itself.
import { execSync } from 'node:child_process';
import { editorVersion } from '@morphemecms/cms/site/editor-version.mjs';

function head() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

export function GET() {
  return new Response(
    JSON.stringify({ commit: process.env.WORKERS_CI_COMMIT_SHA || head(), editor: editorVersion(), builtAt: new Date().toISOString() }),
  );
}
